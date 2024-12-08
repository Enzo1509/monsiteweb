import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';
import { initDB } from './lib/db';
import { useBusinessStore } from './store/businessStore';
import { useLanguageStore } from './store/languageStore';
import { authConfig } from './config/auth';

async function init() {
  try {
    // Initialize the database
    await initDB();
    const loadBusinesses = useBusinessStore.getState().loadBusinesses;
    await loadBusinesses();

    // Initialize language
    const { setInitialLanguage } = useLanguageStore.getState();
    setInitialLanguage();
    
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <GoogleOAuthProvider clientId={authConfig.googleClientId}>
          <App />
        </GoogleOAuthProvider>
      </StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize application:', error);
  }
}

init();