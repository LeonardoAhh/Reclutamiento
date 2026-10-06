import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { AuthProvider } from '@/hooks/useAuth';
import { LoaderProvider } from '@/hooks/useLoader';
import { LanguageProvider } from '@/contexts/LanguageContext';
import './bones/registry';
import App from './App';
import { registerServiceWorker } from './pwa';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <LanguageProvider>
          <LoaderProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </LoaderProvider>
        </LanguageProvider>
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>,
);

registerServiceWorker();
