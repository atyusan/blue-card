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
  Checkbox,
  FormControlLabel,
  Avatar,
  Divider,
  Alert,
  Skeleton,
  Stack,
  Snackbar,
  FormGroup,
  FormLabel,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  People,
  Security,
  Visibility,
  CheckCircle,
  AdminPanelSettings,
  Group,
} from '@mui/icons-material';
import { usePermissions } from '@/hooks/usePermissions';
import { rolesService } from '../services/roles.service';
import type {
  Role,
  CreateRoleData,
  RoleStats,
} from '../services/roles.service';

// Group permissions by category
const PERMISSION_CATEGORIES = {
  'User Management': [
    'view_users',
    'create_users',
    'edit_users',
    'delete_users',
    'manage_user_permissions',
  ],
  'Patient Management': [
    'view_patients',
    'create_patients',
    'edit_patients',
    'delete_patients',
    'view_patient_history',
  ],
  'Department Management': [
    'view_departments',
    'create_departments',
    'edit_departments',
    'delete_departments',
    'manage_departments',
  ],
  'Service Management': [
    'view_services',
    'create_services',
    'edit_services',
    'delete_services',
    'manage_service_pricing',
  ],
  'Role Management': [
    'view_roles',
    'create_roles',
    'edit_roles',
    'delete_roles',
    'assign_roles',
  ],
  'Billing & Invoicing': [
    'view_billing',
    'create_invoices',
    'edit_invoices',
    'delete_invoices',
    'process_payments',
    'view_payment_history',
  ],
  'Laboratory Services': [
    'view_lab_orders',
    'create_lab_orders',
    'edit_lab_orders',
    'process_lab_tests',
    'view_lab_results',
  ],
  'Pharmacy Services': [
    'view_pharmacy',
    'manage_medications',
    'process_prescriptions',
    'view_inventory',
  ],
  'Admissions & Wards': [
    'view_admissions',
    'create_admissions',
    'edit_admissions',
    'manage_wards',
    'view_ward_assignments',
  ],
  'Surgical Services': [
    'view_surgery',
    'create_surgery',
    'edit_surgery',
    'manage_surgery_schedule',
  ],
  Consultations: [
    'view_consultations',
    'create_consultations',
    'edit_consultations',
    'manage_appointments',
  ],
  'Reporting & Analytics': [
    'view_reports',
    'generate_reports',
    'view_analytics',
    'export_data',
  ],
  'System Administration': [
    'system_settings',
    'audit_logs',
    'backup_restore',
    'user_management',
  ],
  'Cash Office': [
    'view_cash_office',
    'manage_cash_transactions',
    'process_cash_requests',
    'view_cash_reports',
  ],
};

export const RolesPage: React.FC = () => {
  const { canManageRoles, canViewRoles } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>(
    'create'
  );
  const [roleStats, setRoleStats] = useState<RoleStats | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('success');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  // Form state
  const [roleForm, setRoleForm] = useState<CreateRoleData>({
    name: '',
    code: '',
    description: '',
    permissions: [],
    isActive: true,
  });

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

  // Helper function to handle permission selection
  const handlePermissionChange = (permission: string, checked: boolean) => {
    setRoleForm((prev) => ({
      ...prev,
      permissions: checked
        ? [...(prev.permissions || []), permission]
        : (prev.permissions || []).filter((p) => p !== permission),
    }));
  };

  // Helper function to check if all permissions in a category are selected
  const areAllCategoryPermissionsSelected = (categoryPermissions: string[]) => {
    return categoryPermissions.every((permission) =>
      (roleForm.permissions || []).includes(permission)
    );
  };

  // Helper function to handle category permission selection
  const handleCategoryPermissionChange = (
    categoryPermissions: string[],
    checked: boolean
  ) => {
    setRoleForm((prev) => {
      const newPermissions = [...(prev.permissions || [])];

      if (checked) {
        // Add all permissions from this category
        categoryPermissions.forEach((permission) => {
          if (!newPermissions.includes(permission)) {
            newPermissions.push(permission);
          }
        });
      } else {
        // Remove all permissions from this category
        categoryPermissions.forEach((permission) => {
          const index = newPermissions.indexOf(permission);
          if (index > -1) {
            newPermissions.splice(index, 1);
          }
        });
      }

      return {
        ...prev,
        permissions: newPermissions,
      };
    });
  };

  // Load roles function for CRUD operations
  const loadRoles = useCallback(async () => {
    if (!canViewRoles()) return;

    setIsLoading(true);
    try {
      const rolesData = await rolesService.getRoles();
      setRoles(rolesData);
    } catch (error: unknown) {
      console.error('Error loading roles:', error);
      setSnackbarMessage(getErrorMessage(error, 'Failed to load roles'));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load roles on component mount only
  useEffect(() => {
    loadRoles();
  }, [loadRoles]); // Depend on loadRoles

  // Client-side filtering
  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description &&
        role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateRole = () => {
    setSelectedRole(null);
    setDialogMode('create');
    setRoleForm({
      name: '',
      code: '',
      description: '',
      permissions: [],
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setDialogMode('edit');
    setRoleForm({
      name: role.name,
      code: role.code,
      description: role.description || '',
      permissions: role.permissions || [],
      isActive: role.isActive,
    });
    setDialogOpen(true);
  };

  const handleViewRole = async (role: Role) => {
    setSelectedRole(role);
    setDialogMode('view');
    setRoleForm({
      name: role.name,
      code: role.code,
      description: role.description || '',
      permissions: role.permissions || [],
      isActive: role.isActive,
    });

    // Load role stats
    try {
      const stats = await rolesService.getRoleStats(role.id);
      setRoleStats(stats);
    } catch (error: unknown) {
      console.error('Error loading role stats:', error);
      setSnackbarMessage(
        getErrorMessage(error, 'Failed to load role statistics')
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }

    setDialogOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;

    try {
      await rolesService.deleteRole(roleToDelete.id);
      setSnackbarMessage('Role deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      loadRoles(); // Reload after delete
    } catch (error: unknown) {
      console.error('Error deleting role:', error);
      setSnackbarMessage(getErrorMessage(error, 'Failed to delete role'));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setRoleToDelete(null);
  };

  const handleSubmitRole = async () => {
    try {
      if (dialogMode === 'create') {
        await rolesService.createRole(roleForm);
        setSnackbarMessage('Role created successfully');
        setSnackbarSeverity('success');
      } else if (dialogMode === 'edit' && selectedRole) {
        await rolesService.updateRole(selectedRole.id, roleForm);
        setSnackbarMessage('Role updated successfully');
        setSnackbarSeverity('success');
      }
      setSnackbarOpen(true);
      loadRoles(); // Reload after create/update
      setDialogOpen(false);
    } catch (error: unknown) {
      console.error('Error saving role:', error);
      setSnackbarMessage(getErrorMessage(error, 'Failed to save role'));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRole(null);
    setRoleStats(null);
  };

  if (!canViewRoles()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error' sx={{ textAlign: 'center' }}>
          You don't have permission to view roles.
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant='h6' sx={{ textAlign: 'center', mb: 3 }}>
          Loading roles...
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
            Role Management
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Manage system roles and their associated permissions
          </Typography>
        </Box>
        {canManageRoles() && (
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={handleCreateRole}
            sx={{ height: 40 }}
          >
            Add Role
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
                <Security />
              </Avatar>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Total Roles
                </Typography>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {roles.length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
                <People />
              </Avatar>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Active Users
                </Typography>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {roles.reduce(
                    (sum, role) =>
                      sum + (role._count?.staffRoleAssignments || 0),
                    0
                  )}
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
                  Active Roles
                </Typography>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {roles.filter((role) => role.isActive).length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}>
                <AdminPanelSettings />
              </Avatar>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Total Permissions
                </Typography>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {
                    Array.from(
                      new Set(roles.flatMap((role) => role.permissions))
                    ).length
                  }
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
              placeholder='Search roles...'
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
          </Box>
        </CardContent>
      </Card>

      {/* Roles Table */}
      <Card>
        <CardHeader
          title='All Roles'
          subheader={`${filteredRoles.length} roles found`}
        />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Role</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Staff Count</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRoles.map((role) => (
                <TableRow key={role.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}
                      >
                        {role.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography
                          variant='subtitle2'
                          sx={{ fontWeight: 600 }}
                        >
                          {role.name}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={role.code}
                      size='small'
                      color='primary'
                      variant='outlined'
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2' color='text.secondary'>
                      {role.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {role.permissions.slice(0, 3).map((permission) => (
                        <Chip
                          key={permission}
                          label={permission}
                          size='small'
                          color='default'
                          variant='outlined'
                        />
                      ))}
                      {role.permissions.length > 3 && (
                        <Chip
                          label={`+${role.permissions.length - 3} more`}
                          size='small'
                          color='default'
                          variant='outlined'
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Group fontSize='small' color='action' />
                      <Typography variant='body2'>
                        {role._count?.staffRoleAssignments || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={role.isActive ? 'Active' : 'Inactive'}
                      color={role.isActive ? 'success' : 'default'}
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
                          onClick={() => handleViewRole(role)}
                        >
                          <Visibility fontSize='small' />
                        </IconButton>
                      </Tooltip>
                      {canManageRoles() && (
                        <>
                          <Tooltip title='Edit Role'>
                            <IconButton
                              size='small'
                              onClick={() => handleEditRole(role)}
                            >
                              <Edit fontSize='small' />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Delete Role'>
                            <IconButton
                              size='small'
                              onClick={() => handleDeleteRole(role)}
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
      </Card>

      {/* Role Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' && 'Create New Role'}
          {dialogMode === 'edit' && 'Edit Role'}
          {dialogMode === 'view' && 'Role Details'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {dialogMode === 'view' ? (
              <Box>
                {/* Header Section */}
                <Box sx={{ mb: 4 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        width: 64,
                        height: 64,
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {roleForm.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography
                        variant='h4'
                        sx={{ fontWeight: 'bold', mb: 0.5 }}
                      >
                        {roleForm.name}
                      </Typography>
                      <Chip
                        label={roleForm.code}
                        color='primary'
                        variant='filled'
                        size='small'
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  </Box>

                  {roleForm.description && (
                    <Box
                      sx={{
                        bgcolor: 'grey.50',
                        p: 2,
                        borderRadius: 2,
                        border: 1,
                        borderColor: 'grey.200',
                      }}
                    >
                      <Typography variant='body1' color='text.secondary'>
                        {roleForm.description}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ mb: 4 }} />

                {/* Permissions Section */}
                <Box sx={{ mb: 4 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 3,
                    }}
                  >
                    <Security color='primary' />
                    <Typography variant='h6' sx={{ fontWeight: 600 }}>
                      Permissions
                    </Typography>
                    <Chip
                      label={`${
                        (roleForm.permissions || []).length
                      } permissions`}
                      size='small'
                      color='primary'
                      variant='outlined'
                    />
                  </Box>

                  <Box
                    sx={{
                      maxHeight: 300,
                      overflow: 'auto',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 2,
                      bgcolor: 'grey.50',
                    }}
                  >
                    {Object.entries(PERMISSION_CATEGORIES).map(
                      ([categoryName, categoryPermissions]) => {
                        const categorySelectedPermissions =
                          categoryPermissions.filter((p) =>
                            (roleForm.permissions || []).includes(p)
                          );

                        if (categorySelectedPermissions.length === 0)
                          return null;

                        return (
                          <Box key={categoryName} sx={{ mb: 3 }}>
                            <Typography
                              variant='subtitle2'
                              sx={{
                                fontWeight: 600,
                                color: 'primary.main',
                                mb: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  bgcolor: 'primary.main',
                                  borderRadius: '50%',
                                }}
                              />
                              {categoryName}
                              <Chip
                                label={`${categorySelectedPermissions.length}/${categoryPermissions.length}`}
                                size='small'
                                color='primary'
                                variant='outlined'
                              />
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 1,
                                ml: 2,
                              }}
                            >
                              {categorySelectedPermissions.map((permission) => (
                                <Chip
                                  key={permission}
                                  label={permission}
                                  color='primary'
                                  variant='outlined'
                                  size='small'
                                  sx={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem',
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        );
                      }
                    )}
                  </Box>
                </Box>

                {/* Statistics Section */}
                {roleStats && (
                  <>
                    <Divider sx={{ mb: 4 }} />
                    <Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 3,
                        }}
                      >
                        <People color='primary' />
                        <Typography variant='h6' sx={{ fontWeight: 600 }}>
                          Role Statistics
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                          },
                          gap: 2,
                        }}
                      >
                        <Card
                          sx={{
                            p: 2,
                            bgcolor: 'success.50',
                            border: 1,
                            borderColor: 'success.200',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: 'success.main',
                                width: 40,
                                height: 40,
                              }}
                            >
                              <Group />
                            </Avatar>
                            <Box>
                              <Typography
                                variant='body2'
                                color='text.secondary'
                              >
                                Total Assignments
                              </Typography>
                              <Typography
                                variant='h5'
                                sx={{
                                  fontWeight: 'bold',
                                  color: 'success.main',
                                }}
                              >
                                {roleStats.totalAssignments}
                              </Typography>
                            </Box>
                          </Box>
                        </Card>

                        <Card
                          sx={{
                            p: 2,
                            bgcolor: 'info.50',
                            border: 1,
                            borderColor: 'info.200',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: 'info.main',
                                width: 40,
                                height: 40,
                              }}
                            >
                              <CheckCircle />
                            </Avatar>
                            <Box>
                              <Typography
                                variant='body2'
                                color='text.secondary'
                              >
                                Active Assignments
                              </Typography>
                              <Typography
                                variant='h5'
                                sx={{ fontWeight: 'bold', color: 'info.main' }}
                              >
                                {roleStats.activeAssignments}
                              </Typography>
                            </Box>
                          </Box>
                        </Card>
                      </Box>

                      {/* Department Distribution */}
                      {Object.keys(roleStats.departmentDistribution).length >
                        0 && (
                        <Box sx={{ mt: 3 }}>
                          <Typography
                            variant='subtitle2'
                            sx={{ fontWeight: 600, mb: 2 }}
                          >
                            Department Distribution
                          </Typography>
                          <Box
                            sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}
                          >
                            {Object.entries(
                              roleStats.departmentDistribution
                            ).map(([dept, count]) => (
                              <Chip
                                key={dept}
                                label={`${dept}: ${count}`}
                                color='default'
                                variant='outlined'
                                size='small'
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </>
                )}

                {/* Status Section */}
                <Box
                  sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Status:
                    </Typography>
                    <Chip
                      label={roleForm.isActive ? 'Active' : 'Inactive'}
                      color={roleForm.isActive ? 'success' : 'default'}
                      variant='filled'
                      size='small'
                    />
                  </Box>
                </Box>
              </Box>
            ) : (
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label='Role Name'
                  value={roleForm.name}
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, name: e.target.value })
                  }
                  required
                />
                <TextField
                  fullWidth
                  label='Role Code'
                  value={roleForm.code}
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, code: e.target.value })
                  }
                  required
                />
                <TextField
                  fullWidth
                  label='Description'
                  value={roleForm.description}
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, description: e.target.value })
                  }
                  multiline
                  rows={3}
                />

                {/* Permissions Selection */}
                <Box>
                  <FormLabel component='legend' sx={{ mb: 2, fontWeight: 600 }}>
                    Permissions
                  </FormLabel>
                  <Box
                    sx={{
                      maxHeight: 400,
                      overflow: 'auto',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 2,
                    }}
                  >
                    {Object.entries(PERMISSION_CATEGORIES).map(
                      ([categoryName, categoryPermissions]) => (
                        <Box key={categoryName} sx={{ mb: 3 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={areAllCategoryPermissionsSelected(
                                  categoryPermissions
                                )}
                                indeterminate={
                                  categoryPermissions.some((p) =>
                                    (roleForm.permissions || []).includes(p)
                                  ) &&
                                  !areAllCategoryPermissionsSelected(
                                    categoryPermissions
                                  )
                                }
                                onChange={(e) =>
                                  handleCategoryPermissionChange(
                                    categoryPermissions,
                                    e.target.checked
                                  )
                                }
                              />
                            }
                            label={
                              <Typography
                                variant='subtitle2'
                                sx={{ fontWeight: 600 }}
                              >
                                {categoryName}
                              </Typography>
                            }
                          />
                          <Box sx={{ ml: 4, mt: 1 }}>
                            <FormGroup>
                              {categoryPermissions.map((permission) => (
                                <FormControlLabel
                                  key={permission}
                                  control={
                                    <Checkbox
                                      checked={(
                                        roleForm.permissions || []
                                      ).includes(permission)}
                                      onChange={(e) =>
                                        handlePermissionChange(
                                          permission,
                                          e.target.checked
                                        )
                                      }
                                      size='small'
                                    />
                                  }
                                  label={
                                    <Typography
                                      variant='body2'
                                      sx={{
                                        textTransform: 'replace',
                                        fontFamily: 'monospace',
                                      }}
                                    >
                                      {permission}
                                    </Typography>
                                  }
                                />
                              ))}
                            </FormGroup>
                          </Box>
                        </Box>
                      )
                    )}
                  </Box>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ mt: 1, display: 'block' }}
                  >
                    {(roleForm.permissions || []).length} permission(s) selected
                  </Typography>
                </Box>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={roleForm.isActive}
                      onChange={(e) =>
                        setRoleForm({ ...roleForm, isActive: e.target.checked })
                      }
                    />
                  }
                  label='Active'
                />
              </Stack>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button variant='contained' onClick={handleSubmitRole}>
              {dialogMode === 'create' ? 'Create' : 'Save'}
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
                Delete Role
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
              Are you sure you want to delete the role{' '}
              <strong>"{roleToDelete?.name}"</strong>?
            </Typography>

            {roleToDelete && (
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
                  This will permanently remove the role and all its associated
                  permissions. Any staff members assigned to this role will lose
                  access to these permissions.
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
          >
            Delete Role
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
