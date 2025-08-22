import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Alert,
  Skeleton,
  Paper,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tooltip,
} from '@mui/material';
import { Save, Cancel, Add, Delete, Edit } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import { invoiceService } from '../services/invoice.service';
import { formatDate, formatCurrency } from '../utils';
import toast from 'react-hot-toast';
import type { Invoice, Service } from '../types';

interface InvoiceItem {
  id?: string;
  serviceId: string;
  service?: Service;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface EditInvoiceFormData {
  patientId: string;
  dueDate: Date | null;
  notes: string;
  items: InvoiceItem[];
  taxAmount: number;
  discountAmount: number;
}

const InvoiceEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management
  const [formData, setFormData] = useState<EditInvoiceFormData>({
    patientId: '',
    dueDate: null,
    notes: '',
    items: [],
    taxAmount: 0,
    discountAmount: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<InvoiceItem>({
    serviceId: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
  });

  // Fetch invoice details
  const {
    data: invoice,
    isLoading,
    isError,
    refetch,
  } = useQuery<Invoice>({
    queryKey: ['invoice', id],
    queryFn: () => invoiceService.getInvoiceById(id!),
    enabled: !!id,
    retry: 1,
  });

  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: (updateData: any) =>
      invoiceService.updateInvoice(id!, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice updated successfully');
      navigate(`/billing/${id}`);
    },
    onError: (error) => {
      console.error('Update invoice error:', error);
      toast.error('Failed to update invoice');
    },
  });

  // Initialize form data when invoice loads
  useEffect(() => {
    if (invoice) {
      setFormData({
        patientId: invoice.patientId,
        dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
        notes: invoice.notes || '',
        items:
          invoice.charges?.map((charge: any) => ({
            id: charge.id,
            serviceId: charge.serviceId,
            service: charge.service,
            description: charge.description,
            quantity: charge.quantity,
            unitPrice: Number(charge.unitPrice),
            totalPrice: Number(charge.totalPrice),
          })) || [],
        taxAmount: Number(invoice.taxAmount) || 0,
        discountAmount: Number(invoice.discountAmount) || 0,
      });
    }
  }, [invoice]);

  // Calculate totals
  const subtotal = formData.items.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );
  const totalAfterTax = subtotal + formData.taxAmount;
  const finalTotal = totalAfterTax - formData.discountAmount;

  // Event handlers
  const handleBack = () => {
    navigate(`/billing/${id}`);
  };

  const handleSave = () => {
    if (formData.items.length === 0) {
      toast.error('Invoice must have at least one item');
      return;
    }

    const updateData = {
      dueDate: formData.dueDate?.toISOString(),
      notes: formData.notes,
      taxAmount: formData.taxAmount,
      discountAmount: formData.discountAmount,
      totalAmount: finalTotal,
    };

    updateInvoiceMutation.mutate(updateData);
  };

  const handleCancel = () => {
    navigate(`/billing/${id}`);
  };

  const handleAddItem = () => {
    setEditingItem({
      serviceId: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    });
    setEditingItemIndex(null);
    setIsEditing(true);
  };

  const handleEditItem = (index: number) => {
    setEditingItem({ ...formData.items[index] });
    setEditingItemIndex(index);
    setIsEditing(true);
  };

  const handleDeleteItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleSaveItem = () => {
    if (
      !editingItem.description ||
      editingItem.quantity <= 0 ||
      editingItem.unitPrice <= 0
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newItem = {
      ...editingItem,
      totalPrice: editingItem.quantity * editingItem.unitPrice,
    };

    const newItems = [...formData.items];
    if (editingItemIndex !== null) {
      newItems[editingItemIndex] = newItem;
    } else {
      newItems.push(newItem);
    }

    setFormData({ ...formData, items: newItems });
    setIsEditing(false);
    setEditingItemIndex(null);
    setEditingItem({
      serviceId: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingItemIndex(null);
    setEditingItem({
      serviceId: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    });
  };

  const handleItemChange = (field: keyof InvoiceItem, value: any) => {
    setEditingItem({ ...editingItem, [field]: value });
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? value : editingItem.quantity;
      const unitPrice = field === 'unitPrice' ? value : editingItem.unitPrice;
      setEditingItem((prev) => ({ ...prev, totalPrice: quantity * unitPrice }));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box>
        <PageHeader
          title='Edit Invoice'
          subtitle='Loading invoice information...'
          breadcrumbs={<Breadcrumb />}
          showActions={false}
        />
        <Box p={2}>
          <Card sx={{ p: 3 }}>
            <Skeleton variant='text' width='60%' height={40} sx={{ mb: 2 }} />
            <Skeleton variant='text' width='40%' height={24} sx={{ mb: 3 }} />
            <Skeleton variant='rectangular' height={400} />
          </Card>
        </Box>
      </Box>
    );
  }

  // Error state
  if (isError || !invoice) {
    return (
      <Box>
        <PageHeader
          title='Edit Invoice'
          subtitle='Failed to load invoice'
          breadcrumbs={<Breadcrumb />}
          onRefresh={refetch}
          showActions={true}
        />
        <Alert
          severity='error'
          action={
            <Button color='inherit' size='small' onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load invoice details. Please try again.
        </Alert>
      </Box>
    );
  }

  const patientName =
    invoice.patientName ||
    (invoice.patient
      ? `${invoice.patient.firstName} ${invoice.patient.lastName}`
      : 'Unknown Patient');

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Page Header */}
        <PageHeader
          title={`Edit Invoice ${invoice.invoiceNumber || invoice.number}`}
          subtitle={`For ${patientName}`}
          breadcrumbs={<Breadcrumb />}
          onBack={handleBack}
          showActions={false}
        />

        {/* Main Content */}
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            flexDirection: { xs: 'column', lg: 'row' },
          }}
        >
          {/* Invoice Details Form */}
          <Box sx={{ flex: 2 }}>
            <Card>
              <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant='h6' gutterBottom>
                  Invoice Details
                </Typography>
                <Stack spacing={3}>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      flexDirection: { xs: 'column', sm: 'row' },
                    }}
                  >
                    <TextField
                      label='Invoice Number'
                      value={invoice.invoiceNumber || invoice.number}
                      fullWidth
                      disabled
                      variant='outlined'
                    />
                    <TextField
                      label='Issue Date'
                      value={formatDate(
                        invoice.issuedDate || invoice.createdAt
                      )}
                      fullWidth
                      disabled
                      variant='outlined'
                    />
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      flexDirection: { xs: 'column', sm: 'row' },
                    }}
                  >
                    <DatePicker
                      label='Due Date'
                      value={formData.dueDate}
                      onChange={(newValue) =>
                        setFormData({ ...formData, dueDate: newValue })
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: 'outlined',
                        },
                      }}
                    />
                    <TextField
                      label='Patient'
                      value={patientName}
                      fullWidth
                      disabled
                      variant='outlined'
                    />
                  </Box>
                  <TextField
                    label='Notes'
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    fullWidth
                    multiline
                    rows={3}
                    variant='outlined'
                  />
                </Stack>
              </Box>

              {/* Invoice Items */}
              <Box sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant='h6'>Invoice Items</Typography>
                  <Button
                    variant='contained'
                    startIcon={<Add />}
                    onClick={handleAddItem}
                    size='small'
                  >
                    Add Item
                  </Button>
                </Box>

                <TableContainer component={Paper} variant='outlined'>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Service</TableCell>
                        <TableCell align='center'>Quantity</TableCell>
                        <TableCell align='right'>Unit Price</TableCell>
                        <TableCell align='right'>Total</TableCell>
                        <TableCell align='center'>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.length > 0 ? (
                        formData.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Box>
                                <Typography variant='body2' fontWeight={500}>
                                  {item.service?.name || 'Unknown Service'}
                                </Typography>
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  {item.description}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align='center'>
                              {item.quantity}
                            </TableCell>
                            <TableCell align='right'>
                              {formatCurrency(item.unitPrice)}
                            </TableCell>
                            <TableCell align='right'>
                              {formatCurrency(item.totalPrice)}
                            </TableCell>
                            <TableCell align='center'>
                              <Box
                                sx={{
                                  display: 'flex',
                                  gap: 1,
                                  justifyContent: 'center',
                                }}
                              >
                                <Tooltip title='Edit Item'>
                                  <IconButton
                                    size='small'
                                    onClick={() => handleEditItem(index)}
                                  >
                                    <Edit fontSize='small' />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title='Delete Item'>
                                  <IconButton
                                    size='small'
                                    color='error'
                                    onClick={() => handleDeleteItem(index)}
                                  >
                                    <Delete fontSize='small' />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align='center'>
                            <Typography variant='body2' color='text.secondary'>
                              No items added yet
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Invoice Totals */}
                <Box
                  sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}
                >
                  <Box sx={{ minWidth: 300 }}>
                    <Box display='flex' justifyContent='space-between' mb={1}>
                      <Typography variant='body2'>Subtotal:</Typography>
                      <Typography variant='body2'>
                        {formatCurrency(subtotal)}
                      </Typography>
                    </Box>
                    <Box display='flex' justifyContent='space-between' mb={1}>
                      <Typography variant='body2'>Tax:</Typography>
                      <TextField
                        type='number'
                        value={formData.taxAmount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            taxAmount: Number(e.target.value) || 0,
                          })
                        }
                        size='small'
                        sx={{ width: 100 }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Box>
                    <Box display='flex' justifyContent='space-between' mb={1}>
                      <Typography variant='body2'>Discount:</Typography>
                      <TextField
                        type='number'
                        value={formData.discountAmount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountAmount: Number(e.target.value) || 0,
                          })
                        }
                        size='small'
                        sx={{ width: 100 }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display='flex' justifyContent='space-between'>
                      <Typography variant='h6'>Total:</Typography>
                      <Typography variant='h6'>
                        {formatCurrency(finalTotal)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Box>

          {/* Sidebar Actions */}
          <Box sx={{ flex: 1 }}>
            <Card>
              <Box sx={{ p: 3 }}>
                <Typography variant='h6' gutterBottom>
                  Actions
                </Typography>
                <Stack spacing={2}>
                  <Button
                    variant='contained'
                    fullWidth
                    startIcon={<Save />}
                    onClick={handleSave}
                    disabled={updateInvoiceMutation.isPending}
                  >
                    {updateInvoiceMutation.isPending
                      ? 'Saving...'
                      : 'Save Changes'}
                  </Button>
                  <Button
                    variant='outlined'
                    fullWidth
                    startIcon={<Cancel />}
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Typography variant='subtitle2' gutterBottom>
                  Invoice Summary
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box display='flex' justifyContent='space-between' mb={1}>
                    <Typography variant='body2'>Items:</Typography>
                    <Typography variant='body2'>
                      {formData.items.length}
                    </Typography>
                  </Box>
                  <Box display='flex' justifyContent='space-between' mb={1}>
                    <Typography variant='body2'>Subtotal:</Typography>
                    <Typography variant='body2'>
                      {formatCurrency(subtotal)}
                    </Typography>
                  </Box>
                  <Box display='flex' justifyContent='space-between' mb={1}>
                    <Typography variant='body2'>Tax:</Typography>
                    <Typography variant='body2'>
                      {formatCurrency(formData.taxAmount)}
                    </Typography>
                  </Box>
                  <Box display='flex' justifyContent='space-between' mb={1}>
                    <Typography variant='body2'>Discount:</Typography>
                    <Typography variant='body2'>
                      {formatCurrency(formData.discountAmount)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box display='flex' justifyContent='space-between'>
                    <Typography variant='body1' fontWeight={500}>
                      Final Total:
                    </Typography>
                    <Typography variant='body1' fontWeight={500}>
                      {formatCurrency(finalTotal)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Box>
        </Box>

        {/* Edit Item Dialog */}
        <Dialog
          open={isEditing}
          onClose={handleCancelEdit}
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle>
            {editingItemIndex !== null ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label='Description'
                value={editingItem.description}
                onChange={(e) =>
                  handleItemChange('description', e.target.value)
                }
                fullWidth
                required
                multiline
                rows={2}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label='Quantity'
                  type='number'
                  value={editingItem.quantity}
                  onChange={(e) =>
                    handleItemChange('quantity', Number(e.target.value))
                  }
                  fullWidth
                  required
                  inputProps={{ min: 1, step: 1 }}
                />
                <TextField
                  label='Unit Price'
                  type='number'
                  value={editingItem.unitPrice}
                  onChange={(e) =>
                    handleItemChange('unitPrice', Number(e.target.value))
                  }
                  fullWidth
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Box>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant='body2' color='text.secondary'>
                  Total: {formatCurrency(editingItem.totalPrice)}
                </Typography>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelEdit}>Cancel</Button>
            <Button onClick={handleSaveItem} variant='contained'>
              Save Item
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default InvoiceEditPage;
