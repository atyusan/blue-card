import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Switch,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Add,
  Edit,
  Delete,
  Block,
  CheckCircle,
  Warning,
  Schedule,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/context/ToastContext';
import { appointmentService } from '../../services/appointment.service';
import type { StaffMember } from '../../services/staff.service';

// Form validation schema
const createSlotSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  duration: z
    .number()
    .min(15, 'Duration must be at least 15 minutes')
    .max(480, 'Duration cannot exceed 8 hours'),
  slotType: z.string().min(1, 'Slot type is required'),
  maxBookings: z
    .number()
    .min(1, 'Must allow at least 1 booking')
    .max(20, 'Cannot exceed 20 bookings'),
  specialty: z.string().optional(),
  isAvailable: z.boolean(),
  isRecurring: z.boolean(),
  recurringPattern: z.string().optional(),
  recurringEndDate: z.string().optional(),
  notes: z.string().optional(),
});

type CreateSlotFormData = z.infer<typeof createSlotSchema>;

interface AvailabilityCalendarProps {
  provider: StaffMember | null;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  availabilityData: any;
  slotsData: any[];
  onRefresh: () => void;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  provider,
  selectedDate,
  onDateChange,
  // availabilityData,
  slotsData,
  // onRefresh,
}) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [editSlotDialogOpen, setEditSlotDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateSlotFormData>({
    resolver: zodResolver(createSlotSchema),
    defaultValues: {
      date: selectedDate.toISOString().split('T')[0],
      startTime: '09:00',
      duration: 30,
      slotType: 'CONSULTATION',
      maxBookings: 1,
      specialty: '',
      isAvailable: true,
      isRecurring: false,
      recurringPattern: 'WEEKLY',
      notes: '',
    },
  });

  const isRecurring = watch('isRecurring');

  // Create slot mutation
  const createSlotMutation = useMutation({
    mutationFn: async (data: CreateSlotFormData) => {
      if (!provider) throw new Error('No provider selected');

      // Create full ISO 8601 datetime strings
      const startDateTime = new Date(`${data.date}T${data.startTime}:00`);
      const endDateTime = new Date(
        `${data.date}T${calculateEndTime(data.startTime, data.duration)}:00`
      );

      const slotData = {
        providerId: provider.id,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        duration: data.duration,
        slotType: data.slotType,
        maxBookings: data.maxBookings,
        specialty: data.specialty,
        isAvailable: data.isAvailable,
        notes: data.notes,
      };

      if (data.isRecurring && data.recurringPattern && data.recurringEndDate) {
        // Create recurring slots - need to check the recurring slots DTO structure
        // For now, let's create individual slots for each day in the range
        const slots = [];
        const startDate = new Date(data.date);
        const endDate = new Date(data.recurringEndDate);
        const daysOfWeek = getDaysOfWeek(data.recurringPattern);

        for (
          let currentDate = new Date(startDate);
          currentDate <= endDate;
          currentDate.setDate(currentDate.getDate() + 1)
        ) {
          if (daysOfWeek.includes(currentDate.getDay())) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const slotStartDateTime = new Date(
              `${dateStr}T${data.startTime}:00`
            );
            const slotEndDateTime = new Date(
              `${dateStr}T${calculateEndTime(data.startTime, data.duration)}:00`
            );

            slots.push({
              ...slotData,
              startTime: slotStartDateTime.toISOString(),
              endTime: slotEndDateTime.toISOString(),
            });
          }
        }

        // Create slots one by one (bulk creation might need different API)
        return Promise.all(
          slots.map((slot) => appointmentService.createAppointmentSlot(slot))
        );
      } else {
        // Create single slot
        return appointmentService.createAppointmentSlot(slotData);
      }
    },
    onSuccess: (result) => {
      if (Array.isArray(result)) {
        showSuccess(`${result.length} time slots created successfully`);
      } else {
        showSuccess('Time slot created successfully');
      }
      setSlotDialogOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['provider-slots'] });
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'Failed to create time slot');
    },
  });

  // Helper functions
  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes
      .toString()
      .padStart(2, '0')}`;
  };

  const getDaysOfWeek = (pattern: string): number[] => {
    switch (pattern) {
      case 'DAILY':
        return [0, 1, 2, 3, 4, 5, 6]; // Sunday to Saturday
      case 'WEEKDAYS':
        return [1, 2, 3, 4, 5]; // Monday to Friday
      case 'WEEKLY':
        return [selectedDate.getDay()]; // Same day of week
      case 'MONTHLY':
        return [selectedDate.getDay()]; // Same day of week
      default:
        return [0, 1, 2, 3, 4, 5, 6];
    }
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    // const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const daySlots =
        slotsData?.filter((slot) => {
          const slotDate = new Date(slot.startTime);
          return slotDate.toDateString() === currentDate.toDateString();
        }) || [];

      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === new Date().toDateString(),
        isSelected: currentDate.toDateString() === selectedDate.toDateString(),
        slots: daySlots,
        hasSlots: daySlots.length > 0,
        availableSlots: daySlots.filter(
          (slot) => slot.isAvailable && slot.currentBookings < slot.maxBookings
        ).length,
        bookedSlots: daySlots.filter((slot) => slot.currentBookings > 0).length,
        blockedSlots: daySlots.filter((slot) => !slot.isAvailable).length,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }, [currentMonth, selectedDate, slotsData]);

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
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateChange(today);
  };

  const handleDateClick = (date: Date) => {
    onDateChange(date);
  };

  const handleSlotClick = (slot: any) => {
    setSelectedSlot(slot);
    setIsEditing(true);
    setEditSlotDialogOpen(true);
  };

  const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const editData = {
      startTime: formData.get('startTime') as string,
      duration: Number(formData.get('duration')),
      slotType: formData.get('slotType') as string,
      maxBookings: Number(formData.get('maxBookings')),
      specialty: formData.get('specialty') as string,
      isAvailable: formData.get('isAvailable') === 'on',
      notes: formData.get('notes') as string,
    };

    editSlotMutation.mutate(editData);
  };

  const handleCreateSlot = () => {
    reset({
      date: selectedDate.toISOString().split('T')[0],
      startTime: '09:00',
      duration: 30,
      slotType: 'CONSULTATION',
      maxBookings: 1,
      specialty: '',
      isAvailable: true,
      isRecurring: false,
      recurringPattern: 'WEEKLY',
      notes: '',
    });
    setSlotDialogOpen(true);
  };

  const onSubmitCreateSlot = handleSubmit((data: CreateSlotFormData) => {
    createSlotMutation.mutate(data);
  });

  // Edit slot mutation
  const editSlotMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!provider || !selectedSlot)
        throw new Error('No provider or slot selected');

      // Create full ISO 8601 datetime strings
      const startDateTime = new Date(
        `${new Date(selectedSlot.startTime).toISOString().split('T')[0]}T${
          data.startTime
        }:00`
      );
      const endDateTime = new Date(
        `${
          new Date(selectedSlot.startTime).toISOString().split('T')[0]
        }T${calculateEndTime(data.startTime, data.duration)}:00`
      );

      const updateData = {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        duration: data.duration,
        slotType: data.slotType,
        maxBookings: data.maxBookings,
        specialty: data.specialty,
        isAvailable: data.isAvailable,
        notes: data.notes,
      };

      return appointmentService.updateSlot(selectedSlot.id, updateData);
    },
    onSuccess: () => {
      showSuccess('Time slot updated successfully');
      setEditSlotDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['provider-slots'] });
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'Failed to update time slot');
    },
  });

  const getSlotStatusColor = (slot: any) => {
    if (!slot.isAvailable) return 'error';
    if (slot.currentBookings >= slot.maxBookings) return 'warning';
    if (slot.currentBookings > 0) return 'info';
    return 'success';
  };

  const getSlotStatusIcon = (slot: any) => {
    if (!slot.isAvailable) return <Block />;
    if (slot.currentBookings >= slot.maxBookings) return <Warning />;
    if (slot.currentBookings > 0) return <Schedule />;
    return <CheckCircle />;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeForInput = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <Box>
      {/* Calendar Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handlePrevMonth}>
            <ChevronLeft />
          </IconButton>
          <Typography
            variant='h5'
            sx={{ fontWeight: 600, minWidth: 200, textAlign: 'center' }}
          >
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Typography>
          <IconButton onClick={handleNextMonth}>
            <ChevronRight />
          </IconButton>
          <Button
            variant='outlined'
            startIcon={<Today />}
            onClick={handleToday}
            size='small'
          >
            Today
          </Button>
        </Box>

        <Button
          variant='contained'
          startIcon={<Add />}
          onClick={handleCreateSlot}
          disabled={!provider}
        >
          Create Slot
        </Button>
      </Box>

      {/* Calendar Grid */}
      <Paper sx={{ overflow: 'hidden' }}>
        {/* Day Headers */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          {dayNames.map((day) => (
            <Box
              key={day}
              sx={{
                p: 2,
                textAlign: 'center',
                bgcolor: 'grey.100',
                borderRight: 1,
                borderColor: 'divider',
                '&:last-child': {
                  borderRight: 0,
                },
              }}
            >
              <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                {day}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Calendar Days */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridTemplateRows: 'repeat(6, 1fr)',
            minHeight: 480, // 6 rows × 80px min height
          }}
        >
          {calendarDays.map((day, index) => (
            <Box
              key={index}
              sx={{
                minHeight: 80,
                p: 1,
                borderRight: 1,
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: day.isCurrentMonth ? 'white' : 'grey.50',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  bgcolor: day.isCurrentMonth ? 'grey.50' : 'grey.100',
                },
                // Remove right border for last column (every 7th item)
                '&:nth-of-type(7n)': {
                  borderRight: 0,
                },
                // Remove bottom border for last row (last 7 items)
                '&:nth-of-type(n+36)': {
                  borderBottom: 0,
                },
              }}
              onClick={() => handleDateClick(day.date)}
            >
              {/* Date Number */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Typography
                  variant='body2'
                  sx={{
                    fontWeight: day.isToday ? 600 : 'normal',
                    color: day.isCurrentMonth
                      ? day.isToday
                        ? 'primary.main'
                        : 'text.primary'
                      : 'text.secondary',
                  }}
                >
                  {day.date.getDate()}
                </Typography>

                {/* Selected Date Indicator */}
                {day.isSelected && (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                    }}
                  />
                )}
              </Box>

              {/* Slot Indicators */}
              {day.hasSlots && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    flex: 1,
                    justifyContent: 'flex-start',
                  }}
                >
                  {day.availableSlots > 0 && (
                    <Chip
                      label={`${day.availableSlots} available`}
                      size='small'
                      color='success'
                      sx={{
                        fontSize: '0.7rem',
                        height: 16,
                        '& .MuiChip-label': {
                          px: 1,
                        },
                      }}
                    />
                  )}
                  {day.bookedSlots > 0 && (
                    <Chip
                      label={`${day.bookedSlots} booked`}
                      size='small'
                      color='info'
                      sx={{
                        fontSize: '0.7rem',
                        height: 16,
                        '& .MuiChip-label': {
                          px: 1,
                        },
                      }}
                    />
                  )}
                  {day.blockedSlots > 0 && (
                    <Chip
                      label={`${day.blockedSlots} blocked`}
                      size='small'
                      color='error'
                      sx={{
                        fontSize: '0.7rem',
                        height: 16,
                        '& .MuiChip-label': {
                          px: 1,
                        },
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant='h6' sx={{ mb: 2 }}>
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Typography>

            {calendarDays.find((day) => day.isSelected)?.slots?.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {calendarDays
                  .find((day) => day.isSelected)
                  ?.slots?.map((slot, index) => (
                    <Paper
                      key={index}
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'grey.50' },
                      }}
                      onClick={() => handleSlotClick(slot)}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        <Box sx={{ color: `${getSlotStatusColor(slot)}.main` }}>
                          {getSlotStatusIcon(slot)}
                        </Box>
                        <Box>
                          <Typography variant='body1' sx={{ fontWeight: 500 }}>
                            {formatTime(slot.startTime)} -{' '}
                            {formatTime(slot.endTime)}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {slot.slotType} • {slot.duration} min •{' '}
                            {slot.currentBookings}/{slot.maxBookings} booked
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title='Edit Slot'>
                          <IconButton size='small'>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Delete Slot'>
                          <IconButton size='small' color='error'>
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Paper>
                  ))}
              </Box>
            ) : (
              <Alert severity='info'>
                No time slots available for this date. Click "Create Slot" to
                add availability.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Slot Dialog */}
      <Dialog
        open={slotDialogOpen}
        onClose={() => setSlotDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          <Typography variant='h6' component='div'>
            Create New Time Slot
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {provider?.user
              ? `For ${provider.user.firstName} ${provider.user.lastName}`
              : 'Select a provider first'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <form onSubmit={onSubmitCreateSlot}>
            <Box sx={{ mt: 1 }}>
              <Alert severity='info' sx={{ mb: 3 }}>
                This will create a time slot for{' '}
                <strong>{selectedDate.toLocaleDateString()}</strong>. For
                advanced slot management, use the "Time Slots" tab.
              </Alert>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name='date'
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label='Date'
                          type='date'
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                          disabled
                          error={!!errors.date}
                          helperText={
                            errors.date?.message ||
                            'Date is fixed for this calendar view'
                          }
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name='startTime'
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label='Start Time'
                          type='time'
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                          required
                          error={!!errors.startTime}
                          helperText={errors.startTime?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name='duration'
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label='Duration (minutes)'
                          type='number'
                          fullWidth
                          required
                          inputProps={{ min: 15, max: 480, step: 15 }}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          error={!!errors.duration}
                          helperText={
                            errors.duration?.message ||
                            'Must be between 15-480 minutes'
                          }
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name='maxBookings'
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label='Max Bookings'
                          type='number'
                          fullWidth
                          required
                          inputProps={{ min: 1, max: 20 }}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          error={!!errors.maxBookings}
                          helperText={
                            errors.maxBookings?.message ||
                            'Maximum number of appointments for this slot'
                          }
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name='slotType'
                      control={control}
                      render={({ field }) => (
                        <FormControl
                          fullWidth
                          required
                          error={!!errors.slotType}
                        >
                          <InputLabel>Slot Type</InputLabel>
                          <Select {...field} label='Slot Type'>
                            <MenuItem value='CONSULTATION'>
                              Consultation
                            </MenuItem>
                            <MenuItem value='LAB_TEST'>Lab Test</MenuItem>
                            <MenuItem value='IMAGING'>Imaging</MenuItem>
                            <MenuItem value='SURGERY'>Surgery</MenuItem>
                            <MenuItem value='FOLLOW_UP'>Follow-up</MenuItem>
                            <MenuItem value='EMERGENCY'>Emergency</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name='specialty'
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label='Specialty'
                          placeholder='e.g., Cardiology, General Practice'
                          fullWidth
                          helperText='Optional: Specify the medical specialty'
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name='isAvailable'
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={field.value}
                              onChange={field.onChange}
                            />
                          }
                          label='Available for booking'
                        />
                      )}
                    />
                  </Grid>

                  {/* Recurring Options */}
                  <Grid item xs={12}>
                    <Controller
                      name='isRecurring'
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={field.value}
                              onChange={field.onChange}
                            />
                          }
                          label='Create recurring slots'
                        />
                      )}
                    />
                  </Grid>

                  {isRecurring && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name='recurringPattern'
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>Recurring Pattern</InputLabel>
                              <Select {...field} label='Recurring Pattern'>
                                <MenuItem value='DAILY'>Daily</MenuItem>
                                <MenuItem value='WEEKLY'>Weekly</MenuItem>
                                <MenuItem value='MONTHLY'>Monthly</MenuItem>
                                <MenuItem value='WEEKDAYS'>
                                  Weekdays Only
                                </MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name='recurringEndDate'
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label='End Date'
                              type='date'
                              InputLabelProps={{ shrink: true }}
                              fullWidth
                              required
                              helperText='When to stop creating recurring slots'
                            />
                          )}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>
            </Box>
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setSlotDialogOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            type='submit'
            disabled={isSubmitting || !provider}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <Add />}
            onClick={onSubmitCreateSlot}
          >
            {isSubmitting ? 'Creating...' : 'Create Slot'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Slot Dialog */}
      <Dialog
        open={editSlotDialogOpen}
        onClose={() => setEditSlotDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          <Typography variant='h6' component='div'>
            Edit Time Slot
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {provider?.user
              ? `For ${provider.user.firstName} ${provider.user.lastName}`
              : 'Select a provider first'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedSlot && (
            <form id='edit-slot-form' onSubmit={handleEditSubmit}>
              <Box sx={{ mt: 1 }}>
                <Alert severity='info' sx={{ mb: 3 }}>
                  Editing slot for{' '}
                  <strong>
                    {new Date(selectedSlot.startTime).toLocaleDateString()}
                  </strong>{' '}
                  at <strong>{formatTime(selectedSlot.startTime)}</strong>
                </Alert>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label='Date'
                        type='date'
                        value={
                          new Date(selectedSlot.startTime)
                            .toISOString()
                            .split('T')[0]
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        disabled
                        helperText='Date cannot be changed for existing slots'
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name='startTime'
                        label='Start Time'
                        type='time'
                        defaultValue={formatTimeForInput(
                          selectedSlot.startTime
                        )}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name='duration'
                        label='Duration (minutes)'
                        type='number'
                        defaultValue={selectedSlot.duration}
                        fullWidth
                        required
                        inputProps={{ min: 15, max: 480, step: 15 }}
                        helperText='Must be between 15-480 minutes'
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name='maxBookings'
                        label='Max Bookings'
                        type='number'
                        defaultValue={selectedSlot.maxBookings}
                        fullWidth
                        required
                        inputProps={{ min: 1, max: 20 }}
                        helperText='Maximum number of appointments for this slot'
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel>Slot Type</InputLabel>
                        <Select
                          name='slotType'
                          defaultValue={selectedSlot.slotType}
                          label='Slot Type'
                        >
                          <MenuItem value='CONSULTATION'>Consultation</MenuItem>
                          <MenuItem value='LAB_TEST'>Lab Test</MenuItem>
                          <MenuItem value='IMAGING'>Imaging</MenuItem>
                          <MenuItem value='SURGERY'>Surgery</MenuItem>
                          <MenuItem value='FOLLOW_UP'>Follow-up</MenuItem>
                          <MenuItem value='EMERGENCY'>Emergency</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name='specialty'
                        label='Specialty'
                        defaultValue={selectedSlot.specialty || ''}
                        placeholder='e.g., Cardiology, General Practice'
                        fullWidth
                        helperText='Optional: Specify the medical specialty'
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            name='isAvailable'
                            defaultChecked={selectedSlot.isAvailable}
                          />
                        }
                        label='Available for booking'
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </form>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setEditSlotDialogOpen(false)}
            disabled={editSlotMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            type='submit'
            form='edit-slot-form'
            disabled={editSlotMutation.isPending || !provider}
            startIcon={
              editSlotMutation.isPending ? (
                <CircularProgress size={20} />
              ) : (
                <Edit />
              )
            }
          >
            {editSlotMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AvailabilityCalendar;
