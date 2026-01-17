// src/App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import PredictionPage from "./pages/PredictionPage";
import AuthCallbackPage from "./auth/AuthCallbackPage";
import ProtectedRoute from "./auth/ProtectedRoute";
import { useAuth } from "./auth/AuthContext";
import "./App.css";
import AdminPanel from "./pages/AdminPanel";
import SupportPage from "./pages/SupportPage";
import SupportContact from "./pages/SupportContact";
import MySupportTickets from "./pages/MySupportTickets";
import "./pages/Dashboard.css";

const App: React.FC = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner-large">
          <div className="spinner" />
          <p>Loading your workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        }
      />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/support/contact" element={<SupportContact />} />
      <Route path="/support/my-tickets" element={<MySupportTickets />} />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/predictions"
        element={
          <ProtectedRoute>
            <PredictionPage />
          </ProtectedRoute>
        }
      />
    </Routes>
    
  );
};

export default App;
