# Expected Pass Value (xPass) Predictor

<p align="center">
  <img src="https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmxoYmR5ZTRydmZocGVtejZranh0MTY1eTV1NnNiNTN6Zm5uaGd2dSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/y9UJ6h2MUzZLmENask/giphy.gif" alt="Player Passing the Ball" />
</p>


## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [What is xPass?](#what-is-xpass)
3. [Motivation for this Project](#motivation-for-this-project)
4. [Possible Use Cases of this Project](#possible-use-cases-of-this-project)
5. [Current Focus](#current-focus)
6. [Progress so far](#progress-so-far)
7. [Next Steps and Current Focus/Updates Diary](#next-steps-and-current-focusupdates-diary)
8. [Files](#files)
9. [How to Run the Project](#how-to-run-the-project)
10. [Go back to How to Use the Application](#how-to-use-the-application)
11. [Logic behind Cone and Gaussian Functions](#logic-behind-cone-and-gaussian-functions)
12. [Credit and Inspiration](#credit-and-inspiration)

---

## Project Overview

This project aims to leverage computer vision (CV) and data analytics to predict the expected value of a pass (xPass) in football (soccer). 

The ultimate goal is to build a real-time system that processes game footage, identifies player and ball positions, and calculates the probability of a pass being successfully completed based on spatial and contextual factors.

---

## What is xPass?

**xPass** is a statistical metric that quantifies the probability of a pass being successfully completed, given the spatial and contextual conditions at the time of the pass. Key factors include:

- **📏 Distance and angle** of the pass.
- **🏃‍♂️ Positioning** of the passer and receiver.
- **⚔️ Defensive pressure** on the passer and receiver.

xPass provides an objective way to measure how difficult or impressive a pass was, moving beyond subjective judgments or relying on metrics like pass accuracy, which fail to account for the complexity of passing situations. For example, a short pass under minimal pressure will have a high xPass value, while a long pass through a crowded defense would have a much lower xPass value. This allows us to recognize players for attempting and completing challenging, high-value passes.

---

## Motivation for this Project

Passing is arguably the most important aspect in football as it can make or break a team's performance. A team's build-up play, which often leads to goals, is driven by the quality of its passing.

However, the quality and difficulty of a pass are often evaluated subjectively by fans and commentators. When watching a football match like Liverpool v Man City, we may frequently hear statements like *"That was a great pass by De Bruyne"* or *"Alexander-Arnold is an incredible passer."*  While these comments celebrate a player's skill, many live brodcasts of matches often lack a concrete, quantitative measure to back them up. **How low does the probability of a pass being completed need to be for it to be considered "exceptional" or "great"?**

This lack of an objective metric shown in brodcasting inspired me to start working on the xPass Predictor, a tool designed to quantify passing quality in live matches by visualizing xPass and highlighting the completion probability of impressive passes.

Just like Expected Goals (xG) is frequently displayed after a goal is scored (such as in La Liga broadcasts), **my aspiration is for this project to also play a role in introducing xPass into broadcasting, highlighting the art and difficulty of passing.**

---

## Possible Use Cases of this Project

Besides its **primary objective** of being used in **real-time broadcasting** of matches, this project offers several other potential use cases:

- **🔍 Team Performance Analysis**  
  This tool can help coaches and analysts analyze individual player's decision-making skills and a team's mentality when it comes to passing. By aggregating and analyzing xPass values, coaches can determine whether a player or team tends to favor safer, simpler passes or riskier, high-reward passing opportunities. For instance, it can identify teams that consistently attempt daring passes to break defensive lines.

- **🎯 Player Scouting**  
  For scouts, this tool provides a quantitative measure of passing ability, helping to identify players with exceptional vision and execution under challenging conditions. This can pinpoint talent that might otherwise go unnoticed through traditional evaluation methods.

- **⚽ Fan Engagement**  
  Fans can deepen their understanding of the game and appreciate the skill and decision-making behind each pass, increasing fan interaction and engagement.

---

## Current Focus

The current stage of the project focuses on creating a proof-of-concept xPass predictor using tracking and event data, particularly from StatsBomb. The model predicts whether a pass will be completed or incomplete (as also done by the Statsbomb event data) while returning a xPass value. To keep the initial implementation simple, the current model does not account for the velocity of players or the ball.

Before proceeding to develop a computer vision model, I plan to create an interactive web application that showcases the predictor's functionality. This web app will allow users to explore xPass predictions in a user-friendly and engaging interface. The app will feature an interactive football pitch visualization with 22 adjustable player tokens, where users can adjust parameters such as player positions, pass angles, and defensive pressure to see how these factors influence the generated xPass value. 

By focusing on an interactive proof-of-concept, I want to ensure that the underlying xPass model is accurate and meaningful before integrating more complex computer vision techniques.

---

## Progress so far

### 1. **Data Extraction and Processing**

- Extracted and merged pass events and freeze-frame data from StatsBomb Event Data and 360 Data.
- Filtered and cleaned data to retain relevant passes (only completed and incomplete passes), such as those during regular play or free kicks, with complete positional and contextual details.
- Excluded headers for simplicity and focused on passes executed with the feet.
- The final dataset includes **137,331 passes**, with **119,082 completed passes** and **18,249 incomplete passes**. This imbalance is due to the nature of football, where most recorded passes are completed.

### 2. **Feature Engineering**

Currently, the model includes the following features:

- **pass_length**: The length of the pass.
- **pass_angle**: The angle of the pass between the passer and the location of the end of the pass.
- **gaussian_opponent_weight**: A metric quantifying opponent pressure around the passer and receiver, calculated using the **Gaussian Distribution** and a **45-degree cone** (details in `master.ipynb`). More reasoning info can be found in the [Logic behind Cone and Gaussian Functions section](#logic-behind-cone-and-gaussian-functions)
- **gaussian_teammate_weight**: A measure of teammate support around the passer.
- **log_ratio**: A logarithmic feature representing the ratio of Gaussian-weighted opponent pressure to Gaussian-weighted teammate support, quantifying the relative challenge or support around the passer.
- **x_start, y_start**: Starting coordinates of the pass.
- **x_end, y_end**: Ending coordinates of the pass.
- **pass_height**: The type of pass played:
  - **Ground Pass**: Passes played along the ground.
  - **Low Pass**: Passes played above the ground but below shoulder height.
  - **High Pass**: Passes played above shoulder height.

### 3. **Models Tested and Results**

I have experimented with **Random Forest** and **Gradient Boosting** algorithms for predicting xPass probabilities. The reasons for this choice include:

- **Handling Non-Linear Relationships**: Both models are well-suited for capturing complex, non-linear patterns.
- **Dealing with Imbalanced Data**: Both models have mechanisms to handle class imbalance (e.g., Random Forest with class weighting, Gradient Boosting with iterative learning).


#### Addressing Class Imbalance

To address the class imbalance, I tested the following strategies:
- **Undersampling**: Reducing the majority class (completed passes) to balance the dataset.
- **Class Weights**: Penalizing misclassification of the minority class (incomplete passes) without reducing the dataset size.

I deliberately chose not to use **SMOTE (Synthetic Minority Oversampling Technique)** because I was uncertain about the quality of synthetic data generated for this specific use case. Instead, I prioritized the integrity and reliability of the original data.

#### Four Model Variations:
- **Random Forest (Undersampling)**: Balances the dataset by undersampling the majority class.
- **Random Forest (Class Weights)**: Uses class weights to prioritize recall for the minority class.
- **Gradient Boosting (Undersampling)**: Combines Gradient Boosting with undersampling.
- **Gradient Boosting (Class Weights)**: Uses class weights to improve recall for the minority class.
  

#### Visual Representation of Results
As the precision and recall for Class 0 were more or less similar across all models, we will focus on their performance for Class 1. Below are graphs summarizing the model performance:

- **AUC-ROC Curve for Gradient Boosting (Class Weights)**: ![auc-roc_comparison](https://github.com/user-attachments/assets/f64eeee8-1209-4575-896f-bf0110800566)

- **Comparison of Precision for Class 1 Across Models**: ![precision_(class_1)_comparison](https://github.com/user-attachments/assets/499532bf-6079-4b35-9137-0f9910456ffa)

- **Comparison of Recall for Class 1 Across Models**:![recall_(class_1)_comparison](https://github.com/user-attachments/assets/466729e8-7e98-4d67-b4a1-72c4ec43d26b)

- **F1-Score Across Models**: ![f1-score_comparison](https://github.com/user-attachments/assets/3b0671a1-d729-4724-9fa4-c31d06e1818e)

---

#### **Gradient Boosting (Class Weights) Performance:**
Gradient Boosting (Class Weights) slightly emerged as the best-performing model, achieving:
- **Accuracy**: 84.64%
- **AUC-ROC**: 92.07%
- **F1-Score of Class 1 (Incomplete Passes)**: 59.36%
- **Recall**: 84.41%
- **Precision**: 45.78%

---

#### **Current Challenges and Limitations**

As the results above indicate, an improvement is still needed in identifying incomplete passes, as precision is very poor when it comes to predicting incomplete passes. This limitation arises from the class imbalance in the current dataset, where most passes are completed, and the model tends to favor predicting completions.

As a result, incomplete or low-probability passes are more difficult to predict and quantify, and the model tends to overestimate the likelihood of these passes being completed. This overestimation makes it harder to accurately differentiate between easier, completed passes and riskier, incomplete passes. This issue would need to be addressed if this project is to be used for broadcasting purposes, as it could significantly impact the reliability of the predictions and potentially misinform viewers.

I will outline the potential solutions I will be researching in the next steps section [here](#next-steps-and-current-focusupdates-diary).


## 4. **Web Application**

I have developed a web application using **React.js** for the front end and **FastAPI** for the back end. The application integrates the trained **Gradient Boosting + Class Weights** model to predict pass outcomes.

The web app allows users to input various parameters, including:
- **Pass height** (e.g., Ground Pass, Low Pass, High Pass)
- **Intended passer** and **receiver**
- **Type of play** (e.g., Regular play or Free Kick)
- **Player positions** on the interactive pitch

The app automatically calculates **pass direction** and **pass length** based on the locations of the passer and receiver. All features are then passed into the model to predict the pass outcome.

I will be adding the code for both the **backend** and **frontend** soon, along with a demo of the application.

---

## **Next Steps and Current Focus/Updates Diary**

**10/1:**

- I will be focusing on how to tackle/address the data imbalance, in order to improve the performance of predicting incomplete passes, especially by improving precision. I will look at more research papers and see what can be done.

- I was thinking of trying to predict the intended pass location for passes that have been incomplete. This can help the model improve predictions by understanding the common features/situations in which a pass is incomplete or has a very low probability of being completed. This can be done with the use of physical models and including the velocities of the ball and players. I will explore how to get the velocity of the players and ball through extracting info from the Statsbomb event and 360 data.

---

## **Files**

**master.ipynb:** This file merges and preprocesses StatsBomb 360 Freeze Frame and event data. The preprocessing steps filter the data to retain only passes completed by foot during regular play or free kicks. Then, cone and Gaussian features are calculated for each pass and used to train the models to predict pass outcomes and xPass (xP) values.

---

## **How to Run the Project**

Make sure to clone this repositry before following the instructions below.

### Backend Setup 

1. **Set up Conda (if not already installed):**

2. **Create and Activate a Virtual Environment:**
   - Run the following commands:
     ```bash
     conda create -n xpass-env python=3.9 -y
     conda activate xpass-env
     ```

3. **Navigate to the Backend Directory:**
   - Change into the backend folder:
     ```bash
     cd fast-api-backend
     ```

4. **Install Dependencies:**
   - Install all required Python packages:
     ```bash
     pip install -r requirements.txt
     ```

5. **Run the Backend Server:**
   - Start the FastAPI backend server:
     ```bash
     uvicorn main:app --reload
     ```
   - The backend will now be accessible at `http://127.0.0.1:8000`.

---
### Frontend Setup 

1. **Navigate to the Frontend Directory:**
   - Create a new terminal and change into the frontend folder:
     ```bash
     cd soccer-pitch-app
     ```

2. **Install Node.js Dependencies:**
   - Make sure `Node.js` and `yarn` are installed on your system. If not, [install Node.js](https://nodejs.org/) and run:
     ```bash
     npm install --global yarn
     ```

   - Then, install dependencies:
     ```bash
     yarn install
     ```

3. **Run the Frontend Development Server:**
   - Start the frontend React application:
     ```bash
     yarn start
     ```
   - The application will be available at `http://localhost:3000`.

---
### Running the Application

1. **Ensure the Backend is Running:**
   - FastAPI backend should be running at `http://127.0.0.1:8000`.

2. **Start the Frontend:**
   - Navigate to the browser and visit `http://localhost:3000`.

3. **See a Screenshot of the Application:**
   - Below is a preview of how the application should look when it’s running.
     <img width="1440" alt="image" src="https://github.com/user-attachments/assets/b6886aa9-30ac-4607-b708-b945b02f0caa" />


---

## How to Use the Application

Follow the steps below to use the application:

1. **Adjust Player Positions:**  
   Move the players on the pitch to set up the scenario as you like.

2. **Select the Pass Height:**  
   Choose the height of the pass (e.g., Ground Pass, Low Pass, or High Pass) using the dropdown menu.

3. **Select the Play Pattern:**  
   Pick the type of play (e.g., Regular Play or Free Kick) from the dropdown menu.

4. **Select a Passer:**  
   Click the "Select Passer" button and choose one of the blue counters to act as the passer.

5. **Select a Receiver:**  
   Click the "Select Receiver" button and choose another blue counter as the receiver.

6. **Calculate the 45° Cone:**  
   Click the "Calculate 45° Cone" button to calculate the cone of influence for the pass.

7. **Predict the Pass:**  
   Click the "Predict Pass" button to see the results.


## **Logic behind Cone and Gaussian Functions**

#### Explanation of Key Functions

In order to predict the outcome of passes in football, particularly for complex situations where defenders and teammates influence the pass trajectory, two key features are essential: the cone around the pass and the Gaussian weights associated with players in that cone. The functions are available in the master.ipynb file. Below are the explanations for the two functions that help in calculating these features:

1. **calculate_cone_features()**

**Purpose:**  
This function calculates the number of teammates and opponents within a defined cone around the pass, as well as their distances from the pass line. This is crucial for understanding how the presence of other players influences the likelihood of a pass being completed.

**How it works:**

- The function first calculates the direction and length of the pass from the passer to the intended target.
- It then loops through each player in the freeze frame (the snapshot of the match at the time of the pass) and calculates the player's proximity to the pass path.
- If the player is within the cone of influence (which is a defined angle), their position is considered in the calculation.
- Teammates and opponents within the cone are counted separately, and their distances from the pass line are stored to be used in further calculations.

By identifying which players are inside the cone, we can better understand how challenging a pass might be, depending on the positions of opposing players.

2. **calculate_gaussian_features()**

**Purpose:**  
This function uses Gaussian weights to quantify the influence of players inside the cone, based on their proximity to the pass line. Players closer to the pass line are given higher weights, indicating higher pressure on the pass, while players further away are given lower weights.

**How it works:**

- The function calculates the perpendicular distance of each player from the pass path. This distance is crucial for determining how much influence the player has on the pass.
- The Gaussian function is then used to calculate a weight for each player based on their proximity to the pass line. Players closer to the line receive higher weights.
- Teammates and opponents are treated separately, and the function tracks both the sum and mean of the weights for each group. Additionally, the minimum opponent distance is recorded to highlight the closest opponent to the pass.

By applying this technique, we can simulate how opponent pressure influences a pass, especially in tight situations where the pass is at risk of being intercepted or blocked.

---

### Credit and Inspiration

The methodology for calculating Gaussian weights and defining a cone-shaped area of influence around a pass is inspired by the work presented in the article **[Upgrading Expected Pass: xPass Models](https://statsbomb.com/articles/soccer/xpass-360-upgrading-expected-pass-xpass-models/)**. 
This article discusses a similar approach, using Gaussian weights to capture opponent pressure around a pass and understanding how players’ positions within the cone influence the pass outcome.
