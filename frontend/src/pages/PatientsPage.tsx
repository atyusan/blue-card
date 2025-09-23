import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
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
  FormControl,
  InputLabel,
  Select,
  Stack,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Upload,
  Person,
  Male,
  Female,
  CheckCircle,
  LocalHospital,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import { patientService } from '../services/patient.service';
import { formatDate, getInitials } from '../utils';
import toast from 'react-hot-toast';
import type { Patient, PaginatedResponse, PatientStats } from '../types';

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
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    gender: '',
    status: '',
    isActive: '',
  });

  // Query parameters
  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: rowsPerPage,
      search: searchQuery || undefined,
      gender: filters.gender || undefined,
      status: filters.status || undefined,
      isActive: filters.isActive ? filters.isActive === 'true' : undefined,
    }),
    [page, rowsPerPage, searchQuery, filters]
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

  // Fetch patient statistics
  const {
    data: patientStats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery<PatientStats>({
    queryKey: ['patient-stats'],
    queryFn: () => patientService.getPatientStats(),
  });

  // Log stats when they load
  useEffect(() => {
    if (patientStats) {
      console.log('✅ Patient stats loaded:', patientStats);
    }
    if (statsError) {
      console.error('❌ Patient stats error:', statsError);
    }
  }, [patientStats, statsError]);

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

  const handleFilterToggle = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      gender: '',
      status: '',
      isActive: '',
    });
    setPage(0);
  };

  const handleApplyFilters = () => {
    setPage(0);
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

      {/* Overview Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(5, 1fr)',
          },
          gap: 3,
          mb: 3,
        }}
      >
        <Box>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                  <Typography variant='h4' fontWeight={700} color='white'>
                    {isLoadingStats ? (
                      <Skeleton variant='text' width={60} height={40} />
                    ) : statsError ? (
                      'Error'
                    ) : (
                      patientStats?.totalPatients || 0
                    )}
                  </Typography>
                  <Typography variant='body2' color='rgba(255,255,255,0.8)'>
                    Total Patients
                  </Typography>
                </Box>
                <Person sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
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
                  <Typography variant='h4' fontWeight={700} color='white'>
                    {isLoadingStats ? (
                      <Skeleton variant='text' width={60} height={40} />
                    ) : statsError ? (
                      'Error'
                    ) : (
                      patientStats?.malePatients || 0
                    )}
                  </Typography>
                  <Typography variant='body2' color='rgba(255,255,255,0.8)'>
                    Male Patients
                  </Typography>
                </Box>
                <Male sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
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
                  <Typography variant='h4' fontWeight={700} color='white'>
                    {isLoadingStats ? (
                      <Skeleton variant='text' width={60} height={40} />
                    ) : statsError ? (
                      'Error'
                    ) : (
                      patientStats?.femalePatients || 0
                    )}
                  </Typography>
                  <Typography variant='body2' color='rgba(255,255,255,0.8)'>
                    Female Patients
                  </Typography>
                </Box>
                <Female sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
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
                  <Typography variant='h4' fontWeight={700} color='white'>
                    {isLoadingStats ? (
                      <Skeleton variant='text' width={60} height={40} />
                    ) : statsError ? (
                      'Error'
                    ) : (
                      patientStats?.activePatients || 0
                    )}
                  </Typography>
                  <Typography variant='body2' color='rgba(255,255,255,0.8)'>
                    Active Patients
                  </Typography>
                </Box>
                <CheckCircle
                  sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
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
                  <Typography variant='h4' fontWeight={700} color='white'>
                    {isLoadingStats ? (
                      <Skeleton variant='text' width={60} height={40} />
                    ) : statsError ? (
                      'Error'
                    ) : (
                      patientStats?.admittedPatients || 0
                    )}
                  </Typography>
                  <Typography variant='body2' color='rgba(255,255,255,0.8)'>
                    Admitted Patients
                  </Typography>
                </Box>
                <LocalHospital
                  sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

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
              onClick={handleFilterToggle}
              color={showFilters ? 'primary' : 'inherit'}
            >
              {showFilters ? 'Hide Filters' : 'Filter'}
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

      {/* Inline Filter Section */}
      {showFilters && (
        <Card
          sx={{
            mb: 3,
            animation: 'fadeIn 0.3s ease-in-out',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'translateY(-10px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant='h6'
                sx={{
                  mb: 3,
                  fontWeight: 600,
                  color: 'text.primary',
                }}
              >
                Filter Patients
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={3}
                alignItems={{ xs: 'stretch', sm: 'flex-end' }}
                sx={{ mb: 2 }}
              >
                <FormControl
                  sx={{
                    minWidth: { xs: '100%', sm: 160 },
                    flex: { xs: 1, sm: '0 0 auto' },
                  }}
                >
                  <InputLabel
                    sx={{
                      fontSize: '0.875rem',
                      '&.Mui-focused': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    Gender
                  </InputLabel>
                  <Select
                    value={filters.gender}
                    onChange={(e) =>
                      handleFilterChange('gender', e.target.value)
                    }
                    label='Gender'
                    size='small'
                    sx={{
                      '& .MuiSelect-select': {
                        padding: '8px 12px',
                        fontSize: '0.875rem',
                      },
                    }}
                  >
                    <MenuItem value=''>All Genders</MenuItem>
                    <MenuItem value='MALE'>Male</MenuItem>
                    <MenuItem value='FEMALE'>Female</MenuItem>
                    <MenuItem value='OTHER'>Other</MenuItem>
                  </Select>
                </FormControl>

                <FormControl
                  sx={{
                    minWidth: { xs: '100%', sm: 160 },
                    flex: { xs: 1, sm: '0 0 auto' },
                  }}
                >
                  <InputLabel
                    sx={{
                      fontSize: '0.875rem',
                      '&.Mui-focused': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    Status
                  </InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange('status', e.target.value)
                    }
                    label='Status'
                    size='small'
                    sx={{
                      '& .MuiSelect-select': {
                        padding: '8px 12px',
                        fontSize: '0.875rem',
                      },
                    }}
                  >
                    <MenuItem value=''>All Statuses</MenuItem>
                    <MenuItem value='Active'>Active</MenuItem>
                    <MenuItem value='Inactive'>Inactive</MenuItem>
                  </Select>
                </FormControl>

                <FormControl
                  sx={{
                    minWidth: { xs: '100%', sm: 160 },
                    flex: { xs: 1, sm: '0 0 auto' },
                  }}
                >
                  <InputLabel
                    sx={{
                      fontSize: '0.875rem',
                      '&.Mui-focused': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    Active Status
                  </InputLabel>
                  <Select
                    value={filters.isActive}
                    onChange={(e) =>
                      handleFilterChange('isActive', e.target.value)
                    }
                    label='Active Status'
                    size='small'
                    sx={{
                      '& .MuiSelect-select': {
                        padding: '8px 12px',
                        fontSize: '0.875rem',
                      },
                    }}
                  >
                    <MenuItem value=''>All</MenuItem>
                    <MenuItem value='true'>Active Only</MenuItem>
                    <MenuItem value='false'>Inactive Only</MenuItem>
                  </Select>
                </FormControl>

                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center',
                    flex: { xs: 1, sm: '0 0 auto' },
                    justifyContent: { xs: 'center', sm: 'flex-start' },
                    mt: { xs: 1, sm: 0 },
                  }}
                >
                  <Button
                    variant='outlined'
                    onClick={handleClearFilters}
                    size='small'
                    color='inherit'
                    sx={{
                      minWidth: 100,
                      height: 36,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      borderColor: 'grey.300',
                      color: 'text.secondary',
                      '&:hover': {
                        borderColor: 'grey.400',
                        backgroundColor: 'grey.50',
                      },
                    }}
                  >
                    Clear All
                  </Button>
                  <Button
                    variant='contained'
                    onClick={handleApplyFilters}
                    size='small'
                    sx={{
                      minWidth: 100,
                      height: 36,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      boxShadow: 'none',
                      '&:hover': {
                        boxShadow: 1,
                      },
                    }}
                  >
                    Apply
                  </Button>
                </Box>
              </Stack>
            </Box>

            {/* Active Filters Display */}
            {(filters.gender || filters.status || filters.isActive) && (
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography
                  variant='subtitle2'
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                  }}
                >
                  Active Filters:
                </Typography>
                <Box display='flex' gap={1.5} flexWrap='wrap'>
                  {filters.gender && (
                    <Chip
                      label={`Gender: ${filters.gender}`}
                      onDelete={() => handleFilterChange('gender', '')}
                      size='small'
                      color='primary'
                      variant='outlined'
                      sx={{
                        fontSize: '0.75rem',
                        height: 28,
                        '& .MuiChip-deleteIcon': {
                          fontSize: '1rem',
                        },
                      }}
                    />
                  )}
                  {filters.status && (
                    <Chip
                      label={`Status: ${filters.status}`}
                      onDelete={() => handleFilterChange('status', '')}
                      size='small'
                      color='primary'
                      variant='outlined'
                      sx={{
                        fontSize: '0.75rem',
                        height: 28,
                        '& .MuiChip-deleteIcon': {
                          fontSize: '1rem',
                        },
                      }}
                    />
                  )}
                  {filters.isActive && (
                    <Chip
                      label={`Active: ${
                        filters.isActive === 'true' ? 'Yes' : 'No'
                      }`}
                      onDelete={() => handleFilterChange('isActive', '')}
                      size='small'
                      color='primary'
                      variant='outlined'
                      sx={{
                        fontSize: '0.75rem',
                        height: 28,
                        '& .MuiChip-deleteIcon': {
                          fontSize: '1rem',
                        },
                      }}
                    />
                  )}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

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
