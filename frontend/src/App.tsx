import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import { StaffPage } from './pages/StaffPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { ServicesPage } from './pages/ServicesPage';
import { RolesPage } from './pages/RolesPage';
import AppointmentsPage from './pages/AppointmentsPage';
import BillingPage from './pages/BillingPage';
import { CashManagementPage } from './pages/CashManagementPage';
import { UserPermissionsPage } from './pages/UserPermissionsPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import InvoiceDetailsPage from './pages/InvoiceDetailsPage';
import InvoiceEditPage from './pages/InvoiceEditPage';
import { PermissionTemplatesPage } from './pages/PermissionTemplatesPage';
import { TemporaryPermissionsPage } from './pages/TemporaryPermissionsPage';
import { PermissionWorkflowsPage } from './pages/PermissionWorkflowsPage';
import { AdminPermissionsPage } from './pages/AdminPermissionsPage';
import { PermissionAnalyticsPage } from './pages/PermissionAnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SystemSettingsPage } from './pages/SystemSettingsPage';
import { PermissionGuard } from './components/auth/PermissionGuard';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to='/login' replace />;
  }
  return <>{children}</>;
};

// App Routes Component
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path='/login' element={<LoginPage />} />

      {/* Protected Routes */}
      <Route
        path='/'
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to='/dashboard' replace />} />
        <Route path='dashboard' element={<DashboardPage />} />

        {/* Core Management */}
        <Route
          path='patients'
          element={
            <PermissionGuard permissions={['view_patients']}>
              <PatientsPage />
            </PermissionGuard>
          }
        />

        <Route
          path='staff'
          element={
            <PermissionGuard permissions={['view_staff']}>
              <StaffPage />
            </PermissionGuard>
          }
        />

        <Route
          path='appointments'
          element={
            <PermissionGuard permissions={['view_appointments']}>
              <AppointmentsPage />
            </PermissionGuard>
          }
        />

        {/* Administrative */}
        <Route
          path='departments'
          element={
            <PermissionGuard permissions={['view_departments']}>
              <DepartmentsPage />
            </PermissionGuard>
          }
        />

        <Route
          path='services'
          element={
            <PermissionGuard permissions={['view_services']}>
              <ServicesPage />
            </PermissionGuard>
          }
        />

        <Route
          path='roles'
          element={
            <PermissionGuard permissions={['view_roles']}>
              <RolesPage />
            </PermissionGuard>
          }
        />

        {/* Financial */}
        <Route
          path='billing'
          element={
            <PermissionGuard permissions={['view_billing']}>
              <BillingPage />
            </PermissionGuard>
          }
        />

        <Route
          path='billing/create'
          element={
            <PermissionGuard permissions={['view_billing']}>
              <CreateInvoicePage />
            </PermissionGuard>
          }
        />

        <Route
          path='billing/:id'
          element={
            <PermissionGuard permissions={['view_billing']}>
              <InvoiceDetailsPage />
            </PermissionGuard>
          }
        />

        <Route
          path='billing/:id/edit'
          element={
            <PermissionGuard permissions={['view_billing']}>
              <InvoiceEditPage />
            </PermissionGuard>
          }
        />

        <Route
          path='cash'
          element={
            <PermissionGuard permissions={['view_cash_transactions']}>
              <CashManagementPage />
            </PermissionGuard>
          }
        />

        {/* Permission System - Available to all authenticated users */}
        <Route path='permissions' element={<UserPermissionsPage />} />

        <Route
          path='permission-templates'
          element={
            <PermissionGuard permissions={['view_permission_templates']}>
              <PermissionTemplatesPage />
            </PermissionGuard>
          }
        />

        <Route
          path='temporary-permissions'
          element={
            <PermissionGuard permissions={['view_temporary_permissions']}>
              <TemporaryPermissionsPage />
            </PermissionGuard>
          }
        />

        <Route
          path='permission-workflows'
          element={
            <PermissionGuard permissions={['view_permission_workflows']}>
              <PermissionWorkflowsPage />
            </PermissionGuard>
          }
        />

        {/* Admin Routes */}
        <Route path='admin'>
          <Route
            path='permissions'
            element={
              <PermissionGuard permissions={['manage_permissions']}>
                <AdminPermissionsPage />
              </PermissionGuard>
            }
          />
          <Route
            path='analytics'
            element={
              <PermissionGuard permissions={['view_permission_analytics']}>
                <PermissionAnalyticsPage />
              </PermissionGuard>
            }
          />
        </Route>

        {/* Settings */}
        <Route
          path='settings'
          element={
            <PermissionGuard permissions={['manage_system_settings']}>
              <SettingsPage />
            </PermissionGuard>
          }
        />

        <Route
          path='system-settings'
          element={
            <PermissionGuard permissions={['manage_system_settings']}>
              <SystemSettingsPage />
            </PermissionGuard>
          }
        />

        {/* Catch all route for protected routes */}
        <Route path='*' element={<Navigate to='/dashboard' replace />} />
      </Route>

      {/* Catch all route for public routes */}
      <Route path='*' element={<Navigate to='/login' replace />} />
    </Routes>
  );
};

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Main App Component
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <AppRoutes />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
