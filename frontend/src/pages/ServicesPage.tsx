import React, { useState, useEffect } from 'react';
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
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Edit,
  Visibility,
  MedicalServices,
  Category,
  Business,
  AttachMoney,
} from '@mui/icons-material';
import { usePermissions } from '../hooks/usePermissions';
import PageHeader from '../components/common/PageHeader';

interface Service {
  id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  department: string;
  price: number;
  isActive: boolean;
}

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const { hasPermission } = usePermissions();

  // Mock data for demonstration
  useEffect(() => {
    const mockServices: Service[] = [
      {
        id: '1',
        name: 'Cardiac Consultation',
        code: 'CARD_CON',
        description: 'Specialist consultation for cardiac conditions',
        category: 'Consultation',
        department: 'Cardiology',
        price: 150.0,
        isActive: true,
      },
      {
        id: '2',
        name: 'ECG Test',
        code: 'ECG_TEST',
        description: 'Electrocardiogram test for heart monitoring',
        category: 'Diagnostic',
        department: 'Cardiology',
        price: 75.0,
        isActive: true,
      },
      {
        id: '3',
        name: 'Blood Test',
        code: 'BLOOD_TEST',
        description: 'Complete blood count and analysis',
        category: 'Laboratory',
        department: 'Pathology',
        price: 45.0,
        isActive: true,
      },
      {
        id: '4',
        name: 'X-Ray',
        code: 'XRAY',
        description: 'Standard X-ray imaging',
        category: 'Imaging',
        department: 'Radiology',
        price: 120.0,
        isActive: true,
      },
      {
        id: '5',
        name: 'Surgery Consultation',
        code: 'SURG_CON',
        description: 'Pre-surgery consultation with surgeon',
        category: 'Consultation',
        department: 'Surgery',
        price: 200.0,
        isActive: true,
      },
    ];

    setTimeout(() => {
      setServices(mockServices);
      setLoading(false);
    }, 1000);
  }, []);

  const categories = [
    'all',
    ...Array.from(new Set(services.map((service) => service.category))),
  ];
  const departments = [
    'all',
    ...Array.from(new Set(services.map((service) => service.department))),
  ];

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || service.category === selectedCategory;
    const matchesDepartment =
      selectedDepartment === 'all' || service.department === selectedDepartment;
    return matchesSearch && matchesCategory && matchesDepartment;
  });

  const handleAddService = () => {
    console.log('Add service');
  };

  const handleEditService = (id: string) => {
    console.log('Edit', id);
  };

  const handleViewService = (id: string) => {
    console.log('View', id);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title='Services Management'
          subtitle='Manage hospital services, pricing, and availability'
          onAdd={hasPermission('create_service') ? handleAddService : undefined}
        />
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
          {[1, 2, 3, 4, 5].map((item) => (
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
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title='Services Management'
        subtitle='Manage hospital services, pricing, and availability'
        onAdd={hasPermission('create_service') ? handleAddService : undefined}
      />

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(3, 1fr)',
              },
              gap: 2,
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
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label='Category'
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={selectedDepartment}
                label='Department'
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                {departments.map((department) => (
                  <MenuItem key={department} value={department}>
                    {department === 'all' ? 'All Departments' : department}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Services List */}
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
        {filteredServices.map((service) => (
          <Card key={service.id}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <MedicalServices />
                </Box>
                <Box sx={{ ml: 2, flex: 1 }}>
                  <Typography variant='h6' component='h3' gutterBottom>
                    {service.name}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {service.code}
                  </Typography>
                </Box>
              </Box>

              <Typography variant='body2' sx={{ mb: 2 }}>
                {service.description}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Chip
                  icon={<Category />}
                  label={service.category}
                  variant='outlined'
                  size='small'
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip
                  icon={<Business />}
                  label={service.department}
                  color='primary'
                  size='small'
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip
                  icon={<AttachMoney />}
                  label={`$${service.price.toFixed(2)}`}
                  color='secondary'
                  size='small'
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip
                  label={service.isActive ? 'Active' : 'Inactive'}
                  color={service.isActive ? 'success' : 'error'}
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
                  Service ID: {service.id}
                </Typography>
                <Box>
                  {hasPermission('edit_service') && (
                    <Tooltip title='Edit Service'>
                      <IconButton
                        size='small'
                        onClick={() => handleEditService(service.id)}
                        sx={{ mr: 1 }}
                      >
                        <Edit fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  )}
                  {hasPermission('view_service_details') && (
                    <Tooltip title='View Details'>
                      <IconButton
                        size='small'
                        onClick={() => handleViewService(service.id)}
                        sx={{ mr: 1 }}
                      >
                        <Visibility fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {filteredServices.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <MedicalServices
              sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant='h6' color='text.secondary' gutterBottom>
              No services found
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              No services match your search criteria.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
