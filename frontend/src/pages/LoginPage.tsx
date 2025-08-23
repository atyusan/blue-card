import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  MedicalServices,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import type { LoginFormData } from '../types';

// Validation schema
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the intended destination from location state
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      clearError();

      await login(data);

      toast.success('Login successful!');
      navigate(from, { replace: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4'>
      <Card className='w-full max-w-md shadow-xl'>
        <CardContent className='p-8'>
          {/* Header */}
          <Box className='text-center mb-8'>
            <Box className='flex justify-center mb-4'>
              <MedicalServices className='text-6xl text-primary-600' />
            </Box>
            <Typography
              variant='h4'
              component='h1'
              className='font-bold text-gray-900 mb-2'
            >
              Welcome Back
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Sign in to your Hospital Billing System account
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity='error' className='mb-4' onClose={clearError}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <TextField
              {...register('username')}
              fullWidth
              label='Username'
              type='text'
              variant='outlined'
              error={!!errors.username}
              helperText={errors.username?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Email className='text-gray-400' />
                  </InputAdornment>
                ),
              }}
              className='mb-4'
            />

            <TextField
              {...register('password')}
              fullWidth
              label='Password'
              type={showPassword ? 'text' : 'password'}
              variant='outlined'
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Lock className='text-gray-400' />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton
                      onClick={togglePasswordVisibility}
                      edge='end'
                      size='small'
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              className='mb-6'
            />

            <Button
              type='submit'
              fullWidth
              variant='contained'
              size='large'
              disabled={isSubmitting}
              className='h-12 text-lg font-semibold'
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {/* Forgot Password Link */}
          <Box className='text-center mt-4'>
            <Link
              to='/forgot-password'
              className='text-blue-600 hover:text-blue-800 text-sm font-medium'
            >
              Forgot your password?
            </Link>
          </Box>

          {/* Footer */}
          <Box className="text-center mt-6">
            <Typography variant="body2" color="text.secondary">
              Demo Credentials:
            </Typography>
            <Typography
              variant="body2"
              className="font-mono text-xs text-gray-600 mt-1"
            >
              admin / admin123
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
