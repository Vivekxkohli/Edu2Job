# accounts/services/ml_preprocessor.py
import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer
import os
import json


class EducationPreprocessor:
    def __init__(self):
        self.degree_encoder = LabelEncoder()
        self.specialization_encoder = LabelEncoder()
        self.university_encoder = LabelEncoder()
        self.cgpa_scaler = StandardScaler()
        self.year_scaler = StandardScaler()
        
        # Predefined categories for encoding
        self.degree_categories = [
            'B.Tech', 'M.Tech', 'BCA', 'B.Sc', 'MCA', 'MBA', 
            'B.E', 'M.E', 'B.Com', 'M.Com', 'Ph.D'
        ]
        
        # Common specializations
        self.common_specializations = [
            'Computer Science', 'Information Technology', 'Mechanical Engineering',
            'Electrical Engineering', 'Civil Engineering', 'Electronics',
            'Data Science', 'Artificial Intelligence', 'Business Administration',
            'Finance', 'Marketing', 'Human Resources'
        ]

    def preprocess(self, education_data):
        """
        Preprocess education data for ML models
        Returns: Dictionary with cleaned, encoded, and scaled data
        """
        try:
            # 1. Clean and normalize data
            cleaned_data = self._clean_data(education_data)
            
            # 2. Handle missing values
            processed_data = self._handle_missing_values(cleaned_data)
            
            # 3. Encode categorical features
            encoded_data = self._encode_features(processed_data)
            
            # 4. Scale numerical features
            scaled_data = self._scale_features(encoded_data)
            
            # 5. Prepare final output
            ml_ready = self._prepare_ml_output(scaled_data, education_data)
            
            return ml_ready
            
        except Exception as e:
            print(f"Preprocessing error: {e}")
            # Return basic processed data if preprocessing fails
            return self._get_fallback_output(education_data)

    def _clean_data(self, data):
        """Clean and normalize input data"""
        cleaned = {}
        
        # Degree: capitalize and standardize
        degree = data.get('degree', '').strip().title()
        if not degree:
            degree = 'Unknown'
        cleaned['degree'] = degree
        
        # Specialization: clean and standardize
        specialization = data.get('specialization', '').strip().title()
        cleaned['specialization'] = specialization
        
        # University: clean
        university = data.get('university', '').strip()
        cleaned['university'] = university
        
        # CGPA: ensure proper format
        cgpa = data.get('cgpa')
        if cgpa is not None:
            try:
                cgpa = float(cgpa)
                if cgpa > 10:  # If percentage, convert to 10 scale
                    cgpa = cgpa / 10
                cleaned['cgpa'] = round(cgpa, 2)
            except:
                cleaned['cgpa'] = None
        else:
            cleaned['cgpa'] = None
            
        # Year: ensure integer
        year = data.get('year_of_completion')
        if year is not None:
            try:
                cleaned['year'] = int(year)
            except:
                cleaned['year'] = None
        else:
            cleaned['year'] = None
            
        return cleaned

    def _handle_missing_values(self, data):
        """Handle missing/null values"""
        processed = data.copy()
        
        # Impute missing CGPA with median
        if processed['cgpa'] is None:
            processed['cgpa'] = 7.5  # Default median
        
        # Impute missing year with current year - 4
        if processed['year'] is None:
            from datetime import datetime
            processed['year'] = datetime.now().year - 4
            
        return processed

    def _encode_features(self, data):
        """Encode categorical features"""
        encoded = data.copy()
        
        # Encode degree
        try:
            # Fit encoder with predefined categories first
            self.degree_encoder.fit(self.degree_categories)
            if data['degree'] in self.degree_encoder.classes_:
                encoded['degree_encoded'] = int(self.degree_encoder.transform([data['degree']])[0])
            else:
                encoded['degree_encoded'] = -1  # Unknown category
        except:
            encoded['degree_encoded'] = -1
            
        # Encode specialization
        try:
            self.specialization_encoder.fit(self.common_specializations)
            if data['specialization'] in self.specialization_encoder.classes_:
                encoded['specialization_encoded'] = int(self.specialization_encoder.transform([data['specialization']])[0])
            else:
                encoded['specialization_encoded'] = -1
        except:
            encoded['specialization_encoded'] = -1
            
        # Encode university (simplified - just first letter ASCII)
        if data['university']:
            encoded['university_encoded'] = ord(data['university'][0].upper()) - 65
        else:
            encoded['university_encoded'] = -1
            
        return encoded

    def _scale_features(self, data):
        """Scale numerical features"""
        scaled = data.copy()
        
        # Scale CGPA
        cgpa_array = np.array([[data['cgpa']]])
        scaled['cgpa_scaled'] = float(self.cgpa_scaler.fit_transform(cgpa_array)[0][0])
        
        # Scale year (normalize to 0-1)
        if data['year']:
            # Convert year to years since 2000
            years_since_2000 = data['year'] - 2000
            scaled['year_scaled'] = years_since_2000 / 50.0  # Assume 50 year range
        else:
            scaled['year_scaled'] = 0.5
            
        return scaled

    def _prepare_ml_output(self, scaled_data, original_data):
        """Prepare final ML-ready output"""
        return {
            "original": original_data,
            "cleaned": {
                "degree": scaled_data['degree'],
                "specialization": scaled_data['specialization'],
                "university": scaled_data['university'],
                "cgpa": scaled_data['cgpa'],
                "year": scaled_data['year']
            },
            "encoded": {
                "degree": scaled_data.get('degree_encoded', -1),
                "specialization": scaled_data.get('specialization_encoded', -1),
                "university": scaled_data.get('university_encoded', -1)
            },
            "scaled": {
                "cgpa": scaled_data.get('cgpa_scaled', 0),
                "year": scaled_data.get('year_scaled', 0.5)
            },
            "ml_ready": True,
            "features": {
                "categorical": [
                    scaled_data.get('degree_encoded', -1),
                    scaled_data.get('specialization_encoded', -1),
                    scaled_data.get('university_encoded', -1)
                ],
                "numerical": [
                    scaled_data.get('cgpa_scaled', 0),
                    scaled_data.get('year_scaled', 0.5)
                ],
                "combined": [
                    scaled_data.get('degree_encoded', -1),
                    scaled_data.get('specialization_encoded', -1),
                    scaled_data.get('university_encoded', -1),
                    scaled_data.get('cgpa_scaled', 0),
                    scaled_data.get('year_scaled', 0.5)
                ]
            }
        }

    def _get_fallback_output(self, data):
        """Fallback output if preprocessing fails"""
        return {
            "original": data,
            "cleaned": data,
            "encoded": {"degree": -1, "specialization": -1, "university": -1},
            "scaled": {"cgpa": 0, "year": 0.5},
            "ml_ready": False,
            "features": {
                "categorical": [-1, -1, -1],
                "numerical": [0, 0.5],
                "combined": [-1, -1, -1, 0, 0.5]
            }
        }


# Create instance for import
education_preprocessor = EducationPreprocessor()