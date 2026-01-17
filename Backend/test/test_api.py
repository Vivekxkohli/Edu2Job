# test_api_endpoints.py
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://127.0.0.1:8000/api"
print("🌐 API ENDPOINT TESTING")
print("=" * 60)

# Test data
test_user = {
    "name": "API Test User",
    "email": "api_test@example.com",
    "password": "TestPassword123"
}

education_data = {
    "degree": "M.Tech",
    "specialization": "Data Science",
    "university": "Stanford University",
    "cgpa": 9.1,
    "year_of_completion": 2025
}

# Helper function
def print_response(response, title):
    print(f"\n{title}:")
    print(f"  Status: {response.status_code}")
    try:
        data = response.json()
        print(f"  Response: {json.dumps(data, indent=2)[:200]}...")
        return data
    except:
        print(f"  Response: {response.text[:200]}...")
    return None

print("\n1️⃣ Testing Registration:")
try:
    response = requests.post(f"{BASE_URL}/auth/register/", json=test_user)
    reg_data = print_response(response, "Registration")
except Exception as e:
    print(f"❌ Registration failed: {e}")

print("\n2️⃣ Testing Login:")
try:
    response = requests.post(f"{BASE_URL}/auth/login/", json={
        "email": test_user["email"],
        "password": test_user["password"]
    })
    login_data = print_response(response, "Login")
    
    if login_data and "tokens" in login_data:
        token = login_data["tokens"]["access"]
        print(f"  ✅ Got JWT token: {token[:50]}...")
    else:
        token = None
        print("  ❌ No token received")
        
except Exception as e:
    print(f"❌ Login failed: {e}")
    token = None

if token:
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n3️⃣ Testing Profile Update with Encryption:")
    try:
        response = requests.put(
            f"{BASE_URL}/profile/",
            headers=headers,
            json={"education": education_data}
        )
        profile_data = print_response(response, "Profile Update")
        
        if profile_data:
            print("\n  🔍 Checking Response Structure:")
            print(f"    Has 'education': {'education' in profile_data}")
            print(f"    Has 'ml_ready_data': {'ml_ready_data' in profile_data}")
            
            if 'education' in profile_data:
                edu = profile_data['education']
                print(f"\n  ✅ Education Data Returned:")
                print(f"    Degree: {edu.get('degree')}")
                print(f"    Specialization (decrypted): {edu.get('decrypted_specialization')}")
                print(f"    University (decrypted): {edu.get('decrypted_university')}")
                print(f"    CGPA (decrypted): {edu.get('decrypted_cgpa')}")
                
                # Verify decrypted values match input
                print(f"\n  🔒 Encryption Verification:")
                print(f"    Specialization matches: {edu.get('decrypted_specialization') == 'Data Science'}")
                print(f"    University matches: {edu.get('decrypted_university') == 'Stanford University'}")
                print(f"    CGPA matches: {edu.get('decrypted_cgpa') == 9.1}")
            
            if 'ml_ready_data' in profile_data:
                ml = profile_data['ml_ready_data']
                print(f"\n  🧠 ML Data Generated:")
                print(f"    ML Ready: {ml.get('ml_ready', False)}")
                print(f"    Has features: {'features' in ml}")
                
    except Exception as e:
        print(f"❌ Profile update failed: {e}")
    
    print("\n4️⃣ Testing ML Data Endpoint:")
    try:
        response = requests.get(f"{BASE_URL}/ml/data/", headers=headers)
        ml_data = print_response(response, "ML Data")
        
        if ml_data and "data" in ml_data:
            print(f"\n  ✅ ML Records Count: {ml_data.get('count', 0)}")
            if ml_data['data']:
                first_record = ml_data['data'][0]
                print(f"  First record ID: {first_record.get('id')}")
                print(f"  Has encoded_data: {'encoded_data' in first_record}")
                
    except Exception as e:
        print(f"❌ ML data endpoint failed: {e}")
        
    print("\n5️⃣ Testing Profile Retrieval:")
    try:
        response = requests.get(f"{BASE_URL}/profile/", headers=headers)
        profile = print_response(response, "Profile Retrieval")
        
        if profile and 'education' in profile:
            edu = profile['education']
            print(f"\n  🔍 Retrieved Education Data:")
            print(f"    Has decrypted fields: {'decrypted_specialization' in edu}")
            print(f"    Has ml_ready_data: {'ml_ready_data' in edu}")
            
    except Exception as e:
        print(f"❌ Profile retrieval failed: {e}")

print("\n" + "=" * 60)
print("📊 API TEST SUMMARY")
print("=" * 60)
print("✅ All endpoints should return proper responses")
print("✅ Encryption should be transparent to API users")
print("✅ ML data should be generated automatically")