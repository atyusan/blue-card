import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Contexts
import { AuthProvider } from './context/AuthContext';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import AddPatientPage from './pages/AddPatientPage';
import PatientDetailsPage from './pages/PatientDetailsPage';
import BillingPage from './pages/BillingPage';
import InvoiceDetailsPage from './pages/InvoiceDetailsPage';
import InvoiceEditPage from './pages/InvoiceEditPage';
import AppointmentsPage from './pages/AppointmentsPage';
import Layout from './components/layout/Layout';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
    },
    secondary: {
      main: '#64748b',
    },
    success: {
      main: '#22c55e',
    },
    warning: {
      main: '#f59e0b',
    },
    error: {
      main: '#ef4444',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow:
            '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <div className='min-h-screen bg-gray-50'>
              <Routes>
                {/* Public routes */}
                <Route path='/login' element={<LoginPage />} />
                <Route
                  path='/forgot-password'
                  element={<ForgotPasswordPage />}
                />
                <Route path='/reset-password' element={<ResetPasswordPage />} />
                <Route path='/unauthorized' element={<UnauthorizedPage />} />

                {/* Protected routes */}
                <Route
                  path='/'
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to='/dashboard' replace />} />
                  <Route path='dashboard' element={<DashboardPage />} />

                  {/* Patient Management Routes */}
                  <Route path='patients' element={<PatientsPage />} />
                  <Route path='patients/add' element={<AddPatientPage />} />
                  <Route path='patients/:id' element={<PatientDetailsPage />} />
                  <Route
                    path='patients/:id/edit'
                    element={<AddPatientPage />}
                  />

                  {/* Billing & Invoices Routes */}
                  <Route path='billing' element={<BillingPage />} />
                  <Route path='billing/:id' element={<InvoiceDetailsPage />} />
                  <Route
                    path='billing/:id/edit'
                    element={<InvoiceEditPage />}
                  />

                  {/* Appointments Routes */}
                  <Route path='appointments' element={<AppointmentsPage />} />

                  {/* Add more routes here as we build them */}
                  <Route
                    path='*'
                    element={<Navigate to='/dashboard' replace />}
                  />
                </Route>
              </Routes>

              {/* Toast notifications */}
              <Toaster
                position='top-right'
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
