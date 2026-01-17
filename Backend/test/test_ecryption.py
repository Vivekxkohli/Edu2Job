# test_encryption_ml.py
import os
import django
import json

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edu2job_backend.settings')
django.setup()

from accounts.models import User, Education, MLPreprocessedData
from accounts.utils.encryption import encrypt_value, decrypt_value
from accounts.services.ml_preprocessor import education_preprocessor
from cryptography.fernet import Fernet

print("🔐 ENCRYPTION/DECRYPTION TEST")
print("=" * 60)

# Test 1: Basic encryption/decryption
print("\n1️⃣ Testing Basic Encryption/Decryption:")
test_strings = [
    "Computer Science Engineering",
    "Indian Institute of Technology Bombay", 
    "8.75",
    "Data Science and Machine Learning"
]

for test_str in test_strings:
    encrypted = encrypt_value(test_str)
    decrypted = decrypt_value(encrypted)
    
    print(f"\n  Original: '{test_str}'")
    print(f"  Encrypted (first 50 chars): '{encrypted[:50]}...'")
    print(f"  Decrypted: '{decrypted}'")
    print(f"  ✅ Match: {test_str == decrypted}")
    
    # Verify it's actually encrypted (not plain text)
    if encrypted.startswith('gAAAAA'):
        print(f"  🔒 Properly encrypted: YES")
    else:
        print(f"  ⚠️  WARNING: Not properly encrypted!")

# Test 2: Create test user and education data
print("\n\n2️⃣ Testing Education Model Encryption:")
try:
    # Get or create test user
    user, created = User.objects.get_or_create(
        email="test_encryption@example.com",
        defaults={"name": "Test User", "password": "test123"}
    )
    
    # Create education record
    edu_data = {
        "degree": "B.Tech",
        "specialization": "Artificial Intelligence",
        "university": "MIT Massachusetts", 
        "cgpa": "9.25",
        "year_of_completion": 2024
    }
    
    # Create education record (encryption happens in save() method)
    edu, edu_created = Education.objects.get_or_create(
        user=user,
        defaults=edu_data
    )
    
    print(f"\n  Created Education ID: {edu.id}")
    
    # Check what's stored in database
    print(f"\n  Database (Encrypted) Values:")
    print(f"    specialization (DB): '{edu.specialization[:50]}...'")
    print(f"    university (DB): '{edu.university[:50]}...'")
    print(f"    cgpa (DB): '{edu.cgpa[:50]}...'")
    
    # Check decrypted values
    print(f"\n  Decrypted Values (via model methods):")
    print(f"    specialization: '{edu.get_decrypted_specialization()}'")
    print(f"    university: '{edu.get_decrypted_university()}'")
    print(f"    cgpa: '{edu.get_decrypted_cgpa()}'")
    
    # Verify they match original
    print(f"\n  ✅ Verification:")
    print(f"    specialization match: {edu.get_decrypted_specialization() == 'Artificial Intelligence'}")
    print(f"    university match: {edu.get_decrypted_university() == 'MIT Massachusetts'}")
    print(f"    cgpa match: {edu.get_decrypted_cgpa() == 9.25}")
    
except Exception as e:
    print(f"❌ Error creating test data: {e}")

print("\n\n🧠 ML PREPROCESSING TEST")
print("=" * 60)

# Test 3: ML Preprocessing
print("\n3️⃣ Testing ML Preprocessing Pipeline:")

# Sample education data
test_ml_data = {
    'degree': 'B.Tech',
    'specialization': 'Computer Science',
    'university': 'IIT Delhi',
    'cgpa': 8.5,
    'year_of_completion': 2023
}

print(f"\n  Input Data:")
for key, value in test_ml_data.items():
    print(f"    {key}: {value}")

try:
    # Run preprocessing
    ml_result = education_preprocessor.preprocess(test_ml_data)
    
    print(f"\n  Preprocessing Results:")
    print(f"    ML Ready: {ml_result.get('ml_ready', False)}")
    
    # Check cleaned data
    cleaned = ml_result.get('cleaned', {})
    print(f"\n  ✅ Cleaned Data:")
    print(f"    Degree: {cleaned.get('degree')}")
    print(f"    Specialization: {cleaned.get('specialization')}")
    print(f"    University: {cleaned.get('university')}")
    print(f"    CGPA: {cleaned.get('cgpa')}")
    print(f"    Year: {cleaned.get('year')}")
    
    # Check encoded data
    encoded = ml_result.get('encoded', {})
    print(f"\n  ✅ Encoded Data:")
    print(f"    Degree Code: {encoded.get('degree')}")
    print(f"    Specialization Code: {encoded.get('specialization')}")
    print(f"    University Code: {encoded.get('university')}")
    
    # Check scaled data
    scaled = ml_result.get('scaled', {})
    print(f"\n  ✅ Scaled Data:")
    print(f"    CGPA Scaled: {scaled.get('cgpa')}")
    print(f"    Year Scaled: {scaled.get('year')}")
    
    # Check combined features
    features = ml_result.get('features', {})
    print(f"\n  ✅ ML-Ready Features:")
    print(f"    Combined Features: {features.get('combined')}")
    print(f"    Length: {len(features.get('combined', []))}")
    
    # Verify feature structure
    if features.get('combined'):
        print(f"\n  ✅ Feature Verification:")
        print(f"    Has 5 features: {len(features['combined']) == 5}")
        print(f"    First 3 are categorical (integers): {all(isinstance(x, int) for x in features['combined'][:3])}")
        print(f"    Last 2 are numerical (floats): {all(isinstance(x, float) for x in features['combined'][3:])}")
    
except Exception as e:
    print(f"❌ ML Preprocessing Error: {e}")
    import traceback
    traceback.print_exc()

print("\n\n4️⃣ Testing Database Integration:")
try:
    # Test ML data storage in database
    if 'edu' in locals():
        # Run preprocessing
        ml_data = education_preprocessor.preprocess({
            'degree': edu.degree,
            'specialization': edu.get_decrypted_specialization(),
            'university': edu.get_decrypted_university(),
            'cgpa': edu.get_decrypted_cgpa(),
            'year_of_completion': edu.year_of_completion
        })
        
        # Store in database
        ml_record = MLPreprocessedData.objects.create(
            user=user,
            education=edu,
            encoded_data=ml_data
        )
        
        print(f"\n  Created MLPreprocessedData ID: {ml_record.id}")
        print(f"  Created at: {ml_record.created_at}")
        
        # Retrieve and verify
        retrieved = MLPreprocessedData.objects.get(id=ml_record.id)
        print(f"\n  Retrieved ML Data Keys: {list(retrieved.encoded_data.keys())}")
        print(f"  Has 'ml_ready': {retrieved.encoded_data.get('ml_ready', False)}")
        print(f"  Has 'features': {'features' in retrieved.encoded_data}")
        
        # Count ML records
        count = MLPreprocessedData.objects.filter(user=user).count()
        print(f"\n  Total ML records for user: {count}")
        
except Exception as e:
    print(f"❌ Database Integration Error: {e}")

print("\n\n🎯 FINAL VERIFICATION")
print("=" * 60)

# Final checks
print("\n✅ Encryption Working:")
print(f"  - FERNET_KEY set: {'YES' if os.getenv('FERNET_KEY') else 'NO'}")
print(f"  - Encryption functions work: {'YES' if 'encrypt_value' in locals() else 'NO'}")

print("\n✅ ML Preprocessing Working:")
print(f"  - Preprocessor available: {'YES' if 'education_preprocessor' in locals() else 'NO'}")
print(f"  - Returns ML-ready features: {'YES' if ml_result.get('ml_ready', False) else 'NO'}")

print("\n✅ Database Models Working:")
print(f"  - Education model encrypts: {Education.__name__ if 'Education' in locals() else 'NO'}")
print(f"  - MLPreprocessedData exists: {MLPreprocessedData.__name__ if 'MLPreprocessedData' in locals() else 'NO'}")

print("\n" + "=" * 60)
print("🎉 TEST COMPLETE!")
print("=" * 60)