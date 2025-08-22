import React, { useState } from 'react';
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
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Skeleton,
  Paper,
  Avatar,
  ListItemIcon,
  Stack,
} from '@mui/material';
import {
  Print,
  Download,
  Email,
  MoreVert,
  Payment,
  Edit,
  ContentCopy,
  Cancel,
  Person,
  Phone,
  AccountBalance,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import { invoiceService } from '../services/invoice.service';
import { formatDate, formatCurrency } from '../utils';
import toast from 'react-hot-toast';
import type { Invoice } from '../types';

const InvoiceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [cancelReason, setCancelReason] = useState('');

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

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: (paymentData: any) =>
      invoiceService.processPayment(id!, paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Payment processed successfully');
      setPaymentDialogOpen(false);
      resetPaymentForm();
    },
    onError: (error) => {
      console.error('Process payment error:', error);
      toast.error('Failed to process payment');
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: (email?: string) => invoiceService.sendInvoice(id!, email),
    onSuccess: () => {
      toast.success('Invoice sent successfully');
      setEmailDialogOpen(false);
      setEmailAddress('');
    },
    onError: (error) => {
      console.error('Send email error:', error);
      toast.error('Failed to send invoice');
    },
  });

  // Cancel invoice mutation
  const cancelInvoiceMutation = useMutation({
    mutationFn: (reason?: string) => invoiceService.cancelInvoice(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice cancelled successfully');
      setCancelDialogOpen(false);
      setCancelReason('');
    },
    onError: (error) => {
      console.error('Cancel invoice error:', error);
      toast.error('Failed to cancel invoice');
    },
  });

  // Event handlers
  const handleBack = () => {
    navigate('/billing');
  };

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setActionMenuAnchor(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  const handleEdit = () => {
    navigate(`/billing/${id}/edit`);
    handleActionMenuClose();
  };

  const handleDuplicate = async () => {
    try {
      const duplicatedInvoice = await invoiceService.duplicateInvoice(id!);
      toast.success('Invoice duplicated successfully');
      navigate(`/billing/${duplicatedInvoice.id}`);
    } catch (error) {
      toast.error('Failed to duplicate invoice');
    }
    handleActionMenuClose();
  };

  const handlePrint = () => {
    window.print();
    handleActionMenuClose();
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await invoiceService.generateInvoicePDF(id!);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice?.invoiceNumber || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
    handleActionMenuClose();
  };

  const handleSendEmail = () => {
    setEmailAddress(invoice?.patient?.email || '');
    setEmailDialogOpen(true);
    handleActionMenuClose();
  };

  const handleProcessPayment = () => {
    setPaymentAmount(invoice?.balance?.toString() || '');
    setPaymentDialogOpen(true);
    handleActionMenuClose();
  };

  const handleCancelInvoice = () => {
    setCancelDialogOpen(true);
    handleActionMenuClose();
  };

  const resetPaymentForm = () => {
    setPaymentAmount('');
    setPaymentMethod('CASH');
    setPaymentReference('');
    setPaymentNotes('');
  };

  const submitPayment = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    const paymentData = {
      amount: parseFloat(paymentAmount),
      method: paymentMethod,
      reference: paymentReference || undefined,
      notes: paymentNotes || undefined,
    };

    processPaymentMutation.mutate(paymentData);
  };

  const submitEmail = () => {
    sendEmailMutation.mutate(emailAddress || undefined);
  };

  const submitCancel = () => {
    cancelInvoiceMutation.mutate(cancelReason || undefined);
  };

  const getStatusColor = (
    status: string
  ): 'success' | 'warning' | 'error' | 'default' => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      case 'cancelled':
        return 'default';
      case 'partial':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box>
        <PageHeader
          title='Invoice Details'
          subtitle='Loading invoice information...'
          breadcrumbs={<Breadcrumb />}
          showActions={false}
        />
        <Box p={2}>
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              flexDirection: { xs: 'column', md: 'row' },
            }}
          >
            <Box sx={{ flex: 2 }}>
              <Card sx={{ p: 3 }}>
                <Skeleton
                  variant='text'
                  width='60%'
                  height={40}
                  sx={{ mb: 2 }}
                />
                <Skeleton
                  variant='text'
                  width='40%'
                  height={24}
                  sx={{ mb: 3 }}
                />
                <Skeleton variant='rectangular' height={200} sx={{ mb: 2 }} />
                <Skeleton variant='rectangular' height={300} />
              </Card>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Card sx={{ p: 3 }}>
                <Skeleton
                  variant='text'
                  width='80%'
                  height={32}
                  sx={{ mb: 2 }}
                />
                <Skeleton variant='rectangular' height={150} />
              </Card>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  // Error state
  if (isError || !invoice) {
    return (
      <Box>
        <PageHeader
          title='Invoice Details'
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
    <Box>
      {/* Page Header */}
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber || invoice.number}`}
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
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        {/* Invoice Details */}
        <Box sx={{ flex: 2 }}>
          <Card>
            {/* Invoice Header */}
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='flex-start'
                mb={2}
              >
                <Box>
                  <Typography variant='h4' gutterBottom>
                    Invoice {invoice.invoiceNumber || invoice.number}
                  </Typography>
                  <Chip
                    label={invoice.status}
                    color={getStatusColor(invoice.status)}
                    size='medium'
                    sx={{ mb: 1 }}
                  />
                </Box>
                <Box display='flex' gap={1}>
                  <Button
                    variant='outlined'
                    startIcon={<Print />}
                    onClick={handlePrint}
                    size='small'
                  >
                    Print
                  </Button>
                  <Button
                    variant='outlined'
                    startIcon={<Download />}
                    onClick={handleDownloadPDF}
                    size='small'
                  >
                    PDF
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
                    Invoice Details
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Invoice Number:</strong>{' '}
                    {invoice.invoiceNumber || invoice.number}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Issue Date:</strong>{' '}
                    {formatDate(invoice.issuedDate || invoice.createdAt)}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Due Date:</strong>{' '}
                    {invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}
                  </Typography>
                  {invoice.paidAt && (
                    <Typography variant='body2'>
                      <strong>Paid Date:</strong> {formatDate(invoice.paidAt)}
                    </Typography>
                  )}
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
                    <Typography variant='body2'>{patientName}</Typography>
                  </Box>
                  {invoice.patient?.phoneNumber && (
                    <Box display='flex' alignItems='center' gap={1} mb={1}>
                      <Phone fontSize='small' />
                      <Typography variant='body2'>
                        {invoice.patient.phoneNumber}
                      </Typography>
                    </Box>
                  )}
                  {invoice.patient?.email && (
                    <Box display='flex' alignItems='center' gap={1}>
                      <Email fontSize='small' />
                      <Typography variant='body2'>
                        {invoice.patient.email}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Invoice Items */}
            <Box sx={{ p: 3 }}>
              <Typography variant='h6' gutterBottom>
                Invoice Items
              </Typography>
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Service</TableCell>
                      <TableCell align='center'>Quantity</TableCell>
                      <TableCell align='right'>Unit Price</TableCell>
                      <TableCell align='right'>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.charges && invoice.charges.length > 0 ? (
                      invoice.charges.map((charge: any) => (
                        <TableRow key={charge.id}>
                          <TableCell>
                            <Box>
                              <Typography variant='body2' fontWeight={500}>
                                {charge.service?.name || 'Unknown Service'}
                              </Typography>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                {charge.description}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align='center'>
                            {charge.quantity}
                          </TableCell>
                          <TableCell align='right'>
                            {formatCurrency(Number(charge.unitPrice))}
                          </TableCell>
                          <TableCell align='right'>
                            {formatCurrency(Number(charge.totalPrice))}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align='center'>
                          <Typography variant='body2' color='text.secondary'>
                            No items found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Invoice Totals */}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ minWidth: 300 }}>
                  <Box display='flex' justifyContent='space-between' mb={1}>
                    <Typography variant='body2'>Subtotal:</Typography>
                    <Typography variant='body2'>
                      {formatCurrency(Number(invoice.totalAmount) || 0)}
                    </Typography>
                  </Box>
                  {invoice.taxAmount && (
                    <Box display='flex' justifyContent='space-between' mb={1}>
                      <Typography variant='body2'>Tax:</Typography>
                      <Typography variant='body2'>
                        {formatCurrency(Number(invoice.taxAmount))}
                      </Typography>
                    </Box>
                  )}
                  {invoice.discountAmount && (
                    <Box display='flex' justifyContent='space-between' mb={1}>
                      <Typography variant='body2'>Discount:</Typography>
                      <Typography variant='body2' color='success.main'>
                        -{formatCurrency(Number(invoice.discountAmount))}
                      </Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box display='flex' justifyContent='space-between' mb={1}>
                    <Typography variant='h6'>Total:</Typography>
                    <Typography variant='h6'>
                      {formatCurrency(Number(invoice.totalAmount) || 0)}
                    </Typography>
                  </Box>
                  <Box display='flex' justifyContent='space-between' mb={1}>
                    <Typography variant='body2' color='success.main'>
                      Paid:
                    </Typography>
                    <Typography variant='body2' color='success.main'>
                      {formatCurrency(Number(invoice.paidAmount) || 0)}
                    </Typography>
                  </Box>
                  <Box display='flex' justifyContent='space-between'>
                    <Typography
                      variant='body1'
                      fontWeight={500}
                      color='error.main'
                    >
                      Balance:
                    </Typography>
                    <Typography
                      variant='body1'
                      fontWeight={500}
                      color='error.main'
                    >
                      {formatCurrency(Number(invoice.balance) || 0)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Notes */}
              {invoice.notes && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant='subtitle2' gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {invoice.notes}
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Box>

        {/* Sidebar */}
        <Box sx={{ flex: 1 }}>
          {/* Payment Summary */}
          <Card sx={{ mb: 3 }}>
            <Box sx={{ p: 3 }}>
              <Typography variant='h6' gutterBottom>
                Payment Summary
              </Typography>
              <Box display='flex' alignItems='center' gap={2} mb={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <AccountBalance />
                </Avatar>
                <Box>
                  <Typography variant='h5'>
                    {formatCurrency(Number(invoice.balance) || 0)}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Outstanding Balance
                  </Typography>
                </Box>
              </Box>

              {Number(invoice.balance) > 0 &&
                invoice.status !== 'CANCELLED' && (
                  <Button
                    variant='contained'
                    fullWidth
                    startIcon={<Payment />}
                    onClick={handleProcessPayment}
                    sx={{ mb: 2 }}
                  >
                    Process Payment
                  </Button>
                )}

              <Button
                variant='outlined'
                fullWidth
                startIcon={<Email />}
                onClick={handleSendEmail}
              >
                Send Invoice
              </Button>
            </Box>
          </Card>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <Card>
              <Box sx={{ p: 3 }}>
                <Typography variant='h6' gutterBottom>
                  Payment History
                </Typography>
                {invoice.payments.map((payment: any) => (
                  <Box
                    key={payment.id}
                    sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}
                  >
                    <Box
                      display='flex'
                      justifyContent='space-between'
                      alignItems='center'
                      mb={1}
                    >
                      <Typography variant='body2' fontWeight={500}>
                        {formatCurrency(Number(payment.amount))}
                      </Typography>
                      <Chip
                        label={payment.status}
                        size='small'
                        color={
                          payment.status === 'COMPLETED' ? 'success' : 'default'
                        }
                      />
                    </Box>
                    <Typography variant='caption' color='text.secondary'>
                      {payment.method} • {formatDate(payment.processedAt)}
                    </Typography>
                    {payment.reference && (
                      <Typography
                        variant='caption'
                        display='block'
                        color='text.secondary'
                      >
                        Ref: {payment.reference}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Card>
          )}
        </Box>
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <Edit fontSize='small' />
          </ListItemIcon>
          Edit Invoice
        </MenuItem>
        <MenuItem onClick={handleDuplicate}>
          <ListItemIcon>
            <ContentCopy fontSize='small' />
          </ListItemIcon>
          Duplicate Invoice
        </MenuItem>
        <MenuItem onClick={handleSendEmail}>
          <ListItemIcon>
            <Email fontSize='small' />
          </ListItemIcon>
          Send via Email
        </MenuItem>
        {invoice.status !== 'CANCELLED' && Number(invoice.balance) > 0 && (
          <MenuItem onClick={handleProcessPayment}>
            <ListItemIcon>
              <Payment fontSize='small' />
            </ListItemIcon>
            Process Payment
          </MenuItem>
        )}
        {invoice.status !== 'CANCELLED' && (
          <MenuItem onClick={handleCancelInvoice} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <Cancel fontSize='small' />
            </ListItemIcon>
            Cancel Invoice
          </MenuItem>
        )}
      </Menu>

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
            <TextField
              label='Payment Amount'
              type='number'
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              fullWidth
              required
              inputProps={{ min: 0, step: 0.01 }}
              helperText={`Outstanding balance: ${formatCurrency(
                Number(invoice.balance) || 0
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
                <MenuItem value='PAYSTACK_TERMINAL'>Paystack Terminal</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label='Payment Reference'
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              fullWidth
              placeholder='Optional reference number'
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
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={submitPayment}
            variant='contained'
            disabled={processPaymentMutation.isPending}
          >
            {processPaymentMutation.isPending
              ? 'Processing...'
              : 'Process Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Dialog */}
      <Dialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Send Invoice via Email</DialogTitle>
        <DialogContent>
          <TextField
            label='Email Address'
            type='email'
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            fullWidth
            required
            sx={{ mt: 2 }}
            helperText='Leave empty to send to patient default email'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={submitEmail}
            variant='contained'
            disabled={sendEmailMutation.isPending}
          >
            {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Cancel Invoice</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Are you sure you want to cancel this invoice? This action cannot be
            undone.
          </Typography>
          <TextField
            label='Cancellation Reason'
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder='Optional reason for cancellation'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            Keep Invoice
          </Button>
          <Button
            onClick={submitCancel}
            variant='contained'
            color='error'
            disabled={cancelInvoiceMutation.isPending}
          >
            {cancelInvoiceMutation.isPending
              ? 'Cancelling...'
              : 'Cancel Invoice'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceDetailsPage;
