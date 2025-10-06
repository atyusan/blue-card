import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  CalendarToday,
  Schedule,
  Block,
  CheckCircle,
  Warning,
  Pending,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/context/ToastContext';
import { appointmentService } from '../../services/appointment.service';
import type { StaffMember } from '../../services/staff.service';
import type { ProviderTimeOff } from '../../types';

interface TimeOffRequestsProps {
  provider: StaffMember | null;
  onRefresh: () => void;
}

// Use the existing ProviderTimeOff type from the types file
type TimeOffRequest = ProviderTimeOff;

const TimeOffRequests: React.FC<TimeOffRequestsProps> = ({
  provider,
  onRefresh,
}) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(
    null
  );
  const [newRequest, setNewRequest] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    type: 'VACATION',
    notes: '',
  });

  // Fetch time off requests from API
  const {
    data: timeOffData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['provider-timeoff', provider?.id],
    queryFn: async () => {
      if (!provider)
        return { entries: [], total: 0, page: 1, limit: 50, totalPages: 0 };
      return await appointmentService.getAllProviderTimeOff({
        providerId: provider.id,
      });
    },
    enabled: !!provider,
  });

  const timeOffRequests = timeOffData?.entries || [];

  // Create time off request mutation
  const createTimeOffMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!provider) throw new Error('No provider selected');
      return await appointmentService.createProviderTimeOff({
        providerId: provider.id,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        type: data.type,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      showSuccess('Time off request created successfully');
      setCreateDialogOpen(false);
      setNewRequest({
        startDate: '',
        endDate: '',
        reason: '',
        type: 'VACATION',
        notes: '',
      });
      queryClient.invalidateQueries({
        queryKey: ['provider-timeoff', provider?.id],
      });
      onRefresh();
    },
    onError: (error: unknown) => {
      showError(
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Failed to create time off request'
      );
    },
  });

  // Update time off request mutation
  const updateTimeOffMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await appointmentService.updateProviderTimeOff(id, data);
    },
    onSuccess: () => {
      showSuccess('Time off request updated successfully');
      queryClient.invalidateQueries({
        queryKey: ['provider-timeoff', provider?.id],
      });
      onRefresh();
    },
    onError: (error: unknown) => {
      showError(
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Failed to update time off request'
      );
    },
  });

  // Delete time off request mutation
  const deleteTimeOffMutation = useMutation({
    mutationFn: async (id: string) => {
      return await appointmentService.deleteProviderTimeOff(id);
    },
    onSuccess: () => {
      showSuccess('Time off request deleted successfully');
      queryClient.invalidateQueries({
        queryKey: ['provider-timeoff', provider?.id],
      });
      onRefresh();
    },
    onError: (error: unknown) => {
      showError(
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Failed to delete time off request'
      );
    },
  });

  const timeOffTypes = [
    { value: 'VACATION', label: 'Vacation' },
    { value: 'SICK_LEAVE', label: 'Sick Leave' },
    { value: 'PERSONAL_LEAVE', label: 'Personal Leave' },
    { value: 'TRAINING', label: 'Training' },
    { value: 'CONFERENCE', label: 'Conference' },
    { value: 'OTHER', label: 'Other' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle />;
      case 'REJECTED':
        return <Block />;
      case 'PENDING':
        return <Pending />;
      default:
        return <Schedule />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleCreateRequest = () => {
    setCreateDialogOpen(true);
  };

  const handleViewRequest = (request: TimeOffRequest) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleSubmitRequest = () => {
    if (!newRequest.startDate || !newRequest.endDate || !newRequest.reason) {
      showError('Please fill in all required fields');
      return;
    }

    createTimeOffMutation.mutate(newRequest);
  };

  const handleCancelRequest = (requestId: string) => {
    deleteTimeOffMutation.mutate(requestId);
  };

  const getRequestDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const upcomingRequests = timeOffRequests.filter(
    (req) => new Date(req.startDate) >= new Date() && req.status === 'APPROVED'
  );

  const pendingRequests = timeOffRequests.filter(
    (req) => req.status === 'PENDING'
  );

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <CalendarToday fontSize='small' />
                </Box>
                <Box>
                  <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    {upcomingRequests.length}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Upcoming Time Off
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
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'warning.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <Pending fontSize='small' />
                </Box>
                <Box>
                  <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    {pendingRequests.length}
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
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <CheckCircle fontSize='small' />
                </Box>
                <Box>
                  <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    {
                      timeOffRequests.filter((req) => req.status === 'APPROVED')
                        .length
                    }
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Approved This Year
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Time Off Requests Table */}
      <Card>
        <CardHeader
          title='Time Off Requests'
          subheader='Manage your time off requests and view their status'
          action={
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={handleCreateRequest}
              disabled={!provider}
            >
              Request Time Off
            </Button>
          }
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
          ) : timeOffRequests.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date Range</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Requested</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timeOffRequests.map((request) => (
                    <TableRow key={request.id} hover>
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
                          {formatDate(request.requestedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title='View Details'>
                            <IconButton
                              size='small'
                              onClick={() => handleViewRequest(request)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          {request.status === 'PENDING' && (
                            <Tooltip title='Cancel Request'>
                              <IconButton
                                size='small'
                                color='error'
                                onClick={() => handleCancelRequest(request.id)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity='info'>
              No time off requests found. Create a new request to get started.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Create Request Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Request Time Off</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label='Start Date'
                  type='date'
                  value={newRequest.startDate}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, startDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label='End Date'
                  type='date'
                  value={newRequest.endDate}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, endDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={newRequest.type}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, type: e.target.value })
                    }
                    label='Type'
                  >
                    {timeOffTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label='Reason'
                  value={newRequest.reason}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, reason: e.target.value })
                  }
                  fullWidth
                  required
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label='Additional Notes (Optional)'
                  value={newRequest.notes}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, notes: e.target.value })
                  }
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>

            {newRequest.startDate && newRequest.endDate && (
              <Alert severity='info'>
                Duration:{' '}
                {getRequestDuration(newRequest.startDate, newRequest.endDate)}{' '}
                day(s)
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCreateDialogOpen(false)}
            disabled={createTimeOffMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={handleSubmitRequest}
            disabled={
              createTimeOffMutation.isPending ||
              !newRequest.startDate ||
              !newRequest.endDate ||
              !newRequest.reason
            }
          >
            {createTimeOffMutation.isPending
              ? 'Submitting...'
              : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Request Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth='sm'
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
                <Grid item xs={12}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Requested At
                  </Typography>
                  <Typography variant='body1'>
                    {formatDate(selectedRequest.requestedAt)}
                  </Typography>
                </Grid>
                {selectedRequest.approvedBy && (
                  <Grid item xs={12}>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Approved By
                    </Typography>
                    <Typography variant='body1'>
                      {selectedRequest.approvedBy} on{' '}
                      {selectedRequest.approvedAt &&
                        formatDate(selectedRequest.approvedAt)}
                    </Typography>
                  </Grid>
                )}
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
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimeOffRequests;
