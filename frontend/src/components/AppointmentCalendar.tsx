import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Badge,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  AccessTime,
  CheckCircle,
} from '@mui/icons-material';

interface TimeSlot {
  id: string;
  providerId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  isAvailable: boolean;
  maxAppointments: number;
  currentAppointments: number;
  slotType: string;
  isRecurring: boolean;
  recurringPattern?: string;
  isActive: boolean;
}

interface AppointmentCalendarProps {
  timeSlots: TimeSlot[];
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  onTimeSlotSelect: (timeSlot: TimeSlot) => void;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  timeSlots,
  selectedDate,
  onDateSelect,
  onTimeSlotSelect,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [showTimeSlotDialog, setShowTimeSlotDialog] = useState(false);

  // Group time slots by date
  const slotsByDate = useMemo(() => {
    const grouped: Record<string, TimeSlot[]> = {};

    timeSlots.forEach((slot) => {
      // Use the slot's date field if available, otherwise extract from startTime
      let date: string;
      if (slot.date) {
        date = slot.date;
      } else {
        // Use local date formatting to avoid timezone issues
        const slotDate = new Date(slot.startTime);
        const year = slotDate.getFullYear();
        const month = String(slotDate.getMonth() + 1).padStart(2, '0');
        const day = String(slotDate.getDate()).padStart(2, '0');
        date = `${year}-${month}-${day}`;
      }

      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(slot);
    });

    // Sort time slots within each date
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });

    return grouped;
  }, [timeSlots]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      // Use local date formatting to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();
      const isPast = date < today;
      const hasSlots =
        slotsByDate[dateString] && slotsByDate[dateString].length > 0;
      const isSelected = selectedDate === dateString;

      days.push({
        date,
        dateString,
        isCurrentMonth,
        isToday,
        isPast,
        hasSlots,
        isSelected,
        slots: slotsByDate[dateString] || [],
      });
    }

    return days;
  }, [currentMonth, slotsByDate, selectedDate]);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1)
    );
  };

  const handleDateClick = (dateString: string, hasSlots: boolean) => {
    if (hasSlots) {
      onDateSelect(dateString);
    }
  };

  const handleTimeSlotClick = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    setShowTimeSlotDialog(true);
  };

  const confirmTimeSlot = () => {
    if (selectedTimeSlot) {
      onTimeSlotSelect(selectedTimeSlot);
      setShowTimeSlotDialog(false);
      setSelectedTimeSlot(null);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDateStatus = (day: {
    isPast: boolean;
    hasSlots: boolean;
    isCurrentMonth: boolean;
  }) => {
    if (day.isPast) return 'past';
    if (day.hasSlots) return 'available';
    if (!day.isCurrentMonth) return 'other-month';
    return 'unavailable';
  };

  return (
    <Box>
      {/* Calendar Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
        <Box
          display='flex'
          alignItems='center'
          justifyContent='space-between'
          mb={3}
        >
          <Typography variant='h5' fontWeight={600} color='primary'>
            Select Appointment Date & Time
          </Typography>
          <Box display='flex' alignItems='center' gap={1}>
            <IconButton
              onClick={handlePrevMonth}
              size='small'
              sx={{
                bgcolor: 'primary.50',
                '&:hover': { bgcolor: 'primary.100' },
              }}
            >
              <ChevronLeft />
            </IconButton>
            <Typography
              variant='h6'
              minWidth={180}
              textAlign='center'
              fontWeight={500}
            >
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Typography>
            <IconButton
              onClick={handleNextMonth}
              size='small'
              sx={{
                bgcolor: 'primary.50',
                '&:hover': { bgcolor: 'primary.100' },
              }}
            >
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>

        {/* Day Headers */}
        <Box display='flex' mb={1}>
          {dayNames.map((day) => (
            <Box key={day} flex={1} textAlign='center'>
              <Typography
                variant='subtitle2'
                color='primary'
                fontWeight={600}
                sx={{ py: 1 }}
              >
                {day}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Calendar Grid */}
        <Box display='flex' flexWrap='wrap' gap={0.5}>
          {calendarDays.map((day, index) => {
            const status = getDateStatus(day);
            const isClickable = day.hasSlots && !day.isPast;

            return (
              <Box key={index} flex='0 0 calc(14.28% - 4px)'>
                <Paper
                  elevation={status === 'available' ? 1 : 0}
                  sx={{
                    height: '100%',
                    minHeight: 90,
                    p: 1,
                    cursor: isClickable ? 'pointer' : 'default',
                    border: day.isSelected ? '2px solid' : '1px solid',
                    borderColor: day.isSelected
                      ? 'primary.main'
                      : status === 'available'
                      ? 'success.light'
                      : 'grey.300',
                    bgcolor: day.isSelected
                      ? 'primary.50'
                      : status === 'available'
                      ? 'success.50'
                      : status === 'past'
                      ? 'grey.100'
                      : 'white',
                    opacity: status === 'other-month' ? 0.4 : 1,
                    transition: 'all 0.2s ease',
                    borderRadius: 2,
                    '&:hover': isClickable
                      ? {
                          transform: 'translateY(-1px)',
                          boxShadow: 2,
                        }
                      : {},
                  }}
                  onClick={() => handleDateClick(day.dateString, day.hasSlots)}
                >
                  <Box display='flex' flexDirection='column' height='100%'>
                    {/* Date Number */}
                    <Typography
                      variant='body2'
                      fontWeight={day.isToday ? 600 : 400}
                      color={day.isToday ? 'primary.main' : 'text.primary'}
                      textAlign='center'
                      mb={0.5}
                    >
                      {day.date.getDate()}
                    </Typography>

                    {/* Time Slots Indicator */}
                    {day.hasSlots && (
                      <Box
                        flex={1}
                        display='flex'
                        flexDirection='column'
                        justifyContent='center'
                      >
                        <Badge
                          badgeContent={day.slots.length}
                          color='success'
                          sx={{
                            '& .MuiBadge-badge': {
                              fontSize: '0.7rem',
                              height: 16,
                              minWidth: 16,
                            },
                          }}
                        >
                          <Chip
                            label='Available'
                            size='small'
                            color='success'
                            variant='filled'
                            icon={<AccessTime fontSize='small' />}
                            sx={{
                              fontSize: '0.7rem',
                              height: 20,
                              '& .MuiChip-icon': {
                                fontSize: '0.8rem',
                              },
                            }}
                          />
                        </Badge>
                      </Box>
                    )}

                    {/* Status Labels */}
                    {day.isPast && (
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        textAlign='center'
                      >
                        Past
                      </Typography>
                    )}
                    {!day.hasSlots && !day.isPast && day.isCurrentMonth && (
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        textAlign='center'
                      >
                        No slots
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && selectedDate && (
        <Paper elevation={1} sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
          <Typography variant='caption' color='text.secondary'>
            Debug: Selected date: {selectedDate}, Available dates:{' '}
            {Object.keys(slotsByDate).join(', ')}
          </Typography>
          <Typography variant='caption' color='text.secondary' display='block'>
            Slots for selected date: {slotsByDate[selectedDate]?.length || 0}
          </Typography>
        </Paper>
      )}

      {/* Selected Date Time Slots */}
      {selectedDate && slotsByDate[selectedDate] && (
        <Paper elevation={1} sx={{ p: 3, mt: 2, borderRadius: 2 }}>
          <Box display='flex' alignItems='center' gap={1} mb={3}>
            <AccessTime color='primary' />
            <Typography variant='h6' fontWeight={600}>
              Available Times for{' '}
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box
            display='flex'
            flexWrap='wrap'
            gap={0.5}
            justifyContent='space-between'
          >
            {slotsByDate[selectedDate].map((slot) => (
              <Box key={slot.id} flex='0 0 calc(12.5% - 2px)' minWidth={80}>
                <Button
                  variant='outlined'
                  fullWidth
                  startIcon={
                    <CheckCircle color='success' sx={{ fontSize: '0.9rem' }} />
                  }
                  onClick={() => handleTimeSlotClick(slot)}
                  sx={{
                    py: 1,
                    px: 1,
                    borderColor: 'success.main',
                    color: 'success.main',
                    borderRadius: 1.5,
                    textTransform: 'none',
                    minHeight: 'auto',
                    '&:hover': {
                      borderColor: 'success.dark',
                      backgroundColor: 'success.50',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <Box textAlign='center' width='100%'>
                    <Typography
                      variant='body2'
                      fontWeight={600}
                      fontSize='0.85rem'
                    >
                      {formatTime(slot.startTime)}
                    </Typography>
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      fontSize='0.7rem'
                    >
                      {slot.duration} MIN
                    </Typography>
                  </Box>
                </Button>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Time Slot Confirmation Dialog */}
      <Dialog
        open={showTimeSlotDialog}
        onClose={() => setShowTimeSlotDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          <Box display='flex' alignItems='center' gap={1}>
            <CheckCircle color='success' />
            <Typography variant='h6'>Confirm Appointment Time</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTimeSlot && (
            <Box>
              <Typography variant='body1' mb={2}>
                You are about to book an appointment for:
              </Typography>
              <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant='h6' color='primary' mb={1}>
                  {new Date(selectedTimeSlot.startTime).toLocaleDateString(
                    'en-US',
                    {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}
                </Typography>
                <Typography variant='h5' fontWeight={600}>
                  {formatTime(selectedTimeSlot.startTime)}
                </Typography>
                <Typography variant='body2' color='text.secondary' mt={1}>
                  Duration: {selectedTimeSlot.duration} minutes
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTimeSlotDialog(false)}>Cancel</Button>
          <Button
            variant='contained'
            onClick={confirmTimeSlot}
            startIcon={<CheckCircle />}
          >
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentCalendar;
