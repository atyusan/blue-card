import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  TablePagination,
  Menu,
  ListItemIcon,
} from '@mui/material';
import {
  Search,
  FilterList,
  Edit,
  Delete,
  Visibility,
  Person,
  Schedule,
  MoreVert,
  MedicalServices,
  Event,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { appointmentService } from '../services/appointment.service';
import { staffService } from '../services/staff.service';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import type { Appointment, AppointmentSearchResult } from '../types';
import { formatDate, formatTime } from '../utils';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();

  // Permission checks
  const {
    canViewAppointments,
    canCreateAppointments,
    canUpdateAppointments,
    canCancelAppointments,
    isAdmin,
  } = usePermissions();

  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [providerFilter, setProviderFilter] = useState<string>('');

  // Query parameters
  const queryParams = useCallback(
    () => ({
      page: page + 1,
      limit: rowsPerPage,
      search: searchQuery || undefined,
      status: statusFilter || undefined,
      startDate: dateFilter || undefined,
      providerId: providerFilter || undefined,
    }),
    [page, rowsPerPage, searchQuery, statusFilter, dateFilter, providerFilter]
  );

  // Fetch appointments
  const {
    data: appointmentsData,
    isLoading,
    isError,
    refetch,
  } = useQuery<AppointmentSearchResult>({
    queryKey: ['appointments', queryParams()],
    queryFn: () => appointmentService.getAppointments(queryParams()),
    placeholderData: (previousData: AppointmentSearchResult | undefined) =>
      previousData,
  });

  // Fetch service providers (only for admin)
  const { data: serviceProviders } = useQuery({
    queryKey: ['service-providers'],
    queryFn: () => staffService.getServiceProviders(),
    enabled: isAdmin(),
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: (id: string) =>
      appointmentService.cancelAppointment({
        appointmentId: id,
        cancellationReason: 'Cancelled by user',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      showSuccess('Appointment cancelled successfully');
      setDeleteDialogOpen(false);
      setSelectedAppointment(null);
    },
    onError: (error) => {
      console.error('Cancel appointment error:', error);
      showError('Failed to cancel appointment');
    },
  });

  // Event handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleActionMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    appointment: Appointment
  ) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedAppointment(appointment);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedAppointment(null);
  };

  const handleViewAppointment = () => {
    if (selectedAppointment) {
      navigate(`/appointments/${selectedAppointment.id}`);
    }
    handleActionMenuClose();
  };

  const handleEditAppointment = () => {
    if (selectedAppointment) {
      navigate(`/appointments/${selectedAppointment.id}/edit`);
    }
    handleActionMenuClose();
  };

  const handleDeleteAppointment = () => {
    setDeleteDialogOpen(true);
    handleActionMenuClose();
  };

  const confirmCancelAppointment = () => {
    if (selectedAppointment) {
      cancelAppointmentMutation.mutate(selectedAppointment.id);
    }
  };

  const handleAddAppointment = () => {
    navigate('/appointments/create');
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      showSuccess('Appointment list refreshed');
    } catch {
      showError('Failed to refresh appointment list');
    }
  };

  const handleExport = async () => {
    try {
      // This would typically export to CSV/Excel
      showSuccess('Exporting appointment list...');
    } catch {
      showError('Failed to export appointment list');
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
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box>
        <PageHeader
          title='Appointments'
          subtitle='Manage patient appointments and scheduling'
          breadcrumbs={<Breadcrumb />}
          showActions={false}
        />
        <Box p={2}>
          {[...Array(5)].map((_, index) => (
            <Skeleton
              key={index}
              variant='rectangular'
              height={60}
              sx={{ mb: 1 }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  // Error state
  if (isError) {
    return (
      <Box>
        <PageHeader
          title='Appointments'
          subtitle='Manage patient appointments and scheduling'
          breadcrumbs={<Breadcrumb />}
          onRefresh={handleRefresh}
          showActions={true}
        />
        <Alert
          severity='error'
          action={
            <Button color='inherit' size='small' onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          Failed to load appointments. Please try again.
        </Alert>
      </Box>
    );
  }

  const appointments = appointmentsData?.appointments || [];
  const totalCount = appointmentsData?.total || 0;

  // Check if user has permission to view appointments
  if (!canViewAppointments()) {
    return (
      <Box>
        <PageHeader
          title='Appointments'
          subtitle='Manage patient appointments and scheduling'
          breadcrumbs={<Breadcrumb />}
          showActions={false}
        />
        <Alert severity='error' sx={{ m: 3 }}>
          You don't have permission to view appointments. Please contact your
          administrator.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <PageHeader
        title='Appointments'
        subtitle='Manage patient appointments and scheduling'
        breadcrumbs={<Breadcrumb />}
        onAdd={canCreateAppointments() ? handleAddAppointment : undefined}
        onRefresh={handleRefresh}
        onDownload={handleExport}
        showActions={true}
      />

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <Box p={3}>
          <Box display='flex' gap={2} alignItems='center'>
            <TextField
              placeholder='Search appointments by patient name, service...'
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            <TextField
              type='date'
              label='Date'
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size='small'
            />
            <FormControl size='small' sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label='Status'
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='scheduled'>Scheduled</MenuItem>
                <MenuItem value='confirmed'>Confirmed</MenuItem>
                <MenuItem value='pending'>Pending</MenuItem>
                <MenuItem value='completed'>Completed</MenuItem>
                <MenuItem value='cancelled'>Cancelled</MenuItem>
              </Select>
            </FormControl>
            {isAdmin && (
              <FormControl size='small' sx={{ minWidth: 150 }}>
                <InputLabel>Provider</InputLabel>
                <Select
                  value={providerFilter}
                  label='Provider'
                  onChange={(e) => setProviderFilter(e.target.value)}
                >
                  <MenuItem value=''>All Providers</MenuItem>
                  {serviceProviders?.data?.map((provider) => (
                    <MenuItem key={provider.id} value={provider.id}>
                      {provider.user.firstName} {provider.user.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Button
              variant='outlined'
              startIcon={<FilterList />}
              onClick={() => {
                /* Open filter dialog */
              }}
            >
              Filter
            </Button>
            <Button
              variant='outlined'
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
                setDateFilter('');
                setProviderFilter('');
                setPage(0);
              }}
            >
              Clear Filters
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Appointments Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Provider</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map((appointment: Appointment) => (
                <TableRow key={appointment.id} hover>
                  <TableCell>
                    <Box display='flex' alignItems='center' gap={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant='body2' fontWeight={500}>
                          {appointment.patient?.firstName &&
                          appointment.patient?.lastName
                            ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                            : 'Unknown Patient'}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          ID:{' '}
                          {appointment.patient?.patientId ||
                            appointment.patientId.slice(-8)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display='flex' alignItems='center' gap={1}>
                      <MedicalServices color='primary' fontSize='small' />
                      <Typography variant='body2'>
                        {appointment.appointmentType?.replace(/_/g, ' ') ||
                          'Unknown Service'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>
                      {appointment.slot?.provider?.user?.firstName &&
                      appointment.slot?.provider?.user?.lastName
                        ? `Dr. ${appointment.slot.provider.user.firstName} ${appointment.slot.provider.user.lastName}`
                        : 'Unknown Provider'}
                    </Typography>
                    {appointment.slot?.provider?.specialization && (
                      <Typography variant='caption' color='text.secondary'>
                        {appointment.slot.provider.specialization}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant='body2' fontWeight={500}>
                        {formatDate(appointment.scheduledStart || '')}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {formatTime(appointment.scheduledStart || '')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={appointment.status}
                      color={
                        getStatusColor(appointment.status) as
                          | 'success'
                          | 'info'
                          | 'warning'
                          | 'error'
                          | 'default'
                      }
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    {appointment.priority && (
                      <Chip
                        label={appointment.priority}
                        color={
                          getPriorityColor(appointment.priority) as
                            | 'success'
                            | 'info'
                            | 'warning'
                            | 'error'
                            | 'default'
                        }
                        size='small'
                        variant='outlined'
                      />
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    <Tooltip title='More actions'>
                      <IconButton
                        onClick={(e) => handleActionMenuOpen(e, appointment)}
                        size='small'
                      >
                        <MoreVert />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component='div'
          count={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={handleViewAppointment}>
          <ListItemIcon>
            <Visibility fontSize='small' sx={{ mr: 1 }} />
          </ListItemIcon>
          View Details
        </MenuItem>
        {canUpdateAppointments() && (
          <MenuItem onClick={handleEditAppointment}>
            <ListItemIcon>
              <Edit fontSize='small' sx={{ mr: 1 }} />
            </ListItemIcon>
            Edit Appointment
          </MenuItem>
        )}
        {canUpdateAppointments() && (
          <MenuItem>
            <ListItemIcon>
              <Schedule fontSize='small' sx={{ mr: 1 }} />
            </ListItemIcon>
            Reschedule
          </MenuItem>
        )}
        {canUpdateAppointments() && (
          <MenuItem>
            <ListItemIcon>
              <Event fontSize='small' sx={{ mr: 1 }} />
            </ListItemIcon>
            Mark Complete
          </MenuItem>
        )}
        {canCancelAppointments() && (
          <MenuItem
            onClick={handleDeleteAppointment}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <Delete fontSize='small' sx={{ mr: 1 }} />
            </ListItemIcon>
            Cancel Appointment
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Cancel Appointment</DialogTitle>
        <DialogContent>
          Are you sure you want to cancel the appointment for{' '}
          {selectedAppointment?.patientName}? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmCancelAppointment}
            color='error'
            variant='contained'
            disabled={cancelAppointmentMutation.isPending}
          >
            {cancelAppointmentMutation.isPending
              ? 'Cancelling...'
              : 'Cancel Appointment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentsPage;
