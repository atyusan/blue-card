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
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Query parameters
  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: rowsPerPage,
      search: searchQuery || undefined,
      status: statusFilter || undefined,
    }),
    [page, rowsPerPage, searchQuery, statusFilter]
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
  });

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
      console.error('Delete invoice error:', error);
      toast.error('Failed to delete invoice');
    },
  });

  // Event handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0); // Reset to first page when searching
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
    } catch (error) {
      toast.error('Failed to refresh invoice list');
    }
  };

  const handleExport = async () => {
    try {
      // This would typically export to CSV/Excel
      toast.success('Exporting invoice list...');
    } catch (error) {
      toast.error('Failed to export invoice list');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      case 'cancelled':
        return 'default';
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

  const invoices = invoicesData?.data || [];
  const totalCount = invoicesData?.pagination.total || 0;

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
                <MenuItem value='pending'>Pending</MenuItem>
                <MenuItem value='paid'>Paid</MenuItem>
                <MenuItem value='overdue'>Overdue</MenuItem>
                <MenuItem value='cancelled'>Cancelled</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant='outlined'
              startIcon={<FilterList />}
              onClick={() => {
                /* Open filter dialog */
              }}
            >
              Filter
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
                <TableCell>Invoice</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>
                    <Box display='flex' alignItems='center' gap={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Receipt />
                      </Avatar>
                      <Box>
                        <Typography variant='body2' fontWeight={500}>
                          {invoice.number}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          ID: {invoice.id.slice(-8)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant='body2'>
                        {invoice.patientName || 'Unknown Patient'}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Patient ID: {invoice.patientId.slice(-8)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2' fontWeight={500}>
                      {formatCurrency(invoice.totalAmount)}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {invoice.currency || 'NGN'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.status}
                      color={getStatusColor(invoice.status) as any}
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>
                      {formatDate(invoice.dueDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>
                      {formatDate(invoice.createdAt)}
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
              ))}
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
        <MenuItem>
          <ListItemIcon>
            <Payment fontSize='small' sx={{ mr: 1 }} />
          </ListItemIcon>
          Process Payment
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <Print fontSize='small' sx={{ mr: 1 }} />
          </ListItemIcon>
          Print Invoice
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <Download fontSize='small' sx={{ mr: 1 }} />
          </ListItemIcon>
          Download PDF
        </MenuItem>
        <MenuItem onClick={handleDeleteInvoice} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize='small' sx={{ mr: 1 }} />
          </ListItemIcon>
          Delete Invoice
        </MenuItem>
      </Menu>

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
    </Box>
  );
};

export default BillingPage;
