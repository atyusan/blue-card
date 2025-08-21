import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
  IconButton,
} from '@mui/material';
import {
  Lock,
  Visibility,
  VisibilityOff,
  CheckCircle,
} from '@mui/icons-material';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';

// Validation schema
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('root', { message: 'Reset token is missing or invalid' });
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.resetPassword(token, data.password);
      setIsSubmitted(true);
      toast.success('Password reset successfully!');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to reset password';
      setError('root', { message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  // If no token, show error
  if (!token) {
    return (
      <Box className='min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4'>
        <Card className='w-full max-w-md shadow-xl'>
          <CardContent className='p-8 text-center'>
            <Box className='flex justify-center mb-6'>
              <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center'>
                <Lock className='text-3xl text-red-600' />
              </div>
            </Box>

            <Typography
              variant='h4'
              component='h1'
              className='font-bold text-gray-900 mb-4'
            >
              Invalid Reset Link
            </Typography>

            <Typography variant='body1' color='text.secondary' className='mb-6'>
              The password reset link is invalid or has expired. Please request
              a new password reset.
            </Typography>

            <Button
              variant='contained'
              fullWidth
              onClick={handleGoToLogin}
              className='h-12'
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (isSubmitted) {
    return (
      <Box className='min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 p-4'>
        <Card className='w-full max-w-md shadow-xl'>
          <CardContent className='p-8 text-center'>
            {/* Success Icon */}
            <Box className='flex justify-center mb-6'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center'>
                <CheckCircle className='text-3xl text-green-600' />
              </div>
            </Box>

            {/* Success Message */}
            <Typography
              variant='h4'
              component='h1'
              className='font-bold text-gray-900 mb-4'
            >
              Password Reset Successfully!
            </Typography>

            <Typography variant='body1' color='text.secondary' className='mb-6'>
              Your password has been reset successfully. You can now log in with
              your new password.
            </Typography>

            {/* Actions */}
            <Button
              variant='contained'
              fullWidth
              onClick={handleGoToLogin}
              className='h-12'
            >
              Go to Login
            </Button>
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
                <Lock className='text-3xl text-blue-600' />
              </div>
            </Box>

            <Typography
              variant='h4'
              component='h1'
              className='font-bold text-gray-900 mb-2'
            >
              Reset Your Password
            </Typography>

            <Typography variant='body2' color='text.secondary'>
              Enter your new password below. Make sure it's secure and
              memorable.
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
              {...register('password')}
              fullWidth
              label='New Password'
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
                      onClick={() => setShowPassword(!showPassword)}
                      edge='end'
                      size='small'
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              {...register('confirmPassword')}
              fullWidth
              label='Confirm New Password'
              type={showConfirmPassword ? 'text' : 'password'}
              variant='outlined'
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Lock className='text-gray-400' />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge='end'
                      size='small'
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type='submit'
              fullWidth
              variant='contained'
              size='large'
              disabled={isSubmitting}
              className='h-12 text-lg font-semibold'
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          {/* Password Requirements */}
          <Box className='mt-6 p-4 bg-gray-50 rounded-lg'>
            <Typography
              variant='body2'
              color='text.secondary'
              className='font-medium mb-2'
            >
              Password Requirements:
            </Typography>
            <ul className='text-sm text-gray-600 space-y-1'>
              <li>• At least 8 characters long</li>
              <li>• Contains at least one lowercase letter</li>
              <li>• Contains at least one uppercase letter</li>
              <li>• Contains at least one number</li>
            </ul>
          </Box>

          {/* Footer */}
          <Box className='text-center mt-6'>
            <Typography variant='body2' color='text.secondary'>
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

export default ResetPasswordPage;
