
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


PROJECT_ROOT = Path(__file__).resolve().parents[1]

BINARY_PATH = (
    PROJECT_ROOT / "models" / "binary" / "xgboost_binary_bundle.joblib"
)
MULTICLASS_PATH = (
    PROJECT_ROOT / "models" / "multiclass" /
    "xgboost_multiclass_bundle.joblib"
)

for path in [BINARY_PATH, MULTICLASS_PATH]:
    if not path.is_file():
        raise FileNotFoundError(f"Model bundle not found: {path}")

binary_bundle = joblib.load(BINARY_PATH)
multiclass_bundle = joblib.load(MULTICLASS_PATH)

binary_model = binary_bundle["model"]
binary_imputer = binary_bundle["imputer"]
binary_features = list(binary_bundle["feature_columns"])
binary_mapping = binary_bundle["label_mapping"]
binary_threshold = float(binary_bundle["decision_threshold"])

multiclass_model = multiclass_bundle["model"]
multiclass_imputer = multiclass_bundle["imputer"]
multiclass_features = list(multiclass_bundle["feature_columns"])
class_names = list(multiclass_bundle["class_names"])

if binary_features != multiclass_features:
    raise RuntimeError("Binary and multiclass feature orders differ.")

FEATURES = multiclass_features
attack_class_id = binary_mapping["ATTACK"]
binary_classes = list(binary_model.classes_)
attack_probability_index = binary_classes.index(attack_class_id)


# ============================================
# SHAP EXPLAINABILITY INITIALIZATION
# ============================================

binary_explainer = shap.TreeExplainer(binary_model)

multiclass_explainer = shap.TreeExplainer(multiclass_model)

print("Binary SHAP explainer initialized.")
print("Multiclass SHAP explainer initialized.")



app = FastAPI(
    title="Hybrid IDS API",
    description="Network-flow intrusion detection using saved XGBoost models.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)



class FlowRecord(BaseModel):
    features: dict[str, float]


class PredictionResponse(BaseModel):
    binary_decision: str
    attack_probability: float
    predicted_label: str
    multiclass_confidence: float | None
    threshold: float




# ============================================
# SHAP FEATURE EXTRACTION HELPER
# ============================================

def get_top_shap_features(
    shap_values,
    feature_values,
    feature_names,
    top_n=10,
):

    values = np.asarray(shap_values).reshape(-1)
    feature_values = np.asarray(feature_values).reshape(-1)

    if len(values) != len(feature_names):
        raise ValueError(
            "SHAP values and feature names do not match."
        )

    indices = np.argsort(
        np.abs(values)
    )[::-1][:top_n]

    results = []

    for index in indices:

        contribution = float(values[index])

        results.append({
            "feature": feature_names[index],
            "feature_value": float(feature_values[index]),
            "shap_value": contribution,

            "direction": (
                "increases_class_score"
                if contribution > 0
                else "decreases_class_score"
                if contribution < 0
                else "neutral"
            ),
        })

    return results


@app.get("/health")
def health():
    return {
        "status": "ok",
        "binary_model_loaded": True,
        "multiclass_model_loaded": True,
        "feature_count": len(FEATURES),
        "class_count": len(class_names),
    }


@app.get("/features")
def get_features():
    return {"feature_count": len(FEATURES), "features": FEATURES}


@app.post("/predict", response_model=PredictionResponse)
def predict(record: FlowRecord):
    missing = [name for name in FEATURES if name not in record.features]
    if missing:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Missing required features.",
                "missing_features": missing,
            },
        )

    try:
        X = pd.DataFrame(
            [[record.features[name] for name in FEATURES]],
            columns=FEATURES,
        )

        X = X.replace([np.inf, -np.inf], np.nan)

        # Binary imputer was fitted with feature names.
        X_binary = binary_imputer.transform(X)
        binary_probs = binary_model.predict_proba(X_binary)
        attack_probability = float(
            binary_probs[0, attack_probability_index]
        )

        if attack_probability < binary_threshold:
            return PredictionResponse(
                binary_decision="BENIGN",
                attack_probability=attack_probability,
                predicted_label="BENIGN",
                multiclass_confidence=None,
                threshold=binary_threshold,
            )

        # Multiclass imputer was fitted without feature names.
        X_multi = multiclass_imputer.transform(X.to_numpy())
        probabilities = multiclass_model.predict_proba(X_multi)[0]
        predicted_id = int(np.argmax(probabilities))

        return PredictionResponse(
            binary_decision="ATTACK",
            attack_probability=attack_probability,
            predicted_label=class_names[predicted_id],
            multiclass_confidence=float(probabilities[predicted_id]),
            threshold=binary_threshold,
        )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Inference failed: {type(exc).__name__}: {exc}",
        )



# ============================================
# SHAP EXPLANATION ENDPOINT
# ============================================

@app.post("/explain")
def explain_prediction(record: FlowRecord):

    # Validate required features.
    missing = [
        name for name in FEATURES
        if name not in record.features
    ]

    if missing:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Missing required features.",
                "missing_features": missing,
            },
        )

    try:

        # ------------------------------------
        # 1. Prepare input
        # ------------------------------------

        X = pd.DataFrame(
            [[record.features[name] for name in FEATURES]],
            columns=FEATURES,
        )

        X = X.replace([np.inf, -np.inf], np.nan)

        # ------------------------------------
        # 2. Binary prediction
        # ------------------------------------

        X_binary_array = binary_imputer.transform(X)

        X_binary = pd.DataFrame(
            X_binary_array,
            columns=FEATURES,
        )

        binary_probs = binary_model.predict_proba(
            X_binary_array
        )

        attack_probability = float(
            binary_probs[0, attack_probability_index]
        )

        binary_decision = (
            "ATTACK"
            if attack_probability >= binary_threshold
            else "BENIGN"
        )

        # ------------------------------------
        # 3. Binary SHAP explanation
        # ------------------------------------

        binary_shap_result = binary_explainer(
            X_binary
        )

        binary_shap_values = np.asarray(
            binary_shap_result.values
        )[0]

        binary_base_value = float(
            np.asarray(
                binary_shap_result.base_values
            ).reshape(-1)[0]
        )

        binary_top_features = get_top_shap_features(
            binary_shap_values,
            X_binary.iloc[0].to_numpy(),
            FEATURES,
            top_n=10,
        )

        # ------------------------------------
        # 4. BENIGN prediction response
        # ------------------------------------

        if binary_decision == "BENIGN":

            return {
                "binary_decision": "BENIGN",
                "attack_probability": attack_probability,
                "predicted_label": "BENIGN",
                "multiclass_confidence": None,
                "threshold": binary_threshold,

                "binary_explanation": {
                    "explained_class": "ATTACK",
                    "base_value": binary_base_value,
                    "top_features": binary_top_features,
                },

                "multiclass_explanation": None,
            }

        # ------------------------------------
        # 5. Multiclass prediction
        # ------------------------------------

        X_multi_array = multiclass_imputer.transform(
            X.to_numpy()
        )

        X_multi = pd.DataFrame(
            X_multi_array,
            columns=FEATURES,
        )

        multiclass_probs = multiclass_model.predict_proba(
            X_multi_array
        )[0]

        predicted_id = int(
            np.argmax(multiclass_probs)
        )

        predicted_label = class_names[predicted_id]

        multiclass_confidence = float(
            multiclass_probs[predicted_id]
        )

        # ------------------------------------
        # 6. Multiclass SHAP explanation
        # ------------------------------------

        multiclass_shap_result = multiclass_explainer(
            X_multi
        )

        multiclass_values = np.asarray(
            multiclass_shap_result.values
        )

        predicted_class_shap = multiclass_values[
            0, :, predicted_id
        ]

        multiclass_base_values = np.asarray(
            multiclass_shap_result.base_values
        )

        predicted_class_base = float(
            multiclass_base_values[0, predicted_id]
        )

        multiclass_top_features = get_top_shap_features(
            predicted_class_shap,
            X_multi.iloc[0].to_numpy(),
            FEATURES,
            top_n=10,
        )

        # ------------------------------------
        # 7. Final response
        # ------------------------------------

        return {
            "binary_decision": "ATTACK",
            "attack_probability": attack_probability,
            "predicted_label": predicted_label,
            "multiclass_confidence": multiclass_confidence,
            "threshold": binary_threshold,

            "binary_explanation": {
                "explained_class": "ATTACK",
                "base_value": binary_base_value,
                "top_features": binary_top_features,
            },

            "multiclass_explanation": {
                "explained_class": predicted_label,
                "class_id": predicted_id,
                "base_value": predicted_class_base,
                "top_features": multiclass_top_features,
            },
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Explanation failed: "
                f"{type(exc).__name__}: {exc}"
            ),
        )


class BatchFlowRecord(BaseModel):
    records: list[FlowRecord] = Field(min_length=1, max_length=500)


class BatchPredictionResponse(BaseModel):
    predictions: list[PredictionResponse]
    count: int


@app.post("/predict/batch", response_model=BatchPredictionResponse)
def predict_batch(batch: BatchFlowRecord):
    # Validate all records before inference.
    for index, record in enumerate(batch.records):
        missing = [
            name for name in FEATURES
            if name not in record.features
        ]
        if missing:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": f"Record {index} is missing required features.",
                    "record_index": index,
                    "missing_features": missing,
                },
            )

    try:
        # Construct one feature matrix for the entire batch.
        X = pd.DataFrame(
            [
                [record.features[name] for name in FEATURES]
                for record in batch.records
            ],
            columns=FEATURES,
        )

        X = X.replace([np.inf, -np.inf], np.nan)

        # Stage 1: binary classification.
        X_binary = binary_imputer.transform(X)
        binary_probs = binary_model.predict_proba(X_binary)
        attack_probabilities = binary_probs[:, attack_probability_index]

        # Stage 2: multiclass classification.
        # Run the multiclass model only on records routed as attacks.
        attack_mask = attack_probabilities >= binary_threshold
        predictions = [None] * len(batch.records)

        for i, probability in enumerate(attack_probabilities):
            if not attack_mask[i]:
                predictions[i] = PredictionResponse(
                    binary_decision="BENIGN",
                    attack_probability=float(probability),
                    predicted_label="BENIGN",
                    multiclass_confidence=None,
                    threshold=binary_threshold,
                )

        attack_indices = np.flatnonzero(attack_mask)

        if len(attack_indices) > 0:
            X_attack = X.iloc[attack_indices].to_numpy()
            X_multi = multiclass_imputer.transform(X_attack)
            multiclass_probs = multiclass_model.predict_proba(X_multi)

            for position, original_index in enumerate(attack_indices):
                predicted_id = int(np.argmax(multiclass_probs[position]))

                predictions[original_index] = PredictionResponse(
                    binary_decision="ATTACK",
                    attack_probability=float(
                        attack_probabilities[original_index]
                    ),
                    predicted_label=class_names[predicted_id],
                    multiclass_confidence=float(
                        multiclass_probs[position, predicted_id]
                    ),
                    threshold=binary_threshold,
                )

        return BatchPredictionResponse(
            predictions=predictions,
            count=len(predictions),
        )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Batch inference failed: {type(exc).__name__}: {exc}",
        )
