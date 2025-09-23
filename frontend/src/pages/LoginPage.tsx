import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '../context/ToastContext';
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
  Container,
  Paper,
  Fade,
  LinearProgress,
  Divider,
  Chip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  MedicalServices,
  Login as LoginIcon,
  Security,
  HealthAndSafety,
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
  const { showSuccess, showError } = useToast();
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

      await login(data.username, data.password);

      showSuccess('Login successful!');
      navigate(from, { replace: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
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

      <Container maxWidth='sm'>
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                  <HealthAndSafety sx={{ fontSize: 40 }} />
                  <MedicalServices sx={{ fontSize: 40 }} />
                </Box>
                <Typography
                  variant='h4'
                  component='h1'
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  Blue Card Hospital
                </Typography>
                <Typography variant='body1' sx={{ opacity: 0.9 }}>
                  Secure Access Portal
                </Typography>
              </Box>
            </Box>

            <CardContent sx={{ p: 4 }}>
              {/* Welcome Message */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography
                  variant='h5'
                  component='h2'
                  sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}
                >
                  Welcome Back
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Sign in to access your hospital management system
                </Typography>
              </Box>

              {/* Error Alert */}
              {error && (
                <Fade in>
                  <Alert
                    severity='error'
                    sx={{ mb: 3 }}
                    onClose={clearError}
                    icon={<Security />}
                  >
                    {error}
                  </Alert>
                </Fade>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit(onSubmit)}>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    {...register('username')}
                    fullWidth
                    label='Username or Email'
                    type='text'
                    variant='outlined'
                    error={!!errors.username}
                    helperText={errors.username?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <Email sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>

                <Box sx={{ mb: 4 }}>
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
                          <Lock sx={{ color: 'text.secondary' }} />
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>

                {/* Loading Progress */}
                {isSubmitting && (
                  <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />
                )}

                <Button
                  type='submit'
                  fullWidth
                  variant='contained'
                  size='large'
                  disabled={isSubmitting}
                  startIcon={<LoginIcon />}
                  sx={{
                    height: 48,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    background:
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background:
                        'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    },
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  }}
                >
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              <Divider sx={{ my: 3 }}>
                <Chip label='or' size='small' />
              </Divider>

              {/* Forgot Password Link */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Link
                  to='/forgot-password'
                  style={{
                    color: '#667eea',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                >
                  Forgot your password?
                </Link>
              </Box>

              {/* Demo Credentials */}
              <Paper
                variant='outlined'
                sx={{
                  p: 2,
                  backgroundColor: 'grey.50',
                  border: '1px solid',
                  borderColor: 'grey.200',
                }}
              >
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ display: 'block', mb: 1, fontWeight: 600 }}
                >
                  Demo Credentials:
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                  }}
                >
                  <Chip
                    label='admin / admin123'
                    size='small'
                    variant='outlined'
                    sx={{ fontFamily: 'monospace' }}
                  />
                  <Chip
                    label='doctor / doctor123'
                    size='small'
                    variant='outlined'
                    sx={{ fontFamily: 'monospace' }}
                  />
                </Box>
              </Paper>
            </CardContent>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default LoginPage;
