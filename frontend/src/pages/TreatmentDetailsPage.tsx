import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Skeleton,
  Paper,
  Container,
  Fade,
  Divider,
  Avatar,
  useTheme,
  alpha,
  Stack,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  MoreVert,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Person,
  LocalHospital,
  Link as LinkIcon,
  Medication,
  MedicalServices,
  AccessTime,
  Assignment,
  Favorite,
  Psychology,
  Healing,
  TrendingUp,
  Schedule,
  Group,
  Notes,
  Emergency,
  Pause,
  Cancel,
  PlayArrow,
  BarChart,
} from '@mui/icons-material';
import { treatmentService } from '../services/treatment.service';
import { staffService } from '../services/staff.service';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/context/ToastContext';
import { formatDate, getInitials } from '@/utils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`treatment-tabpanel-${index}`}
      aria-labelledby={`treatment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const TreatmentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const { showSuccess, showError } = useToast();

  const {
    canViewTreatments,
    canUpdateTreatments,
    canDeleteTreatments,
    canUpdateTreatmentStatus,
    canManageTreatmentLinks,
  } = usePermissions();

  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  // Transfer form state
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [providerSearch, setProviderSearch] = useState<string>('');

  // Edit form state
  const [editForm, setEditForm] = useState<any>({
    title: '',
    description: '',
    treatmentType: '',
    priority: '',
    chiefComplaint: '',
    historyOfPresentIllness: '',
    pastMedicalHistory: '',
    allergies: '',
    medications: '',
  });

  // Link form state
  const [linkForm, setLinkForm] = useState({
    toTreatmentId: '',
    linkType: 'FOLLOW_UP',
    linkReason: '',
    notes: '',
  });
  const [treatmentSearch, setTreatmentSearch] = useState<string>('');

  // Fetch treatment details
  const {
    data: treatment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['treatment', id],
    queryFn: () => treatmentService.getTreatmentById(id!),
    enabled: !!id && canViewTreatments(),
  });

  // Fetch treatment links
  const { data: treatmentLinks } = useQuery({
    queryKey: ['treatment-links', id],
    queryFn: () => treatmentService.getTreatmentLinks(id!),
    enabled: !!id && canViewTreatments(),
  });

  // Fetch service providers for transfer
  const { data: serviceProvidersData } = useQuery({
    queryKey: ['service-providers', providerSearch],
    queryFn: () =>
      staffService.getServiceProviders({
        search: providerSearch,
        isActive: true,
        limit: 50,
      }),
    enabled: transferDialogOpen,
  });

  const serviceProviders = serviceProvidersData?.data || [];

  // Fetch patient treatments for linking
  const { data: patientTreatmentsData } = useQuery({
    queryKey: ['patient-treatments', treatment?.patientId],
    queryFn: () =>
      treatmentService.getTreatments({
        patientId: treatment?.patientId,
        limit: 100,
      } as any),
    enabled: linkDialogOpen && !!treatment?.patientId,
  });

  const patientTreatments = patientTreatmentsData?.data || [];

  // Delete treatment mutation
  const deleteTreatmentMutation = useMutation({
    mutationFn: () => treatmentService.deleteTreatment(id!),
    onSuccess: () => {
      showSuccess('Treatment deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      navigate('/treatments');
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to delete treatment');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: string) =>
      treatmentService.updateTreatmentStatus(id!, status as any),
    onSuccess: () => {
      showSuccess('Treatment status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['treatment', id] });
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      queryClient.invalidateQueries({
        queryKey: ['treatments', 'appointment', treatment?.appointmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['sidebar-transferred-count'],
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard-transferred-treatments'],
      });
      setStatusMenuAnchor(null);
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to update treatment status');
    },
  });

  // Transfer treatment mutation
  const transferTreatmentMutation = useMutation({
    mutationFn: () =>
      treatmentService.transferTreatment(id!, {
        newProviderId: selectedProvider,
        reason: transferReason,
        notes: transferNotes || undefined,
      }),
    onSuccess: () => {
      showSuccess('Treatment transferred successfully');
      queryClient.invalidateQueries({ queryKey: ['treatment', id] });
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      setTransferDialogOpen(false);
      resetTransferForm();
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to transfer treatment');
    },
  });

  // Update treatment mutation
  const updateTreatmentMutation = useMutation({
    mutationFn: (data: any) => treatmentService.updateTreatment(id!, data),
    onSuccess: () => {
      showSuccess('Treatment updated successfully');
      queryClient.invalidateQueries({ queryKey: ['treatment', id] });
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      queryClient.invalidateQueries({
        queryKey: ['treatments', 'appointment', treatment?.appointmentId],
      });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to update treatment');
    },
  });

  // Link treatment mutation
  const linkTreatmentMutation = useMutation({
    mutationFn: (data: any) => treatmentService.createTreatmentLink(data),
    onSuccess: () => {
      showSuccess('Treatment linked successfully');
      queryClient.invalidateQueries({ queryKey: ['treatment-links', id] });
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      setLinkDialogOpen(false);
      setLinkForm({
        toTreatmentId: '',
        linkType: 'FOLLOW_UP',
        linkReason: '',
        notes: '',
      });
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to link treatment');
    },
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setActionMenuAnchor(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setStatusMenuAnchor(event.currentTarget);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
  };

  const handleEdit = () => {
    if (treatment) {
      setEditForm({
        title: treatment.title || '',
        description: treatment.description || '',
        treatmentType: treatment.treatmentType || '',
        priority: treatment.priority || '',
        chiefComplaint: treatment.chiefComplaint || '',
        historyOfPresentIllness: treatment.historyOfPresentIllness || '',
        pastMedicalHistory: treatment.pastMedicalHistory || '',
        allergies: treatment.allergies || '',
        medications: treatment.medications || '',
      });
      setEditDialogOpen(true);
    }
    handleActionMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleActionMenuClose();
  };

  const confirmDelete = () => {
    deleteTreatmentMutation.mutate();
    setDeleteDialogOpen(false);
  };

  const handleUpdateStatus = (status: string) => {
    updateStatusMutation.mutate(status);
  };

  const handleLinkTreatment = () => {
    setLinkDialogOpen(true);
    handleActionMenuClose();
  };

  const handleLinkSubmit = () => {
    if (!linkForm.toTreatmentId) {
      showError('Please select a treatment to link to');
      return;
    }
    linkTreatmentMutation.mutate({
      fromTreatmentId: id,
      ...linkForm,
    });
  };

  const handleTransferOpen = () => {
    setTransferDialogOpen(true);
    handleActionMenuClose();
  };

  const handleTransferClose = () => {
    setTransferDialogOpen(false);
    resetTransferForm();
  };

  const resetTransferForm = () => {
    setSelectedProvider('');
    setTransferReason('');
    setTransferNotes('');
    setProviderSearch('');
  };

  const handleTransferSubmit = () => {
    if (!selectedProvider) {
      showError('Please select a provider to transfer to');
      return;
    }
    if (!transferReason) {
      showError('Please provide a reason for transfer');
      return;
    }
    transferTreatmentMutation.mutate();
  };

  const handleEditSubmit = () => {
    if (!editForm.title?.trim()) {
      showError('Please provide a title for the treatment');
      return;
    }
    updateTreatmentMutation.mutate(editForm);
  };

  const formatStatusLabel = (status: string): string => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'SUSPENDED':
        return 'On Hold';
      case 'TRANSFERRED':
        return 'Transferred';
      default:
        return status;
    }
  };

  const getTreatmentStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { color: 'success', bg: theme.palette.success.main };
      case 'COMPLETED':
        return { color: 'info', bg: theme.palette.info.main };
      case 'CANCELLED':
        return { color: 'error', bg: theme.palette.error.main };
      case 'SUSPENDED':
        return { color: 'warning', bg: theme.palette.warning.main };
      case 'TRANSFERRED':
        return { color: 'default', bg: theme.palette.grey[500] };
      default:
        return { color: 'default', bg: theme.palette.grey[500] };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY':
        return {
          color: 'error',
          bg: theme.palette.error.main,
          icon: <Emergency />,
        };
      case 'URGENT':
        return {
          color: 'warning',
          bg: theme.palette.warning.main,
          icon: <Warning />,
        };
      case 'ROUTINE':
        return {
          color: 'default',
          bg: theme.palette.grey[600],
          icon: <Schedule />,
        };
      case 'FOLLOW_UP':
        return {
          color: 'info',
          bg: theme.palette.info.main,
          icon: <TrendingUp />,
        };
      default:
        return {
          color: 'default',
          bg: theme.palette.grey[500],
          icon: <Schedule />,
        };
    }
  };

  if (!canViewTreatments()) {
    return (
      <Container maxWidth='xl' sx={{ py: 4 }}>
        <Alert severity='error' sx={{ borderRadius: 2 }}>
          You don't have permission to view treatments. Please contact your
          administrator.
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/treatments')}
          sx={{ mt: 3 }}
          variant='outlined'
        >
          Back to Treatments
        </Button>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth='xl' sx={{ py: 4 }}>
        <Skeleton variant='rectangular' height={120} sx={{ borderRadius: 3 }} />
        <Skeleton
          variant='rectangular'
          height={60}
          sx={{ mt: 3, borderRadius: 2 }}
        />
        <Skeleton
          variant='rectangular'
          height={400}
          sx={{ mt: 3, borderRadius: 2 }}
        />
      </Container>
    );
  }

  if (error || !treatment) {
    return (
      <Container maxWidth='xl' sx={{ py: 4 }}>
        <Alert severity='error' sx={{ borderRadius: 2 }}>
          {(error as any)?.message || 'Treatment not found'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/treatments')}
          sx={{ mt: 3 }}
          variant='outlined'
        >
          Back to Treatments
        </Button>
      </Container>
    );
  }

  const statusInfo = getTreatmentStatusColor(treatment.status);
  const priorityInfo = getPriorityColor(treatment.priority);

  return (
    <Container maxWidth='xl' sx={{ py: 4 }}>
      {/* Header Section */}
      <Fade in timeout={600}>
        <Box sx={{ mb: 3 }}>
          {/* Back Button */}
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/treatments')}
            sx={{ mb: 2 }}
            variant='text'
          >
            Back to Treatments
          </Button>

          {/* Title and Actions Bar */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(
                statusInfo.bg,
                0.1
              )} 0%, ${alpha(statusInfo.bg, 0.05)} 100%)`,
              border: `1px solid ${alpha(statusInfo.bg, 0.2)}`,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(statusInfo.bg, 0.15),
                    color: statusInfo.bg,
                  }}
                >
                  <LocalHospital sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant='h4' fontWeight={700} gutterBottom>
                    {treatment.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant='body2' color='text.secondary'>
                      ID: {treatment.id.substring(0, 12)}...
                    </Typography>
                    <Typography color='text.secondary'>•</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {formatDate(treatment.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Stack direction='row' spacing={1} flexWrap='wrap'>
                {treatment.isEmergency && (
                  <Chip
                    icon={<Emergency />}
                    label='EMERGENCY'
                    color='error'
                    sx={{
                      fontWeight: 700,
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.7 },
                      },
                    }}
                  />
                )}
                <Chip
                  icon={priorityInfo.icon}
                  label={treatment.priority}
                  sx={{
                    bgcolor: alpha(priorityInfo.bg, 0.15),
                    color: priorityInfo.bg,
                    fontWeight: 600,
                    border: `1px solid ${alpha(priorityInfo.bg, 0.3)}`,
                  }}
                />
                <Chip
                  label={formatStatusLabel(treatment.status)}
                  sx={{
                    bgcolor: statusInfo.bg,
                    color: 'white',
                    fontWeight: 700,
                  }}
                />

                {canUpdateTreatmentStatus() &&
                  treatment.status !== 'COMPLETED' && (
                    <Button
                      variant='outlined'
                      size='small'
                      startIcon={<Healing />}
                      onClick={handleStatusMenuOpen}
                      sx={{ borderRadius: 2 }}
                    >
                      Update Status
                    </Button>
                  )}

                {canUpdateTreatments() && (
                  <Button
                    variant='contained'
                    size='small'
                    startIcon={<Edit />}
                    onClick={handleEdit}
                    sx={{ borderRadius: 2 }}
                  >
                    Edit
                  </Button>
                )}

                {canManageTreatmentLinks() && (
                  <Button
                    variant='outlined'
                    size='small'
                    startIcon={<LinkIcon />}
                    onClick={handleLinkTreatment}
                    sx={{ borderRadius: 2 }}
                  >
                    Link
                  </Button>
                )}

                <IconButton
                  onClick={handleActionMenuOpen}
                  size='small'
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                    },
                  }}
                >
                  <MoreVert />
                </IconButton>
              </Stack>
            </Box>

            {/* Progress indicator for active treatments */}
            {treatment.status === 'ACTIVE' && (
              <Box sx={{ mt: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant='caption' color='text.secondary'>
                    Treatment in progress
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {Math.floor(
                      (new Date().getTime() -
                        new Date(treatment.startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{' '}
                    days
                  </Typography>
                </Box>
                <LinearProgress
                  variant='indeterminate'
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha(statusInfo.bg, 0.2),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: statusInfo.bg,
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>
            )}
          </Paper>
        </Box>
      </Fade>

      {/* Tabs Navigation */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant='scrollable'
          scrollButtons='auto'
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
            },
          }}
        >
          <Tab icon={<Assignment />} iconPosition='start' label='Overview' />
          <Tab
            icon={<Psychology />}
            iconPosition='start'
            label='Clinical Info'
          />
          <Tab icon={<Group />} iconPosition='start' label='Treatment Team' />
          <Tab icon={<AccessTime />} iconPosition='start' label='Timeline' />
          <Tab
            icon={<LinkIcon />}
            iconPosition='start'
            label='Linked Treatments'
          />
          <Tab icon={<BarChart />} iconPosition='start' label='Statistics' />
        </Tabs>
      </Paper>

      {/* Tab Content */}

      {/* Tab 1: Overview */}
      <TabPanel value={currentTab} index={0}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
          }}
        >
          {/* Patient Card */}
          <Card
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.3s',
              '&:hover': {
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                transform: 'translateY(-4px)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 3,
                }}
              >
                <Person sx={{ color: 'primary.main', fontSize: 24 }} />
                <Typography variant='h6' fontWeight={600}>
                  Patient Information
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 3,
                }}
              >
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: 'primary.main',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                  }}
                >
                  {getInitials(
                    `${treatment.patient?.firstName || ''} ${
                      treatment.patient?.lastName || ''
                    }`
                  )}
                </Avatar>
                <Box>
                  <Typography variant='h6' fontWeight={600}>
                    {treatment.patient?.firstName} {treatment.patient?.lastName}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Patient ID: {treatment.patient?.patientId}
                  </Typography>
                  <Typography
                    variant='caption'
                    sx={{
                      color: 'primary.main',
                      bgcolor: 'primary.50',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      display: 'inline-block',
                      mt: 0.5,
                    }}
                  >
                    {treatment.patient?.gender}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              {treatment.patient?.phoneNumber && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      bgcolor: 'primary.50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography fontSize='small' color='primary.main'>
                      📞
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      display='block'
                    >
                      Phone
                    </Typography>
                    <Typography variant='body2' fontWeight={500}>
                      {treatment.patient.phoneNumber}
                    </Typography>
                  </Box>
                </Box>
              )}
              {treatment.patient?.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      bgcolor: 'primary.50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography fontSize='small' color='primary.main'>
                      ✉️
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      display='block'
                    >
                      Email
                    </Typography>
                    <Typography variant='body2' fontWeight={500}>
                      {treatment.patient.email}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Primary Provider Card */}
          <Card
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.3s',
              '&:hover': {
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                transform: 'translateY(-4px)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 3,
                }}
              >
                <LocalHospital sx={{ color: 'success.main', fontSize: 24 }} />
                <Typography variant='h6' fontWeight={600}>
                  Primary Provider
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 3,
                }}
              >
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: 'success.main',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                  }}
                >
                  {getInitials(
                    `${treatment.primaryProvider?.firstName || ''} ${
                      treatment.primaryProvider?.lastName || ''
                    }`
                  )}
                </Avatar>
                <Box>
                  <Typography variant='h6' fontWeight={600}>
                    Dr. {treatment.primaryProvider?.firstName}{' '}
                    {treatment.primaryProvider?.lastName}
                  </Typography>
                  {treatment.primaryProvider?.specialization && (
                    <Typography variant='body2' color='text.secondary'>
                      {treatment.primaryProvider.specialization}
                    </Typography>
                  )}
                  {treatment.primaryProvider?.licenseNumber && (
                    <Typography
                      variant='caption'
                      sx={{
                        color: 'success.main',
                        bgcolor: 'success.50',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        display: 'inline-block',
                        mt: 0.5,
                      }}
                    >
                      License: {treatment.primaryProvider.licenseNumber}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Treatment Details Card - Full Width */}
          <Card
            sx={{
              gridColumn: { xs: '1', md: '1 / -1' },
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderBottom: `1px solid ${theme.palette.divider}`,
                p: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Assignment sx={{ color: 'primary.main', fontSize: 28 }} />
                <Typography variant='h5' fontWeight={600}>
                  Treatment Details
                </Typography>
              </Box>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr 1fr',
                    sm: 'repeat(4, 1fr)',
                  },
                  gap: 3,
                }}
              >
                <Box>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      border: `1px solid ${alpha(
                        theme.palette.primary.main,
                        0.1
                      )}`,
                    }}
                  >
                    <MedicalServices
                      sx={{ fontSize: 32, color: 'primary.main', mb: 1 }}
                    />
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      display='block'
                    >
                      Type
                    </Typography>
                    <Typography
                      variant='body1'
                      fontWeight={600}
                      sx={{ mt: 0.5 }}
                    >
                      {treatment.treatmentType}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(priorityInfo.bg, 0.08),
                      border: `1px solid ${alpha(priorityInfo.bg, 0.2)}`,
                    }}
                  >
                    <Box
                      sx={{
                        fontSize: 32,
                        color: priorityInfo.bg,
                        mb: 1,
                        display: 'flex',
                        justifyContent: 'center',
                      }}
                    >
                      {priorityInfo.icon}
                    </Box>
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      display='block'
                    >
                      Priority
                    </Typography>
                    <Typography
                      variant='body1'
                      fontWeight={600}
                      sx={{ mt: 0.5 }}
                    >
                      {treatment.priority}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(statusInfo.bg, 0.08),
                      border: `1px solid ${alpha(statusInfo.bg, 0.2)}`,
                    }}
                  >
                    <Healing
                      sx={{ fontSize: 32, color: statusInfo.bg, mb: 1 }}
                    />
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      display='block'
                    >
                      Status
                    </Typography>
                    <Typography
                      variant='body1'
                      fontWeight={600}
                      sx={{ mt: 0.5 }}
                    >
                      {formatStatusLabel(treatment.status)}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: treatment.isEmergency
                        ? alpha(theme.palette.error.main, 0.08)
                        : alpha(theme.palette.grey[500], 0.08),
                      border: `1px solid ${
                        treatment.isEmergency
                          ? alpha(theme.palette.error.main, 0.2)
                          : alpha(theme.palette.grey[500], 0.2)
                      }`,
                    }}
                  >
                    <Emergency
                      sx={{
                        fontSize: 32,
                        color: treatment.isEmergency
                          ? 'error.main'
                          : 'grey.500',
                        mb: 1,
                      }}
                    />
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      display='block'
                    >
                      Emergency
                    </Typography>
                    <Typography
                      variant='body1'
                      fontWeight={600}
                      sx={{ mt: 0.5 }}
                    >
                      {treatment.isEmergency ? 'Yes' : 'No'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {treatment.description && (
                <Box
                  sx={{ mt: 3, p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <Notes sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant='subtitle2' fontWeight={600}>
                      Description
                    </Typography>
                  </Box>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    lineHeight={1.8}
                  >
                    {treatment.description}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Tab 2: Clinical Information */}
      <TabPanel value={currentTab} index={1}>
        {treatment.chiefComplaint ||
        treatment.historyOfPresentIllness ||
        treatment.pastMedicalHistory ||
        treatment.allergies ||
        treatment.medications ? (
          <Stack spacing={3}>
            {treatment.chiefComplaint && (
              <Paper
                sx={{
                  p: 2.5,
                  bgcolor: alpha(theme.palette.warning.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant='subtitle2'
                  fontWeight={600}
                  color='warning.main'
                  gutterBottom
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Warning fontSize='small' />
                  Chief Complaint
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {treatment.chiefComplaint}
                </Typography>
              </Paper>
            )}

            {treatment.historyOfPresentIllness && (
              <Paper sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant='subtitle2' fontWeight={600} gutterBottom>
                  History of Present Illness
                </Typography>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  lineHeight={1.8}
                >
                  {treatment.historyOfPresentIllness}
                </Typography>
              </Paper>
            )}

            {treatment.pastMedicalHistory && (
              <Paper sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant='subtitle2' fontWeight={600} gutterBottom>
                  Past Medical History
                </Typography>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  lineHeight={1.8}
                >
                  {treatment.pastMedicalHistory}
                </Typography>
              </Paper>
            )}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 3,
              }}
            >
              {treatment.allergies && (
                <Paper
                  sx={{
                    p: 2.5,
                    bgcolor: alpha(theme.palette.error.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant='subtitle2'
                    fontWeight={600}
                    color='error.main'
                    gutterBottom
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Favorite fontSize='small' />
                    Allergies
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {treatment.allergies}
                  </Typography>
                </Paper>
              )}

              {treatment.medications && (
                <Paper
                  sx={{
                    p: 2.5,
                    bgcolor: alpha(theme.palette.success.main, 0.05),
                    border: `1px solid ${alpha(
                      theme.palette.success.main,
                      0.2
                    )}`,
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant='subtitle2'
                    fontWeight={600}
                    color='success.main'
                    gutterBottom
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Medication fontSize='small' />
                    Current Medications
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {treatment.medications}
                  </Typography>
                </Paper>
              )}
            </Box>
          </Stack>
        ) : (
          <Alert severity='info' sx={{ borderRadius: 2 }}>
            No clinical information available for this treatment.
          </Alert>
        )}
      </TabPanel>

      {/* Tab 3: Treatment Team */}
      <TabPanel value={currentTab} index={2}>
        {treatment.providers && treatment.providers.length > 0 ? (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Group sx={{ color: 'primary.main', fontSize: 24 }} />
                  <Typography variant='h6' fontWeight={600}>
                    Treatment Team
                  </Typography>
                </Box>
                <Chip
                  label={`${treatment.providers.length} Member${
                    treatment.providers.length > 1 ? 's' : ''
                  }`}
                  size='small'
                  color='primary'
                />
              </Box>
              <List sx={{ p: 0 }}>
                {treatment.providers.map((tp: any, index: number) => (
                  <React.Fragment key={tp.id}>
                    <ListItem sx={{ px: 0, py: 2 }}>
                      <ListItemAvatar>
                        <Badge
                          badgeContent={tp.role === 'PRIMARY' ? '★' : null}
                          color='primary'
                        >
                          <Avatar
                            sx={{
                              width: 48,
                              height: 48,
                              bgcolor:
                                tp.role === 'PRIMARY'
                                  ? 'primary.main'
                                  : 'secondary.main',
                            }}
                          >
                            {getInitials(
                              `${tp.provider?.firstName || ''} ${
                                tp.provider?.lastName || ''
                              }`
                            )}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant='body1' fontWeight={600}>
                            {tp.provider?.firstName} {tp.provider?.lastName}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                              component='span'
                              sx={{ mr: 1 }}
                            >
                              {tp.provider?.specialization || 'Provider'}
                            </Typography>
                            <Chip
                              label={tp.role}
                              size='small'
                              variant='outlined'
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                    {index < treatment.providers.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        ) : (
          <Alert severity='info' sx={{ borderRadius: 2 }}>
            No team members assigned to this treatment.
          </Alert>
        )}
      </TabPanel>

      {/* Tab 4: Timeline */}
      <TabPanel value={currentTab} index={3}>
        <Card
          sx={{
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.02
            )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}
            >
              <AccessTime sx={{ color: 'primary.main', fontSize: 24 }} />
              <Typography variant='h6' fontWeight={600}>
                Timeline
              </Typography>
            </Box>

            <Stack spacing={2}>
              {/* Treatment Started */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                </Box>
                <Box flex={1}>
                  <Typography variant='body2' fontWeight={600}>
                    Treatment Started
                  </Typography>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    display='block'
                  >
                    {new Date(treatment.startDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {new Date(treatment.startDate).toLocaleTimeString()}
                  </Typography>
                </Box>
              </Box>

              {treatment.endDate && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle sx={{ color: 'info.main', fontSize: 20 }} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant='body2' fontWeight={600}>
                      Treatment Completed
                    </Typography>
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      display='block'
                    >
                      {new Date(treatment.endDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {new Date(treatment.endDate).toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Stack>

            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant='caption' color='text.secondary'>
                Last updated: {formatDate(treatment.lastUpdated)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 5: Linked Treatments */}
      <TabPanel value={currentTab} index={4}>
        {treatmentLinks &&
        (treatmentLinks.linkedFrom.length > 0 ||
          treatmentLinks.linkedTo.length > 0) ? (
          <Stack spacing={3}>
            {treatmentLinks.linkedFrom.length > 0 && (
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant='h6'
                    fontWeight={600}
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <LinkIcon sx={{ color: 'secondary.main' }} />
                    Linked From ({treatmentLinks.linkedFrom.length})
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    {treatmentLinks.linkedFrom.map((link: any) => (
                      <Paper
                        key={link.id}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border: `1px solid ${theme.palette.divider}`,
                          '&:hover': {
                            bgcolor: 'primary.50',
                            borderColor: 'primary.main',
                            transform: 'translateX(4px)',
                          },
                        }}
                        onClick={() =>
                          navigate(`/treatments/${link.fromTreatmentId}`)
                        }
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <LinkIcon
                            sx={{ fontSize: 20, color: 'secondary.main' }}
                          />
                          <Box flex={1}>
                            <Typography variant='body1' fontWeight={600}>
                              {link.fromTreatment?.title || 'Treatment'}
                            </Typography>
                            <Chip
                              label={link.linkType}
                              size='small'
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                          <ArrowBack
                            sx={{ fontSize: 20, color: 'text.secondary' }}
                          />
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {treatmentLinks.linkedTo.length > 0 && (
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant='h6'
                    fontWeight={600}
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <LinkIcon sx={{ color: 'secondary.main' }} />
                    Linked To ({treatmentLinks.linkedTo.length})
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    {treatmentLinks.linkedTo.map((link: any) => (
                      <Paper
                        key={link.id}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border: `1px solid ${theme.palette.divider}`,
                          '&:hover': {
                            bgcolor: 'secondary.50',
                            borderColor: 'secondary.main',
                            transform: 'translateX(4px)',
                          },
                        }}
                        onClick={() =>
                          navigate(`/treatments/${link.toTreatmentId}`)
                        }
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <LinkIcon
                            sx={{ fontSize: 20, color: 'secondary.main' }}
                          />
                          <Box flex={1}>
                            <Typography variant='body1' fontWeight={600}>
                              {link.toTreatment?.title || 'Treatment'}
                            </Typography>
                            <Chip
                              label={link.linkType}
                              size='small'
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        ) : (
          <Alert severity='info' sx={{ borderRadius: 2 }}>
            No linked treatments found.
          </Alert>
        )}
      </TabPanel>

      {/* Tab 6: Statistics */}
      <TabPanel value={currentTab} index={5}>
        <Card
          sx={{
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.info.main,
              0.1
            )} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant='h6' fontWeight={600} gutterBottom>
              Quick Stats
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                gap: 3,
                mt: 2,
              }}
            >
              <Box>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    border: `1px solid ${alpha(
                      theme.palette.primary.main,
                      0.2
                    )}`,
                  }}
                >
                  <Typography
                    variant='h3'
                    fontWeight={700}
                    color='primary.main'
                  >
                    {treatment.diagnoses?.length || 0}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mt: 1 }}
                  >
                    Diagnoses
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.08),
                    border: `1px solid ${alpha(
                      theme.palette.success.main,
                      0.2
                    )}`,
                  }}
                >
                  <Typography
                    variant='h3'
                    fontWeight={700}
                    color='success.main'
                  >
                    {treatment.prescriptions?.length || 0}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mt: 1 }}
                  >
                    Prescriptions
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  }}
                >
                  <Typography variant='h3' fontWeight={700} color='info.main'>
                    {treatment.labRequests?.length || 0}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mt: 1 }}
                  >
                    Lab Tests
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.secondary.main, 0.08),
                    border: `1px solid ${alpha(
                      theme.palette.secondary.main,
                      0.2
                    )}`,
                  }}
                >
                  <Typography
                    variant='h3'
                    fontWeight={700}
                    color='secondary.main'
                  >
                    {treatment.procedures?.length || 0}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mt: 1 }}
                  >
                    Procedures
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* More Actions Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
        }}
      >
        {canUpdateTreatments() && (
          <MenuItem onClick={handleTransferOpen}>
            <ListItemIcon>
              <Group fontSize='small' color='primary' />
            </ListItemIcon>
            <Typography>Transfer Treatment</Typography>
          </MenuItem>
        )}
        {canDeleteTreatments() && (
          <>
            <Divider />
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <Delete fontSize='small' color='error' />
              </ListItemIcon>
              <Typography>Delete Treatment</Typography>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Status Update Menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            minWidth: 200,
          },
        }}
      >
        <MenuItem onClick={() => handleUpdateStatus('ACTIVE')}>
          <ListItemIcon>
            <PlayArrow fontSize='small' color='success' />
          </ListItemIcon>
          <Typography>Mark Active</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleUpdateStatus('SUSPENDED')}>
          <ListItemIcon>
            <Pause fontSize='small' color='warning' />
          </ListItemIcon>
          <Typography>Put On Hold</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleUpdateStatus('COMPLETED')}>
          <ListItemIcon>
            <CheckCircle fontSize='small' color='info' />
          </ListItemIcon>
          <Typography>Mark Completed</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleUpdateStatus('CANCELLED')}>
          <ListItemIcon>
            <Cancel fontSize='small' color='error' />
          </ListItemIcon>
          <Typography>Cancel Treatment</Typography>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
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
              <ErrorIcon sx={{ color: 'error.main', fontSize: 28 }} />
            </Box>
            <Typography variant='h6' fontWeight={600}>
              Delete Treatment
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity='error' sx={{ mb: 2, borderRadius: 2 }}>
            <Typography variant='body2' fontWeight={600}>
              Warning: This action cannot be undone.
            </Typography>
          </Alert>
          <Typography variant='body1' gutterBottom>
            Are you sure you want to permanently delete this treatment?
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            All associated data including diagnoses, prescriptions, lab
            requests, and procedures will be removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            variant='outlined'
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant='contained'
            color='error'
            disabled={deleteTreatmentMutation.isPending}
            sx={{ borderRadius: 2 }}
          >
            {deleteTreatmentMutation.isPending
              ? 'Deleting...'
              : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Treatment Dialog */}
      <Dialog
        open={transferDialogOpen}
        onClose={handleTransferClose}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Group sx={{ color: 'primary.main', fontSize: 28 }} />
            </Box>
            <Box flex={1}>
              <Typography variant='h6' fontWeight={600}>
                Transfer Treatment
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Transfer this treatment to another healthcare provider
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            {/* Current Provider Info */}
            <Alert severity='info' sx={{ borderRadius: 2 }}>
              <Typography variant='body2' fontWeight={600} gutterBottom>
                Current Primary Provider
              </Typography>
              <Typography variant='body2'>
                Dr. {treatment?.primaryProvider?.firstName}{' '}
                {treatment?.primaryProvider?.lastName}
                {treatment?.primaryProvider?.specialization && (
                  <Typography
                    component='span'
                    variant='body2'
                    color='text.secondary'
                  >
                    {' '}
                    - {treatment.primaryProvider.specialization}
                  </Typography>
                )}
              </Typography>
            </Alert>

            {/* Provider Search */}
            <TextField
              fullWidth
              label='Search Provider'
              placeholder='Search by name, specialization, or employee ID'
              value={providerSearch}
              onChange={(e) => setProviderSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <LocalHospital color='action' />
                  </InputAdornment>
                ),
              }}
              sx={{ borderRadius: 2 }}
            />

            {/* Provider Selection */}
            <FormControl fullWidth required>
              <InputLabel>Select New Provider</InputLabel>
              <Select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                label='Select New Provider'
                sx={{ borderRadius: 2 }}
              >
                {serviceProviders
                  .filter(
                    (provider) => provider.id !== treatment?.primaryProvider?.id
                  )
                  .map((provider) => (
                    <MenuItem key={provider.id} value={provider.id}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: 'primary.main',
                            fontSize: '0.875rem',
                          }}
                        >
                          {getInitials(
                            `${provider.user.firstName} ${provider.user.lastName}`
                          )}
                        </Avatar>
                        <Box>
                          <Typography variant='body2' fontWeight={600}>
                            Dr. {provider.user.firstName}{' '}
                            {provider.user.lastName}
                          </Typography>
                          {provider.specialization && (
                            <Typography
                              variant='caption'
                              color='text.secondary'
                              display='block'
                            >
                              {provider.specialization}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                {serviceProviders.length === 0 && (
                  <MenuItem disabled>
                    <Typography variant='body2' color='text.secondary'>
                      No providers found
                    </Typography>
                  </MenuItem>
                )}
              </Select>
            </FormControl>

            {/* Transfer Reason */}
            <FormControl fullWidth required>
              <InputLabel>Reason for Transfer</InputLabel>
              <Select
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                label='Reason for Transfer'
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value='specialist_referral'>
                  Specialist Referral Required
                </MenuItem>
                <MenuItem value='provider_unavailable'>
                  Current Provider Unavailable
                </MenuItem>
                <MenuItem value='patient_request'>Patient Request</MenuItem>
                <MenuItem value='workload_distribution'>
                  Workload Distribution
                </MenuItem>
                <MenuItem value='expertise_needed'>
                  Specific Expertise Needed
                </MenuItem>
                <MenuItem value='emergency_coverage'>
                  Emergency Coverage
                </MenuItem>
                <MenuItem value='other'>Other</MenuItem>
              </Select>
            </FormControl>

            {/* Additional Notes */}
            <TextField
              fullWidth
              multiline
              rows={4}
              label='Additional Notes (Optional)'
              placeholder='Add any additional context or information about this transfer...'
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              sx={{ borderRadius: 2 }}
            />

            {/* Warning Message */}
            <Alert severity='warning' sx={{ borderRadius: 2 }}>
              <Typography variant='body2' fontWeight={600} gutterBottom>
                Transfer Confirmation
              </Typography>
              <Typography variant='body2'>
                The new provider will become the primary provider for this
                treatment. The current provider will be added to the treatment
                team as a consulting provider.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={handleTransferClose}
            variant='outlined'
            sx={{ borderRadius: 2 }}
            disabled={transferTreatmentMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransferSubmit}
            variant='contained'
            disabled={
              !selectedProvider ||
              !transferReason ||
              transferTreatmentMutation.isPending
            }
            startIcon={<Group />}
            sx={{ borderRadius: 2 }}
          >
            {transferTreatmentMutation.isPending
              ? 'Transferring...'
              : 'Transfer Treatment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Treatment Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Edit sx={{ color: 'primary.main', fontSize: 28 }} />
            </Box>
            <Box flex={1}>
              <Typography variant='h6' fontWeight={600}>
                Edit Treatment
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Update treatment information
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            {/* Title */}
            <TextField
              fullWidth
              required
              label='Treatment Title'
              placeholder='Enter treatment title'
              value={editForm.title}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
              sx={{ borderRadius: 2 }}
            />

            {/* Description */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label='Description'
              placeholder='Enter treatment description'
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              sx={{ borderRadius: 2 }}
            />

            {/* Treatment Type and Priority */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Treatment Type</InputLabel>
                <Select
                  value={editForm.treatmentType}
                  onChange={(e) =>
                    setEditForm({ ...editForm, treatmentType: e.target.value })
                  }
                  label='Treatment Type'
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value='CONSULTATION'>Consultation</MenuItem>
                  <MenuItem value='PROCEDURE'>Procedure</MenuItem>
                  <MenuItem value='EMERGENCY'>Emergency</MenuItem>
                  <MenuItem value='SURGERY'>Surgery</MenuItem>
                  <MenuItem value='THERAPY'>Therapy</MenuItem>
                  <MenuItem value='REHABILITATION'>Rehabilitation</MenuItem>
                  <MenuItem value='PREVENTIVE'>Preventive</MenuItem>
                  <MenuItem value='DIAGNOSTIC'>Diagnostic</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={editForm.priority}
                  onChange={(e) =>
                    setEditForm({ ...editForm, priority: e.target.value })
                  }
                  label='Priority'
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value='ROUTINE'>Routine</MenuItem>
                  <MenuItem value='URGENT'>Urgent</MenuItem>
                  <MenuItem value='EMERGENCY'>Emergency</MenuItem>
                  <MenuItem value='ELECTIVE'>Elective</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Chief Complaint */}
            <TextField
              fullWidth
              multiline
              rows={2}
              label='Chief Complaint'
              placeholder='Main reason for treatment'
              value={editForm.chiefComplaint}
              onChange={(e) =>
                setEditForm({ ...editForm, chiefComplaint: e.target.value })
              }
              sx={{ borderRadius: 2 }}
            />

            {/* History of Present Illness */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label='History of Present Illness'
              placeholder='Detailed history of the current condition'
              value={editForm.historyOfPresentIllness}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  historyOfPresentIllness: e.target.value,
                })
              }
              sx={{ borderRadius: 2 }}
            />

            {/* Past Medical History */}
            <TextField
              fullWidth
              multiline
              rows={2}
              label='Past Medical History'
              placeholder='Previous medical conditions and treatments'
              value={editForm.pastMedicalHistory}
              onChange={(e) =>
                setEditForm({ ...editForm, pastMedicalHistory: e.target.value })
              }
              sx={{ borderRadius: 2 }}
            />

            {/* Allergies */}
            <TextField
              fullWidth
              label='Allergies'
              placeholder='Known allergies'
              value={editForm.allergies}
              onChange={(e) =>
                setEditForm({ ...editForm, allergies: e.target.value })
              }
              sx={{ borderRadius: 2 }}
            />

            {/* Medications */}
            <TextField
              fullWidth
              multiline
              rows={2}
              label='Current Medications'
              placeholder='List of current medications'
              value={editForm.medications}
              onChange={(e) =>
                setEditForm({ ...editForm, medications: e.target.value })
              }
              sx={{ borderRadius: 2 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            variant='outlined'
            sx={{ borderRadius: 2 }}
            disabled={updateTreatmentMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditSubmit}
            variant='contained'
            disabled={!editForm.title || updateTreatmentMutation.isPending}
            startIcon={<Edit />}
            sx={{ borderRadius: 2 }}
          >
            {updateTreatmentMutation.isPending
              ? 'Updating...'
              : 'Update Treatment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Link Treatment Dialog */}
      <Dialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.info.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LinkIcon sx={{ color: 'info.main', fontSize: 28 }} />
            </Box>
            <Box flex={1}>
              <Typography variant='h6' fontWeight={600}>
                Link Treatment
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Create a link between this and another treatment
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            {/* Current Treatment Info */}
            <Alert severity='info' sx={{ borderRadius: 2 }}>
              <Typography variant='body2' fontWeight={600} gutterBottom>
                Current Treatment
              </Typography>
              <Typography variant='body2'>
                {treatment?.title}
                <Typography
                  component='span'
                  variant='body2'
                  color='text.secondary'
                >
                  {' '}
                  - {treatment?.treatmentType}
                </Typography>
              </Typography>
            </Alert>

            {/* Treatment Search */}
            <TextField
              fullWidth
              label='Search Treatment'
              placeholder='Search by title or type'
              value={treatmentSearch}
              onChange={(e) => setTreatmentSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <LocalHospital color='action' />
                  </InputAdornment>
                ),
              }}
              sx={{ borderRadius: 2 }}
            />

            {/* Treatment Selection */}
            <FormControl fullWidth required>
              <InputLabel>Select Treatment to Link</InputLabel>
              <Select
                value={linkForm.toTreatmentId}
                onChange={(e) =>
                  setLinkForm({ ...linkForm, toTreatmentId: e.target.value })
                }
                label='Select Treatment to Link'
                sx={{ borderRadius: 2 }}
              >
                {patientTreatments
                  .filter((t) => t.id !== id)
                  .filter(
                    (t) =>
                      !treatmentSearch ||
                      t.title
                        ?.toLowerCase()
                        .includes(treatmentSearch.toLowerCase()) ||
                      t.treatmentType
                        ?.toLowerCase()
                        .includes(treatmentSearch.toLowerCase())
                  )
                  .map((patientTreatment) => (
                    <MenuItem
                      key={patientTreatment.id}
                      value={patientTreatment.id}
                    >
                      <Box>
                        <Typography variant='body2' fontWeight={600}>
                          {patientTreatment.title}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {patientTreatment.treatmentType} -{' '}
                          {formatStatusLabel(patientTreatment.status)} -{' '}
                          {formatDate(patientTreatment.createdAt)}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                {(patientTreatments.length === 0 ||
                  patientTreatments.filter((t) => t.id !== id).length ===
                    0) && (
                  <MenuItem disabled>
                    <Typography variant='body2' color='text.secondary'>
                      No other treatments found for this patient
                    </Typography>
                  </MenuItem>
                )}
              </Select>
            </FormControl>

            {/* Link Type */}
            <FormControl fullWidth required>
              <InputLabel>Link Type</InputLabel>
              <Select
                value={linkForm.linkType}
                onChange={(e) =>
                  setLinkForm({ ...linkForm, linkType: e.target.value })
                }
                label='Link Type'
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value='FOLLOW_UP'>Follow-up</MenuItem>
                <MenuItem value='ESCALATION'>Escalation</MenuItem>
                <MenuItem value='REFERRAL'>Referral</MenuItem>
                <MenuItem value='CONTINUATION'>Continuation</MenuItem>
                <MenuItem value='PREPROCEDURE'>Pre-procedure</MenuItem>
                <MenuItem value='POSTPROCEDURE'>Post-procedure</MenuItem>
                <MenuItem value='SERIES'>Series</MenuItem>
                <MenuItem value='PARALLEL'>Parallel</MenuItem>
              </Select>
            </FormControl>

            {/* Link Reason */}
            <TextField
              fullWidth
              label='Link Reason (Optional)'
              placeholder='Why are you linking these treatments?'
              value={linkForm.linkReason}
              onChange={(e) =>
                setLinkForm({ ...linkForm, linkReason: e.target.value })
              }
              sx={{ borderRadius: 2 }}
            />

            {/* Additional Notes */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label='Additional Notes (Optional)'
              placeholder='Add any additional context...'
              value={linkForm.notes}
              onChange={(e) =>
                setLinkForm({ ...linkForm, notes: e.target.value })
              }
              sx={{ borderRadius: 2 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setLinkDialogOpen(false)}
            variant='outlined'
            sx={{ borderRadius: 2 }}
            disabled={linkTreatmentMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLinkSubmit}
            variant='contained'
            disabled={
              !linkForm.toTreatmentId || linkTreatmentMutation.isPending
            }
            startIcon={<LinkIcon />}
            sx={{ borderRadius: 2 }}
          >
            {linkTreatmentMutation.isPending ? 'Linking...' : 'Link Treatment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TreatmentDetailsPage;
