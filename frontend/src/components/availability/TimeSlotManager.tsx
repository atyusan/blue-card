import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  Switch,
  FormControlLabel,
  Divider,
  FormHelperText,
  Stack,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Block,
  CheckCircle,
  Warning,
  Schedule,
  FilterList,
  Search,
  Refresh,
  Visibility,
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

interface TimeSlotManagerProps {
  provider: StaffMember | null;
  selectedDate: Date;
  slotsData: any[];
  onRefresh: () => void;
}

const TimeSlotManager: React.FC<TimeSlotManagerProps> = ({
  provider,
  selectedDate,
  slotsData,
  onRefresh,
}) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'delete' | 'toggle';
    slot: any;
  } | null>(null);
  const [filters, setFilters] = useState({
    slotType: '',
    status: '',
    dateRange: 'week',
  });
  const [searchTerm, setSearchTerm] = useState('');

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
        // Create recurring slots - create individual slots for each day in the range
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

        // Create slots one by one
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
      setCreateDialogOpen(false);
      reset();
      onRefresh();
      queryClient.invalidateQueries({ queryKey: ['provider-slots'] });
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'Failed to create time slot');
    },
  });

  // Filter and search slots
  const filteredSlots = useMemo(() => {
    let filtered = slotsData || [];

    // Filter by slot type
    if (filters.slotType) {
      filtered = filtered.filter((slot) => slot.slotType === filters.slotType);
    }

    // Filter by status
    if (filters.status) {
      switch (filters.status) {
        case 'available':
          filtered = filtered.filter(
            (slot) =>
              slot.isAvailable && slot.currentBookings < slot.maxBookings
          );
          break;
        case 'booked':
          filtered = filtered.filter((slot) => slot.currentBookings > 0);
          break;
        case 'blocked':
          filtered = filtered.filter((slot) => !slot.isAvailable);
          break;
        case 'full':
          filtered = filtered.filter(
            (slot) => slot.currentBookings >= slot.maxBookings
          );
          break;
      }
    }

    // Filter by date range
    const now = new Date();
    const startDate = new Date();

    switch (filters.dateRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(
          (slot) =>
            new Date(slot.startTime) >= startDate &&
            new Date(slot.startTime) <
              new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
        );
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        filtered = filtered.filter(
          (slot) => new Date(slot.startTime) >= startDate
        );
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        filtered = filtered.filter(
          (slot) => new Date(slot.startTime) >= startDate
        );
        break;
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (slot) =>
          slot.slotType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          slot.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [slotsData, filters, searchTerm]);

  const getSlotStatusColor = (slot: any) => {
    if (!slot.isAvailable) return 'error';
    if (slot.currentBookings >= slot.maxBookings) return 'warning';
    if (slot.currentBookings > 0) return 'info';
    return 'success';
  };

  const getSlotStatusText = (slot: any) => {
    if (!slot.isAvailable) return 'Blocked';
    if (slot.currentBookings >= slot.maxBookings) return 'Full';
    if (slot.currentBookings > 0) return 'Partially Booked';
    return 'Available';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
    setCreateDialogOpen(true);
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
      setEditDialogOpen(false);
      onRefresh();
      queryClient.invalidateQueries({ queryKey: ['provider-slots'] });
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'Failed to update time slot');
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
        return [new Date(selectedDate).getDay()]; // Same day of week
      case 'MONTHLY':
        return [new Date(selectedDate).getDay()]; // Same day of week
      default:
        return [0, 1, 2, 3, 4, 5, 6];
    }
  };

  const handleEditSlot = (slot: any) => {
    setSelectedSlot(slot);
    setIsEditing(true);
    setEditDialogOpen(true);
  };

  const handleViewSlot = (slot: any) => {
    setSelectedSlot(slot);
    setViewDialogOpen(true);
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

  // Delete slot mutation
  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      return appointmentService.deleteSlot(slotId);
    },
    onSuccess: () => {
      showSuccess('Time slot deleted successfully');
      onRefresh();
      queryClient.invalidateQueries({ queryKey: ['provider-slots'] });
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'Failed to delete time slot');
    },
  });

  const handleDeleteSlot = (slot: any) => {
    if (slot.currentBookings > 0) {
      showError('Cannot delete slot with existing bookings');
      return;
    }

    setPendingAction({ type: 'delete', slot });
    setConfirmDialogOpen(true);
  };

  // Toggle availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const slot = filteredSlots.find((s) => s.id === slotId);
      if (!slot) throw new Error('Slot not found');

      const updateData = {
        isAvailable: !slot.isAvailable,
      };

      return appointmentService.updateSlot(slotId, updateData);
    },
    onSuccess: () => {
      showSuccess('Slot availability updated successfully');
      onRefresh();
      queryClient.invalidateQueries({ queryKey: ['provider-slots'] });
    },
    onError: (error: any) => {
      showError(
        error?.response?.data?.message || 'Failed to update slot availability'
      );
    },
  });

  const handleToggleAvailability = (slot: any) => {
    setPendingAction({ type: 'toggle', slot });
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'delete') {
      deleteSlotMutation.mutate(pendingAction.slot.id);
    } else if (pendingAction.type === 'toggle') {
      toggleAvailabilityMutation.mutate(pendingAction.slot.id);
    }

    setConfirmDialogOpen(false);
    setPendingAction(null);
  };

  const handleCancelAction = () => {
    setConfirmDialogOpen(false);
    setPendingAction(null);
  };

  const slotTypes = [
    'CONSULTATION',
    'LAB_TEST',
    'IMAGING',
    'SURGERY',
    'FOLLOW_UP',
    'EMERGENCY',
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'available', label: 'Available' },
    { value: 'booked', label: 'Booked' },
    { value: 'full', label: 'Full' },
    { value: 'blocked', label: 'Blocked' },
  ];

  return (
    <Box>
      {/* Header and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title='Time Slot Management'
          subheader='Manage your availability and time slots'
          action={
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={handleCreateSlot}
              disabled={!provider}
            >
              Create Slot
            </Button>
          }
        />
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Search Row */}
            <TextField
              fullWidth
              placeholder='Search slots...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: '48px',
                },
              }}
            />

            {/* Filter Controls Row */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                alignItems: { xs: 'stretch', sm: 'center' },
                justifyContent: 'space-between',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <FormControl sx={{ minWidth: { xs: '100%', sm: '180px' } }}>
                  <InputLabel>Slot Type</InputLabel>
                  <Select
                    value={filters.slotType}
                    onChange={(e) =>
                      setFilters({ ...filters, slotType: e.target.value })
                    }
                    label='Slot Type'
                    sx={{
                      height: '48px',
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        height: '48px',
                      },
                    }}
                  >
                    <MenuItem value=''>All Types</MenuItem>
                    {slotTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: { xs: '100%', sm: '150px' } }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    label='Status'
                    sx={{
                      height: '48px',
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        height: '48px',
                      },
                    }}
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: { xs: '100%', sm: '140px' } }}>
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={filters.dateRange}
                    onChange={(e) =>
                      setFilters({ ...filters, dateRange: e.target.value })
                    }
                    label='Date Range'
                    sx={{
                      height: '48px',
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        height: '48px',
                      },
                    }}
                  >
                    <MenuItem value='today'>Today</MenuItem>
                    <MenuItem value='week'>This Week</MenuItem>
                    <MenuItem value='month'>This Month</MenuItem>
                    <MenuItem value='all'>All Time</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Action Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center',
                  justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                  flexShrink: 0,
                }}
              >
                <Tooltip title='Refresh'>
                  <IconButton
                    onClick={onRefresh}
                    sx={{
                      height: '48px',
                      width: '48px',
                      bgcolor: 'grey.50',
                      '&:hover': {
                        bgcolor: 'grey.100',
                      },
                    }}
                  >
                    <Refresh />
                  </IconButton>
                </Tooltip>
                <Button
                  variant='outlined'
                  startIcon={<FilterList />}
                  onClick={() => {
                    setFilters({ slotType: '', status: '', dateRange: 'week' });
                    setSearchTerm('');
                  }}
                  sx={{
                    height: '48px',
                    minWidth: '140px',
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  Clear Filters
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Slots Table */}
      <Card>
        <CardContent>
          {filteredSlots.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Specialty</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Bookings</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSlots.map((slot) => (
                    <TableRow key={slot.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 500 }}>
                            {formatDate(slot.startTime)}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {formatTime(slot.startTime)} -{' '}
                            {formatTime(slot.endTime)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={slot.slotType.replace('_', ' ')}
                          size='small'
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>
                          {slot.specialty || 'General'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>
                          {slot.duration} min
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getSlotStatusText(slot)}
                          color={getSlotStatusColor(slot)}
                          size='small'
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>
                          {slot.currentBookings}/{slot.maxBookings}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title='View Details'>
                            <IconButton
                              size='small'
                              onClick={() => handleViewSlot(slot)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Edit Slot'>
                            <IconButton
                              size='small'
                              onClick={() => handleEditSlot(slot)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title={
                              slot.isAvailable ? 'Block Slot' : 'Unblock Slot'
                            }
                          >
                            <IconButton
                              size='small'
                              onClick={() => handleToggleAvailability(slot)}
                              color={slot.isAvailable ? 'warning' : 'success'}
                              disabled={toggleAvailabilityMutation.isPending}
                            >
                              {toggleAvailabilityMutation.isPending ? (
                                <CircularProgress size={16} />
                              ) : slot.isAvailable ? (
                                <Block />
                              ) : (
                                <CheckCircle />
                              )}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Delete Slot'>
                            <IconButton
                              size='small'
                              color='error'
                              onClick={() => handleDeleteSlot(slot)}
                              disabled={
                                slot.currentBookings > 0 ||
                                deleteSlotMutation.isPending
                              }
                            >
                              {deleteSlotMutation.isPending ? (
                                <CircularProgress size={16} />
                              ) : (
                                <Delete />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity='info'>
              No time slots found matching your criteria. Create a new slot to
              get started.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Create Slot Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          <Typography variant='h6' component='div'>
            Create New Time Slot
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {provider
              ? `For ${provider.user.firstName} ${provider.user.lastName}`
              : 'Select a provider first'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <form onSubmit={onSubmitCreateSlot}>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Basic Information */}
              <Card variant='outlined'>
                <CardContent>
                  <Typography
                    variant='subtitle1'
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Basic Information
                  </Typography>
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
                            error={!!errors.date}
                            helperText={errors.date?.message}
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
                  </Grid>
                </CardContent>
              </Card>

              {/* Slot Configuration */}
              <Card variant='outlined'>
                <CardContent>
                  <Typography
                    variant='subtitle1'
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Slot Configuration
                  </Typography>
                  <Grid container spacing={2}>
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
                              {slotTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                  {type.replace('_', ' ')}
                                </MenuItem>
                              ))}
                            </Select>
                            {errors.slotType && (
                              <FormHelperText>
                                {errors.slotType.message}
                              </FormHelperText>
                            )}
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
                  </Grid>
                </CardContent>
              </Card>

              {/* Recurring Options */}
              <Card variant='outlined'>
                <CardContent>
                  <Typography
                    variant='subtitle1'
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Recurring Options
                  </Typography>
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
                  {isRecurring && (
                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={2}>
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
                      </Grid>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Additional Notes */}
              <Card variant='outlined'>
                <CardContent>
                  <Typography
                    variant='subtitle1'
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Additional Information
                  </Typography>
                  <Controller
                    name='notes'
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label='Notes'
                        multiline
                        rows={3}
                        fullWidth
                        placeholder='Any additional notes or special instructions for this time slot...'
                        helperText='Optional: Add any special notes or instructions'
                      />
                    )}
                  />
                </CardContent>
              </Card>
            </Stack>
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setCreateDialogOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            type='submit'
            disabled={isSubmitting || !provider}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <Add />}
          >
            {isSubmitting ? 'Creating...' : 'Create Slot'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Slot Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          <Typography variant='h6' component='div'>
            Edit Time Slot
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {provider
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
                          {slotTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type.replace('_', ' ')}
                            </MenuItem>
                          ))}
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
            onClick={() => setEditDialogOpen(false)}
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

      {/* View Slot Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          <Typography variant='h6' component='div'>
            Time Slot Details
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {provider
              ? `For ${provider.user.firstName} ${provider.user.lastName}`
              : 'Slot details'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedSlot && (
            <Box sx={{ mt: 1 }}>
              <Alert severity='info' sx={{ mb: 3 }}>
                Slot details for{' '}
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
                      value={new Date(
                        selectedSlot.startTime
                      ).toLocaleDateString()}
                      fullWidth
                      disabled
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Time'
                      value={`${formatTime(
                        selectedSlot.startTime
                      )} - ${formatTime(selectedSlot.endTime)}`}
                      fullWidth
                      disabled
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Duration'
                      value={`${selectedSlot.duration} minutes`}
                      fullWidth
                      disabled
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Slot Type'
                      value={selectedSlot.slotType.replace('_', ' ')}
                      fullWidth
                      disabled
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Bookings'
                      value={`${selectedSlot.currentBookings || 0} / ${
                        selectedSlot.maxBookings || 0
                      }`}
                      fullWidth
                      disabled
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Status'
                      value={getSlotStatusText(selectedSlot)}
                      fullWidth
                      disabled
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  {selectedSlot.specialty && (
                    <Grid item xs={12}>
                      <TextField
                        label='Specialty'
                        value={selectedSlot.specialty}
                        fullWidth
                        disabled
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                  )}
                  {selectedSlot.notes && (
                    <Grid item xs={12}>
                      <TextField
                        label='Notes'
                        value={selectedSlot.notes}
                        multiline
                        rows={3}
                        fullWidth
                        disabled
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch checked={selectedSlot.isAvailable} disabled />
                      }
                      label='Available for booking'
                    />
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button
            variant='contained'
            startIcon={<Edit />}
            onClick={() => {
              setViewDialogOpen(false);
              handleEditSlot(selectedSlot);
            }}
          >
            Edit Slot
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelAction}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          <Typography variant='h6' component='div'>
            Confirm Action
          </Typography>
        </DialogTitle>
        <DialogContent>
          {pendingAction && (
            <Box sx={{ mt: 1 }}>
              {pendingAction.type === 'delete' ? (
                <Alert severity='warning' sx={{ mb: 2 }}>
                  <Typography variant='body1' sx={{ fontWeight: 600, mb: 1 }}>
                    Delete Time Slot
                  </Typography>
                  <Typography variant='body2'>
                    Are you sure you want to delete this time slot?
                  </Typography>
                  <Typography variant='body2' sx={{ mt: 1, fontWeight: 500 }}>
                    <strong>Date:</strong>{' '}
                    {new Date(
                      pendingAction.slot.startTime
                    ).toLocaleDateString()}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Time:</strong>{' '}
                    {formatTime(pendingAction.slot.startTime)}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Type:</strong>{' '}
                    {pendingAction.slot.slotType.replace('_', ' ')}
                  </Typography>
                  <Typography variant='body2' color='error' sx={{ mt: 1 }}>
                    This action cannot be undone.
                  </Typography>
                </Alert>
              ) : (
                <Alert
                  severity={pendingAction.slot.isAvailable ? 'warning' : 'info'}
                  sx={{ mb: 2 }}
                >
                  <Typography variant='body1' sx={{ fontWeight: 600, mb: 1 }}>
                    {pendingAction.slot.isAvailable
                      ? 'Block Time Slot'
                      : 'Unblock Time Slot'}
                  </Typography>
                  <Typography variant='body2'>
                    Are you sure you want to{' '}
                    {pendingAction.slot.isAvailable ? 'block' : 'unblock'} this
                    time slot?
                  </Typography>
                  <Typography variant='body2' sx={{ mt: 1, fontWeight: 500 }}>
                    <strong>Date:</strong>{' '}
                    {new Date(
                      pendingAction.slot.startTime
                    ).toLocaleDateString()}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Time:</strong>{' '}
                    {formatTime(pendingAction.slot.startTime)}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Type:</strong>{' '}
                    {pendingAction.slot.slotType.replace('_', ' ')}
                  </Typography>
                  <Typography variant='body2' sx={{ mt: 1 }}>
                    {pendingAction.slot.isAvailable
                      ? 'Blocking will prevent new appointments from being scheduled.'
                      : 'Unblocking will allow new appointments to be scheduled.'}
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={handleCancelAction}
            disabled={
              deleteSlotMutation.isPending ||
              toggleAvailabilityMutation.isPending
            }
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color={pendingAction?.type === 'delete' ? 'error' : 'primary'}
            onClick={handleConfirmAction}
            disabled={
              deleteSlotMutation.isPending ||
              toggleAvailabilityMutation.isPending
            }
            startIcon={
              deleteSlotMutation.isPending ||
              toggleAvailabilityMutation.isPending ? (
                <CircularProgress size={20} />
              ) : pendingAction?.type === 'delete' ? (
                <Delete />
              ) : pendingAction?.slot?.isAvailable ? (
                <Block />
              ) : (
                <CheckCircle />
              )
            }
          >
            {deleteSlotMutation.isPending ||
            toggleAvailabilityMutation.isPending
              ? 'Processing...'
              : pendingAction?.type === 'delete'
              ? 'Delete Slot'
              : pendingAction?.slot?.isAvailable
              ? 'Block Slot'
              : 'Unblock Slot'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimeSlotManager;
