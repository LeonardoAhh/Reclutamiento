import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { AuthProvider } from '@/hooks/useAuth';
import { LoaderProvider } from '@/hooks/useLoader';
import '@/styles/global.css';
import 'sileo/styles.css';
import '@/styles/sileo.css';
import App from './App';
import { registerServiceWorker } from './pwa';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <LoaderProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </LoaderProvider>
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>,
);

registerServiceWorker();
