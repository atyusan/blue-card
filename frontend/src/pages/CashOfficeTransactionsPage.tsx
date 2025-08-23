import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  Menu,
  ListItemIcon,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  Skeleton,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Search,
  FilterList,
  Visibility,
  Refresh,
  Add,
  MoreVert,
  Edit,
  Delete,
  AccountBalance,
  Payment,
  Receipt,
  Timeline,
  BusinessCenter,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { cashOfficeService } from '../services/cashOffice.service';
import { formatCurrency, formatDate } from '../utils';

const transactionTypes = [
  { value: 'CASH_IN', label: 'Cash In', color: 'success' },
  { value: 'CASH_OUT', label: 'Cash Out', color: 'error' },
  { value: 'RECEIPT', label: 'Receipt', color: 'success' },
  { value: 'PAYMENT', label: 'Payment', color: 'error' },
  { value: 'REFUND', label: 'Refund', color: 'warning' },
  { value: 'ADJUSTMENT', label: 'Adjustment', color: 'info' },
  { value: 'TRANSFER', label: 'Transfer', color: 'default' },
];

const categories = [
  { value: 'PATIENT_PAYMENT', label: 'Patient Payment' },
  { value: 'SUPPLIER_PAYMENT', label: 'Supplier Payment' },
  { value: 'STAFF_SALARY', label: 'Staff Salary' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OTHER', label: 'Other' },
];

const statuses = [
  { value: 'PENDING', label: 'Pending', color: 'warning' },
  { value: 'COMPLETED', label: 'Completed', color: 'success' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'error' },
  { value: 'REVERSED', label: 'Reversed', color: 'info' },
];

const paymentMethods = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CHECK', label: 'Check' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CARD', label: 'Card' },
];

export default function CashOfficeTransactionsPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    transactionType: '',
    category: '',
    status: '',
    paymentMethod: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  // Query parameters
  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: rowsPerPage,
      search: filters.search || undefined,
      transactionType: filters.transactionType || undefined,
      category: filters.category || undefined,
      status: filters.status || undefined,
      paymentMethod: filters.paymentMethod || undefined,
      startDate: filters.startDate
        ? filters.startDate.toISOString()
        : undefined,
      endDate: filters.endDate ? filters.endDate.toISOString() : undefined,
    }),
    [page, rowsPerPage, filters]
  );

  // Fetch cash transactions
  const {
    data: transactionsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['cash-transactions', queryParams],
    queryFn: () => cashOfficeService.getCashTransactions(queryParams),
  });

  // Extract transactions and total count
  // Handle both direct array response and PaginatedResponse structure
  const transactions = Array.isArray(transactionsResponse)
    ? transactionsResponse
    : transactionsResponse?.data || [];

  const totalCount = Array.isArray(transactionsResponse)
    ? transactionsResponse.length
    : transactionsResponse?.pagination?.total || 0;

  // Handle filter changes
  const handleFilterChange = (field: string, value: string | Date | null) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    setPage(0); // Reset to first page when applying filters
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      transactionType: '',
      category: '',
      status: '',
      paymentMethod: '',
      startDate: null,
      endDate: null,
    });
    setPage(0);
  };

  // Handle page change
  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle action menu
  const handleActionMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    transaction: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedTransaction(transaction);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  // View transaction details
  const handleViewDetails = () => {
    setDetailsDialogOpen(true);
    handleActionMenuClose();
  };

  // Get transaction type color
  const getTransactionTypeColor = (type: string) => {
    const found = transactionTypes.find((t) => t.value === type);
    return found?.color || 'default';
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const found = statuses.find((s) => s.value === status);
    return found?.color || 'default';
  };

  // Get transaction type icon
  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'CASH_IN':
        return <Receipt />;
      case 'CASH_OUT':
        return <Payment />;
      case 'RECEIPT':
        return <Receipt />;
      case 'PAYMENT':
        return <Payment />;
      case 'REFUND':
        return <Timeline />;
      case 'ADJUSTMENT':
        return <BusinessCenter />;
      case 'TRANSFER':
        return <AccountBalance />;
      default:
        return <AccountBalance />;
    }
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error'>
          Failed to load cash transactions. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' gutterBottom>
          Cash Office Transactions
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Manage and monitor all cash office transactions, including receipts,
          payments, and adjustments.
        </Typography>
      </Box>

      {/* Actions Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2,
              alignItems: 'center',
            }}
          >
            <TextField
              fullWidth
              placeholder='Search transactions...'
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
              onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
            />
            <Stack direction='row' spacing={2} justifyContent='flex-end'>
              <Button
                variant='outlined'
                startIcon={<FilterList />}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
              <Button
                variant='outlined'
                startIcon={<Refresh />}
                onClick={() => refetch()}
              >
                Refresh
              </Button>
              <Button
                variant='contained'
                startIcon={<Add />}
                onClick={() =>
                  toast.success('Add transaction feature coming soon')
                }
              >
                New Transaction
              </Button>
            </Stack>
          </Box>

          {/* Filters */}
          {showFilters && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(6, 1fr)' },
                  gap: 2,
                }}
              >
                <FormControl fullWidth size='small'>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.transactionType}
                    onChange={(e) =>
                      handleFilterChange('transactionType', e.target.value)
                    }
                    label='Type'
                  >
                    <MenuItem value=''>All Types</MenuItem>
                    {transactionTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {/* <FormControl fullWidth size='small'>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category}
                    onChange={(e) =>
                      handleFilterChange('category', e.target.value)
                    }
                    label='Category'
                  >
                    <MenuItem value=''>All Categories</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl> */}
                <FormControl fullWidth size='small'>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange('status', e.target.value)
                    }
                    label='Status'
                  >
                    <MenuItem value=''>All Statuses</MenuItem>
                    {statuses.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {/* <FormControl fullWidth size='small'>
                  <InputLabel>Method</InputLabel>
                  <Select
                    value={filters.paymentMethod}
                    onChange={(e) =>
                      handleFilterChange('paymentMethod', e.target.value)
                    }
                    label='Method'
                  >
                    <MenuItem value=''>All Methods</MenuItem>
                    {paymentMethods.map((method) => (
                      <MenuItem key={method.value} value={method.value}>
                        {method.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl> */}
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label='Start Date'
                    value={filters.startDate}
                    onChange={(date) => handleFilterChange('startDate', date)}
                    slotProps={{
                      textField: { size: 'small', fullWidth: true },
                    }}
                  />
                </LocalizationProvider>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label='End Date'
                    value={filters.endDate}
                    onChange={(date) => handleFilterChange('endDate', date)}
                    slotProps={{
                      textField: { size: 'small', fullWidth: true },
                    }}
                  />
                </LocalizationProvider>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Stack direction='row' spacing={2}>
                  <Button variant='outlined' onClick={clearFilters}>
                    Clear Filters
                  </Button>
                  <Button variant='contained' onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </Stack>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent>
          <Box
            sx={{
              mb: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant='h6'>Transactions ({totalCount})</Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Transaction</TableCell>
                  <TableCell>Amount</TableCell>
                  {/* <TableCell>Category</TableCell>
                  <TableCell>Method</TableCell> */}
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
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
                        <Skeleton variant='text' width={80} height={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton
                          variant='rectangular'
                          width={60}
                          height={24}
                        />
                      </TableCell>
                      <TableCell>
                        <Skeleton
                          variant='rectangular'
                          width={60}
                          height={24}
                        />
                      </TableCell>
                      <TableCell>
                        <Skeleton
                          variant='rectangular'
                          width={60}
                          height={24}
                        />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant='text' width={80} height={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant='circular' width={32} height={32} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align='center' sx={{ py: 4 }}>
                      <Box textAlign='center'>
                        <Typography
                          variant='body1'
                          color='text.secondary'
                          gutterBottom
                        >
                          No transactions found
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {filters.search ||
                          filters.transactionType ||
                          filters.category ||
                          filters.status ||
                          filters.paymentMethod
                            ? 'Try adjusting your search or filters'
                            : 'No cash office transactions yet'}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id} hover>
                      <TableCell>
                        <Box display='flex' alignItems='center' gap={2}>
                          <Avatar
                            sx={{
                              bgcolor:
                                getTransactionTypeColor(
                                  transaction.transactionType
                                ) + '.main',
                            }}
                          >
                            {getTransactionTypeIcon(
                              transaction.transactionType
                            )}
                          </Avatar>
                          <Box>
                            <Typography variant='body2' fontWeight={500}>
                              {
                                transactionTypes.find(
                                  (t) => t.value === transaction.transactionType
                                )?.label
                              }
                            </Typography>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {transaction.description}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant='body2'
                          fontWeight={500}
                          color={
                            transaction.transactionType === 'CASH_IN' ||
                            transaction.transactionType === 'RECEIPT'
                              ? 'success.main'
                              : 'error.main'
                          }
                        >
                          {transaction.transactionType === 'CASH_IN' ||
                          transaction.transactionType === 'RECEIPT'
                            ? '+'
                            : '-'}
                          {formatCurrency(transaction.amount)}
                        </Typography>
                        {transaction.referenceNumber && (
                          <Typography variant='caption' color='text.secondary'>
                            Ref: {transaction.referenceNumber}
                          </Typography>
                        )}
                      </TableCell>
                      {/* <TableCell>
                        <Chip
                          label={
                            categories.find(
                              (c) => c.value === transaction.category
                            )?.label
                          }
                          size='small'
                          variant='outlined'
                        />
                      </TableCell> */}
                      {/* <TableCell>
                        <Chip
                          label={
                            paymentMethods.find(
                              (m) => m.value === transaction.paymentMethod
                            )?.label
                          }
                          size='small'
                          variant='outlined'
                        />
                      </TableCell> */}
                      <TableCell>
                        <Chip
                          label={
                            statuses.find((s) => s.value === transaction.status)
                              ?.label
                          }
                          color={
                            getStatusColor(transaction.status) as
                              | 'success'
                              | 'warning'
                              | 'error'
                              | 'default'
                          }
                          size='small'
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>
                          {formatDate(transaction.transactionDate)}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Tooltip title='More actions'>
                          <IconButton
                            onClick={(e) =>
                              handleActionMenuOpen(e, transaction)
                            }
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
        </CardContent>
      </Card>

      {/* Enhanced Transaction Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth='lg'
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <AccountBalance />
            </Avatar>
            <Box>
              <Typography variant='h6'>Transaction Details</Typography>
              {selectedTransaction && (
                <Typography variant='body2' color='text.secondary'>
                  {selectedTransaction.reference}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          {selectedTransaction && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Transaction Header */}
              <Box
                sx={{
                  p: 3,
                  bgcolor: 'primary.light',
                  borderRadius: 2,
                  color: 'white',
                  textAlign: 'center',
                }}
              >
                <Typography variant='h4' sx={{ mb: 1, fontWeight: 600 }}>
                  {formatCurrency(selectedTransaction.amount)}
                </Typography>
                <Typography variant='h6' sx={{ mb: 2 }}>
                  {
                    transactionTypes.find(
                      (t) => t.value === selectedTransaction.transactionType
                    )?.label
                  }
                </Typography>
                <Chip
                  label={
                    statuses.find((s) => s.value === selectedTransaction.status)
                      ?.label
                  }
                  color={
                    statuses.find((s) => s.value === selectedTransaction.status)
                      ?.color as any
                  }
                  variant='filled'
                  sx={{ color: 'white', fontWeight: 600 }}
                />
              </Box>

              {/* Main Transaction Information */}
              <Box
                sx={{
                  display: 'grid',
                  gap: 4,
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                }}
              >
                {/* Left Column - Basic Info */}
                <Box>
                  <Typography
                    variant='h6'
                    gutterBottom
                    sx={{
                      borderBottom: 2,
                      borderColor: 'primary.main',
                      pb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <BusinessCenter fontSize='small' />
                    Transaction Information
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      mt: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='subtitle2' color='text.secondary'>
                        Type
                      </Typography>
                      <Chip
                        label={
                          transactionTypes.find(
                            (t) =>
                              t.value === selectedTransaction.transactionType
                          )?.label
                        }
                        color={
                          transactionTypes.find(
                            (t) =>
                              t.value === selectedTransaction.transactionType
                          )?.color as any
                        }
                        size='small'
                        variant='outlined'
                      />
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='subtitle2' color='text.secondary'>
                        Category
                      </Typography>
                      <Typography variant='body1' fontWeight={500}>
                        {
                          categories.find(
                            (c) => c.value === selectedTransaction.category
                          )?.label
                        }
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='subtitle2' color='text.secondary'>
                        Payment Method
                      </Typography>
                      <Typography variant='body1' fontWeight={500}>
                        {
                          paymentMethods.find(
                            (m) => m.value === selectedTransaction.paymentMethod
                          )?.label
                        }
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='subtitle2' color='text.secondary'>
                        Currency
                      </Typography>
                      <Typography variant='body1' fontWeight={500}>
                        {selectedTransaction.currency}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Right Column - Dates & References */}
                <Box>
                  <Typography
                    variant='h6'
                    gutterBottom
                    sx={{
                      borderBottom: 2,
                      borderColor: 'primary.main',
                      pb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Timeline fontSize='small' />
                    Timeline & References
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      mt: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='subtitle2' color='text.secondary'>
                        Transaction Date
                      </Typography>
                      <Typography variant='body1' fontWeight={500}>
                        {formatDate(selectedTransaction.transactionDate)}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='subtitle2' color='text.secondary'>
                        Created
                      </Typography>
                      <Typography variant='body1' fontWeight={500}>
                        {formatDate(selectedTransaction.createdAt)}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='subtitle2' color='text.secondary'>
                        Last Updated
                      </Typography>
                      <Typography variant='body1' fontWeight={500}>
                        {formatDate(selectedTransaction.updatedAt)}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='subtitle2' color='text.secondary'>
                        Reference
                      </Typography>
                      <Typography
                        variant='body1'
                        fontWeight={500}
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {selectedTransaction.reference}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Description & Notes */}
              <Box>
                <Typography
                  variant='h6'
                  gutterBottom
                  sx={{
                    borderBottom: 2,
                    borderColor: 'primary.main',
                    pb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Receipt fontSize='small' />
                  Description & Notes
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Description
                  </Typography>
                  <Typography
                    variant='body1'
                    sx={{
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'grey.300',
                    }}
                  >
                    {selectedTransaction.description}
                  </Typography>
                </Box>

                {selectedTransaction.notes && (
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant='subtitle2'
                      color='text.secondary'
                      gutterBottom
                    >
                      Additional Notes
                    </Typography>
                    <Typography
                      variant='body1'
                      sx={{
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 1,
                        border: 1,
                        borderColor: 'grey.300',
                      }}
                    >
                      {selectedTransaction.notes}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Payment Method Details */}
              {selectedTransaction.paymentMethod === 'CHECK' &&
                selectedTransaction.checkNumber && (
                  <Box>
                    <Typography
                      variant='h6'
                      gutterBottom
                      sx={{
                        borderBottom: 2,
                        borderColor: 'primary.main',
                        pb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Payment fontSize='small' />
                      Check Details
                    </Typography>

                    <Box
                      sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                        mt: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant='subtitle2' color='text.secondary'>
                          Check Number
                        </Typography>
                        <Typography
                          variant='body1'
                          fontWeight={500}
                          sx={{ fontFamily: 'monospace' }}
                        >
                          {selectedTransaction.checkNumber}
                        </Typography>
                      </Box>

                      {selectedTransaction.bankName && (
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography
                            variant='subtitle2'
                            color='text.secondary'
                          >
                            Bank
                          </Typography>
                          <Typography variant='body1' fontWeight={500}>
                            {selectedTransaction.bankName}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}

              {/* Bank Transfer Details */}
              {selectedTransaction.paymentMethod === 'BANK_TRANSFER' && (
                <Box>
                  <Typography
                    variant='h6'
                    gutterBottom
                    sx={{
                      borderBottom: 2,
                      borderColor: 'primary.main',
                      pb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <AccountBalance fontSize='small' />
                    Bank Transfer Details
                  </Typography>

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                      mt: 2,
                    }}
                  >
                    {selectedTransaction.bankName && (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant='subtitle2' color='text.secondary'>
                          Bank Name
                        </Typography>
                        <Typography variant='body1' fontWeight={500}>
                          {selectedTransaction.bankName}
                        </Typography>
                      </Box>
                    )}

                    {selectedTransaction.accountNumber && (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant='subtitle2' color='text.secondary'>
                          Account Number
                        </Typography>
                        <Typography
                          variant='body1'
                          fontWeight={500}
                          sx={{ fontFamily: 'monospace' }}
                        >
                          {selectedTransaction.accountNumber}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {/* Processor Information */}
              {selectedTransaction.processor && (
                <Box>
                  <Typography
                    variant='h6'
                    gutterBottom
                    sx={{
                      borderBottom: 2,
                      borderColor: 'primary.main',
                      pb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <BusinessCenter fontSize='small' />
                    Processed By
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mt: 2,
                    }}
                  >
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      {selectedTransaction.processor.firstName?.charAt(0) ||
                        'U'}
                      {selectedTransaction.processor.lastName?.charAt(0) || 'K'}
                    </Avatar>
                    <Box>
                      <Typography variant='body1' fontWeight={500}>
                        {selectedTransaction.processor.firstName || 'Unknown'}{' '}
                        {selectedTransaction.processor.lastName || 'User'}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Transaction Processor
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Patient Information */}
              {selectedTransaction.patient && (
                <Box>
                  <Typography
                    variant='h6'
                    gutterBottom
                    sx={{
                      borderBottom: 2,
                      borderColor: 'primary.main',
                      pb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <BusinessCenter fontSize='small' />
                    Patient Information
                  </Typography>

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                      mt: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='subtitle2' color='text.secondary'>
                        Patient Name
                      </Typography>
                      <Typography variant='body1' fontWeight={500}>
                        {selectedTransaction.patient.firstName || 'Unknown'}{' '}
                        {selectedTransaction.patient.lastName || 'Patient'}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='subtitle2' color='text.secondary'>
                        Patient ID
                      </Typography>
                      <Typography
                        variant='body1'
                        fontWeight={500}
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {selectedTransaction.patient.patientId || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Invoice Information */}
              {selectedTransaction.invoice && (
                <Box>
                  <Typography
                    variant='h6'
                    gutterBottom
                    sx={{
                      borderBottom: 2,
                      borderColor: 'primary.main',
                      pb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Receipt fontSize='small' />
                    Invoice Information
                  </Typography>

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                      mt: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='subtitle2' color='text.secondary'>
                        Invoice Number
                      </Typography>
                      <Typography
                        variant='body1'
                        fontWeight={500}
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {selectedTransaction.invoice.invoiceNumber || 'N/A'}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='subtitle2' color='text.secondary'>
                        Total Amount
                      </Typography>
                      <Typography
                        variant='h6'
                        color='primary.main'
                        fontWeight={600}
                      >
                        {formatCurrency(
                          selectedTransaction.invoice.totalAmount || 0
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Receipt Information */}
              {selectedTransaction.receiptNumber && (
                <Box>
                  <Typography
                    variant='h6'
                    gutterBottom
                    sx={{
                      borderBottom: 2,
                      borderColor: 'primary.main',
                      pb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Receipt fontSize='small' />
                    Receipt Information
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='subtitle2' color='text.secondary'>
                        Receipt Number
                      </Typography>
                      <Typography
                        variant='body1'
                        fontWeight={500}
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {selectedTransaction.receiptNumber}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setDetailsDialogOpen(false)} color='inherit'>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <ListItemIcon>
            <Visibility fontSize='small' />
          </ListItemIcon>
          View Details
        </MenuItem>
        <MenuItem onClick={() => toast.success('Edit feature coming soon')}>
          <ListItemIcon>
            <Edit fontSize='small' />
          </ListItemIcon>
          Edit Transaction
        </MenuItem>

        <MenuItem
          onClick={() => toast.error('Delete feature coming soon')}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Delete fontSize='small' />
          </ListItemIcon>
          Delete Transaction
        </MenuItem>
      </Menu>
    </Box>
  );
}
