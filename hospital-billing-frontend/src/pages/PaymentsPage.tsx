import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Skeleton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemIcon,
  Divider,
  Menu,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Visibility,
  Receipt,
  Print,
  Download,
  Refresh,
  Add,
  AccountBalance,
  CreditCard,
  Money,
  Timeline,
  CheckCircle,
  Error,
  Pending,
  Cancel,
  MoneyOff,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import { paymentService } from '../services/payment.service';
import { formatDate, formatCurrency } from '../utils';
import toast from 'react-hot-toast';

const PaymentsPage = () => {
  const navigate = useNavigate();

  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(
    null
  );

  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundCustomAmount, setRefundCustomAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundNotes, setRefundNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  // Fetch payments from API
  const {
    data: paymentsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'payments',
      { statusFilter, methodFilter, searchQuery, page, rowsPerPage },
    ],
    queryFn: async () => {
      const params = {
        status: statusFilter || undefined,
        paymentMethod: methodFilter || undefined,
        search: searchQuery || undefined,
        // Note: Backend doesn't support pagination yet
        // page: page + 1,
        // limit: rowsPerPage,
      };
      try {
        const result = await paymentService.getPayments(params);
        return result;
      } catch (err) {
        console.error('PaymentsPage - API call failed:', err);
        throw err;
      }
    },
  });

  // Backend returns a simple array, not a paginated response
  const payments = Array.isArray(paymentsResponse) ? paymentsResponse : [];
  const totalPayments = payments.length;

  // Backend doesn't support pagination yet, so we'll do client-side pagination
  const displayedPayments = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return payments.slice(start, end);
  }, [payments, page, rowsPerPage]);

  // Event handlers
  const handleActionMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    payment: any
  ) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedPayment(payment);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedPayment(null);
  };

  const handleViewPayment = () => {
    if (selectedPayment?.id) {
      navigate(`/payments/${selectedPayment.id}`);
    } else {
      toast.error('Payment information not available');
    }
    handleActionMenuClose();
  };

  const handleProcessNewPayment = () => {
    navigate('/payments/process');
  };

  const handleViewRefunds = () => {
    navigate('/payments/refunds');
  };

  const handlePrintReceipt = async () => {
    if (!selectedPayment) {
      toast.error('No payment selected');
      return;
    }

    try {
      toast.loading('Generating receipt for printing...');
      const pdfBlob = await paymentService.generatePaymentReceiptPDF(
        selectedPayment.id
      );

      // Create a new window for printing
      const url = window.URL.createObjectURL(pdfBlob);
      const printWindow = window.open(url, '_blank');

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          // Clean up the URL after printing
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 1000);
        };
        toast.success('Opening print dialog...');
      } else {
        // Fallback: download the PDF if popup is blocked
        const link = document.createElement('a');
        link.href = url;
        link.download = `payment-receipt-${selectedPayment.reference}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('PDF receipt downloaded for printing');
      }
    } catch (error) {
      console.error('Error generating PDF receipt:', error);
      toast.error('Failed to generate PDF receipt for printing');
    } finally {
      handleActionMenuClose();
    }
  };

  const handleDownloadReceipt = async () => {
    if (!selectedPayment) {
      toast.error('No payment selected');
      return;
    }

    try {
      toast.loading('Generating PDF receipt...');

      const pdfBlob = await paymentService.generatePaymentReceiptPDF(
        selectedPayment.id
      );

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-receipt-${selectedPayment.reference}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('PDF receipt downloaded successfully!');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt. Please try again.');
    } finally {
      handleActionMenuClose();
    }
  };

  const handleRefundPayment = () => {
    if (!selectedPayment) {
      toast.error('No payment selected');
      return;
    }

    // Set initial refund amount to payment amount
    setRefundAmount(selectedPayment.amount || '');
    setRefundCustomAmount('');
    setRefundReason('');
    setRefundNotes('');
    setRefundDialogOpen(true);
    // Don't clear selectedPayment here - we need it for the dialog
    setActionMenuAnchor(null);
  };

  const handleCloseRefundDialog = () => {
    setRefundDialogOpen(false);
    setRefundAmount('');
    setRefundCustomAmount('');
    setRefundReason('');
    setRefundNotes('');
    // Clear selectedPayment when dialog closes
    setSelectedPayment(null);
  };

  const handleProcessRefund = async () => {
    if (!selectedPayment || !refundAmount || !refundReason) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (
      refundAmount === 'custom' &&
      (!refundCustomAmount || parseFloat(refundCustomAmount) <= 0)
    ) {
      toast.error('Please enter a valid custom refund amount');
      return;
    }

    const actualRefundAmount =
      refundAmount === 'custom'
        ? parseFloat(refundCustomAmount)
        : parseFloat(refundAmount);

    const maxAmount = parseFloat(selectedPayment.amount);
    if (actualRefundAmount <= 0 || actualRefundAmount > maxAmount) {
      toast.error('Invalid refund amount');
      return;
    }

    try {
      toast.loading('Processing refund...');

      const refundData = {
        paymentId: selectedPayment.id,
        amount: actualRefundAmount,
        reason: refundReason,
        notes: refundNotes,
      };

      await paymentService.createRefund(refundData);

      toast.success('Refund processed successfully!');
      setRefundDialogOpen(false);
      setRefundAmount('');
      setRefundCustomAmount('');
      setRefundReason('');
      setRefundNotes('');
      setSelectedPayment(null);
      refetch(); // Refresh payments list
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund. Please try again.');
    }
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'error';
      case 'CANCELLED':
        return 'default';
      case 'REFUND_REQUESTED':
        return 'warning';
      case 'REFUNDED':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle fontSize='small' />;
      case 'PENDING':
        return <Pending fontSize='small' />;
      case 'FAILED':
        return <Error fontSize='small' />;
      case 'CANCELLED':
        return <Cancel fontSize='small' />;
      case 'REFUND_REQUESTED':
        return <MoneyOff fontSize='small' />;
      case 'REFUNDED':
        return <Receipt fontSize='small' />;
      default:
        return <Timeline fontSize='small' />;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method.toUpperCase()) {
      case 'CASH':
        return <Money />;
      case 'CARD':
        return <CreditCard />;
      case 'BANK_TRANSFER':
        return <AccountBalance />;
      case 'PAYSTACK':
        return <Timeline />;
      default:
        return <Timeline />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'CASH':
        return 'success';
      case 'CARD':
        return 'primary';
      case 'BANK_TRANSFER':
        return 'info';
      case 'PAYSTACK':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <PageHeader
        title='Payments'
        subtitle='Manage and track all payments'
        breadcrumbs={<Breadcrumb />}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant='outlined'
              startIcon={<Refresh />}
              onClick={() => refetch()}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant='outlined'
              startIcon={<Timeline />}
              onClick={handleViewRefunds}
            >
              View Refunds
            </Button>
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={handleProcessNewPayment}
            >
              Process Payment
            </Button>
          </Box>
        }
      />

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              placeholder='Search payments...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label='Status'
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value=''>All Statuses</MenuItem>
                <MenuItem value='COMPLETED'>Completed</MenuItem>
                <MenuItem value='PENDING'>Pending</MenuItem>
                <MenuItem value='FAILED'>Failed</MenuItem>
                <MenuItem value='CANCELLED'>Cancelled</MenuItem>
                <MenuItem value='REFUND_REQUESTED'>Refund Requested</MenuItem>
                <MenuItem value='REFUNDED'>Refunded</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Method</InputLabel>
              <Select
                value={methodFilter}
                label='Method'
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <MenuItem value=''>All Methods</MenuItem>
                <MenuItem value='CASH'>Cash</MenuItem>
                <MenuItem value='CARD'>Card</MenuItem>
                <MenuItem value='BANK_TRANSFER'>Bank Transfer</MenuItem>
                <MenuItem value='PAYSTACK'>Paystack</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant='outlined'
              startIcon={<FilterList />}
              onClick={() => {
                setStatusFilter('');
                setMethodFilter('');
              }}
            >
              Clear Filters
            </Button>
          </Stack>
        </Box>
      </Card>

      {/* Payments Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Payment</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Invoice</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Processed By</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                // Loading skeleton rows
                Array.from({ length: rowsPerPage }).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    <TableCell>
                      <Skeleton />
                    </TableCell>
                    <TableCell>
                      <Skeleton />
                    </TableCell>
                    <TableCell>
                      <Skeleton />
                    </TableCell>
                    <TableCell>
                      <Skeleton />
                    </TableCell>
                    <TableCell>
                      <Skeleton />
                    </TableCell>
                    <TableCell>
                      <Skeleton />
                    </TableCell>
                    <TableCell>
                      <Skeleton />
                    </TableCell>
                    <TableCell>
                      <Skeleton />
                    </TableCell>
                    <TableCell align='right'>
                      <Skeleton />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={9} align='center' sx={{ py: 4 }}>
                    <Alert severity='error' sx={{ mb: 2 }}>
                      Failed to load payments. Please try again.
                    </Alert>
                    <Button
                      variant='outlined'
                      startIcon={<Refresh />}
                      onClick={() => refetch()}
                    >
                      Retry
                    </Button>
                  </TableCell>
                </TableRow>
              ) : displayedPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align='center' sx={{ py: 4 }}>
                    <Typography variant='body1' color='text.secondary'>
                      No payments found
                    </Typography>
                    <Button
                      variant='outlined'
                      startIcon={<Add />}
                      onClick={handleProcessNewPayment}
                      sx={{ mt: 1 }}
                    >
                      Process First Payment
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                displayedPayments.map((payment: any) => {
                  return (
                    <TableRow key={payment.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant='body2' fontWeight='medium'>
                            {payment.reference}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            ID: {payment.id.slice(-12)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Avatar
                            sx={{ width: 32, height: 32, fontSize: '0.875rem' }}
                          >
                            {payment.patient.firstName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant='body2' fontWeight='medium'>
                              {payment.patient.firstName}{' '}
                              {payment.patient.lastName}
                            </Typography>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {payment.patient.patientId}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>
                          {payment.invoice?.invoiceNumber ||
                            payment.invoice?.number ||
                            'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' fontWeight='medium'>
                          {formatCurrency(payment.amount)}
                        </Typography>
                        {payment.fee && payment.fee > 0 && (
                          <Typography
                            variant='caption'
                            color='text.secondary'
                            display='block'
                          >
                            Fee: {formatCurrency(payment.fee)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getMethodIcon(payment.method)}
                          label={payment.method}
                          size='small'
                          color={getMethodColor(payment.method)}
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(payment.status)}
                          label={payment.status}
                          size='small'
                          color={getStatusColor(payment.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>
                          {payment.processedAt
                            ? formatDate(payment.processedAt)
                            : 'N/A'}
                        </Typography>
                        {payment.createdAt &&
                          payment.createdAt !== payment.processedAt && (
                            <Typography
                              variant='caption'
                              color='text.secondary'
                              display='block'
                            >
                              Created: {formatDate(payment.createdAt)}
                            </Typography>
                          )}
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>
                          {payment.processedBy || 'System'}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <IconButton
                          size='small'
                          onClick={(e) => handleActionMenuOpen(e, payment)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component='div'
          count={totalPayments}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleViewPayment}>
          <ListItemIcon>
            <Visibility fontSize='small' />
          </ListItemIcon>
          View Details
        </MenuItem>
        <MenuItem onClick={handlePrintReceipt}>
          <ListItemIcon>
            <Print fontSize='small' />
          </ListItemIcon>
          Print Receipt
        </MenuItem>
        <MenuItem onClick={handleDownloadReceipt}>
          <ListItemIcon>
            <Download fontSize='small' />
          </ListItemIcon>
          Download PDF Receipt
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleRefundPayment}>
          <ListItemIcon>
            <MoneyOff fontSize='small' />
          </ListItemIcon>
          Refund Payment
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => navigate(`/billing/${selectedPayment?.invoiceId}`)}
        >
          <ListItemIcon>
            <Receipt fontSize='small' />
          </ListItemIcon>
          View Invoice
        </MenuItem>
      </Menu>

      {/* Refund Payment Dialog */}
      <Dialog
        open={refundDialogOpen}
        onClose={handleCloseRefundDialog}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Refund Payment</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Payment Information Being Refunded */}
            <Box>
              <Typography variant='h6' gutterBottom>
                Payment Information
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 2,
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  backgroundColor: 'grey.50',
                }}
              >
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Payment Reference
                  </Typography>
                  <Typography variant='body1' sx={{ fontWeight: 'medium' }}>
                    {selectedPayment?.reference ||
                      `PAY-${selectedPayment?.id?.slice(-8) || 'Unknown'}`}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Payment Amount
                  </Typography>
                  <Typography variant='h6' color='success.main'>
                    {selectedPayment?.amount
                      ? formatCurrency(parseFloat(selectedPayment.amount))
                      : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Payment Method
                  </Typography>
                  <Typography variant='body1'>
                    {selectedPayment?.method || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Payment Date
                  </Typography>
                  <Typography variant='body1'>
                    {selectedPayment?.processedAt
                      ? formatDate(selectedPayment.processedAt)
                      : selectedPayment?.createdAt
                      ? formatDate(selectedPayment.createdAt)
                      : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Patient Name
                  </Typography>
                  <Typography variant='body1'>
                    {selectedPayment?.patient?.firstName &&
                    selectedPayment?.patient?.lastName
                      ? `${selectedPayment.patient.firstName} ${selectedPayment.patient.lastName}`
                      : selectedPayment?.invoice?.patient?.firstName &&
                        selectedPayment?.invoice?.patient?.lastName
                      ? `${selectedPayment.invoice.patient.firstName} ${selectedPayment.invoice.patient.lastName}`
                      : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Invoice Number
                  </Typography>
                  <Typography variant='body1'>
                    {selectedPayment?.invoice?.invoiceNumber ||
                      selectedPayment?.invoice?.number ||
                      'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider />

            {/* Refund Details */}
            <Box>
              <Typography variant='h6' gutterBottom>
                Refund Details
              </Typography>
            </Box>

            <FormControl fullWidth>
              <InputLabel>Refund Amount</InputLabel>
              <Select
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                label='Refund Amount'
              >
                <MenuItem value={selectedPayment?.amount || ''}>
                  Full Amount (
                  {selectedPayment?.amount
                    ? formatCurrency(parseFloat(selectedPayment.amount))
                    : 'N/A'}
                  )
                </MenuItem>
                <MenuItem value='custom'>Custom Amount</MenuItem>
              </Select>
            </FormControl>

            {refundAmount === 'custom' && (
              <TextField
                fullWidth
                label='Custom Refund Amount'
                type='number'
                value={refundCustomAmount}
                onChange={(e) => setRefundCustomAmount(e.target.value)}
                inputProps={{
                  min: 0,
                  max: selectedPayment?.amount
                    ? parseFloat(selectedPayment.amount)
                    : 0,
                  step: 0.01,
                }}
                helperText={`Maximum: ${
                  selectedPayment?.amount
                    ? formatCurrency(parseFloat(selectedPayment.amount))
                    : 'N/A'
                }`}
              />
            )}

            <FormControl fullWidth>
              <InputLabel>Refund Reason</InputLabel>
              <Select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                label='Refund Reason'
              >
                <MenuItem value='duplicate_payment'>Duplicate Payment</MenuItem>
                <MenuItem value='service_not_received'>
                  Service Not Received
                </MenuItem>
                <MenuItem value='billing_error'>Billing Error</MenuItem>
                <MenuItem value='patient_request'>Patient Request</MenuItem>
                <MenuItem value='other'>Other</MenuItem>
              </Select>
            </FormControl>

            {refundReason === 'other' && (
              <TextField
                fullWidth
                label='Custom Reason'
                multiline
                rows={3}
                value={refundReason === 'other' ? '' : refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder='Please specify the refund reason...'
              />
            )}

            <TextField
              fullWidth
              label='Additional Notes'
              multiline
              rows={3}
              value={refundNotes}
              onChange={(e) => setRefundNotes(e.target.value)}
              placeholder='Any additional information about the refund...'
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRefundDialog}>Cancel</Button>
          <Button
            variant='contained'
            color='error'
            startIcon={<MoneyOff />}
            onClick={handleProcessRefund}
          >
            Process Refund
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentsPage;
