# Edu2Job - AI-Powered Career Guidance Platform

> Bridging education and employment through intelligent career recommendations

[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen?style=flat-square)](https://edu2-job-ai.vercel.app)

## Overview

Edu2Job is an intelligent platform that leverages machine learning to provide personalized career recommendations based on user education, skills, and qualifications. Our AI-powered system analyzes your profile and suggests the most suitable job opportunities.

## Features

✨ **Key Capabilities**

- 🤖 **AI-Powered Recommendations** - Machine learning models predict best career matches
- 👤 **User Profiles** - Comprehensive profiles with education, skills, and certifications
- 📊 **Analytics Dashboard** - Track recommendations and career insights
- 🔐 **Secure Authentication** - Google OAuth integration for safe access
- 💬 **Support System** - Dedicated support tickets for user assistance
- 🛡️ **Admin Panel** - Moderation and flagging system for content management

## Tech Stack

### Frontend
- **React** + **TypeScript** - Type-safe UI components
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Responsive styling

### Backend
- **Django** - Robust Python web framework
- **Django REST Framework** - RESTful API development
- **SQLite** - Database management
- **Scikit-learn** - Machine learning models
- **Random Forest Classifier** - Job prediction algorithm

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- pip/conda

### Frontend Setup

```bash
npm install
npm run dev
```

### Backend Setup

```bash
cd Backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Project Structure

```
├── src/
│   ├── components/     # Reusable React components
│   ├── pages/          # Page components
│   ├── auth/           # Authentication logic
│   └── data/           # Static data
├── Backend/
│   ├── accounts/       # User management & ML services
│   ├── ml/             # Machine learning models
│   └── utils/          # Helper utilities
└── public/             # Static assets
```

## ML Models

Our recommendation engine uses:
- **Random Forest Classifier** - Primary prediction model
- **Feature Engineering** - Skills, certifications, education mapping
- **One-Hot Encoding** - Categorical feature transformation

## API Documentation

Key endpoints:
- `POST /api/auth/` - User authentication
- `GET/POST /api/profile/` - User profile management
- `GET /api/recommendations/` - Get job recommendations
- `GET/POST /api/support-tickets/` - Support ticket management

## Live Demo

Visit the live application: [https://edu2-job-ai.vercel.app](https://edu2-job-ai.vercel.app)


