import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Divider,
  CircularProgress,
  Stack,
  Avatar,
  Badge,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  FilterList,
  Search,
  Person,
  CalendarToday,
  Schedule,
  Block,
  Warning,
  Pending,
  Refresh,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { appointmentService } from '../services/appointment.service';
import type { ProviderTimeOff } from '../types';

const TimeOffManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const { staffMember, user, refreshUser } = useAuth();

  // Refresh user data on component mount to ensure we have latest staffMember info
  useEffect(() => {
    // Only refresh if we don't have staffMember data
    if (!staffMember) {
      refreshUser();
    }
  }, []); // Empty dependency array to run only once

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedRequest, setSelectedRequest] =
    useState<ProviderTimeOff | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  // Fetch all time off requests
  const {
    data: timeOffData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['all-timeoff-requests', searchQuery, statusFilter, typeFilter],
    queryFn: async () => {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      return await appointmentService.getAllProviderTimeOff(params);
    },
  });

  const timeOffRequests = timeOffData?.entries || [];

  // Approve time off request mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      // Only staff members can approve time off requests
      if (!staffMember) {
        throw new Error(
          'Only staff members can approve time off requests. Please ensure you have a staff member record.'
        );
      }

      return await appointmentService.approveProviderTimeOff(id, {
        approvedBy: staffMember.id,
        notes,
      });
    },
    onSuccess: () => {
      showSuccess('Time off request approved successfully');
      setApproveDialogOpen(false);
      setApprovalNotes('');
      queryClient.invalidateQueries({ queryKey: ['all-timeoff-requests'] });
      refetch();
    },
    onError: (error: unknown) => {
      showError(
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Failed to approve time off request'
      );
    },
  });

  // Reject time off request mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      // Only staff members can reject time off requests
      if (!staffMember) {
        throw new Error(
          'Only staff members can reject time off requests. Please ensure you have a staff member record.'
        );
      }

      return await appointmentService.rejectProviderTimeOff(id, {
        approvedBy: staffMember.id,
        notes,
      });
    },
    onSuccess: () => {
      showSuccess('Time off request rejected successfully');
      setRejectDialogOpen(false);
      setApprovalNotes('');
      queryClient.invalidateQueries({ queryKey: ['all-timeoff-requests'] });
      refetch();
    },
    onError: (error: unknown) => {
      showError(
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Failed to reject time off request'
      );
    },
  });

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle />;
      case 'REJECTED':
        return <Cancel />;
      case 'PENDING':
        return <Pending />;
      case 'CANCELLED':
        return <Block />;
      default:
        return <Warning />;
    }
  };

  const getRequestDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const timeOffTypes = [
    { value: 'VACATION', label: 'Vacation' },
    { value: 'SICK_LEAVE', label: 'Sick Leave' },
    { value: 'PERSONAL_LEAVE', label: 'Personal Leave' },
    { value: 'TRAINING', label: 'Training' },
    { value: 'CONFERENCE', label: 'Conference' },
    { value: 'OTHER', label: 'Other' },
  ];

  // Filter requests based on search and filters
  const filteredRequests = timeOffRequests.filter((request) => {
    const matchesSearch =
      request.provider?.firstName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      request.provider?.lastName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || request.status === statusFilter;
    const matchesType = !typeFilter || request.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Statistics
  const pendingCount = timeOffRequests.filter(
    (req) => req.status === 'PENDING'
  ).length;
  const approvedCount = timeOffRequests.filter(
    (req) => req.status === 'APPROVED'
  ).length;
  const rejectedCount = timeOffRequests.filter(
    (req) => req.status === 'REJECTED'
  ).length;

  // Event handlers
  const handleViewRequest = (request: ProviderTimeOff) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleApproveRequest = (request: ProviderTimeOff) => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
  };

  const handleRejectRequest = (request: ProviderTimeOff) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  const handleConfirmApprove = () => {
    if (!selectedRequest) return;
    approveMutation.mutate({
      id: selectedRequest.id,
      notes: approvalNotes,
    });
  };

  const handleConfirmReject = () => {
    if (!selectedRequest) return;
    rejectMutation.mutate({
      id: selectedRequest.id,
      notes: approvalNotes,
    });
  };

  // Check if user has permission to manage time off
  const canManageTimeOff =
    user?.permissions?.includes('admin') ||
    user?.permissions?.includes('manage_timeoff') ||
    user?.permissions?.includes('hr_management');

  if (!canManageTimeOff) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='warning'>
          You don't have permission to access time off management. Please
          contact your administrator.
        </Alert>
      </Box>
    );
  }

  // Check if user has staff member record (required for approve/reject actions)
  if (canManageTimeOff && !staffMember) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error'>
          You have permission to view time off management, but you need a staff
          member record to approve or reject requests. Please contact your
          administrator to set up your staff member profile.
        </Alert>
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
        <Typography variant='h4' sx={{ fontWeight: 600 }}>
          Time Off Management
        </Typography>
        <Button
          variant='outlined'
          startIcon={<Refresh />}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Pending />
                </Avatar>
                <Box>
                  <Typography variant='h4' sx={{ fontWeight: 600 }}>
                    {pendingCount}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Pending Requests
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant='h4' sx={{ fontWeight: 600 }}>
                    {approvedCount}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Approved This Month
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <Cancel />
                </Avatar>
                <Box>
                  <Typography variant='h4' sx={{ fontWeight: 600 }}>
                    {rejectedCount}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Rejected This Month
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {/* Search Field */}
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                placeholder='Search by provider name or reason...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: 'text.secondary' }} />
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '56px',
                  },
                }}
              />
            </Box>

            {/* Status Filter */}
            <Box sx={{ flex: '0 1 200px', minWidth: '200px' }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label='Status'
                  sx={{
                    height: '56px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      height: '56px',
                    },
                    '& .MuiSelect-select': {
                      height: '56px',
                      display: 'flex',
                      alignItems: 'center',
                      paddingTop: '16px',
                      paddingBottom: '16px',
                    },
                  }}
                >
                  <MenuItem value=''>All Statuses</MenuItem>
                  <MenuItem value='PENDING'>Pending</MenuItem>
                  <MenuItem value='APPROVED'>Approved</MenuItem>
                  <MenuItem value='REJECTED'>Rejected</MenuItem>
                  <MenuItem value='CANCELLED'>Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Type Filter */}
            <Box sx={{ flex: '0 1 200px', minWidth: '200px' }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label='Type'
                  sx={{
                    height: '56px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      height: '56px',
                    },
                    '& .MuiSelect-select': {
                      height: '56px',
                      display: 'flex',
                      alignItems: 'center',
                      paddingTop: '16px',
                      paddingBottom: '16px',
                    },
                  }}
                >
                  <MenuItem value=''>All Types</MenuItem>
                  {timeOffTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Clear Filters Button */}
            <Box sx={{ flex: '0 1 180px', minWidth: '180px' }}>
              <Button
                fullWidth
                variant='outlined'
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                  setTypeFilter('');
                }}
                sx={{
                  height: '56px',
                  minWidth: '180px',
                  whiteSpace: 'nowrap',
                  '& .MuiButton-startIcon': {
                    marginRight: '8px',
                  },
                }}
              >
                Clear Filters
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Time Off Requests Table */}
      <Card>
        <CardHeader
          title={`Time Off Requests (${filteredRequests.length})`}
          subheader='Review and manage time off requests from all providers'
        />
        <CardContent>
          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              Error loading time off requests: {error.message}
            </Alert>
          )}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredRequests.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Provider</TableCell>
                    <TableCell>Date Range</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Requested</TableCell>
                    <TableCell align='right'>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} hover>
                      <TableCell>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: 'primary.main',
                            }}
                          >
                            {request.provider?.firstName?.[0]}
                            {request.provider?.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography
                              variant='body2'
                              sx={{ fontWeight: 500 }}
                            >
                              {request.provider?.firstName}{' '}
                              {request.provider?.lastName}
                            </Typography>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {request.provider?.department}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 500 }}>
                            {formatDate(request.startDate)}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            to {formatDate(request.endDate)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>
                          {getRequestDuration(
                            request.startDate,
                            request.endDate
                          )}{' '}
                          day(s)
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            timeOffTypes.find((t) => t.value === request.type)
                              ?.label || request.type
                          }
                          size='small'
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>
                          {request.reason}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(request.status)}
                          label={request.status}
                          color={getStatusColor(request.status)}
                          size='small'
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>
                          {formatDate(request.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 0.5,
                            justifyContent: 'flex-end',
                          }}
                        >
                          <Tooltip title='View Details'>
                            <IconButton
                              size='small'
                              onClick={() => handleViewRequest(request)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          {request.status === 'PENDING' && (
                            <>
                              <Tooltip title='Approve Request'>
                                <IconButton
                                  size='small'
                                  color='success'
                                  onClick={() => handleApproveRequest(request)}
                                >
                                  <CheckCircle />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title='Reject Request'>
                                <IconButton
                                  size='small'
                                  color='error'
                                  onClick={() => handleRejectRequest(request)}
                                >
                                  <Cancel />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant='h6' color='text.secondary'>
                No time off requests found
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {searchQuery || statusFilter || typeFilter
                  ? 'Try adjusting your search criteria'
                  : 'No time off requests have been submitted yet'}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* View Request Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Time Off Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
            >
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Provider
                  </Typography>
                  <Typography variant='body1'>
                    {selectedRequest.provider?.firstName}{' '}
                    {selectedRequest.provider?.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Department
                  </Typography>
                  <Typography variant='body1'>
                    {selectedRequest.provider?.department}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Start Date
                  </Typography>
                  <Typography variant='body1'>
                    {formatDate(selectedRequest.startDate)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    End Date
                  </Typography>
                  <Typography variant='body1'>
                    {formatDate(selectedRequest.endDate)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Duration
                  </Typography>
                  <Typography variant='body1'>
                    {getRequestDuration(
                      selectedRequest.startDate,
                      selectedRequest.endDate
                    )}{' '}
                    day(s)
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Type
                  </Typography>
                  <Chip
                    label={
                      timeOffTypes.find((t) => t.value === selectedRequest.type)
                        ?.label || selectedRequest.type
                    }
                    size='small'
                    variant='outlined'
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Reason
                  </Typography>
                  <Typography variant='body1'>
                    {selectedRequest.reason}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Status
                  </Typography>
                  <Chip
                    icon={getStatusIcon(selectedRequest.status)}
                    label={selectedRequest.status}
                    color={getStatusColor(selectedRequest.status)}
                    size='small'
                  />
                </Grid>
                {selectedRequest.notes && (
                  <Grid item xs={12}>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Notes
                    </Typography>
                    <Typography variant='body1'>
                      {selectedRequest.notes}
                    </Typography>
                  </Grid>
                )}
                {selectedRequest.approvedBy && (
                  <Grid item xs={6}>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Approved By
                    </Typography>
                    <Typography variant='body1'>
                      {selectedRequest.approvedBy}
                    </Typography>
                  </Grid>
                )}
                {selectedRequest.approvedAt && (
                  <Grid item xs={6}>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Approved At
                    </Typography>
                    <Typography variant='body1'>
                      {formatDate(selectedRequest.approvedAt)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Approve Request Dialog */}
      <Dialog
        open={approveDialogOpen}
        onClose={() => setApproveDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Approve Time Off Request</DialogTitle>
        <DialogContent>
          <Alert severity='success' sx={{ mb: 2 }}>
            You are about to approve this time off request.
          </Alert>
          {selectedRequest && (
            <Box sx={{ mb: 2 }}>
              <Typography variant='body2' color='text.secondary'>
                <strong>
                  {selectedRequest.provider?.firstName}{' '}
                  {selectedRequest.provider?.lastName}
                </strong>{' '}
                has requested time off from{' '}
                <strong>{formatDate(selectedRequest.startDate)}</strong> to{' '}
                <strong>{formatDate(selectedRequest.endDate)}</strong>
              </Typography>
              <Typography variant='body2' sx={{ mt: 1 }}>
                <strong>Reason:</strong> {selectedRequest.reason}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label='Approval Notes (Optional)'
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder='Add any notes about this approval...'
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setApproveDialogOpen(false)}
            disabled={approveMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color='success'
            onClick={handleConfirmApprove}
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? 'Approving...' : 'Approve Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Request Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Reject Time Off Request</DialogTitle>
        <DialogContent>
          <Alert severity='warning' sx={{ mb: 2 }}>
            You are about to reject this time off request.
          </Alert>
          {selectedRequest && (
            <Box sx={{ mb: 2 }}>
              <Typography variant='body2' color='text.secondary'>
                <strong>
                  {selectedRequest.provider?.firstName}{' '}
                  {selectedRequest.provider?.lastName}
                </strong>{' '}
                has requested time off from{' '}
                <strong>{formatDate(selectedRequest.startDate)}</strong> to{' '}
                <strong>{formatDate(selectedRequest.endDate)}</strong>
              </Typography>
              <Typography variant='body2' sx={{ mt: 1 }}>
                <strong>Reason:</strong> {selectedRequest.reason}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label='Rejection Notes (Required)'
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder='Please provide a reason for rejection...'
            required
            error={!approvalNotes && rejectMutation.isPending}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setRejectDialogOpen(false)}
            disabled={rejectMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleConfirmReject}
            disabled={rejectMutation.isPending || !approvalNotes}
          >
            {rejectMutation.isPending ? 'Rejecting...' : 'Reject Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimeOffManagementPage;
