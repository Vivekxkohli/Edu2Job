# edu2job_backend/settings.py
from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv
from cryptography.fernet import Fernet  # Import Fernet here
import dj_database_url  # Import dj_database_url

# Load environment variables from .env file
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# Get SECRET_KEY from .env, with fallback
SECRET_KEY = os.getenv("SECRET_KEY")

# If SECRET_KEY is not in .env, use a default (for development only)
if not SECRET_KEY:
    print("⚠️ WARNING: SECRET_KEY not found in .env file!")
    SECRET_KEY = "django-insecure-change-this-in-production"

# Get FERNET_KEY from .env, generate one if not found
FERNET_KEY = os.getenv("FERNET_KEY")
if not FERNET_KEY:
    print("⚠️ WARNING: FERNET_KEY not found in .env file! Generating a new one...")
    FERNET_KEY = Fernet.generate_key().decode()

DEBUG = os.getenv("DEBUG", "False") == "True"

ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
# Add Render's internal host (optional but good for health checks)
allowed_hosts_env = os.getenv("RENDER_EXTERNAL_HOSTNAME")
if allowed_hosts_env:
    ALLOWED_HOSTS.append(allowed_hosts_env)

# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # 3rd party
    "rest_framework",
    "corsheaders",

    # local apps
    "accounts",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",      # CORS first
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware", # WhiteNoise for static files
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "edu2job_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "edu2job_backend.wsgi.application"


# Database
# Use SQLite locally, but allow override via DATABASE_URL for Postgres on Render
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

database_url = os.getenv("DATABASE_URL")
if database_url:
    DATABASES["default"] = dj_database_url.parse(database_url, conn_max_age=600)


# Password validation

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
# Enable WhiteNoise's GZip compression of static assets.
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------- CUSTOM AUTH / API / CORS / JWT ----------

AUTH_USER_MODEL = "accounts.User"

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",   # Vite dev
    "http://127.0.0.1:5173",
]
# Allow adding frontend URL via env var
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    CORS_ALLOWED_ORIGINS.append(frontend_url)
    # Remove trailing slash if present for consistency, though CORS_ALLOWED_ORIGINS usually expects origin
    if frontend_url.endswith("/"):
         CORS_ALLOWED_ORIGINS.append(frontend_url[:-1])

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
}
