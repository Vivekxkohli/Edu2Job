from cryptography.fernet import Fernet
import os
from django.conf import settings

# Get FERNET_KEY from settings
FERNET_KEY = getattr(settings, 'FERNET_KEY', None)

if not FERNET_KEY:
    print("⚠️ WARNING: FERNET_KEY not set in Django settings")
    # Generate a temporary key for development
    from cryptography.fernet import Fernet
    FERNET_KEY = Fernet.generate_key().decode()
    print(f"⚠️ Generated temporary FERNET_KEY: {FERNET_KEY[:20]}...")

try:
    # Ensure FERNET_KEY is bytes
    if isinstance(FERNET_KEY, str):
        fernet = Fernet(FERNET_KEY.encode())
    else:
        fernet = Fernet(FERNET_KEY)
    print("✅ Fernet encryption initialized successfully")
except Exception as e:
    print(f"❌ Error initializing Fernet: {e}")
    raise

def encrypt_value(value: str) -> str:
    """Encrypt a string value"""
    if not value:
        return ""
    try:
        # Ensure value is bytes
        encrypted_bytes = fernet.encrypt(value.encode())
        return encrypted_bytes.decode()
    except Exception as e:
        print(f"⚠️ Encryption error for value '{value}': {e}")
        # Return original value as fallback
        return value

def decrypt_value(value: str) -> str:
    """Decrypt a string value"""
    if not value:
        return ""
    try:
        # Ensure value is bytes
        decrypted_bytes = fernet.decrypt(value.encode())
        return decrypted_bytes.decode()
    except Exception as e:
        print(f"⚠️ Decryption error for value '{value}': {e}")
        # Return original value if decryption fails
        return value