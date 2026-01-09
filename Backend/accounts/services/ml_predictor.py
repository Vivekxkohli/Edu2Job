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

JOB_REQUIRED_SKILLS = {
    "Frontend Developer": ["HTML", "CSS", "JavaScript", "React"],
    "Machine Learning Engineer": ["Python", "Machine Learning", "Statistics", "Pandas"],
    "Project Manager": ["Communication", "Agile", "Scrum", "Leadership"],
    "Backend Developer": ["Python", "Django", "SQL"],
}

def predict_jobs(data: dict):
    """
    data = {
        degree, specialization, course, college,
        year_of_completion, cgpa,
        skills: [], certifications: []
    }
    """

    # ----- Prepare base dataframe -----
    df = pd.DataFrame([{
        "degree": data["degree"],
        "specialization": data["specialization"],
        "course": data["course"],
        "college": data["college"],
        "year_of_completion": data["year_of_completion"],
        "cgpa": data["cgpa"]
    }])

    # ----- Encode categorical -----
    cat_features = ohe.transform(df[["degree", "specialization", "course", "college"]])
    cat_df = pd.DataFrame(cat_features, columns=ohe.get_feature_names_out())

    # ----- Encode skills -----
    skills_encoded = mlb_skills.transform([data.get("skills", [])])
    skills_df = pd.DataFrame(skills_encoded, columns=mlb_skills.classes_)

    # ----- Encode certifications -----
    cert_encoded = mlb_certifications.transform([data.get("certifications", [])])
    cert_df = pd.DataFrame(cert_encoded, columns=mlb_certifications.classes_)

    # ----- Combine -----
    final_df = pd.concat(
        [df[["year_of_completion", "cgpa"]], skills_df, cert_df, cat_df],
        axis=1
    )

    # ----- Align columns -----
    final_df = final_df.reindex(columns=feature_columns, fill_value=0)

    # ----- Predict -----
    probs = model.predict_proba(final_df)[0]
    top_idx = np.argsort(probs)[-3:][::-1]

    results = []

    for idx in top_idx:
        job = label_encoder.inverse_transform([idx])[0]
        confidence = round(float(probs[idx]) * 100, 2)

        required = JOB_REQUIRED_SKILLS.get(job, [])
        missing = list(set(required) - set(data["skills"]))

        results.append({
            "job_role": job,
            "confidence": confidence,
            "missing_skills": missing
        })

    return results

def find_missing_skills(user_skills, job_role):
    required = set(JOB_REQUIRED_SKILLS.get(job_role, []))
    user = set(skill.lower() for skill in user_skills)

    missing = [
        skill for skill in required
        if skill.lower() not in user
    ]
    return missing


def retrain_model():
    """
    Dummy retraining function for admin governance.
    In real systems this would retrain the ML model.
    """

    print("🔄 Admin triggered model retraining...")

    # If you already have training logic, call it here
    # Example:
    # train_and_save_model()

    return True
