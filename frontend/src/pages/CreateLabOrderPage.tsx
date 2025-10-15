import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Stack,
  Divider,
  Alert,
  useTheme,
  alpha,
  Paper,
  Autocomplete,
  InputAdornment,
  Checkbox,
  Avatar,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Delete,
  Science,
  Person,
  ShoppingCart,
  Search,
  Payment,
} from '@mui/icons-material';
import { formatCurrency } from '@/utils';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import { labOrderService } from '../services/lab-order.service';
import { serviceService } from '../services/service.service';
import { patientService } from '../services/patient.service';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

interface SelectedTest {
  serviceId: string;
  serviceName: string;
  description?: string;
  price: number;
  quantity: number;
}

const CreateLabOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch patients
  const { data: patients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientService.getAllPatients(),
  });

  // Fetch lab services (tests catalog)
  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['lab-services'],
    queryFn: () => serviceService.getServicesByCategory('Laboratory'),
  });

  // Create lab order mutation
  const createLabOrderMutation = useMutation({
    mutationFn: (data: any) => labOrderService.createLabOrder(data),
    onSuccess: (response) => {
      showToast('Lab order created successfully', 'success');
      // Invalidate lab orders queries to refresh the list
      queryClient.invalidateQueries({
        queryKey: ['lab-orders'],
        refetchType: 'all',
      });
      navigate(`/lab/orders/${response.labOrder.id}`);
    },
    onError: () => {
      showToast('Failed to create lab order', 'error');
    },
  });

  const filteredServices = services.filter(
    (service: any) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTest = (service: any) => {
    const exists = selectedTests.find((t) => t.serviceId === service.id);
    if (exists) {
      setSelectedTests(
        selectedTests.map((t) =>
          t.serviceId === service.id ? { ...t, quantity: t.quantity + 1 } : t
        )
      );
    } else {
      setSelectedTests([
        ...selectedTests,
        {
          serviceId: service.id,
          serviceName: service.name,
          description: service.description,
          price: Number(service.currentPrice),
          quantity: 1,
        },
      ]);
    }
    showToast(`${service.name} added to order`, 'success');
  };

  const handleRemoveTest = (serviceId: string) => {
    setSelectedTests(selectedTests.filter((t) => t.serviceId !== serviceId));
  };

  const handleUpdateQuantity = (serviceId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedTests(
      selectedTests.map((t) =>
        t.serviceId === serviceId ? { ...t, quantity } : t
      )
    );
  };

  const calculateTotal = () => {
    return selectedTests.reduce(
      (sum, test) => sum + test.price * test.quantity,
      0
    );
  };

  const handleSubmit = () => {
    if (!selectedPatient) {
      showToast('Please select a patient', 'error');
      return;
    }

    if (selectedTests.length === 0) {
      showToast('Please add at least one test', 'error');
      return;
    }

    if (!user?.staffMember?.id) {
      showToast('You must be a staff member to create lab orders', 'error');
      return;
    }

    // Create tests array - only send serviceId for each test
    const tests = selectedTests.flatMap((test) =>
      Array(test.quantity)
        .fill(null)
        .map(() => ({
          serviceId: test.serviceId,
        }))
    );

    createLabOrderMutation.mutate({
      patientId: selectedPatient.id,
      doctorId: user.staffMember.id,
      tests,
      notes: notes || undefined,
    });
  };

  const totalAmount = calculateTotal();

  return (
    <Box>
      <PageHeader
        title='Create Lab Order'
        subtitle='Order external lab tests for walk-in patients'
        breadcrumbs={<Breadcrumb />}
        actions={
          <Button
            variant='outlined'
            startIcon={<ArrowBack />}
            onClick={() => navigate('/lab/orders')}
            sx={{ borderRadius: 2 }}
          >
            Back to Orders
          </Button>
        }
      />

      {/* Summary Banner */}
      {selectedTests.length > 0 && (
        <Card
          sx={{
            mb: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.1
            )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
            border: '2px solid',
            borderColor: 'primary.main',
          }}
        >
          <Box p={2}>
            <Stack
              direction='row'
              spacing={3}
              alignItems='center'
              justifyContent='space-between'
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                  <ShoppingCart />
                </Avatar>
                <Box>
                  <Typography variant='h6' fontWeight={700} color='primary'>
                    {selectedTests.length} Test
                    {selectedTests.length !== 1 ? 's' : ''} Selected
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {selectedTests.reduce((sum, t) => sum + t.quantity, 0)}{' '}
                    total items
                  </Typography>
                </Box>
              </Box>
              <Box textAlign='right'>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  display='block'
                >
                  Total Amount
                </Typography>
                <Typography variant='h4' fontWeight={700} color='primary'>
                  {formatCurrency(totalAmount)}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
      )}

      <Stack spacing={3}>
        {/* Patient Selection */}
        <Card
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background: selectedPatient
              ? `linear-gradient(135deg, ${alpha(
                  theme.palette.success.main,
                  0.05
                )} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`
              : 'background.paper',
          }}
        >
          <Box p={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar
                sx={{
                  bgcolor: selectedPatient ? 'success.main' : 'primary.main',
                  width: 40,
                  height: 40,
                }}
              >
                <Person />
              </Avatar>
              <Box flex={1}>
                <Typography variant='h6' fontWeight={600}>
                  Patient Information
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {selectedPatient
                    ? 'Patient selected'
                    : 'Select a patient to create the order'}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Autocomplete
              options={patients}
              getOptionLabel={(option: any) =>
                `${option.firstName} ${option.lastName} - ${option.patientId}`
              }
              value={selectedPatient}
              onChange={(_, newValue) => setSelectedPatient(newValue)}
              loading={loadingPatients}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Select Patient'
                  placeholder='Search by name or patient ID'
                  required
                />
              )}
              renderOption={(props, option: any) => (
                <li {...props} key={option.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}
                    >
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant='body2' fontWeight={600}>
                        {option.firstName} {option.lastName}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        ID: {option.patientId}
                      </Typography>
                    </Box>
                  </Box>
                </li>
              )}
            />
          </Box>
        </Card>

        {/* Test Catalog */}
        <Card
          sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
        >
          <Box p={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>
                <Science />
              </Avatar>
              <Box flex={1}>
                <Typography variant='h6' fontWeight={600}>
                  Lab Test Catalog
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Browse and select tests from our laboratory catalog
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />

            <TextField
              fullWidth
              placeholder='Search tests...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            {loadingServices ? (
              <Alert severity='info'>Loading lab tests...</Alert>
            ) : filteredServices.length === 0 ? (
              <Alert severity='warning'>
                No lab tests found. Please contact administration to add lab
                services.
              </Alert>
            ) : (
              <TableContainer
                component={Paper}
                variant='outlined'
                sx={{ borderRadius: 2, maxHeight: 400 }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow
                      sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}
                    >
                      <TableCell>
                        <Typography variant='subtitle2' fontWeight={700}>
                          Test Name
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='subtitle2' fontWeight={700}>
                          Description
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='subtitle2' fontWeight={700}>
                          Price
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Typography variant='subtitle2' fontWeight={700}>
                          Action
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredServices.map((service: any) => {
                      const isSelected = selectedTests.some(
                        (t) => t.serviceId === service.id
                      );
                      return (
                        <TableRow
                          key={service.id}
                          sx={{
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.02),
                            },
                            bgcolor: isSelected
                              ? alpha(theme.palette.success.main, 0.05)
                              : 'inherit',
                          }}
                        >
                          <TableCell>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <Science fontSize='small' color='action' />
                              <Typography variant='body2' fontWeight={600}>
                                {service.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2' color='text.secondary'>
                              {service.description || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align='right'>
                            <Typography
                              variant='body1'
                              fontWeight={600}
                              color='primary'
                            >
                              {formatCurrency(Number(service.currentPrice))}
                            </Typography>
                          </TableCell>
                          <TableCell align='center'>
                            <Button
                              size='small'
                              variant={isSelected ? 'outlined' : 'contained'}
                              color={isSelected ? 'success' : 'primary'}
                              startIcon={
                                isSelected ? <Checkbox checked /> : <Add />
                              }
                              onClick={() => handleAddTest(service)}
                              sx={{ borderRadius: 2 }}
                            >
                              {isSelected ? 'Added' : 'Add'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Card>

        {/* Selected Tests */}
        {selectedTests.length > 0 && (
          <Card
            sx={{
              borderRadius: 3,
              border: '2px solid',
              borderColor: 'success.main',
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.success.main,
                0.08
              )} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
            }}
          >
            <Box p={3}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
              >
                <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                  <ShoppingCart />
                </Avatar>
                <Box flex={1}>
                  <Typography
                    variant='h6'
                    fontWeight={600}
                    color='success.main'
                  >
                    Order Summary
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {selectedTests.length} test
                    {selectedTests.length !== 1 ? 's' : ''} selected • Review
                    and adjust quantities
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />

              <TableContainer
                component={Paper}
                variant='outlined'
                sx={{ borderRadius: 2 }}
              >
                <Table>
                  <TableHead>
                    <TableRow
                      sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}
                    >
                      <TableCell>
                        <Typography variant='subtitle2' fontWeight={700}>
                          Test Name
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Typography variant='subtitle2' fontWeight={700}>
                          Quantity
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='subtitle2' fontWeight={700}>
                          Unit Price
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='subtitle2' fontWeight={700}>
                          Total
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Typography variant='subtitle2' fontWeight={700}>
                          Action
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedTests.map((test) => (
                      <TableRow key={test.serviceId}>
                        <TableCell>
                          <Box>
                            <Typography variant='body2' fontWeight={600}>
                              {test.serviceName}
                            </Typography>
                            {test.description && (
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                {test.description}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align='center'>
                          <TextField
                            type='number'
                            size='small'
                            value={test.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(
                                test.serviceId,
                                parseInt(e.target.value) || 1
                              )
                            }
                            inputProps={{
                              min: 1,
                              style: { textAlign: 'center' },
                            }}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2'>
                            {formatCurrency(test.price)}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography
                            variant='body1'
                            fontWeight={600}
                            color='primary'
                          >
                            {formatCurrency(test.price * test.quantity)}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleRemoveTest(test.serviceId)}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow
                      sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}
                    >
                      <TableCell colSpan={3} align='right'>
                        <Typography variant='h6' fontWeight={700}>
                          Total Amount:
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography
                          variant='h6'
                          fontWeight={700}
                          color='primary'
                        >
                          {formatCurrency(totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Card>
        )}

        {/* Additional Information */}
        <Card
          sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
        >
          <Box p={3}>
            <Typography variant='h6' fontWeight={600} gutterBottom>
              Additional Information
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              <TextField
                fullWidth
                label='Notes (Optional)'
                multiline
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='Add any special instructions or notes for the lab...'
                sx={{ borderRadius: 2 }}
              />
              <Alert severity='info' sx={{ borderRadius: 2 }}>
                <Typography variant='body2' fontWeight={600} gutterBottom>
                  Lab Order Processing
                </Typography>
                <Typography variant='body2'>
                  • Lab orders are for walk-in patients (external tests)
                  <br />
                  • Payment can be collected before or after test completion
                  <br />• Lab staff will be notified to process this order
                </Typography>
              </Alert>
            </Stack>
          </Box>
        </Card>

        {/* Action Buttons */}
        <Card
          sx={{
            borderRadius: 3,
            border: '2px solid',
            borderColor: 'primary.main',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.1
            )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
          }}
        >
          <Box p={3}>
            <Stack spacing={2}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant='h6' fontWeight={700} color='primary'>
                    Ready to Submit?
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {!selectedPatient
                      ? 'Please select a patient first'
                      : selectedTests.length === 0
                      ? 'Please add at least one test'
                      : `${selectedTests.length} test${
                          selectedTests.length !== 1 ? 's' : ''
                        } for ${selectedPatient.firstName} ${
                          selectedPatient.lastName
                        }`}
                  </Typography>
                </Box>
                <Typography variant='h5' fontWeight={700} color='primary'>
                  {formatCurrency(totalAmount)}
                </Typography>
              </Box>
              <Divider />
              <Stack direction='row' spacing={2} justifyContent='flex-end'>
                <Button
                  variant='outlined'
                  onClick={() => navigate('/lab/orders')}
                  disabled={createLabOrderMutation.isPending}
                  sx={{ borderRadius: 2, minWidth: 120 }}
                >
                  Cancel
                </Button>
                <Button
                  variant='contained'
                  color='primary'
                  size='large'
                  onClick={handleSubmit}
                  disabled={
                    !selectedPatient ||
                    selectedTests.length === 0 ||
                    createLabOrderMutation.isPending
                  }
                  startIcon={<Payment />}
                  sx={{
                    borderRadius: 2,
                    minWidth: 200,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  {createLabOrderMutation.isPending
                    ? 'Creating Order...'
                    : 'Create Lab Order'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Card>
      </Stack>
    </Box>
  );
};

export default CreateLabOrderPage;
