import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { AIAssistantWidget } from './components/AIAssistantWidget';
import { MobileBottomNav } from './components/MobileBottomNav';
import { GlobalSearchModal } from './components/GlobalSearchModal';

// Pages
import { HomePage } from './pages/HomePage';
import { PropertiesPage } from './pages/PropertiesPage';
import { PropertyDetailsPage } from './pages/PropertyDetailsPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { RenterDashboardPage } from './pages/RenterDashboardPage';
import { VerificationPortalPage } from './pages/VerificationPortalPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { PaymentCheckoutPage } from './pages/PaymentCheckoutPage';
import { MessagesPage } from './pages/MessagesPage';
import { TrustCenterPage } from './pages/TrustCenterPage';
import { SafetyCenterPage } from './pages/SafetyCenterPage';
import { OwnerProfilePage } from './pages/OwnerProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { UserRole } from '@betoch/shared';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 3, // 3 minutes
      retry: 1
    }
  }
});

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { user, loading, openAuthModal } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    openAuthModal('login');
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/properties/:slug" element={<PropertyDetailsPage />} />
          <Route path="/trust" element={<TrustCenterPage />} />
          <Route path="/safety" element={<SafetyCenterPage />} />
          <Route path="/owners/:ownerId" element={<OwnerProfilePage />} />

          {/* Protected Routes */}
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/create-listing"
            element={
              <ProtectedRoute allowedRoles={[UserRole.OWNER, UserRole.ADMIN]}>
                <CreateListingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoute allowedRoles={[UserRole.OWNER, UserRole.ADMIN]}>
                <OwnerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/renter/applications"
            element={
              <ProtectedRoute allowedRoles={[UserRole.RENTER, UserRole.ADMIN]}>
                <RenterDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/renter/saved"
            element={
              <ProtectedRoute allowedRoles={[UserRole.RENTER, UserRole.ADMIN]}>
                <RenterDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/verification"
            element={
              <ProtectedRoute>
                <VerificationPortalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/checkout/:contractId"
            element={
              <ProtectedRoute>
                <PaymentCheckoutPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <AuthModal />
      <AIAssistantWidget />
      <MobileBottomNav />
      <GlobalSearchModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
