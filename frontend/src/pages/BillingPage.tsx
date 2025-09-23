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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Menu,
  MenuItem,
  ListItemIcon,
  Chip,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  Tooltip,
  Skeleton,
  Stack,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Receipt,
  Payment,
  Print,
  Download,
  Cancel,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import { invoiceService } from '../services/invoice.service';
import { formatDate, formatCurrency } from '../utils';
import toast from 'react-hot-toast';
import type { Invoice, PaginatedResponse } from '../types';

const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Query parameters
  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: rowsPerPage,
      search: searchQuery || undefined,
      status: statusFilter || undefined,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
    }),
    [page, rowsPerPage, searchQuery, statusFilter, sortBy, sortOrder]
  );

  // Fetch invoices
  const {
    data: invoicesData,
    isLoading,
    isError,
    refetch,
  } = useQuery<PaginatedResponse<Invoice>>({
    queryKey: ['invoices', queryParams],
    queryFn: () => invoiceService.getInvoices(queryParams),
    placeholderData: (previousData) => previousData,
    retry: 1,
    retryDelay: 1000,
  });

  // Fix data extraction - handle different possible response structures
  const invoices = useMemo(() => {
    if (!invoicesData) return [];

    // If invoicesData is already an array, use it directly
    if (Array.isArray(invoicesData)) {
      return invoicesData;
    }

    // If invoicesData has a data property that's an array, use that
    if (invoicesData.data && Array.isArray(invoicesData.data)) {
      return invoicesData.data;
    }

    // Fallback: return empty array
    return [];
  }, [invoicesData]);

  const totalCount = useMemo(() => {
    if (!invoicesData) return 0;

    // If invoicesData has pagination info
    if (
      invoicesData.pagination &&
      typeof invoicesData.pagination.total === 'number'
    ) {
      return invoicesData.pagination.total;
    }

    // If invoicesData is an array, return its length
    if (Array.isArray(invoicesData)) {
      return invoicesData.length;
    }

    // If invoicesData has a data property that's an array
    if (invoicesData.data && Array.isArray(invoicesData.data)) {
      return invoicesData.data.length;
    }

    return 0;
  }, [invoicesData]);

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: invoiceService.deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedInvoice(null);
    },
    onError: (error) => {
      toast.error('Failed to delete invoice');
    },
  });

  // Cancel invoice mutation
  const cancelInvoiceMutation = useMutation({
    mutationFn: (data: { id: string; reason?: string }) =>
      invoiceService.cancelInvoice(data.id, data.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice cancelled successfully');
      setCancelDialogOpen(false);
      setCancelReason('');
      setSelectedInvoice(null);
    },
    onError: (error) => {
      toast.error('Failed to cancel invoice');
    },
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: (paymentData: {
      amount: number;
      method: string;
      reference?: string;
      notes?: string;
    }) => {
      if (!selectedInvoice) {
        throw new Error('No invoice selected for payment');
      }
      return invoiceService.processPayment(selectedInvoice.id, paymentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Payment processed successfully');
      setPaymentDialogOpen(false);
      setSelectedInvoice(null);
      handleActionMenuClose(); // Close the action menu after successful payment
    },
    onError: (error) => {
      toast.error('Failed to process payment');
    },
  });

  // Event handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(0); // Reset to first page when sorting
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleActionMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    invoice: Invoice
  ) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedInvoice(null);
  };

  const handleViewInvoice = () => {
    if (selectedInvoice) {
      navigate(`/billing/${selectedInvoice.id}`);
    }
    handleActionMenuClose();
  };

  const handleEditInvoice = () => {
    if (selectedInvoice) {
      navigate(`/billing/${selectedInvoice.id}/edit`);
    }
    handleActionMenuClose();
  };

  const handleDeleteInvoice = () => {
    setDeleteDialogOpen(true);
    handleActionMenuClose();
  };

  const handleCancelInvoice = () => {
    setCancelDialogOpen(true);
    handleActionMenuClose();
  };

  const handleProcessPayment = () => {
    if (selectedInvoice) {
      setPaymentAmount(selectedInvoice.balance?.toString() || '');
    }
    setPaymentDialogOpen(true);
    // Don't close the action menu yet - keep selectedInvoice until payment is processed
  };

  const handlePrintInvoice = async () => {
    if (!selectedInvoice) return;

    try {
      toast.loading('Generating invoice for printing...');
      const blob = await invoiceService.generateInvoicePDF(selectedInvoice.id);

      // Create a new window for printing
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          // Clean up the URL after printing
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 1000);
        };
      } else {
        // Fallback: download the PDF if popup is blocked
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${
          selectedInvoice.invoiceNumber || selectedInvoice.number
        }.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Invoice PDF downloaded for printing');
      }
    } catch (error) {
      toast.error('Failed to generate invoice for printing');
    }

    handleActionMenuClose();
  };

  const handleDownloadPDF = async () => {
    if (!selectedInvoice) return;

    try {
      toast.loading('Generating PDF...');
      const blob = await invoiceService.generateInvoicePDF(selectedInvoice.id);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${
        selectedInvoice.invoiceNumber || selectedInvoice.number
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Invoice PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download invoice PDF');
    }

    handleActionMenuClose();
  };

  const handleSubmitPayment = () => {
    if (!selectedInvoice) {
      toast.error('No invoice selected for payment');
      return;
    }

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

  const resetPaymentForm = () => {
    setPaymentAmount('');
    setPaymentMethod('CASH');
    setPaymentReference('');
    setPaymentNotes('');
  };

  const confirmDeleteInvoice = () => {
    if (selectedInvoice) {
      deleteInvoiceMutation.mutate(selectedInvoice.id);
    }
  };

  const handleAddInvoice = () => {
    navigate('/billing/create');
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Invoice list refreshed');
    } catch {
      toast.error('Failed to refresh invoice list');
    }
  };

  const handleExport = async () => {
    try {
      // This would typically export to CSV/Excel
      toast.success('Exporting invoice list...');
    } catch {
      toast.error('Failed to export invoice list');
    }
  };

  const getStatusColor = (
    status: string
  ): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'OVERDUE':
        return 'error';
      case 'CANCELLED':
        return 'default';
      case 'DRAFT':
        return 'default';
      case 'PARTIAL':
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
          title='Billing & Invoices'
          subtitle='Manage invoices and payments'
          breadcrumbs={<Breadcrumb />}
          showActions={false}
        />
        <Box p={2}>
          {[...Array(5)].map((_, index) => (
            <Skeleton
              key={index}
              variant='rectangular'
              height={60}
              sx={{ mb: 1 }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  // Error state
  if (isError) {
    return (
      <Box>
        <PageHeader
          title='Billing & Invoices'
          subtitle='Manage invoices and payments'
          breadcrumbs={<Breadcrumb />}
          onRefresh={handleRefresh}
          showActions={true}
        />
        <Alert
          severity='error'
          action={
            <Button color='inherit' size='small' onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          Failed to load invoices. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <PageHeader
        title='Billing & Invoices'
        subtitle='Manage invoices and payments'
        breadcrumbs={<Breadcrumb />}
        onAdd={handleAddInvoice}
        onRefresh={handleRefresh}
        onDownload={handleExport}
        showActions={true}
      />

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <Box p={3}>
          <Box display='flex' gap={2} alignItems='center'>
            <TextField
              placeholder='Search invoices by number, patient name...'
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            <FormControl size='small' sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label='Status'
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='DRAFT'>Draft</MenuItem>
                <MenuItem value='PENDING'>Pending</MenuItem>
                <MenuItem value='PARTIAL'>Partial</MenuItem>
                <MenuItem value='PAID'>Paid</MenuItem>
                <MenuItem value='OVERDUE'>Overdue</MenuItem>
                <MenuItem value='CANCELLED'>Cancelled</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant='outlined'
              startIcon={<FilterList />}
              onClick={() => {
                // Additional filters can be added here
              }}
            >
              More Filters
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Invoices Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  onClick={() => handleSort('invoiceNumber')}
                  sx={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Invoice
                    {sortBy === 'invoiceNumber' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUpward fontSize='small' />
                      ) : (
                        <ArrowDownward fontSize='small' />
                      ))}
                  </Box>
                </TableCell>
                <TableCell
                  onClick={() => handleSort('patientName')}
                  sx={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Patient
                    {sortBy === 'patientName' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUpward fontSize='small' />
                      ) : (
                        <ArrowDownward fontSize='small' />
                      ))}
                  </Box>
                </TableCell>
                <TableCell
                  onClick={() => handleSort('totalAmount')}
                  sx={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Amount
                    {sortBy === 'totalAmount' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUpward fontSize='small' />
                      ) : (
                        <ArrowDownward fontSize='small' />
                      ))}
                  </Box>
                </TableCell>
                <TableCell
                  onClick={() => handleSort('status')}
                  sx={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Status
                    {sortBy === 'status' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUpward fontSize='small' />
                      ) : (
                        <ArrowDownward fontSize='small' />
                      ))}
                  </Box>
                </TableCell>
                <TableCell
                  onClick={() => handleSort('dueDate')}
                  sx={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Due Date
                    {sortBy === 'dueDate' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUpward fontSize='small' />
                      ) : (
                        <ArrowDownward fontSize='small' />
                      ))}
                  </Box>
                </TableCell>
                <TableCell
                  onClick={() => handleSort('createdAt')}
                  sx={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Created
                    {sortBy === 'createdAt' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUpward fontSize='small' />
                      ) : (
                        <ArrowDownward fontSize='small' />
                      ))}
                  </Box>
                </TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                // Loading skeleton rows
                [...Array(5)].map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    <TableCell>
                      <Box display='flex' alignItems='center' gap={2}>
                        <Skeleton variant='circular' width={40} height={40} />
                        <Box>
                          <Skeleton variant='text' width={120} height={20} />
                          <Skeleton variant='text' width={80} height={16} />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Skeleton variant='text' width={100} height={20} />
                        <Skeleton variant='text' width={80} height={16} />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Skeleton variant='text' width={80} height={20} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant='rectangular' width={60} height={24} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant='text' width={80} height={20} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant='text' width={80} height={20} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant='circular' width={32} height={32} />
                    </TableCell>
                  </TableRow>
                ))
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align='center' sx={{ py: 4 }}>
                    <Box textAlign='center'>
                      <Typography
                        variant='body1'
                        color='text.secondary'
                        gutterBottom
                      >
                        No invoices found
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {searchQuery || statusFilter
                          ? 'Try adjusting your search or filters'
                          : 'Create your first invoice to get started'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Box display='flex' alignItems='center' gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Receipt />
                        </Avatar>
                        <Box>
                          <Typography variant='body2' fontWeight={500}>
                            {invoice.invoiceNumber || invoice.number || 'N/A'}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            ID: {invoice.id?.slice(-8) || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant='body2'>
                          {invoice.patientName ||
                            (invoice.patient
                              ? `${invoice.patient.firstName} ${invoice.patient.lastName}`
                              : 'Unknown Patient')}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          Patient ID: {invoice.patientId?.slice(-8) || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' fontWeight={500}>
                        {formatCurrency(Number(invoice.totalAmount) || 0)}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {invoice.currency || 'NGN'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status || 'Unknown'}
                        color={getStatusColor(invoice.status || '')}
                        size='small'
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {invoice.dueDate
                          ? formatDate(invoice.dueDate)
                          : invoice.issuedDate
                          ? formatDate(invoice.issuedDate)
                          : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {invoice.createdAt
                          ? formatDate(invoice.createdAt)
                          : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Tooltip title='More actions'>
                        <IconButton
                          onClick={(e) => handleActionMenuOpen(e, invoice)}
                          size='small'
                        >
                          <MoreVert />
                        </IconButton>
                      </Tooltip>
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
          count={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={handleViewInvoice}>
          <ListItemIcon>
            <Visibility fontSize='small' sx={{ mr: 1 }} />
          </ListItemIcon>
          View Details
        </MenuItem>
        <MenuItem onClick={handleEditInvoice}>
          <ListItemIcon>
            <Edit fontSize='small' sx={{ mr: 1 }} />
          </ListItemIcon>
          Edit Invoice
        </MenuItem>
        <MenuItem onClick={handleProcessPayment}>
          <ListItemIcon>
            <Payment fontSize='small' sx={{ mr: 1 }} />
          </ListItemIcon>
          Process Payment
        </MenuItem>
        <MenuItem onClick={handlePrintInvoice}>
          <ListItemIcon>
            <Print fontSize='small' sx={{ mr: 1 }} />
          </ListItemIcon>
          Print Invoice
        </MenuItem>
        <MenuItem onClick={handleDownloadPDF}>
          <ListItemIcon>
            <Download fontSize='small' sx={{ mr: 1 }} />
          </ListItemIcon>
          Download PDF
        </MenuItem>
        <MenuItem onClick={handleCancelInvoice} sx={{ color: 'warning.main' }}>
          <ListItemIcon>
            <Cancel fontSize='small' sx={{ mr: 1 }} />
          </ListItemIcon>
          Cancel Invoice
        </MenuItem>
        <MenuItem onClick={handleDeleteInvoice} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize='small' sx={{ mr: 1 }} />
          </ListItemIcon>
          Delete Invoice
        </MenuItem>
      </Menu>

      {/* Cancel Invoice Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Cancel Invoice</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Typography>
              Are you sure you want to cancel invoice{' '}
              {selectedInvoice?.invoiceNumber || selectedInvoice?.number}? This
              action will mark the invoice as cancelled.
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (selectedInvoice) {
                cancelInvoiceMutation.mutate({
                  id: selectedInvoice.id,
                  reason: cancelReason || undefined,
                });
              }
            }}
            color='warning'
            variant='contained'
            disabled={cancelInvoiceMutation.isPending}
          >
            {cancelInvoiceMutation.isPending
              ? 'Cancelling...'
              : 'Cancel Invoice'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Invoice</DialogTitle>
        <DialogContent>
          Are you sure you want to delete invoice {selectedInvoice?.number}?
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDeleteInvoice}
            color='error'
            variant='contained'
            disabled={deleteInvoiceMutation.isPending}
          >
            {deleteInvoiceMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          resetPaymentForm();
        }}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label='Payment Amount'
              type='number'
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              fullWidth
              required
              inputProps={{ min: 0, step: 0.01 }}
              helperText={`Outstanding balance: ${formatCurrency(
                Number(selectedInvoice?.balance) || 0
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
            onClick={handleSubmitPayment}
            variant='contained'
            disabled={processPaymentMutation.isPending}
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

export default BillingPage;
