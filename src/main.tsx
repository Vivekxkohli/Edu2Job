// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./auth/AuthContext";
import { ToastProvider } from "./auth/ToastContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="728667203177-j0qu7iq6onu2v469sqndeuhro2bdgake.apps.googleusercontent.com">
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
