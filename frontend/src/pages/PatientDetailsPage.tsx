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
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['patient-invoices', id],
    queryFn: () => invoiceService.getInvoices({ patientId: id }),
    enabled: !!id,
  });

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
          <Box display='flex' gap={1}>
            <Button
              variant='outlined'
              startIcon={<Schedule />}
              onClick={handleNewAppointment}
            >
              New Appointment
            </Button>
            <Button
              variant='outlined'
              startIcon={<Receipt />}
              onClick={handleNewInvoice}
            >
              New Invoice
            </Button>
            <Button
              variant='outlined'
              startIcon={<Edit />}
              onClick={handleEdit}
            >
              Edit
            </Button>
            <Button
              variant='outlined'
              color='error'
              startIcon={<Delete />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Box>
        }
        showActions={false}
      />

      <Box className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        {/* Patient Summary Card */}
        <Box className='md:col-span-1'>
          <Card>
            <CardContent>
              <Box
                display='flex'
                flexDirection='column'
                alignItems='center'
                mb={3}
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    fontSize: '2rem',
                    bgcolor:
                      patient.gender === 'MALE'
                        ? 'primary.main'
                        : 'secondary.main',
                    mb: 2,
                  }}
                >
                  {getInitials(`${patient.firstName} ${patient.lastName}`)}
                </Avatar>
                <Typography variant='h5' fontWeight={600} textAlign='center'>
                  {patient.firstName} {patient.lastName}
                </Typography>
                <Chip
                  label={patient.status || 'Active'}
                  color={getStatusColor(patient.status || 'active') as any}
                  size='small'
                  sx={{ mt: 1 }}
                />
              </Box>

              <Divider sx={{ mb: 2 }} />

              <List disablePadding>
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon>
                    <Person color='primary' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Age'
                    secondary={`${calculateAge(patient.dateOfBirth)} years old`}
                  />
                </ListItem>
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon>
                    <Person color='primary' />
                  </ListItemIcon>
                  <ListItemText primary='Gender' secondary={patient.gender} />
                </ListItem>
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon>
                    <Phone color='primary' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Phone'
                    secondary={patient.phoneNumber}
                  />
                </ListItem>
                {patient.email && (
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemIcon>
                      <Email color='primary' />
                    </ListItemIcon>
                    <ListItemText primary='Email' secondary={patient.email} />
                  </ListItem>
                )}
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon>
                    <LocationOn color='primary' />
                  </ListItemIcon>
                  <ListItemText primary='Address' secondary={patient.address} />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Emergency Contact Card */}
          {patient.emergencyContact && (
            <Card sx={{ mt: 3 }}>
              <CardHeader
                title='Emergency Contact'
                avatar={<ContactEmergency color='error' />}
              />
              <CardContent sx={{ pt: 0 }}>
                <Typography variant='body2' fontWeight={500}>
                  {patient.emergencyContact.name}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {patient.emergencyContact.relationship}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {patient.emergencyContact.phoneNumber}
                </Typography>
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
              <Box className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                <Box>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant='h4' color='primary'>
                      {appointments?.length || 0}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Total Appointments
                    </Typography>
                  </Paper>
                </Box>
                <Box>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant='h4' color='primary'>
                      {invoices?.data?.length || 0}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Total Invoices
                    </Typography>
                  </Paper>
                </Box>
                <Box className='col-span-full'>
                  <Typography variant='h6' gutterBottom>
                    Patient Information
                  </Typography>
                  <Box className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Date of Birth
                      </Typography>
                      <Typography variant='body1'>
                        {formatDate(patient.dateOfBirth)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Last Visit
                      </Typography>
                      <Typography variant='body1'>
                        {patient.lastVisit
                          ? formatDate(patient.lastVisit)
                          : 'Never'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </TabPanel>

            {/* Appointments Tab */}
            <TabPanel value={tabValue} index={1}>
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={2}
              >
                <Typography variant='h6'>Appointments</Typography>
                <Button
                  variant='contained'
                  startIcon={<Add />}
                  onClick={handleNewAppointment}
                >
                  New Appointment
                </Button>
              </Box>
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
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {appointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            {formatDate(appointment.appointmentDate)} at{' '}
                            {appointment.appointmentTime}
                          </TableCell>
                          <TableCell>{appointment.serviceName}</TableCell>
                          <TableCell>{appointment.providerName}</TableCell>
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
                            <Button
                              size='small'
                              onClick={() =>
                                navigate(`/appointments/${appointment.id}`)
                              }
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
                mb={2}
              >
                <Typography variant='h6'>Invoices</Typography>
                <Button
                  variant='contained'
                  startIcon={<Add />}
                  onClick={handleNewInvoice}
                >
                  New Invoice
                </Button>
              </Box>
              {isLoadingInvoices ? (
                <Skeleton variant='rectangular' height={200} />
              ) : invoices?.data && invoices.data.length > 0 ? (
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
                      {invoices.data.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>{invoice.number}</TableCell>
                          <TableCell>{formatDate(invoice.createdAt)}</TableCell>
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
                mb={2}
              >
                <Typography variant='h6'>Medical History</Typography>
                <Button
                  variant='contained'
                  startIcon={<Add />}
                  onClick={() => setMedicalHistoryDialogOpen(true)}
                >
                  Add Entry
                </Button>
              </Box>

              {/* Current Medical Info */}
              {patient.medicalHistory && (
                <Box className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6'>
                  {patient.medicalHistory.allergies && (
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Allergies
                      </Typography>
                      <Typography variant='body1'>
                        {patient.medicalHistory.allergies}
                      </Typography>
                    </Box>
                  )}
                  {patient.medicalHistory.bloodGroup && (
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Blood Group
                      </Typography>
                      <Typography variant='body1'>
                        {patient.medicalHistory.bloodGroup}
                      </Typography>
                    </Box>
                  )}
                  {patient.medicalHistory.genotype && (
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Genotype
                      </Typography>
                      <Typography variant='body1'>
                        {patient.medicalHistory.genotype}
                      </Typography>
                    </Box>
                  )}
                  {patient.medicalHistory.height && (
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Height
                      </Typography>
                      <Typography variant='body1'>
                        {patient.medicalHistory.height}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Medical History Entries */}
              {isLoadingMedicalHistory ? (
                <Skeleton variant='rectangular' height={200} />
              ) : medicalHistory && medicalHistory.length > 0 ? (
                <List>
                  {medicalHistory.map((entry, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        <MedicalServices color='primary' />
                      </ListItemIcon>
                      <ListItemText
                        primary={entry.entry}
                        secondary={formatDate(entry.date)}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign='center' py={4}>
                  <Typography variant='body1' color='text.secondary'>
                    No medical history entries found
                  </Typography>
                </Box>
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
