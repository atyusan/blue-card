import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Menu,
  ListItemIcon,
  Avatar,
  Skeleton,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  FilterList,
  MoreVert,
  Visibility,
  Edit,
  CheckCircle,
  Cancel,
  Warning,
  Schedule,
  CancelOutlined,
  DeleteOutline,
  BusinessCenter,
  Upload,
  Download,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { cashRequestsService } from '../services/cashRequests.service';
import type {
  CashRequest,
  CreateCashRequestData,
  UpdateCashRequestData,
} from '../services/cashRequests.service';
import { formatCurrency, formatDate } from '../utils';

const urgencyLevels = [
  { value: 'LOW', label: 'Low', color: 'default' },
  { value: 'NORMAL', label: 'Normal', color: 'info' },
  { value: 'HIGH', label: 'High', color: 'warning' },
  { value: 'URGENT', label: 'Urgent', color: 'error' },
];

const statuses = [
  { value: 'PENDING', label: 'Pending', color: 'warning' },
  { value: 'APPROVED', label: 'Approved', color: 'success' },
  { value: 'REJECTED', label: 'Rejected', color: 'error' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'default' },
  { value: 'COMPLETED', label: 'Completed', color: 'info' },
];

const departments = [
  'Finance',
  'HR',
  'IT',
  'Maintenance',
  'Pharmacy',
  'Laboratory',
  'Radiology',
  'Surgery',
  'Emergency',
  'General',
];

// Get urgency icon function
const getUrgencyIcon = (urgency: string) => {
  switch (urgency) {
    case 'LOW':
      return <Schedule />;
    case 'NORMAL':
      return <BusinessCenter />;
    case 'HIGH':
      return <Warning />;
    case 'URGENT':
      return <Warning color='error' />;
    default:
      return <BusinessCenter />;
  }
};

export default function CashRequestsPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    urgency: '',
    status: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CashRequest | null>(
    null
  );
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateCashRequestData) =>
      cashRequestsService.createCashRequest(data),
    onSuccess: () => {
      toast.success('Cash request created successfully');
      queryClient.invalidateQueries({ queryKey: ['cash-requests'] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Failed to create cash request'
      );
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCashRequestData }) =>
      cashRequestsService.updateCashRequest(id, data),
    onSuccess: () => {
      toast.success('Cash request updated successfully');
      queryClient.invalidateQueries({ queryKey: ['cash-requests'] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Failed to update cash request'
      );
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      cashRequestsService.approveCashRequest(id, { notes }),
    onSuccess: () => {
      toast.success('Cash request approved successfully');
      queryClient.invalidateQueries({ queryKey: ['cash-requests'] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Failed to approve cash request'
      );
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({
      id,
      rejectionReason,
      notes,
    }: {
      id: string;
      rejectionReason: string;
      notes: string;
    }) => cashRequestsService.rejectCashRequest(id, { rejectionReason, notes }),
    onSuccess: () => {
      toast.success('Cash request rejected successfully');
      queryClient.invalidateQueries({ queryKey: ['cash-requests'] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Failed to reject cash request'
      );
    },
  });

  // Query parameters
  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: rowsPerPage,
      search: filters.search || undefined,
      department: filters.department || undefined,
      urgency:
        (filters.urgency as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT') || undefined,
      status:
        (filters.status as
          | 'PENDING'
          | 'APPROVED'
          | 'REJECTED'
          | 'CANCELLED'
          | 'COMPLETED') || undefined,
      startDate: filters.startDate
        ? filters.startDate.toISOString()
        : undefined,
      endDate: filters.endDate ? filters.endDate.toISOString() : undefined,
    }),
    [page, rowsPerPage, filters]
  );

  // Fetch cash requests
  const {
    data: requestsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['cash-requests', queryParams],
    queryFn: () => cashRequestsService.getCashRequests(queryParams),
  });

  // Extract requests and total count
  const requests = requestsResponse?.data || [];
  const totalCount = requestsResponse?.pagination?.total || 0;

  // Mutations - will be used when implementing approve/reject functionality
  // const approveMutation = useMutation({
  //   mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
  //     cashRequestsService.approveCashRequest(id, { notes }),
  //   onSuccess: () => {
  //     toast.success('Cash request approved successfully');
  //     queryClient.invalidateQueries({ queryKey: ['cash-requests'] });
  //     setApproveDialogOpen(false);
  //   },
  //   onError: (error: any) => {
  //     toast.error(error.response?.data?.message || 'Failed to approve request');
  //   },
  // });

  // const rejectMutation = useMutation({
  //   mutationFn: ({
  //     id,
  //     data,
  //   }: {
  //     id: string;
  //     data: { rejectionReason: string; notes: string };
  //   }) => cashRequestsService.rejectCashRequest(id, data),
  //   onSuccess: () => {
  //     toast.success('Cash request rejected successfully');
  //     queryClient.invalidateQueries({ queryKey: ['cash-requests'] });
  //     setApproveDialogOpen(false);
  //   },
  //   onError: (error: any) => {
  //     toast.error(error.response?.data?.message || 'Failed to reject request');
  //   },
  // });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cashRequestsService.cancelCashRequest(id),
    onSuccess: () => {
      toast.success('Cash request cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['cash-requests'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel request');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cashRequestsService.deleteCashRequest(id),
    onSuccess: () => {
      toast.success('Cash request deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['cash-requests'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete request');
    },
  });

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
      department: '',
      urgency: '',
      status: '',
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
    request: CashRequest
  ) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedRequest(request);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  // View request details
  const handleViewDetails = () => {
    setDetailsDialogOpen(true);
    handleActionMenuClose();
  };

  // Edit request
  const handleEdit = () => {
    setEditDialogOpen(true);
    handleActionMenuClose();
  };

  // Approve request
  const handleApprove = () => {
    setApproveDialogOpen(true);
    handleActionMenuClose();
  };

  // Reject request
  const handleReject = () => {
    setRejectDialogOpen(true);
    handleActionMenuClose();
  };

  // Cancel request
  const handleCancel = () => {
    if (selectedRequest) {
      cancelMutation.mutate(selectedRequest.id);
      handleActionMenuClose();
    }
  };

  // Delete request
  const handleDelete = () => {
    if (selectedRequest) {
      if (window.confirm('Are you sure you want to delete this request?')) {
        deleteMutation.mutate(selectedRequest.id);
        handleActionMenuClose();
      }
    }
  };

  // Get urgency color
  const getUrgencyColor = (urgency: string) => {
    const found = urgencyLevels.find((u) => u.value === urgency);
    return found?.color || 'default';
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const found = statuses.find((s) => s.value === status);
    return found?.color || 'default';
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error'>
          Failed to load cash requests. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' gutterBottom>
          Cash Requests
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Manage cash requests from hospital departments
        </Typography>
      </Box>

      {/* Actions Bar */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 2,
          mb: 3,
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant='outlined'
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          {showFilters && (
            <Button variant='text' onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </Box>
        <Button
          variant='contained'
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Request
        </Button>
      </Box>

      {/* Filters */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 2,
            }}
          >
            <TextField
              label='Search'
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder='Search by request number, purpose, or department'
              size='small'
            />
            <FormControl size='small'>
              <InputLabel>Department</InputLabel>
              <Select
                value={filters.department}
                label='Department'
                onChange={(e) =>
                  handleFilterChange('department', e.target.value)
                }
              >
                <MenuItem value=''>All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size='small'>
              <InputLabel>Urgency</InputLabel>
              <Select
                value={filters.urgency}
                label='Urgency'
                onChange={(e) => handleFilterChange('urgency', e.target.value)}
              >
                <MenuItem value=''>All Urgency Levels</MenuItem>
                {urgencyLevels.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size='small'>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label='Status'
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value=''>All Statuses</MenuItem>
                {statuses.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label='Start Date'
                value={filters.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                slotProps={{ textField: { size: 'small' } }}
              />
            </LocalizationProvider>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label='End Date'
                value={filters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                slotProps={{ textField: { size: 'small' } }}
              />
            </LocalizationProvider>
          </Box>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant='contained' onClick={applyFilters}>
              Apply Filters
            </Button>
          </Box>
        </Paper>
      )}

      {/* Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Request</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Urgency</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requester</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box display='flex' alignItems='center' gap={2}>
                        <Skeleton variant='circular' width={40} height={40} />
                        <Box>
                          <Skeleton variant='text' width={120} height={24} />
                          <Skeleton variant='text' width={200} height={20} />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Skeleton variant='text' width={80} height={24} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant='text' width={60} height={24} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant='text' width={60} height={24} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant='text' width={60} height={24} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant='text' width={100} height={24} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant='text' width={80} height={24} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant='text' width={60} height={24} />
                    </TableCell>
                  </TableRow>
                ))
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align='center' sx={{ py: 4 }}>
                    <Box textAlign='center'>
                      <Typography
                        variant='body1'
                        color='text.secondary'
                        gutterBottom
                      >
                        No cash requests found
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {filters.search ||
                        filters.department ||
                        filters.urgency ||
                        filters.status
                          ? 'Try adjusting your search or filters'
                          : 'No cash requests yet'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell>
                      <Box display='flex' alignItems='center' gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getUrgencyIcon(request.urgency)}
                        </Avatar>
                        <Box>
                          <Typography variant='body2' fontWeight={500}>
                            {request.requestNumber}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {request.purpose}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {request.department}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' fontWeight={500}>
                        {formatCurrency(request.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          urgencyLevels.find((u) => u.value === request.urgency)
                            ?.label
                        }
                        size='small'
                        color={getUrgencyColor(request.urgency) as any}
                        variant='outlined'
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          statuses.find((s) => s.value === request.status)
                            ?.label
                        }
                        color={getStatusColor(request.status) as any}
                        size='small'
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {request.requester?.user.firstName}{' '}
                        {request.requester?.user.lastName}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {request.requester?.employeeId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {formatDate(request.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Tooltip title='More actions'>
                        <IconButton
                          onClick={(e) => handleActionMenuOpen(e, request)}
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
          rowsPerPageOptions={[5, 10, 25, 50]}
          component='div'
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>

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
        {selectedRequest?.status === 'PENDING' && (
          <>
            <MenuItem onClick={handleEdit}>
              <ListItemIcon>
                <Edit fontSize='small' />
              </ListItemIcon>
              Edit Request
            </MenuItem>
            <MenuItem onClick={handleApprove}>
              <ListItemIcon>
                <CheckCircle fontSize='small' />
              </ListItemIcon>
              Approve Request
            </MenuItem>
            <MenuItem onClick={handleReject}>
              <ListItemIcon>
                <Cancel fontSize='small' />
              </ListItemIcon>
              Reject Request
            </MenuItem>
            <MenuItem onClick={handleCancel}>
              <ListItemIcon>
                <CancelOutlined fontSize='small' />
              </ListItemIcon>
              Cancel Request
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <DeleteOutline fontSize='small' />
              </ListItemIcon>
              Delete Request
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Create Cash Request Dialog */}
      {createDialogOpen && (
        <CreateCashRequestDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSuccess={() => {
            setCreateDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['cashRequests'] });
          }}
          createMutation={createMutation}
          user={user}
        />
      )}

      {editDialogOpen && selectedRequest && (
        <EditCashRequestDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSuccess={() => {
            setEditDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['cash-requests'] });
          }}
          request={selectedRequest}
          updateMutation={updateMutation}
        />
      )}

      {approveDialogOpen && selectedRequest && (
        <ApproveCashRequestDialog
          open={approveDialogOpen}
          onClose={() => setApproveDialogOpen(false)}
          onSuccess={() => {
            setApproveDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['cash-requests'] });
          }}
          request={selectedRequest}
          approveMutation={approveMutation}
        />
      )}

      {rejectDialogOpen && selectedRequest && (
        <RejectCashRequestDialog
          open={rejectDialogOpen}
          onClose={() => setRejectDialogOpen(false)}
          onSuccess={() => {
            setRejectDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['cash-requests'] });
          }}
          request={selectedRequest}
          rejectMutation={rejectMutation}
        />
      )}

      {detailsDialogOpen && selectedRequest && (
        <CashRequestDetailsDialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          request={selectedRequest}
          onEdit={() => {
            setDetailsDialogOpen(false);
            setEditDialogOpen(true);
          }}
          onApprove={() => {
            setDetailsDialogOpen(false);
            setApproveDialogOpen(true);
          }}
          onReject={() => {
            setDetailsDialogOpen(false);
            setRejectDialogOpen(true);
          }}
        />
      )}
    </Box>
  );
}

// Create Cash Request Dialog Component
interface CreateCashRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  createMutation: any;
  user: any;
}

function CreateCashRequestDialog({
  open,
  onClose,
  onSuccess,
  createMutation,
  user,
}: CreateCashRequestDialogProps) {
  const [formData, setFormData] = useState<CreateCashRequestData>({
    department: '',
    purpose: '',
    amount: 0,
    urgency: 'NORMAL',
    notes: '',
    attachments: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }
    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }
    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.urgency) {
      newErrors.urgency = 'Urgency level is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      onSuccess();
      // Reset form
      setFormData({
        department: '',
        purpose: '',
        amount: 0,
        urgency: 'NORMAL',
        notes: '',
        attachments: [],
      });
      setErrors({});
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      department: '',
      purpose: '',
      amount: 0,
      urgency: 'NORMAL',
      notes: '',
      attachments: [],
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>
        Create Cash Request
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          Request cash for department needs
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: '1fr 1fr' }}>
            {/* Department */}
            <FormControl fullWidth error={!!errors.department}>
              <InputLabel>Department *</InputLabel>
              <Select
                value={formData.department}
                label='Department *'
                onChange={(e) =>
                  handleInputChange('department', e.target.value)
                }
              >
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
              {errors.department && (
                <Typography variant='caption' color='error' sx={{ mt: 0.5 }}>
                  {errors.department}
                </Typography>
              )}
            </FormControl>

            {/* Urgency */}
            <FormControl fullWidth error={!!errors.urgency}>
              <InputLabel>Urgency Level *</InputLabel>
              <Select
                value={formData.urgency}
                label='Urgency Level *'
                onChange={(e) => handleInputChange('urgency', e.target.value)}
              >
                {urgencyLevels.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getUrgencyIcon(level.value)}
                      {level.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.urgency && (
                <Typography variant='caption' color='error' sx={{ mt: 0.5 }}>
                  {errors.urgency}
                </Typography>
              )}
            </FormControl>

            {/* Purpose - Full Width */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                label='Purpose *'
                value={formData.purpose}
                onChange={(e) => handleInputChange('purpose', e.target.value)}
                error={!!errors.purpose}
                helperText={errors.purpose}
                multiline
                rows={3}
                placeholder='Describe the purpose of this cash request...'
              />
            </Box>

            {/* Amount */}
            <TextField
              fullWidth
              label='Amount *'
              type='number'
              value={formData.amount}
              onChange={(e) =>
                handleInputChange('amount', parseFloat(e.target.value) || 0)
              }
              error={!!errors.amount}
              helperText={errors.amount}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
              inputProps={{
                min: 0.01,
                step: 0.01,
              }}
            />

            {/* Notes */}
            <TextField
              fullWidth
              label='Notes'
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              multiline
              rows={2}
              placeholder='Additional notes or details...'
            />

            {/* Attachments */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant='subtitle2' gutterBottom>
                Attachments
              </Typography>
              <input
                accept='.pdf,.doc,.docx,.jpg,.jpeg,.png,.txt'
                style={{ display: 'none' }}
                id='attachments-input'
                multiple
                type='file'
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const fileNames = files.map((file: File) => file.name);
                  handleInputChange('attachments', fileNames);
                }}
              />
              <label htmlFor='attachments-input'>
                <Button
                  variant='outlined'
                  component='span'
                  startIcon={<Upload />}
                  sx={{ mb: 2 }}
                >
                  Choose Files
                </Button>
              </label>
              {formData.attachments && formData.attachments.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    display='block'
                    gutterBottom
                  >
                    Selected files:
                  </Typography>
                  {formData.attachments.map((fileName, index) => (
                    <Chip
                      key={index}
                      label={fileName}
                      size='small'
                      onDelete={() => {
                        const newAttachments = (
                          formData.attachments || []
                        ).filter((_, i) => i !== index);
                        handleInputChange('attachments', newAttachments);
                      }}
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              )}
            </Box>

            {/* Requester Info */}
            <Box
              sx={{
                gridColumn: '1 / -1',
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1,
              }}
            >
              <Typography
                variant='subtitle2'
                color='text.secondary'
                gutterBottom
              >
                Request Details
              </Typography>
              <Box
                sx={{ display: 'grid', gap: 1, gridTemplateColumns: '1fr 1fr' }}
              >
                <Typography variant='body2'>
                  <strong>Requester:</strong> {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant='body2'>
                  <strong>Employee ID:</strong>{' '}
                  {user?.staffMember?.employeeId || 'N/A'}
                </Typography>
                <Typography variant='body2'>
                  <strong>Department:</strong>{' '}
                  {user?.staffMember?.department || 'N/A'}
                </Typography>
                <Typography variant='body2'>
                  <strong>Date:</strong> {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} color='inherit'>
            Cancel
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={createMutation.isPending}
            startIcon={
              createMutation.isPending ? <CircularProgress size={20} /> : null
            }
          >
            {createMutation.isPending ? 'Creating...' : 'Create Request'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// Edit Cash Request Dialog Component
interface EditCashRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  request: CashRequest;
  updateMutation: any;
}

function EditCashRequestDialog({
  open,
  onClose,
  onSuccess,
  request,
  updateMutation,
}: EditCashRequestDialogProps) {
  const [formData, setFormData] = useState<UpdateCashRequestData>({
    department: request.department || '',
    purpose: request.purpose || '',
    amount: request.amount || 0,
    urgency: request.urgency || 'NORMAL',
    notes: request.notes || '',
    attachments: request.attachments || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when request changes
  useEffect(() => {
    setFormData({
      department: request.department || '',
      purpose: request.purpose || '',
      amount: request.amount || 0,
      urgency: request.urgency || 'NORMAL',
      notes: request.notes || '',
      attachments: request.attachments || [],
    });
    setErrors({});
  }, [request]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }
    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }
    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.urgency) {
      newErrors.urgency = 'Urgency level is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: request.id, data: formData });
      onSuccess();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      department: request.department || '',
      purpose: request.purpose || '',
      amount: request.amount || 0,
      urgency: request.urgency || 'NORMAL',
      notes: request.notes || '',
      attachments: request.attachments || [],
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>
        Edit Cash Request
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          Update cash request details
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: '1fr 1fr' }}>
            {/* Department */}
            <FormControl fullWidth error={!!errors.department}>
              <InputLabel>Department *</InputLabel>
              <Select
                value={formData.department}
                label='Department *'
                onChange={(e) =>
                  handleInputChange('department', e.target.value)
                }
              >
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
              {errors.department && (
                <Typography variant='caption' color='error' sx={{ mt: 0.5 }}>
                  {errors.department}
                </Typography>
              )}
            </FormControl>

            {/* Urgency */}
            <FormControl fullWidth error={!!errors.urgency}>
              <InputLabel>Urgency Level *</InputLabel>
              <Select
                value={formData.urgency}
                label='Urgency Level *'
                onChange={(e) => handleInputChange('urgency', e.target.value)}
              >
                {urgencyLevels.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getUrgencyIcon(level.value)}
                      {level.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.urgency && (
                <Typography variant='caption' color='error' sx={{ mt: 0.5 }}>
                  {errors.urgency}
                </Typography>
              )}
            </FormControl>

            {/* Purpose - Full Width */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                label='Purpose *'
                value={formData.purpose}
                onChange={(e) => handleInputChange('purpose', e.target.value)}
                error={!!errors.purpose}
                helperText={errors.purpose}
                multiline
                rows={3}
                placeholder='Describe the purpose of this cash request...'
              />
            </Box>

            {/* Amount */}
            <TextField
              fullWidth
              label='Amount *'
              type='number'
              value={formData.amount}
              onChange={(e) =>
                handleInputChange('amount', parseFloat(e.target.value) || 0)
              }
              error={!!errors.amount}
              helperText={errors.amount}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
              inputProps={{
                min: 0.01,
                step: 0.01,
              }}
            />

            {/* Notes */}
            <TextField
              fullWidth
              label='Notes'
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              multiline
              rows={2}
              placeholder='Additional notes or details...'
            />

            {/* Attachments */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant='subtitle2' gutterBottom>
                Attachments
              </Typography>
              <input
                accept='.pdf,.doc,.docx,.jpg,.jpeg,.png,.txt'
                style={{ display: 'none' }}
                id='edit-attachments-input'
                multiple
                type='file'
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const fileNames = files.map((file: File) => file.name);
                  handleInputChange('attachments', fileNames);
                }}
              />
              <label htmlFor='edit-attachments-input'>
                <Button
                  variant='outlined'
                  component='span'
                  startIcon={<Upload />}
                  sx={{ mb: 2 }}
                >
                  Choose Files
                </Button>
              </label>
              {formData.attachments && formData.attachments.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    display='block'
                    gutterBottom
                  >
                    Selected files:
                  </Typography>
                  {formData.attachments.map((fileName, index) => (
                    <Chip
                      key={index}
                      label={fileName}
                      size='small'
                      onDelete={() => {
                        const newAttachments = (
                          formData.attachments || []
                        ).filter((_, i) => i !== index);
                        handleInputChange('attachments', newAttachments);
                      }}
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              )}
            </Box>

            {/* Current Request Info */}
            <Box
              sx={{
                gridColumn: '1 / -1',
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1,
              }}
            >
              <Typography
                variant='subtitle2'
                color='text.secondary'
                gutterBottom
              >
                Current Request Information
              </Typography>
              <Box
                sx={{ display: 'grid', gap: 1, gridTemplateColumns: '1fr 1fr' }}
              >
                <Typography variant='body2'>
                  <strong>Request Number:</strong> {request.requestNumber}
                </Typography>
                <Typography variant='body2'>
                  <strong>Status:</strong> {request.status}
                </Typography>
                <Typography variant='body2'>
                  <strong>Created:</strong> {formatDate(request.createdAt)}
                </Typography>
                <Typography variant='body2'>
                  <strong>Last Updated:</strong> {formatDate(request.updatedAt)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} color='inherit'>
            Cancel
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={updateMutation.isPending}
            startIcon={
              updateMutation.isPending ? <CircularProgress size={20} /> : null
            }
          >
            {updateMutation.isPending ? 'Updating...' : 'Update Request'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// Approve Cash Request Dialog Component
interface ApproveCashRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  request: CashRequest;
  approveMutation: any;
}

function ApproveCashRequestDialog({
  open,
  onClose,
  onSuccess,
  request,
  approveMutation,
}: ApproveCashRequestDialogProps) {
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await approveMutation.mutateAsync({
        id: request.id,
        notes: notes.trim() || undefined,
      });
      onSuccess();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    setNotes('');
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'success.main' }}>
            <CheckCircle />
          </Avatar>
          <Box>
            <Typography variant='h6'>Approve Cash Request</Typography>
            <Typography variant='body2' color='text.secondary'>
              {request.requestNumber}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Request Summary */}
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography
                variant='subtitle2'
                color='text.secondary'
                gutterBottom
              >
                Request Summary
              </Typography>
              <Box
                sx={{ display: 'grid', gap: 1, gridTemplateColumns: '1fr 1fr' }}
              >
                <Typography variant='body2'>
                  <strong>Department:</strong> {request.department}
                </Typography>
                <Typography variant='body2'>
                  <strong>Amount:</strong> {formatCurrency(request.amount)}
                </Typography>
                <Typography variant='body2'>
                  <strong>Urgency:</strong> {request.urgency}
                </Typography>
                <Typography variant='body2'>
                  <strong>Requester:</strong>{' '}
                  {request.requester?.user.firstName}{' '}
                  {request.requester?.user.lastName}
                </Typography>
              </Box>
            </Box>

            {/* Purpose */}
            <Box>
              <Typography
                variant='subtitle2'
                color='text.secondary'
                gutterBottom
              >
                Purpose
              </Typography>
              <Typography
                variant='body1'
                sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}
              >
                {request.purpose}
              </Typography>
            </Box>

            {/* Approval Notes */}
            <Box>
              <Typography
                variant='subtitle2'
                color='text.secondary'
                gutterBottom
              >
                Approval Notes (Optional)
              </Typography>
              <TextField
                fullWidth
                label='Notes'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
                placeholder='Add any notes or comments about this approval...'
                helperText='These notes will be recorded with the approval'
              />
            </Box>

            {/* Approval Confirmation */}
            <Box
              sx={{
                p: 2,
                bgcolor: 'success.light',
                borderRadius: 1,
                border: 1,
                borderColor: 'success.main',
              }}
            >
              <Typography
                variant='body2'
                color='success.dark'
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <CheckCircle fontSize='small' />
                <strong>Approval Action</strong>
              </Typography>
              <Typography variant='body2' color='success.dark' sx={{ mt: 1 }}>
                By approving this request, you confirm that:
              </Typography>
              <Box component='ul' sx={{ mt: 1, pl: 2 }}>
                <Typography component='li' variant='body2' color='success.dark'>
                  The requested amount is reasonable and justified
                </Typography>
                <Typography component='li' variant='body2' color='success.dark'>
                  The purpose aligns with department needs
                </Typography>
                <Typography component='li' variant='body2' color='success.dark'>
                  You have authority to approve this request
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} color='inherit'>
            Cancel
          </Button>
          <Button
            type='submit'
            variant='contained'
            color='success'
            disabled={approveMutation.isPending}
            startIcon={
              approveMutation.isPending ? <CircularProgress size={20} /> : null
            }
          >
            {approveMutation.isPending ? 'Approving...' : 'Approve Request'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// Reject Cash Request Dialog Component
interface RejectCashRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  request: CashRequest;
  rejectMutation: any;
}

function RejectCashRequestDialog({
  open,
  onClose,
  onSuccess,
  request,
  rejectMutation,
}: RejectCashRequestDialogProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!rejectionReason.trim()) {
      setErrors({ rejectionReason: 'Rejection reason is required' });
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        id: request.id,
        rejectionReason: rejectionReason.trim(),
        notes: notes.trim() || 'No additional notes provided',
      });
      onSuccess();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    setRejectionReason('');
    setNotes('');
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'error.main' }}>
            <Cancel />
          </Avatar>
          <Box>
            <Typography variant='h6'>Reject Cash Request</Typography>
            <Typography variant='body2' color='text.secondary'>
              {request.requestNumber}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Request Summary */}
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography
                variant='subtitle2'
                color='text.secondary'
                gutterBottom
              >
                Request Summary
              </Typography>
              <Box
                sx={{ display: 'grid', gap: 1, gridTemplateColumns: '1fr 1fr' }}
              >
                <Typography variant='body2'>
                  <strong>Department:</strong> {request.department}
                </Typography>
                <Typography variant='body2'>
                  <strong>Amount:</strong> {formatCurrency(request.amount)}
                </Typography>
                <Typography variant='body2'>
                  <strong>Urgency:</strong> {request.urgency}
                </Typography>
                <Typography variant='body2'>
                  <strong>Requester:</strong>{' '}
                  {request.requester?.user.firstName}{' '}
                  {request.requester?.user.lastName}
                </Typography>
              </Box>
            </Box>

            {/* Purpose */}
            <Box>
              <Typography
                variant='subtitle2'
                color='text.secondary'
                gutterBottom
              >
                Purpose
              </Typography>
              <Typography
                variant='body1'
                sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}
              >
                {request.purpose}
              </Typography>
            </Box>

            {/* Rejection Reason */}
            <Box>
              <Typography
                variant='subtitle2'
                color='text.secondary'
                gutterBottom
              >
                Rejection Reason <span style={{ color: 'red' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                label='Rejection Reason'
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (errors.rejectionReason) {
                    setErrors((prev) => ({ ...prev, rejectionReason: '' }));
                  }
                }}
                multiline
                rows={3}
                placeholder='Please provide a clear reason for rejecting this request...'
                error={!!errors.rejectionReason}
                helperText={
                  errors.rejectionReason ||
                  'This reason will be recorded and shared with the requester'
                }
                required
              />
            </Box>

            {/* Additional Notes */}
            <Box>
              <Typography
                variant='subtitle2'
                color='text.secondary'
                gutterBottom
              >
                Additional Notes (Optional)
              </Typography>
              <TextField
                fullWidth
                label='Notes'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
                placeholder='Add any additional notes or suggestions for improvement...'
                helperText='These notes will be recorded with the rejection'
              />
            </Box>

            {/* Rejection Confirmation */}
            <Box
              sx={{
                p: 2,
                bgcolor: 'error.light',
                borderRadius: 1,
                border: 1,
                borderColor: 'error.main',
              }}
            >
              <Typography
                variant='body2'
                color='error.dark'
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Cancel fontSize='small' />
                <strong>Rejection Action</strong>
              </Typography>
              <Typography variant='body2' color='error.dark' sx={{ mt: 1 }}>
                By rejecting this request, you confirm that:
              </Typography>
              <Box component='ul' sx={{ mt: 1, pl: 2 }}>
                <Typography component='li' variant='body2' color='error.dark'>
                  You have reviewed the request thoroughly
                </Typography>
                <Typography component='li' variant='body2' color='error.dark'>
                  The rejection reason is clear and justified
                </Typography>
                <Typography component='li' variant='body2' color='error.dark'>
                  You have authority to reject this request
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} color='inherit'>
            Cancel
          </Button>
          <Button
            type='submit'
            variant='contained'
            color='error'
            disabled={rejectMutation.isPending}
            startIcon={
              rejectMutation.isPending ? <CircularProgress size={20} /> : null
            }
          >
            {rejectMutation.isPending ? 'Rejecting...' : 'Reject Request'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// Cash Request Details Dialog Component
interface CashRequestDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  request: CashRequest;
  onEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
}

function CashRequestDetailsDialog({
  open,
  onClose,
  request,
  onEdit,
  onApprove,
  onReject,
}: CashRequestDetailsDialogProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'CANCELLED':
        return 'default';
      case 'COMPLETED':
        return 'info';
      default:
        return 'default';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'LOW':
        return 'default';
      case 'NORMAL':
        return 'info';
      case 'HIGH':
        return 'warning';
      case 'URGENT':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth='lg' fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <BusinessCenter />
          </Avatar>
          <Box>
            <Typography variant='h6'>
              Cash Request: {request.requestNumber}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Created on {formatDate(request.createdAt)}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: '1fr 1fr' }}>
          {/* Basic Information */}
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Typography
              variant='h6'
              gutterBottom
              sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}
            >
              Basic Information
            </Typography>
            <Box
              sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}
            >
              <Box>
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  gutterBottom
                >
                  Request Number
                </Typography>
                <Typography variant='body1' fontWeight={500}>
                  {request.requestNumber}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  gutterBottom
                >
                  Status
                </Typography>
                <Chip
                  label={request.status}
                  color={getStatusColor(request.status) as any}
                  size='small'
                  variant='outlined'
                />
              </Box>
              <Box>
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  gutterBottom
                >
                  Department
                </Typography>
                <Typography variant='body1'>{request.department}</Typography>
              </Box>
              <Box>
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  gutterBottom
                >
                  Urgency Level
                </Typography>
                <Chip
                  label={request.urgency}
                  color={getUrgencyColor(request.urgency) as any}
                  size='small'
                  variant='outlined'
                  icon={getUrgencyIcon(request.urgency)}
                />
              </Box>
              <Box>
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  gutterBottom
                >
                  Amount
                </Typography>
                <Typography variant='h6' color='primary.main' fontWeight={600}>
                  {formatCurrency(request.amount)}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  gutterBottom
                >
                  Created Date
                </Typography>
                <Typography variant='body1'>
                  {formatDate(request.createdAt)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Purpose and Notes */}
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Typography
              variant='h6'
              gutterBottom
              sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}
            >
              Request Details
            </Typography>
            <Box
              sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}
            >
              <Box>
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  gutterBottom
                >
                  Purpose
                </Typography>
                <Typography
                  variant='body1'
                  sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    minHeight: 80,
                  }}
                >
                  {request.purpose}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  gutterBottom
                >
                  Notes
                </Typography>
                <Typography
                  variant='body1'
                  sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    minHeight: 80,
                  }}
                >
                  {request.notes || 'No notes provided'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Requester Information */}
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Typography
              variant='h6'
              gutterBottom
              sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}
            >
              Requester Information
            </Typography>
            <Box
              sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}
            >
              <Box>
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  gutterBottom
                >
                  Requester Name
                </Typography>
                <Typography variant='body1'>
                  {request.requester?.user.firstName}{' '}
                  {request.requester?.user.lastName}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  gutterBottom
                >
                  Employee ID
                </Typography>
                <Typography variant='body1'>
                  {request.requester?.employeeId}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  gutterBottom
                >
                  Department
                </Typography>
                <Typography variant='body1'>
                  {request.requester?.department}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  gutterBottom
                >
                  Email
                </Typography>
                <Typography variant='body1'>
                  {request.requester?.user.email}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Approval Information */}
          {request.status === 'APPROVED' && request.approver && (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography
                variant='h6'
                gutterBottom
                sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}
              >
                Approval Information
              </Typography>
              <Box
                sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}
              >
                <Box>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Approved By
                  </Typography>
                  <Typography variant='body1'>
                    {request.approver.user.firstName}{' '}
                    {request.approver.user.lastName}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Approval Date
                  </Typography>
                  <Typography variant='body1'>
                    {request.approvedAt
                      ? formatDate(request.approvedAt)
                      : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Rejection Information */}
          {request.status === 'REJECTED' && request.rejector && (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography
                variant='h6'
                gutterBottom
                sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}
              >
                Rejection Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: '1fr 1fr',
                  }}
                >
                  <Box>
                    <Typography
                      variant='subtitle2'
                      color='text.secondary'
                      gutterBottom
                    >
                      Rejected By
                    </Typography>
                    <Typography variant='body1'>
                      {request.rejector.user.firstName}{' '}
                      {request.rejector.user.lastName}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant='subtitle2'
                      color='text.secondary'
                      gutterBottom
                    >
                      Rejection Date
                    </Typography>
                    <Typography variant='body1'>
                      {request.rejectedAt
                        ? formatDate(request.rejectedAt)
                        : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Rejection Reason
                  </Typography>
                  <Typography
                    variant='body1'
                    sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}
                  >
                    {request.rejectionReason || 'No reason provided'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Attachments */}
          {request.attachments && request.attachments.length > 0 && (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography
                variant='h6'
                gutterBottom
                sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}
              >
                Attachments
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {request.attachments.map((attachment, index) => (
                  <Chip
                    key={index}
                    label={attachment}
                    variant='outlined'
                    icon={<Download />}
                    onClick={() => {
                      // TODO: Implement file download functionality
                      console.log('Download attachment:', attachment);
                    }}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Timeline */}
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Typography
              variant='h6'
              gutterBottom
              sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}
            >
              Request Timeline
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                  <Add fontSize='small' />
                </Avatar>
                <Box>
                  <Typography variant='body1' fontWeight={500}>
                    Request Created
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {formatDate(request.createdAt)}
                  </Typography>
                </Box>
              </Box>

              {request.status === 'APPROVED' && request.approvedAt && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{ bgcolor: 'success.main', width: 32, height: 32 }}
                  >
                    <CheckCircle fontSize='small' />
                  </Avatar>
                  <Box>
                    <Typography variant='body1' fontWeight={500}>
                      Request Approved
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {formatDate(request.approvedAt)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {request.status === 'REJECTED' && request.rejectedAt && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'error.main', width: 32, height: 32 }}>
                    <Cancel fontSize='small' />
                  </Avatar>
                  <Box>
                    <Typography variant='body1' fontWeight={500}>
                      Request Rejected
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {formatDate(request.rejectedAt)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {request.status === 'CANCELLED' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{ bgcolor: 'default.main', width: 32, height: 32 }}
                  >
                    <CancelOutlined fontSize='small' />
                  </Avatar>
                  <Box>
                    <Typography variant='body1' fontWeight={500}>
                      Request Cancelled
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {formatDate(request.updatedAt)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} color='inherit'>
          Close
        </Button>
        {request.status === 'PENDING' && (
          <Button variant='outlined' startIcon={<Edit />} onClick={onEdit}>
            Edit Request
          </Button>
        )}
        {request.status === 'PENDING' && (
          <Button
            variant='contained'
            color='success'
            startIcon={<CheckCircle />}
            onClick={onApprove}
          >
            Approve
          </Button>
        )}
        {request.status === 'PENDING' && (
          <Button
            variant='contained'
            color='error'
            startIcon={<Cancel />}
            onClick={onReject}
          >
            Reject
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
