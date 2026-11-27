/**
 * main: mounts the React tree and composes router, theme, toast, event, and auth providers.
 * BrowserRouter wraps AuthProvider because auth actions navigate after session changes.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import './styles.css';

// Provider order matters: Auth reads users from Events, and everything may toast.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <ToastProvider>
          <EventProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </EventProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
