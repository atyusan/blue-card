import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  Alert,
  Grid,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  CalendarToday,
  Cancel,
  ArrowBack,
  ArrowForward,
  Check,
} from '@mui/icons-material';

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

interface CustomCalendarProps {
  open: boolean;
  onClose: () => void;
  selectedProvider: any;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onTimeSlotSelect: (slot: TimeSlot) => void;
  availabilityData: AvailabilityData | null;
  loadingAvailability: boolean;
  selectedTimeSlot: TimeSlot | null;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({
  open,
  onClose,
  selectedProvider,
  selectedDate,
  onDateSelect,
  onTimeSlotSelect,
  availabilityData,
  loadingAvailability,
  selectedTimeSlot,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Helper functions
  const getBorderColor = (status: string, isSelected: boolean) => {
    if (isSelected) return 'primary.main';

    switch (status) {
      case 'available':
        return 'success.main';
      case 'weekend':
        return 'warning.main';
      case 'past':
        return 'grey.400';
      case 'unavailable':
        return 'grey.300';
      default:
        return 'grey.300';
    }
  };

  const getDaysInMonth = (date: Date) => {
    const days: Date[] = [];
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 6 for Saturday

    // Add days from the previous month to fill the first row
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(
        new Date(
          date.getFullYear(),
          date.getMonth() - 1,
          date.getDate() - startDayOfWeek + i + 1
        )
      );
    }

    // Add days from the current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), i));
    }

    // Add days from the next month to fill the last row
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        days.push(new Date(date.getFullYear(), date.getMonth() + 1, i));
      }
    }

    return days;
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentMonth((prevMonth) => {
      const newMonth = new Date(prevMonth);
      if (direction === 'prev') {
        newMonth.setMonth(prevMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(prevMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    setCurrentMonth(date); // Reset month to the selected date's month
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    onTimeSlotSelect(slot);
  };

  // Get availability for selected date
  const selectedDateAvailability = selectedDate
    ? availabilityData?.availability?.find(
        (day: DayAvailability) =>
          day.date === selectedDate.toISOString().split('T')[0]
      )
    : null;

  // Reset month when selected date changes
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(selectedDate);
    }
  }, [selectedDate]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth='lg' fullWidth>
      <DialogTitle>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h5' fontWeight='bold'>
            Select Appointment Date & Time
          </Typography>
          <IconButton onClick={onClose}>
            <Cancel />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!selectedProvider ? (
          <Alert severity='info' sx={{ mt: 2 }}>
            Please select a provider first to view available dates and times.
          </Alert>
        ) : (
          <Box sx={{ mt: 2 }}>
            {/* Month Navigation */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                p: 2,
                backgroundColor: 'grey.50',
                borderRadius: 2,
              }}
            >
              <IconButton
                onClick={() => handleMonthChange('prev')}
                sx={{
                  backgroundColor: 'white',
                  '&:hover': { backgroundColor: 'grey.100' },
                }}
              >
                <ArrowBack />
              </IconButton>
              <Typography variant='h5' fontWeight='bold' color='primary'>
                {currentMonth.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Typography>
              <IconButton
                onClick={() => handleMonthChange('next')}
                sx={{
                  backgroundColor: 'white',
                  '&:hover': { backgroundColor: 'grey.100' },
                }}
              >
                <ArrowForward />
              </IconButton>
            </Box>

            {/* Custom Calendar Grid */}
            <Box sx={{ mb: 3 }}>
              {/* Day Headers */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 1,
                  mb: 2,
                }}
              >
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                  (day) => (
                    <Box
                      key={day}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        fontWeight: 'bold',
                        backgroundColor: 'primary.main',
                        color: 'white',
                        borderRadius: 1,
                        fontSize: '0.875rem',
                      }}
                    >
                      {day}
                    </Box>
                  )
                )}
              </Box>

              {/* Calendar Days Grid */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 1,
                }}
              >
                {getDaysInMonth(currentMonth).map((date, index) => {
                  const dateString = date.toISOString().split('T')[0];
                  const isCurrentMonth =
                    date.getMonth() === currentMonth.getMonth();
                  const isPast = date < new Date();
                  const isToday =
                    date.toDateString() === new Date().toDateString();

                  // Find availability data for this date
                  const dayAvailability = availabilityData?.availability?.find(
                    (day: DayAvailability) => day.date === dateString
                  );

                  const isAvailable = dayAvailability?.isAvailable || false;
                  const availableSlotsCount =
                    dayAvailability?.availableSlotsCount || 0;
                  const isSelected =
                    selectedDate &&
                    date.toDateString() === selectedDate.toDateString();

                  // Determine date status and styling
                  let dateStatus = 'unavailable';
                  if (isPast) dateStatus = 'past';
                  else if (isAvailable) dateStatus = 'available';
                  else if (date.getDay() === 0 || date.getDay() === 6)
                    dateStatus = 'weekend';
                  else dateStatus = 'unavailable';

                  return (
                    <Box
                      key={index}
                      sx={{
                        aspectRatio: '1',
                        p: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isAvailable && !isPast ? 'pointer' : 'default',
                        backgroundColor: isSelected
                          ? 'primary.main'
                          : isToday
                          ? 'warning.light'
                          : 'transparent',
                        color: isSelected ? 'white' : 'inherit',
                        borderRadius: 2,
                        border: 3,
                        borderColor: getBorderColor(dateStatus, isSelected),
                        opacity: !isCurrentMonth || isPast ? 0.4 : 1,
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        '&:hover':
                          isAvailable && !isPast
                            ? {
                                backgroundColor: isSelected
                                  ? 'primary.dark'
                                  : 'success.light',
                                transform: 'scale(1.05)',
                                boxShadow: 3,
                              }
                            : {},
                      }}
                      onClick={() => {
                        if (isAvailable && !isPast) {
                          handleDateSelect(date);
                        }
                      }}
                    >
                      {/* Date Number */}
                      <Typography
                        variant='h6'
                        fontWeight={isToday ? 'bold' : 'normal'}
                        sx={{ mb: 0.5 }}
                      >
                        {date.getDate()}
                      </Typography>

                      {/* Availability Indicators */}
                      {isAvailable && !isPast && (
                        <>
                          {/* Slot Count Badge */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              backgroundColor: 'success.main',
                              color: 'white',
                              borderRadius: '50%',
                              width: 20,
                              height: 20,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                            }}
                          >
                            {availableSlotsCount}
                          </Box>

                          {/* Available Indicator */}
                          <Typography
                            variant='caption'
                            sx={{
                              color: 'success.main',
                              fontWeight: 'bold',
                              textAlign: 'center',
                              lineHeight: 1,
                            }}
                          >
                            Available
                          </Typography>
                        </>
                      )}

                      {/* Status Indicators */}
                      {!isAvailable && !isPast && (
                        <Typography
                          variant='caption'
                          sx={{
                            color: 'text.secondary',
                            textAlign: 'center',
                            lineHeight: 1,
                          }}
                        >
                          {date.getDay() === 0 || date.getDay() === 6
                            ? 'Weekend'
                            : 'Unavailable'}
                        </Typography>
                      )}

                      {/* Past Date Indicator */}
                      {isPast && (
                        <Typography
                          variant='caption'
                          sx={{
                            color: 'text.secondary',
                            textAlign: 'center',
                            lineHeight: 1,
                          }}
                        >
                          Past
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Time Slots for Selected Date */}
            {selectedDate && (
              <Box sx={{ mt: 4 }}>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: 'primary.50',
                    borderRadius: 2,
                    mb: 2,
                  }}
                >
                  <Typography variant='h6' gutterBottom color='primary'>
                    📅 Available Time Slots for{' '}
                    {selectedDate.toLocaleDateString()}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Click on a time slot to select your preferred appointment
                    time
                  </Typography>
                </Box>

                {loadingAvailability ? (
                  <Box display='flex' justifyContent='center' p={4}>
                    <CircularProgress size={40} />
                  </Box>
                ) : selectedDateAvailability?.timeSlots?.length > 0 ? (
                  <Box>
                    <Grid container spacing={2}>
                      {selectedDateAvailability.timeSlots.map(
                        (slot: TimeSlot, index: number) => (
                          <Grid item xs={6} sm={4} md={3} key={index}>
                            <Box
                              sx={{
                                p: 2,
                                textAlign: 'center',
                                border: 2,
                                borderRadius: 2,
                                cursor: slot.isAvailable
                                  ? 'pointer'
                                  : 'default',
                                backgroundColor: slot.isAvailable
                                  ? 'success.light'
                                  : slot.isBooked
                                  ? 'error.light'
                                  : 'grey.100',
                                borderColor: slot.isAvailable
                                  ? 'success.main'
                                  : slot.isBooked
                                  ? 'error.main'
                                  : 'grey.300',
                                color: slot.isAvailable
                                  ? 'success.dark'
                                  : 'text.secondary',
                                opacity: slot.isAvailable ? 1 : 0.6,
                                transition: 'all 0.2s ease',
                                '&:hover': slot.isAvailable
                                  ? {
                                      backgroundColor: 'success.main',
                                      color: 'white',
                                      transform: 'scale(1.05)',
                                      boxShadow: 3,
                                    }
                                  : {},
                              }}
                              onClick={() => {
                                if (slot.isAvailable) {
                                  handleTimeSlotSelect(slot);
                                }
                              }}
                            >
                              <Typography
                                variant='h6'
                                fontWeight='bold'
                                gutterBottom
                              >
                                {slot.time}
                              </Typography>
                              <Typography variant='body2' color='inherit'>
                                {slot.duration} min
                              </Typography>
                              {slot.isAvailable && (
                                <Box sx={{ mt: 1 }}>
                                  <Chip
                                    label='Available'
                                    size='small'
                                    color='success'
                                    variant='outlined'
                                  />
                                </Box>
                              )}
                            </Box>
                          </Grid>
                        )
                      )}
                    </Grid>
                  </Box>
                ) : (
                  <Alert severity='info'>
                    <Typography variant='body1'>
                      No available time slots found for this date. Please select
                      another date.
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button variant='outlined' onClick={onClose} size='large'>
          Cancel
        </Button>
        {selectedDate && selectedTimeSlot && (
          <Button
            variant='contained'
            size='large'
            onClick={onClose}
            startIcon={<Check />}
          >
            Confirm Selection
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CustomCalendar;
