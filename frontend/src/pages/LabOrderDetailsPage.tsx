import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  Typography,
  Chip,
  Button,
  Alert,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Stack,
  Divider,
  useTheme,
  alpha,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack,
  Science,
  Person,
  CalendarToday,
  LocalHospital,
  Payment,
  CheckCircle,
  Warning,
  Assignment,
  Receipt,
  Description,
  OpenInNew,
} from '@mui/icons-material';
import { formatDate, formatCurrency } from '@/utils';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import { labOrderService } from '../services/lab-order.service';
import {
  paymentService,
  type ProcessPaymentData,
} from '../services/payment.service';
import { useToast } from '@/context/ToastContext';
import { usePermissions } from '@/hooks/usePermissions';

const LabOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { canViewLabResults } = usePermissions();

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const {
    data: labOrder,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['lab-order', id],
    queryFn: () => labOrderService.getLabOrderById(id!),
    enabled: !!id,
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: (paymentData: ProcessPaymentData) =>
      paymentService.processPayment(paymentData),
    onSuccess: () => {
      showToast('Payment processed successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['lab-order', id] });
      queryClient.invalidateQueries({
        queryKey: ['lab-orders'],
        refetchType: 'all',
      });
      setPaymentDialogOpen(false);
      resetPaymentForm();
    },
    onError: (error: Error) => {
      showToast(error.message || 'Failed to process payment', 'error');
    },
  });

  const resetPaymentForm = () => {
    setPaymentAmount('');
    setPaymentMethod('CASH');
    setPaymentReference('');
    setPaymentNotes('');
  };

  const handleOpenPaymentDialog = () => {
    const balance =
      Number(labOrder?.totalAmount || 0) - Number(labOrder?.paidAmount || 0);
    setPaymentAmount(balance.toString());
    setPaymentDialogOpen(true);
  };

  const handleSubmitPayment = () => {
    if (!labOrder) {
      showToast('No lab order found', 'error');
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }

    if (!labOrder.invoiceId) {
      showToast('No invoice found for this order', 'error');
      return;
    }

    const paymentData: ProcessPaymentData = {
      invoiceId: labOrder.invoiceId,
      patientId: labOrder.patientId,
      amount: parseFloat(paymentAmount),
      paymentMethod: paymentMethod,
      referenceNumber: paymentReference || undefined,
      notes: paymentNotes || undefined,
    };

    processPaymentMutation.mutate(paymentData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTestStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box>
        <PageHeader title='Lab Order Details' breadcrumbs={<Breadcrumb />} />
        <Stack spacing={3}>
          <Skeleton
            variant='rectangular'
            height={200}
            sx={{ borderRadius: 3 }}
          />
          <Skeleton
            variant='rectangular'
            height={300}
            sx={{ borderRadius: 3 }}
          />
        </Stack>
      </Box>
    );
  }

  if (error || !labOrder) {
    return (
      <Box>
        <PageHeader title='Lab Order Details' breadcrumbs={<Breadcrumb />} />
        <Alert severity='error' sx={{ borderRadius: 2 }}>
          Failed to load lab order details. Please try again.
        </Alert>
      </Box>
    );
  }

  const balance = Number(labOrder.totalAmount) - Number(labOrder.paidAmount);

  return (
    <Box>
      <PageHeader
        title='Lab Order Details'
        breadcrumbs={<Breadcrumb />}
        actions={
          <Stack direction='row' spacing={2}>
            {labOrder.invoice && (
              <Button
                variant='outlined'
                color='info'
                startIcon={<Description />}
                endIcon={<OpenInNew />}
                onClick={() =>
                  navigate(`/billing/invoices/${labOrder.invoice.id}`)
                }
                sx={{ borderRadius: 2 }}
              >
                View Invoice
              </Button>
            )}
            {!labOrder.isPaid && balance > 0 && (
              <Button
                variant='contained'
                color='primary'
                startIcon={<Payment />}
                onClick={handleOpenPaymentDialog}
                sx={{ borderRadius: 2 }}
              >
                Record Payment
              </Button>
            )}
            <Button
              variant='outlined'
              startIcon={<ArrowBack />}
              onClick={() => navigate('/lab/orders')}
              sx={{ borderRadius: 2 }}
            >
              Back to Orders
            </Button>
          </Stack>
        }
      />

      <Stack spacing={3}>
        {/* Header Card */}
        <Card
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.05
            )} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          }}
        >
          <Box p={3}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 2,
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Avatar
                  sx={{
                    bgcolor: labOrder.isPaid ? 'success.main' : 'warning.main',
                    width: 64,
                    height: 64,
                  }}
                >
                  <Science sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant='h5' fontWeight={700} gutterBottom>
                    Lab Order #{labOrder.id.slice(-8).toUpperCase()}
                  </Typography>
                  <Typography variant='body1' color='text.secondary'>
                    {labOrder.tests?.length || 0} test
                    {labOrder.tests?.length !== 1 ? 's' : ''} ordered
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Chip
                  label={labOrder.status}
                  size='small'
                  color={getStatusColor(labOrder.status) as any}
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  label={labOrder.isPaid ? 'PAID' : 'UNPAID'}
                  size='small'
                  color={labOrder.isPaid ? 'success' : 'error'}
                  icon={labOrder.isPaid ? <CheckCircle /> : <Warning />}
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Box>

            {/* Financial Summary */}
            <Card
              sx={{
                mt: 2,
                p: 2,
                bgcolor: alpha(theme.palette.info.main, 0.05),
                border: '1px solid',
                borderColor: alpha(theme.palette.info.main, 0.2),
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 2,
                }}
              >
                <Box>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    fontWeight={600}
                  >
                    Total Amount
                  </Typography>
                  <Typography variant='h6' fontWeight={700} color='primary'>
                    {formatCurrency(Number(labOrder.totalAmount))}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    fontWeight={600}
                  >
                    Paid Amount
                  </Typography>
                  <Typography
                    variant='h6'
                    fontWeight={700}
                    color='success.main'
                  >
                    {formatCurrency(Number(labOrder.paidAmount))}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    fontWeight={600}
                  >
                    Balance
                  </Typography>
                  <Typography
                    variant='h6'
                    fontWeight={700}
                    color={balance > 0 ? 'error.main' : 'success.main'}
                  >
                    {formatCurrency(balance)}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Box>
        </Card>

        {/* Invoice Information */}
        {labOrder.invoice && (
          <Card
            sx={{
              borderRadius: 3,
              border: '2px solid',
              borderColor:
                labOrder.invoice.status === 'PAID'
                  ? 'success.main'
                  : 'warning.main',
              background: `linear-gradient(135deg, ${alpha(
                labOrder.invoice.status === 'PAID'
                  ? theme.palette.success.main
                  : theme.palette.warning.main,
                0.08
              )} 0%, ${alpha(
                labOrder.invoice.status === 'PAID'
                  ? theme.palette.success.main
                  : theme.palette.warning.main,
                0.03
              )} 100%)`,
            }}
          >
            <Box p={3}>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor:
                        labOrder.invoice.status === 'PAID'
                          ? 'success.main'
                          : 'warning.main',
                      width: 48,
                      height: 48,
                    }}
                  >
                    <Receipt />
                  </Avatar>
                  <Box>
                    <Typography variant='h6' fontWeight={700}>
                      Invoice #{labOrder.invoice.invoiceNumber}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Issued: {formatDate(labOrder.invoice.issuedDate)}
                    </Typography>
                  </Box>
                </Box>
                <Box textAlign='right'>
                  <Chip
                    label={labOrder.invoice.status}
                    color={
                      labOrder.invoice.status === 'PAID' ? 'success' : 'warning'
                    }
                    icon={
                      labOrder.invoice.status === 'PAID' ? (
                        <CheckCircle />
                      ) : (
                        <Warning />
                      )
                    }
                    sx={{ fontWeight: 600, mb: 1 }}
                  />
                  {labOrder.invoice.dueDate &&
                    labOrder.invoice.status !== 'PAID' && (
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        display='block'
                      >
                        Due: {formatDate(labOrder.invoice.dueDate)}
                      </Typography>
                    )}
                </Box>
              </Box>
              {labOrder.invoice.status !== 'PAID' && (
                <Alert severity='warning' sx={{ borderRadius: 2 }}>
                  <Typography variant='body2' fontWeight={600}>
                    Payment Required
                  </Typography>
                  <Typography variant='body2'>
                    This lab order requires payment validation. Please settle
                    the invoice to activate the order.
                  </Typography>
                </Alert>
              )}
            </Box>
          </Card>
        )}

        {/* Patient & Provider Information */}
        <Card
          sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
        >
          <Box p={3}>
            <Typography variant='h6' fontWeight={600} gutterBottom>
              Order Information
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 3,
              }}
            >
              {/* Patient */}
              <Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <Person fontSize='small' color='action' />
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    fontWeight={600}
                  >
                    Patient
                  </Typography>
                </Box>
                <Typography variant='body1' fontWeight={600}>
                  {labOrder.patient?.firstName} {labOrder.patient?.lastName}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  ID: {labOrder.patient?.patientId}
                </Typography>
              </Box>

              {/* Doctor */}
              {labOrder.doctor && (
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <LocalHospital fontSize='small' color='action' />
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      fontWeight={600}
                    >
                      Ordered By
                    </Typography>
                  </Box>
                  <Typography variant='body1' fontWeight={600}>
                    Dr. {labOrder.doctor.user?.firstName}{' '}
                    {labOrder.doctor.user?.lastName}
                  </Typography>
                </Box>
              )}

              {/* Order Date */}
              <Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <CalendarToday fontSize='small' color='action' />
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    fontWeight={600}
                  >
                    Order Date
                  </Typography>
                </Box>
                <Typography variant='body1'>
                  {formatDate(labOrder.orderDate)}
                </Typography>
              </Box>
            </Box>

            {labOrder.notes && (
              <Box mt={2}>
                <Alert severity='info' sx={{ borderRadius: 2 }}>
                  <Typography variant='body2'>{labOrder.notes}</Typography>
                </Alert>
              </Box>
            )}
          </Box>
        </Card>

        {/* Test Results Summary */}
        {canViewLabResults() && labOrder.tests && labOrder.tests.length > 0 && (
          <Card
            sx={{
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.info.main,
                0.08
              )} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            }}
          >
            <Box p={3}>
              <Typography variant='h6' fontWeight={600} gutterBottom>
                Test Results Overview
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 2,
                  mt: 2,
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant='caption' color='text.secondary'>
                    Total Tests
                  </Typography>
                  <Typography variant='h4' fontWeight={700} color='primary'>
                    {labOrder.tests.length}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant='caption' color='text.secondary'>
                    Completed
                  </Typography>
                  <Typography
                    variant='h4'
                    fontWeight={700}
                    color='success.main'
                  >
                    {
                      labOrder.tests.filter(
                        (t: any) => t.status === 'COMPLETED'
                      ).length
                    }
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant='caption' color='text.secondary'>
                    In Progress
                  </Typography>
                  <Typography
                    variant='h4'
                    fontWeight={700}
                    color='warning.main'
                  >
                    {
                      labOrder.tests.filter(
                        (t: any) =>
                          t.status === 'IN_PROGRESS' || t.status === 'CLAIMED'
                      ).length
                    }
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant='caption' color='text.secondary'>
                    Critical Results
                  </Typography>
                  <Typography variant='h4' fontWeight={700} color='error.main'>
                    {labOrder.tests.filter((t: any) => t.isCritical).length}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Card>
        )}

        {/* Lab Tests */}
        {labOrder.tests && labOrder.tests.length > 0 && (
          <Card
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box p={3}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}
              >
                <Assignment color='primary' />
                <Typography variant='h6' fontWeight={600}>
                  Lab Tests ({labOrder.tests.length})
                </Typography>
              </Box>

              {!canViewLabResults() && (
                <Alert severity='warning' sx={{ mb: 3, borderRadius: 2 }}>
                  <Typography variant='body2'>
                    <strong>Limited Access:</strong> You don't have permission
                    to view detailed test results. Contact your administrator if
                    you need access.
                  </Typography>
                </Alert>
              )}
              <TableContainer
                component={Paper}
                variant='outlined'
                sx={{ borderRadius: 2 }}
              >
                <Table>
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
                          Status
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='subtitle2' fontWeight={700}>
                          Result
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='subtitle2' fontWeight={700}>
                          Reference Range
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='subtitle2' fontWeight={700}>
                          Price
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {labOrder.tests.map((test: any, index: number) => (
                      <TableRow
                        key={test.id || index}
                        sx={{
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.02),
                          },
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
                            <Box>
                              <Typography variant='body2' fontWeight={600}>
                                {test.service?.name || 'Unknown Test'}
                              </Typography>
                              {test.service?.description && (
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  {test.service.description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={test.status}
                            size='small'
                            color={getTestStatusColor(test.status) as any}
                            variant='outlined'
                          />
                        </TableCell>
                        <TableCell>
                          {canViewLabResults() ? (
                            test.status === 'COMPLETED' ? (
                              <Box>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                  }}
                                >
                                  <Typography variant='body2' fontWeight={600}>
                                    {test.resultValue || test.result || 'N/A'}
                                    {test.resultUnit && ` ${test.resultUnit}`}
                                  </Typography>
                                  {test.isCritical && (
                                    <Chip
                                      label='CRITICAL'
                                      size='small'
                                      color='error'
                                      sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                  )}
                                </Box>
                                {test.labTechnician && (
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                    display='block'
                                    sx={{ mt: 0.5 }}
                                  >
                                    By: {test.labTechnician.user.firstName}{' '}
                                    {test.labTechnician.user.lastName}
                                  </Typography>
                                )}
                                {test.completedAt && (
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                    display='block'
                                  >
                                    {formatDate(test.completedAt)}
                                  </Typography>
                                )}
                                {test.notes && (
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                    display='block'
                                    sx={{ mt: 0.5, fontStyle: 'italic' }}
                                  >
                                    Note: {test.notes}
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Box>
                                <Typography
                                  variant='body2'
                                  color='text.secondary'
                                >
                                  {test.status === 'IN_PROGRESS'
                                    ? 'Processing...'
                                    : test.status === 'CLAIMED'
                                    ? 'Claimed'
                                    : 'Pending'}
                                </Typography>
                                {test.labTechnician && (
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                    display='block'
                                  >
                                    Assigned:{' '}
                                    {test.labTechnician.user.firstName}{' '}
                                    {test.labTechnician.user.lastName}
                                  </Typography>
                                )}
                                {test.claimedAt && (
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                    display='block'
                                  >
                                    Claimed: {formatDate(test.claimedAt)}
                                  </Typography>
                                )}
                              </Box>
                            )
                          ) : (
                            <Typography variant='body2' color='text.secondary'>
                              <i>Restricted</i>
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {canViewLabResults() && test.referenceRange ? (
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {test.referenceRange}
                            </Typography>
                          ) : (
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body1' fontWeight={600}>
                            {formatCurrency(Number(test.totalPrice))}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Card>
        )}
      </Stack>

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
            {labOrder && (
              <Alert severity='info' sx={{ borderRadius: 2, mb: 2 }}>
                <Typography variant='body2' fontWeight={600} gutterBottom>
                  Order Details
                </Typography>
                <Typography variant='body2'>
                  Patient: {labOrder.patient?.firstName}{' '}
                  {labOrder.patient?.lastName} ({labOrder.patient?.patientId})
                </Typography>
                <Typography variant='body2'>
                  Tests: {labOrder.tests?.length || 0} test(s)
                </Typography>
                <Typography
                  variant='body2'
                  fontWeight={600}
                  color='primary.main'
                >
                  Outstanding Balance:{' '}
                  {formatCurrency(
                    Number(labOrder.totalAmount) - Number(labOrder.paidAmount)
                  )}
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
              helperText={`Outstanding balance: ${formatCurrency(
                Number(labOrder?.totalAmount || 0) -
                  Number(labOrder?.paidAmount || 0)
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

export default LabOrderDetailsPage;
