import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Paper,
  Avatar,
  Button,
  Skeleton,
  Alert,
  Grid,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Person, CalendarToday } from '@mui/icons-material';
import CustomCalendar from './CustomCalendar';

interface TimeSlot {
  time: string;
  endTime: string;
  isAvailable: boolean;
  isBooked: boolean;
  isBreak: boolean;
  duration: number;
}

interface DayAvailability {
  date: string;
  dayOfWeek: number;
  isAvailable: boolean;
  isPast: boolean;
  isToday: boolean;
  startTime: string;
  endTime: string;
  maxAppointments: number;
  slotDuration: number;
  bufferTime: number;
  availableSlots: any[];
  bookedSlots: any[];
  timeOff: any[];
  totalSlots: number;
  availableSlotsCount: number;
  availabilityPercentage: number;
  timeSlots: TimeSlot[];
}

interface AvailabilityData {
  providerId: string;
  providerName: string;
  availability: DayAvailability[];
}

interface ProviderSchedulingProps {
  providers: any;
  providersLoading: boolean;
  selectedProvider: any;
  onProviderSelect: (provider: any) => void;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  selectedSlot: any;
  onSlotSelect: (slot: any) => void;
  availableSlots: any[];
  slotsLoading: boolean;
  refetchSlots: () => void;
  formatDate: (date: Date) => string;
  formatTime: (time: string | Date) => string;
}

const ProviderScheduling: React.FC<ProviderSchedulingProps> = ({
  providers,
  providersLoading,
  selectedProvider,
  onProviderSelect,
  selectedDate,
  onDateSelect,
  selectedSlot,
  onSlotSelect,
  availableSlots,
  slotsLoading,
  refetchSlots,
  formatDate,
  formatTime,
}) => {
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityData, setAvailabilityData] =
    useState<AvailabilityData | null>(null);

  // Mock data for testing
  const createMockAvailability = (date: Date) => {
    const availability = [];
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const isPast = currentDate < new Date();
      const dayOfWeek = currentDate.getDay();

      // Available on weekdays (Mon-Fri), not on weekends
      const isAvailable = !isPast && dayOfWeek >= 1 && dayOfWeek <= 5;

      availability.push({
        date: currentDate.toISOString().split('T')[0],
        dayOfWeek,
        isAvailable,
        isPast,
        isToday: currentDate.toDateString() === new Date().toDateString(),
        startTime: '09:00',
        endTime: '17:00',
        maxAppointments: 8,
        slotDuration: 30,
        bufferTime: 15,
        availableSlots: [],
        bookedSlots: [],
        timeOff: [],
        totalSlots: isAvailable ? 16 : 0,
        availableSlotsCount: isAvailable ? 16 : 0,
        availabilityPercentage: isAvailable ? 100 : 0,
        timeSlots: isAvailable ? generateMockTimeSlots() : [],
      });
    }

    return {
      providerId: selectedProvider?.id || '',
      providerName: selectedProvider
        ? `Dr. ${selectedProvider.firstName} ${selectedProvider.lastName}`
        : '',
      availability,
    };
  };

  const generateMockTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`;
        slots.push({
          time: timeString,
          endTime: `${hour.toString().padStart(2, '0')}:${(minute + 30)
            .toString()
            .padStart(2, '0')}`,
          isAvailable: true,
          isBooked: false,
          isBreak: false,
          duration: 30,
        });
      }
    }
    return slots;
  };

  // Load mock availability data when provider is selected
  React.useEffect(() => {
    if (selectedProvider) {
      const mockData = createMockAvailability(new Date());
      setAvailabilityData(mockData);
    }
  }, [selectedProvider]);

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    setSelectedTimeSlot(null);
    setShowDateTimePicker(false);
    refetchSlots();
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
  };

  return (
    <Box>
      <Typography variant='h6' gutterBottom>
        Select Provider and Schedule
      </Typography>

      {/* Provider Selection */}
      <Box mb={3}>
        <Typography variant='subtitle1' gutterBottom>
          Provider *
        </Typography>
        {selectedProvider ? (
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Person />
            </Avatar>
            <Box>
              <Typography variant='body1' fontWeight={500}>
                Dr. {selectedProvider.firstName} {selectedProvider.lastName}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {(selectedProvider as any).department || 'General Medicine'}
              </Typography>
            </Box>
            <Button
              size='small'
              onClick={() => onProviderSelect(null)}
              sx={{ ml: 'auto' }}
            >
              Change
            </Button>
          </Paper>
        ) : (
          <Box>
            {providersLoading ? (
              <Box mt={2}>
                {[...Array(3)].map((_, index) => (
                  <Skeleton
                    key={index}
                    variant='rectangular'
                    height={60}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
            ) : (
              <FormControl fullWidth>
                <InputLabel>Select Provider</InputLabel>
                <Select
                  value={selectedProvider?.id || ''}
                  onChange={(e) => {
                    const provider = providers?.data?.find(
                      (p: any) => p.id === e.target.value
                    );
                    if (provider) {
                      onProviderSelect(provider);
                    }
                  }}
                  label='Select Provider'
                  displayEmpty
                >
                  {providers?.data?.map((provider: any) => (
                    <MenuItem key={provider.id} value={provider.id}>
                      Dr. {provider.firstName} {provider.lastName} -{' '}
                      {(provider as any).department || 'General Medicine'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        )}
      </Box>

      {/* Date Selection */}
      <Box mb={3}>
        <Typography variant='subtitle1' gutterBottom>
          Appointment Date *
        </Typography>

        {/* Smart Date-Time Picker */}
        <Box>
          <TextField
            fullWidth
            label='Click to select appointment date and time'
            value={selectedDate ? formatDate(selectedDate) : ''}
            onClick={() => setShowDateTimePicker(true)}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <IconButton onClick={() => setShowDateTimePicker(true)}>
                  <CalendarToday />
                </IconButton>
              ),
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Box>

        {/* Custom Calendar Dialog */}
        <CustomCalendar
          open={showDateTimePicker}
          onClose={() => setShowDateTimePicker(false)}
          selectedProvider={selectedProvider}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onTimeSlotSelect={handleTimeSlotSelect}
          availabilityData={availabilityData}
          loadingAvailability={loadingAvailability}
          selectedTimeSlot={selectedTimeSlot}
        />
      </Box>

      {/* Available Slots */}
      {selectedDate && selectedProvider && (
        <Box>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
            mb={2}
          >
            <Typography variant='subtitle1'>Available Time Slots</Typography>
            <IconButton onClick={() => refetchSlots()} disabled={slotsLoading}>
              <CalendarToday />
            </IconButton>
          </Box>

          {slotsLoading ? (
            <Box display='flex' justifyContent='center' p={3}>
              <CircularProgress />
            </Box>
          ) : availableSlots && availableSlots.length > 0 ? (
            <Box>
              <Grid container spacing={2}>
                {availableSlots.map((slot) => (
                  <Grid item xs={12} sm={6} md={4} key={slot.id}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: selectedSlot?.id === slot.id ? 2 : 1,
                        borderColor:
                          selectedSlot?.id === slot.id
                            ? 'primary.main'
                            : 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                        },
                      }}
                      onClick={() => onSlotSelect(slot)}
                    >
                      <Box textAlign='center'>
                        <Typography variant='h6' color='primary'>
                          {formatTime(slot.startTime)}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          Duration: {slot.duration} min
                        </Typography>
                        <Chip
                          label={slot.isAvailable ? 'Available' : 'Unavailable'}
                          color={slot.isAvailable ? 'success' : 'error'}
                          size='small'
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            <Alert severity='info'>
              No available slots found for the selected date and provider.
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ProviderScheduling;
