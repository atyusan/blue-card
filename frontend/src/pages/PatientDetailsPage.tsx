import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Avatar,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Stack,
  IconButton,
  Badge,
  LinearProgress,
  Tooltip,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Person,
  Phone,
  Email,
  LocationOn,
  ContactEmergency,
  MedicalServices,
  Receipt,
  Edit,
  Delete,
  Add,
  Schedule,
  CalendarToday,
  AttachMoney,
  LocalHospital,
  History,
  MoreVert,
  Print,
  Info,
  Share,
  Download,
  TrendingUp,
  AccessTime,
  CheckCircle,
  Warning,
  Error,
  Star,
  Favorite,
  Notifications,
  Security,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import { patientService } from '../services/patient.service';
import { appointmentService } from '../services/appointment.service';
import { invoiceService } from '../services/invoice.service';
import {
  formatDate,
  formatCurrency,
  getInitials,
  calculateAge,
} from '../utils';
import toast from 'react-hot-toast';

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
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PatientDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [medicalHistoryDialogOpen, setMedicalHistoryDialogOpen] =
    useState(false);
  const [newMedicalEntry, setNewMedicalEntry] = useState('');

  // Fetch patient data
  const {
    data: patient,
    isLoading: isLoadingPatient,
    isError: isPatientError,
    refetch: refetchPatient,
  } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.getPatientById(id!),
    enabled: !!id,
  });

  // Fetch patient appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['patient-appointments', id],
    queryFn: () => appointmentService.getPatientAppointments(id!),
    enabled: !!id,
  });

  // Fetch patient invoices
  const { data: invoicesResponse, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['patient-invoices', id],
    queryFn: () => invoiceService.getInvoices({ patientId: id }),
    enabled: !!id,
  });

  // Extract invoices from response - now properly paginated
  const invoices = invoicesResponse?.data || [];

  // Fetch medical history
  const { data: medicalHistory, isLoading: isLoadingMedicalHistory } = useQuery(
    {
      queryKey: ['patient-medical-history', id],
      queryFn: () => patientService.getPatientMedicalHistory(id!),
      enabled: !!id,
    }
  );

  // Delete patient mutation
  const deletePatientMutation = useMutation({
    mutationFn: patientService.deletePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient deleted successfully');
      navigate('/patients');
    },
    onError: (error) => {
      console.error('Delete patient error:', error);
      toast.error('Failed to delete patient');
    },
  });

  // Add medical history mutation
  const addMedicalHistoryMutation = useMutation({
    mutationFn: (entry: any) =>
      patientService.addMedicalHistoryEntry(id!, entry),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['patient-medical-history', id],
      });
      toast.success('Medical history entry added');
      setMedicalHistoryDialogOpen(false);
      setNewMedicalEntry('');
    },
    onError: (error) => {
      console.error('Add medical history error:', error);
      toast.error('Failed to add medical history entry');
    },
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEdit = () => {
    navigate(`/patients/${id}/edit`);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (id) {
      deletePatientMutation.mutate(id);
    }
  };

  const handleNewAppointment = () => {
    navigate(`/appointments/create?patientId=${id}`);
  };

  const handleNewInvoice = () => {
    navigate(`/billing/create?patientId=${id}`);
  };

  const handleAddMedicalHistory = () => {
    if (newMedicalEntry.trim()) {
      addMedicalHistoryMutation.mutate({
        entry: newMedicalEntry,
        date: new Date().toISOString(),
        type: 'note',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const getAppointmentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  // Loading state
  if (isLoadingPatient) {
    return (
      <Box>
        <PageHeader
          title='Patient Details'
          breadcrumbs={<Breadcrumb />}
          showActions={false}
        />
        <Box className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          <Box className='md:col-span-1'>
            <Card>
              <CardContent>
                <Skeleton variant='circular' width={80} height={80} />
                <Skeleton variant='text' height={40} />
                <Skeleton variant='text' height={20} />
              </CardContent>
            </Card>
          </Box>
          <Box className='md:col-span-3'>
            <Card>
              <CardContent>
                <Skeleton variant='text' height={40} />
                <Skeleton variant='rectangular' height={200} />
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    );
  }

  // Error state
  if (isPatientError || !patient) {
    return (
      <Box>
        <PageHeader
          title='Patient Details'
          breadcrumbs={<Breadcrumb />}
          showActions={false}
        />
        <Alert
          severity='error'
          action={
            <Button
              color='inherit'
              size='small'
              onClick={() => refetchPatient()}
            >
              Retry
            </Button>
          }
        >
          Failed to load patient details. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`${patient.firstName} ${patient.lastName}`}
        subtitle='Patient information and medical history'
        breadcrumbs={<Breadcrumb />}
        actions={
          <Box display='flex' gap={1} flexWrap='wrap'>
            <Tooltip title='Schedule new appointment'>
              <Button
                variant='contained'
                startIcon={<Schedule />}
                onClick={handleNewAppointment}
                sx={{
                  background:
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  },
                }}
              >
                New Appointment
              </Button>
            </Tooltip>
            <Tooltip title='Create new invoice'>
              <Button
                variant='contained'
                startIcon={<Receipt />}
                onClick={handleNewInvoice}
                sx={{
                  background:
                    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #ee82f9 0%, #f3455a 100%)',
                  },
                }}
              >
                New Invoice
              </Button>
            </Tooltip>
            <Tooltip title='Edit patient information'>
              <Button
                variant='outlined'
                startIcon={<Edit />}
                onClick={handleEdit}
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    bgcolor: 'primary.50',
                  },
                }}
              >
                Edit
              </Button>
            </Tooltip>
            <Tooltip title='Delete patient'>
              <Button
                variant='outlined'
                color='error'
                startIcon={<Delete />}
                onClick={handleDelete}
                sx={{
                  borderColor: 'error.main',
                  color: 'error.main',
                  '&:hover': {
                    borderColor: 'error.dark',
                    bgcolor: 'error.50',
                  },
                }}
              >
                Delete
              </Button>
            </Tooltip>
          </Box>
        }
        showActions={false}
      />

      <Box className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        {/* Patient Summary Card */}
        <Box className='md:col-span-1'>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative background pattern */}
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -30,
                left: -30,
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
              }}
            />

            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='flex-start'
                mb={3}
              >
                <Box>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      fontSize: '2rem',
                      bgcolor: 'rgba(255,255,255,0.2)',
                      border: '3px solid rgba(255,255,255,0.3)',
                      mb: 2,
                    }}
                  >
                    {getInitials(`${patient.firstName} ${patient.lastName}`)}
                  </Avatar>
                  <Typography variant='h5' fontWeight={700} color='white'>
                    {patient.firstName} {patient.lastName}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='rgba(255,255,255,0.8)'
                    sx={{ mb: 1 }}
                  >
                    Patient ID: {patient.id.slice(-8)}
                  </Typography>
                  <Chip
                    label={patient.status || 'Active'}
                    color={patient.status === 'Active' ? 'success' : 'default'}
                    size='small'
                    sx={{
                      bgcolor:
                        patient.status === 'Active'
                          ? 'rgba(76,175,80,0.9)'
                          : 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Box>
                  <IconButton sx={{ color: 'white' }}>
                    <MoreVert />
                  </IconButton>
                </Box>
              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.3)', mb: 3 }} />

              <Stack spacing={2}>
                <Box display='flex' alignItems='center' gap={2}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Person sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant='body2' color='rgba(255,255,255,0.8)'>
                      Age
                    </Typography>
                    <Typography variant='body1' fontWeight={600} color='white'>
                      {calculateAge(patient.dateOfBirth)} years old
                    </Typography>
                  </Box>
                </Box>

                <Box display='flex' alignItems='center' gap={2}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Person sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant='body2' color='rgba(255,255,255,0.8)'>
                      Gender
                    </Typography>
                    <Typography variant='body1' fontWeight={600} color='white'>
                      {patient.gender}
                    </Typography>
                  </Box>
                </Box>

                <Box display='flex' alignItems='center' gap={2}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Phone sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant='body2' color='rgba(255,255,255,0.8)'>
                      Phone
                    </Typography>
                    <Typography variant='body1' fontWeight={600} color='white'>
                      {patient.phoneNumber}
                    </Typography>
                  </Box>
                </Box>

                {patient.email && (
                  <Box display='flex' alignItems='center' gap={2}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Email sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant='body2' color='rgba(255,255,255,0.8)'>
                        Email
                      </Typography>
                      <Typography
                        variant='body1'
                        fontWeight={600}
                        color='white'
                      >
                        {patient.email}
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Box display='flex' alignItems='center' gap={2}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <LocationOn sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant='body2' color='rgba(255,255,255,0.8)'>
                      Address
                    </Typography>
                    <Typography variant='body1' fontWeight={600} color='white'>
                      {patient.address}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Emergency Contact Card */}
          {patient.emergencyContact && (
            <Card
              sx={{
                mt: 3,
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box display='flex' alignItems='center' gap={2} mb={2}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ContactEmergency sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Typography variant='h6' fontWeight={600} color='white'>
                    Emergency Contact
                  </Typography>
                </Box>
                <Box sx={{ pl: 6 }}>
                  <Typography
                    variant='body1'
                    fontWeight={600}
                    color='white'
                    sx={{ mb: 0.5 }}
                  >
                    {patient.emergencyContact.name}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='rgba(255,255,255,0.8)'
                    sx={{ mb: 1 }}
                  >
                    {patient.emergencyContact.relationship}
                  </Typography>
                  <Typography variant='body2' color='rgba(255,255,255,0.8)'>
                    📞 {patient.emergencyContact.phoneNumber}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Main Content */}
        <Box className='md:col-span-3'>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label='Overview' />
                <Tab label='Appointments' />
                <Tab label='Invoices' />
                <Tab label='Medical History' />
              </Tabs>
            </Box>

            {/* Overview Tab */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                {/* Statistics Cards */}
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      background:
                        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                      }}
                    />
                    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                      <Box
                        display='flex'
                        alignItems='center'
                        justifyContent='space-between'
                      >
                        <Box>
                          <Typography
                            variant='h4'
                            fontWeight={700}
                            color='white'
                          >
                            {appointments?.length || 0}
                          </Typography>
                          <Typography
                            variant='body2'
                            color='rgba(255,255,255,0.8)'
                          >
                            Total Appointments
                          </Typography>
                        </Box>
                        <CalendarToday
                          sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      background:
                        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                      }}
                    />
                    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                      <Box
                        display='flex'
                        alignItems='center'
                        justifyContent='space-between'
                      >
                        <Box>
                          <Typography
                            variant='h4'
                            fontWeight={700}
                            color='white'
                          >
                            {Array.isArray(invoices) ? invoices.length : 0}
                          </Typography>
                          <Typography
                            variant='body2'
                            color='rgba(255,255,255,0.8)'
                          >
                            Total Invoices
                          </Typography>
                        </Box>
                        <Receipt
                          sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      background:
                        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                      }}
                    />
                    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                      <Box
                        display='flex'
                        alignItems='center'
                        justifyContent='space-between'
                      >
                        <Box>
                          <Typography
                            variant='h4'
                            fontWeight={700}
                            color='white'
                          >
                            {Array.isArray(invoices)
                              ? invoices.filter((inv) => inv.status === 'PAID')
                                  .length
                              : 0}
                          </Typography>
                          <Typography
                            variant='body2'
                            color='rgba(255,255,255,0.8)'
                          >
                            Paid Invoices
                          </Typography>
                        </Box>
                        <CheckCircle
                          sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      background:
                        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                      }}
                    />
                    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                      <Box
                        display='flex'
                        alignItems='center'
                        justifyContent='space-between'
                      >
                        <Box>
                          <Typography
                            variant='h4'
                            fontWeight={700}
                            color='white'
                          >
                            {Array.isArray(invoices)
                              ? invoices
                                  .reduce(
                                    (sum, inv) => sum + (inv.totalAmount || 0),
                                    0
                                  )
                                  .toLocaleString()
                              : 0}
                          </Typography>
                          <Typography
                            variant='body2'
                            color='rgba(255,255,255,0.8)'
                          >
                            Total Spent
                          </Typography>
                        </Box>
                        <AttachMoney
                          sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Patient Information Card */}
                <Grid item xs={12}>
                  <Card
                    sx={{
                      background:
                        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -30,
                        right: -30,
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                      }}
                    />
                    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                      <Box display='flex' alignItems='center' gap={2} mb={3}>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <LocalHospital
                            sx={{ color: 'white', fontSize: 24 }}
                          />
                        </Box>
                        <Typography variant='h6' fontWeight={600} color='white'>
                          Patient Information
                        </Typography>
                      </Box>

                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <Box
                            sx={{
                              p: 2,
                              bgcolor: 'rgba(255,255,255,0.1)',
                              borderRadius: 2,
                            }}
                          >
                            <Typography
                              variant='body2'
                              color='rgba(255,255,255,0.8)'
                              sx={{ mb: 1 }}
                            >
                              Date of Birth
                            </Typography>
                            <Typography
                              variant='h6'
                              fontWeight={600}
                              color='white'
                            >
                              {formatDate(patient.dateOfBirth)}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box
                            sx={{
                              p: 2,
                              bgcolor: 'rgba(255,255,255,0.1)',
                              borderRadius: 2,
                            }}
                          >
                            <Typography
                              variant='body2'
                              color='rgba(255,255,255,0.8)'
                              sx={{ mb: 1 }}
                            >
                              Last Visit
                            </Typography>
                            <Typography
                              variant='h6'
                              fontWeight={600}
                              color='white'
                            >
                              {patient.lastVisit
                                ? formatDate(patient.lastVisit)
                                : 'Never'}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Appointments Tab */}
            <TabPanel value={tabValue} index={1}>
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={3}
                sx={{
                  p: 2,
                  bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 2,
                  color: 'blue',
                }}
              >
                <Box display='flex' alignItems='center' gap={2}>
                  <CalendarToday sx={{ fontSize: 28, color: 'blue' }} />
                  <Typography
                    variant='h6'
                    fontWeight={600}
                    sx={{ color: 'blue' }}
                  >
                    Appointments
                  </Typography>
                  <Badge
                    badgeContent={appointments?.length || 0}
                    color='error'
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: 'rgba(255,255,255,0.9)',
                        color: '#667eea',
                        fontWeight: 600,
                      },
                    }}
                  />
                </Box>
                <Button
                  variant='contained'
                  startIcon={<Add />}
                  onClick={handleNewAppointment}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'blue',
                    border: '1px solid rgba(255,255,255,0.3)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                      border: '1px solid rgba(255,255,255,0.5)',
                    },
                  }}
                >
                  New Appointment
                </Button>
              </Box>

              {/* Appointment Summary Stats */}
              {appointments && appointments.length > 0 && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography
                          variant='h6'
                          color='primary'
                          sx={{ fontWeight: 600 }}
                        >
                          {appointments.length}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          Total Appointments
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography
                          variant='h6'
                          color='success.main'
                          sx={{ fontWeight: 600 }}
                        >
                          {
                            appointments.filter(
                              (apt) => apt.status === 'COMPLETED'
                            ).length
                          }
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          Completed
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography
                          variant='h6'
                          color='warning.main'
                          sx={{ fontWeight: 600 }}
                        >
                          {
                            appointments.filter(
                              (apt) =>
                                apt.status === 'SCHEDULED' ||
                                apt.status === 'CONFIRMED'
                            ).length
                          }
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          Upcoming
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography
                          variant='h6'
                          color='error.main'
                          sx={{ fontWeight: 600 }}
                        >
                          {
                            appointments.filter(
                              (apt) => apt.priority === 'EMERGENCY'
                            ).length
                          }
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          Emergency Visits
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {isLoadingAppointments ? (
                <Skeleton variant='rectangular' height={200} />
              ) : appointments && appointments.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date & Time</TableCell>
                        <TableCell>Service</TableCell>
                        <TableCell>Provider</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {appointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            {formatDate(
                              appointment.appointmentDate ||
                                appointment.date ||
                                appointment.scheduledStart ||
                                new Date()
                            )}{' '}
                            at{' '}
                            {appointment.appointmentTime ||
                              appointment.time ||
                              (appointment.scheduledStart
                                ? new Date(
                                    appointment.scheduledStart
                                  ).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true,
                                  })
                                : 'N/A')}
                          </TableCell>
                          <TableCell>
                            {(appointment.slot as any)?.specialty ||
                              appointment.appointmentType?.replace(/_/g, ' ') ||
                              'General Consultation'}
                          </TableCell>
                          <TableCell>
                            {appointment.slot?.provider
                              ? `${
                                  (appointment.slot.provider as any).firstName
                                } ${
                                  (appointment.slot.provider as any).lastName
                                }`
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {appointment.priority && (
                              <Chip
                                label={appointment.priority}
                                color={
                                  appointment.priority === 'EMERGENCY'
                                    ? 'error'
                                    : appointment.priority === 'URGENT'
                                    ? 'warning'
                                    : 'default'
                                }
                                size='small'
                                variant='outlined'
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {appointment.duration || appointment.slot?.duration
                              ? `${
                                  appointment.duration ||
                                  appointment.slot?.duration
                                } min`
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={appointment.status}
                              color={
                                getAppointmentStatusColor(
                                  appointment.status
                                ) as any
                              }
                              size='small'
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction='row' spacing={1}>
                              <Button
                                size='small'
                                variant='outlined'
                                onClick={() =>
                                  navigate(`/appointments/${appointment.id}`)
                                }
                              >
                                View
                              </Button>
                              {appointment.notes && (
                                <Tooltip title={appointment.notes}>
                                  <IconButton size='small'>
                                    <Info />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box textAlign='center' py={4}>
                  <Typography variant='body1' color='text.secondary'>
                    No appointments found
                  </Typography>
                </Box>
              )}
            </TabPanel>

            {/* Invoices Tab */}
            <TabPanel value={tabValue} index={2}>
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={3}
                sx={{
                  p: 2,
                  bgcolor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  borderRadius: 2,
                  color: 'white',
                }}
              >
                <Box display='flex' alignItems='center' gap={2}>
                  <Receipt sx={{ fontSize: 28, color: '#4facfe' }} />
                  <Typography
                    variant='h6'
                    fontWeight={600}
                    sx={{ color: '#4facfe' }}
                  >
                    Invoices
                  </Typography>
                  <Badge
                    badgeContent={Array.isArray(invoices) ? invoices.length : 0}
                    color='error'
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: 'rgba(255,255,255,0.9)',
                        color: '#f093fb',
                        fontWeight: 600,
                      },
                    }}
                  />
                </Box>
                <Button
                  variant='contained'
                  startIcon={<Add />}
                  onClick={handleNewInvoice}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: '#4facfe',
                    border: '1px solid rgba(255,255,255,0.3)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                      border: '1px solid rgba(255,255,255,0.5)',
                    },
                  }}
                >
                  New Invoice
                </Button>
              </Box>
              {isLoadingInvoices ? (
                <Skeleton variant='rectangular' height={200} />
              ) : Array.isArray(invoices) && invoices.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Invoice #</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            {invoice.invoiceNumber || invoice.number}
                          </TableCell>
                          <TableCell>
                            {formatDate(
                              invoice.issuedDate || invoice.createdAt
                            )}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(invoice.totalAmount)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={invoice.status}
                              color={
                                getInvoiceStatusColor(invoice.status) as any
                              }
                              size='small'
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size='small'
                              onClick={() => navigate(`/billing/${invoice.id}`)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box textAlign='center' py={4}>
                  <Typography variant='body1' color='text.secondary'>
                    No invoices found
                  </Typography>
                </Box>
              )}
            </TabPanel>

            {/* Medical History Tab */}
            <TabPanel value={tabValue} index={3}>
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={3}
                sx={{
                  p: 2,
                  bgcolor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  borderRadius: 2,
                  color: 'blue',
                }}
              >
                <Box display='flex' alignItems='center' gap={2}>
                  <History sx={{ fontSize: 28, color: 'blue' }} />
                  <Typography
                    variant='h6'
                    fontWeight={600}
                    sx={{ color: 'blue' }}
                  >
                    Medical History
                  </Typography>
                  <Badge
                    badgeContent={medicalHistory?.length || 0}
                    color='error'
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: 'rgba(255,255,255,0.9)',
                        color: '#4facfe',
                        fontWeight: 600,
                      },
                    }}
                  />
                </Box>
                <Button
                  variant='contained'
                  startIcon={<Add />}
                  onClick={() => setMedicalHistoryDialogOpen(true)}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'blue',
                    border: '1px solid rgba(255,255,255,0.3)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                      border: '1px solid rgba(255,255,255,0.5)',
                    },
                  }}
                >
                  Add Entry
                </Button>
              </Box>

              {/* Current Medical Info */}
              {patient.medicalHistory && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {patient.medicalHistory.allergies && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Card
                        sx={{
                          background:
                            'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                          color: 'white',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -20,
                            right: -20,
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                          }}
                        />
                        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                          <Box display='flex' alignItems='center' gap={2}>
                            <Warning sx={{ fontSize: 24 }} />
                            <Box>
                              <Typography
                                variant='body2'
                                color='rgba(255,255,255,0.8)'
                              >
                                Allergies
                              </Typography>
                              <Typography
                                variant='h6'
                                fontWeight={600}
                                color='white'
                              >
                                {patient.medicalHistory.allergies}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                  {patient.medicalHistory.bloodGroup && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Card
                        sx={{
                          background:
                            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                          color: 'white',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -20,
                            right: -20,
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                          }}
                        />
                        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                          <Box display='flex' alignItems='center' gap={2}>
                            <LocalHospital sx={{ fontSize: 24 }} />
                            <Box>
                              <Typography
                                variant='body2'
                                color='rgba(255,255,255,0.8)'
                              >
                                Blood Group
                              </Typography>
                              <Typography
                                variant='h6'
                                fontWeight={600}
                                color='white'
                              >
                                {patient.medicalHistory.bloodGroup}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                  {patient.medicalHistory.genotype && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Card
                        sx={{
                          background:
                            'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                          color: 'white',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -20,
                            right: -20,
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                          }}
                        />
                        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                          <Box display='flex' alignItems='center' gap={2}>
                            <MedicalServices sx={{ fontSize: 24 }} />
                            <Box>
                              <Typography
                                variant='body2'
                                color='rgba(255,255,255,0.8)'
                              >
                                Genotype
                              </Typography>
                              <Typography
                                variant='h6'
                                fontWeight={600}
                                color='white'
                              >
                                {patient.medicalHistory.genotype}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                  {patient.medicalHistory.height && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Card
                        sx={{
                          background:
                            'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
                          color: 'white',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -20,
                            right: -20,
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                          }}
                        />
                        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                          <Box display='flex' alignItems='center' gap={2}>
                            <TrendingUp sx={{ fontSize: 24 }} />
                            <Box>
                              <Typography
                                variant='body2'
                                color='rgba(255,255,255,0.8)'
                              >
                                Height
                              </Typography>
                              <Typography
                                variant='h6'
                                fontWeight={600}
                                color='white'
                              >
                                {patient.medicalHistory.height}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Medical History Entries */}
              {isLoadingMedicalHistory ? (
                <Skeleton variant='rectangular' height={200} />
              ) : medicalHistory && medicalHistory.length > 0 ? (
                <Box>
                  {medicalHistory.map((entry, index) => (
                    <Card
                      key={index}
                      sx={{
                        mb: 2,
                        background:
                          'linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%)',
                        border: '1px solid #e3f2fd',
                        '&:hover': {
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                          transform: 'translateY(-2px)',
                          transition: 'all 0.3s ease',
                        },
                      }}
                    >
                      <CardContent>
                        <Box display='flex' alignItems='flex-start' gap={2}>
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: 2,
                              bgcolor: 'primary.main',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: 40,
                              height: 40,
                            }}
                          >
                            <MedicalServices sx={{ fontSize: 20 }} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant='body1'
                              fontWeight={500}
                              sx={{ mb: 1 }}
                            >
                              {entry.entry}
                            </Typography>
                            <Box display='flex' alignItems='center' gap={1}>
                              <AccessTime
                                sx={{ fontSize: 16, color: 'text.secondary' }}
                              />
                              <Typography
                                variant='body2'
                                color='text.secondary'
                              >
                                {formatDate(entry.date)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Card
                  sx={{
                    textAlign: 'center',
                    py: 6,
                    background:
                      'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    color: 'text.secondary',
                  }}
                >
                  <CardContent>
                    <MedicalServices
                      sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
                    />
                    <Typography
                      variant='h6'
                      color='text.secondary'
                      sx={{ mb: 1 }}
                    >
                      No Medical History
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      No medical history entries found for this patient
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </TabPanel>
          </Card>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Patient</DialogTitle>
        <DialogContent>
          Are you sure you want to delete {patient.firstName} {patient.lastName}
          ? This action cannot be undone and will remove all associated data.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            color='error'
            variant='contained'
            disabled={deletePatientMutation.isPending}
          >
            {deletePatientMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Medical History Dialog */}
      <Dialog
        open={medicalHistoryDialogOpen}
        onClose={() => setMedicalHistoryDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Add Medical History Entry</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            label='Medical History Entry'
            value={newMedicalEntry}
            onChange={(e) => setNewMedicalEntry(e.target.value)}
            placeholder='Enter medical history notes...'
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMedicalHistoryDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddMedicalHistory}
            variant='contained'
            disabled={
              !newMedicalEntry.trim() || addMedicalHistoryMutation.isPending
            }
          >
            {addMedicalHistoryMutation.isPending ? 'Adding...' : 'Add Entry'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientDetailsPage;
