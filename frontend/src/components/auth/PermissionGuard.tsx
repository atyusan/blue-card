import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Typography,
  Box,
  Container,
  Paper,
  Fade,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import { Button } from '@/components/ui/button';
import {
  Security,
  Lock,
  Warning,
  Login as LoginIcon,
  ArrowBack,
  Info,
} from '@mui/icons-material';

interface PermissionGuardProps {
  children: React.ReactNode;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  showRequestButton?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permissions = [],
  requireAll = false,
  fallback,
  showRequestButton = false,
}) => {
  const { user, hasPermission, hasAnyPermission, hasAllPermissions, isAdmin } =
    useAuth();
  const navigate = useNavigate();

  // If no permissions required, allow access
  if (!permissions || permissions.length === 0) {
    return <>{children}</>;
  }

  // Check if user is authenticated
  if (!user) {
    return (
      <Container maxWidth='sm' sx={{ py: 8 }}>
        <Fade in timeout={600}>
          <Paper
            elevation={8}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
              color: 'white',
            }}
          >
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Box sx={{ mb: 3 }}>
                <Lock sx={{ fontSize: 64, opacity: 0.9 }} />
              </Box>
              <Typography
                variant='h4'
                component='h2'
                sx={{ fontWeight: 700, mb: 2 }}
              >
                Authentication Required
              </Typography>
              <Typography variant='body1' sx={{ mb: 4, opacity: 0.9 }}>
                You need to be logged in to access this resource.
              </Typography>
              <Button
                variant='contained'
                size='large'
                startIcon={<LoginIcon />}
                onClick={() => navigate('/login')}
                sx={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.3)',
                  },
                  px: 4,
                  py: 1.5,
                }}
              >
                Go to Login
              </Button>
            </Box>
          </Paper>
        </Fade>
      </Container>
    );
  }

  // Check permissions
  let hasAccess = false;

  if (isAdmin()) {
    hasAccess = true;
  } else if (requireAll) {
    hasAccess = hasAllPermissions(permissions);
  } else {
    hasAccess = hasAnyPermission(permissions);
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have required permissions
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Container maxWidth='sm' sx={{ py: 8 }}>
      <Fade in timeout={600}>
        <Paper
          elevation={8}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #ffa726 0%, #ff7043 100%)',
            color: 'white',
          }}
        >
          <Box sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{ mb: 2 }}>
                <Security sx={{ fontSize: 48, opacity: 0.9 }} />
              </Box>
              <Typography
                variant='h4'
                component='h2'
                sx={{ fontWeight: 700, mb: 1 }}
              >
                Access Denied
              </Typography>
              <Typography variant='body1' sx={{ opacity: 0.9 }}>
                Insufficient Permissions
              </Typography>
            </Box>

            {/* Warning Message */}
            <Box
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                p: 3,
                mb: 4,
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Stack direction='row' spacing={2} sx={{ mb: 2 }}>
                <Warning sx={{ fontSize: 24, color: 'warning.light' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant='body1' sx={{ fontWeight: 600, mb: 1 }}>
                    You don't have the required permissions to access this
                    resource.
                  </Typography>
                  <Typography variant='body2' sx={{ opacity: 0.9 }}>
                    Required: {requireAll ? 'all of' : 'one of'}{' '}
                    {permissions.join(', ')}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Permission Chips */}
            <Box sx={{ mb: 4 }}>
              <Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 600 }}>
                Required Permissions:
              </Typography>
              <Stack direction='row' spacing={1} flexWrap='wrap'>
                {permissions.map((permission) => (
                  <Chip
                    key={permission}
                    label={permission}
                    size='small'
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                  />
                ))}
              </Stack>
            </Box>

            <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.3)' }} />

            {/* Action Buttons */}
            <Stack spacing={2}>
              <Button
                onClick={() => navigate(-1)}
                variant='outlined'
                startIcon={<ArrowBack />}
                size='large'
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Go Back
              </Button>

              {showRequestButton && (
                <Button
                  onClick={() => navigate('/permissions/request')}
                  variant='contained'
                  startIcon={<Info />}
                  size='large'
                  sx={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.3)',
                    },
                  }}
                >
                  Request Permission
                </Button>
              )}
            </Stack>
          </Box>
        </Paper>
      </Fade>
    </Container>
  );
};

// Higher-order component for protecting components
export const withPermission = <P extends object>(
  Component: React.ComponentType<P>,
  permissions: string[],
  requireAll: boolean = false
) => {
  return (props: P) => (
    <PermissionGuard permissions={permissions} requireAll={requireAll}>
      <Component {...props} />
    </PermissionGuard>
  );
};
