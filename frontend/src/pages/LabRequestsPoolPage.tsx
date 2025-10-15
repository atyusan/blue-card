import React, { useState } from 'react';
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
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  TablePagination,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search,
  FilterList,
  Science,
  CheckCircle,
  PlayArrow,
  Assignment,
  Person,
  LocalHospital,
  Warning,
  Error as ErrorIcon,
  Info,
} from '@mui/icons-material';
import {
  labRequestService,
  type LabRequest,
  type CompleteLabRequestDto,
} from '../services/lab-request.service';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatDate, getInitials } from '@/utils';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';

const LabRequestsPoolPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { staffMember } = useAuth();
  const { showSuccess, showError } = useToast();
  const theme = useTheme();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialog states
  const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(
    null
  );
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [results, setResults] = useState<
    Array<{
      resultType: string;
      resultValue: string;
      normalRange: string;
      unit: string;
      status: 'PENDING' | 'COMPLETED' | 'CRITICAL' | 'CANCELLED';
      notes: string;
    }>
  >([
    {
      resultType: '',
      resultValue: '',
      normalRange: '',
      unit: '',
      status: 'COMPLETED',
      notes: '',
    },
  ]);

  // Fetch lab requests pool
  const {
    data: poolRequests,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['lab-requests-pool', urgencyFilter, statusFilter],
    queryFn: () =>
      labRequestService.getLabRequestsPool({
        urgency: urgencyFilter || undefined,
        status: statusFilter || undefined,
      }),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch assigned requests
  const { data: assignedRequests } = useQuery({
    queryKey: ['lab-requests-assigned', staffMember?.id],
    queryFn: () => labRequestService.getAssignedLabRequests(staffMember!.id),
    enabled: !!staffMember?.id,
    refetchInterval: 30000,
  });

  // Claim mutation
  const claimMutation = useMutation({
    mutationFn: (requestId: string) =>
      labRequestService.claimLabRequest(requestId, staffMember!.id),
    onSuccess: () => {
      showSuccess('Lab request claimed successfully');
      queryClient.invalidateQueries({ queryKey: ['lab-requests-pool'] });
      queryClient.invalidateQueries({ queryKey: ['lab-requests-assigned'] });
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to claim lab request');
    },
  });

  // Start mutation
  const startMutation = useMutation({
    mutationFn: (requestId: string) =>
      labRequestService.startLabRequest(requestId),
    onSuccess: () => {
      showSuccess('Lab test started');
      queryClient.invalidateQueries({ queryKey: ['lab-requests-assigned'] });
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to start lab test');
    },
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: (data: { id: string; dto: CompleteLabRequestDto }) =>
      labRequestService.completeLabRequest(data.id, data.dto),
    onSuccess: () => {
      showSuccess('Lab test completed successfully');
      queryClient.invalidateQueries({ queryKey: ['lab-requests-assigned'] });
      queryClient.invalidateQueries({ queryKey: ['lab-requests-pool'] });
      queryClient.invalidateQueries({ queryKey: ['lab-requests'] });
      setCompleteDialogOpen(false);
      setSelectedRequest(null);
      setResults([
        {
          resultType: '',
          resultValue: '',
          normalRange: '',
          unit: '',
          status: 'COMPLETED',
          notes: '',
        },
      ]);
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to complete lab test');
    },
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

  const handleClaimRequest = (request: LabRequest) => {
    claimMutation.mutate(request.id);
  };

  const handleStartTest = (request: LabRequest) => {
    startMutation.mutate(request.id);
  };

  const handleCompleteOpen = (request: LabRequest) => {
    setSelectedRequest(request);
    setCompleteDialogOpen(true);
  };

  const handleAddResult = () => {
    setResults([
      ...results,
      {
        resultType: '',
        resultValue: '',
        normalRange: '',
        unit: '',
        status: 'COMPLETED',
        notes: '',
      },
    ]);
  };

  const handleRemoveResult = (index: number) => {
    setResults(results.filter((_, i) => i !== index));
  };

  const handleResultChange = (index: number, field: string, value: string) => {
    const newResults = [...results];
    newResults[index] = { ...newResults[index], [field]: value };
    setResults(newResults);
  };

  const handleCompleteSubmit = () => {
    if (!selectedRequest) return;

    const validResults = results.filter((r) => r.resultType && r.resultValue);
    if (validResults.length === 0) {
      showError('Please add at least one result with type and value');
      return;
    }

    completeMutation.mutate({
      id: selectedRequest.id,
      dto: {
        results: validResults,
        labProviderId: staffMember?.id,
      },
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'STAT':
        return 'error';
      case 'URGENT':
        return 'warning';
      case 'ROUTINE':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return 'info';
      case 'CLAIMED':
        return 'primary';
      case 'IN_PROGRESS':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredPoolRequests =
    poolRequests?.filter((request) => {
      if (!searchQuery) return true;
      const search = searchQuery.toLowerCase();
      return (
        request.testName?.toLowerCase().includes(search) ||
        request.testType?.toLowerCase().includes(search) ||
        request.treatment?.patient?.firstName?.toLowerCase().includes(search) ||
        request.treatment?.patient?.lastName?.toLowerCase().includes(search) ||
        request.treatment?.patient?.patientId?.toLowerCase().includes(search)
      );
    }) || [];

  const paginatedPoolRequests = filteredPoolRequests.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (isLoading) {
    return (
      <Box>
        <PageHeader title='Lab Requests Pool' breadcrumbs={<Breadcrumb />} />
        <Card>
          <Box p={3}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={60} sx={{ mb: 1 }} />
            ))}
          </Box>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title='Lab Requests Pool'
        subtitle={`${filteredPoolRequests.length} requests available`}
        breadcrumbs={<Breadcrumb />}
        onRefresh={() => refetch()}
        showActions={true}
      />

      {/* My Assigned Requests */}
      {assignedRequests && assignedRequests.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <Box p={3}>
            <Typography variant='h6' gutterBottom fontWeight={600}>
              My Assigned Requests ({assignedRequests.length})
            </Typography>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}
            >
              {assignedRequests.map((request) => (
                <Card
                  key={request.id}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        alignItems: 'center',
                        flex: 1,
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: 'primary.main',
                          width: 48,
                          height: 48,
                        }}
                      >
                        <Science />
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant='subtitle1' fontWeight={600}>
                          {request.testName}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 1,
                            alignItems: 'center',
                            mt: 0.5,
                          }}
                        >
                          <Chip
                            label={request.testType}
                            size='small'
                            color='info'
                            variant='outlined'
                          />
                          <Chip
                            label={request.urgency}
                            size='small'
                            color={getUrgencyColor(request.urgency) as any}
                          />
                          <Chip
                            label={request.status}
                            size='small'
                            color={getStatusColor(request.status) as any}
                          />
                          <Typography variant='caption' color='text.secondary'>
                            Patient: {request.treatment?.patient?.firstName}{' '}
                            {request.treatment?.patient?.lastName} (
                            {request.treatment?.patient?.patientId})
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {request.status === 'CLAIMED' && (
                        <Button
                          size='small'
                          variant='contained'
                          color='warning'
                          startIcon={<PlayArrow />}
                          onClick={() => handleStartTest(request)}
                          sx={{ borderRadius: 2 }}
                        >
                          Start Test
                        </Button>
                      )}
                      {request.status === 'IN_PROGRESS' && (
                        <Button
                          size='small'
                          variant='contained'
                          color='success'
                          startIcon={<CheckCircle />}
                          onClick={() => handleCompleteOpen(request)}
                          sx={{ borderRadius: 2 }}
                        >
                          Complete
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
          </Box>
        </Card>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <Box p={3}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              size='small'
              placeholder='Search patient or test...'
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
              <InputLabel>Urgency</InputLabel>
              <Select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                label='Urgency'
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='STAT'>STAT</MenuItem>
                <MenuItem value='URGENT'>Urgent</MenuItem>
                <MenuItem value='ROUTINE'>Routine</MenuItem>
              </Select>
            </FormControl>
            <FormControl size='small' sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label='Status'
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='REQUESTED'>Requested</MenuItem>
                <MenuItem value='IN_PROGRESS'>In Progress</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Card>

      {/* Lab Requests Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Test Details</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Requested By</TableCell>
                <TableCell>Urgency</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested</TableCell>
                <TableCell align='right'>Actions</TableCell>
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
              ) : paginatedPoolRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Alert severity='info' sx={{ borderRadius: 2 }}>
                      No lab requests available in the pool
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPoolRequests.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant='body2' fontWeight={600}>
                          {request.testName}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {request.testType}
                          {request.specimenType && ` - ${request.specimenType}`}
                        </Typography>
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
                            `${request.treatment?.patient?.firstName} ${request.treatment?.patient?.lastName}`
                          )}
                        </Avatar>
                        <Box>
                          <Typography variant='body2' fontWeight={600}>
                            {request.treatment?.patient?.firstName}{' '}
                            {request.treatment?.patient?.lastName}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {request.treatment?.patient?.patientId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        Dr. {request.requestingProvider?.user?.firstName}{' '}
                        {request.requestingProvider?.user?.lastName}
                      </Typography>
                      {request.requestingProvider?.specialization && (
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          display='block'
                        >
                          {request.requestingProvider.specialization}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.urgency}
                        size='small'
                        color={getUrgencyColor(request.urgency) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.status}
                        size='small'
                        color={getStatusColor(request.status) as any}
                        variant='outlined'
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {formatDate(request.requestedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      {request.status === 'REQUESTED' && (
                        <Button
                          size='small'
                          variant='contained'
                          startIcon={<Assignment />}
                          onClick={() => handleClaimRequest(request)}
                          disabled={claimMutation.isPending}
                          sx={{ borderRadius: 2 }}
                        >
                          Claim
                        </Button>
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
          count={filteredPoolRequests.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

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
                {selectedRequest?.testName} - {selectedRequest?.testType}
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
              <Typography variant='body2' fontWeight={600}>
                {selectedRequest?.treatment?.patient?.firstName}{' '}
                {selectedRequest?.treatment?.patient?.lastName}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Patient ID: {selectedRequest?.treatment?.patient?.patientId}
              </Typography>
              {selectedRequest?.treatment?.patient?.email && (
                <Typography variant='caption' display='block'>
                  Email: {selectedRequest?.treatment?.patient?.email}
                </Typography>
              )}
              {selectedRequest?.treatment?.patient?.phoneNumber && (
                <Typography variant='caption' display='block'>
                  Phone: {selectedRequest?.treatment?.patient?.phoneNumber}
                </Typography>
              )}
            </Alert>

            {/* Test Results */}
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant='subtitle1' fontWeight={600}>
                  Test Results
                </Typography>
                <Button
                  size='small'
                  startIcon={<Science />}
                  onClick={handleAddResult}
                  sx={{ borderRadius: 2 }}
                >
                  Add Result
                </Button>
              </Box>

              {results.map((result, index) => (
                <Card
                  key={index}
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='subtitle2' fontWeight={600}>
                        Result #{index + 1}
                      </Typography>
                      {results.length > 1 && (
                        <IconButton
                          size='small'
                          onClick={() => handleRemoveResult(index)}
                          color='error'
                        >
                          <FilterList />
                        </IconButton>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <FormControl fullWidth required>
                        <InputLabel>Result Type</InputLabel>
                        <Select
                          value={result.resultType}
                          onChange={(e) =>
                            handleResultChange(
                              index,
                              'resultType',
                              e.target.value
                            )
                          }
                          label='Result Type'
                          sx={{ borderRadius: 2 }}
                        >
                          {/* Hematology */}
                          <MenuItem value='WBC'>
                            White Blood Cell Count (WBC)
                          </MenuItem>
                          <MenuItem value='RBC'>
                            Red Blood Cell Count (RBC)
                          </MenuItem>
                          <MenuItem value='Hemoglobin'>
                            Hemoglobin (Hb)
                          </MenuItem>
                          <MenuItem value='Hematocrit'>
                            Hematocrit (Hct)
                          </MenuItem>
                          <MenuItem value='Platelets'>Platelet Count</MenuItem>
                          <MenuItem value='MCV'>
                            Mean Corpuscular Volume (MCV)
                          </MenuItem>
                          <MenuItem value='MCH'>
                            Mean Corpuscular Hemoglobin (MCH)
                          </MenuItem>
                          <MenuItem value='MCHC'>
                            Mean Corpuscular Hemoglobin Concentration (MCHC)
                          </MenuItem>

                          {/* Biochemistry */}
                          <MenuItem value='Glucose'>Blood Glucose</MenuItem>
                          <MenuItem value='HbA1c'>Hemoglobin A1C</MenuItem>
                          <MenuItem value='Creatinine'>Creatinine</MenuItem>
                          <MenuItem value='BUN'>
                            Blood Urea Nitrogen (BUN)
                          </MenuItem>
                          <MenuItem value='Sodium'>Sodium</MenuItem>
                          <MenuItem value='Potassium'>Potassium</MenuItem>
                          <MenuItem value='Chloride'>Chloride</MenuItem>
                          <MenuItem value='Calcium'>Calcium</MenuItem>
                          <MenuItem value='Magnesium'>Magnesium</MenuItem>

                          {/* Liver Function */}
                          <MenuItem value='ALT'>
                            Alanine Aminotransferase (ALT)
                          </MenuItem>
                          <MenuItem value='AST'>
                            Aspartate Aminotransferase (AST)
                          </MenuItem>
                          <MenuItem value='ALP'>
                            Alkaline Phosphatase (ALP)
                          </MenuItem>
                          <MenuItem value='Bilirubin_Total'>
                            Total Bilirubin
                          </MenuItem>
                          <MenuItem value='Bilirubin_Direct'>
                            Direct Bilirubin
                          </MenuItem>
                          <MenuItem value='Albumin'>Albumin</MenuItem>
                          <MenuItem value='Total_Protein'>
                            Total Protein
                          </MenuItem>

                          {/* Lipids */}
                          <MenuItem value='Cholesterol_Total'>
                            Total Cholesterol
                          </MenuItem>
                          <MenuItem value='HDL'>HDL Cholesterol</MenuItem>
                          <MenuItem value='LDL'>LDL Cholesterol</MenuItem>
                          <MenuItem value='Triglycerides'>
                            Triglycerides
                          </MenuItem>

                          {/* Thyroid */}
                          <MenuItem value='TSH'>
                            Thyroid Stimulating Hormone (TSH)
                          </MenuItem>
                          <MenuItem value='T3'>T3 (Triiodothyronine)</MenuItem>
                          <MenuItem value='T4'>T4 (Thyroxine)</MenuItem>

                          {/* Cardiac */}
                          <MenuItem value='Troponin'>Troponin</MenuItem>
                          <MenuItem value='CK_MB'>CK-MB</MenuItem>
                          <MenuItem value='BNP'>
                            B-type Natriuretic Peptide (BNP)
                          </MenuItem>

                          {/* Other */}
                          <MenuItem value='CRP'>
                            C-Reactive Protein (CRP)
                          </MenuItem>
                          <MenuItem value='ESR'>
                            Erythrocyte Sedimentation Rate (ESR)
                          </MenuItem>
                          <MenuItem value='D_Dimer'>D-Dimer</MenuItem>
                          <MenuItem value='PSA'>
                            Prostate Specific Antigen (PSA)
                          </MenuItem>
                          <MenuItem value='pH'>pH Level</MenuItem>
                          <MenuItem value='Other'>Other</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        fullWidth
                        required
                        label='Result Value'
                        placeholder='e.g., 150'
                        value={result.resultValue}
                        onChange={(e) =>
                          handleResultChange(
                            index,
                            'resultValue',
                            e.target.value
                          )
                        }
                        sx={{ borderRadius: 2 }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        fullWidth
                        label='Normal Range'
                        placeholder='e.g., 70-110'
                        value={result.normalRange}
                        onChange={(e) =>
                          handleResultChange(
                            index,
                            'normalRange',
                            e.target.value
                          )
                        }
                        sx={{ borderRadius: 2 }}
                      />
                      <FormControl fullWidth>
                        <InputLabel>Unit</InputLabel>
                        <Select
                          value={result.unit}
                          onChange={(e) =>
                            handleResultChange(index, 'unit', e.target.value)
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
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={result.status}
                          onChange={(e) =>
                            handleResultChange(index, 'status', e.target.value)
                          }
                          label='Status'
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value='COMPLETED'>Normal</MenuItem>
                          <MenuItem value='CRITICAL'>Critical</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label='Notes'
                      placeholder='Additional observations'
                      value={result.notes}
                      onChange={(e) =>
                        handleResultChange(index, 'notes', e.target.value)
                      }
                      sx={{ borderRadius: 2 }}
                    />
                  </Stack>
                </Card>
              ))}
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
            onClick={handleCompleteSubmit}
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
    </Box>
  );
};

export default LabRequestsPoolPage;
