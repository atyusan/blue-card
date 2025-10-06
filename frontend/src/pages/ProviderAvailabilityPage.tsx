import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Tabs,
  Tab,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Stack,
} from '@mui/material';
import {
  CalendarToday,
  Schedule,
  Person,
  Add,
  Edit,
  Delete,
  Visibility,
  Block,
  CheckCircle,
  Warning,
  Info,
  Refresh,
  FilterList,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { staffService } from '../services/staff.service';
import { appointmentService } from '../services/appointment.service';
import type { StaffMember } from '../types/staff';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';

// Import components (we'll create these)
import AvailabilityCalendar from '@/components/availability/AvailabilityCalendar';
import WorkingHoursForm from '@/components/availability/WorkingHoursForm';
import TimeSlotManager from '@/components/availability/TimeSlotManager';
import TimeOffRequests from '@/components/availability/TimeOffRequests';
import AvailabilityStats from '@/components/availability/AvailabilityStats';

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
      id={`availability-tabpanel-${index}`}
      aria-labelledby={`availability-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProviderAvailabilityPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const { staffMember, user, refreshUser } = useAuth();

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<StaffMember | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Get provider's availability data
  const { data: availabilityData, isLoading: isLoadingAvailability } = useQuery(
    {
      queryKey: [
        'provider-availability',
        selectedProvider?.id,
        selectedDate,
        refreshTrigger,
      ],
      queryFn: async () => {
        if (!selectedProvider?.id) return null;

        const startDate = new Date(selectedDate);
        startDate.setDate(startDate.getDate() - 7); // Get data for the week

        const endDate = new Date(selectedDate);
        endDate.setDate(endDate.getDate() + 7);

        return await appointmentService.getProviderAvailability({
          providerId: selectedProvider.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
      },
      enabled: !!selectedProvider?.id,
    }
  );

  // Get provider's slots
  const { data: slotsData, isLoading: isLoadingSlots } = useQuery({
    queryKey: ['provider-slots', selectedProvider?.id, selectedDate],
    queryFn: async () => {
      if (!selectedProvider?.id) return null;

      const startDate = new Date(selectedDate);
      startDate.setMonth(startDate.getMonth() - 1);

      const endDate = new Date(selectedDate);
      endDate.setMonth(endDate.getMonth() + 1);

      return await appointmentService.getAllSlots({
        providerId: selectedProvider.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    },
    enabled: !!selectedProvider?.id,
  });

  // Refresh user data on mount to ensure we have the latest staffMember info
  // Only refresh if we don't have staffMember info and user is not admin
  useEffect(() => {
    const isAdmin = user?.permissions?.includes('admin');
    if (!staffMember && !isAdmin) {
      refreshUser();
    }
  }, [refreshUser, staffMember, user]);

  // Set current user as selected provider on mount (only for non-admin users)
  useEffect(() => {
    const isAdmin = user?.permissions?.includes('admin');
    if (staffMember && !selectedProvider && !isAdmin) {
      setSelectedProvider(staffMember);
    }
  }, [staffMember, selectedProvider, user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
    showSuccess('Availability data refreshed');
  };

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
  };

  // Check if user is admin or service provider
  const isAdmin = user?.permissions?.includes('admin');
  const isServiceProvider = staffMember?.serviceProvider;

  // Access control: Admin users can access, non-admin users must be service providers
  if (!isAdmin && (!staffMember || !isServiceProvider)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='warning'>
          You must be logged in as a service provider or administrator to access
          this page.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' sx={{ fontWeight: 600, mb: 1 }}>
          Provider Availability Management
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          {isAdmin
            ? 'View and manage provider schedules and availability'
            : 'Manage your schedule, availability, and time slots'}
        </Typography>
      </Box>

      {/* Provider Selector for Admin Users */}
      {isAdmin && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
              Select Provider
            </Typography>
            <ProviderSelector
              selectedProvider={selectedProvider}
              onProviderChange={setSelectedProvider}
            />
          </CardContent>
        </Card>
      )}

      {/* Show message for admin users without a selected provider */}
      {isAdmin && !selectedProvider && (
        <Alert severity='info' sx={{ mb: 3 }}>
          Please select a provider from the dropdown above to view their
          availability details.
        </Alert>
      )}

      {/* Provider Info Card - Only show when provider is selected */}
      {selectedProvider && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems='center'>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {selectedProvider?.user?.firstName?.[0]}
                    {selectedProvider?.user?.lastName?.[0]}
                  </Box>
                  <Box>
                    <Typography variant='h6' sx={{ fontWeight: 600 }}>
                      Dr. {selectedProvider?.user?.firstName}{' '}
                      {selectedProvider?.user?.lastName}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {selectedProvider?.specialization || 'General Practice'} •{' '}
                      {selectedProvider?.department?.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip
                        label={
                          selectedProvider?.isActive ? 'Active' : 'Inactive'
                        }
                        color={
                          selectedProvider?.isActive ? 'success' : 'default'
                        }
                        size='small'
                      />
                      <Chip
                        label='Service Provider'
                        color='primary'
                        size='small'
                      />
                    </Box>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box
                  sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}
                >
                  <Tooltip title='Refresh Data'>
                    <IconButton onClick={handleRefresh} color='primary'>
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant='outlined'
                    startIcon={<FilterList />}
                    onClick={() => {
                      /* TODO: Implement filters */
                    }}
                  >
                    Filters
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Content that only shows when provider is selected */}
      {selectedProvider && (
        <>
          {/* Quick Stats */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
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
                        {slotsData?.slots?.length || 0}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Total Slots
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
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
                        {slotsData?.slots?.filter(
                          (slot) =>
                            slot.isAvailable &&
                            (slot.currentBookings || 0) <
                              (slot.maxBookings || 0)
                        ).length || 0}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Available Slots
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
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
                      <Schedule fontSize='small' />
                    </Box>
                    <Box>
                      <Typography variant='h6' sx={{ fontWeight: 600 }}>
                        {slotsData?.slots?.filter(
                          (slot) => (slot.currentBookings || 0) > 0
                        ).length || 0}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Booked Slots
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'error.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      <Block fontSize='small' />
                    </Box>
                    <Box>
                      <Typography variant='h6' sx={{ fontWeight: 600 }}>
                        {slotsData?.slots?.filter((slot) => !slot.isAvailable)
                          .length || 0}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Blocked Slots
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Main Content Tabs */}
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                aria-label='availability management tabs'
              >
                <Tab
                  icon={<CalendarToday />}
                  iconPosition='start'
                  label='Calendar View'
                  id='availability-tab-0'
                  aria-controls='availability-tabpanel-0'
                />
                <Tab
                  icon={<Schedule />}
                  iconPosition='start'
                  label='Time Slots'
                  id='availability-tab-1'
                  aria-controls='availability-tabpanel-1'
                />
                <Tab
                  icon={<Person />}
                  iconPosition='start'
                  label='Working Hours'
                  id='availability-tab-2'
                  aria-controls='availability-tabpanel-2'
                />
                <Tab
                  icon={<Block />}
                  iconPosition='start'
                  label='Time Off'
                  id='availability-tab-3'
                  aria-controls='availability-tabpanel-3'
                />
                <Tab
                  icon={<Info />}
                  iconPosition='start'
                  label='Statistics'
                  id='availability-tab-4'
                  aria-controls='availability-tabpanel-4'
                />
              </Tabs>
            </Box>

            <TabPanel value={activeTab} index={0}>
              <AvailabilityCalendar
                provider={selectedProvider}
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                availabilityData={availabilityData}
                slotsData={slotsData?.slots || []}
                onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <TimeSlotManager
                provider={selectedProvider}
                selectedDate={selectedDate}
                slotsData={slotsData?.slots || []}
                onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <WorkingHoursForm
                provider={selectedProvider}
                onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <TimeOffRequests
                provider={selectedProvider}
                onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={4}>
              <AvailabilityStats
                provider={selectedProvider}
                availabilityData={availabilityData}
                slotsData={slotsData?.slots || []}
              />
            </TabPanel>
          </Paper>
        </>
      )}
    </Box>
  );
};

// Provider Selector Component for Admin Users
interface ProviderSelectorProps {
  selectedProvider: StaffMember | null;
  onProviderChange: (provider: StaffMember | null) => void;
}

const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  selectedProvider,
  onProviderChange,
}) => {
  // Fetch service providers
  const { data: providersData, isLoading } = useQuery({
    queryKey: ['service-providers'],
    queryFn: () => staffService.getServiceProviders(),
  });

  if (isLoading) {
    return <CircularProgress />;
  }

  const providers = providersData?.data || [];

  return (
    <FormControl fullWidth>
      <InputLabel>Select Provider</InputLabel>
      <Select
        value={selectedProvider?.id || ''}
        onChange={(e) => {
          const providerId = e.target.value;
          const provider = providers.find((p) => p.id === providerId);
          onProviderChange(provider || null);
        }}
        label='Select Provider'
      >
        {providers.map((provider) => (
          <MenuItem key={provider.id} value={provider.id}>
            {provider.user.firstName} {provider.user.lastName}
            {provider.specialization && ` - ${provider.specialization}`}
            {provider.department && ` (${provider.department.name})`}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ProviderAvailabilityPage;
