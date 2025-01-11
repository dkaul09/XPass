
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd



app = FastAPI()
MODEL_PATH = "/Users/dhruvkaul/Desktop/pass_predictor_application/fast-api-backend/models/gradient_boosting_model.pkl"


try:
    model = joblib.load(MODEL_PATH)
    print("Model loaded successfully!")
except FileNotFoundError:
    print(f"Error: Model not found at {MODEL_PATH}")
    model = None

class PredictionRequest(BaseModel):
    pass_length: float
    pass_angle: float
    gaussian_opponent_weight: float
    gaussian_teammate_weight: float
    log_ratio: float
    x_start: float
    y_start: float
    x_end: float
    y_end: float
    pass_height: int 



app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
async def predict(request: PredictionRequest):
    if model is None:
        return {"error": "Model not loaded. Check the model path."}
    
    # Prepare input features
    input_features = np.array([
    request.pass_length,
    request.pass_angle,
    request.gaussian_opponent_weight,
    request.gaussian_teammate_weight,
    request.log_ratio,
    request.x_start,
    request.y_start,
    request.x_end,
    request.y_end,
    request.pass_height
    ]).reshape(1, -1)



    prediction = model.predict(input_features)
    probabilities = model.predict_proba(input_features)

    return {
        "prediction": int(prediction[0]),
        "probabilities": probabilities[0].tolist() #return probablities 
    }



class Location(BaseModel):
    x: float
    y: float

class Player(BaseModel):
    location: Location
    teammate: bool
    actor: Optional[bool] = False 

class ConeRequest(BaseModel):
    passerLocation: Location
    passTarget: Location
    freezeFrame: List[Player]
    coneWidth: Optional[float] = 45  


def calculate_cone_features(passer_location, pass_target, freeze_frame, cone_width=45):
    """
    Calculate features for the cone-shaped area around the pass.
    Args:
        passer_location (list): [x, y] of the passer.
        pass_target (list): [x, y] of the pass target.
        freeze_frame (list): List of players with their positions and team information.
        cone_width (float): Angle of the cone in degrees.
    Returns:
        dict: Features calculated within the cone.
    """
    cone_width_radians = np.radians(cone_width / 2)  

    pass_vector = np.array(pass_target) - np.array(passer_location)
    pass_length = np.linalg.norm(pass_vector)  
    pass_direction = pass_vector / pass_length 

    # Initialize counters
    opponents_in_cone = 0
    teammates_in_cone = 0
    opponent_distances = [] 
    players_in_cone = []


    for player in freeze_frame:
        player_location = np.array(player["location"])
        is_teammate = player["teammate"]
        is_actor = player.get("actor", False)  

        if is_actor:
            continue

        player_vector = player_location - np.array(passer_location)
        player_distance = np.linalg.norm(player_vector) 

        cosine_angle = np.dot(player_vector, pass_direction) / (player_distance + 1e-8) 
        angle = np.arccos(np.clip(cosine_angle, -1, 1))  

        #Check if the player is inside the cone
        if angle <= cone_width_radians and player_distance <= pass_length:
            if is_teammate:
                teammates_in_cone += 1
                players_in_cone.append({
                    "location": player_location.tolist(),
                    "teammate": is_teammate,
                })
            else:
                opponents_in_cone += 1
                players_in_cone.append({
                    "location": player_location.tolist(),
                    "teammate": False,
                })
                # Calculate perpendicular distance to the pass path
                perpendicular_distance = np.linalg.norm(np.cross(player_vector, pass_direction))
                opponent_distances.append(perpendicular_distance)

   
    features = {
        "opponents_in_cone": opponents_in_cone,
        "teammates_in_cone": teammates_in_cone,
        "average_opponent_distance": np.mean(opponent_distances) if opponent_distances else None,
        "min_opponent_distance": np.min(opponent_distances) if opponent_distances else None,
    }
    return features, players_in_cone

def calculate_gaussian_features(players_in_cone, pass_direction, passer_location, sigma=10):
    """
    Calculate Gaussian-weighted features for players in the cone.

    Args:
        players_in_cone (list): List of players in the cone with their locations and team info.
        pass_direction (np.array): Unit vector of the pass direction.
        passer_location (list): [x, y] coordinates of the passer.
        sigma (float): Standard deviation for the Gaussian function.

    Returns:
        dict: Aggregated features derived from Gaussian weights.
    """
    opponent_weights = []
    teammate_weights = []
    min_opponent_distance = float("inf")

    for player in players_in_cone:
        player_location = np.array(player["location"])
        is_teammate = player["teammate"]

        player_vector = player_location - np.array(passer_location)

       
        perpendicular_distance = np.linalg.norm(
            np.cross(player_vector, pass_direction)
        ) / np.linalg.norm(pass_direction)

     
        weight = np.exp(-(perpendicular_distance**2) / (2 * sigma**2))

        
        if is_teammate:
            teammate_weights.append(weight)
        else:
            opponent_weights.append(weight)
         
            min_opponent_distance = min(min_opponent_distance, perpendicular_distance)

  
    features = {
        "opponent_weight_sum": sum(opponent_weights),
        "opponent_weight_mean": np.mean(opponent_weights) if opponent_weights else 0,
        "teammate_weight_sum": sum(teammate_weights),
        "teammate_weight_mean": np.mean(teammate_weights) if teammate_weights else 0,
        "min_opponent_distance": min_opponent_distance if min_opponent_distance != float("inf") else None,
        "num_opponents_in_cone": len(opponent_weights),
        "num_teammates_in_cone": len(teammate_weights),
    }
    return features



@app.post("/calculate-cone-features")
async def calculate_cone(data: ConeRequest):

    passer_location = [data.passerLocation.x, data.passerLocation.y]
    pass_target = [data.passTarget.x, data.passTarget.y]
    freeze_frame = [
        {
            "location": [player.location.x, player.location.y],
            "teammate": player.teammate,
            "actor": player.actor,
        }
        for player in data.freezeFrame
    ]

    features, players_in_cone = calculate_cone_features(
        passer_location, pass_target, freeze_frame
    )



    pass_vector = np.array(pass_target) - np.array(passer_location)
    pass_direction = pass_vector / np.linalg.norm(pass_vector) 


    gaussian_features = calculate_gaussian_features(
        players_in_cone, pass_direction, passer_location
    )

    log_ratio = np.log((gaussian_features["opponent_weight_sum"]+ 1e-8) / (gaussian_features["teammate_weight_sum"]+ 1e-8))

  
    return {
        "features": features,
        "playersInCone": players_in_cone,
        "gaussianFeatures": gaussian_features,
        "logRatio": log_ratio
    }