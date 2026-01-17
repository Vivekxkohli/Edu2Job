# test_keys.py
import os
import django

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edu2job_backend.settings')

# Load environment from .env
from dotenv import load_dotenv
load_dotenv()

print("🔑 Testing Environment Variables")
print("=" * 50)
print(f"FERNET_KEY exists: {'Yes' if os.getenv('FERNET_KEY') else 'No'}")
print(f"SECRET_KEY exists: {'Yes' if os.getenv('SECRET_KEY') else 'No'}")
print(f"DEBUG: {os.getenv('DEBUG')}")
print(f"ALLOWED_HOSTS: {os.getenv('ALLOWED_HOSTS')}")

# Test encryption
try:
    from cryptography.fernet import Fernet
    fernet_key = os.getenv('FERNET_KEY')
    if fernet_key:
        fernet = Fernet(fernet_key.encode())
        test_text = "Test encryption"
        encrypted = fernet.encrypt(test_text.encode())
        decrypted = fernet.decrypt(encrypted).decode()
        print(f"\n✅ Encryption test passed: {test_text == decrypted}")
    else:
        print("\n❌ FERNET_KEY not found in environment")
except Exception as e:
    print(f"\n❌ Encryption test failed: {e}")