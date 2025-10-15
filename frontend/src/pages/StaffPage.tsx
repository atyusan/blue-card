import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Divider,
  Alert,
  Skeleton,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Person,
  Business,
  CheckCircle,
  Cancel,
  FilterList,
  Upload,
  Download,
} from '@mui/icons-material';
import { usePermissions } from '@/hooks/usePermissions';
import { staffService } from '../services/staff.service';
import { departmentsService } from '../services/departments.service';
import type {
  StaffMember,
  CreateStaffData,
  UpdateStaffData,
  StaffStats,
} from '../services/staff.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext';

export const StaffPage: React.FC = () => {
  const { canManageStaff, canViewStaff } = usePermissions();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  // State management
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>(
    'create'
  );
  const [staffStats, setStaffStats] = useState<StaffStats | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    departmentId: '',
    department: '',
    isActive: '',
    specialization: '',
  });

  // Form state
  const [staffForm, setStaffForm] = useState<CreateStaffData>({
    email: '',
    firstName: '',
    lastName: '',
    employeeId: '',
    departmentId: '',
    specialization: '',
    licenseNumber: '',
    hireDate: '',
    isActive: true,
    serviceProvider: false,
  });

  // Query for staff data
  const { data: staffData, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff', filters],
    queryFn: () =>
      staffService.getStaff({
        search: searchTerm || undefined,
        departmentId: filters.departmentId || undefined,
        department: filters.department || undefined,
        isActive: filters.isActive ? filters.isActive === 'true' : undefined,
        specialization: filters.specialization || undefined,
        page: 1,
        limit: 100,
      }),
  });

  // Query for staff statistics
  const { data: statsData } = useQuery({
    queryKey: ['staff-stats'],
    queryFn: () => staffService.getStaffStats(),
  });

  // Query for departments
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsService.getDepartments({ isActive: true }),
  });

  // Mutations
  const createStaffMutation = useMutation({
    mutationFn: staffService.createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff-stats'] });
      showSuccess('Staff member created successfully');
      setDialogOpen(false);
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Failed to create staff member';
      showError(message);
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStaffData }) =>
      staffService.updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff-stats'] });
      showSuccess('Staff member updated successfully');
      setDialogOpen(false);
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Failed to update staff member';
      showError(message);
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: staffService.deleteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff-stats'] });
      showSuccess('Staff member deleted successfully');
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Failed to delete staff member';
      showError(message);
    },
  });

  // Update local state when data changes
  useEffect(() => {
    if (staffData) {
      setStaff(staffData.data);
      setStaffStats(staffData.counts);
    }
  }, [staffData]);

  useEffect(() => {
    if (statsData) {
      setStaffStats(statsData);
    }
  }, [statsData]);

  // Filter handlers
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
      departmentId: '',
      department: '',
      isActive: '',
      specialization: '',
    });
  };

  const handleApplyFilters = () => {
    // Filters are automatically applied through the query
  };

  // CRUD handlers
  const handleCreateStaff = () => {
    setSelectedStaff(null);
    setDialogMode('create');
    setStaffForm({
      email: '',
      firstName: '',
      lastName: '',
      employeeId: '',
      departmentId: '',
      specialization: '',
      licenseNumber: '',
      hireDate: '',
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleEditStaff = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setDialogMode('edit');
    setStaffForm({
      email: staffMember.user.email,
      firstName: staffMember.user.firstName,
      lastName: staffMember.user.lastName,
      employeeId: staffMember.employeeId,
      departmentId: staffMember.departmentId || '',
      specialization: staffMember.specialization || '',
      licenseNumber: staffMember.licenseNumber || '',
      hireDate: staffMember.hireDate.split('T')[0], // Format for date input
      isActive: staffMember.isActive,
      serviceProvider: staffMember.serviceProvider || false,
    });
    setDialogOpen(true);
  };

  const handleViewStaff = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setDialogMode('view');
    setStaffForm({
      email: staffMember.user.email,
      firstName: staffMember.user.firstName,
      lastName: staffMember.user.lastName,
      employeeId: staffMember.employeeId,
      departmentId: staffMember.departmentId || '',
      specialization: staffMember.specialization || '',
      licenseNumber: staffMember.licenseNumber || '',
      hireDate: staffMember.hireDate.split('T')[0],
      isActive: staffMember.isActive,
      serviceProvider: staffMember.serviceProvider || false,
    });
    setDialogOpen(true);
  };

  const handleDeleteStaff = (staffMember: StaffMember) => {
    setStaffToDelete(staffMember);
    setDeleteDialogOpen(true);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleConfirmDelete = () => {
    if (staffToDelete) {
      deleteStaffMutation.mutate(staffToDelete.id);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setStaffToDelete(null);
  };

  const handleSubmitStaff = () => {
    if (dialogMode === 'create') {
      createStaffMutation.mutate(staffForm);
    } else if (dialogMode === 'edit' && selectedStaff) {
      // Filter out user fields for staff update
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { email, firstName, lastName, ...staffUpdateData } = staffForm;
      updateStaffMutation.mutate({
        id: selectedStaff.id,
        data: staffUpdateData,
      });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedStaff(null);
  };

  const handleExportStaff = () => {
    // TODO: Implement export functionality
    showSuccess('Export functionality coming soon');
  };

  const handleImportStaff = () => {
    // TODO: Implement import functionality
    showSuccess('Import functionality coming soon');
  };

  if (!canViewStaff()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error' sx={{ textAlign: 'center' }}>
          You don't have permission to view staff members.
        </Alert>
      </Box>
    );
  }

  if (isLoadingStaff) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant='h6' sx={{ textAlign: 'center', mb: 3 }}>
          Loading staff members...
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {[...Array(6)].map((_, index) => (
            <Card key={index}>
              <CardContent>
                <Skeleton variant='text' height={40} />
                <Skeleton variant='text' height={20} />
                <Skeleton variant='text' height={20} />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant='h4'
            component='h1'
            sx={{ fontWeight: 'bold', mb: 1 }}
          >
            Staff Management
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Manage hospital staff members, their roles, and departments
          </Typography>
        </Box>
        {canManageStaff() && (
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={handleCreateStaff}
            sx={{ height: 40 }}
          >
            Add Staff
          </Button>
        )}
      </Box>

      {/* Overview Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 3,
        }}
      >
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                <Person />
              </Avatar>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Total Staff
                </Typography>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {staffStats?.totalStaff || 0}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
                <CheckCircle />
              </Avatar>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Active Staff
                </Typography>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {staffStats?.activeStaff || 0}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'error.main', width: 48, height: 48 }}>
                <Cancel />
              </Avatar>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Inactive Staff
                </Typography>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {staffStats?.inactiveStaff || 0}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main', width: 48, height: 48 }}>
                <Business />
              </Avatar>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Departments
                </Typography>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {staffStats?.totalDepartments || 0}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder='Search staff members...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              onClick={handleImportStaff}
            >
              Import
            </Button>
            <Button
              variant='outlined'
              startIcon={<Download />}
              onClick={handleExportStaff}
            >
              Export
            </Button>
          </Box>
        </CardContent>
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
                Filter Staff Members
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
                    Department
                  </InputLabel>
                  <Select
                    value={filters.department}
                    onChange={(e) =>
                      handleFilterChange('department', e.target.value)
                    }
                    label='Department'
                    size='small'
                    sx={{
                      '& .MuiSelect-select': {
                        padding: '8px 12px',
                        fontSize: '0.875rem',
                      },
                    }}
                  >
                    <MenuItem value=''>All Departments</MenuItem>
                    {departmentsData?.data.map((department) => (
                      <MenuItem key={department.id} value={department.name}>
                        {department.name}
                      </MenuItem>
                    ))}
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
                    value={filters.isActive}
                    onChange={(e) =>
                      handleFilterChange('isActive', e.target.value)
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
                    <MenuItem value='true'>Active</MenuItem>
                    <MenuItem value='false'>Inactive</MenuItem>
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
                    Specialization
                  </InputLabel>
                  <Select
                    value={filters.specialization}
                    onChange={(e) =>
                      handleFilterChange('specialization', e.target.value)
                    }
                    label='Specialization'
                    size='small'
                    sx={{
                      '& .MuiSelect-select': {
                        padding: '8px 12px',
                        fontSize: '0.875rem',
                      },
                    }}
                  >
                    <MenuItem value=''>All Specializations</MenuItem>
                    <MenuItem value='Cardiologist'>Cardiologist</MenuItem>
                    <MenuItem value='Neurologist'>Neurologist</MenuItem>
                    <MenuItem value='Emergency Physician'>
                      Emergency Physician
                    </MenuItem>
                    <MenuItem value='Nurse'>Nurse</MenuItem>
                    <MenuItem value='Pharmacist'>Pharmacist</MenuItem>
                    <MenuItem value='Lab Technician'>Lab Technician</MenuItem>
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
            {(filters.department ||
              filters.isActive ||
              filters.specialization) && (
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
                  {filters.department && (
                    <Chip
                      label={`Department: ${filters.department}`}
                      onDelete={() => handleFilterChange('department', '')}
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
                      label={`Status: ${
                        filters.isActive === 'true' ? 'Active' : 'Inactive'
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
                  {filters.specialization && (
                    <Chip
                      label={`Specialization: ${filters.specialization}`}
                      onDelete={() => handleFilterChange('specialization', '')}
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

      {/* Staff Table */}
      <Card>
        <CardHeader
          title='All Staff Members'
          subheader={`${staff.length} staff members found`}
        />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Staff Member</TableCell>
                <TableCell>Employee ID</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Specialization</TableCell>
                <TableCell>Hire Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {staff
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((staffMember) => (
                  <TableRow key={staffMember.id} hover>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: 'primary.main',
                            width: 32,
                            height: 32,
                          }}
                        >
                          {staffMember.user.firstName[0]}
                          {staffMember.user.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography
                            variant='subtitle2'
                            sx={{ fontWeight: 600 }}
                          >
                            {staffMember.user.firstName}{' '}
                            {staffMember.user.lastName}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {staffMember.user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={staffMember.employeeId}
                        size='small'
                        color='primary'
                        variant='outlined'
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={staffMember.department?.name || 'No Department'}
                        size='small'
                        color='secondary'
                        variant='outlined'
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='text.secondary'>
                        {staffMember.specialization || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='text.secondary'>
                        {new Date(staffMember.hireDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={staffMember.isActive ? 'Active' : 'Inactive'}
                        color={staffMember.isActive ? 'success' : 'default'}
                        size='small'
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          staffMember.serviceProvider
                            ? 'Service Provider'
                            : 'Staff'
                        }
                        color={staffMember.serviceProvider ? 'info' : 'default'}
                        size='small'
                        variant={
                          staffMember.serviceProvider ? 'filled' : 'outlined'
                        }
                      />
                    </TableCell>
                    <TableCell align='right'>
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1,
                          justifyContent: 'flex-end',
                        }}
                      >
                        <Tooltip title='View Details'>
                          <IconButton
                            size='small'
                            onClick={() => handleViewStaff(staffMember)}
                          >
                            <Visibility fontSize='small' />
                          </IconButton>
                        </Tooltip>
                        {canManageStaff() && (
                          <>
                            <Tooltip title='Edit Staff Member'>
                              <IconButton
                                size='small'
                                onClick={() => handleEditStaff(staffMember)}
                              >
                                <Edit fontSize='small' />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Delete Staff Member'>
                              <IconButton
                                size='small'
                                onClick={() => handleDeleteStaff(staffMember)}
                                color='error'
                              >
                                <Delete fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component='div'
          count={staff.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Staff Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle
          sx={{
            pb: dialogMode === 'view' ? 0 : 2,
            background:
              dialogMode === 'view'
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'transparent',
            color: dialogMode === 'view' ? 'white' : 'inherit',
            // borderRadius: dialogMode === 'view' ? '12px 12px 0 0' : 0,
            position: dialogMode === 'view' ? 'relative' : 'static',
            overflow: dialogMode === 'view' ? 'hidden' : 'visible',
          }}
        >
          {dialogMode === 'view' && (
            <>
              {/* Decorative elements for title */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -15,
                  left: -15,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                }}
              />
            </>
          )}
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              variant={dialogMode === 'view' ? 'h4' : 'h5'}
              sx={{
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {dialogMode === 'create' && (
                <>
                  <Add sx={{ fontSize: '1.5rem' }} />
                  Create New Staff Member
                </>
              )}
              {dialogMode === 'edit' && (
                <>
                  <Edit sx={{ fontSize: '1.5rem' }} />
                  Edit Staff Member
                </>
              )}
              {dialogMode === 'view' && (
                <>
                  <Person sx={{ fontSize: '2rem' }} />
                  Staff Member Profile
                </>
              )}
            </Typography>
            {dialogMode === 'view' && (
              <Typography
                variant='body1'
                sx={{
                  mt: 1,
                  opacity: 0.9,
                  fontWeight: 400,
                }}
              >
                Complete staff member information and details
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {dialogMode === 'view' ? (
              <Box>
                {/* Header Section with Gradient Background */}
                <Box
                  sx={{
                    background:
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 3,
                    p: 4,
                    mb: 4,
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Decorative Elements */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -20,
                      right: -20,
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
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.08)',
                    }}
                  />

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        width: 80,
                        height: 80,
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        border: '3px solid rgba(255,255,255,0.3)',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      {staffForm.firstName
                        ? staffForm.firstName.charAt(0).toUpperCase()
                        : 'S'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant='h3'
                        sx={{
                          fontWeight: 'bold',
                          mb: 1,
                          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                      >
                        {staffForm.firstName} {staffForm.lastName}
                      </Typography>
                      <Box
                        sx={{ display: 'flex', gap: 2, alignItems: 'center' }}
                      >
                        <Chip
                          label={staffForm.employeeId}
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontWeight: 600,
                            border: '1px solid rgba(255,255,255,0.3)',
                            backdropFilter: 'blur(10px)',
                          }}
                        />
                        <Chip
                          label={staffForm.isActive ? 'Active' : 'Inactive'}
                          sx={{
                            bgcolor: staffForm.isActive
                              ? 'rgba(76, 175, 80, 0.8)'
                              : 'rgba(158, 158, 158, 0.8)',
                            color: 'white',
                            fontWeight: 600,
                            border: '1px solid rgba(255,255,255,0.3)',
                            backdropFilter: 'blur(10px)',
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Contact Information Card */}
                <Card
                  sx={{
                    mb: 3,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <Person
                        sx={{
                          color: 'primary.main',
                          fontSize: '1.5rem',
                        }}
                      />
                      <Typography
                        variant='h6'
                        sx={{
                          fontWeight: 600,
                          color: 'primary.main',
                        }}
                      >
                        Contact Information
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: 'repeat(2, 1fr)',
                        },
                        gap: 3,
                      }}
                    >
                      <Box>
                        <Typography
                          variant='subtitle2'
                          color='text.secondary'
                          gutterBottom
                          sx={{ fontWeight: 600 }}
                        >
                          Email Address
                        </Typography>
                        <Typography
                          variant='body1'
                          sx={{
                            fontWeight: 500,
                            color: 'text.primary',
                            wordBreak: 'break-word',
                          }}
                        >
                          {staffForm.email}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant='subtitle2'
                          color='text.secondary'
                          gutterBottom
                          sx={{ fontWeight: 600 }}
                        >
                          Full Name
                        </Typography>
                        <Typography
                          variant='body1'
                          sx={{
                            fontWeight: 500,
                            color: 'text.primary',
                          }}
                        >
                          {staffForm.firstName} {staffForm.lastName}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Employment Information Card */}
                <Card
                  sx={{
                    mb: 3,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <Business
                        sx={{
                          color: 'secondary.main',
                          fontSize: '1.5rem',
                        }}
                      />
                      <Typography
                        variant='h6'
                        sx={{
                          fontWeight: 600,
                          color: 'secondary.main',
                        }}
                      >
                        Employment Information
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: 'repeat(2, 1fr)',
                        },
                        gap: 3,
                      }}
                    >
                      <Box>
                        <Typography
                          variant='subtitle2'
                          color='text.secondary'
                          gutterBottom
                          sx={{ fontWeight: 600 }}
                        >
                          Employee ID
                        </Typography>
                        <Chip
                          label={staffForm.employeeId}
                          color='primary'
                          variant='outlined'
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant='subtitle2'
                          color='text.secondary'
                          gutterBottom
                          sx={{ fontWeight: 600 }}
                        >
                          Department
                        </Typography>
                        <Chip
                          label={
                            selectedStaff?.department?.name || 'No Department'
                          }
                          color='secondary'
                          variant='outlined'
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant='subtitle2'
                          color='text.secondary'
                          gutterBottom
                          sx={{ fontWeight: 600 }}
                        >
                          Specialization
                        </Typography>
                        <Typography
                          variant='body1'
                          sx={{
                            fontWeight: 500,
                            color: 'text.primary',
                            fontStyle: staffForm.specialization
                              ? 'normal'
                              : 'italic',
                          }}
                        >
                          {staffForm.specialization || 'Not specified'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant='subtitle2'
                          color='text.secondary'
                          gutterBottom
                          sx={{ fontWeight: 600 }}
                        >
                          License Number
                        </Typography>
                        <Typography
                          variant='body1'
                          sx={{
                            fontWeight: 500,
                            color: 'text.primary',
                            fontStyle: staffForm.licenseNumber
                              ? 'normal'
                              : 'italic',
                          }}
                        >
                          {staffForm.licenseNumber || 'Not specified'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant='subtitle2'
                          color='text.secondary'
                          gutterBottom
                          sx={{ fontWeight: 600 }}
                        >
                          Hire Date
                        </Typography>
                        <Typography
                          variant='body1'
                          sx={{
                            fontWeight: 500,
                            color: 'text.primary',
                          }}
                        >
                          {new Date(staffForm.hireDate).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }
                          )}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant='subtitle2'
                          color='text.secondary'
                          gutterBottom
                          sx={{ fontWeight: 600 }}
                        >
                          Employment Status
                        </Typography>
                        <Chip
                          label={staffForm.isActive ? 'Active' : 'Inactive'}
                          color={staffForm.isActive ? 'success' : 'default'}
                          variant='filled'
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Additional Information Card */}
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <CheckCircle
                        sx={{
                          color: 'success.main',
                          fontSize: '1.5rem',
                        }}
                      />
                      <Typography
                        variant='h6'
                        sx={{
                          fontWeight: 600,
                          color: 'success.main',
                        }}
                      >
                        Additional Information
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: 'repeat(2, 1fr)',
                        },
                        gap: 3,
                      }}
                    >
                      <Box>
                        <Typography
                          variant='subtitle2'
                          color='text.secondary'
                          gutterBottom
                          sx={{ fontWeight: 600 }}
                        >
                          Years of Service
                        </Typography>
                        <Typography
                          variant='body1'
                          sx={{
                            fontWeight: 500,
                            color: 'text.primary',
                          }}
                        >
                          {Math.floor(
                            (new Date().getTime() -
                              new Date(staffForm.hireDate).getTime()) /
                              (1000 * 60 * 60 * 24 * 365)
                          )}{' '}
                          years
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant='subtitle2'
                          color='text.secondary'
                          gutterBottom
                          sx={{ fontWeight: 600 }}
                        >
                          Account Status
                        </Typography>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: staffForm.isActive
                                ? 'success.main'
                                : 'grey.400',
                            }}
                          />
                          <Typography
                            variant='body1'
                            sx={{
                              fontWeight: 500,
                              color: staffForm.isActive
                                ? 'success.main'
                                : 'text.secondary',
                            }}
                          >
                            {staffForm.isActive
                              ? 'Active Account'
                              : 'Inactive Account'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography
                          variant='subtitle2'
                          color='text.secondary'
                          gutterBottom
                          sx={{ fontWeight: 600 }}
                        >
                          Service Provider Status
                        </Typography>
                        <Chip
                          label={
                            selectedStaff?.serviceProvider
                              ? 'Service Provider'
                              : 'Non-Service Provider'
                          }
                          color={
                            selectedStaff?.serviceProvider
                              ? 'primary'
                              : 'default'
                          }
                          variant='filled'
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ) : (
              <Box>
                {/* Personal Information Section */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant='h6'
                    sx={{
                      mb: 2,
                      fontWeight: 600,
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Person fontSize='small' />
                    Personal Information
                  </Typography>
                  <Stack spacing={3}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: 'repeat(2, 1fr)',
                        },
                        gap: 3,
                      }}
                    >
                      <TextField
                        fullWidth
                        label='First Name'
                        value={staffForm.firstName}
                        onChange={(e) =>
                          setStaffForm({
                            ...staffForm,
                            firstName: e.target.value,
                          })
                        }
                        required
                        disabled={dialogMode === 'edit'}
                        variant='outlined'
                      />
                      <TextField
                        fullWidth
                        label='Last Name'
                        value={staffForm.lastName}
                        onChange={(e) =>
                          setStaffForm({
                            ...staffForm,
                            lastName: e.target.value,
                          })
                        }
                        required
                        disabled={dialogMode === 'edit'}
                        variant='outlined'
                      />
                    </Box>
                    <TextField
                      fullWidth
                      label='Email Address'
                      type='email'
                      value={staffForm.email}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, email: e.target.value })
                      }
                      required
                      disabled={dialogMode === 'edit'}
                      variant='outlined'
                      helperText={
                        dialogMode === 'edit'
                          ? 'Email cannot be changed after creation'
                          : 'Staff member will receive login credentials at this email'
                      }
                    />
                  </Stack>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Employment Information Section */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant='h6'
                    sx={{
                      mb: 2,
                      fontWeight: 600,
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Business fontSize='small' />
                    Employment Information
                  </Typography>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label='Employee ID'
                      value={staffForm.employeeId}
                      onChange={(e) =>
                        setStaffForm({
                          ...staffForm,
                          employeeId: e.target.value,
                        })
                      }
                      required
                      variant='outlined'
                      helperText='Unique identifier for the staff member'
                    />
                    <FormControl fullWidth required variant='outlined'>
                      <InputLabel>Department</InputLabel>
                      <Select
                        value={staffForm.departmentId || ''}
                        onChange={(e) => {
                          setStaffForm({
                            ...staffForm,
                            departmentId: e.target.value,
                          });
                        }}
                        label='Department'
                        disabled={!departmentsData?.data}
                      >
                        {!departmentsData?.data ? (
                          <MenuItem disabled>
                            <Typography variant='body2' color='text.secondary'>
                              Loading departments...
                            </Typography>
                          </MenuItem>
                        ) : (
                          departmentsData.data.map((department) => (
                            <MenuItem key={department.id} value={department.id}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <Business fontSize='small' color='action' />
                                <Box>
                                  <Typography
                                    variant='body2'
                                    sx={{ fontWeight: 500 }}
                                  >
                                    {department.name}
                                  </Typography>
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                  >
                                    {department.code}
                                  </Typography>
                                </Box>
                              </Box>
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: 'repeat(2, 1fr)',
                        },
                        gap: 3,
                      }}
                    >
                      <TextField
                        fullWidth
                        label='Specialization'
                        value={staffForm.specialization}
                        onChange={(e) =>
                          setStaffForm({
                            ...staffForm,
                            specialization: e.target.value,
                          })
                        }
                        variant='outlined'
                        placeholder='e.g., Cardiologist, Nurse'
                      />
                      <TextField
                        fullWidth
                        label='License Number'
                        value={staffForm.licenseNumber}
                        onChange={(e) =>
                          setStaffForm({
                            ...staffForm,
                            licenseNumber: e.target.value,
                          })
                        }
                        variant='outlined'
                        placeholder='Professional license number'
                      />
                    </Box>
                    <TextField
                      fullWidth
                      label='Hire Date'
                      type='date'
                      value={staffForm.hireDate}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, hireDate: e.target.value })
                      }
                      InputLabelProps={{ shrink: true }}
                      required
                      variant='outlined'
                    />
                  </Stack>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Status Section */}
                <Box>
                  <Typography
                    variant='h6'
                    sx={{
                      mb: 2,
                      fontWeight: 600,
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <CheckCircle fontSize='small' />
                    Status
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={staffForm.isActive}
                        onChange={(e) =>
                          setStaffForm({
                            ...staffForm,
                            isActive: e.target.checked,
                          })
                        }
                        color='primary'
                      />
                    }
                    label={
                      <Box>
                        <Typography variant='body2' sx={{ fontWeight: 500 }}>
                          Active Staff Member
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {staffForm.isActive
                            ? 'Staff member can access the system'
                            : 'Staff member is inactive and cannot access the system'}
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={staffForm.serviceProvider || false}
                        onChange={(e) =>
                          setStaffForm({
                            ...staffForm,
                            serviceProvider: e.target.checked,
                          })
                        }
                        color='primary'
                      />
                    }
                    label={
                      <Box>
                        <Typography variant='body2' sx={{ fontWeight: 500 }}>
                          Service Provider
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {staffForm.serviceProvider
                            ? 'Staff member can provide services to patients and be selected for appointments'
                            : 'Staff member cannot provide services or be selected for appointments'}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            pt: 2,
            gap: 2,
            background:
              dialogMode === 'view'
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)'
                : 'transparent',
            borderRadius: dialogMode === 'view' ? '0 0 12px 12px' : 0,
          }}
        >
          <Button
            onClick={handleCloseDialog}
            variant={dialogMode === 'view' ? 'contained' : 'outlined'}
            color={dialogMode === 'view' ? 'primary' : 'inherit'}
            sx={{
              minWidth: 100,
              ...(dialogMode === 'view' && {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                },
              }),
            }}
          >
            {dialogMode === 'view' ? 'Close Profile' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button
              variant='contained'
              onClick={handleSubmitStaff}
              disabled={
                createStaffMutation.isPending ||
                updateStaffMutation.isPending ||
                !staffForm.email ||
                !staffForm.firstName ||
                !staffForm.lastName ||
                !staffForm.employeeId ||
                !staffForm.departmentId ||
                !staffForm.hireDate
              }
              sx={{
                minWidth: 120,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                },
              }}
            >
              {createStaffMutation.isPending || updateStaffMutation.isPending
                ? 'Saving...'
                : dialogMode === 'create'
                ? 'Create Staff'
                : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                bgcolor: 'error.main',
                width: 40,
                height: 40,
              }}
            >
              <Delete />
            </Avatar>
            <Box>
              <Typography variant='h6' sx={{ fontWeight: 600 }}>
                Delete Staff Member
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                This action cannot be undone
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant='body1' sx={{ mb: 2 }}>
              Are you sure you want to delete the staff member{' '}
              <strong>
                "{staffToDelete?.user.firstName} {staffToDelete?.user.lastName}"
              </strong>
              ?
            </Typography>

            {staffToDelete && (
              <Box
                sx={{
                  bgcolor: 'error.50',
                  p: 2,
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'error.200',
                }}
              >
                <Typography
                  variant='body2'
                  color='error.main'
                  sx={{ fontWeight: 600, mb: 1 }}
                >
                  Warning:
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  This will permanently remove the staff member and all their
                  associated data. This action cannot be undone.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={handleCancelDelete}
            variant='outlined'
            color='inherit'
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant='contained'
            color='error'
            startIcon={<Delete />}
            disabled={deleteStaffMutation.isPending}
          >
            {deleteStaffMutation.isPending
              ? 'Deleting...'
              : 'Delete Staff Member'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
