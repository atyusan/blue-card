import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  Typography,
  TablePagination,
  Alert,
  Skeleton,
  Grid,
  Paper,
} from '@mui/material';
import {
  Search,
  Science,
  CheckCircle,
  HourglassEmpty,
  Cancel as CancelIcon,
  MedicalServices,
  LocalHospital,
  Assignment,
  Paid,
  Biotech,
} from '@mui/icons-material';
import { usePermissions } from '@/hooks/usePermissions';
import { formatDate, formatCurrency } from '@/utils';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import {
  labTestService,
  type UnifiedLabTest,
} from '../services/lab-test.service';

const LabTestsPage: React.FC = () => {
  const { canViewLabTests } = usePermissions();
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  // Fetch all lab tests from both sources
  const {
    data: labTests,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['lab-tests-all', statusFilter, sourceFilter, paymentFilter],
    queryFn: () =>
      labTestService.getAllLabTests({
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        isPaid:
          paymentFilter === 'paid'
            ? true
            : paymentFilter === 'unpaid'
            ? false
            : undefined,
      }),
    enabled: canViewLabTests(),
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (
    status: string
  ):
    | 'warning'
    | 'info'
    | 'success'
    | 'error'
    | 'default'
    | 'primary'
    | 'secondary' => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'CLAIMED':
        return 'info';
      case 'IN_PROGRESS':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <HourglassEmpty fontSize='small' />;
      case 'CLAIMED':
        return <Assignment fontSize='small' />;
      case 'IN_PROGRESS':
        return <Biotech fontSize='small' />;
      case 'COMPLETED':
        return <CheckCircle fontSize='small' />;
      case 'CANCELLED':
        return <CancelIcon fontSize='small' />;
      default:
        return <Science fontSize='small' />;
    }
  };

  const handleRowClick = (test: UnifiedLabTest) => {
    // Navigate to appropriate detail page based on test type
    if (test.type === 'LAB_TEST' && test.orderId) {
      navigate(`/lab/orders/${test.orderId}`);
    } else if (test.type === 'LAB_REQUEST' && test.treatmentId) {
      navigate(`/treatments/${test.treatmentId}`);
    }
  };

  const filteredTests =
    labTests?.filter((test) => {
      if (!searchQuery) return true;
      const search = searchQuery.toLowerCase();
      return (
        test.testName?.toLowerCase().includes(search) ||
        test.patient?.firstName?.toLowerCase().includes(search) ||
        test.patient?.lastName?.toLowerCase().includes(search) ||
        test.patient?.patientId?.toLowerCase().includes(search)
      );
    }) || [];

  const paginatedTests = filteredTests.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Calculate statistics
  const stats = {
    total: filteredTests.length,
    external: filteredTests.filter((t) => t.source === 'EXTERNAL').length,
    treatment: filteredTests.filter((t) => t.source === 'TREATMENT').length,
    pending: filteredTests.filter((t) => t.status === 'PENDING').length,
    inProgress: filteredTests.filter(
      (t) => t.status === 'IN_PROGRESS' || t.status === 'CLAIMED'
    ).length,
    completed: filteredTests.filter((t) => t.status === 'COMPLETED').length,
    paid: filteredTests.filter((t) => t.isPaid).length,
    unpaid: filteredTests.filter((t) => !t.isPaid && t.requirePayment).length,
  };

  if (!canViewLabTests()) {
    return (
      <Box>
        <PageHeader title='Lab Tests' breadcrumbs={<Breadcrumb />} />
        <Alert severity='error' sx={{ borderRadius: 2 }}>
          You don't have permission to view lab tests.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title='Lab Tests - Administrative Monitoring'
        subtitle='Unified view of all lab tests from external orders and treatment appointments'
        breadcrumbs={<Breadcrumb />}
        onRefresh={() => refetch()}
        showActions={true}
      />

      {/* Statistics Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Science fontSize='large' />
              <Box>
                <Typography variant='h4' fontWeight={700}>
                  {stats.total}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.9 }}>
                  Total Tests
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LocalHospital fontSize='large' />
              <Box>
                <Typography variant='h4' fontWeight={700}>
                  {stats.external}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.9 }}>
                  External Orders
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MedicalServices fontSize='large' />
              <Box>
                <Typography variant='h4' fontWeight={700}>
                  {stats.treatment}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.9 }}>
                  Treatment-Based
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircle fontSize='large' />
              <Box>
                <Typography variant='h4' fontWeight={700}>
                  {stats.completed}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.9 }}>
                  Completed
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Status Overview */}
      <Card sx={{ mb: 3, p: 3 }}>
        <Typography variant='h6' gutterBottom>
          Status Overview
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box>
              <Typography variant='h5' color='warning.main' fontWeight={600}>
                {stats.pending}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Pending
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box>
              <Typography variant='h5' color='info.main' fontWeight={600}>
                {stats.inProgress}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                In Progress
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box>
              <Typography variant='h5' color='success.main' fontWeight={600}>
                {stats.paid}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Paid
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box>
              <Typography variant='h5' color='error.main' fontWeight={600}>
                {stats.unpaid}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Unpaid
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <Box p={3}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              size='small'
              placeholder='Search test or patient...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250, borderRadius: 2 }}
            />
            <FormControl size='small' sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label='Status'
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='PENDING'>Pending</MenuItem>
                <MenuItem value='CLAIMED'>Claimed</MenuItem>
                <MenuItem value='IN_PROGRESS'>In Progress</MenuItem>
                <MenuItem value='COMPLETED'>Completed</MenuItem>
                <MenuItem value='CANCELLED'>Cancelled</MenuItem>
              </Select>
            </FormControl>
            <FormControl size='small' sx={{ minWidth: 150 }}>
              <InputLabel>Source</InputLabel>
              <Select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                label='Source'
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='EXTERNAL'>External</MenuItem>
                <MenuItem value='TREATMENT'>Treatment</MenuItem>
              </Select>
            </FormControl>
            <FormControl size='small' sx={{ minWidth: 150 }}>
              <InputLabel>Payment</InputLabel>
              <Select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                label='Payment'
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='paid'>Paid</MenuItem>
                <MenuItem value='unpaid'>Unpaid</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Card>

      {/* Lab Tests Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Test Name</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Requested By</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={8}>
                      <Skeleton height={60} />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedTests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Alert severity='info' sx={{ borderRadius: 2 }}>
                      No lab tests found
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTests.map((test) => (
                  <TableRow
                    key={test.id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => handleRowClick(test)}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Science fontSize='small' color='action' />
                        <Box>
                          <Typography variant='body2' fontWeight={600}>
                            {test.testName}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {test.testType}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={test.source}
                        size='small'
                        color={
                          test.source === 'EXTERNAL' ? 'secondary' : 'primary'
                        }
                        icon={
                          test.source === 'EXTERNAL' ? (
                            <LocalHospital fontSize='small' />
                          ) : (
                            <MedicalServices fontSize='small' />
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant='body2' fontWeight={600}>
                          {test.patient.firstName} {test.patient.lastName}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {test.patient.patientId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {test.requestedBy ? (
                        <Typography variant='body2'>
                          Dr. {test.requestedBy.user.firstName}{' '}
                          {test.requestedBy.user.lastName}
                        </Typography>
                      ) : (
                        <Typography variant='body2' color='text.secondary'>
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(test.status)}
                        label={test.status.replace('_', ' ')}
                        color={getStatusColor(test.status)}
                        size='small'
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Chip
                          icon={<Paid fontSize='small' />}
                          label={test.isPaid ? 'Paid' : 'Unpaid'}
                          color={test.isPaid ? 'success' : 'error'}
                          size='small'
                        />
                        {test.invoice && (
                          <Typography variant='caption' color='text.secondary'>
                            {test.invoice.invoiceNumber}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' fontWeight={600}>
                        {formatCurrency(test.totalPrice)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {formatDate(test.createdAt)}
                      </Typography>
                      {test.completedAt && (
                        <Typography variant='caption' color='text.secondary'>
                          Completed: {formatDate(test.completedAt)}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component='div'
          count={filteredTests.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
    </Box>
  );
};

export default LabTestsPage;
