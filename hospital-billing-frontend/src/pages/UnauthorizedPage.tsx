import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
} from '@mui/material';
import { Shield, ArrowBack, Home } from '@mui/icons-material';
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
    <Box className='min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4'>
      <Card className='w-full max-w-2xl shadow-xl'>
        <CardContent className='p-8 text-center'>
          {/* Icon */}
          <Box className='flex justify-center mb-6'>
            <Shield className='text-6xl text-red-500' />
          </Box>

          {/* Title */}
          <Typography
            variant='h3'
            component='h1'
            className='font-bold text-gray-900 mb-4'
          >
            Access Denied
          </Typography>

          {/* Message */}
          <Typography variant='body1' color='text.secondary' className='mb-6'>
            Sorry, you don't have permission to access the requested resource.
          </Typography>

          {/* User Info */}
          {user && (
            <Alert severity='info' className='mb-6 text-left'>
              <Typography variant='body2' gutterBottom>
                <strong>Current User:</strong> {user.firstName} {user.lastName}
              </Typography>
              <Typography variant='body2' gutterBottom>
                <strong>Role:</strong> {user.role}
              </Typography>
              <Typography variant='body2'>
                <strong>Email:</strong> {user.email}
              </Typography>
            </Alert>
          )}

          {/* Requested Resource */}
          {from !== '/dashboard' && (
            <Alert severity='warning' className='mb-6 text-left'>
              <Typography variant='body2'>
                <strong>Requested Resource:</strong> {from}
              </Typography>
            </Alert>
          )}

          {/* Actions */}
          <Box className='flex flex-col sm:flex-row gap-3 justify-center'>
            <Button
              variant='outlined'
              startIcon={<ArrowBack />}
              onClick={handleGoBack}
              className='flex-1 sm:flex-none'
            >
              Go Back
            </Button>

            <Button
              variant='outlined'
              startIcon={<Home />}
              onClick={handleGoHome}
              className='flex-1 sm:flex-none'
            >
              Go Home
            </Button>

            <Button
              variant='contained'
              onClick={handleGoToLogin}
              className='flex-1 sm:flex-none'
            >
              Login as Different User
            </Button>
          </Box>

          {/* Help Text */}
          <Box className='mt-8 p-4 bg-gray-50 rounded-lg'>
            <Typography variant='body2' color='text.secondary'>
              If you believe you should have access to this resource, please
              contact your administrator.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UnauthorizedPage;
