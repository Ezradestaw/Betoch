import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';

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

          {/* Protected Routes */}
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
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
