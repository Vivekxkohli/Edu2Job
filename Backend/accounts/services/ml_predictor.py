import os
import joblib
import pandas as pd
import numpy as np
from django.conf import settings
from .job_skill_map import JOB_REQUIRED_SKILLS

BASE_DIR = settings.BASE_DIR
MODEL_DIR = os.path.join(BASE_DIR, "accounts", "ml")

# DYNAMIC MODEL LOADER
def load_model():
    """
    Always load latest .joblib files from disk.
    This ensures retrained model is used immediately.
    """
    return {
        "model": joblib.load(os.path.join(MODEL_DIR, "rf_classifier.joblib")),
        "ohe": joblib.load(os.path.join(MODEL_DIR, "ohe.joblib")),
        "mlb_skills": joblib.load(os.path.join(MODEL_DIR, "mlb_skills.joblib")),
        "mlb_certifications": joblib.load(os.path.join(MODEL_DIR, "mlb_certifications.joblib")),
        "label_encoder": joblib.load(os.path.join(MODEL_DIR, "le.joblib")),
        "feature_columns": joblib.load(os.path.join(MODEL_DIR, "feature_columns.joblib")),
    }


#  PREDICTION FUNCTION 
def predict_jobs(data: dict):

    # LOAD LATEST MODEL (DYNAMIC RELOAD)
    models = load_model()

    model = models["model"]
    ohe = models["ohe"]
    mlb_skills = models["mlb_skills"]
    mlb_certifications = models["mlb_certifications"]
    label_encoder = models["label_encoder"]
    feature_columns = models["feature_columns"]

    # ---------------- INPUT DATAFRAME ----------------
    df = pd.DataFrame([{
        "degree": data["degree"],
        "specialization": data["specialization"],
        "course": data["course"],
        "college": data["college"],
        "year_of_completion": data["year_of_completion"],
        "cgpa": data["cgpa"]
    }])

    # ---------------- ENCODING ----------------
    cat_features = ohe.transform(
        df[["degree", "specialization", "course", "college"]]
    )
    cat_df = pd.DataFrame(
        cat_features.toarray(),
        columns=ohe.get_feature_names_out()
    )

    skills_encoded = mlb_skills.transform([data.get("skills", [])])
    skills_df = pd.DataFrame(
        skills_encoded,
        columns=mlb_skills.classes_
    )

    cert_encoded = mlb_certifications.transform(
        [data.get("certifications", [])]
    )
    cert_df = pd.DataFrame(
        cert_encoded,
        columns=mlb_certifications.classes_
    )

    # ---------------- FINAL FEATURE VECTOR ----------------
    final_df = pd.concat(
        [df[["year_of_completion", "cgpa"]], skills_df, cert_df, cat_df],
        axis=1
    )

    final_df = final_df.reindex(
        columns=feature_columns,
        fill_value=0
    )

    # ---------------- ML PROBABILITIES ----------------
    probs = model.predict_proba(final_df)[0]

    results = []
    user_skills = set(s.lower() for s in data.get("skills", []))

    # ---------------- CONFIDENCE CALCULATION (FIXED) ----------------
    for idx, prob in enumerate(probs):
        job = label_encoder.inverse_transform([idx])[0]

        base_confidence = float(prob) * 100
        required = JOB_REQUIRED_SKILLS.get(job, [])

        missing = [
            skill for skill in required
            if skill.lower() not in user_skills
        ]

        # 🔥 SKILL-DRIVEN CONFIDENCE (CORRECT LOGIC)
        if not required:
            confidence = round(base_confidence, 2)
        else:
            skill_match_ratio = (
                (len(required) - len(missing)) / len(required)
            )

            confidence = (
                skill_match_ratio * 80       # skills dominate
                + (base_confidence * 0.2)    # ML fine-tunes
            )

            confidence = round(min(confidence, 100), 2)

        # FULL MATCH → 100%
        if required and not missing:
            confidence = 100.0

        results.append({
            "job_role": job,
            "confidence": confidence,
            "missing_skills": missing
        })

    # ---------------- SORT & TOP 3 ----------------
    results.sort(key=lambda x: x["confidence"], reverse=True)
    return results[:3]


#  ADMIN RETRAIN FUNCTION
def retrain_model_from_csv(csv_file):
    """
    Retrain ML model using CSV uploaded by admin.
    Safely regenerates all .joblib files.
    """

    import pandas as pd
    import os
    import joblib
    from django.conf import settings
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.preprocessing import OneHotEncoder, MultiLabelBinarizer, LabelEncoder

    # ---------------- LOAD CSV ----------------
    df = pd.read_csv(csv_file)

    required_cols = [
        "degree",
        "specialization",
        "course",
        "college",
        "year_of_completion",
        "cgpa",
        "skills",
        "certifications",
        "job_role",
    ]

    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing column: {col}")

    # ---------------- CLEAN DATA ----------------
    df["skills"] = df["skills"].fillna("").apply(
        lambda x: [s.strip() for s in x.split(",") if s.strip()]
    )

    df["certifications"] = df["certifications"].fillna("").apply(
        lambda x: [c.strip() for c in x.split(",") if c.strip()]
    )

    df["year_of_completion"] = df["year_of_completion"].astype(int)
    df["cgpa"] = df["cgpa"].astype(float)

    # ---------------- ENCODERS ----------------
    ohe = OneHotEncoder(handle_unknown="ignore")
    mlb_skills = MultiLabelBinarizer()
    mlb_certifications = MultiLabelBinarizer()
    label_encoder = LabelEncoder()

    # ---------------- TRANSFORM FEATURES ----------------
    cat_features = ohe.fit_transform(
        df[["degree", "specialization", "course", "college"]]
    )

    skills_features = mlb_skills.fit_transform(df["skills"])
    cert_features = mlb_certifications.fit_transform(df["certifications"])

    # ---------------- BUILD DATAFRAMES (STRING COLUMNS) ----------------
    num_df = df[["year_of_completion", "cgpa"]].reset_index(drop=True)

    skills_df = pd.DataFrame(
        skills_features,
        columns=[f"skill_{s}" for s in mlb_skills.classes_]
    )

    cert_df = pd.DataFrame(
        cert_features,
        columns=[f"cert_{c}" for c in mlb_certifications.classes_]
    )

    cat_df = pd.DataFrame(
        cat_features.toarray(),
        columns=ohe.get_feature_names_out()
    )

    # ---------------- FINAL TRAIN MATRIX ----------------
    X = pd.concat(
        [num_df, skills_df, cert_df, cat_df],
        axis=1
    )

    # ✅ CRITICAL FIX
    X.columns = X.columns.astype(str)

    y = label_encoder.fit_transform(df["job_role"])

    feature_columns = X.columns.tolist()

    # ---------------- TRAIN MODEL ----------------
    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        class_weight="balanced",
    )

    model.fit(X, y)

    # ---------------- SAVE ARTIFACTS ----------------
    MODEL_DIR = os.path.join(settings.BASE_DIR, "accounts", "ml")
    os.makedirs(MODEL_DIR, exist_ok=True)

    joblib.dump(model, os.path.join(MODEL_DIR, "rf_classifier.joblib"))
    joblib.dump(ohe, os.path.join(MODEL_DIR, "ohe.joblib"))
    joblib.dump(mlb_skills, os.path.join(MODEL_DIR, "mlb_skills.joblib"))
    joblib.dump(mlb_certifications, os.path.join(MODEL_DIR, "mlb_certifications.joblib"))
    joblib.dump(label_encoder, os.path.join(MODEL_DIR, "le.joblib"))
    joblib.dump(feature_columns, os.path.join(MODEL_DIR, "feature_columns.joblib"))

    return True
