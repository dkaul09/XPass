import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import axios from 'axios';

const SoccerPitch = () => {
  const [playerPositions, setPlayerPositions] = useState(() => {
      const initialPositions = [
        // Blue players (left side of the pitch)
        { x: 50, y: 160 }, // Goalkeeper
        { x: 100, y: 60 }, // Left back
        { x: 100, y: 160 }, // Center back 1
        { x: 100, y: 260 }, // Center back 2
        { x: 100, y: 360 }, // Right back
        { x: 200, y: 90 }, // Midfielder 1
        { x: 200, y: 230 }, // Midfielder 2
        { x: 200, y: 330 }, // Midfielder 3
        { x: 250, y: 60 }, // Forward left
        { x: 250, y: 230 }, // Forward center
        { x: 250, y: 360 }, // Forward right

        // Red team (right side of the pitch)
        { x: 500, y: 160 }, // Goalkeeper
        { x: 450, y: 60 }, // Left back
        { x: 450, y: 160 }, // Center back 1
        { x: 450, y: 260 }, // Center back 2
        { x: 450, y: 360 }, // Right back
        { x: 350, y: 90 }, // Midfielder 1
        { x: 350, y: 230 }, // Midfielder 2
        { x: 350, y: 330 }, // Midfielder 3
        { x: 300, y: 60 }, // Forward left
        { x: 300, y: 230 }, // Forward center
        { x: 300, y: 360 }, // Forward right
      ];
      return initialPositions;
    
  });
  const nodeRefs = useRef(new Array(22).fill(null).map(() => React.createRef()));
  const pitchRef = useRef(null);
  const [passHeight, setPassHeight] = useState("Ground Pass");
  const [playPattern, setPlayPattern] = useState("Regular Play");
  const [selectedPasser, setSelectedPasser] = useState(null);
  const [selectedReceiver, setSelectedReceiver] = useState(null);
  const [selectionMode, setSelectionMode] = useState(null); 
  const [predictionResult, setPredictionResult] = useState(null); 
  let  gaussian_opponent_weight = null;
  let  gaussian_team_weight  = null;
  let  x_start = null; 
  let  y_start = null; 
  let  x_end = null 
  let y_end = null;
  let pass_log_ratio = null;
  const [error, setError] = useState(null); 

  const pitchWidthPx = 584; 
  const pitchHeightPx = 384; 
  const realWidth = 120; // Real-world width of the pitch (meters)
  const realHeight = 80; // Real-world height of the pitch (meters)
  let pass_distance = null;
  let pass_angle = null;

  const scaleX = realWidth / pitchWidthPx; // Calculate X scaling factor
  const scaleY = realHeight / pitchHeightPx;

  const [playersInCone, setPlayersInCone] = useState([]);
  

  const passHeightMapping = {
    "Ground Pass": 0,
    "Low Pass": 1,
    "High Pass": 2,
  }
  
  const handlePredictPass = async () => {
    try {
      const savedResponse = JSON.parse(localStorage.getItem("cone_features_response"));

      if (!savedResponse) {
        console.error("No saved cone features found in localStorage.");
        alert("Please calculate the cone features first!");
        return;
      }

      console.log("Saved Response:", savedResponse);

      const encodedPassHeight = passHeightMapping[passHeight];

      if (encodedPassHeight === undefined) {
        console.error("Invalid pass height value:", passHeight);
        alert("Invalid pass height selected!");
        return;
      }

      console.log("Encoded Pass Height:", encodedPassHeight);


      const predictionPayload = {
        pass_length: parseFloat(pass_distance),
        pass_angle:pass_angle,
        gaussian_opponent_weight:gaussian_opponent_weight, 
        gaussian_teammate_weight:gaussian_team_weight,
        log_ratio:pass_log_ratio,
        x_start: x_start,
        y_start: y_start, 
        x_end: x_end,
        y_end: y_end, 
        pass_height: encodedPassHeight
      };

      console.log("Prediction Payload:", predictionPayload);

      
      const response = await axios.post("http://127.0.0.1:8000/predict", predictionPayload);

      
      console.log("Prediction Response:", response.data);
      setPredictionResult(response.data); 
    } catch (error) {
      console.error("Error during prediction:", error);
      alert("An error occurred while predicting the pass!");
    }
  };

  const getRealCoordinates = (px, py) => ({
    x: (px * scaleX).toFixed(1),
    y: (py * scaleY).toFixed(1),
  });

  const calculateDistance = (player1, player2) => {
    const coords1 = getRealCoordinates(player1.x, player1.y);
    const coords2 = getRealCoordinates(player2.x, player2.y);
    pass_distance = Math.sqrt(
      Math.pow(coords2.x - coords1.x, 2) + Math.pow(coords2.y - coords1.y, 2)
    ).toFixed(6); 

    return Math.sqrt(
      Math.pow(coords2.x - coords1.x, 2) + Math.pow(coords2.y - coords1.y, 2)
    ).toFixed(6);
  };

  const freezeFrame = playerPositions.map((pos, index) => ({
    location: getRealCoordinates(pos.x, pos.y),
    teammate: index < 11, 
    actor: index + 1 === selectedPasser, 
  }));

  
 const handleCalculateCone = async() => {
    console.log("Cone calculation triggered!");
    console.log("Selected Passer:", selectedPasser);
    console.log("Selected Receiver:", selectedReceiver);
    
    if (selectedPasser && selectedReceiver) {
      const passerLocation = {
      x: parseFloat(getRealCoordinates(playerPositions[selectedPasser - 1].x, playerPositions[selectedPasser - 1].y).x),
      y: parseFloat(getRealCoordinates(playerPositions[selectedPasser - 1].x, playerPositions[selectedPasser - 1].y).y),
    };

     x_start = passerLocation.x; 
     y_start = passerLocation.y;

    const passTarget = {
      x: parseFloat(getRealCoordinates(playerPositions[selectedReceiver - 1].x, playerPositions[selectedReceiver - 1].y).x),
      y: parseFloat(getRealCoordinates(playerPositions[selectedReceiver - 1].x, playerPositions[selectedReceiver - 1].y).y),
    };

    x_end = passTarget.x;
    y_end = passTarget.y;
     
    const freezeFrame = playerPositions.map((pos, index) => ({
      location: {
        x: parseFloat(getRealCoordinates(pos.x, pos.y).x),
        y: parseFloat(getRealCoordinates(pos.x, pos.y).y),
      },
      teammate: index < 11, 
      actor: index + 1 === selectedPasser, 
    }));


      
      console.log("Calculating");
      try {
        const response = await axios.post('http://127.0.0.1:8000/calculate-cone-features', {
          passerLocation,
          passTarget,
          freezeFrame
        });

        console.log("Response from FastAPI:", response.data);
        localStorage.setItem("cone_features_response", JSON.stringify(response.data));
        console.log("Response saved to local storage.");

        const savedResponse = JSON.parse(localStorage.getItem("cone_features_response"));
        console.log("Retrieved Response for Prediction:", savedResponse);
        

        console.log('Cone Features:', savedResponse.features);
        console.log('Players Inside Cone:', savedResponse.playersInCone);
        console.log('Gaussian Features:', savedResponse.gaussianFeatures);
        console.log('Log Ratio:', savedResponse.logRatio);
        pass_log_ratio = savedResponse.logRatio;

        gaussian_opponent_weight = savedResponse.gaussianFeatures['opponent_weight_sum'];
        gaussian_team_weight = savedResponse.gaussianFeatures['teammate_weight_sum'];
    
        console.log('Cone Features:', response.data.features);
        console.log('Players Inside Cone:', response.data.playersInCone);
      } catch (error) {
        console.error('Error calculating cone:', error);
        if (error.response) {
          console.error("Response data:", error.response.data); 
        }
      }
    }
  };
  
  
    const handleDrag = (id, data) => {
    const newPositions = [...playerPositions];
    const index = players.findIndex(p => p.id === id);
  
    // Convert to real-world coordinates
    const realCoords = getRealCoordinates(data.x, data.y);
    console.log(`Player ${id} real-world coordinates: X=${realCoords.x}, Y=${realCoords.y}`);
    console.log(data.y);
  
    newPositions[index] = { x: data.x, y: data.y }; 
    setPlayerPositions(newPositions);
    localStorage.setItem('playerPositions', JSON.stringify(newPositions));
  };

  const handlePlayerClick = (id) => {
    if (selectionMode === "passer") {
      setSelectedPasser(id);
      const realCoords = getRealCoordinates(
        playerPositions[id - 1]?.x || 0,
        playerPositions[id - 1]?.y || 0
      );
      console.log(`Selected Passer: Player ${id} at X=${realCoords.x}, Y=${realCoords.y}`);
      setSelectionMode(null);
    } else if (selectionMode === "receiver") {
      setSelectedReceiver(id);
      const realCoords = getRealCoordinates(
        playerPositions[id - 1]?.x || 0,
        playerPositions[id - 1]?.y || 0
      );
      console.log(`Selected Receiver: Player ${id} at X=${realCoords.x}, Y=${realCoords.y}`);
      setSelectionMode(null);
    }
  };

  const handlePassHeightChange = (event) => {
    setPassHeight(event.target.value);
  };

  const calculateAngle = (x1, y1, x2, y2) => {
    const angle = Math.atan2(y2 - y1, x2 - x1); 
    pass_angle = angle;


    return angle.toFixed(6); 
  };

  const handlePlayPatternChange = (event) => {
    setPlayPattern(event.target.value);
  };

  const players = [
    ...Array(11).fill(null).map((_, i) => ({
      id: i + 1,
      team: 'blue',
      name: `Blue Player ${i + 1}`
    })),
    ...Array(11).fill(null).map((_, i) => ({
      id: i + 12,
      team: 'red',
      name: `Red Player ${i + 1}`
    }))
  ];

  return (
    <div style={{ padding: '20px'}}>
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="pass-height" style={{ marginRight: '10px' }}>
          Pass Height:
        </label>
        <select
          id="pass-height"
          value={passHeight}
          onChange={handlePassHeightChange}
          style={{ padding: '5px' }}
        >
          <option value="Ground Pass">Ground Pass</option>
          <option value="Low Pass">Low Pass</option>
          <option value="High Pass">High Pass</option>
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="play-pattern" style={{ marginRight: '10px' }}>
          Play Pattern:
        </label>
        <select
          id="play-pattern"
          value={playPattern}
          onChange={handlePlayPatternChange}
          style={{ padding: '5px' }}
        >
          <option value="Regular Play">Regular Play</option>
          <option value="Free Kick">Free Kick</option>
        </select>
      </div>

      <div style={{ marginTop: '20px', color: '#333' }}>
  <p><strong>Selected Passer:</strong> {selectedPasser !== null ? `Player ${selectedPasser}` : 'None'}</p>
  <p><strong>Selected Receiver:</strong> {selectedReceiver !== null ? `Player ${selectedReceiver}` : 'None'}</p>
  
  {selectedPasser && (
    <p>
      <strong>Passer Position:</strong> 
      X: {getRealCoordinates(playerPositions[selectedPasser - 1]?.x, playerPositions[selectedPasser - 1]?.y).x}, 
      Y: {getRealCoordinates(playerPositions[selectedPasser - 1]?.x, playerPositions[selectedPasser - 1]?.y).y}
    </p>
  )}
  
  {selectedReceiver && (
    <p>
      <strong>Receiver Position:</strong> 
      X: {getRealCoordinates(playerPositions[selectedReceiver - 1]?.x, playerPositions[selectedReceiver - 1]?.y).x}, 
      Y: {getRealCoordinates(playerPositions[selectedReceiver - 1]?.x, playerPositions[selectedReceiver - 1]?.y).y}
    </p>
  )}
  
  {selectedPasser && selectedReceiver && (
    <>
      <p>
        <strong>Distance Between Passer and Receiver:</strong>
        {calculateDistance(playerPositions[selectedPasser - 1], playerPositions[selectedReceiver - 1])} meters
      </p>
      <p>
        <strong>Angle Between Players:</strong>
        {calculateAngle(
          getRealCoordinates(playerPositions[selectedPasser - 1]?.x, playerPositions[selectedPasser - 1]?.y).x,
          getRealCoordinates(playerPositions[selectedPasser - 1]?.x, playerPositions[selectedPasser - 1]?.y).y,
          getRealCoordinates(playerPositions[selectedReceiver - 1]?.x, playerPositions[selectedReceiver - 1]?.y).x,
          getRealCoordinates(playerPositions[selectedReceiver - 1]?.x, playerPositions[selectedReceiver - 1]?.y).y
        )} radians
      </p>
    </>
  )}
</div>

<div
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
  }}
>
  <button
    onClick={handleCalculateCone}
    style={{
      padding: '10px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      flex: '1',
      marginRight: '10px',
    }}
  >
    Calculate 45° Cone
  </button>
  <button
    onClick={handlePredictPass}
    style={{
      padding: '10px',
      backgroundColor: '#2196F3',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      flex: '1',
      marginLeft: '10px',
    }}
  >
    Predict Pass
  </button>
</div>

<div
  style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    marginTop: '20px',
  }}
>
  <button
    onClick={() => setSelectionMode('passer')}
    style={{
      padding: '10px',
      backgroundColor: selectionMode === 'passer' ? '#FFD700' : '#4CAF50',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      flex: '1',
    }}
  >
    Select Passer
  </button>
  <button
    onClick={() => setSelectionMode('receiver')}
    style={{
      padding: '10px',
      backgroundColor: selectionMode === 'receiver' ? '#C0C0C0' : '#4CAF50',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      flex: '1',
    }}
  >
    Select Receiver
  </button>
</div>

<div
  style={{
    marginTop: '20px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
    textAlign: 'center',
  }}
>
  <h2>Prediction Results</h2>
  {predictionResult ? (
    <div>
      <p>
        <strong>Prediction:</strong>{' '}
        {predictionResult.prediction === 0
          ? 'Complete'
          : predictionResult.prediction === 1
          ? 'Incomplete'
          : 'Unknown'}
      </p>

      <div>
        <strong>Probabilities:</strong>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {predictionResult.probabilities.map((prob, index) => (
            <li key={index}>
              {index === 0 ? 'Complete' : 'Incomplete'}: {(prob * 100).toFixed(2)}%
            </li>
          ))}
        </ul>
      </div>
    </div>
  ) : error ? (
    <div style={{ color: 'red' }}>
      <strong>Error:</strong> {error}
    </div>
  ) : (
    <p>No prediction yet. Click "Predict Pass" to get results.</p>
  )}
</div>




<div
  style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    padding: '20px',
  }}
>
      <div 
        ref={pitchRef}
        style={{
          width: '600px',
          height: '400px',
          aspectRatio: '120/80',
          background: 'linear-gradient(to bottom, #4CAF50, #3E8E41)',
          position: 'relative',
          overflow: 'visible',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: '1px solid white'
        }}>
          <div style={{
            position: 'absolute',
            left: '50%',
            height: '100%',
            width: '1px',
            background: 'white'
          }} />

          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '15.25%',
            height: '22.875%',
            border: '1px solid white',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)'
          }} />

          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '5px',
            height: '5px',
            background: 'white',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)'
          }} />

         
          <div style={{
            position: 'absolute',
            left: 0,
            top: '22.5%',
            width: '15.15%',
            height: '55%',
            border: '1px solid white',
            borderLeft: 'none'
          }} />

        
          <div style={{
            position: 'absolute',
            right: 0,
            top: '22.5%',
            width: '15.15%',
            height: '55%',
            border: '1px solid white',
            borderRight: 'none'
          }} />

     
          <div style={{
            position: 'absolute',
            left: 0,
            top: '37.5%',
            width: '5%',
            height: '25%',
            border: '1px solid white',
            borderLeft: 'none'
          }} />

         
          <div style={{
            position: 'absolute',
            right: 0,
            top: '37.5%',
            width: '5%',
            height: '25%',
            border: '1px solid white',
            borderRight: 'none'
          }} />

         
          <div style={{
            position: 'absolute',
            left: '10%',
            top: '50%',
            width: '5px',
            height: '5px',
            background: 'white',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)'
          }} />

        
          <div style={{
            position: 'absolute',
            right: '10%',
            top: '50%',
            width: '5px',
            height: '5px',
            background: 'white',
            borderRadius: '50%',
            transform: 'translate(50%, -50%)'
          }} />

          
          <div style={{
            position: 'absolute',
            left: 0,
            top: '45%',
            width: '4px',
            height: '10%',
            background: 'black'
          }} />
          <div style={{
            position: 'absolute',
            right: 0,
            top: '45%',
            width: '4px',
            height: '10%',
            background: 'black'
          }} />
        </div>

        
        {players.map((player, index) => (
          <Draggable
            key={player.id}
            nodeRef={nodeRefs.current[index]}
            bounds="parent"
            position={playerPositions[index]}
            onStop={(e, data) => handleDrag(player.id, data)}
          >
            <div
              ref={nodeRefs.current[index]}
              onClick={() => handlePlayerClick(player.id)}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: player.team,
                position: 'absolute',
                cursor: 'move',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '10px',
                border: selectedPasser === player.id
                ? '2px solid gold'
                : selectedReceiver === player.id
                ? '2px solid silver'
                : 'none' 
      }}
            >
              {player.id}
            </div>
          </Draggable>
        ))}
      </div>
  
    </div>
      </div>
  );
};

export default SoccerPitch;