import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Receipt,
  Refresh,
  Timeline,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  cashReportsService,
  type CashReportFilters,
} from '../services/cashReports.service';
import { formatCurrency } from '../utils';

export default function CashReportsPage() {
  const [filters, setFilters] = useState<CashReportFilters>({});

  // Check if user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem('auth_token');
    return !!token;
  };

  // Generate report data
  const {
    data: reportData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['cash-reports', filters],
    queryFn: async () => {
      // Check authentication before making API call
      if (!isAuthenticated()) {
        throw new Error('Authentication required. Please login.');
      }

      try {
        return await cashReportsService.generateSummaryReport(filters);
      } catch (error: unknown) {
        // Ensure we always throw an error object that React Query can handle
        if (
          error &&
          typeof error === 'object' &&
          'response' in error &&
          (error as any).response?.status === 401
        ) {
          throw new Error('Authentication required. Please login.');
        }
        throw error;
      }
    },
    enabled: Object.keys(filters).length > 0 && isAuthenticated(),
    retry: (failureCount, error: unknown) => {
      // Don't retry on authentication errors
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        (error as any).message?.includes('Authentication required')
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Handle errors separately
  React.useEffect(() => {
    if (error) {
      // Handle authentication errors gracefully
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        (error as any).message?.includes('Authentication required')
      ) {
        // Redirect to login for auth errors
        window.location.href = '/login';
        return;
      }
      // Show other errors
      toast.error((error as any)?.message || 'Failed to load cash reports');
    }
  }, [error]);

  const handleFilterChange = (
    field: keyof CashReportFilters,
    value: string | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  const applyQuickDateRange = (range: 'today' | 'week' | 'month' | 'year') => {
    let dateRange;
    switch (range) {
      case 'today':
        dateRange = cashReportsService.getTodayRange();
        break;
      case 'week':
        dateRange = cashReportsService.getThisWeekRange();
        break;
      case 'month':
        dateRange = cashReportsService.getThisMonthRange();
        break;
      case 'year':
        dateRange = cashReportsService.getThisYearRange();
        break;
    }

    setFilters((prev) => ({
      ...prev,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error' sx={{ mb: 2 }}>
          Failed to load cash reports. Please try again.
        </Alert>
        <Button onClick={() => refetch()} variant='outlined'>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant='h4' component='h1'>
          Financial Reports & Analytics
        </Typography>
        <Stack direction='row' spacing={1}>
          <Button
            variant='outlined'
            startIcon={<Refresh />}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Filters Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 3 }}>
          <Typography variant='h6' sx={{ mb: 3, fontWeight: 600 }}>
            Quick Date Range
          </Typography>

          <Stack direction='row' spacing={2} sx={{ mb: 3 }}>
            <Button
              variant='outlined'
              onClick={() => applyQuickDateRange('today')}
              size='small'
            >
              Today
            </Button>
            <Button
              variant='outlined'
              onClick={() => applyQuickDateRange('week')}
              size='small'
            >
              This Week
            </Button>
            <Button
              variant='outlined'
              onClick={() => applyQuickDateRange('month')}
              size='small'
            >
              This Month
            </Button>
            <Button
              variant='outlined'
              onClick={() => applyQuickDateRange('year')}
              size='small'
            >
              This Year
            </Button>
          </Stack>

          <Typography variant='h6' sx={{ mb: 3, fontWeight: 600 }}>
            Additional Filters
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 1fr 1fr',
              },
              gap: 3,
            }}
          >
            <FormControl fullWidth size='medium' variant='outlined'>
              <InputLabel id='dept-label'>Department</InputLabel>
              <Select
                labelId='dept-label'
                value={filters.department || ''}
                label='Department'
                onChange={(e) =>
                  handleFilterChange('department', e.target.value)
                }
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                <MenuItem value=''>All Departments</MenuItem>
                <MenuItem value='Finance'>Finance</MenuItem>
                <MenuItem value='Pharmacy'>Pharmacy</MenuItem>
                <MenuItem value='Laboratory'>Laboratory</MenuItem>
                <MenuItem value='Radiology'>Radiology</MenuItem>
                <MenuItem value='Surgery'>Surgery</MenuItem>
                <MenuItem value='Consultation'>Consultation</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size='medium' variant='outlined'>
              <InputLabel id='type-label'>Transaction Type</InputLabel>
              <Select
                labelId='type-label'
                value={filters.transactionType || ''}
                label='Transaction Type'
                onChange={(e) =>
                  handleFilterChange('transactionType', e.target.value)
                }
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                <MenuItem value=''>All Types</MenuItem>
                <MenuItem value='CASH_IN'>Cash In</MenuItem>
                <MenuItem value='CASH_OUT'>Cash Out</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size='medium' variant='outlined'>
              <InputLabel id='method-label'>Payment Method</InputLabel>
              <Select
                labelId='method-label'
                value={filters.paymentMethod || ''}
                label='Payment Method'
                onChange={(e) =>
                  handleFilterChange('paymentMethod', e.target.value)
                }
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                <MenuItem value=''>All Methods</MenuItem>
                <MenuItem value='CASH'>Cash</MenuItem>
                <MenuItem value='CARD'>Card</MenuItem>
                <MenuItem value='BANK_TRANSFER'>Bank Transfer</MenuItem>
                <MenuItem value='CHECK'>Check</MenuItem>
              </Select>
            </FormControl>

            <FormControl
              fullWidth
              size='medium'
              variant='outlined'
              sx={{ gridColumn: { xs: '1', sm: '1 / -1', md: '1 / -1' } }}
            >
              <InputLabel id='status-label'>Status</InputLabel>
              <Select
                labelId='status-label'
                value={filters.status || ''}
                label='Status'
                onChange={(e) => handleFilterChange('status', e.target.value)}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                <MenuItem value=''>All Statuses</MenuItem>
                <MenuItem value='PENDING'>Pending</MenuItem>
                <MenuItem value='COMPLETED'>Completed</MenuItem>
                <MenuItem value='CANCELLED'>Cancelled</MenuItem>
                <MenuItem value='REVERSED'>Reversed</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box
            sx={{
              mt: 4,
              display: 'flex',
              gap: 2,
              pt: 2,
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Button
              variant='outlined'
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              size='medium'
            >
              Clear Filters
            </Button>
            <Button
              variant='contained'
              onClick={() => applyQuickDateRange('today')}
              size='medium'
              startIcon={<Timeline />}
            >
              Generate Report
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Main Content */}
      {isLoading ? (
        <Grid container spacing={3}>
          {[...Array(8)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant='rectangular' height={120} />
            </Grid>
          ))}
        </Grid>
      ) : reportData ? (
        <Grid container spacing={3}>
          {/* Key Metrics Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUp fontSize='large' />
                  <Box>
                    <Typography variant='h4' component='div'>
                      {formatCurrency(reportData.summary.totalRevenue)}
                    </Typography>
                    <Typography variant='body2'>Total Revenue</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingDown fontSize='large' />
                  <Box>
                    <Typography variant='h4' component='div'>
                      {formatCurrency(reportData.summary.totalExpenses)}
                    </Typography>
                    <Typography variant='body2'>Total Expenses</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AccountBalance fontSize='large' />
                  <Box>
                    <Typography variant='h4' component='div'>
                      {formatCurrency(reportData.summary.netCashFlow)}
                    </Typography>
                    <Typography variant='body2'>Net Cash Flow</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Receipt fontSize='large' />
                  <Box>
                    <Typography variant='h4' component='div'>
                      {reportData.summary.totalInvoices}
                    </Typography>
                    <Typography variant='body2'>Total Invoices</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Additional Metrics */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant='h6' color='text.secondary' gutterBottom>
                  Total Payments
                </Typography>
                <Typography variant='h4' component='div'>
                  {reportData.summary.totalPayments}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant='h6' color='text.secondary' gutterBottom>
                  Total Refunds
                </Typography>
                <Typography variant='h4' component='div'>
                  {formatCurrency(reportData.summary.totalRefunds)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant='h6' color='text.secondary' gutterBottom>
                  Total Transactions
                </Typography>
                <Typography variant='h4' component='div'>
                  {reportData.cashFlow.totalTransactions}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant='h6' color='text.secondary' gutterBottom>
                  Pending Amount
                </Typography>
                <Typography variant='h4' component='div'>
                  {formatCurrency(reportData.cashFlow.pendingAmount)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant='h6' color='text.secondary' gutterBottom>
            Ready to Generate Reports
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            Select a date range above to view financial reports and analytics.
          </Typography>
          <Button
            variant='contained'
            onClick={() => applyQuickDateRange('today')}
            startIcon={<Timeline />}
          >
            Generate Today's Report
          </Button>
        </Box>
      )}
    </Box>
  );
}
