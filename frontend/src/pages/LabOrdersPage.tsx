import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  Tooltip,
  Typography,
  TablePagination,
  Alert,
  Skeleton,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from '@mui/material';
import {
  Search,
  Visibility,
  CheckCircle,
  Payment,
  Science,
  Add,
} from '@mui/icons-material';
import { useToast } from '@/context/ToastContext';
import { usePermissions } from '@/hooks/usePermissions';
import { formatDate, formatCurrency, getInitials } from '@/utils';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import { labOrderService, type LabOrder } from '../services/lab-order.service';
import {
  paymentService,
  type ProcessPaymentData,
} from '../services/payment.service';

const LabOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const { canViewLabOrders } = usePermissions();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Fetch lab orders
  const {
    data: labOrders,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['lab-orders', statusFilter, paymentFilter, searchQuery],
    queryFn: () =>
      labOrderService.getLabOrders({
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      }),
    enabled: canViewLabOrders(),
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: (paymentData: ProcessPaymentData) =>
      paymentService.processPayment(paymentData),
    onSuccess: () => {
      showSuccess('Payment processed successfully');
      // Invalidate all lab-orders queries regardless of filters
      queryClient.invalidateQueries({
        queryKey: ['lab-orders'],
        refetchType: 'all',
      });
      setPaymentDialogOpen(false);
      resetPaymentForm();
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to process payment');
    },
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (
    status: string
  ):
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning' => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'IN_PROGRESS':
        return 'info';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  // Payment dialog handlers
  const handleOpenPaymentDialog = (
    order: LabOrder,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent row click navigation
    setSelectedOrder(order);
    setPaymentAmount(order.totalAmount?.toString() || '');
    setPaymentDialogOpen(true);
  };

  const resetPaymentForm = () => {
    setSelectedOrder(null);
    setPaymentAmount('');
    setPaymentMethod('CASH');
    setPaymentReference('');
    setPaymentNotes('');
  };

  const handleSubmitPayment = () => {
    if (!selectedOrder) {
      showError('No order selected');
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      showError('Please enter a valid payment amount');
      return;
    }

    if (!selectedOrder.invoiceId) {
      showError('No invoice found for this order');
      return;
    }

    const paymentData: ProcessPaymentData = {
      invoiceId: selectedOrder.invoiceId,
      patientId: selectedOrder.patientId,
      amount: parseFloat(paymentAmount),
      paymentMethod: paymentMethod,
      referenceNumber: paymentReference || undefined,
      notes: paymentNotes || undefined,
    };

    processPaymentMutation.mutate(paymentData);
  };

  const filteredOrders =
    labOrders?.filter((order) => {
      if (paymentFilter === 'paid' && !order.isPaid) return false;
      if (paymentFilter === 'unpaid' && order.isPaid) return false;
      return true;
    }) || [];

  const paginatedOrders = filteredOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (!canViewLabOrders()) {
    return (
      <Box>
        <PageHeader title='Lab Orders' breadcrumbs={<Breadcrumb />} />
        <Alert severity='error' sx={{ borderRadius: 2 }}>
          You don't have permission to view lab orders.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title='Lab Orders'
        subtitle={`${filteredOrders.length} orders found`}
        breadcrumbs={<Breadcrumb />}
        onRefresh={() => refetch()}
        actions={
          <Button
            variant='contained'
            color='primary'
            startIcon={<Add />}
            onClick={() => navigate('/lab/orders/create')}
            sx={{ borderRadius: 2 }}
          >
            Create Lab Order
          </Button>
        }
      />

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <Box p={3}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              size='small'
              placeholder='Search patient or doctor...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250, borderRadius: 2 }}
            />
            <FormControl size='small' sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label='Status'
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='PENDING'>Pending</MenuItem>
                <MenuItem value='IN_PROGRESS'>In Progress</MenuItem>
                <MenuItem value='COMPLETED'>Completed</MenuItem>
                <MenuItem value='CANCELLED'>Cancelled</MenuItem>
              </Select>
            </FormControl>
            <FormControl size='small' sx={{ minWidth: 150 }}>
              <InputLabel>Payment</InputLabel>
              <Select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                label='Payment'
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='paid'>Paid</MenuItem>
                <MenuItem value='unpaid'>Unpaid</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Card>

      {/* Lab Orders Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Tests</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Order Date</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={8}>
                      <Skeleton height={60} />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Alert severity='info' sx={{ borderRadius: 2 }}>
                      No lab orders found
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/lab/orders/${order.id}`)}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: 'primary.main',
                            fontSize: '0.875rem',
                          }}
                        >
                          {getInitials(
                            `${order.patient?.firstName || ''} ${
                              order.patient?.lastName || ''
                            }`
                          )}
                        </Avatar>
                        <Box>
                          <Typography variant='body2' fontWeight={600}>
                            {order.patient?.firstName || 'N/A'}{' '}
                            {order.patient?.lastName || ''}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            ID: {order.patient?.patientId || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        Dr. {order.doctor?.user?.firstName || 'N/A'}{' '}
                        {order.doctor?.user?.lastName || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Science fontSize='small' color='action' />
                        <Typography variant='body2'>
                          {order.tests.length} test
                          {order.tests.length !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        size='small'
                        color={getStatusColor(order.status)}
                        variant='outlined'
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.isPaid ? 'Paid' : 'Unpaid'}
                        size='small'
                        color={order.isPaid ? 'success' : 'warning'}
                        icon={order.isPaid ? <CheckCircle /> : <Payment />}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant='body2' fontWeight={600}>
                          {formatCurrency(order.totalAmount)}
                        </Typography>
                        {order.balance > 0 && (
                          <Typography variant='caption' color='error.main'>
                            Balance: {formatCurrency(order.balance)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='text.secondary'>
                        {formatDate(order.orderDate)}
                      </Typography>
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
                          <IconButton size='small'>
                            <Visibility fontSize='small' />
                          </IconButton>
                        </Tooltip>
                        {!order.isPaid && (
                          <Tooltip title='Process Payment'>
                            <IconButton
                              size='small'
                              color='success'
                              onClick={(e) => handleOpenPaymentDialog(order, e)}
                            >
                              <Payment fontSize='small' />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component='div'
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Order Info */}
            {selectedOrder && (
              <Alert severity='info' sx={{ borderRadius: 2, mb: 2 }}>
                <Typography variant='body2' fontWeight={600} gutterBottom>
                  Order Details
                </Typography>
                <Typography variant='body2'>
                  Patient: {selectedOrder.patient?.firstName}{' '}
                  {selectedOrder.patient?.lastName} (
                  {selectedOrder.patient?.patientId})
                </Typography>
                <Typography variant='body2'>
                  Tests: {selectedOrder.tests?.length || 0} test(s)
                </Typography>
                <Typography
                  variant='body2'
                  fontWeight={600}
                  color='primary.main'
                >
                  Total Amount: {formatCurrency(selectedOrder.totalAmount)}
                </Typography>
              </Alert>
            )}

            <TextField
              label='Payment Amount'
              type='number'
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              fullWidth
              required
              inputProps={{ min: 0, step: 0.01 }}
              helperText={`Total order amount: ${formatCurrency(
                selectedOrder?.totalAmount || 0
              )}`}
            />

            <FormControl fullWidth required>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentMethod}
                label='Payment Method'
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <MenuItem value='CASH'>Cash</MenuItem>
                <MenuItem value='CARD'>Card</MenuItem>
                <MenuItem value='BANK_TRANSFER'>Bank Transfer</MenuItem>
                <MenuItem value='MOBILE_MONEY'>Mobile Money</MenuItem>
                <MenuItem value='INSURANCE'>Insurance</MenuItem>
                <MenuItem value='CHECK'>Check</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label='Payment Reference'
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              fullWidth
              placeholder='Optional reference number'
              helperText='Transaction ID, receipt number, or other reference'
            />

            <TextField
              label='Notes'
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder='Optional payment notes'
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setPaymentDialogOpen(false);
              resetPaymentForm();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitPayment}
            variant='contained'
            disabled={processPaymentMutation.isPending}
            startIcon={<Payment />}
          >
            {processPaymentMutation.isPending
              ? 'Processing...'
              : 'Process Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LabOrdersPage;
