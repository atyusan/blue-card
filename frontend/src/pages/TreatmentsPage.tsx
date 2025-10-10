import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Menu,
  ListItemIcon,
  Alert,
  Skeleton,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Search,
  FilterList,
  Visibility,
  Edit,
  Delete,
  MoreVert,
  LocalHospital,
  Link as LinkIcon,
  CheckCircle,
  Warning,
  Sync,
  ThumbUp,
} from '@mui/icons-material';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { treatmentService } from '../services/treatment.service';
import { formatDate } from '../utils';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import type { Treatment } from '../types';

const TreatmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { staffMember, isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const {
    canViewTreatments,
    canUpdateTreatments,
    canDeleteTreatments,
    canUpdateTreatmentStatus,
    canManageTreatmentLinks,
  } = usePermissions();

  const isAdminUser = isAdmin();

  // State
  const [currentTab, setCurrentTab] = useState(0);

  // Check for tab query parameter on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'transferred') {
      setCurrentTab(1);
    }
  }, [searchParams]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedTreatment, setSelectedTreatment] = useState<any>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  // Check permission
  if (!canViewTreatments()) {
    return (
      <Box>
        <PageHeader
          title='Treatments'
          subtitle='View and manage patient treatments'
          breadcrumbs={<Breadcrumb />}
          showActions={false}
        />
        <Alert severity='error' sx={{ m: 3 }}>
          You don't have permission to view treatments. Please contact your
          administrator.
        </Alert>
      </Box>
    );
  }

  // Fetch treatments
  const {
    data: treatmentsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      'treatments',
      page,
      rowsPerPage,
      searchQuery,
      statusFilter,
      typeFilter,
      priorityFilter,
      staffMember?.id,
    ],
    queryFn: () =>
      treatmentService.getTreatments({
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter || undefined,
        treatmentType: typeFilter || undefined,
        // Filter by provider if not admin
        providerId:
          !isAdminUser && staffMember?.id ? staffMember.id : undefined,
      } as any),
    enabled: currentTab === 0,
  });

  // Fetch transferred treatments (only for non-admin providers)
  const {
    data: transferredData,
    isLoading: isLoadingTransferred,
    refetch: refetchTransferred,
  } = useQuery({
    queryKey: ['transferred-treatments'],
    queryFn: () => treatmentService.getTransferredTreatments(),
    enabled: currentTab === 1 && !isAdminUser && !!staffMember,
  });

  // Acknowledge transfer mutation
  const acknowledgeTransferMutation = useMutation({
    mutationFn: (treatmentId: string) =>
      treatmentService.acknowledgeTransfer(treatmentId),
    onSuccess: () => {
      showSuccess('Transfer acknowledged successfully');
      refetchTransferred();
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to acknowledge transfer');
    },
  });

  // Handlers
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setPage(0);
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
    treatment: any
  ) => {
    setSelectedTreatment(treatment);
    setActionMenuAnchor(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedTreatment(null);
  };

  const handleViewDetails = () => {
    if (selectedTreatment) {
      navigate(`/treatments/${selectedTreatment.id}`);
    }
    handleActionMenuClose();
  };

  const handleEdit = () => {
    if (selectedTreatment) {
      navigate(`/treatments/${selectedTreatment.id}/edit`);
    }
    handleActionMenuClose();
  };

  const handleDelete = () => {
    if (selectedTreatment) {
      if (window.confirm('Are you sure you want to delete this treatment?')) {
        treatmentService
          .deleteTreatment(selectedTreatment.id)
          .then(() => {
            showSuccess('Treatment deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['treatments'] });
          })
          .catch((error) => {
            showError(error.message || 'Failed to delete treatment');
          });
      }
    }
    handleActionMenuClose();
  };

  const getTreatmentStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'COMPLETED':
        return 'info';
      case 'CANCELLED':
        return 'error';
      case 'SUSPENDED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY':
        return 'error';
      case 'URGENT':
        return 'warning';
      case 'ROUTINE':
        return 'default';
      case 'FOLLOW_UP':
        return 'info';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box>
        <PageHeader
          title='Treatments'
          subtitle='View and manage patient treatments'
          breadcrumbs={<Breadcrumb />}
          showActions={false}
        />
        <Box p={3}>
          {[...Array(5)].map((_, index) => (
            <Skeleton
              key={index}
              variant='rectangular'
              height={60}
              sx={{ mb: 2 }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box>
        <PageHeader
          title='Treatments'
          subtitle='View and manage patient treatments'
          breadcrumbs={<Breadcrumb />}
          onRefresh={() => refetch()}
          showActions={true}
        />
        <Alert severity='error' sx={{ m: 3 }}>
          Failed to load treatments. Please try again.
        </Alert>
      </Box>
    );
  }

  const treatments: Treatment[] = treatmentsData?.treatments || [];
  const totalCount = treatmentsData?.total || 0;
  const transferredTreatments: Treatment[] = transferredData?.treatments || [];
  const unacknowledgedCount = transferredData?.unacknowledged || 0;

  const displayTreatments: Treatment[] =
    currentTab === 0 ? treatments : transferredTreatments;
  const displayTotal =
    currentTab === 0 ? totalCount : transferredTreatments.length;
  const displayLoading = currentTab === 0 ? isLoading : isLoadingTransferred;

  return (
    <Box>
      <PageHeader
        title='Treatments'
        subtitle='View and manage patient treatments'
        breadcrumbs={<Breadcrumb />}
        onRefresh={() => (currentTab === 0 ? refetch() : refetchTransferred())}
        showActions={true}
      />

      {/* Tabs - Only show Transferred tab for non-admin providers */}
      {!isAdminUser && staffMember && (
        <Card sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              label='All Treatments'
              icon={<LocalHospital />}
              iconPosition='start'
            />
            <Tab
              label={
                <Badge badgeContent={unacknowledgedCount} color='error'>
                  <Box sx={{ mr: unacknowledgedCount > 0 ? 2 : 0 }}>
                    Transferred to Me
                  </Box>
                </Badge>
              }
              icon={<Sync />}
              iconPosition='start'
            />
          </Tabs>
        </Card>
      )}

      {/* Filters - Only show for All Treatments tab */}
      {currentTab === 0 && (
        <Card sx={{ mb: 3 }}>
          <Box p={3}>
            <Box display='flex' gap={2} alignItems='center' flexWrap='wrap'>
              <TextField
                placeholder='Search treatments...'
                size='small'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1, minWidth: 250 }}
              />
              <FormControl size='small' sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label='Status'
                >
                  <MenuItem value=''>All</MenuItem>
                  <MenuItem value='ACTIVE'>Active</MenuItem>
                  <MenuItem value='COMPLETED'>Completed</MenuItem>
                  <MenuItem value='SUSPENDED'>Suspended</MenuItem>
                  <MenuItem value='CANCELLED'>Cancelled</MenuItem>
                </Select>
              </FormControl>
              <FormControl size='small' sx={{ minWidth: 150 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label='Type'
                >
                  <MenuItem value=''>All</MenuItem>
                  <MenuItem value='CONSULTATION'>Consultation</MenuItem>
                  <MenuItem value='FOLLOW_UP'>Follow-up</MenuItem>
                  <MenuItem value='EMERGENCY'>Emergency</MenuItem>
                  <MenuItem value='SURGERY'>Surgery</MenuItem>
                  <MenuItem value='THERAPY'>Therapy</MenuItem>
                  <MenuItem value='REHABILITATION'>Rehabilitation</MenuItem>
                  <MenuItem value='PREVENTIVE'>Preventive</MenuItem>
                  <MenuItem value='DIAGNOSTIC'>Diagnostic</MenuItem>
                </Select>
              </FormControl>
              <FormControl size='small' sx={{ minWidth: 150 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  label='Priority'
                >
                  <MenuItem value=''>All</MenuItem>
                  <MenuItem value='ROUTINE'>Routine</MenuItem>
                  <MenuItem value='URGENT'>Urgent</MenuItem>
                  <MenuItem value='EMERGENCY'>Emergency</MenuItem>
                  <MenuItem value='FOLLOW_UP'>Follow-up</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant='outlined'
                startIcon={<FilterList />}
                onClick={() => {
                  setStatusFilter('');
                  setTypeFilter('');
                  setPriorityFilter('');
                  setSearchQuery('');
                }}
              >
                Clear
              </Button>
            </Box>
          </Box>
        </Card>
      )}

      {/* Treatments Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Provider</TableCell>
                <TableCell>Created</TableCell>
                {currentTab === 1 && !isAdminUser && (
                  <TableCell align='center'>Transfer</TableCell>
                )}
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayLoading ? (
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={currentTab === 1 ? 9 : 8}>
                      <Skeleton variant='rectangular' height={40} />
                    </TableCell>
                  </TableRow>
                ))
              ) : displayTreatments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={currentTab === 1 ? 9 : 8}
                    align='center'
                    sx={{ py: 5 }}
                  >
                    <Typography color='text.secondary'>
                      {currentTab === 1
                        ? 'No transferred treatments found'
                        : 'No treatments found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayTreatments.map((treatment) => (
                  <TableRow
                    key={treatment.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/treatments/${treatment.id}`)}
                  >
                    <TableCell>
                      <Typography variant='body2' fontWeight={500}>
                        {treatment.title}
                      </Typography>
                      {treatment.description && (
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            maxWidth: 300,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {treatment.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {treatment.patient?.firstName}{' '}
                        {treatment.patient?.lastName}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {treatment.patient?.patientId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={treatment.treatmentType}
                        size='small'
                        variant='outlined'
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={treatment.priority}
                        size='small'
                        color={
                          getPriorityColor(treatment.priority) as
                            | 'default'
                            | 'success'
                            | 'warning'
                            | 'error'
                            | 'info'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={treatment.status}
                        size='small'
                        color={
                          getTreatmentStatusColor(treatment.status) as
                            | 'default'
                            | 'success'
                            | 'warning'
                            | 'error'
                            | 'info'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {treatment.primaryProvider?.firstName}{' '}
                        {treatment.primaryProvider?.lastName}
                      </Typography>
                      {treatment.primaryProvider?.specialization && (
                        <Typography variant='caption' color='text.secondary'>
                          {treatment.primaryProvider.specialization}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {formatDate(treatment.createdAt)}
                      </Typography>
                    </TableCell>
                    {currentTab === 1 && !isAdminUser && (
                      <TableCell
                        align='center'
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!treatment.providers?.find(
                          (p: any) => p.role === 'PRIMARY'
                        )?.transferAcknowledged ? (
                          <Button
                            size='small'
                            variant='contained'
                            color='success'
                            startIcon={<ThumbUp />}
                            onClick={() =>
                              acknowledgeTransferMutation.mutate(treatment.id)
                            }
                            disabled={acknowledgeTransferMutation.isPending}
                            sx={{ borderRadius: 2 }}
                          >
                            Acknowledge
                          </Button>
                        ) : (
                          <Chip
                            icon={<CheckCircle />}
                            label='Acknowledged'
                            size='small'
                            color='success'
                            variant='outlined'
                          />
                        )}
                      </TableCell>
                    )}
                    <TableCell
                      align='right'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip title='Actions'>
                        <IconButton
                          size='small'
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionMenuOpen(e, treatment);
                          }}
                        >
                          <MoreVert fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component='div'
          count={displayTotal}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>

      {/* Actions Menu */}
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
        {canUpdateTreatments() && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <Edit fontSize='small' />
            </ListItemIcon>
            Edit Treatment
          </MenuItem>
        )}
        {canManageTreatmentLinks() && (
          <MenuItem>
            <ListItemIcon>
              <LinkIcon fontSize='small' />
            </ListItemIcon>
            Link Treatment
          </MenuItem>
        )}
        {canUpdateTreatmentStatus() && (
          <>
            <MenuItem divider />
            <MenuItem>
              <ListItemIcon>
                <CheckCircle fontSize='small' color='success' />
              </ListItemIcon>
              Mark Complete
            </MenuItem>
            <MenuItem>
              <ListItemIcon>
                <Warning fontSize='small' color='warning' />
              </ListItemIcon>
              Put On Hold
            </MenuItem>
          </>
        )}
        {canDeleteTreatments() && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <Delete fontSize='small' color='error' />
            </ListItemIcon>
            Delete Treatment
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default TreatmentsPage;
