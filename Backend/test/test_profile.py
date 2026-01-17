# test_profile_update.py

import requests
import json

# Test data matching your screenshot
test_data = {
    "degree": "B.Tech",
    "specialization": "Data Science", 
    "university": "Lovely Professional University",
    "year_of_completion": 2026,  # Use this field name
    "cgpa": "7",  # String as required by schema
    # Alternative: "year": 2026 (will also work with our code)
}

# Get authentication token first (adjust based on your auth method)
headers = {
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
    'Content-Type': 'application/json'
}

# Or if using session authentication
session = requests.Session()
# Login first...

response = session.put(
    'http://localhost:8000/api/profile/',
    json=test_data,
    headers=headers
)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")