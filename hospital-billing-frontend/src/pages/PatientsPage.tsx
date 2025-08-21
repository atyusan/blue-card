import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Avatar,
  Typography,
  Button,
  Skeleton,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Upload,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import { patientService } from '../services/patient.service';
import { formatDate, getInitials } from '../utils';
import toast from 'react-hot-toast';
import type { Patient, PaginatedResponse } from '../types';

const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Query parameters
  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: rowsPerPage,
      search: searchQuery || undefined,
    }),
    [page, rowsPerPage, searchQuery]
  );

  // Fetch patients
  const {
    data: patientsData,
    isLoading,
    isError,
    refetch,
  } = useQuery<PaginatedResponse<Patient>>({
    queryKey: ['patients', queryParams],
    queryFn: () => patientService.getPatients(queryParams),
    placeholderData: (previousData) => previousData,
  });

  // Delete patient mutation
  const deletePatientMutation = useMutation({
    mutationFn: patientService.deletePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedPatient(null);
    },
    onError: (error) => {
      console.error('Delete patient error:', error);
      toast.error('Failed to delete patient');
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
    patient: Patient
  ) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedPatient(patient);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedPatient(null);
  };

  const handleViewPatient = () => {
    if (selectedPatient) {
      navigate(`/patients/${selectedPatient.id}`);
    }
    handleActionMenuClose();
  };

  const handleEditPatient = () => {
    if (selectedPatient) {
      navigate(`/patients/${selectedPatient.id}/edit`);
    }
    handleActionMenuClose();
  };

  const handleDeletePatient = () => {
    setDeleteDialogOpen(true);
    handleActionMenuClose();
  };

  const confirmDeletePatient = () => {
    if (selectedPatient) {
      deletePatientMutation.mutate(selectedPatient.id);
    }
  };

  const handleAddPatient = () => {
    navigate('/patients/add');
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Patient list refreshed');
    } catch (error) {
      toast.error('Failed to refresh patient list');
    }
  };

  const handleExport = async () => {
    try {
      // This would typically export to CSV/Excel
      toast.success('Exporting patient list...');
    } catch (error) {
      toast.error('Failed to export patient list');
    }
  };

  const getGenderColor = (gender: string) => {
    switch (gender.toLowerCase()) {
      case 'male':
        return 'primary';
      case 'female':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  // Loading state
  if (isLoading && !patientsData) {
    return (
      <Box>
        <PageHeader
          title='Patients'
          subtitle='Manage patient records and information'
          breadcrumbs={<Breadcrumb />}
          showActions={false}
        />
        <Card>
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
        </Card>
      </Box>
    );
  }

  // Error state
  if (isError) {
    return (
      <Box>
        <PageHeader
          title='Patients'
          subtitle='Manage patient records and information'
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
          Failed to load patients. Please try again.
        </Alert>
      </Box>
    );
  }

  const patients = patientsData?.data || [];
  const totalCount = patientsData?.pagination.total || 0;

  return (
    <Box>
      {/* Page Header */}
      <PageHeader
        title='Patients'
        subtitle='Manage patient records and information'
        breadcrumbs={<Breadcrumb />}
        onAdd={handleAddPatient}
        onRefresh={handleRefresh}
        onDownload={handleExport}
        showActions={true}
      />

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <Box p={3}>
          <Box display='flex' gap={2} alignItems='center'>
            <TextField
              placeholder='Search patients by name, email, or phone...'
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
              startIcon={<Upload />}
              onClick={() => {
                /* Open import dialog */
              }}
            >
              Import
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Patients Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Contact Information</TableCell>
                <TableCell>Date of Birth</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Last Visit</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.id} hover>
                  <TableCell>
                    <Box display='flex' alignItems='center' gap={2}>
                      <Avatar
                        sx={{
                          bgcolor:
                            patient.gender === 'MALE'
                              ? 'primary.main'
                              : 'secondary.main',
                        }}
                      >
                        {getInitials(
                          `${patient.firstName} ${patient.lastName}`
                        )}
                      </Avatar>
                      <Box>
                        <Typography variant='body2' fontWeight={500}>
                          {patient.firstName} {patient.lastName}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          ID: {patient.id.slice(-8)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant='body2'>{patient.email}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {patient.phoneNumber}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>
                      {formatDate(patient.dateOfBirth)}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Age:{' '}
                      {new Date().getFullYear() -
                        new Date(patient.dateOfBirth).getFullYear()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={patient.gender}
                      color={getGenderColor(patient.gender) as any}
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>
                      {patient.lastVisit
                        ? formatDate(patient.lastVisit)
                        : 'Never'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={patient.status || 'Active'}
                      color={getStatusColor(patient.status || 'active') as any}
                      size='small'
                    />
                  </TableCell>
                  <TableCell align='right'>
                    <Tooltip title='More actions'>
                      <IconButton
                        onClick={(e) => handleActionMenuOpen(e, patient)}
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
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={handleViewPatient}>
          <Visibility fontSize='small' sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleEditPatient}>
          <Edit fontSize='small' sx={{ mr: 1 }} />
          Edit Patient
        </MenuItem>
        <MenuItem onClick={handleDeletePatient} sx={{ color: 'error.main' }}>
          <Delete fontSize='small' sx={{ mr: 1 }} />
          Delete Patient
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Patient</DialogTitle>
        <DialogContent>
          Are you sure you want to delete {selectedPatient?.firstName}{' '}
          {selectedPatient?.lastName}? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDeletePatient}
            color='error'
            variant='contained'
            disabled={deletePatientMutation.isPending}
          >
            {deletePatientMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientsPage;
