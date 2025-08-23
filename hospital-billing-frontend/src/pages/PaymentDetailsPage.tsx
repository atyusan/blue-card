import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  Divider,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
  Skeleton,
  TextField,
  Avatar,
} from '@mui/material';
import {
  Print,
  MoreVert,
  ContentCopy,
  Cancel,
  Person,
  MoneyOff,
  Visibility,
  Download,
  Receipt,
  ArrowBack,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import { paymentService } from '../services/payment.service';
import { formatDate, formatCurrency } from '../utils';

import toast from 'react-hot-toast';

const PaymentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundCustomAmount, setRefundCustomAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundNotes, setRefundNotes] = useState('');

  // Fetch payment details
  const {
    data: payment,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => paymentService.getPayment(id!),
    enabled: !!id,
    retry: 1,
  });

  // Mutations
  const cancelPaymentMutation = useMutation({
    mutationFn: (reason: string) => paymentService.cancelPayment(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment cancelled successfully');
    },
    onError: (error) => {
      console.error('Cancel payment error:', error);
      toast.error('Failed to cancel payment');
    },
  });

  const processRefundMutation = useMutation({
    mutationFn: (refundData: any) => paymentService.createRefund(refundData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Refund processed successfully');
      setRefundDialogOpen(false);
      setRefundAmount('');
      setRefundCustomAmount('');
      setRefundReason('');
      setRefundNotes('');
    },
    onError: (error) => {
      console.error('Process refund error:', error);
      toast.error('Failed to process refund');
    },
  });

  // Event handlers
  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setActionMenuAnchor(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  const handlePrintReceipt = async () => {
    try {
      toast.loading('Generating payment receipt for printing...');
      const pdfBlob = await paymentService.generatePaymentReceiptPDF(id!);

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
        link.download = `payment-receipt-${payment?.reference || id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Payment receipt PDF downloaded for printing');
      }
    } catch (error) {
      console.error('Print payment receipt error:', error);
      toast.error('Failed to generate payment receipt for printing');
    }
    handleActionMenuClose();
  };

  const handleDownloadReceipt = async () => {
    try {
      toast.loading('Generating payment receipt...');
      const pdfBlob = await paymentService.generatePaymentReceiptPDF(id!);

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-receipt-${payment?.reference || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Payment receipt downloaded successfully!');
    } catch (error) {
      console.error('Error downloading payment receipt:', error);
      toast.error('Failed to download payment receipt. Please try again.');
    }
    handleActionMenuClose();
  };

  const handleViewPatient = () => {
    if (payment?.patientId) {
      navigate(`/patients/${payment.patientId}`);
    } else {
      toast.error('Patient information not available');
    }
    handleActionMenuClose();
  };

  const handleViewInvoice = () => {
    if (payment?.invoiceId) {
      navigate(`/billing/${payment.invoiceId}`);
    } else {
      toast.error('Invoice information not available');
    }
    handleActionMenuClose();
  };

  const handleCopyPaymentId = () => {
    navigator.clipboard.writeText(id!);
    toast.success('Payment ID copied to clipboard');
    handleActionMenuClose();
  };

  const handleCancelPayment = () => {
    setCancelDialogOpen(true);
    setCancelReason('');
    handleActionMenuClose();
  };

  const handleProcessRefund = () => {
    setRefundDialogOpen(true);
    handleActionMenuClose();
  };

  const handleConfirmRefund = async () => {
    if (!refundAmount || !refundReason) {
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

    const maxAmount = parseFloat(payment?.amount?.toString() || '0');
    if (actualRefundAmount <= 0 || actualRefundAmount > maxAmount) {
      toast.error('Invalid refund amount');
      return;
    }

    try {
      const refundData = {
        paymentId: id!,
        amount: actualRefundAmount,
        reason: refundReason,
        notes: refundNotes,
      };

      await processRefundMutation.mutateAsync(refundData);
    } catch (error) {
      // Error is handled by the mutation
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
        return <Receipt fontSize='small' />;
      case 'PENDING':
        return <Visibility fontSize='small' />;
      case 'FAILED':
        return <Cancel fontSize='small' />;
      case 'CANCELLED':
        return <Cancel fontSize='small' />;
      case 'REFUND_REQUESTED':
        return <MoneyOff fontSize='small' />;
      case 'REFUNDED':
        return <Receipt fontSize='small' />;
      default:
        return <Visibility fontSize='small' />;
    }
  };

  if (isLoading) {
    return (
      <Box>
        <PageHeader
          title='Payment Details'
          subtitle='Loading payment information...'
          breadcrumbs={<Breadcrumb />}
        />
        <Card sx={{ p: 3, mt: 3 }}>
          <Stack spacing={2}>
            <Skeleton variant='text' width='60%' height={40} />
            <Skeleton variant='text' width='40%' height={24} />
            <Skeleton variant='rectangular' height={200} />
          </Stack>
        </Card>
      </Box>
    );
  }

  if (isError || !payment) {
    return (
      <Box>
        <PageHeader
          title='Payment Details'
          subtitle='Error loading payment'
          breadcrumbs={<Breadcrumb />}
        />
        <Card sx={{ p: 3, mt: 3 }}>
          <Alert severity='error'>
            Failed to load payment details. Please try again.
            <Button
              variant='outlined'
              size='small'
              onClick={() => refetch()}
              sx={{ ml: 2 }}
            >
              Retry
            </Button>
          </Alert>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title='Payment Details'
        subtitle={`Payment ${payment.reference || payment.id}`}
        breadcrumbs={<Breadcrumb />}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant='outlined'
              startIcon={<ArrowBack />}
              onClick={() => navigate('/payments')}
            >
              Back to Payments
            </Button>
            <IconButton onClick={handleActionMenuOpen}>
              <MoreVert />
            </IconButton>
          </Box>
        }
      />

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
        <MenuItem onClick={handleViewPatient}>
          <ListItemIcon>
            <Person fontSize='small' />
          </ListItemIcon>
          View Patient
        </MenuItem>
        <MenuItem onClick={handleViewInvoice}>
          <ListItemIcon>
            <Receipt fontSize='small' />
          </ListItemIcon>
          View Invoice
        </MenuItem>
        <MenuItem onClick={handleCopyPaymentId}>
          <ListItemIcon>
            <ContentCopy fontSize='small' />
          </ListItemIcon>
          Copy Payment ID
        </MenuItem>
        <Divider />
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
          Download Receipt
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={handleProcessRefund}
          disabled={payment.status === 'CANCELLED'}
        >
          <ListItemIcon>
            <MoneyOff fontSize='small' />
          </ListItemIcon>
          Process Refund
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={handleCancelPayment}
          disabled={payment.status === 'CANCELLED'}
        >
          <ListItemIcon>
            <Cancel fontSize='small' />
          </ListItemIcon>
          Cancel Payment
        </MenuItem>
      </Menu>

      {/* Main Content - Two Column Layout like Invoice Details */}
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        {/* Payment Details - Left Column */}
        <Box sx={{ flex: 2 }}>
          <Card>
            {/* Payment Header */}
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='flex-start'
                mb={2}
              >
                <Box>
                  <Typography variant='h4' gutterBottom>
                    Payment {payment.reference || payment.id?.slice(-8)}
                  </Typography>
                  <Chip
                    icon={getStatusIcon(payment.status)}
                    label={payment.status}
                    color={getStatusColor(payment.status)}
                    size='medium'
                    sx={{ mb: 1 }}
                  />
                </Box>
                <Box display='flex' gap={1}>
                  <Button
                    variant='outlined'
                    startIcon={<Print />}
                    onClick={handlePrintReceipt}
                    size='small'
                  >
                    Print Receipt
                  </Button>
                  <IconButton onClick={handleActionMenuOpen} size='small'>
                    <MoreVert />
                  </IconButton>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  gap: 3,
                  flexDirection: { xs: 'column', sm: 'row' },
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Payment Details
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Reference:</strong> {payment.reference || 'N/A'}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Amount:</strong> {formatCurrency(payment.amount)}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Method:</strong> {payment.method}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Date:</strong>{' '}
                    {payment.processedAt
                      ? formatDate(payment.processedAt)
                      : formatDate(payment.createdAt)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Patient Information
                  </Typography>
                  <Box display='flex' alignItems='center' gap={1} mb={1}>
                    <Person fontSize='small' />
                    <Typography variant='body2'>
                      {payment.patient?.firstName && payment.patient?.lastName
                        ? `${payment.patient.firstName} ${payment.patient.lastName}`
                        : 'N/A'}
                    </Typography>
                  </Box>
                  {payment.patient?.phone && (
                    <Typography variant='body2'>
                      <strong>Phone:</strong> {payment.patient.phone}
                    </Typography>
                  )}
                  {payment.patient?.email && (
                    <Typography variant='body2'>
                      <strong>Email:</strong> {payment.patient.email}
                    </Typography>
                  )}
                  <Typography variant='body2'>
                    <strong>Patient ID:</strong>{' '}
                    {payment.patient?.patientId || payment.patientId || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Payment Transaction Details */}
            <Box sx={{ p: 3 }}>
              <Typography variant='h6' gutterBottom>
                Transaction Details
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 3,
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Processing Information
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Processed By:</strong>{' '}
                    {payment.processedBy || 'System'}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Processed At:</strong>{' '}
                    {payment.processedAt
                      ? formatDate(payment.processedAt)
                      : 'N/A'}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Created At:</strong>{' '}
                    {payment.createdAt ? formatDate(payment.createdAt) : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Related Information
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Invoice:</strong>{' '}
                    {payment.invoice?.invoiceNumber ||
                      payment.invoiceId ||
                      'N/A'}
                  </Typography>
                  {payment.invoice?.totalAmount && (
                    <Typography variant='body2'>
                      <strong>Invoice Amount:</strong>{' '}
                      {formatCurrency(payment.invoice.totalAmount)}
                    </Typography>
                  )}
                  {payment.invoice?.dueDate && (
                    <Typography variant='body2'>
                      <strong>Due Date:</strong>{' '}
                      {formatDate(payment.invoice.dueDate)}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Notes */}
              {payment.notes && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant='subtitle2' gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {payment.notes}
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Box>

        {/* Sidebar - Right Column */}
        <Box sx={{ flex: 1 }}>
          {/* Payment Summary */}
          <Card sx={{ mb: 3 }}>
            <Box sx={{ p: 3 }}>
              <Typography variant='h6' gutterBottom>
                Payment Summary
              </Typography>
              <Box display='flex' alignItems='center' gap={2} mb={2}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <Receipt />
                </Avatar>
                <Box>
                  <Typography variant='h4' fontWeight='bold'>
                    {formatCurrency(payment.amount)}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Payment Amount
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={2}>
                <Button
                  variant='contained'
                  fullWidth
                  startIcon={<Print />}
                  onClick={handlePrintReceipt}
                >
                  Print Receipt
                </Button>

                <Button
                  variant='outlined'
                  fullWidth
                  startIcon={<Download />}
                  onClick={handleDownloadReceipt}
                >
                  Download Receipt
                </Button>

                {payment.status === 'COMPLETED' && (
                  <Button
                    variant='outlined'
                    fullWidth
                    startIcon={<MoneyOff />}
                    onClick={handleProcessRefund}
                    color='warning'
                  >
                    Process Refund
                  </Button>
                )}
              </Stack>
            </Box>
          </Card>

          {/* Quick Navigation */}
          <Card>
            <Box sx={{ p: 3 }}>
              <Typography variant='h6' gutterBottom>
                Quick Actions
              </Typography>
              <Stack spacing={2}>
                <Button
                  variant='outlined'
                  fullWidth
                  startIcon={<Person />}
                  onClick={handleViewPatient}
                >
                  View Patient
                </Button>

                <Button
                  variant='outlined'
                  fullWidth
                  startIcon={<Receipt />}
                  onClick={handleViewInvoice}
                >
                  View Invoice
                </Button>

                <Button
                  variant='outlined'
                  fullWidth
                  startIcon={<ContentCopy />}
                  onClick={handleCopyPaymentId}
                >
                  Copy Payment ID
                </Button>
              </Stack>
            </Box>
          </Card>
        </Box>
      </Box>

      {/* Cancel Payment Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Cancel Payment</DialogTitle>
        <DialogContent>
          <Typography variant='body2' sx={{ mt: 1, mb: 2 }}>
            Please provide a reason for cancelling this payment.
          </Typography>
          <TextField
            autoFocus
            multiline
            rows={3}
            fullWidth
            label='Cancellation Reason'
            placeholder='Enter the reason for cancelling this payment...'
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            error={!cancelReason.trim()}
            helperText={
              !cancelReason.trim() ? 'Cancellation reason is required' : ''
            }
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Cancel</Button>
          <Button
            variant='contained'
            color='error'
            onClick={() => {
              if (!cancelReason.trim()) {
                toast.error('Please provide a cancellation reason');
                return;
              }
              cancelPaymentMutation.mutate(cancelReason.trim());
              setCancelDialogOpen(false);
              setCancelReason('');
            }}
            disabled={cancelPaymentMutation.isPending || !cancelReason.trim()}
          >
            {cancelPaymentMutation.isPending
              ? 'Cancelling...'
              : 'Cancel Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Process Refund Dialog */}
      <Dialog
        open={refundDialogOpen}
        onClose={() => setRefundDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Process Refund</DialogTitle>
        <DialogContent>
          <Typography variant='body2' sx={{ mt: 1, mb: 2 }}>
            Please provide the refund details below.
          </Typography>
          {/* Refund form fields would go here - simplified for now */}
          <Typography variant='body2' color='text.secondary'>
            Refund functionality will be implemented here
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
          <Button
            variant='contained'
            onClick={handleConfirmRefund}
            disabled={processRefundMutation.isPending}
          >
            {processRefundMutation.isPending
              ? 'Processing...'
              : 'Process Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentDetailsPage;
