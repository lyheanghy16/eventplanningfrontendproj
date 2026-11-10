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
    <ThemeProvider>
      <ToastProvider>
        <EventProvider>
          <AuthProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <App />
            </BrowserRouter>
          </AuthProvider>
        </EventProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
