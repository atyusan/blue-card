import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Paper,
  Stack,
  Divider,
  Alert,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import { invoiceService } from '../services/invoice.service';
import { patientService } from '../services/patient.service';
import { serviceService } from '../services/service.service';
import { formatCurrency } from '../utils';
import toast from 'react-hot-toast';
import type { CreateInvoiceFormData, Patient, Service } from '../types';

interface InvoiceItem {
  serviceId: string;
  serviceName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const CreateInvoicePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state
  const [patientId, setPatientId] = useState<string>('');
  const [dueDate, setDueDate] = useState<Date | null>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ); // 30 days from now
  const [notes, setNotes] = useState<string>('');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [itemDescription, setItemDescription] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);

  // Fetch patients for selection
  const { data: patientsData } = useQuery({
    queryKey: ['patients', { limit: 100 }],
    queryFn: () => patientService.getPatients({ limit: 100 }),
  });

  // Fetch services for selection
  const { data: servicesData, isLoading: servicesLoading } = useQuery<
    Service[]
  >({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await serviceService.getServices({ active: true });
      // Handle both paginated and direct array responses
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data;
      }
      return response as Service[];
    },
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: (invoiceData: CreateInvoiceFormData) =>
      invoiceService.createInvoice(invoiceData),
    onSuccess: (invoice) => {
      toast.success('Invoice created successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate(`/billing/${invoice.id}`);
    },
    onError: (error) => {
      console.error('Create invoice error:', error);
      toast.error('Failed to create invoice');
    },
  });

  // Computed values
  const subtotal = useMemo(() => {
    return invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [invoiceItems]);

  const totalAmount = useMemo(() => {
    return subtotal; // No tax or discount for now
  }, [subtotal]);

  // Event handlers
  const handleBack = () => {
    navigate('/billing');
  };

  const handleAddItem = () => {
    if (!selectedService || itemQuantity <= 0 || itemUnitPrice <= 0) {
      toast.error('Please fill in all required fields for the item');
      return;
    }

    const newItem: InvoiceItem = {
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      description: itemDescription || selectedService.name,
      quantity: itemQuantity,
      unitPrice: itemUnitPrice,
      totalPrice: itemQuantity * itemUnitPrice,
    };

    setInvoiceItems([...invoiceItems, newItem]);

    // Reset form
    setSelectedService(null);
    setItemDescription('');
    setItemQuantity(1);
    setItemUnitPrice(0);
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleServiceChange = (service: Service | null) => {
    setSelectedService(service);
    if (service) {
      setItemUnitPrice(service.currentPrice || 0);
      setItemDescription(service.name);
    }
  };

  const handleSubmit = () => {
    if (!patientId) {
      toast.error('Please select a patient');
      return;
    }

    if (invoiceItems.length === 0) {
      toast.error('Please add at least one item to the invoice');
      return;
    }

    if (!dueDate) {
      toast.error('Please set a due date');
      return;
    }

    const invoiceData: CreateInvoiceFormData = {
      patientId,
      dueDate: dueDate.toISOString(),
      notes: notes.trim() || undefined,
      items: invoiceItems.map((item) => ({
        serviceId: item.serviceId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };

    createInvoiceMutation.mutate(invoiceData);
  };

  const handleCancel = () => {
    navigate('/billing');
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader title='Create New Invoice' onBack={handleBack} />

      <Breadcrumb />

      <Box sx={{ mt: 3 }}>
        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant='h6' sx={{ mb: 3 }}>
            Invoice Details
          </Typography>

          <Stack spacing={3}>
            {/* Patient Selection */}
            <FormControl fullWidth required>
              <InputLabel>Select Patient</InputLabel>
              <Select
                value={patientId}
                label='Select Patient'
                onChange={(e) => setPatientId(e.target.value)}
              >
                {patientsData?.data?.map((patient: Patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName} - {patient.patientId}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Due Date */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label='Due Date'
                value={dueDate}
                onChange={(newValue) => setDueDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
            </LocalizationProvider>

            {/* Notes */}
            <TextField
              label='Notes'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder='Optional notes for the invoice'
            />
          </Stack>
        </Card>

        {/* Invoice Items */}
        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant='h6' sx={{ mb: 3 }}>
            Invoice Items
          </Typography>

          {/* Add Item Form */}
          <Paper sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
            <Stack spacing={2}>
              <Typography variant='subtitle2' color='text.secondary'>
                Add New Item
              </Typography>

              <Stack direction='row' spacing={2} alignItems='flex-end'>
                <Autocomplete
                  options={servicesData || []}
                  getOptionLabel={(option) => option.name}
                  value={selectedService}
                  onChange={(_, newValue) => handleServiceChange(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label='Service' required />
                  )}
                  sx={{ minWidth: 200 }}
                  noOptionsText={
                    servicesLoading
                      ? 'Loading services...'
                      : 'No services found'
                  }
                  loading={servicesLoading}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <div>
                        <div>{option.name}</div>
                        <div style={{ fontSize: '0.8em', color: 'gray' }}>
                          ${option.currentPrice} -{' '}
                          {typeof option.category === 'string'
                            ? option.category
                            : option.category?.name}
                        </div>
                      </div>
                    </li>
                  )}
                />

                <TextField
                  label='Description'
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  sx={{ minWidth: 200 }}
                />

                <TextField
                  label='Quantity'
                  type='number'
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(Number(e.target.value))}
                  inputProps={{ min: 1, step: 1 }}
                  sx={{ width: 100 }}
                  required
                />

                <TextField
                  label='Unit Price'
                  type='number'
                  value={itemUnitPrice}
                  onChange={(e) => setItemUnitPrice(Number(e.target.value))}
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>$</InputAdornment>
                    ),
                  }}
                  sx={{ width: 150 }}
                  required
                />

                <Button
                  variant='contained'
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                  disabled={
                    !selectedService || itemQuantity <= 0 || itemUnitPrice <= 0
                  }
                >
                  Add Item
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {/* Items Table */}
          {invoiceItems.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Service</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align='right'>Quantity</TableCell>
                    <TableCell align='right'>Unit Price</TableCell>
                    <TableCell align='right'>Total</TableCell>
                    <TableCell align='center'>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoiceItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.serviceName}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell align='right'>{item.quantity}</TableCell>
                      <TableCell align='right'>
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell align='right'>
                        {formatCurrency(item.totalPrice)}
                      </TableCell>
                      <TableCell align='center'>
                        <IconButton
                          color='error'
                          onClick={() => handleRemoveItem(index)}
                          size='small'
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity='info'>
              No items added yet. Use the form above to add invoice items.
            </Alert>
          )}
        </Card>

        {/* Summary */}
        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant='h6' sx={{ mb: 2 }}>
            Invoice Summary
          </Typography>

          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Subtotal:</Typography>
              <Typography>{formatCurrency(subtotal)}</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant='h6'>Total Amount:</Typography>
              <Typography variant='h6'>
                {formatCurrency(totalAmount)}
              </Typography>
            </Box>
          </Stack>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant='outlined'
            startIcon={<CancelIcon />}
            onClick={handleCancel}
            disabled={createInvoiceMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={
              createInvoiceMutation.isPending || invoiceItems.length === 0
            }
          >
            {createInvoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateInvoicePage;
