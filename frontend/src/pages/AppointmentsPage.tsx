import React, { useState, useCallback, useEffect } from 'react';
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
  Grid,
  Divider,
  Skeleton,
  TablePagination,
  Menu,
  ListItemIcon,
} from '@mui/material';
import {
  Search,
  FilterList,
  Add,
  Edit,
  Delete,
  Visibility,
  Refresh,
  Download,
  CalendarToday,
  Person,
  LocalHospital,
  Schedule,
  CheckCircle,
  Cancel,
  Warning,
  Info,
  MoreVert,
  MedicalServices,
  Event,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { appointmentService } from '../services/appointment.service';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import type { Appointment, AppointmentSearchResult } from '../types';
import { formatDate, formatTime } from '../utils';
import toast from 'react-hot-toast';

const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  // Query parameters
  const queryParams = useCallback(
    () => ({
      page: page + 1,
      limit: rowsPerPage,
      search: searchQuery || undefined,
      status: statusFilter || undefined,
      startDate: dateFilter || undefined,
    }),
    [page, rowsPerPage, searchQuery, statusFilter, dateFilter]
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

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: (id: string) =>
      appointmentService.cancelAppointment({
        appointmentId: id,
        cancellationReason: 'Cancelled by user',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment cancelled successfully');
      setDeleteDialogOpen(false);
      setSelectedAppointment(null);
    },
    onError: (error) => {
      console.error('Cancel appointment error:', error);
      toast.error('Failed to cancel appointment');
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
      toast.success('Appointment list refreshed');
    } catch (error) {
      toast.error('Failed to refresh appointment list');
    }
  };

  const handleExport = async () => {
    try {
      // This would typically export to CSV/Excel
      toast.success('Exporting appointment list...');
    } catch (error) {
      toast.error('Failed to export appointment list');
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

  return (
    <Box>
      {/* Page Header */}
      <PageHeader
        title='Appointments'
        subtitle='Manage patient appointments and scheduling'
        breadcrumbs={<Breadcrumb />}
        onAdd={handleAddAppointment}
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
            <Button
              variant='outlined'
              startIcon={<FilterList />}
              onClick={() => {
                /* Open filter dialog */
              }}
            >
              Filter
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
                          {appointment.patientName || 'Unknown Patient'}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          ID: {appointment.patientId.slice(-8)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display='flex' alignItems='center' gap={1}>
                      <MedicalServices color='primary' fontSize='small' />
                      <Typography variant='body2'>
                        {appointment.serviceName || 'Unknown Service'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>
                      {appointment.providerName || 'Unknown Provider'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant='body2' fontWeight={500}>
                        {formatDate(
                          appointment.appointmentDate || appointment.date || ''
                        )}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {formatTime(
                          appointment.appointmentTime || appointment.time || ''
                        )}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={appointment.status}
                      color={getStatusColor(appointment.status) as any}
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    {appointment.priority && (
                      <Chip
                        label={appointment.priority}
                        color={getPriorityColor(appointment.priority) as any}
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
        <MenuItem onClick={handleEditAppointment}>
          <ListItemIcon>
            <Edit fontSize='small' sx={{ mr: 1 }} />
          </ListItemIcon>
          Edit Appointment
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <Schedule fontSize='small' sx={{ mr: 1 }} />
          </ListItemIcon>
          Reschedule
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <Event fontSize='small' sx={{ mr: 1 }} />
          </ListItemIcon>
          Mark Complete
        </MenuItem>
        <MenuItem
          onClick={handleDeleteAppointment}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Delete fontSize='small' sx={{ mr: 1 }} />
          </ListItemIcon>
          Cancel Appointment
        </MenuItem>
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
