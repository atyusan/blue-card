import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Chip,
  Divider,
  Grid,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Skeleton,
  Stack,
  Paper,
  Container,
  Fade,
  Slide,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  MoreVert,
  Person,
  LocalHospital,
  Receipt,
  Phone,
  Email,
  AccessTime,
  CalendarToday,
  CheckCircle,
  Warning,
  Error,
  Info,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import appointmentService from '../services/appointment.service';
import toast from 'react-hot-toast';
import { formatDate, formatCurrency, getInitials } from '@/utils';

const AppointmentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();

  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch appointment details
  const {
    data: appointment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentService.getAppointmentById(id!),
    enabled: !!id,
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: (data: { id: string; reason: string }) =>
      appointmentService.cancelAppointment(data.id, data.reason),
    onSuccess: () => {
      toast.success('Appointment cancelled successfully');
      setCancelDialogOpen(false);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to cancel appointment'
      );
    },
  });

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setActionMenuAnchor(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  const handleEditAppointment = () => {
    navigate(`/appointments/${id}/edit`);
    handleActionMenuClose();
  };

  const handleCancelAppointment = () => {
    setCancelDialogOpen(true);
    handleActionMenuClose();
  };

  const handleDeleteAppointment = () => {
    setDeleteDialogOpen(true);
    handleActionMenuClose();
  };

  const confirmCancelAppointment = () => {
    if (id && cancelReason) {
      cancelAppointmentMutation.mutate({ id, reason: cancelReason });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'success';
      case 'scheduled':
        return 'info';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'success';
      case 'no_show':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle />;
      case 'scheduled':
        return <CalendarToday />;
      case 'pending':
        return <Warning />;
      case 'cancelled':
        return <Error />;
      case 'completed':
        return <CheckCircle />;
      case 'no_show':
        return <Error />;
      default:
        return <Info />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'emergency':
        return 'error';
      case 'urgent':
        return 'warning';
      case 'routine':
        return 'default';
      case 'follow_up':
        return 'info';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant='rectangular' height={200} />
        <Skeleton variant='rectangular' height={200} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error || !appointment) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error'>
          {error?.message || 'Appointment not found'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/appointments')}
          sx={{ mt: 2 }}
        >
          Back to Appointments
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      {/* Enhanced Header */}
      <Fade in timeout={600}>
        <Paper
          elevation={0}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            borderRadius: 3,
            p: 4,
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background Pattern */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '200px',
              height: '200px',
              background: `radial-gradient(circle, ${alpha(
                '#fff',
                0.1
              )} 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
              opacity: 0.3,
            }}
          />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <IconButton
                  onClick={() => navigate('/appointments')}
                  sx={{
                    color: 'white',
                    bgcolor: alpha('#fff', 0.1),
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.2),
                    },
                  }}
                >
                  <ArrowBack />
                </IconButton>
                <Box>
                  <Typography variant='h3' component='h1' fontWeight={700}>
                    Appointment Details
                  </Typography>
                  <Typography variant='body1' sx={{ opacity: 0.9, mt: 0.5 }}>
                    ID: {appointment.id}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mt: 1,
                    }}
                  >
                    <CalendarToday sx={{ fontSize: 16 }} />
                    <Typography variant='body2' sx={{ opacity: 0.8 }}>
                      {formatDate(appointment.scheduledStart || new Date())} •{' '}
                      {new Date(
                        appointment.scheduledStart || new Date()
                      ).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  icon={getStatusIcon(appointment.status)}
                  label={appointment.status}
                  color={getStatusColor(appointment.status) as any}
                  sx={{
                    bgcolor: alpha('#fff', 0.2),
                    color: 'white',
                    fontWeight: 600,
                    '& .MuiChip-icon': {
                      color: 'white',
                    },
                  }}
                />
                <IconButton
                  onClick={handleActionMenuOpen}
                  sx={{
                    color: 'white',
                    bgcolor: alpha('#fff', 0.1),
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.2),
                    },
                  }}
                >
                  <MoreVert />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Fade>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={handleEditAppointment}>
          <ListItemIcon>
            <Edit fontSize='small' />
          </ListItemIcon>
          Edit Appointment
        </MenuItem>
        {appointment.status !== 'CANCELLED' && (
          <MenuItem onClick={handleCancelAppointment}>
            <ListItemIcon>
              <Warning fontSize='small' />
            </ListItemIcon>
            Cancel Appointment
          </MenuItem>
        )}
        <MenuItem
          onClick={handleDeleteAppointment}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Delete fontSize='small' />
          </ListItemIcon>
          Delete Appointment
        </MenuItem>
      </Menu>

      {/* Simple Layout */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Patient Information */}
        <Card>
          <CardHeader title='Patient Information' />
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {getInitials(
                  appointment.patient?.firstName,
                  appointment.patient?.lastName
                )}
              </Avatar>
              <Box>
                <Typography variant='h6'>
                  {appointment.patient?.firstName}{' '}
                  {appointment.patient?.lastName}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  ID: {appointment.patient?.patientId}
                </Typography>
              </Box>
            </Box>
            {appointment.patient?.phoneNumber && (
              <Typography variant='body2' sx={{ mb: 1 }}>
                <strong>Phone:</strong> {appointment.patient.phoneNumber}
              </Typography>
            )}
            {appointment.patient?.email && (
              <Typography variant='body2'>
                <strong>Email:</strong> {appointment.patient.email}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Provider Information */}
        {appointment.slot?.provider && (
          <Card>
            <CardHeader title='Provider Information' />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  {getInitials(
                    (appointment.slot.provider as any).firstName,
                    (appointment.slot.provider as any).lastName
                  )}
                </Avatar>
                <Box>
                  <Typography variant='h6'>
                    {(appointment.slot.provider as any).firstName}{' '}
                    {(appointment.slot.provider as any).lastName}
                  </Typography>
                  {(appointment.slot.provider as any).specialization && (
                    <Typography variant='body2' color='text.secondary'>
                      {(appointment.slot.provider as any).specialization}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Appointment Information */}
        <Card>
          <CardHeader title='Appointment Information' />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant='body2' color='text.secondary'>
                  Scheduled Time
                </Typography>
                <Typography variant='body1'>
                  {formatDate(appointment.scheduledStart || new Date())} at{' '}
                  {new Date(
                    appointment.scheduledStart || new Date()
                  ).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Typography>
              </Grid>
              {appointment.scheduledEnd && (
                <Grid item xs={12} sm={6}>
                  <Typography variant='body2' color='text.secondary'>
                    End Time
                  </Typography>
                  <Typography variant='body1'>
                    {formatDate(appointment.scheduledEnd)} at{' '}
                    {new Date(appointment.scheduledEnd).toLocaleTimeString(
                      'en-US',
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      }
                    )}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <Typography variant='body2' color='text.secondary'>
                  Appointment Type
                </Typography>
                <Typography variant='body1'>
                  {appointment.appointmentType?.replace(/_/g, ' ')}
                </Typography>
              </Grid>
              {appointment.slot?.duration && (
                <Grid item xs={12} sm={6}>
                  <Typography variant='body2' color='text.secondary'>
                    Duration
                  </Typography>
                  <Typography variant='body1'>
                    {appointment.slot.duration} minutes
                  </Typography>
                </Grid>
              )}
              {appointment.priority && (
                <Grid item xs={12}>
                  <Typography variant='body2' color='text.secondary'>
                    Priority
                  </Typography>
                  <Chip
                    label={appointment.priority}
                    color={getPriorityColor(appointment.priority) as any}
                    size='small'
                  />
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Billing Information */}
        <Card>
          <CardHeader title='Billing Information' />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant='body2' color='text.secondary'>
                  Total Amount
                </Typography>
                <Typography variant='h6' color='primary.main'>
                  {formatCurrency(appointment.totalAmount || 0)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='body2' color='text.secondary'>
                  Paid Amount
                </Typography>
                <Typography variant='h6' color='success.main'>
                  {formatCurrency(appointment.paidAmount || 0)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='body2' color='text.secondary'>
                  Balance
                </Typography>
                <Typography
                  variant='h6'
                  color={
                    (appointment.balance || 0) > 0
                      ? 'error.main'
                      : 'success.main'
                  }
                >
                  {formatCurrency(appointment.balance || 0)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='body2' color='text.secondary'>
                  Payment Status
                </Typography>
                <Chip
                  label={appointment.isPaid ? 'Paid' : 'Pending'}
                  color={appointment.isPaid ? 'success' : 'warning'}
                  size='small'
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Additional Information */}
        {(appointment.notes || appointment.reason || appointment.symptoms) && (
          <Card>
            <CardHeader title='Additional Information' />
            <CardContent>
              {appointment.reason && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Reason for Visit
                  </Typography>
                  <Typography variant='body2'>{appointment.reason}</Typography>
                </Box>
              )}
              {appointment.symptoms && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Symptoms
                  </Typography>
                  <Typography variant='body2'>
                    {appointment.symptoms}
                  </Typography>
                </Box>
              )}
              {appointment.notes && (
                <Box>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Notes
                  </Typography>
                  <Typography variant='body2'>{appointment.notes}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Enhanced Cancel Appointment Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Warning sx={{ color: 'warning.main' }} />
            </Box>
            <Typography variant='h6' fontWeight={600}>
              Cancel Appointment
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Please provide a reason for cancelling this appointment. This
            information will be recorded for administrative purposes.
          </Typography>
          <TextField
            autoFocus
            label='Reason for Cancellation'
            fullWidth
            variant='outlined'
            multiline
            rows={4}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder='Enter the reason for cancelling this appointment...'
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setCancelDialogOpen(false)}
            variant='outlined'
            sx={{ borderRadius: 2 }}
          >
            Keep Appointment
          </Button>
          <Button
            onClick={confirmCancelAppointment}
            variant='contained'
            color='warning'
            disabled={
              !cancelReason.trim() || cancelAppointmentMutation.isPending
            }
            sx={{ borderRadius: 2 }}
          >
            {cancelAppointmentMutation.isPending
              ? 'Cancelling...'
              : 'Cancel Appointment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Delete Appointment Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.error.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Error sx={{ color: 'error.main' }} />
            </Box>
            <Typography variant='h6' fontWeight={600}>
              Delete Appointment
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity='error' sx={{ mb: 2, borderRadius: 2 }}>
            <Typography variant='body2' fontWeight={600}>
              Warning: This action cannot be undone.
            </Typography>
          </Alert>
          <Typography variant='body1'>
            Are you sure you want to permanently delete this appointment? This
            will remove all associated data including billing information and
            patient records.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            variant='outlined'
            sx={{ borderRadius: 2 }}
          >
            Keep Appointment
          </Button>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            variant='contained'
            color='error'
            sx={{ borderRadius: 2 }}
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AppointmentDetailsPage;
