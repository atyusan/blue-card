import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Tabs,
  Tab,
  Grid,
  Skeleton,
  Divider,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  Security,
  Person,
  CheckCircle,
  Cancel,
  Visibility,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { usePermissions } from '../../hooks/usePermissions';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  permissions: string[];
  isActive: boolean;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  isSystem: boolean;
}

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
      id={`permission-tabpanel-${index}`}
      aria-labelledby={`permission-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const PermissionManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const { hasPermission } = usePermissions();

  // Mock data for demonstration
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@hospital.com',
        permissions: ['view_patients', 'edit_patients', 'view_appointments'],
        isActive: true,
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@hospital.com',
        permissions: ['view_patients', 'view_appointments', 'manage_staff'],
        isActive: true,
      },
      {
        id: '3',
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@hospital.com',
        permissions: ['admin'],
        isActive: true,
      },
    ];

    const mockPermissions: Permission[] = [
      {
        id: '1',
        name: 'view_patients',
        description: 'View patient information',
        category: 'Patient Management',
        isSystem: true,
      },
      {
        id: '2',
        name: 'edit_patients',
        description: 'Edit patient information',
        category: 'Patient Management',
        isSystem: true,
      },
      {
        id: '3',
        name: 'view_appointments',
        description: 'View appointment schedules',
        category: 'Appointments',
        isSystem: true,
      },
      {
        id: '4',
        name: 'manage_staff',
        description: 'Manage staff members',
        category: 'Staff Management',
        isSystem: true,
      },
      {
        id: '5',
        name: 'admin',
        description: 'Full system access',
        category: 'System',
        isSystem: true,
      },
    ];

    setTimeout(() => {
      setUsers(mockUsers);
      setPermissions(mockPermissions);
      setLoading(false);
    }, 1000);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditingPermissions([...user.permissions]);
    setEditDialogOpen(true);
  };

  const handleSavePermissions = () => {
    if (editingUser) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingUser.id
            ? { ...user, permissions: editingPermissions }
            : user
        )
      );
      setEditDialogOpen(false);
      setEditingUser(null);
      setEditingPermissions([]);
    }
  };

  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setEditingUser(null);
    setEditingPermissions([]);
  };

  const handlePermissionToggle = (permission: string) => {
    setEditingPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const filteredUsers = users.filter(
    (user) =>
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPermissionCategory = (permissionName: string) => {
    const permission = permissions.find((p) => p.name === permissionName);
    return permission?.category || 'Unknown';
  };

  const getPermissionDescription = (permissionName: string) => {
    const permission = permissions.find((p) => p.name === permissionName);
    return permission?.description || 'No description available';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant='h4' gutterBottom>
          Permission Management
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3].map((item) => (
            <Grid xs={12} md={6} lg={4} key={item}>
              <Card>
                <CardContent>
                  <Skeleton variant='text' width='60%' height={24} />
                  <Skeleton variant='text' width='40%' height={20} />
                  <Skeleton variant='rectangular' height={60} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' gutterBottom>
        Permission Management
      </Typography>
      <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
        Manage user permissions and access control
      </Typography>

      {/* Tabs */}
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label='permission management tabs'
            >
              <Tab label='Users' icon={<Person />} iconPosition='start' />
              <Tab
                label='Permissions'
                icon={<Security />}
                iconPosition='start'
              />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder='Search users...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ maxWidth: 400 }}
              />
            </Box>

            <Grid container spacing={3}>
              {filteredUsers.map((user) => (
                <Grid xs={12} md={6} lg={4} key={user.id}>
                  <Card>
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Box>
                          <Typography variant='h6' component='h3' gutterBottom>
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {user.email}
                          </Typography>
                        </Box>
                        <Chip
                          label={user.isActive ? 'Active' : 'Inactive'}
                          color={user.isActive ? 'success' : 'error'}
                          size='small'
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          gutterBottom
                        >
                          Permissions ({user.permissions.length}):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {user.permissions.slice(0, 3).map((permission) => (
                            <Chip
                              key={permission}
                              label={permission}
                              size='small'
                              variant='outlined'
                              color='primary'
                            />
                          ))}
                          {user.permissions.length > 3 && (
                            <Chip
                              label={`+${user.permissions.length - 3} more`}
                              size='small'
                              variant='outlined'
                              color='secondary'
                            />
                          )}
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant='caption' color='text.secondary'>
                          User ID: {user.id}
                        </Typography>
                        <Box>
                          {hasPermission('edit_user_permissions') && (
                            <Tooltip title='Edit Permissions'>
                              <IconButton
                                size='small'
                                onClick={() => handleEditUser(user)}
                                sx={{ mr: 1 }}
                              >
                                <EditIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          )}
                          {hasPermission('view_user_details') && (
                            <Tooltip title='View Details'>
                              <IconButton
                                size='small'
                                onClick={() => setSelectedUser(user)}
                              >
                                <Visibility fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {filteredUsers.length === 0 && (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <Person
                    sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
                  />
                  <Typography variant='h6' color='text.secondary' gutterBottom>
                    No users found
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    No users match your search criteria.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <TableContainer component={Paper} variant='outlined'>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Permission Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <Typography variant='body2' fontWeight='medium'>
                          {permission.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{permission.description}</TableCell>
                      <TableCell>
                        <Chip
                          label={permission.category}
                          size='small'
                          variant='outlined'
                          color='primary'
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={permission.isSystem ? 'System' : 'Custom'}
                          size='small'
                          color={permission.isSystem ? 'secondary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {hasPermission('edit_permissions') &&
                            !permission.isSystem && (
                              <Tooltip title='Edit Permission'>
                                <IconButton size='small'>
                                  <Edit fontSize='small' />
                                </IconButton>
                              </Tooltip>
                            )}
                          {hasPermission('delete_permissions') &&
                            !permission.isSystem && (
                              <Tooltip title='Delete Permission'>
                                <IconButton size='small' color='error'>
                                  <Delete fontSize='small' />
                                </IconButton>
                              </Tooltip>
                            )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Edit Permissions Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCancelEdit}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          Edit Permissions - {editingUser?.firstName} {editingUser?.lastName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant='body2' color='text.secondary' gutterBottom>
              Select the permissions you want to assign to this user:
            </Typography>
            <List>
              {permissions.map((permission) => (
                <ListItem key={permission.id} dense>
                  <ListItemText
                    primary={permission.name}
                    secondary={
                      <Box>
                        <Typography variant='body2' color='text.secondary'>
                          {permission.description}
                        </Typography>
                        <Chip
                          label={permission.category}
                          size='small'
                          variant='outlined'
                          color='primary'
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Checkbox
                      edge='end'
                      checked={editingPermissions.includes(permission.name)}
                      onChange={() => handlePermissionToggle(permission.name)}
                      disabled={
                        permission.isSystem && permission.name === 'admin'
                      }
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>Cancel</Button>
          <Button onClick={handleSavePermissions} variant='contained'>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
