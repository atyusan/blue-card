import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Menu,
  MenuItem,
  ListItemIcon,
  Chip,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  Tooltip,
  Skeleton,
  Tabs,
  Tab,
  Grid,
  Paper,
  Badge,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Notifications,
  Send,
  Email,
  Sms,
  NotificationsActive,
  Add,
  Refresh,
  FileDownload,
  Settings,
  Analytics,
  Science,
  DeleteSweep,
  Assessment,
  PlayArrow,
  Person,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import { notificationsService } from '../services/notifications.service';
import type {
  Notification,
  NotificationTemplate,
  NotificationSearchResult,
} from '../types';
import { formatDate, formatTime } from '../utils';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`notifications-tabpanel-${index}`}
      aria-labelledby={`notifications-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // State management
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<string>('');

  // Query parameters
  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: rowsPerPage,
      search: searchQuery || undefined,
      status: statusFilter || undefined,
      channel: channelFilter || undefined,
    }),
    [page, rowsPerPage, searchQuery, statusFilter, channelFilter]
  );

  // Fetch notifications
  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    isError: notificationsError,
    refetch: refetchNotifications,
  } = useQuery<NotificationSearchResult>({
    queryKey: ['notifications', queryParams],
    queryFn: () => notificationsService.getNotifications(queryParams),
    placeholderData: (previousData) => previousData,
  });

  // Fetch notification templates
  const {
    data: templatesData,
    isLoading: templatesLoading,
    isError: templatesError,
    refetch: refetchTemplates,
  } = useQuery<NotificationTemplate[]>({
    queryKey: ['notification-templates'],
    queryFn: () => notificationsService.getNotificationTemplates(),
  });

  // Mutations
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => notificationsService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedNotification(null);
    },
    onError: (error) => {
      console.error('Delete notification error:', error);
      toast.error('Failed to delete notification');
    },
  });

  // Event handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
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
    notification: Notification
  ) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedNotification(notification);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedNotification(null);
  };

  const handleDeleteNotification = () => {
    setDeleteDialogOpen(true);
    handleActionMenuClose();
  };

  const confirmDeleteNotification = () => {
    if (selectedNotification) {
      deleteNotificationMutation.mutate(selectedNotification.id);
    }
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchNotifications(), refetchTemplates()]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'sent':
        return 'success';
      case 'delivered':
        return 'info';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'read':
        return 'default';
      default:
        return 'default';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel?.toLowerCase()) {
      case 'email':
        return <Email fontSize='small' />;
      case 'sms':
        return <Sms fontSize='small' />;
      case 'push_notification':
        return <NotificationsActive fontSize='small' />;
      case 'in_app':
        return <Notifications fontSize='small' />;
      default:
        return <Notifications fontSize='small' />;
    }
  };

  const notifications = notificationsData?.notifications || [];
  const totalCount = notificationsData?.total || 0;

  return (
    <Box>
      {/* Page Header */}
      <PageHeader
        title='Notifications'
        subtitle='Manage notification templates, send notifications, and monitor delivery status'
        breadcrumbs={<Breadcrumb />}
        onRefresh={handleRefresh}
        showActions={true}
      />

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Notifications />
                  Notifications
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Edit />
                  Templates
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Analytics />
                  Statistics
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Settings />
                  Management
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={0}>
          {/* Search and Filters */}
          <Box p={3}>
            <Box display='flex' gap={2} alignItems='center' flexWrap='wrap'>
              <TextField
                placeholder='Search notifications...'
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ flex: 1, minWidth: 200 }}
              />
              <FormControl size='small' sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label='Status'
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value=''>All</MenuItem>
                  <MenuItem value='pending'>Pending</MenuItem>
                  <MenuItem value='sent'>Sent</MenuItem>
                  <MenuItem value='delivered'>Delivered</MenuItem>
                  <MenuItem value='failed'>Failed</MenuItem>
                  <MenuItem value='read'>Read</MenuItem>
                </Select>
              </FormControl>
              <FormControl size='small' sx={{ minWidth: 120 }}>
                <InputLabel>Channel</InputLabel>
                <Select
                  value={channelFilter}
                  label='Channel'
                  onChange={(e) => setChannelFilter(e.target.value)}
                >
                  <MenuItem value=''>All</MenuItem>
                  <MenuItem value='email'>Email</MenuItem>
                  <MenuItem value='sms'>SMS</MenuItem>
                  <MenuItem value='push_notification'>Push</MenuItem>
                  <MenuItem value='in_app'>In-App</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Notifications Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Recipient</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Channel</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Sent At</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notificationsLoading
                  ? [...Array(5)].map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Skeleton variant='text' width={100} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant='text' width={150} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant='text' width={80} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant='text' width={100} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant='text' width={80} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant='text' width={100} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant='text' width={80} />
                        </TableCell>
                      </TableRow>
                    ))
                  : notifications.map((notification) => (
                      <TableRow key={notification.id} hover>
                        <TableCell>
                          <Box display='flex' alignItems='center' gap={2}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <Person />
                            </Avatar>
                            <Box>
                              <Typography variant='body2' fontWeight={500}>
                                {notification.recipientId.slice(-8)}
                              </Typography>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                {notification.recipientType}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' noWrap>
                            {notification.subject}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display='flex' alignItems='center' gap={1}>
                            {getChannelIcon(notification.channel)}
                            <Typography variant='body2'>
                              {notification.channel.replace('_', ' ')}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {notification.type}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={notification.status}
                            color={getStatusColor(notification.status) as any}
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {formatDate(
                              notification.sentAt || notification.createdAt
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Tooltip title='More actions'>
                            <IconButton
                              onClick={(e) =>
                                handleActionMenuOpen(e, notification)
                              }
                              size='small'
                            >
                              <MoreVert />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
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
        </TabPanel>

        {/* Templates Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box p={3}>
            <Box
              display='flex'
              justifyContent='space-between'
              alignItems='center'
              mb={3}
            >
              <Typography variant='h6'>Notification Templates</Typography>
              <Button variant='contained' startIcon={<Add />}>
                Create Template
              </Button>
            </Box>

            <Grid container spacing={3}>
              {templatesLoading
                ? [...Array(6)].map((_, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Skeleton variant='rectangular' height={200} />
                    </Grid>
                  ))
                : templatesData?.map((template) => (
                    <Grid item xs={12} sm={6} md={4} key={template.id}>
                      <Card>
                        <Box p={2}>
                          <Typography variant='h6' gutterBottom>
                            {template.name}
                          </Typography>
                          <Chip
                            label={template.channel.replace('_', ' ')}
                            size='small'
                            color='primary'
                            variant='outlined'
                            sx={{ mb: 2 }}
                          />
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            mb={2}
                          >
                            {template.subject}
                          </Typography>
                          <Typography variant='body2' noWrap>
                            {template.content}
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
            </Grid>
          </Box>
        </TabPanel>

        {/* Statistics Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box p={3}>
            <Typography variant='h6' gutterBottom>
              Notification Statistics
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Statistics and analytics coming soon...
            </Typography>
          </Box>
        </TabPanel>

        {/* Management Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box p={3}>
            <Typography variant='h6' gutterBottom>
              System Management
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <Box p={3}>
                    <Typography variant='h6' gutterBottom>
                      Manual Operations
                    </Typography>
                    <Box display='flex' flexDirection='column' gap={2}>
                      <Button
                        variant='outlined'
                        startIcon={<PlayArrow />}
                        onClick={() => {
                          notificationsService.processScheduledNotifications();
                          toast.success(
                            'Processing scheduled notifications...'
                          );
                        }}
                      >
                        Process Scheduled
                      </Button>
                      <Button
                        variant='outlined'
                        startIcon={<PlayArrow />}
                        onClick={() => {
                          notificationsService.processAppointmentReminders();
                          toast.success('Processing appointment reminders...');
                        }}
                      >
                        Process Reminders
                      </Button>
                      <Button
                        variant='outlined'
                        startIcon={<DeleteSweep />}
                        onClick={() => {
                          notificationsService.cleanupOldNotifications();
                          toast.success('Cleaning up old notifications...');
                        }}
                      >
                        Cleanup Old
                      </Button>
                      <Button
                        variant='outlined'
                        startIcon={<Assessment />}
                        onClick={() => {
                          notificationsService.generateDailyReport();
                          toast.success('Generating daily report...');
                        }}
                      >
                        Generate Report
                      </Button>
                      <Button
                        variant='outlined'
                        startIcon={<Science />}
                        onClick={() => {
                          // Open test notification dialog
                          toast.success(
                            'Test notification feature coming soon...'
                          );
                        }}
                      >
                        Test Notifications
                      </Button>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem>
          <ListItemIcon>
            <Edit fontSize='small' sx={{ mr: 1 }} />
          </ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem
          onClick={handleDeleteNotification}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Delete fontSize='small' sx={{ mr: 1 }} />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Notification</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this notification? This action cannot
          be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDeleteNotification}
            color='error'
            variant='contained'
            disabled={deleteNotificationMutation.isPending}
          >
            {deleteNotificationMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationsPage;
