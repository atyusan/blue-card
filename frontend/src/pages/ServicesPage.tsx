import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Stack,
  TablePagination,
} from '@mui/material';
import {
  Search,
  Edit,
  Visibility,
  Delete,
  Add,
  MedicalServices,
  Category,
  Warning,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { usePermissions } from '../hooks/usePermissions';
import PageHeader from '../components/common/PageHeader';
import { serviceService } from '../services/service.service';
import { departmentsService } from '../services/departments.service';
import type {
  ServiceCategory,
  CreateServiceData,
  CreateServiceCategoryData,
  ServiceQueryParams,
} from '../services/service.service';
import type { Department } from '../services/departments.service';

interface Service {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  departmentId?: string;
  basePrice: number;
  serviceCode?: string;
  isActive: boolean;
  requiresPrePayment: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServiceWithCategory extends Service {
  category?: ServiceCategory;
  department?: Department;
}

export const ServicesPage: React.FC = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Table data state for smooth updates
  const [tableData, setTableData] = useState<{
    services: ServiceWithCategory[];
    categories: ServiceCategory[];
    departments: Department[];
    counts: {
      totalServices: number;
      activeServices: number;
      inactiveServices: number;
    } | null;
  }>({
    services: [],
    categories: [],
    departments: [],
    counts: null,
  });

  // Dialog states
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>(
    'create'
  );
  const [selectedService, setSelectedService] =
    useState<ServiceWithCategory | null>(null);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] =
    useState<ServiceCategory | null>(null);

  // Form states
  const [serviceForm, setServiceForm] = useState<CreateServiceData>({
    name: '',
    description: '',
    categoryId: '',
    basePrice: 0,
    serviceCode: '',
    departmentId: '',
    requiresPrePayment: false,
  });
  const [categoryForm, setCategoryForm] = useState<CreateServiceCategoryData>({
    name: '',
    description: '',
  });

  // UI states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('success');

  // Permissions
  const { hasPermission } = usePermissions();
  const canManageServices =
    hasPermission('manage_services') || hasPermission('system_configuration');

  // Snackbar helper
  const showSnackbar = useCallback(
    (
      message: string,
      severity: 'success' | 'error' | 'warning' = 'success'
    ) => {
      setSnackbarMessage(message);
      setSnackbarSeverity(severity);
      setSnackbarOpen(true);
    },
    []
  );

  // Load services
  const loadServices = useCallback(async () => {
    try {
      // Only show main loading on initial load or when changing non-search filters
      if (searchTerm !== debouncedSearchTerm) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }

      const queryParams: ServiceQueryParams = {
        search: debouncedSearchTerm || undefined,
        categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
        departmentId:
          selectedDepartment !== 'all' ? selectedDepartment : undefined,
        isActive:
          statusFilter === 'all' ? undefined : statusFilter === 'active',
      };

      const [servicesResponse, categoriesData, departmentsData] =
        await Promise.all([
          serviceService.getServices(queryParams),
          serviceService.getServiceCategories(),
          departmentsService.getDepartments(),
        ]);

      // Update table data state atomically for smooth updates
      setTableData({
        services: servicesResponse.data as unknown as ServiceWithCategory[],
        categories: categoriesData,
        departments: departmentsData.data,
        counts: servicesResponse.counts || null,
      });
    } catch (error: unknown) {
      console.error('Error loading services:', error);
      showSnackbar(getErrorMessage(error, 'Failed to load services'), 'error');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, [
    debouncedSearchTerm,
    selectedCategory,
    selectedDepartment,
    statusFilter,
    showSnackbar,
    searchTerm,
  ]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load services on mount and when filters change
  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Service CRUD operations
  const handleCreateService = () => {
    setDialogMode('create');
    setServiceForm({
      name: '',
      description: '',
      categoryId: '',
      basePrice: 0,
      serviceCode: '',
      departmentId: '',
      requiresPrePayment: false,
    });
    setSelectedService(null);
    setServiceDialogOpen(true);
  };

  const handleEditService = (service: ServiceWithCategory) => {
    setDialogMode('edit');
    setSelectedService(service);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      categoryId: service.categoryId || '',
      basePrice:
        typeof service.basePrice === 'string'
          ? parseFloat(service.basePrice) || 0
          : service.basePrice || 0,
      serviceCode: service.serviceCode || '',
      departmentId: service.departmentId || '',
      requiresPrePayment: service.requiresPrePayment || false,
    });
    setServiceDialogOpen(true);
  };

  const handleViewService = (service: ServiceWithCategory) => {
    setDialogMode('view');
    setSelectedService(service);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      categoryId: service.categoryId || '',
      basePrice:
        typeof service.basePrice === 'string'
          ? parseFloat(service.basePrice) || 0
          : service.basePrice || 0,
      serviceCode: service.serviceCode || '',
      departmentId: service.departmentId || '',
      requiresPrePayment: service.requiresPrePayment || false,
    });
    setServiceDialogOpen(true);
  };

  const handleDeactivateService = (service: ServiceWithCategory) => {
    setSelectedService(service);
    setDeactivateDialogOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!selectedService) return;

    try {
      await serviceService.deactivateService(selectedService.id);
      showSnackbar('Service deactivated successfully');
      loadServices();
    } catch (error: unknown) {
      console.error('Error deactivating service:', error);
      showSnackbar(
        getErrorMessage(error, 'Failed to deactivate service'),
        'error'
      );
    } finally {
      setDeactivateDialogOpen(false);
      setSelectedService(null);
    }
  };

  const handleSubmitService = async () => {
    try {
      if (dialogMode === 'create') {
        await serviceService.createService(serviceForm);
        showSnackbar('Service created successfully');
      } else if (dialogMode === 'edit' && selectedService) {
        await serviceService.updateService(selectedService.id, serviceForm);
        showSnackbar('Service updated successfully');
      }
      loadServices();
      setServiceDialogOpen(false);
    } catch (error: unknown) {
      console.error('Error saving service:', error);
      showSnackbar(getErrorMessage(error, 'Failed to save service'), 'error');
    }
  };

  // Category CRUD operations
  const handleCreateCategory = () => {
    setCategoryForm({ name: '', description: '' });
    setSelectedCategoryForEdit(null);
    setCategoryDialogOpen(true);
  };

  const handleSubmitCategory = async () => {
    try {
      if (selectedCategoryForEdit) {
        await serviceService.updateServiceCategory(
          selectedCategoryForEdit.id,
          categoryForm
        );
        showSnackbar('Category updated successfully');
      } else {
        await serviceService.createServiceCategory(categoryForm);
        showSnackbar('Category created successfully');
      }
      loadServices();
      setCategoryDialogOpen(false);
    } catch (error: unknown) {
      console.error('Error saving category:', error);
      showSnackbar(getErrorMessage(error, 'Failed to save category'), 'error');
    }
  };

  // Services are already filtered by the backend API
  const filteredServices = tableData.services;

  // Pagination
  const paginatedServices = filteredServices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Format price helper
  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) return '0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  // Get display values for view mode
  const getCategoryName = (categoryId: string): string => {
    const category = tableData.categories.find((c) => c.id === categoryId);
    return category ? category.name : 'N/A';
  };

  const getDepartmentName = (departmentId: string | undefined): string => {
    if (!departmentId) return 'No Department';
    const department = tableData.departments.find((d) => d.id === departmentId);
    return department ? department.name : 'N/A';
  };

  // Helper function to extract error message
  const getErrorMessage = (error: unknown, defaultMessage: string): string => {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message;
      }
    }
    if (error && typeof error === 'object' && 'message' in error) {
      const errorWithMessage = error as { message: string };
      return errorWithMessage.message;
    }
    return defaultMessage;
  };

  // Check permissions
  if (!hasPermission('view_services')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error'>
          You don't have permission to view services. Please contact your
          administrator.
        </Alert>
      </Box>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title='Services Management'
          subtitle='Manage hospital services, pricing, and availability'
        />
        <Box sx={{ mt: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: 3,
            }}
          >
            {[1, 2, 3, 4].map((item) => (
              <Card key={item}>
                <CardContent>
                  <Skeleton variant='text' height={40} />
                  <Skeleton variant='text' height={20} />
                </CardContent>
              </Card>
            ))}
          </Box>
          <Box sx={{ mt: 3 }}>
            <Skeleton variant='rectangular' height={400} />
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title='Services Management'
        subtitle='Manage hospital services, pricing, and availability'
        actions={
          canManageServices && (
            <Stack direction='row' spacing={2}>
              <Button
                variant='outlined'
                startIcon={<Category />}
                onClick={handleCreateCategory}
              >
                Add Category
              </Button>
              <Button
                variant='contained'
                startIcon={<Add />}
                onClick={handleCreateService}
              >
                Add Service
              </Button>
            </Stack>
          )
        }
      />

      {/* Overview Cards */}
      <Box sx={{ mt: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 3,
          }}
        >
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <MedicalServices />
                </Avatar>
                <Box>
                  <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                    {tableData.counts ? tableData.counts.totalServices : '-'}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total Services
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                    {tableData.counts ? tableData.counts.activeServices : '-'}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Active Services
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Cancel />
                </Avatar>
                <Box>
                  <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                    {tableData.counts ? tableData.counts.inactiveServices : '-'}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Inactive Services
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <Category />
                </Avatar>
                <Box>
                  <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                    {tableData.categories.length}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Categories
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
              gap: 3,
              alignItems: 'center',
            }}
          >
            <TextField
              fullWidth
              placeholder='Search services...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchLoading && (
                  <InputAdornment position='end'>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        border: '2px solid #f3f3f3',
                        borderTop: '2px solid #1976d2',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' },
                        },
                      }}
                    />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label='Category'
              >
                <MenuItem value='all'>All Categories</MenuItem>
                {tableData.categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                label='Department'
              >
                <MenuItem value='all'>All Departments</MenuItem>
                {tableData.departments.map((department) => (
                  <MenuItem key={department.id} value={department.id}>
                    {department.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label='Status'
              >
                <MenuItem value='all'>All Status</MenuItem>
                <MenuItem value='active'>Active</MenuItem>
                <MenuItem value='inactive'>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <TableContainer
            sx={{
              opacity: searchLoading ? 0.7 : 1,
              transition: 'opacity 0.2s ease-in-out',
              transform: 'translateZ(0)', // Force hardware acceleration
            }}
          >
            <Table
              key={`services-table-${debouncedSearchTerm}-${selectedCategory}-${selectedDepartment}-${statusFilter}`}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Service</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Pre-Payment</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {searchLoading && paginatedServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align='center' sx={{ py: 4 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 2,
                        }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            border: '2px solid #f3f3f3',
                            borderTop: '2px solid #1976d2',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            '@keyframes spin': {
                              '0%': { transform: 'rotate(0deg)' },
                              '100%': { transform: 'rotate(360deg)' },
                            },
                          }}
                        />
                        <Typography variant='body2' color='text.secondary'>
                          Searching services...
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedServices.map((service) => (
                    <TableRow
                      key={service.id}
                      hover
                      sx={{
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography
                            variant='subtitle2'
                            sx={{ fontWeight: 'bold' }}
                          >
                            {service.name}
                          </Typography>
                          {service.description && (
                            <Typography variant='body2' color='text.secondary'>
                              {service.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={service.category?.name || 'N/A'}
                          size='small'
                          color='primary'
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={service.department?.name || 'N/A'}
                          size='small'
                          color='secondary'
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                          ${formatPrice(service.basePrice)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' fontFamily='monospace'>
                          {service.serviceCode || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={service.isActive ? 'Active' : 'Inactive'}
                          size='small'
                          color={service.isActive ? 'success' : 'default'}
                          variant={service.isActive ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            service.requiresPrePayment
                              ? 'Required'
                              : 'Not Required'
                          }
                          size='small'
                          color={
                            service.requiresPrePayment ? 'warning' : 'default'
                          }
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell align='right'>
                        <Stack
                          direction='row'
                          spacing={1}
                          justifyContent='flex-end'
                        >
                          <Tooltip title='View'>
                            <IconButton
                              size='small'
                              onClick={() => handleViewService(service)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          {canManageServices && (
                            <>
                              <Tooltip title='Edit'>
                                <IconButton
                                  size='small'
                                  onClick={() => handleEditService(service)}
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title='Deactivate'>
                                <IconButton
                                  size='small'
                                  onClick={() =>
                                    handleDeactivateService(service)
                                  }
                                  color='error'
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component='div'
            count={filteredServices.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              opacity: searchLoading ? 0.7 : 1,
              transition: 'opacity 0.2s ease-in-out',
            }}
          />
        </CardContent>
      </Card>

      {/* Service Dialog */}
      <Dialog
        open={serviceDialogOpen}
        onClose={() => setServiceDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' && 'Create Service'}
          {dialogMode === 'edit' && 'Edit Service'}
          {dialogMode === 'view' && 'Service Details'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 3,
              }}
            >
              <TextField
                fullWidth
                label='Service Name'
                value={serviceForm.name}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, name: e.target.value })
                }
                disabled={dialogMode === 'view'}
                required
              />
              <TextField
                fullWidth
                label='Service Code'
                value={serviceForm.serviceCode}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,
                    serviceCode: e.target.value,
                  })
                }
                disabled={dialogMode === 'view'}
              />
            </Box>
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label='Description'
                value={serviceForm.description}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,
                    description: e.target.value,
                  })
                }
                disabled={dialogMode === 'view'}
                multiline
                rows={3}
              />
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 3,
                mt: 3,
              }}
            >
              {dialogMode === 'view' ? (
                <TextField
                  fullWidth
                  label='Category'
                  value={getCategoryName(serviceForm.categoryId)}
                  disabled
                />
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={serviceForm.categoryId}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        categoryId: e.target.value,
                      })
                    }
                    label='Category'
                    required
                  >
                    {tableData.categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              {dialogMode === 'view' ? (
                <TextField
                  fullWidth
                  label='Department'
                  value={getDepartmentName(serviceForm.departmentId)}
                  disabled
                />
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={serviceForm.departmentId || ''}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        departmentId: e.target.value,
                      })
                    }
                    label='Department'
                  >
                    <MenuItem value=''>No Department</MenuItem>
                    {tableData.departments.map((department) => (
                      <MenuItem key={department.id} value={department.id}>
                        {department.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label='Base Price'
                type='number'
                value={serviceForm.basePrice}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,
                    basePrice: parseFloat(e.target.value) || 0,
                  })
                }
                disabled={dialogMode === 'view'}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>$</InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box sx={{ mt: 3 }}>
              {dialogMode === 'view' ? (
                <TextField
                  fullWidth
                  label='Pre-Payment Required'
                  value={serviceForm.requiresPrePayment ? 'Yes' : 'No'}
                  disabled
                />
              ) : (
                <FormControlLabel
                  control={
                    <Switch
                      checked={serviceForm.requiresPrePayment}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          requiresPrePayment: e.target.checked,
                        })
                      }
                    />
                  }
                  label='Requires Pre-Payment'
                />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServiceDialogOpen(false)}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button onClick={handleSubmitService} variant='contained'>
              {dialogMode === 'create' ? 'Create' : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Category Dialog */}
      <Dialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          {selectedCategoryForEdit ? 'Edit Category' : 'Create Category'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label='Category Name'
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, name: e.target.value })
              }
              required
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label='Description'
              value={categoryForm.description}
              onChange={(e) =>
                setCategoryForm({
                  ...categoryForm,
                  description: e.target.value,
                })
              }
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitCategory} variant='contained'>
            {selectedCategoryForEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <Dialog
        open={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <Warning color='warning' sx={{ mr: 1 }} />
          Deactivate Service
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to deactivate the service "
            {selectedService?.name}
            "?
          </Typography>
          <Alert severity='warning' sx={{ mt: 2 }}>
            This action will deactivate the service. The service will no longer
            be available for new appointments or billing, but existing data will
            be preserved.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeactivateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmDeactivate}
            variant='contained'
            color='warning'
          >
            Deactivate Service
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ServicesPage;
