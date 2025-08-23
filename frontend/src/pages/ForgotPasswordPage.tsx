import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
} from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';

// Validation schema
const forgotPasswordSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsSubmitting(true);
      await authService.requestPasswordReset(data.username);
      setIsSubmitted(true);
      toast.success('Password reset email sent successfully!');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send reset email';
      setError('root', { message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (isSubmitted) {
    return (
      <Box className='min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 p-4'>
        <Card className='w-full max-w-md shadow-xl'>
          <CardContent className='p-8 text-center'>
            {/* Success Icon */}
            <Box className='flex justify-center mb-6'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center'>
                <Email className='text-3xl text-green-600' />
              </div>
            </Box>

            {/* Success Message */}
            <Typography
              variant='h4'
              component='h1'
              className='font-bold text-gray-900 mb-4'
            >
              Check Your Email
            </Typography>

            <Typography variant="body1" color="text.secondary" className="mb-6">
              We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
            </Typography>

            {/* Actions */}
            <Box className='space-y-3'>
              <Button
                variant='contained'
                fullWidth
                onClick={handleBackToLogin}
                className='h-12'
              >
                Back to Login
              </Button>

              <Button
                variant='outlined'
                fullWidth
                onClick={() => window.location.reload()}
                className='h-12'
              >
                Send Another Email
              </Button>
            </Box>

            {/* Help Text */}
            <Box className='mt-6 p-4 bg-gray-50 rounded-lg'>
              <Typography variant='body2' color='text.secondary'>
                Didn't receive the email? Check your spam folder or contact
                support.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4'>
      <Card className='w-full max-w-md shadow-xl'>
        <CardContent className='p-8'>
          {/* Header */}
          <Box className='text-center mb-8'>
            <Box className='flex justify-center mb-4'>
              <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center'>
                <Email className='text-3xl text-blue-600' />
              </div>
            </Box>

            <Typography variant="h4" component="h1" className="font-bold text-gray-900 mb-2">
              Forgot Password?
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Enter your username and we'll send you a link to reset your password.
            </Typography>
          </Box>

          {/* Error Alert */}
          {errors.root && (
            <Alert
              severity='error'
              className='mb-4'
              onClose={() => setError('root', { message: '' })}
            >
              {errors.root.message}
            </Alert>
          )}

          {/* Form */}
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
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          {/* Footer */}
          <Box className='text-center mt-6'>
            <Button
              variant='text'
              startIcon={<ArrowBack />}
              onClick={handleBackToLogin}
              className='text-gray-600 hover:text-gray-900'
            >
              Back to Login
            </Button>
          </Box>

          {/* Help Text */}
          <Box className='mt-6 p-4 bg-gray-50 rounded-lg'>
            <Typography
              variant='body2'
              color='text.secondary'
              className='text-center'
            >
              Remember your password?{' '}
              <Link
                to='/login'
                className='text-blue-600 hover:text-blue-800 font-medium'
              >
                Sign in here
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgotPasswordPage;
