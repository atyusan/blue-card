import React, { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Avatar,
  Divider,
  Alert,
  Skeleton,
  Stack,
  Paper,
  TablePagination,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Business,
  People,
  MedicalServices,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Refresh,
} from '@mui/icons-material';
import { usePermissions } from '@/hooks/usePermissions';
import { departmentsService } from '../services/departments.service';
import type {
  Department,
  DepartmentStats,
  CreateDepartmentData,
} from '../services/departments.service';

export const DepartmentsPage: React.FC = () => {
  const { canViewDepartments, canManageDepartments } = usePermissions();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [counts, setCounts] = useState<{
    totalDepartments: number;
    activeDepartments: number;
  } | null>(null);

  // Dialog states
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>(
    'create'
  );
  const [departmentStats, setDepartmentStats] =
    useState<DepartmentStats | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateDepartmentData>({
    name: '',
    code: '',
    description: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Snackbar states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // Delete confirmation dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] =
    useState<Department | null>(null);

  const showSnackbar = useCallback(
    (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
      setSnackbar({ open: true, message, severity });
    },
    []
  );

  const loadDepartments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        search: searchTerm || undefined,
        isActive:
          statusFilter === 'all' ? undefined : statusFilter === 'active',
        sortBy,
        sortOrder,
        page: page + 1,
        limit: rowsPerPage,
      };

      const response = await departmentsService.getDepartments(params);
      setDepartments(response.data);
      setTotalDepartments(response.total);
      setCounts(response.counts || null);
    } catch (error) {
      console.error('Error loading departments:', error);
      showSnackbar('Failed to load departments', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [
    searchTerm,
    statusFilter,
    sortBy,
    sortOrder,
    page,
    rowsPerPage,
    showSnackbar,
  ]);

  useEffect(() => {
    if (canViewDepartments()) {
      loadDepartments();
    }
  }, [canViewDepartments, loadDepartments]);

  const loadDepartmentStats = async (departmentId: string) => {
    try {
      const stats = await departmentsService.getDepartmentStats(departmentId);
      setDepartmentStats(stats);
    } catch (error) {
      console.error('Error loading department stats:', error);
    }
  };

  const handleCreateDepartment = () => {
    setSelectedDepartment(null);
    setDialogMode('create');
    setFormData({
      name: '',
      code: '',
      description: '',
      isActive: true,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setDialogMode('edit');
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || '',
      isActive: department.isActive,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleViewDepartment = async (department: Department) => {
    setSelectedDepartment(department);
    setDialogMode('view');
    setDialogOpen(true);
    await loadDepartmentStats(department.id);
  };

  const handleDeleteDepartment = (department: Department) => {
    setDepartmentToDelete(department);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!departmentToDelete) return;

    try {
      await departmentsService.deleteDepartment(departmentToDelete.id);
      showSnackbar('Department deleted successfully', 'success');
      loadDepartments();
      setDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    } catch (error: any) {
      console.error('Error deleting department:', error);
      const message =
        error.response?.data?.message || 'Failed to delete department';
      showSnackbar(message, 'error');
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setDepartmentToDelete(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedDepartment(null);
    setDepartmentStats(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      isActive: true,
    });
    setFormErrors({});
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setFormErrors({});

    try {
      if (dialogMode === 'create') {
        await departmentsService.createDepartment(formData);
        showSnackbar('Department created successfully', 'success');
      } else if (dialogMode === 'edit' && selectedDepartment) {
        await departmentsService.updateDepartment(
          selectedDepartment.id,
          formData
        );
        showSnackbar('Department updated successfully', 'success');
      }

      handleCloseDialog();
      loadDepartments();
    } catch (error: any) {
      console.error('Error saving department:', error);
      const message =
        error.response?.data?.message || 'Failed to save department';
      showSnackbar(message, 'error');

      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
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

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch =
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dept.description &&
        dept.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && dept.isActive) ||
      (statusFilter === 'inactive' && !dept.isActive);

    return matchesSearch && matchesStatus;
  });

  if (!canViewDepartments()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error' sx={{ textAlign: 'center' }}>
          You don't have permission to view departments.
        </Alert>
      </Box>
    );
  }

  if (isLoading && departments.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant='h6' sx={{ textAlign: 'center', mb: 3 }}>
          Loading departments...
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
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
    <Box sx={{ p: 3 }}>
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
            Departments
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Manage organizational departments and staff assignments
          </Typography>
        </Box>
        {canManageDepartments() && (
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={handleCreateDepartment}
            sx={{ height: 40 }}
          >
            Add Department
          </Button>
        )}
      </Box>

      {/* Overview Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 2,
          mb: 3,
        }}
      >
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                <Business />
              </Avatar>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Total Departments
                </Typography>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {counts ? counts.totalDepartments : '-'}
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
                  Active Departments
                </Typography>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {counts ? counts.activeDepartments : '-'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <TextField
              placeholder='Search departments...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, minWidth: 200 }}
            />

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label='Status'
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <MenuItem value='all'>All</MenuItem>
                <MenuItem value='active'>Active</MenuItem>
                <MenuItem value='inactive'>Inactive</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant='outlined'
              startIcon={<Refresh />}
              onClick={loadDepartments}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Departments Table */}
      <Card>
        <CardHeader
          title='All Departments'
          subheader={`${filteredDepartments.length} departments found`}
        />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Department
                    <IconButton size='small' onClick={() => handleSort('name')}>
                      {sortBy === 'name' && sortOrder === 'asc' ? (
                        <TrendingUp />
                      ) : (
                        <TrendingDown />
                      )}
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Code
                    <IconButton size='small' onClick={() => handleSort('code')}>
                      {sortBy === 'code' && sortOrder === 'asc' ? (
                        <TrendingUp />
                      ) : (
                        <TrendingDown />
                      )}
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Staff</TableCell>
                <TableCell>Services</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDepartments.map((department) => (
                <TableRow key={department.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}
                      >
                        {department.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography
                          variant='subtitle2'
                          sx={{ fontWeight: 600 }}
                        >
                          {department.name}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={department.code}
                      size='small'
                      color='primary'
                      variant='outlined'
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2' color='text.secondary'>
                      {department.description || 'No description'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <People fontSize='small' color='action' />
                      <Typography variant='body2'>
                        {department._count?.staffMembers || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MedicalServices fontSize='small' color='action' />
                      <Typography variant='body2'>
                        {department._count?.services || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={department.isActive ? 'Active' : 'Inactive'}
                      color={department.isActive ? 'success' : 'default'}
                      size='small'
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
                          onClick={() => handleViewDepartment(department)}
                        >
                          <Visibility fontSize='small' />
                        </IconButton>
                      </Tooltip>
                      {canManageDepartments() && (
                        <>
                          <Tooltip title='Edit Department'>
                            <IconButton
                              size='small'
                              onClick={() => handleEditDepartment(department)}
                            >
                              <Edit fontSize='small' />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Delete Department'>
                            <IconButton
                              size='small'
                              onClick={() => handleDeleteDepartment(department)}
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
          rowsPerPageOptions={[5, 10, 25]}
          component='div'
          count={totalDepartments}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Department Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' && 'Create New Department'}
          {dialogMode === 'edit' && 'Edit Department'}
          {dialogMode === 'view' && 'Department Details'}
        </DialogTitle>
        <DialogContent>
          {dialogMode === 'view' && selectedDepartment ? (
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Box>
                <Typography variant='h6' gutterBottom>
                  {selectedDepartment.name}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {selectedDepartment.description || 'No description provided'}
                </Typography>
              </Box>

              <Divider />

              <Box
                sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
              >
                <Box>
                  <Typography variant='subtitle1' gutterBottom>
                    Department Code
                  </Typography>
                  <Chip
                    label={selectedDepartment.code}
                    color='primary'
                    variant='outlined'
                  />
                </Box>
                <Box>
                  <Typography variant='subtitle1' gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    label={selectedDepartment.isActive ? 'Active' : 'Inactive'}
                    color={selectedDepartment.isActive ? 'success' : 'default'}
                  />
                </Box>
              </Box>

              {departmentStats && (
                <>
                  <Divider />
                  <Typography variant='h6' gutterBottom>
                    Statistics
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 2,
                    }}
                  >
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant='h4' color='primary'>
                        {departmentStats.staffCount}
                      </Typography>
                      <Typography variant='body2'>Staff Members</Typography>
                    </Paper>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant='h4' color='secondary'>
                        {departmentStats.serviceCount}
                      </Typography>
                      <Typography variant='body2'>Services</Typography>
                    </Paper>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant='h4' color='success.main'>
                        {departmentStats.totalConsultations}
                      </Typography>
                      <Typography variant='body2'>Consultations</Typography>
                    </Paper>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant='h4' color='info.main'>
                        {departmentStats.totalAppointments}
                      </Typography>
                      <Typography variant='body2'>Appointments</Typography>
                    </Paper>
                  </Box>
                </>
              )}
            </Stack>
          ) : (
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label='Department Name'
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                fullWidth
                required
                error={!!formErrors.name}
                helperText={formErrors.name}
              />

              <TextField
                label='Department Code'
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                fullWidth
                required
                error={!!formErrors.code}
                helperText={formErrors.code}
                inputProps={{ maxLength: 10 }}
              />

              <TextField
                label='Description'
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                fullWidth
                multiline
                rows={3}
                error={!!formErrors.description}
                helperText={formErrors.description}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                }
                label='Active Department'
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button
              variant='contained'
              onClick={handleSubmit}
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              {isSubmitting
                ? 'Saving...'
                : dialogMode === 'create'
                ? 'Create'
                : 'Save'}
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
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'error.main', width: 40, height: 40 }}>
            <Delete />
          </Avatar>
          Confirm Delete Department
        </DialogTitle>
        <DialogContent>
          <Typography variant='body1' sx={{ mb: 2 }}>
            Are you sure you want to delete the department{' '}
            <strong>"{departmentToDelete?.name}"</strong>?
          </Typography>
          <Alert severity='warning' sx={{ mb: 2 }}>
            This action cannot be undone. All associated staff members and
            services will be unlinked from this department.
          </Alert>
          {departmentToDelete && (
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Typography variant='subtitle2' gutterBottom>
                Department Details:
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                <strong>Code:</strong> {departmentToDelete.code}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                <strong>Staff Members:</strong>{' '}
                {departmentToDelete._count?.staffMembers || 0}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                <strong>Services:</strong>{' '}
                {departmentToDelete._count?.services || 0}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color='inherit'>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color='error'
            variant='contained'
            startIcon={<Delete />}
          >
            Delete Department
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
