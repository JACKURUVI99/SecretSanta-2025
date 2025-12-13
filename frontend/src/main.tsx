import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App.tsx';
import AuthCallback from './components/features/AuthCallback.tsx';
import AdminLogin from './components/admin/AdminLogin.tsx';
import AdminRoute from './components/admin/AdminRoute.tsx';
import TechStackDoc from './components/common/TechStackDoc.tsx';
import './index.css';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/tech-docs" element={<TechStackDoc />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      registration.unregister();
      console.log("Service Worker Unregistered to clear cache.");
    }
  });
}
