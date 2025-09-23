import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Container,
  Paper,
  Fade,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import {
  Shield,
  ArrowBack,
  Home,
  Login as LoginIcon,
  Security,
  Warning,
  Info,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        p: 2,
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.3,
        }}
      />

      <Container maxWidth='md'>
        <Fade in timeout={800}>
          <Paper
            elevation={24}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {/* Header Section */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                color: 'white',
                p: 4,
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                }}
              />
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 2,
                    gap: 1,
                  }}
                >
                  <Security sx={{ fontSize: 48 }} />
                  <Shield sx={{ fontSize: 48 }} />
                </Box>
                <Typography
                  variant='h3'
                  component='h1'
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  Access Denied
                </Typography>
                <Typography variant='h6' sx={{ opacity: 0.9 }}>
                  Insufficient Permissions
                </Typography>
              </Box>
            </Box>

            <CardContent sx={{ p: 4 }}>
              {/* Main Message */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography
                  variant='h5'
                  component='h2'
                  sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}
                >
                  Sorry, you don't have permission to access this resource
                </Typography>
                <Typography variant='body1' color='text.secondary'>
                  Your current role doesn't include the necessary permissions
                  for this action.
                </Typography>
              </Box>

              {/* User Information */}
              {user && (
                <Fade in timeout={1000}>
                  <Alert severity='info' icon={<Info />} sx={{ mb: 3 }}>
                    <Typography
                      variant='subtitle2'
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      Current User Information:
                    </Typography>
                    <Stack direction='row' spacing={2} sx={{ mt: 1 }}>
                      <Chip
                        label={`${user.firstName} ${user.lastName}`}
                        color='primary'
                        variant='outlined'
                        icon={<Security />}
                      />
                      <Chip
                        label={user.role || 'No Role Assigned'}
                        color='secondary'
                        variant='outlined'
                      />
                      <Chip
                        label={user.email}
                        color='default'
                        variant='outlined'
                        sx={{ fontFamily: 'monospace' }}
                      />
                    </Stack>
                  </Alert>
                </Fade>
              )}

              {/* Requested Resource */}
              {from !== '/dashboard' && (
                <Fade in timeout={1200}>
                  <Alert severity='warning' icon={<Warning />} sx={{ mb: 4 }}>
                    <Typography
                      variant='subtitle2'
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      Requested Resource:
                    </Typography>
                    <Typography
                      variant='body2'
                      sx={{ fontFamily: 'monospace' }}
                    >
                      {from}
                    </Typography>
                  </Alert>
                </Fade>
              )}

              {/* Action Buttons */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ mb: 4 }}
                justifyContent='center'
              >
                <Button
                  variant='outlined'
                  startIcon={<ArrowBack />}
                  onClick={handleGoBack}
                  size='large'
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                  }}
                >
                  Go Back
                </Button>

                <Button
                  variant='outlined'
                  startIcon={<Home />}
                  onClick={handleGoHome}
                  size='large'
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                  }}
                >
                  Go Home
                </Button>

                <Button
                  variant='contained'
                  startIcon={<LoginIcon />}
                  onClick={handleGoToLogin}
                  size='large'
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                    background:
                      'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                    '&:hover': {
                      background:
                        'linear-gradient(135deg, #ff5252 0%, #e64a19 100%)',
                    },
                    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.4)',
                  }}
                >
                  Login as Different User
                </Button>
              </Stack>

              <Divider sx={{ my: 3 }}>
                <Chip label='Need Help?' size='small' />
              </Divider>

              {/* Help Section */}
              <Paper
                variant='outlined'
                sx={{
                  p: 3,
                  backgroundColor: 'grey.50',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant='h6'
                  gutterBottom
                  sx={{ fontWeight: 600, color: 'text.primary' }}
                >
                  Need Help?
                </Typography>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mb: 2 }}
                >
                  If you believe you should have access to this resource, please
                  contact your administrator or IT support team.
                </Typography>
                <Stack direction='row' spacing={1} flexWrap='wrap'>
                  <Chip
                    label='Contact Administrator'
                    size='small'
                    color='primary'
                    variant='outlined'
                  />
                  <Chip
                    label='Request Permission'
                    size='small'
                    color='secondary'
                    variant='outlined'
                  />
                  <Chip
                    label='Check Role Assignment'
                    size='small'
                    color='default'
                    variant='outlined'
                  />
                </Stack>
              </Paper>
            </CardContent>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default UnauthorizedPage;
