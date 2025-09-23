import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Skeleton,
  Divider,
} from '@mui/material';
import {
  Search,
  Edit,
  Visibility,
  ManageAccounts,
  Person,
} from '@mui/icons-material';
import { usePermissions } from '../hooks/usePermissions';
import PageHeader from '../components/common/PageHeader';

interface StaffMember {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  specialization: string;
  hireDate: string;
  isActive: boolean;
}

export const StaffPage: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { hasPermission } = usePermissions();

  // Mock data for demonstration
  useEffect(() => {
    const mockStaff: StaffMember[] = [
      {
        id: '1',
        employeeId: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@hospital.com',
        department: 'Cardiology',
        specialization: 'Cardiologist',
        hireDate: '2020-01-15',
        isActive: true,
      },
      {
        id: '2',
        employeeId: 'EMP002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@hospital.com',
        department: 'Neurology',
        specialization: 'Neurologist',
        hireDate: '2019-03-20',
        isActive: true,
      },
      {
        id: '3',
        employeeId: 'EMP003',
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@hospital.com',
        department: 'Emergency',
        specialization: 'Emergency Physician',
        hireDate: '2021-06-10',
        isActive: true,
      },
    ];

    setTimeout(() => {
      setStaff(mockStaff);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredStaff = staff.filter(
    (member) =>
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStaff = () => {
    console.log('Add staff member');
  };

  const handleEditStaff = (id: string) => {
    console.log('Edit', id);
  };

  const handleViewStaff = (id: string) => {
    console.log('View', id);
  };

  const handleManageRoles = (id: string) => {
    console.log('Manage Roles', id);
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title='Staff Management'
        subtitle='Manage hospital staff members, their roles, and departments'
        onAdd={hasPermission('create_staff') ? handleAddStaff : undefined}
      />

      {loading ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {[1, 2, 3].map((item) => (
            <Card key={item}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Skeleton variant='circular' width={48} height={48} />
                  <Box sx={{ ml: 2, flex: 1 }}>
                    <Skeleton variant='text' width='60%' height={24} />
                    <Skeleton variant='text' width='40%' height={20} />
                  </Box>
                </Box>
                <Skeleton variant='text' width='100%' height={20} />
                <Skeleton variant='text' width='80%' height={20} />
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <>
          {/* Search and Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <TextField
                fullWidth
                placeholder='Search by name, ID, or department...'
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
            </CardContent>
          </Card>

          {/* Staff List */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: 3,
            }}
          >
            {filteredStaff.map((member) => (
              <Card key={member.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: 'primary.main',
                        fontSize: '1.2rem',
                      }}
                    >
                      {member.firstName[0]}
                      {member.lastName[0]}
                    </Avatar>
                    <Box sx={{ ml: 2, flex: 1 }}>
                      <Typography variant='h6' component='h3' gutterBottom>
                        {member.firstName} {member.lastName}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {member.email}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={member.employeeId}
                      variant='outlined'
                      size='small'
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip
                      label={member.department}
                      color='primary'
                      size='small'
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip
                      label={member.specialization}
                      color='secondary'
                      size='small'
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip
                      label={member.isActive ? 'Active' : 'Inactive'}
                      color={member.isActive ? 'success' : 'error'}
                      size='small'
                      sx={{ mb: 1 }}
                    />
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
                      Hired: {new Date(member.hireDate).toLocaleDateString()}
                    </Typography>
                    <Box>
                      {hasPermission('edit_staff') && (
                        <Tooltip title='Edit Staff Member'>
                          <IconButton
                            size='small'
                            onClick={() => handleEditStaff(member.id)}
                            sx={{ mr: 1 }}
                          >
                            <Edit fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      )}
                      {hasPermission('view_staff_details') && (
                        <Tooltip title='View Details'>
                          <IconButton
                            size='small'
                            onClick={() => handleViewStaff(member.id)}
                            sx={{ mr: 1 }}
                          >
                            <Visibility fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      )}
                      {hasPermission('manage_staff_roles') && (
                        <Tooltip title='Manage Roles'>
                          <IconButton
                            size='small'
                            onClick={() => handleManageRoles(member.id)}
                          >
                            <ManageAccounts fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {filteredStaff.length === 0 && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant='h6' color='text.secondary' gutterBottom>
                  No staff members found
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  No staff members match your search criteria.
                </Typography>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
};
