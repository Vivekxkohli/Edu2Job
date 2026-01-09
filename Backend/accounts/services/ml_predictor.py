# accounts/services/ml_predictor.py

import os
import joblib
import pandas as pd
import numpy as np
from django.conf import settings
from .job_skill_map import JOB_REQUIRED_SKILLS

BASE_DIR = settings.BASE_DIR
MODEL_DIR = os.path.join(BASE_DIR, "accounts", "ml")

model = joblib.load(os.path.join(MODEL_DIR, "rf_classifier.joblib"))
ohe = joblib.load(os.path.join(MODEL_DIR, "ohe.joblib"))
mlb_skills = joblib.load(os.path.join(MODEL_DIR, "mlb_skills.joblib"))
mlb_certifications = joblib.load(os.path.join(MODEL_DIR, "mlb_certifications.joblib"))
label_encoder = joblib.load(os.path.join(MODEL_DIR, "le.joblib"))
feature_columns = joblib.load(os.path.join(MODEL_DIR, "feature_columns.joblib"))


def predict_jobs(data: dict):

    df = pd.DataFrame([{
        "degree": data["degree"],
        "specialization": data["specialization"],
        "course": data["course"],
        "college": data["college"],
        "year_of_completion": data["year_of_completion"],
        "cgpa": data["cgpa"]
    }])

    cat_features = ohe.transform(df[["degree", "specialization", "course", "college"]])
    cat_df = pd.DataFrame(cat_features, columns=ohe.get_feature_names_out())

    skills_encoded = mlb_skills.transform([data.get("skills", [])])
    skills_df = pd.DataFrame(skills_encoded, columns=mlb_skills.classes_)

    cert_encoded = mlb_certifications.transform([data.get("certifications", [])])
    cert_df = pd.DataFrame(cert_encoded, columns=mlb_certifications.classes_)

    final_df = pd.concat(
        [df[["year_of_completion", "cgpa"]], skills_df, cert_df, cat_df],
        axis=1
    )

    final_df = final_df.reindex(columns=feature_columns, fill_value=0)

    probs = model.predict_proba(final_df)[0]

    results = []
    user_skills = set(s.lower() for s in data.get("skills", []))

    # ✅ LOOP THROUGH *ALL* JOBS
    for idx, prob in enumerate(probs):
        job = label_encoder.inverse_transform([idx])[0]
        base_confidence = float(prob) * 100

        required = JOB_REQUIRED_SKILLS.get(job, [])

        missing = [
            skill for skill in required
            if skill.lower() not in user_skills
        ]

        if required:
            match_ratio = (len(required) - len(missing)) / len(required)
        else:
            match_ratio = 0

        skill_score = match_ratio * 100

        confidence = round(
            (base_confidence * 0.5) + (skill_score * 0.5),
            2
        )

        # ✅ MULTIPLE 100% ALLOWED
        if required and len(missing) == 0:
            confidence = 100.0

        results.append({
            "job_role": job,
            "confidence": confidence,
            "missing_skills": missing
        })

    # ✅ SORT BY FINAL CONFIDENCE
    results.sort(key=lambda x: x["confidence"], reverse=True)

    # ✅ RETURN ONLY TOP 3
    return results[:3]


def find_missing_skills(user_skills, job_role):
    required = JOB_REQUIRED_SKILLS.get(job_role, [])
    user_skills = set(s.lower() for s in user_skills)

    return [
        skill for skill in required
        if skill.lower() not in user_skills
    ]


def retrain_model():
    """
    Dummy retraining function for admin governance.
    """
    print("🔄 Admin triggered model retraining...")
    return True
