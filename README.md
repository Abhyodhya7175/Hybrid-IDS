Hybrid Intelligent Intrusion Detection System (H-IDS)
A machine-learning-based network intrusion detection system that
analyzes network-flow features, identifies benign and malicious traffic,
and classifies detected attacks. The project combines a two-stage
XGBoost classification pipeline, SHAP-based explainability, a FastAPI
backend, and a React + Vite dashboard.
Key Features
- Two-stage intrusion detection
  - Stage 1: Binary classification routes each network flow as
    BENIGN or ATTACK.
  - Stage 2: Multiclass classification runs only when Stage 1
    identifies an attack.
- Attack classification: the trained multiclass model supports 15
  traffic labels, including DDoS, DoS variants, PortScan, FTP/SSH
  Patator, web attacks, Bot, Infiltration, and Heartbleed.
- Explainable AI: SHAP feature contributions show which input
  features increase or decrease the model score.
- Interactive dashboard: React interface for manual feature entry,
  CSV batch prediction, prediction review, and flow-level
  explanations.
- REST API: FastAPI endpoints for health checks, feature metadata,
  single predictions, batch predictions, and explanations.
Important: SHAP values describe how features contribute to the
model output. They do not establish causation. The second-stage
classifier is skipped for flows classified as BENIGN.

Technology Stack
  Layer              Technologies
  Machine learning   Python, XGBoost, scikit-learn
Explainability     SHAP
Backend API        FastAPI, Uvicorn
Frontend           React.js, Vite, Tailwind CSS
Data handling      NumPy, pandas, joblib
Project Structure
The following is the expected repository layout. Keep the trained model
bundle files at the paths expected by the backend.
H-IDS/
├── backend/
│   ├── main.py
│   └── requirements.txt
├── models/
│   ├── binary/
│   │   └── xgboost_binary_bundle.joblib
│   └── multiclass/
│       └── xgboost_multiclass_bundle.joblib
├── hids-dashboard/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
├── data/                   # Optional: keep datasets out of Git if large
├── notebooks/              # Training, evaluation, and experimentation
├── outputs/                # Optional: plots and evaluation outputs
└── README.md
If your checked-out version uses api/main.py instead of
backend/main.py, use api.main:app in the Uvicorn command shown
below. The Python import path must match the actual location of the file
containing app = FastAPI(...).
Prerequisites
Install the following before running the project:
- Python 3.10 or a compatible Python version supported by the
  installed ML packages
- Node.js and npm (use an active LTS release)
- Git
- The two trained model bundle files listed in the project structure
The trained models are required to run inference. This README does not
require model retraining.
1. Clone the Repository
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd H-IDS
Replace <YOUR_GITHUB_REPOSITORY_URL> with your repository URL.
2. Set Up and Run the FastAPI Backend
Windows (PowerShell)
From the repository root:
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
If PowerShell blocks virtual-environment activation, open Command Prompt
and run:
.venv\Scripts\activate.bat
Linux / macOS
From the repository root:
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
If the backend file is api/main.py, replace backend.main:app with
api.main:app.
Backend dependency file
If backend/requirements.txt is not already present, create it with the
dependencies used by the backend:
fastapi
uvicorn[standard]
joblib
numpy
pandas
scikit-learn
xgboost
shap
For reproducible deployments, pin the package versions that were tested
in your environment rather than relying indefinitely on unpinned
versions.
Verify the backend
With the backend running, open:
- API health check: http://127.0.0.1:8000/health
- Interactive API documentation: http://127.0.0.1:8000/docs
The API exposes these routes:

  Method   Endpoint           Purpose
  GET      /health          Check backend and model service status
GET      /features        Retrieve the expected model feature information
POST     /predict         Predict one network flow
POST     /predict/batch   Predict a batch of network flows
POST     /explain         Generate SHAP explanations for a network flow
3. Set Up and Run the React Dashboard
Open a second terminal at the repository root:
cd hids-dashboard
npm install
Create a .env file inside hids-dashboard/:
VITE_API_BASE_URL=http://127.0.0.1:8000
Do not add /health or another endpoint to this value. It should
contain only the backend base URL.

Start the Vite development server:
npm run dev
Open the local URL printed by Vite, usually:

http://localhost:5173

If you change .env, stop and restart the Vite server so the new value
is loaded.
4. Using the Dashboard
1. Start the FastAPI backend and confirm that /health responds
   successfully.
2. Start the React dashboard.
3. Use the manual-entry form to enter the required network-flow feature
   values, or upload a CSV containing the model's expected feature
   columns.
4. Submit the flow or CSV for prediction.
5. Review the binary decision, attack probability, predicted attack
   label, and multiclass confidence when applicable.
6. Open a prediction's details to request its SHAP explanation.
CSV input format
The model expects 78 input features with the exact feature names and
ordering used during training. For batch prediction, each row must
contain the complete feature set.

For evaluation, a CSV may also include a ground-truth label column such
as Label or label. The dashboard prediction request should use only
the model feature columns; keep the ground-truth label separately for
offline evaluation. Do not include metadata columns such as source file
names or row numbers as model features.

Use the /features endpoint or the feature list supplied with the
trained model to confirm the exact feature names. Do not rename,
reorder, or invent feature columns.
5. API Request Examples
Single prediction
POST /predict
{
  "features": {
    "Destination Port": 80
  }
}
This is only a shortened illustration of the request structure. A valid
request must contain all 78 required features, each with a numeric
value.
Batch prediction
POST /predict/batch
{
  "records": [
    {
      "features": {
        "Destination Port": 80
      }
    }
  ]
}
This is also a shortened illustration. Each record must contain the
complete set of 78 required numeric features.
SHAP explanation
POST /explain
{
  "features": {
    "Destination Port": 80
  }
}
The explanation request also requires all 78 model features. See
http://127.0.0.1:8000/docs for the live request schema generated by
the running backend.
6. Running the Backend in Google Colab (Optional)
The backend can also be run in Google Colab when the project and model
files are stored in Google Drive.
1. Mount Google Drive.
2. Change to the project root.
3. Install the backend dependencies.
4. Start Uvicorn.
5. If the dashboard is running outside Colab, expose the backend using
   a temporary tunnel and set the resulting HTTPS base URL in the
   frontend .env.
Example setup (adjust the project path and module path to match your
repository):
from google.colab import drive
drive.mount("/content/drive")

%cd /content/drive/MyDrive/H-IDS
!pip install -r backend/requirements.txt
Start the API in a Colab cell:
!uvicorn backend.main:app --host 0.0.0.0 --port 8000
If the backend module is api/main.py, use api.main:app instead.

For a temporary Cloudflare Quick Tunnel, run cloudflared in another
cell or terminal:
cloudflared tunnel --url http://127.0.0.1:8000
Copy the generated HTTPS tunnel address into VITE_API_BASE_URL in the
frontend .env, then restart Vite. A Quick Tunnel URL is temporary and
can change when the tunnel restarts. Keep the Colab runtime, API
process, and tunnel active while testing. Do not use an unauthenticated
temporary tunnel for sensitive or production traffic.
7. Model and Dataset Notes
- The inference service uses the existing binary and multiclass
  XGBoost model bundles. Running the application does not require
  retraining.
- The model input consists of 78 network-flow features.
- The dataset and notebooks may be useful for training and evaluation,
  but they are not necessarily required to run the dashboard if the
  trained model bundles are available.
- Confirm that you have permission to redistribute any dataset or
  model artifacts before committing them to a public repository.
- Large datasets and model bundles can make a Git repository difficult
  to clone. Consider Git LFS or a documented external download
  location. If model files are not included, document how an
  authorized user can obtain them and where to place them.
8. Troubleshooting
  Issue                               What to check
  Backend does not start              Confirm the Python environment,
installed requirements, module
path, and model bundle paths

  Model file not found                Check that both .joblib bundles
exist at the paths expected by the
backend

  Frontend cannot reach API           Confirm the backend is running and
VITE_API_BASE_URL is correct

  CORS error                          Check the FastAPI CORS
configuration and allow the
frontend origin used during
development

  CSV validation error                Confirm that all 78 feature columns
are present and correctly named

  SHAP explanation unavailable        Confirm that /explain is running,
all 78 feature values are passed,
and the selected prediction retains
its original feature vector

  Changes to .env do not apply      Restart the Vite development server
Colab dashboard connection fails    Confirm that the runtime, FastAPI
process, and tunnel are still
active and that the current tunnel
URL is configured
9. Security and Deployment Notes
- The development server and temporary tunnel are intended for
  testing, not production deployment.
- Do not commit .env files, API keys, credentials, private datasets,
  or other sensitive information.
- Keep model artifacts and datasets only where redistribution is
  permitted.
- For production, configure authentication, HTTPS, access controls,
  logging, dependency version pinning, and an appropriately secured
  API deployment.
10. Current Scope and Limitations
- The implemented inference pipeline uses the binary and multiclass
  XGBoost models.
- SHAP provides model-level feature contribution explanations, not
  causal explanations.
- Multiclass classification is performed only for records routed to
  the attack branch by the binary classifier.
- Performance on rare attack categories should be interpreted in light
  of the number and representativeness of available test examples.
- Results depend on the quality of the input features and their
  consistency with the training-time preprocessing and feature
  definitions.
