import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Stack,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Science,
  CheckCircle,
  PlayArrow,
  Cancel,
  Person,
  Assignment,
  Biotech,
  Timer,
  Done,
  Info,
} from '@mui/icons-material';
import { formatDate, formatCurrency } from '@/utils';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import {
  labTestPoolService,
  type LabTestPool,
  type CompleteTestData,
} from '../services/lab-test-pool.service';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { alpha, useTheme } from '@mui/material/styles';

type TabValue = 'available' | 'my-tests';

export default function LabTestPoolPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabValue>('available');
  const [selectedTest, setSelectedTest] = useState<LabTestPool | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [resultData, setResultData] = useState<Partial<CompleteTestData>>({});
  const [cancelReason, setCancelReason] = useState('');

  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuth();
  const theme = useTheme();

  const technicianId =
    (user as { staffMember?: { id: string } })?.staffMember?.id || '';

  // Query for available tests
  const { data: availableTests = [], isLoading: loadingAvailable } = useQuery({
    queryKey: ['lab-test-pool', 'available', statusFilter],
    queryFn: () =>
      labTestPoolService.getAvailableTests(statusFilter || undefined),
    enabled: activeTab === 'available',
  });

  // Query for my tests
  const { data: myTests = [], isLoading: loadingMy } = useQuery({
    queryKey: ['lab-test-pool', 'my-tests', technicianId, statusFilter],
    queryFn: () =>
      labTestPoolService.getMyTests(technicianId, statusFilter || undefined),
    enabled: activeTab === 'my-tests' && !!technicianId,
  });

  // Claim test mutation
  const claimMutation = useMutation({
    mutationFn: (testId: string) =>
      labTestPoolService.claimTest(testId, technicianId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-test-pool'] });
      showToast('Test claimed successfully', 'success');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      showToast(err.response?.data?.message || 'Failed to claim test', 'error');
    },
  });

  // Start test mutation
  const startMutation = useMutation({
    mutationFn: (testId: string) =>
      labTestPoolService.startTest(testId, technicianId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-test-pool'] });
      showToast('Test started successfully', 'success');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      showToast(err.response?.data?.message || 'Failed to start test', 'error');
    },
  });

  // Complete test mutation
  const completeMutation = useMutation({
    mutationFn: ({
      testId,
      data,
    }: {
      testId: string;
      data: CompleteTestData;
    }) => labTestPoolService.completeTest(testId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-test-pool'] });
      setCompleteDialogOpen(false);
      setSelectedTest(null);
      setResultData({});
      showToast('Test completed successfully', 'success');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      showToast(
        err.response?.data?.message || 'Failed to complete test',
        'error'
      );
    },
  });

  // Cancel test mutation
  const cancelMutation = useMutation({
    mutationFn: ({ testId, reason }: { testId: string; reason: string }) =>
      labTestPoolService.cancelTest(testId, technicianId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-test-pool'] });
      setCancelDialogOpen(false);
      setSelectedTest(null);
      setCancelReason('');
      showToast('Test cancelled successfully', 'success');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      showToast(
        err.response?.data?.message || 'Failed to cancel test',
        'error'
      );
    },
  });

  const tests = activeTab === 'available' ? availableTests : myTests;
  const isLoading = activeTab === 'available' ? loadingAvailable : loadingMy;

  // Filter tests based on search query
  const filteredTests = tests.filter((test) => {
    const query = searchQuery.toLowerCase();
    return (
      test.service.name.toLowerCase().includes(query) ||
      test.order.patient.firstName.toLowerCase().includes(query) ||
      test.order.patient.lastName.toLowerCase().includes(query) ||
      test.order.patient.patientId.toLowerCase().includes(query)
    );
  });

  // Paginate tests
  const paginatedTests = filteredTests.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
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
    switch (status.toUpperCase()) {
      case 'PENDING':
        return <Timer />;
      case 'CLAIMED':
        return <Assignment />;
      case 'IN_PROGRESS':
        return <Biotech />;
      case 'COMPLETED':
        return <Done />;
      case 'CANCELLED':
        return <Cancel />;
      default:
        return <Info />;
    }
  };

  const handleClaimTest = (testId: string) => {
    if (!technicianId) {
      showToast('Staff member information not found', 'error');
      return;
    }
    claimMutation.mutate(testId);
  };

  const handleStartTest = (testId: string) => {
    startMutation.mutate(testId);
  };

  const handleOpenCompleteDialog = (test: LabTestPool) => {
    setSelectedTest(test);
    setCompleteDialogOpen(true);
  };

  const handleCompleteTest = () => {
    if (!selectedTest) return;

    // Validate required fields
    if (!resultData.resultValue || !resultData.resultValue.trim()) {
      showToast('Please enter a result value', 'error');
      return;
    }

    const data: CompleteTestData = {
      technicianId,
      ...resultData,
    };

    completeMutation.mutate({
      testId: selectedTest.id,
      data,
    });
  };

  const handleOpenCancelDialog = (test: LabTestPool) => {
    setSelectedTest(test);
    setCancelDialogOpen(true);
  };

  const handleCancelTest = () => {
    if (!selectedTest || !cancelReason.trim()) {
      showToast('Please provide a reason for cancellation', 'error');
      return;
    }

    cancelMutation.mutate({
      testId: selectedTest.id,
      reason: cancelReason,
    });
  };

  return (
    <Box>
      <PageHeader title='Lab Test Pool' breadcrumbs={<Breadcrumb />} />

      <Stack spacing={3}>
        {/* Info Alert */}
        <Alert severity='info' sx={{ borderRadius: 2 }}>
          <Typography variant='body2' fontWeight={600} gutterBottom>
            Lab Test Pool - External Orders
          </Typography>
          <Typography variant='body2'>
            This pool contains tests from paid lab orders (not tied to
            treatments). Claim a test to start processing, attach results when
            complete.
          </Typography>
        </Alert>

        {/* Tabs */}
        <Card sx={{ borderRadius: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_e, value) => {
              setActiveTab(value);
              setPage(0);
            }}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              label={`Available Tests (${availableTests.length})`}
              value='available'
              icon={<Science />}
              iconPosition='start'
            />
            <Tab
              label={`My Tests (${myTests.length})`}
              value='my-tests'
              icon={<Person />}
              iconPosition='start'
            />
          </Tabs>

          <Box p={3}>
            {/* Filters */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
              <TextField
                placeholder='Search by test name, patient name, or ID...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size='small'
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ borderRadius: 2 }}
              />
              <FormControl size='small' sx={{ minWidth: 200 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label='Status'
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value=''>All</MenuItem>
                  <MenuItem value='PENDING'>Pending</MenuItem>
                  <MenuItem value='CLAIMED'>Claimed</MenuItem>
                  <MenuItem value='IN_PROGRESS'>In Progress</MenuItem>
                  <MenuItem value='COMPLETED'>Completed</MenuItem>
                  <MenuItem value='CANCELLED'>Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {/* Tests Table */}
            {isLoading ? (
              <Typography textAlign='center' py={4}>
                Loading...
              </Typography>
            ) : filteredTests.length === 0 ? (
              <Box textAlign='center' py={6}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    margin: '0 auto 16px',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                  }}
                >
                  <Science fontSize='large' />
                </Avatar>
                <Typography variant='h6' color='text.secondary' gutterBottom>
                  No Tests Found
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {activeTab === 'available'
                    ? 'No tests available to claim at the moment'
                    : 'You have no assigned tests'}
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Patient</TableCell>
                        <TableCell>Test Name</TableCell>
                        <TableCell>Ordered By</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align='right'>Price</TableCell>
                        <TableCell>Order Date</TableCell>
                        <TableCell align='center'>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedTests.map((test) => (
                        <TableRow key={test.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant='body2' fontWeight={600}>
                                {test.order.patient.firstName}{' '}
                                {test.order.patient.lastName}
                              </Typography>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                ID: {test.order.patient.patientId}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2' fontWeight={600}>
                              {test.service.name}
                            </Typography>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {test.service.category}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2'>
                              Dr. {test.order.doctor.user.firstName}{' '}
                              {test.order.doctor.user.lastName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={test.status}
                              color={getStatusColor(test.status)}
                              icon={getStatusIcon(test.status)}
                              size='small'
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell align='right'>
                            <Typography variant='body2' fontWeight={600}>
                              {formatCurrency(test.totalPrice)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='caption'>
                              {formatDate(test.order.orderDate)}
                            </Typography>
                          </TableCell>
                          <TableCell align='center'>
                            <Stack
                              direction='row'
                              spacing={1}
                              justifyContent='center'
                            >
                              {test.status === 'PENDING' &&
                                activeTab === 'available' && (
                                  <Tooltip title='Claim Test'>
                                    <IconButton
                                      size='small'
                                      color='primary'
                                      onClick={() => handleClaimTest(test.id)}
                                    >
                                      <Assignment />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              {test.status === 'CLAIMED' &&
                                activeTab === 'my-tests' && (
                                  <>
                                    <Tooltip title='Start Test'>
                                      <IconButton
                                        size='small'
                                        color='success'
                                        onClick={() => handleStartTest(test.id)}
                                      >
                                        <PlayArrow />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title='Cancel'>
                                      <IconButton
                                        size='small'
                                        color='error'
                                        onClick={() =>
                                          handleOpenCancelDialog(test)
                                        }
                                      >
                                        <Cancel />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                              {test.status === 'IN_PROGRESS' &&
                                activeTab === 'my-tests' && (
                                  <>
                                    <Tooltip title='Complete Test'>
                                      <IconButton
                                        size='small'
                                        color='success'
                                        onClick={() =>
                                          handleOpenCompleteDialog(test)
                                        }
                                      >
                                        <CheckCircle />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title='Cancel'>
                                      <IconButton
                                        size='small'
                                        color='error'
                                        onClick={() =>
                                          handleOpenCancelDialog(test)
                                        }
                                      >
                                        <Cancel />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component='div'
                  count={filteredTests.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            )}
          </Box>
        </Card>
      </Stack>

      {/* Complete Test Dialog */}
      <Dialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.success.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle sx={{ color: 'success.main', fontSize: 28 }} />
            </Box>
            <Box flex={1}>
              <Typography variant='h6' fontWeight={600}>
                Complete Lab Test
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {selectedTest?.service.name}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            {/* Patient Info */}
            <Alert severity='info' sx={{ borderRadius: 2 }}>
              <Typography variant='body2' fontWeight={600} gutterBottom>
                Patient Information
              </Typography>
              <Typography variant='body2'>
                {selectedTest?.order.patient.firstName}{' '}
                {selectedTest?.order.patient.lastName}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                ID: {selectedTest?.order.patient.patientId}
              </Typography>
            </Alert>

            {/* Test Result */}
            <Box>
              <Typography variant='subtitle1' fontWeight={600} gutterBottom>
                Test Result
              </Typography>
              <Card
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      fullWidth
                      required
                      label='Result Value'
                      placeholder='e.g., 95'
                      value={resultData.resultValue || ''}
                      onChange={(e) =>
                        setResultData({
                          ...resultData,
                          resultValue: e.target.value,
                        })
                      }
                      sx={{ borderRadius: 2 }}
                    />
                    <FormControl fullWidth>
                      <InputLabel>Unit</InputLabel>
                      <Select
                        value={resultData.resultUnit || ''}
                        onChange={(e) =>
                          setResultData({
                            ...resultData,
                            resultUnit: e.target.value,
                          })
                        }
                        label='Unit'
                        sx={{ borderRadius: 2 }}
                      >
                        {/* Concentration */}
                        <MenuItem value='mg/dL'>
                          mg/dL (milligrams per deciliter)
                        </MenuItem>
                        <MenuItem value='g/dL'>
                          g/dL (grams per deciliter)
                        </MenuItem>
                        <MenuItem value='mmol/L'>
                          mmol/L (millimoles per liter)
                        </MenuItem>
                        <MenuItem value='µmol/L'>
                          µmol/L (micromoles per liter)
                        </MenuItem>
                        <MenuItem value='ng/mL'>
                          ng/mL (nanograms per milliliter)
                        </MenuItem>
                        <MenuItem value='pg/mL'>
                          pg/mL (picograms per milliliter)
                        </MenuItem>
                        <MenuItem value='µg/dL'>
                          µg/dL (micrograms per deciliter)
                        </MenuItem>
                        <MenuItem value='µg/L'>
                          µg/L (micrograms per liter)
                        </MenuItem>

                        {/* Count */}
                        <MenuItem value='cells/µL'>
                          cells/µL (cells per microliter)
                        </MenuItem>
                        <MenuItem value='x10³/µL'>
                          x10³/µL (thousands per microliter)
                        </MenuItem>
                        <MenuItem value='x10⁶/µL'>
                          x10⁶/µL (millions per microliter)
                        </MenuItem>
                        <MenuItem value='x10⁹/L'>
                          x10⁹/L (billions per liter)
                        </MenuItem>

                        {/* Electrolytes */}
                        <MenuItem value='mEq/L'>
                          mEq/L (milliequivalents per liter)
                        </MenuItem>

                        {/* Percentage */}
                        <MenuItem value='%'>% (percentage)</MenuItem>

                        {/* Pressure */}
                        <MenuItem value='mmHg'>
                          mmHg (millimeters of mercury)
                        </MenuItem>

                        {/* Time */}
                        <MenuItem value='seconds'>seconds</MenuItem>
                        <MenuItem value='minutes'>minutes</MenuItem>

                        {/* Enzyme Activity */}
                        <MenuItem value='U/L'>U/L (units per liter)</MenuItem>
                        <MenuItem value='IU/L'>
                          IU/L (international units per liter)
                        </MenuItem>

                        {/* Other */}
                        <MenuItem value='ratio'>ratio</MenuItem>
                        <MenuItem value='mm/hr'>
                          mm/hr (millimeters per hour)
                        </MenuItem>
                        <MenuItem value='Other'>Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <TextField
                    fullWidth
                    label='Reference Range'
                    placeholder='e.g., 70-100'
                    value={resultData.referenceRange || ''}
                    onChange={(e) =>
                      setResultData({
                        ...resultData,
                        referenceRange: e.target.value,
                      })
                    }
                    sx={{ borderRadius: 2 }}
                  />

                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={resultData.isCritical ? 'CRITICAL' : 'COMPLETED'}
                      label='Status'
                      onChange={(e) =>
                        setResultData({
                          ...resultData,
                          isCritical: e.target.value === 'CRITICAL',
                        })
                      }
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value='COMPLETED'>Normal</MenuItem>
                      <MenuItem value='CRITICAL'>Critical</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label='Notes'
                    placeholder='Additional observations'
                    value={resultData.notes || ''}
                    onChange={(e) =>
                      setResultData({ ...resultData, notes: e.target.value })
                    }
                    sx={{ borderRadius: 2 }}
                  />
                </Stack>
              </Card>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setCompleteDialogOpen(false)}
            variant='outlined'
            sx={{ borderRadius: 2 }}
            disabled={completeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCompleteTest}
            variant='contained'
            color='success'
            disabled={completeMutation.isPending}
            startIcon={<CheckCircle />}
            sx={{ borderRadius: 2 }}
          >
            {completeMutation.isPending ? 'Submitting...' : 'Submit Results'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Test Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Cancel Test</DialogTitle>
        <DialogContent>
          <Alert severity='warning' sx={{ mb: 2, borderRadius: 2 }}>
            Are you sure you want to cancel this test? This action cannot be
            undone.
          </Alert>
          <TextField
            label='Cancellation Reason'
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder='Please provide a reason for cancellation...'
            required
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCancelDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Close
          </Button>
          <Button
            onClick={handleCancelTest}
            variant='contained'
            color='error'
            startIcon={<Cancel />}
            sx={{ borderRadius: 2 }}
          >
            Cancel Test
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
