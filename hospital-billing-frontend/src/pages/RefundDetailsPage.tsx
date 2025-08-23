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
} from '@mui/material';
import {
  Print,
  MoreVert,
  Edit,
  ContentCopy,
  Cancel,
  Delete,
  Person,
  AccountBalance,
  MoneyOff,
  Visibility,
  Download,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import { paymentService } from '../services/payment.service';
import { formatDate, formatCurrency } from '../utils';
import toast from 'react-hot-toast';

const RefundDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Fetch refund details
  const {
    data: refund,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['refund', id],
    queryFn: () => paymentService.getRefundById(id!),
    enabled: !!id,
    retry: 1,
  });

  // Mutations
  const cancelRefundMutation = useMutation({
    mutationFn: (rejectionReason: string) =>
      paymentService.rejectRefund(id!, rejectionReason),
    onMutate: () => {
      setIsRejecting(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refund', id] });
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      toast.success('Refund rejected successfully');
      setCancelDialogOpen(false);
      setRejectionReason('');
    },
    onError: (error) => {
      console.error('Reject refund error:', error);
      toast.error('Failed to reject refund');
    },
    onSettled: () => {
      setIsRejecting(false);
    },
  });

  const deleteRefundMutation = useMutation({
    mutationFn: () => paymentService.deleteRefund(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      toast.success('Refund deleted successfully');
      navigate('/refunds');
    },
    onError: (error) => {
      console.error('Delete refund error:', error);
      toast.error('Failed to delete refund');
    },
  });

  // Event handlers
  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setActionMenuAnchor(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  const handleEdit = () => {
    navigate(`/refunds/${id}/edit`);
    handleActionMenuClose();
  };

  const handlePrintReceipt = async () => {
    try {
      toast.loading('Generating refund receipt for printing...');
      const pdfBlob = await paymentService.generateRefundReceiptPDF(id!);

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
        link.download = `refund-receipt-${refund?.referenceNumber || id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Refund receipt PDF downloaded for printing');
      }
    } catch (error) {
      console.error('Print refund receipt error:', error);
      toast.error('Failed to generate refund receipt for printing');
    }
    handleActionMenuClose();
  };

  const handleDownloadReceipt = async () => {
    try {
      toast.loading('Generating refund receipt...');
      const pdfBlob = await paymentService.generateRefundReceiptPDF(id!);

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `refund-receipt-${refund?.referenceNumber || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Refund receipt downloaded successfully!');
    } catch (error) {
      console.error('Error downloading refund receipt:', error);
      toast.error('Failed to download refund receipt. Please try again.');
    }
    handleActionMenuClose();
  };

  const handleViewOriginalPayment = () => {
    if (refund?.paymentId) {
      navigate(`/payments/${refund.paymentId}`);
    } else {
      toast.error('Original payment information not available');
    }
    handleActionMenuClose();
  };

  const handleViewInvoice = () => {
    if (refund?.invoiceId) {
      navigate(`/billing/${refund.invoiceId}`);
    }
    handleActionMenuClose();
  };

  const handleViewPatient = () => {
    if (refund?.patientId) {
      navigate(`/patients/${refund.patientId}`);
    }
    handleActionMenuClose();
  };

  const handleCancelRefund = () => {
    setCancelDialogOpen(true);
    // Only close the action menu, don't clear selectedRefund
    setActionMenuAnchor(null);
  };

  const handleDeleteRefund = () => {
    setDeleteDialogOpen(true);
    handleActionMenuClose();
  };

  const handleCopyRefundId = () => {
    navigator.clipboard.writeText(id!);
    toast.success('Refund ID copied to clipboard');
    handleActionMenuClose();
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
        return <MoneyOff fontSize='small' />;
      case 'PENDING':
        return <Visibility fontSize='small' />;
      case 'REJECTED':
        return <Cancel fontSize='small' />;
      case 'CANCELLED':
        return <Cancel fontSize='small' />;
      default:
        return <Visibility fontSize='small' />;
    }
  };

  if (isLoading) {
    return (
      <Box>
        <PageHeader
          title='Refund Details'
          subtitle='Loading refund information...'
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

  if (isError || !refund) {
    return (
      <Box>
        <PageHeader
          title='Refund Details'
          subtitle='Error loading refund'
          breadcrumbs={<Breadcrumb />}
        />
        <Card sx={{ p: 3, mt: 3 }}>
          <Alert severity='error'>
            Failed to load refund details. Please try again.
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
        title='Refund Details'
        subtitle={`Refund #${refund.referenceNumber || refund.id}`}
        breadcrumbs={<Breadcrumb />}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant='outlined'
              startIcon={<Print />}
              onClick={handlePrintReceipt}
            >
              Print Receipt
            </Button>
            <Button
              variant='outlined'
              startIcon={<Download />}
              onClick={handleDownloadReceipt}
            >
              Download Receipt
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
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <Edit fontSize='small' />
          </ListItemIcon>
          Edit Refund
        </MenuItem>
        <MenuItem onClick={handleViewOriginalPayment}>
          <ListItemIcon>
            <Visibility fontSize='small' />
          </ListItemIcon>
          View Original Payment
        </MenuItem>
        <MenuItem onClick={handleViewInvoice}>
          <ListItemIcon>
            <AccountBalance fontSize='small' />
          </ListItemIcon>
          View Invoice
        </MenuItem>
        <MenuItem onClick={handleViewPatient}>
          <ListItemIcon>
            <Person fontSize='small' />
          </ListItemIcon>
          View Patient
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleCopyRefundId}>
          <ListItemIcon>
            <ContentCopy fontSize='small' />
          </ListItemIcon>
          Copy Refund ID
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleCancelRefund}>
          <ListItemIcon>
            <Cancel fontSize='small' />
          </ListItemIcon>
          Reject Refund
        </MenuItem>
        <MenuItem onClick={handleDeleteRefund}>
          <ListItemIcon>
            <Delete fontSize='small' />
          </ListItemIcon>
          Delete Refund
        </MenuItem>
      </Menu>

      {/* Refund Details */}
      <Card sx={{ p: 3, mt: 3 }}>
        <Stack spacing={3}>
          {/* Refund Information */}
          <Box>
            <Typography variant='h6' gutterBottom>
              Refund Information
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Refund ID
                </Typography>
                <Typography variant='body1' sx={{ fontFamily: 'monospace' }}>
                  {refund.id}
                </Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Reference Number
                </Typography>
                <Typography variant='body1'>
                  {refund.referenceNumber || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Amount
                </Typography>
                <Typography variant='h6' color='error.main'>
                  -{formatCurrency(refund.amount)}
                </Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Status
                </Typography>
                <Chip
                  icon={getStatusIcon(refund.status)}
                  label={refund.status}
                  color={getStatusColor(refund.status)}
                  sx={{ mt: 0.5 }}
                />
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Reason
                </Typography>
                <Typography variant='body1'>{refund.reason}</Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Refund Date
                </Typography>
                <Typography variant='body1'>
                  {formatDate(refund.refundDate)}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Original Payment Information */}
          <Box>
            <Typography variant='h6' gutterBottom>
              Original Payment Information
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Payment Reference
                </Typography>
                <Typography variant='body1'>
                  {refund.payment?.reference || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Payment Amount
                </Typography>
                <Typography variant='body1'>
                  {formatCurrency(refund.payment?.amount || 0)}
                </Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Payment Method
                </Typography>
                <Typography variant='body1'>
                  {refund.payment?.method || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Payment Date
                </Typography>
                <Typography variant='body1'>
                  {refund.payment?.processedAt
                    ? formatDate(refund.payment.processedAt)
                    : 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Patient Information */}
          <Box>
            <Typography variant='h6' gutterBottom>
              Patient Information
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Patient Name
                </Typography>
                <Typography variant='body1'>
                  {refund.patient?.firstName} {refund.patient?.lastName}
                </Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Patient ID
                </Typography>
                <Typography variant='body1'>
                  {refund.patient?.patientId}
                </Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Phone
                </Typography>
                <Typography variant='body1'>
                  {refund.patient?.phone || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Email
                </Typography>
                <Typography variant='body1'>
                  {refund.patient?.email || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Additional Information */}
          <Box>
            <Typography variant='h6' gutterBottom>
              Additional Information
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Created
                </Typography>
                <Typography variant='body1'>
                  {formatDate(refund.createdAt)}
                </Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Last Updated
                </Typography>
                <Typography variant='body1'>
                  {formatDate(refund.updatedAt)}
                </Typography>
              </Box>
              {refund.approvedBy && (
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Approved By
                  </Typography>
                  <Typography variant='body1'>{refund.approvedBy}</Typography>
                </Box>
              )}
              {refund.approvedAt && (
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Approved At
                  </Typography>
                  <Typography variant='body1'>
                    {formatDate(refund.approvedAt)}
                  </Typography>
                </Box>
              )}
              {refund.rejectedBy && (
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Rejected By
                  </Typography>
                  <Typography variant='body1'>{refund.rejectedBy}</Typography>
                </Box>
              )}
              {refund.rejectedAt && (
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Rejected At
                  </Typography>
                  <Typography variant='body1'>
                    {formatDate(refund.rejectedAt)}
                  </Typography>
                </Box>
              )}
              {refund.rejectionReason && (
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant='body2' color='text.secondary'>
                    Rejection Reason
                  </Typography>
                  <Typography variant='body1'>
                    {refund.rejectionReason}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Notes */}
          {refund.notes && (
            <Box>
              <Typography variant='h6' gutterBottom>
                Notes
              </Typography>
              <Typography variant='body1' sx={{ fontStyle: 'italic' }}>
                {refund.notes}
              </Typography>
            </Box>
          )}
        </Stack>
      </Card>

      {/* Reject Refund Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => {
          setCancelDialogOpen(false);
          setRejectionReason('');
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setRejectionReason(e.target.value)
            }
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
              setCancelDialogOpen(false);
              setRejectionReason('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={() => {
              if (!rejectionReason.trim()) {
                toast.error('Please provide a rejection reason');
                return;
              }
              cancelRefundMutation.mutate(rejectionReason.trim());
            }}
            disabled={isRejecting || !rejectionReason.trim()}
          >
            {isRejecting ? 'Rejecting...' : 'Reject Refund'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Refund Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Delete Refund</DialogTitle>
        <DialogContent>
          <Typography variant='body2' sx={{ mt: 1 }}>
            Are you sure you want to delete this refund? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant='contained'
            color='error'
            onClick={() => deleteRefundMutation.mutate()}
            disabled={deleteRefundMutation.isPending}
          >
            {deleteRefundMutation.isPending ? 'Deleting...' : 'Delete Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RefundDetailsPage;
