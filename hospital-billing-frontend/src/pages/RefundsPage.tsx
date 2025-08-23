import React, { useState } from 'react';
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
  Add,
  AccountBalance,
  CreditCard,
  Money,
  Timeline,
  CheckCircle,
  Error,
  Pending,
  Reply,
  Person,
  Info,
  Cancel,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import { paymentService } from '../services/payment.service';
import { formatDate, formatCurrency } from '../utils';
import toast from 'react-hot-toast';

// Define refund type based on API response
interface Refund {
  id: string;
  referenceNumber?: string;
  amount: number;
  reason: string;
  status: string;
  refundDate: string;
  processedAt?: string;
  notes?: string;
  patientId?: string;
  patient?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    patientId?: string;
    phone?: string;
    email?: string;
  };
  payment?: {
    reference?: string;
    amount?: number;
    method?: string;
  };
  paymentId?: string;
}

const RefundsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(
    null
  );
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  // Fetch refunds from API
  const {
    data: refundsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'refunds',
      page,
      rowsPerPage,
      searchQuery,
      statusFilter,
      methodFilter,
    ],
    queryFn: () =>
      paymentService.getRefunds({
        page: page + 1, // API uses 1-based pagination
        limit: rowsPerPage,
        search: searchQuery,
        status: statusFilter,
      }),
    enabled: isAuthenticated, // Only run query when user is authenticated
  });

  const refunds = refundsData?.data || [];
  const totalRefunds = refundsData?.pagination?.total || 0;

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Skeleton variant='text' width='200px' height={40} />
          <Skeleton variant='rectangular' width='100%' height={400} />
        </Stack>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='warning'>
          Please log in to access the refunds page.
        </Alert>
      </Box>
    );
  }

  // Event handlers
  const handleActionMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    refund: Refund
  ) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedRefund(refund);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedRefund(null);
  };

  const handleViewRefund = () => {
    if (selectedRefund) {
      setDetailsDialogOpen(true);
      // Don't clear selectedRefund here, just close the action menu
      setActionMenuAnchor(null);
    }
  };

  const handleProcessNewRefund = () => {
    navigate('/payments/refunds/process');
  };

  const handleBackToPayments = () => {
    navigate('/payments');
  };

  const handlePrintRefund = async () => {
    if (!selectedRefund) {
      toast.error('No refund selected');
      return;
    }

    // Check if refund is approved
    if (selectedRefund.status !== 'APPROVED') {
      toast.error('Only approved refunds can generate receipts');
      return;
    }

    try {
      toast.loading('Generating refund receipt for printing...');
      const pdfBlob = await paymentService.generateRefundReceiptPDF(
        selectedRefund.id
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
        link.download = `refund-receipt-${
          selectedRefund.referenceNumber || selectedRefund.id.slice(-8)
        }.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('PDF receipt downloaded for printing');
      }
    } catch (error: any) {
      console.error('Error generating PDF receipt:', error);
      // Handle specific error messages from backend
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to generate PDF receipt for printing');
      }
    } finally {
      handleActionMenuClose();
    }
  };

  const handleDownloadRefund = async () => {
    if (!selectedRefund) {
      toast.error('No refund selected');
      return;
    }

    // Check if refund is approved
    if (selectedRefund.status !== 'APPROVED') {
      toast.error('Only approved refunds can generate receipts');
      return;
    }

    try {
      toast.loading('Generating PDF receipt...');

      const pdfBlob = await paymentService.generateRefundReceiptPDF(
        selectedRefund.id
      );

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `refund-receipt-${
        selectedRefund.referenceNumber || selectedRefund.id.slice(-8)
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('PDF receipt downloaded successfully!');
    } catch (error: any) {
      console.error('Error downloading receipt:', error);
      // Handle specific error messages from backend
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to download receipt. Please try again.');
      }
    } finally {
      handleActionMenuClose();
    }
  };

  const handleViewOriginalPayment = () => {
    if (selectedRefund?.paymentId) {
      navigate(`/payments/${selectedRefund.paymentId}`);
    } else {
      toast.error('Original payment information not available');
    }
    handleActionMenuClose();
  };

  const handleCopyRefundId = () => {
    if (selectedRefund) {
      navigator.clipboard.writeText(selectedRefund.id);
      toast.success('Refund ID copied to clipboard');
    }
    handleActionMenuClose();
  };

  const handleViewPatient = () => {
    if (selectedRefund?.patient?.id) {
      navigate(`/patients/${selectedRefund.patient.id}`);
    } else if (selectedRefund?.patientId) {
      navigate(`/patients/${selectedRefund.patientId}`);
    } else if (selectedRefund?.patient?.patientId) {
      navigate(`/patients/${selectedRefund.patient.patientId}`);
    } else {
      toast.error('Patient information not available');
    }
    setDetailsDialogOpen(false);
  };

  // Status management handlers
  const handleApproveRefund = async () => {
    if (!selectedRefund) {
      toast.error('No refund selected');
      return;
    }

    if (selectedRefund.status === 'APPROVED') {
      toast.error('Refund is already approved');
      return;
    }

    try {
      toast.loading('Approving refund...');
      await paymentService.approveRefund(selectedRefund.id);
      toast.success('Refund approved successfully!');

      // Refresh the refunds data
      refetch();

      // Close the action menu
      handleActionMenuClose();
    } catch (error: any) {
      console.error('Error approving refund:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to approve refund. Please try again.');
      }
    }
  };

  const handleRejectRefund = () => {
    if (!selectedRefund) {
      toast.error('No refund selected');
      return;
    }

    if (selectedRefund.status === 'REJECTED') {
      toast.error('Refund is already rejected');
      return;
    }

    // Open rejection dialog to collect reason
    setRejectDialogOpen(true);
    setRejectionReason('');
    // Only close the action menu, don't clear selectedRefund
    setActionMenuAnchor(null);
  };

  const handleConfirmReject = async () => {
    if (!selectedRefund) {
      toast.error('No refund selected');
      return;
    }

    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setIsRejecting(true);
      await paymentService.rejectRefund(
        selectedRefund.id,
        rejectionReason.trim()
      );
      toast.success('Refund rejected successfully!');

      // Refresh the refunds data
      refetch();

      // Close the dialog and reset state
      setRejectDialogOpen(false);
      setRejectionReason('');
      // Clear the selected refund after successful rejection
      setSelectedRefund(null);
    } catch (error: any) {
      console.error('Error rejecting refund:', error);
      // Handle specific error messages from backend
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to reject refund. Please try again.');
      }
    } finally {
      setIsRejecting(false);
    }
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      case 'CANCELLED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle fontSize='small' />;
      case 'PENDING':
        return <Pending fontSize='small' />;
      case 'REJECTED':
        return <Error fontSize='small' />;
      case 'CANCELLED':
        return <Cancel fontSize='small' />;
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
        title='Refunds'
        subtitle='Manage and track all refunds'
        breadcrumbs={<Breadcrumb />}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant='outlined'
              startIcon={<Reply />}
              onClick={handleBackToPayments}
            >
              Back to Payments
            </Button>
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={handleProcessNewRefund}
            >
              Process Refund
            </Button>
          </Box>
        }
      />

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              placeholder='Search refunds...'
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
                <MenuItem value='PENDING'>Pending</MenuItem>
                <MenuItem value='APPROVED'>Approved</MenuItem>
                <MenuItem value='REJECTED'>Rejected</MenuItem>
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

      {/* Refunds Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Refund</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Original Payment</TableCell>
                <TableCell>Refund Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Processed By</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: rowsPerPage }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton variant='text' width='120px' />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Skeleton variant='circular' width={32} height={32} />
                        <Box>
                          <Skeleton variant='text' width='80px' />
                          <Skeleton variant='text' width='60px' />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Skeleton variant='text' width='100px' />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant='text' width='80px' />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant='text' width='60px' />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant='text' width='80px' />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant='text' width='100px' />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant='text' width='80px' />
                    </TableCell>
                    <TableCell align='right'>
                      <Skeleton variant='text' width='60px' />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={9} align='center' sx={{ py: 4 }}>
                    <Alert severity='error'>
                      Failed to load refunds. Please try again.
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : refunds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align='center' sx={{ py: 4 }}>
                    <Typography variant='body1' color='text.secondary'>
                      No refunds found
                    </Typography>
                    <Button
                      variant='outlined'
                      startIcon={<Add />}
                      onClick={handleProcessNewRefund}
                      sx={{ mt: 1 }}
                    >
                      Process First Refund
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                refunds.map((refund: Refund) => (
                  <TableRow key={refund.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant='body2' fontWeight='medium'>
                          {refund.referenceNumber ||
                            `REF-${refund.id.slice(-8)}`}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          ID: {refund.id.slice(-12)}
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
                          {refund.patient?.firstName?.charAt(0) || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant='body2' fontWeight='medium'>
                            {refund.patient?.firstName || 'Unknown'}{' '}
                            {refund.patient?.lastName || 'Patient'}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {refund.patient?.patientId || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant='body2' fontWeight='medium'>
                          {refund.payment?.reference ||
                            `PAY-${refund.paymentId?.slice(-8)}`}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {formatCurrency(refund.payment?.amount || 0)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant='body2'
                        fontWeight='medium'
                        color='error.main'
                      >
                        -{formatCurrency(refund.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getMethodIcon(
                          refund.payment?.method || 'UNKNOWN'
                        )}
                        label={refund.payment?.method || 'UNKNOWN'}
                        size='small'
                        color={getMethodColor(
                          refund.payment?.method || 'UNKNOWN'
                        )}
                        variant='outlined'
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(refund.status)}
                        label={refund.status}
                        size='small'
                        color={getStatusColor(refund.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {formatDate(refund.refundDate)}
                      </Typography>
                      {refund.processedAt && (
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          display='block'
                        >
                          Processed: {formatDate(refund.processedAt)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {refund.status === 'APPROVED'
                          ? 'Approved'
                          : refund.status === 'REJECTED'
                          ? 'Rejected'
                          : refund.status === 'PENDING'
                          ? 'Pending'
                          : 'System'}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <IconButton
                        size='small'
                        onClick={(e) => handleActionMenuOpen(e, refund)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component='div'
          count={totalRefunds}
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
        <MenuItem onClick={handleViewRefund}>
          <ListItemIcon>
            <Visibility fontSize='small' />
          </ListItemIcon>
          View Details
        </MenuItem>
        <MenuItem
          onClick={handlePrintRefund}
          disabled={selectedRefund?.status !== 'APPROVED'}
        >
          <ListItemIcon>
            <Print fontSize='small' />
          </ListItemIcon>
          Print Refund Receipt
          {selectedRefund?.status !== 'APPROVED' && (
            <Typography variant='caption' color='text.secondary' sx={{ ml: 1 }}>
              (Approved only)
            </Typography>
          )}
        </MenuItem>
        <MenuItem
          onClick={handleDownloadRefund}
          disabled={selectedRefund?.status !== 'APPROVED'}
        >
          <ListItemIcon>
            <Download fontSize='small' />
          </ListItemIcon>
          Download Refund Receipt
          {selectedRefund?.status !== 'APPROVED' && (
            <Typography variant='caption' color='text.secondary' sx={{ ml: 1 }}>
              (Approved only)
            </Typography>
          )}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleViewOriginalPayment}>
          <ListItemIcon>
            <Receipt fontSize='small' />
          </ListItemIcon>
          View Original Payment
        </MenuItem>
        <MenuItem onClick={handleCopyRefundId}>
          <ListItemIcon>
            <Timeline fontSize='small' />
          </ListItemIcon>
          Copy Refund ID
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={handleApproveRefund}
          disabled={selectedRefund?.status === 'APPROVED'}
        >
          <ListItemIcon>
            <CheckCircle fontSize='small' />
          </ListItemIcon>
          Approve Refund
          {selectedRefund?.status === 'APPROVED' && (
            <Typography variant='caption' color='text.secondary' sx={{ ml: 1 }}>
              (Already approved)
            </Typography>
          )}
        </MenuItem>
        <MenuItem
          onClick={handleRejectRefund}
          disabled={selectedRefund?.status === 'REJECTED'}
        >
          <ListItemIcon>
            <Error fontSize='small' />
          </ListItemIcon>
          Reject Refund
          {selectedRefund?.status === 'REJECTED' && (
            <Typography variant='caption' color='text.secondary' sx={{ ml: 1 }}>
              (Already rejected)
            </Typography>
          )}
        </MenuItem>
      </Menu>

      {/* Refund Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedRefund(null);
        }}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          Refund Details
          {selectedRefund && (
            <Typography variant='body2' color='text.secondary'>
              {selectedRefund.referenceNumber ||
                `REF-${selectedRefund.id?.slice(-8)}`}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedRefund && (
            <Box sx={{ py: 1 }}>
              <Stack spacing={4}>
                {/* Summary Section */}
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Receipt sx={{ color: 'primary.main' }} />
                    <Typography variant='h6' color='primary.main'>
                      Refund Summary
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(4, 1fr)',
                      },
                      gap: 3,
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.200',
                    }}
                  >
                    <Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Refund Amount
                      </Typography>
                      <Typography
                        variant='h5'
                        color='error.main'
                        fontWeight='bold'
                      >
                        -{formatCurrency(selectedRefund.amount)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Status
                      </Typography>
                      <Chip
                        icon={getStatusIcon(selectedRefund.status)}
                        label={selectedRefund.status}
                        color={getStatusColor(selectedRefund.status)}
                        size='medium'
                        sx={{ fontWeight: 'medium' }}
                      />
                    </Box>
                    <Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Reference
                      </Typography>
                      <Typography
                        variant='body1'
                        fontWeight='medium'
                        fontFamily='monospace'
                      >
                        {selectedRefund.referenceNumber ||
                          `REF-${selectedRefund.id?.slice(-8)}`}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Created Date
                      </Typography>
                      <Typography variant='body1' fontWeight='medium'>
                        {formatDate(selectedRefund.refundDate)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Original Payment Section */}
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <CreditCard sx={{ color: 'info.main' }} />
                    <Typography variant='h6' color='info.main'>
                      Original Payment Details
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                      },
                      gap: 3,
                      p: 2,
                      bgcolor: 'info.50',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'info.200',
                    }}
                  >
                    <Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Payment Reference
                      </Typography>
                      <Typography
                        variant='body1'
                        fontWeight='medium'
                        fontFamily='monospace'
                      >
                        {selectedRefund.payment?.reference ||
                          `PAY-${selectedRefund.paymentId?.slice(-8)}`}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Original Amount
                      </Typography>
                      <Typography
                        variant='body1'
                        fontWeight='bold'
                        color='success.main'
                      >
                        {formatCurrency(selectedRefund.payment?.amount || 0)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Payment Method
                      </Typography>
                      <Chip
                        icon={getMethodIcon(
                          selectedRefund.payment?.method || 'UNKNOWN'
                        )}
                        label={selectedRefund.payment?.method || 'UNKNOWN'}
                        color={getMethodColor(
                          selectedRefund.payment?.method || 'UNKNOWN'
                        )}
                        variant='outlined'
                        size='small'
                      />
                    </Box>
                    <Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Refund Percentage
                      </Typography>
                      <Typography
                        variant='body1'
                        fontWeight='medium'
                        color='warning.main'
                      >
                        {(
                          (selectedRefund.amount /
                            (selectedRefund.payment?.amount || 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Patient Information Section */}
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Person sx={{ color: 'success.main' }} />
                    <Typography variant='h6' color='success.main'>
                      Patient Information
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(2, 1fr)',
                      },
                      gap: 3,
                      p: 2,
                      bgcolor: 'success.50',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'success.200',
                    }}
                  >
                    <Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Full Name
                      </Typography>
                      <Typography variant='body1' fontWeight='medium'>
                        {selectedRefund.patient?.firstName}{' '}
                        {selectedRefund.patient?.lastName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Patient ID
                      </Typography>
                      <Typography
                        variant='body1'
                        fontWeight='medium'
                        fontFamily='monospace'
                      >
                        {selectedRefund.patient?.patientId || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Phone Number
                      </Typography>
                      <Typography variant='body1'>
                        {selectedRefund.patient?.phone || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Email Address
                      </Typography>
                      <Typography variant='body1'>
                        {selectedRefund.patient?.email || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Refund Details Section */}
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Info sx={{ color: 'warning.main' }} />
                    <Typography variant='h6' color='warning.main'>
                      Additional Details
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                      gap: 3,
                      p: 2,
                      bgcolor: 'warning.50',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'warning.200',
                    }}
                  >
                    <Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Refund Reason
                      </Typography>
                      <Typography variant='body1' fontWeight='medium'>
                        {selectedRefund.reason}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Processed Date
                      </Typography>
                      <Typography variant='body1' fontWeight='medium'>
                        {selectedRefund.processedAt
                          ? formatDate(selectedRefund.processedAt)
                          : 'Not yet processed'}
                      </Typography>
                    </Box>
                    <Box sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Notes
                      </Typography>
                      <Typography variant='body1'>
                        {selectedRefund.notes || 'No additional notes provided'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDetailsDialogOpen(false);
              setSelectedRefund(null);
            }}
          >
            Close
          </Button>
          <Button
            variant='outlined'
            startIcon={<Visibility />}
            onClick={handleViewPatient}
          >
            View Patient
          </Button>
          <Button
            variant='outlined'
            startIcon={<Receipt />}
            onClick={handleViewOriginalPayment}
          >
            View Original Payment
          </Button>
          <Button
            variant='contained'
            startIcon={<Print />}
            onClick={handlePrintRefund}
            disabled={selectedRefund?.status !== 'APPROVED'}
            title={
              selectedRefund?.status !== 'APPROVED'
                ? 'Only approved refunds can generate receipts'
                : 'Print refund receipt'
            }
          >
            Print Refund Receipt
            {selectedRefund?.status !== 'APPROVED' && (
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ ml: 1 }}
              >
                (Approved only)
              </Typography>
            )}
          </Button>
          <Button
            variant='outlined'
            startIcon={<Download />}
            onClick={handleDownloadRefund}
            disabled={selectedRefund?.status !== 'APPROVED'}
            title={
              selectedRefund?.status !== 'APPROVED'
                ? 'Only approved refunds can generate receipts'
                : 'Download refund receipt'
            }
          >
            Download Receipt
            {selectedRefund?.status !== 'APPROVED' && (
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ ml: 1 }}
              >
                (Approved only)
              </Typography>
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Refund Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => {
          setRejectDialogOpen(false);
          setRejectionReason('');
          setSelectedRefund(null);
        }}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Reject Refund</DialogTitle>
        <DialogContent>
          <Typography variant='body2' sx={{ mt: 1, mb: 2 }}>
            Please provide a reason for rejecting this refund. This information
            will be recorded and may be shared with the patient.
          </Typography>
          <TextField
            autoFocus
            multiline
            rows={3}
            fullWidth
            label='Rejection Reason'
            placeholder='Enter the reason for rejecting this refund...'
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            error={!rejectionReason.trim()}
            helperText={
              !rejectionReason.trim() ? 'Rejection reason is required' : ''
            }
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRejectDialogOpen(false);
              setRejectionReason('');
              setSelectedRefund(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleConfirmReject}
            disabled={!rejectionReason.trim() || isRejecting}
          >
            {isRejecting ? 'Rejecting...' : 'Reject Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RefundsPage;
