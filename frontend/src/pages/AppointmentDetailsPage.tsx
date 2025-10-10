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
  Paper,
  Container,
  Fade,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  MoreVert,
  CalendarToday,
  CheckCircle,
  Warning,
  Error,
  Info,
  Visibility,
  Link as LinkIcon,
  LocalHospital,
  Science,
  Medication,
} from '@mui/icons-material';
import appointmentService from '../services/appointment.service';
import { treatmentService } from '../services/treatment.service';
import { useToast } from '@/context/ToastContext';
import { formatDate, formatCurrency, getInitials } from '@/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/context/AuthContext';
import type {
  CreateTreatmentDto,
  TreatmentType,
  TreatmentPriority,
  CreateTreatmentLinkDto,
  TreatmentLinkType,
} from '../types';
import {
  TreatmentType as TreatmentTypeEnum,
  TreatmentPriority as TreatmentPriorityEnum,
  TreatmentLinkType as TreatmentLinkTypeEnum,
} from '../types';

const AppointmentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const { staffMember } = useAuth();
  const { showSuccess, showError } = useToast();

  // Permission checks
  const {
    canUpdateAppointments,
    canCancelAppointments,
    canCreateTreatments,
    canViewTreatments,
    canUpdateTreatments,
    canDeleteTreatments,
    canUpdateTreatmentStatus,
    canManageTreatmentLinks,
  } = usePermissions();

  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Treatment management state
  const [createTreatmentDialogOpen, setCreateTreatmentDialogOpen] =
    useState(false);
  const [newTreatment, setNewTreatment] = useState<Partial<CreateTreatmentDto>>(
    {
      title: '',
      description: '',
      treatmentType: TreatmentTypeEnum.CONSULTATION,
      priority: TreatmentPriorityEnum.ROUTINE,
      chiefComplaint: '',
      historyOfPresentIllness: '',
      pastMedicalHistory: '',
      allergies: '',
      medications: '',
      isEmergency: false,
    }
  );

  // Treatment linking state
  const [linkTreatmentDialogOpen, setLinkTreatmentDialogOpen] = useState(false);
  const [newTreatmentLink, setNewTreatmentLink] = useState<
    Partial<CreateTreatmentLinkDto>
  >({
    toTreatmentId: '',
    linkType: TreatmentLinkTypeEnum.FOLLOW_UP,
    linkReason: '',
    notes: '',
  });

  // Treatment table pagination
  const [treatmentPage, setTreatmentPage] = useState(0);
  const [treatmentsPerPage, setTreatmentsPerPage] = useState(5);
  const [treatmentMenuAnchor, setTreatmentMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<any>(null);

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

  // Fetch treatments for this appointment
  const { data: treatmentsData, isLoading: treatmentsLoading } = useQuery({
    queryKey: ['treatments', 'appointment', id],
    queryFn: () =>
      treatmentService.getTreatments({
        appointmentId: id,
      } as any),
    enabled: !!id,
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: (cancelData: {
      appointmentId: string;
      cancellationReason: string;
    }) => appointmentService.cancelAppointment(cancelData),
    onSuccess: () => {
      showSuccess('Appointment cancelled successfully');
      setCancelDialogOpen(false);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      showError(
        error.response?.data?.message || 'Failed to cancel appointment'
      );
    },
  });

  // Create treatment mutation
  const createTreatmentMutation = useMutation({
    mutationFn: (treatmentData: CreateTreatmentDto) =>
      treatmentService.createTreatment(treatmentData),
    onSuccess: () => {
      showSuccess('Treatment created successfully!');
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      queryClient.invalidateQueries({
        queryKey: ['treatments', 'appointment', id],
      });
      setCreateTreatmentDialogOpen(false);
      setNewTreatment({
        title: '',
        description: '',
        treatmentType: TreatmentTypeEnum.CONSULTATION,
        priority: TreatmentPriorityEnum.ROUTINE,
        chiefComplaint: '',
        historyOfPresentIllness: '',
        pastMedicalHistory: '',
        allergies: '',
        medications: '',
        isEmergency: false,
      });
    },
    onError: (err) => {
      showError(`Failed to create treatment: ${err.message}`);
    },
  });

  // Create treatment link mutation
  const createTreatmentLinkMutation = useMutation({
    mutationFn: (linkData: CreateTreatmentLinkDto) =>
      treatmentService.createTreatmentLink(linkData),
    onSuccess: () => {
      showSuccess('Treatment link created successfully!');
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      queryClient.invalidateQueries({
        queryKey: ['treatments', 'appointment', id],
      });
      setLinkTreatmentDialogOpen(false);
      setNewTreatmentLink({
        toTreatmentId: '',
        linkType: TreatmentLinkTypeEnum.FOLLOW_UP,
        linkReason: '',
        notes: '',
      });
    },
    onError: (err) => {
      showError(`Failed to create treatment link: ${err.message}`);
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
      cancelAppointmentMutation.mutate({
        appointmentId: id,
        cancellationReason: cancelReason,
      });
    }
  };

  const handleCreateTreatment = () => {
    if (appointment && newTreatment.title) {
      // Use logged-in user's staff member as primary provider
      // Fallback to appointment slot provider or appointment provider if logged-in user is not a staff member
      const primaryProviderId =
        staffMember?.id ||
        appointment.slot?.provider?.id ||
        appointment.providerId ||
        '';

      if (!primaryProviderId) {
        showError(
          'Unable to determine primary provider. Please ensure you are logged in as a staff member.'
        );
        return;
      }

      const treatmentData: CreateTreatmentDto = {
        patientId: appointment.patientId,
        primaryProviderId,
        appointmentId: appointment.id,
        title: newTreatment.title,
        description: newTreatment.description,
        treatmentType:
          newTreatment.treatmentType || TreatmentTypeEnum.CONSULTATION,
        priority: newTreatment.priority,
        chiefComplaint: newTreatment.chiefComplaint,
        historyOfPresentIllness: newTreatment.historyOfPresentIllness,
        pastMedicalHistory: newTreatment.pastMedicalHistory,
        allergies: newTreatment.allergies,
        medications: newTreatment.medications,
        isEmergency: newTreatment.isEmergency || false,
      };
      createTreatmentMutation.mutate(treatmentData);
    }
  };

  const handleCreateTreatmentLink = (fromTreatmentId: string) => {
    if (newTreatmentLink.toTreatmentId && newTreatmentLink.linkType) {
      const linkData: CreateTreatmentLinkDto = {
        fromTreatmentId,
        toTreatmentId: newTreatmentLink.toTreatmentId,
        linkType: newTreatmentLink.linkType,
        linkReason: newTreatmentLink.linkReason,
        notes: newTreatmentLink.notes,
      };
      createTreatmentLinkMutation.mutate(linkData);
    }
  };

  // Treatment table handlers
  const handleTreatmentMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    treatment: any
  ) => {
    setSelectedTreatment(treatment);
    setTreatmentMenuAnchor(event.currentTarget);
  };

  const handleTreatmentMenuClose = () => {
    setTreatmentMenuAnchor(null);
    setSelectedTreatment(null);
  };

  const handleViewTreatmentDetails = () => {
    if (selectedTreatment) {
      navigate(`/treatments/${selectedTreatment.id}`);
    }
    handleTreatmentMenuClose();
  };

  const handleLinkTreatment = () => {
    if (selectedTreatment) {
      setNewTreatmentLink((prev) => ({
        ...prev,
        toTreatmentId: selectedTreatment.id,
      }));
      setLinkTreatmentDialogOpen(true);
    }
    handleTreatmentMenuClose();
  };

  const handleTreatmentPageChange = (_event: unknown, newPage: number) => {
    setTreatmentPage(newPage);
  };

  const handleTreatmentsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setTreatmentsPerPage(parseInt(event.target.value, 10));
    setTreatmentPage(0);
  };

  const getTreatmentStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'COMPLETED':
        return 'info';
      case 'CANCELLED':
        return 'error';
      case 'SUSPENDED':
        return 'warning';
      default:
        return 'default';
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

  // Check if user has permission to view appointments
  if (!canViewTreatments() && !canUpdateAppointments()) {
    return (
      <Container maxWidth='xl' sx={{ py: 3 }}>
        <Alert severity='error'>
          You don't have permission to view this page. Please contact your
          administrator.
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/appointments')}
          sx={{ mt: 2 }}
        >
          Back to Appointments
        </Button>
      </Container>
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
                  color={
                    getStatusColor(appointment.status) as
                      | 'success'
                      | 'warning'
                      | 'error'
                      | 'info'
                      | 'primary'
                      | 'secondary'
                      | 'default'
                  }
                  sx={{
                    bgcolor: alpha('#fff', 0.2),
                    color: 'white',
                    fontWeight: 600,
                    '& .MuiChip-icon': {
                      color: 'white',
                    },
                  }}
                />
                {(canUpdateAppointments() || canCancelAppointments()) && (
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
                )}
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
        {canUpdateAppointments() && (
          <MenuItem onClick={handleEditAppointment}>
            <ListItemIcon>
              <Edit fontSize='small' />
            </ListItemIcon>
            Edit Appointment
          </MenuItem>
        )}
        {canCancelAppointments() && appointment.status !== 'CANCELLED' && (
          <MenuItem onClick={handleCancelAppointment}>
            <ListItemIcon>
              <Warning fontSize='small' />
            </ListItemIcon>
            Cancel Appointment
          </MenuItem>
        )}
        {canCancelAppointments() && (
          <MenuItem
            onClick={handleDeleteAppointment}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <Delete fontSize='small' />
            </ListItemIcon>
            Delete Appointment
          </MenuItem>
        )}
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
                  `${appointment.patient?.firstName || ''} ${
                    appointment.patient?.lastName || ''
                  }`
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
                    `${appointment.slot.provider.user.firstName || ''} ${
                      appointment.slot.provider.user.lastName || ''
                    }`
                  )}
                </Avatar>
                <Box>
                  <Typography variant='h6'>
                    {appointment.slot.provider.user.firstName}{' '}
                    {appointment.slot.provider.user.lastName}
                  </Typography>
                  {appointment.slot.provider.specialization && (
                    <Typography variant='body2' color='text.secondary'>
                      {appointment.slot.provider.specialization}
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
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
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
              </Box>
              {appointment.scheduledEnd && (
                <Box sx={{ flex: 1 }}>
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
                </Box>
              )}
              <Box sx={{ flex: 1 }}>
                <Typography variant='body2' color='text.secondary'>
                  Appointment Type
                </Typography>
                <Typography variant='body1'>
                  {appointment.appointmentType?.replace(/_/g, ' ')}
                </Typography>
              </Box>
              {appointment.slot?.duration && (
                <Box sx={{ flex: 1 }}>
                  <Typography variant='body2' color='text.secondary'>
                    Duration
                  </Typography>
                  <Typography variant='body1'>
                    {appointment.slot.duration} minutes
                  </Typography>
                </Box>
              )}
              {appointment.priority && (
                <Box sx={{ flex: 1 }}>
                  <Typography variant='body2' color='text.secondary'>
                    Priority
                  </Typography>
                  <Chip
                    label={appointment.priority}
                    color={
                      getPriorityColor(appointment.priority) as
                        | 'success'
                        | 'warning'
                        | 'error'
                        | 'info'
                        | 'primary'
                        | 'secondary'
                        | 'default'
                    }
                    size='small'
                  />
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Billing Information */}
        <Card>
          <CardHeader title='Billing Information' />
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant='body2' color='text.secondary'>
                  Total Amount
                </Typography>
                <Typography variant='h6' color='primary.main'>
                  {formatCurrency(appointment.totalAmount || 0)}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant='body2' color='text.secondary'>
                  Paid Amount
                </Typography>
                <Typography variant='h6' color='success.main'>
                  {formatCurrency(appointment.paidAmount || 0)}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
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
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant='body2' color='text.secondary'>
                  Payment Status
                </Typography>
                <Chip
                  label={appointment.isPaid ? 'Paid' : 'Pending'}
                  color={appointment.isPaid ? 'success' : 'warning'}
                  size='small'
                />
              </Box>
            </Box>
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

        {/* Treatment Management Section */}
        {canViewTreatments() &&
          appointment &&
          appointment.status !== 'CANCELLED' && (
            <Card>
              <CardHeader
                title='Treatment Management'
                action={
                  canCreateTreatments() && (
                    <Button
                      variant='contained'
                      onClick={() => setCreateTreatmentDialogOpen(true)}
                      disabled={treatmentsLoading}
                    >
                      Start Treatment
                    </Button>
                  )
                }
              />
              <CardContent>
                {treatmentsLoading ? (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', py: 3 }}
                  >
                    <Typography color='text.secondary'>
                      Loading treatments...
                    </Typography>
                  </Box>
                ) : treatmentsData?.treatments &&
                  treatmentsData.treatments.length > 0 ? (
                  <>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Priority</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Provider</TableCell>
                            <TableCell>Created</TableCell>
                            <TableCell align='right'>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {treatmentsData.treatments
                            .slice(
                              treatmentPage * treatmentsPerPage,
                              treatmentPage * treatmentsPerPage +
                                treatmentsPerPage
                            )
                            .map((treatment) => (
                              <TableRow key={treatment.id} hover>
                                <TableCell>
                                  <Typography variant='body2' fontWeight={500}>
                                    {treatment.title}
                                  </Typography>
                                  {treatment.description && (
                                    <Typography
                                      variant='caption'
                                      color='text.secondary'
                                      sx={{
                                        display: 'block',
                                        mt: 0.5,
                                        maxWidth: 300,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {treatment.description}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={treatment.treatmentType}
                                    size='small'
                                    variant='outlined'
                                  />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={treatment.priority}
                                    size='small'
                                    color={
                                      getPriorityColor(
                                        treatment.priority
                                      ) as any
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={treatment.status}
                                    size='small'
                                    color={
                                      getTreatmentStatusColor(
                                        treatment.status
                                      ) as any
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant='body2'>
                                    {treatment.primaryProvider?.firstName}{' '}
                                    {treatment.primaryProvider?.lastName}
                                  </Typography>
                                  {treatment.primaryProvider
                                    ?.specialization && (
                                    <Typography
                                      variant='caption'
                                      color='text.secondary'
                                    >
                                      {treatment.primaryProvider.specialization}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Typography variant='body2'>
                                    {formatDate(treatment.createdAt)}
                                  </Typography>
                                </TableCell>
                                <TableCell align='right'>
                                  <Tooltip title='Actions'>
                                    <IconButton
                                      size='small'
                                      onClick={(e) =>
                                        handleTreatmentMenuOpen(e, treatment)
                                      }
                                    >
                                      <MoreVert fontSize='small' />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination
                      component='div'
                      count={treatmentsData.treatments.length}
                      page={treatmentPage}
                      onPageChange={handleTreatmentPageChange}
                      rowsPerPage={treatmentsPerPage}
                      onRowsPerPageChange={handleTreatmentsPerPageChange}
                      rowsPerPageOptions={[5, 10, 25]}
                    />
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography color='text.secondary' sx={{ mb: 2 }}>
                      No treatments have been started for this appointment.
                    </Typography>
                    {canCreateTreatments() && (
                      <Button
                        variant='contained'
                        onClick={() => setCreateTreatmentDialogOpen(true)}
                      >
                        Start First Treatment
                      </Button>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
      </Box>

      {/* Treatment Actions Menu */}
      <Menu
        anchorEl={treatmentMenuAnchor}
        open={Boolean(treatmentMenuAnchor)}
        onClose={handleTreatmentMenuClose}
      >
        <MenuItem onClick={handleViewTreatmentDetails}>
          <ListItemIcon>
            <Visibility fontSize='small' />
          </ListItemIcon>
          View Details
        </MenuItem>
        {canUpdateTreatments() && (
          <>
            <MenuItem>
              <ListItemIcon>
                <LocalHospital fontSize='small' />
              </ListItemIcon>
              Add Diagnosis
            </MenuItem>
            <MenuItem>
              <ListItemIcon>
                <Medication fontSize='small' />
              </ListItemIcon>
              Prescribe Medication
            </MenuItem>
            <MenuItem>
              <ListItemIcon>
                <Science fontSize='small' />
              </ListItemIcon>
              Request Lab Test
            </MenuItem>
          </>
        )}
        {canManageTreatmentLinks() && (
          <MenuItem onClick={handleLinkTreatment}>
            <ListItemIcon>
              <LinkIcon fontSize='small' />
            </ListItemIcon>
            Link Treatment
          </MenuItem>
        )}
        {canUpdateTreatmentStatus() && (
          <>
            <MenuItem divider />
            <MenuItem>
              <ListItemIcon>
                <CheckCircle fontSize='small' color='success' />
              </ListItemIcon>
              Mark Complete
            </MenuItem>
            <MenuItem>
              <ListItemIcon>
                <Warning fontSize='small' color='warning' />
              </ListItemIcon>
              Put On Hold
            </MenuItem>
          </>
        )}
        {canDeleteTreatments() && (
          <MenuItem sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <Delete fontSize='small' color='error' />
            </ListItemIcon>
            Delete Treatment
          </MenuItem>
        )}
      </Menu>

      {/* Create Treatment Dialog */}
      <Dialog
        open={createTreatmentDialogOpen}
        onClose={() => setCreateTreatmentDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Start New Treatment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label='Treatment Title'
              fullWidth
              value={newTreatment.title}
              onChange={(e) =>
                setNewTreatment((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
            <TextField
              label='Description'
              fullWidth
              multiline
              rows={3}
              value={newTreatment.description}
              onChange={(e) =>
                setNewTreatment((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label='Chief Complaint'
                fullWidth
                value={newTreatment.chiefComplaint}
                onChange={(e) =>
                  setNewTreatment((prev) => ({
                    ...prev,
                    chiefComplaint: e.target.value,
                  }))
                }
              />
              <TextField
                label='Treatment Type'
                select
                fullWidth
                value={newTreatment.treatmentType}
                onChange={(e) =>
                  setNewTreatment((prev) => ({
                    ...prev,
                    treatmentType: e.target.value as TreatmentType,
                  }))
                }
                SelectProps={{ native: true }}
              >
                <option value='CONSULTATION'>Consultation</option>
                <option value='FOLLOW_UP'>Follow-up</option>
                <option value='EMERGENCY'>Emergency</option>
                <option value='SURGERY'>Surgery</option>
                <option value='THERAPY'>Therapy</option>
                <option value='REHABILITATION'>Rehabilitation</option>
                <option value='PREVENTIVE'>Preventive</option>
                <option value='DIAGNOSTIC'>Diagnostic</option>
              </TextField>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label='Priority'
                select
                fullWidth
                value={newTreatment.priority}
                onChange={(e) =>
                  setNewTreatment((prev) => ({
                    ...prev,
                    priority: e.target.value as TreatmentPriority,
                  }))
                }
                SelectProps={{ native: true }}
              >
                <option value='ROUTINE'>Routine</option>
                <option value='URGENT'>Urgent</option>
                <option value='EMERGENCY'>Emergency</option>
                <option value='FOLLOW_UP'>Follow-up</option>
              </TextField>
              <TextField
                label='Allergies'
                fullWidth
                value={newTreatment.allergies}
                onChange={(e) =>
                  setNewTreatment((prev) => ({
                    ...prev,
                    allergies: e.target.value,
                  }))
                }
                placeholder='Known allergies'
              />
            </Box>
            <TextField
              label='Current Medications'
              fullWidth
              value={newTreatment.medications}
              onChange={(e) =>
                setNewTreatment((prev) => ({
                  ...prev,
                  medications: e.target.value,
                }))
              }
              placeholder='Current medications'
            />
            <TextField
              label='History of Present Illness'
              fullWidth
              multiline
              rows={3}
              value={newTreatment.historyOfPresentIllness}
              onChange={(e) =>
                setNewTreatment((prev) => ({
                  ...prev,
                  historyOfPresentIllness: e.target.value,
                }))
              }
            />
            <TextField
              label='Past Medical History'
              fullWidth
              multiline
              rows={2}
              value={newTreatment.pastMedicalHistory}
              onChange={(e) =>
                setNewTreatment((prev) => ({
                  ...prev,
                  pastMedicalHistory: e.target.value,
                }))
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateTreatmentDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTreatment}
            variant='contained'
            disabled={!newTreatment.title || createTreatmentMutation.isPending}
          >
            {createTreatmentMutation.isPending
              ? 'Creating...'
              : 'Start Treatment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Treatment Link Dialog */}
      <Dialog
        open={linkTreatmentDialogOpen}
        onClose={() => setLinkTreatmentDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Link Treatment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label='Link Type'
              select
              fullWidth
              value={newTreatmentLink.linkType}
              onChange={(e) =>
                setNewTreatmentLink((prev) => ({
                  ...prev,
                  linkType: e.target.value as TreatmentLinkType,
                }))
              }
              SelectProps={{ native: true }}
            >
              <option value={TreatmentLinkTypeEnum.FOLLOW_UP}>Follow-up</option>
              <option value={TreatmentLinkTypeEnum.ESCALATION}>
                Escalation
              </option>
              <option value={TreatmentLinkTypeEnum.REFERRAL}>Referral</option>
              <option value={TreatmentLinkTypeEnum.CONTINUATION}>
                Continuation
              </option>
              <option value={TreatmentLinkTypeEnum.PREPROCEDURE}>
                Pre-procedure
              </option>
              <option value={TreatmentLinkTypeEnum.POSTPROCEDURE}>
                Post-procedure
              </option>
              <option value={TreatmentLinkTypeEnum.SERIES}>Series</option>
              <option value={TreatmentLinkTypeEnum.PARALLEL}>Parallel</option>
              <option value={TreatmentLinkTypeEnum.REPLACEMENT}>
                Replacement
              </option>
              <option value={TreatmentLinkTypeEnum.CANCELLATION}>
                Cancellation
              </option>
            </TextField>
            <TextField
              label='Link Reason'
              fullWidth
              value={newTreatmentLink.linkReason}
              onChange={(e) =>
                setNewTreatmentLink((prev) => ({
                  ...prev,
                  linkReason: e.target.value,
                }))
              }
              placeholder='Reason for linking treatments'
            />
            <TextField
              label='Notes'
              fullWidth
              multiline
              rows={3}
              value={newTreatmentLink.notes}
              onChange={(e) =>
                setNewTreatmentLink((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              placeholder='Additional notes about the link'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkTreatmentDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              handleCreateTreatmentLink(newTreatmentLink.toTreatmentId || '')
            }
            variant='contained'
            disabled={
              !newTreatmentLink.toTreatmentId ||
              !newTreatmentLink.linkType ||
              createTreatmentLinkMutation.isPending
            }
          >
            {createTreatmentLinkMutation.isPending
              ? 'Linking...'
              : 'Create Link'}
          </Button>
        </DialogActions>
      </Dialog>

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
