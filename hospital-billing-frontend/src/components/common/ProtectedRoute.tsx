import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { Shield, Lock } from '@mui/icons-material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermissions,
  fallback,
}) => {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } =
    useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        display='flex'
        flexDirection='column'
        alignItems='center'
        justifyContent='center'
        minHeight='100vh'
        gap={2}
      >
        <CircularProgress size={48} />
        <Typography variant='body1' color='text.secondary'>
          Verifying authentication...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <Box
        display='flex'
        flexDirection='column'
        alignItems='center'
        justifyContent='center'
        minHeight='100vh'
        gap={3}
        p={4}
      >
        <Lock sx={{ fontSize: 64, color: 'error.main' }} />
        <Typography variant='h4' component='h1' color='error.main' gutterBottom>
          Access Denied
        </Typography>
        <Typography variant='body1' color='text.secondary' textAlign='center'>
          You don't have the required role to access this page.
        </Typography>
        <Typography variant='body2' color='text.secondary' textAlign='center'>
          Required role: <strong>{requiredRole}</strong>
        </Typography>
        <Typography variant='body2' color='text.secondary' textAlign='center'>
          Your role: <strong>{user?.role}</strong>
        </Typography>
        {fallback || (
          <Navigate to='/unauthorized' state={{ from: location }} replace />
        )}
      </Box>
    );
  }

  // Check if user has required permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every((permission) =>
      hasPermission(permission)
    );

    if (!hasAllPermissions) {
      return (
        <Box
          display='flex'
          flexDirection='column'
          alignItems='center'
          justifyContent='center'
          minHeight='100vh'
          gap={3}
          p={4}
        >
          <Shield sx={{ fontSize: 64, color: 'warning.main' }} />
          <Typography
            variant='h4'
            component='h1'
            color='warning.main'
            gutterBottom
          >
            Insufficient Permissions
          </Typography>
          <Typography variant='body1' color='text.secondary' textAlign='center'>
            You don't have the required permissions to access this page.
          </Typography>
          <Alert severity='info' sx={{ maxWidth: 400 }}>
            <Typography variant='body2' gutterBottom>
              <strong>Required permissions:</strong>
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              {requiredPermissions.map((permission) => (
                <li key={permission}>
                  <Typography variant='body2'>{permission}</Typography>
                </li>
              ))}
            </ul>
          </Alert>
          {fallback || (
            <Navigate to='/unauthorized' state={{ from: location }} replace />
          )}
        </Box>
      );
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
};

export default ProtectedRoute;
