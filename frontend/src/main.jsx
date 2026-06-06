import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// Import provider của Google
import { GoogleOAuthProvider } from '@react-oauth/google';
// Import ThemeProvider
import { ThemeProvider } from './context/ThemeContext';

// Dán Client ID của bạn vào đây
const GOOGLE_CLIENT_ID = "794236283360-56r20m720frlrn09f2tf3bgqi4rn7bt7.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Bọc App bằng ThemeProvider và GoogleOAuthProvider */}
    <ThemeProvider>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)