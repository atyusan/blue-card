import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  People,
  MedicalServices,
  Receipt,
  Event,
  TrendingUp,
  TrendingDown,
  Visibility,
  Payment,
  Warning,
  Schedule,
  AttachMoney,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import { dashboardService } from '../services/dashboard.service';
import { formatCurrency, formatDate } from '../utils';
import toast from 'react-hot-toast';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getDashboardData,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Dashboard refreshed successfully');
    } catch (_error) {
      toast.error('Failed to refresh dashboard');
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await dashboardService.exportDashboardReport('pdf');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-report-${
        new Date().toISOString().split('T')[0]
      }.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Dashboard report downloaded successfully');
    } catch (_error) {
      toast.error('Failed to download dashboard report');
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-patient':
        navigate('/patients/add');
        break;
      case 'create-appointment':
        navigate('/appointments/create');
        break;
      case 'create-invoice':
        navigate('/billing/create');
        break;
      case 'view-reports':
        navigate('/reports');
        break;
      default:
        break;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box>
        <PageHeader
          title='Dashboard'
          subtitle="Welcome back! Here's what's happening with your hospital today."
          breadcrumbs={<Breadcrumb />}
          showActions={false}
        />
        <Box className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8'>
          {[...Array(4)].map((_, index) => (
            <Card key={index}>
              <CardContent className='p-6'>
                <Skeleton variant='rectangular' height={120} />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  // Error state
  if (isError || !dashboardData) {
    return (
      <Box>
        <PageHeader
          title='Dashboard'
          subtitle="Welcome back! Here's what's happening with your hospital today."
          breadcrumbs={<Breadcrumb />}
          onRefresh={handleRefresh}
          showActions={true}
        />
        <Alert
          severity='error'
          action={
            <Button color='inherit' size='small' onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          Failed to load dashboard data. Please try again.
        </Alert>
      </Box>
    );
  }

  const stats = [
    {
      title: 'Total Patients',
      value: dashboardData.stats.patients.total.toLocaleString(),
      change: `${dashboardData.stats.patients.growth > 0 ? '+' : ''}${
        dashboardData.stats.patients.growth
      }%`,
      changeType:
        dashboardData.stats.patients.growth >= 0
          ? ('positive' as const)
          : ('negative' as const),
      color: 'primary',
      icon: People,
      subtitle: `${dashboardData.stats.patients.newThisMonth} new this month`,
    },
    {
      title: "Today's Appointments",
      value: dashboardData.stats.appointments.todayCount.toString(),
      change: `${dashboardData.stats.appointments.upcomingCount} upcoming`,
      changeType: 'positive' as const,
      color: 'success',
      icon: Event,
      subtitle: `${dashboardData.stats.appointments.weekCount} this week`,
    },
    {
      title: 'Pending Invoices',
      value: dashboardData.stats.invoices.pending.toString(),
      change: `${dashboardData.stats.invoices.overdue} overdue`,
      changeType:
        dashboardData.stats.invoices.overdue > 0
          ? ('negative' as const)
          : ('positive' as const),
      color: 'warning',
      icon: Receipt,
      subtitle: `${dashboardData.stats.invoices.total} total invoices`,
    },
    {
      title: 'Revenue (This Month)',
      value: formatCurrency(dashboardData.stats.revenue.thisMonth),
      change: `${dashboardData.stats.revenue.growth > 0 ? '+' : ''}${
        dashboardData.stats.revenue.growth
      }%`,
      changeType:
        dashboardData.stats.revenue.growth >= 0
          ? ('positive' as const)
          : ('negative' as const),
      color: 'info',
      icon: AttachMoney,
      subtitle: `${formatCurrency(dashboardData.stats.revenue.yearToDate)} YTD`,
    },
  ];

  const quickActions = [
    {
      label: 'Add New Patient',
      action: 'add-patient',
      icon: People,
      color: 'primary' as const,
    },
    {
      label: 'Schedule Appointment',
      action: 'create-appointment',
      icon: Event,
      color: 'success' as const,
    },
    {
      label: 'Create Invoice',
      action: 'create-invoice',
      icon: Receipt,
      color: 'warning' as const,
    },
    {
      label: 'View Reports',
      action: 'view-reports',
      icon: MedicalServices,
      color: 'info' as const,
    },
  ];

  return (
    <Box>
      {/* Page Header with Breadcrumbs */}
      <PageHeader
        title='Dashboard'
        subtitle="Welcome back! Here's what's happening with your hospital today."
        breadcrumbs={<Breadcrumb />}
        onRefresh={handleRefresh}
        onDownload={handleDownload}
        showActions={true}
      />

      {/* Stats Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 4,
        }}
      >
        {stats.map((stat, index) => (
          <Card key={index} sx={{ height: '100%', minHeight: 160 }}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: `${stat.color}.100`,
                    color: `${stat.color}.main`,
                  }}
                >
                  <stat.icon sx={{ fontSize: 28 }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {stat.changeType === 'positive' ? (
                    <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
                  ) : (
                    <TrendingDown sx={{ color: 'error.main', fontSize: 20 }} />
                  )}
                  <Typography
                    variant='body2'
                    sx={{
                      fontWeight: 500,
                      color:
                        stat.changeType === 'positive'
                          ? 'success.main'
                          : 'error.main',
                    }}
                  >
                    {stat.change}
                  </Typography>
                </Box>
              </Box>
              <Typography
                variant='h4'
                component='div'
                sx={{ fontWeight: 'bold', color: 'text.primary', mb: 0.5 }}
              >
                {stat.value}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {stat.title}
              </Typography>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ mt: 0.5, display: 'block' }}
              >
                {stat.subtitle}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Dashboard Content Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: '2fr 1fr',
          },
          gap: 3,
        }}
      >
        {/* Recent Activity */}
        <Box>
          <Card>
            <CardHeader
              title='Recent Activity'
              subheader='Latest updates from your hospital'
              action={
                <Button
                  variant='outlined'
                  size='small'
                  startIcon={<Visibility />}
                  onClick={() => navigate('/dashboard/activity')}
                >
                  View All
                </Button>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              {dashboardData.recentActivities &&
              dashboardData.recentActivities.length > 0 ? (
                <List disablePadding>
                  {dashboardData.recentActivities
                    .slice(0, 5)
                    .map((activity, index) => (
                      <ListItem key={activity.id} divider={index < 4}>
                        <ListItemIcon>
                          {activity.type === 'patient' && (
                            <People color='primary' />
                          )}
                          {activity.type === 'appointment' && (
                            <Event color='success' />
                          )}
                          {activity.type === 'invoice' && (
                            <Receipt color='warning' />
                          )}
                          {activity.type === 'payment' && (
                            <Payment color='info' />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={activity.title}
                          secondary={
                            <Box className='flex items-center justify-between'>
                              <Typography
                                variant='body2'
                                color='text.secondary'
                              >
                                {activity.description}
                              </Typography>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                {formatDate(activity.timestamp)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                </List>
              ) : (
                <Box className='text-center py-8'>
                  <Typography variant='body1' color='text.secondary'>
                    No recent activities
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Quick Actions & Alerts */}
        <Box className='space-y-6'>
          {/* Quick Actions */}
          <Card>
            <CardHeader title='Quick Actions' subheader='Common tasks' />
            <CardContent sx={{ pt: 0 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                  },
                  gap: 2,
                }}
              >
                {quickActions.map((action) => (
                  <Button
                    key={action.action}
                    variant='outlined'
                    fullWidth
                    startIcon={<action.icon />}
                    onClick={() => handleQuickAction(action.action)}
                    sx={{
                      justifyContent: 'flex-start',
                      py: 1.5,
                      px: 2,
                      borderColor: `${action.color}.main`,
                      color: `${action.color}.main`,
                      '&:hover': {
                        backgroundColor: `${action.color}.50`,
                        borderColor: `${action.color}.main`,
                      },
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          {dashboardData.upcomingAppointments &&
            dashboardData.upcomingAppointments.length > 0 && (
              <Card>
                <CardHeader
                  title='Upcoming Appointments'
                  subheader='Next appointments'
                  action={
                    <Button
                      variant='outlined'
                      size='small'
                      onClick={() => navigate('/appointments')}
                    >
                      View All
                    </Button>
                  }
                />
                <CardContent sx={{ pt: 0 }}>
                  <List disablePadding>
                    {dashboardData.upcomingAppointments
                      .slice(0, 3)
                      .map((appointment, index) => (
                        <ListItem key={appointment.id} divider={index < 2}>
                          <ListItemIcon>
                            <Schedule color='primary' />
                          </ListItemIcon>
                          <ListItemText
                            primary={appointment.patientName}
                            secondary={
                              <Box>
                                <Typography
                                  variant='body2'
                                  color='text.secondary'
                                >
                                  {appointment.serviceName}
                                </Typography>
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  {formatDate(appointment.appointmentDate)} at{' '}
                                  {appointment.appointmentTime}
                                </Typography>
                              </Box>
                            }
                          />
                          <Chip
                            label={appointment.status}
                            size='small'
                            color={
                              appointment.status === 'confirmed'
                                ? 'success'
                                : 'default'
                            }
                          />
                        </ListItem>
                      ))}
                  </List>
                </CardContent>
              </Card>
            )}

          {/* Overdue Invoices Alert */}
          {dashboardData.overdueInvoices &&
            dashboardData.overdueInvoices.length > 0 && (
              <Card>
                <CardHeader
                  title={
                    <Box className='flex items-center gap-2'>
                      <Warning color='error' />
                      <Typography variant='h6'>Overdue Invoices</Typography>
                    </Box>
                  }
                  subheader={`${dashboardData.overdueInvoices.length} invoices need attention`}
                  action={
                    <Button
                      variant='outlined'
                      size='small'
                      color='error'
                      onClick={() => navigate('/billing?status=overdue')}
                    >
                      View All
                    </Button>
                  }
                />
                <CardContent sx={{ pt: 0 }}>
                  <List disablePadding>
                    {dashboardData.overdueInvoices
                      .slice(0, 3)
                      .map((invoice, index) => (
                        <ListItem key={invoice.id} divider={index < 2}>
                          <ListItemIcon>
                            <Receipt color='error' />
                          </ListItemIcon>
                          <ListItemText
                            primary={`Invoice #${invoice.number}`}
                            secondary={
                              <Box>
                                <Typography
                                  variant='body2'
                                  color='text.secondary'
                                >
                                  {invoice.patientName}
                                </Typography>
                                <Typography variant='caption' color='error'>
                                  Due: {formatDate(invoice.dueDate)}
                                </Typography>
                              </Box>
                            }
                          />
                          <Typography
                            variant='body2'
                            color='error'
                            className='font-medium'
                          >
                            {formatCurrency(invoice.totalAmount)}
                          </Typography>
                        </ListItem>
                      ))}
                  </List>
                </CardContent>
              </Card>
            )}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardPage;
