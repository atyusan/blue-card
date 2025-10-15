import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  Avatar,
  Stack,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Search,
  Warning,
  Science,
  Visibility,
  AccessTime,
  LocalHospital,
} from '@mui/icons-material';
import { usePermissions } from '@/hooks/usePermissions';
import { formatDate, getInitials } from '@/utils';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import { labRequestService } from '../services/lab-request.service';

const LabResultsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { canViewLabResults } = usePermissions();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('COMPLETED');
  const [typeFilter, setTypeFilter] = useState<
    'ALL' | 'LAB_REQUEST' | 'LAB_TEST'
  >('ALL');

  // Fetch all lab results from both lab orders and lab requests
  const {
    data: allResults,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['all-lab-results', statusFilter],
    queryFn: () =>
      labRequestService.getAllLabResults({
        status: statusFilter || undefined,
      }),
    enabled: canViewLabResults(),
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

  const filteredResults =
    allResults?.filter((result) => {
      // Filter by search query
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        const matchesSearch =
          result.testName?.toLowerCase().includes(search) ||
          result.testType?.toLowerCase().includes(search) ||
          result.patient?.firstName?.toLowerCase().includes(search) ||
          result.patient?.lastName?.toLowerCase().includes(search) ||
          result.patient?.patientId?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Filter by type
      if (typeFilter !== 'ALL' && result.type !== typeFilter) {
        return false;
      }

      // Only show results with actual data
      return result.hasResults;
    }) || [];

  const paginatedResults = filteredResults.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (!canViewLabResults()) {
    return (
      <Box>
        <PageHeader title='Lab Results' breadcrumbs={<Breadcrumb />} />
        <Alert severity='error' sx={{ borderRadius: 2 }}>
          You don't have permission to view lab results.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title='Lab Results'
        subtitle={`${filteredResults.length} results available`}
        breadcrumbs={<Breadcrumb />}
        onRefresh={() => refetch()}
        showActions={true}
      />

      {/* Statistics Summary */}
      {allResults && allResults.length > 0 && (
        <Card
          sx={{
            mb: 3,
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
              Results Overview
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
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
                  textAlign: 'center',
                }}
              >
                <Typography variant='caption' color='text.secondary'>
                  Total Results
                </Typography>
                <Typography variant='h3' fontWeight={700} color='primary'>
                  {allResults.filter((r) => r.hasResults).length}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  textAlign: 'center',
                }}
              >
                <Typography variant='caption' color='text.secondary'>
                  Treatment Tests
                </Typography>
                <Typography variant='h3' fontWeight={700} color='primary.main'>
                  {
                    allResults.filter(
                      (r) => r.type === 'LAB_REQUEST' && r.hasResults
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
                  textAlign: 'center',
                }}
              >
                <Typography variant='caption' color='text.secondary'>
                  External Orders
                </Typography>
                <Typography
                  variant='h3'
                  fontWeight={700}
                  color='secondary.main'
                >
                  {
                    allResults.filter(
                      (r) => r.type === 'LAB_TEST' && r.hasResults
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
                  textAlign: 'center',
                }}
              >
                <Typography variant='caption' color='text.secondary'>
                  Critical Results
                </Typography>
                <Typography variant='h3' fontWeight={700} color='error.main'>
                  {allResults.filter((r) => r.isCritical).length}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <Box p={3}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              size='small'
              placeholder='Search patient or test...'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
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
              <InputLabel>Source</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as typeof typeFilter);
                  setPage(0);
                }}
                label='Source'
              >
                <MenuItem value='ALL'>All Sources</MenuItem>
                <MenuItem value='LAB_REQUEST'>Treatment Tests</MenuItem>
                <MenuItem value='LAB_TEST'>External Orders</MenuItem>
              </Select>
            </FormControl>
            <FormControl size='small' sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                label='Status'
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='COMPLETED'>Completed</MenuItem>
                <MenuItem value='IN_PROGRESS'>In Progress</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Card>

      {/* Lab Results Table */}
      <Card sx={{ borderRadius: 3 }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow
                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}
              >
                <TableCell>
                  <Typography variant='subtitle2' fontWeight={700}>
                    Test Information
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant='subtitle2' fontWeight={700}>
                    Patient
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant='subtitle2' fontWeight={700}>
                    Requested By
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant='subtitle2' fontWeight={700}>
                    Processed By
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant='subtitle2' fontWeight={700}>
                    Results
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant='subtitle2' fontWeight={700}>
                    Status
                  </Typography>
                </TableCell>
                <TableCell align='center'>
                  <Typography variant='subtitle2' fontWeight={700}>
                    Actions
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={7}>
                      <Skeleton height={60} />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Alert severity='info' sx={{ borderRadius: 2 }}>
                      No lab results found
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedResults.map((result) => {
                  const isCritical =
                    result.isCritical ||
                    (result.results &&
                      result.results.some((r: any) => r.status === 'CRITICAL'));

                  return (
                    <TableRow
                      key={result.id}
                      sx={{
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.02),
                        },
                        bgcolor: isCritical
                          ? alpha(theme.palette.error.main, 0.05)
                          : 'inherit',
                      }}
                    >
                      <TableCell>
                        <Box
                          sx={{ display: 'flex', gap: 2, alignItems: 'center' }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: isCritical ? 'error.main' : 'info.main',
                              width: 40,
                              height: 40,
                            }}
                          >
                            <Science />
                          </Avatar>
                          <Box>
                            <Typography variant='body2' fontWeight={600}>
                              {result.testName}
                            </Typography>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {result.testType}
                            </Typography>
                            {result.type && (
                              <Chip
                                label={
                                  result.type === 'LAB_REQUEST'
                                    ? 'Treatment'
                                    : 'External'
                                }
                                size='small'
                                sx={{ ml: 1, height: 18, fontSize: '0.65rem' }}
                                color={
                                  result.type === 'LAB_REQUEST'
                                    ? 'primary'
                                    : 'secondary'
                                }
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: 'primary.main',
                              fontSize: '0.875rem',
                            }}
                          >
                            {getInitials(
                              `${result.patient?.firstName || ''} ${
                                result.patient?.lastName || ''
                              }`
                            )}
                          </Avatar>
                          <Box>
                            <Typography variant='body2' fontWeight={600}>
                              {result.patient?.firstName}{' '}
                              {result.patient?.lastName}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <LocalHospital fontSize='small' color='action' />
                          <Typography variant='body2'>
                            Dr. {result.requestedBy?.user?.firstName}{' '}
                            {result.requestedBy?.user?.lastName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {result.labTechnician ? (
                          <Typography variant='body2'>
                            {result.labTechnician.user?.firstName}{' '}
                            {result.labTechnician.user?.lastName}
                          </Typography>
                        ) : (
                          <Typography variant='body2' color='text.secondary'>
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box>
                          {result.type === 'LAB_REQUEST' ? (
                            <>
                              <Typography variant='body2' fontWeight={600}>
                                {result.results?.length || 0} result
                                {result.results?.length !== 1 ? 's' : ''}
                              </Typography>
                              {isCritical && (
                                <Chip
                                  label='Has Critical'
                                  size='small'
                                  color='error'
                                  icon={<Warning />}
                                  sx={{ mt: 0.5 }}
                                />
                              )}
                            </>
                          ) : (
                            <>
                              <Typography variant='body2' fontWeight={600}>
                                {result.resultValue} {result.resultUnit}
                              </Typography>
                              {result.referenceRange && (
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                  display='block'
                                >
                                  Range: {result.referenceRange}
                                </Typography>
                              )}
                              {isCritical && (
                                <Chip
                                  label='CRITICAL'
                                  size='small'
                                  color='error'
                                  icon={<Warning />}
                                  sx={{ mt: 0.5 }}
                                />
                              )}
                            </>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Chip
                            label={result.status}
                            size='small'
                            color='success'
                            variant='outlined'
                          />
                          {result.completedAt && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              <AccessTime
                                sx={{ fontSize: 14, color: 'text.secondary' }}
                              />
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                {formatDate(result.completedAt)}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align='center'>
                        <Tooltip title='View Details'>
                          <IconButton
                            size='small'
                            color='primary'
                            onClick={() => {
                              if (result.type === 'LAB_REQUEST') {
                                navigate(`/lab/results/${result.id}`);
                              } else {
                                navigate(`/lab/orders/${result.orderId}`);
                              }
                            }}
                            sx={{ borderRadius: 2 }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {filteredResults.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component='div'
            count={filteredResults.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Card>
    </Box>
  );
};

export default LabResultsPage;
