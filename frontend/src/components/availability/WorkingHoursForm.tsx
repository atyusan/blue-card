import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Card,
  CardContent,
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
  Alert,
  Switch,
  FormControlLabel,
  FormHelperText,
  Stack,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  Schedule,
  AccessTime,
  Business,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/context/ToastContext';
import { appointmentService } from '../../services/appointment.service';
import type { StaffMember } from '../../services/staff.service';
import type { ProviderSchedule } from '../../types';

// Form validation schema
const workingHoursSchema = z.object({
  dayOfWeek: z.string().min(1, 'Day of week is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  isWorking: z.boolean(),
  breakStartTime: z.string().optional(),
  breakEndTime: z.string().optional(),
  maxAppointmentsPerHour: z
    .number()
    .min(1, 'Must allow at least 1 appointment per hour')
    .max(10, 'Cannot exceed 10 appointments per hour'),
  notes: z.string().optional(),
});

type WorkingHoursFormData = z.infer<typeof workingHoursSchema>;

interface WorkingHoursFormProps {
  provider: StaffMember | null;
  onRefresh: () => void;
}

// Use ProviderSchedule type instead of custom interface
type WorkingHoursData = ProviderSchedule;

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
];

const WorkingHoursForm: React.FC<WorkingHoursFormProps> = ({
  provider,
  onRefresh,
}) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editingHours, setEditingHours] = useState<WorkingHoursData | null>(
    null
  );
  const [deletingHours, setDeletingHours] = useState<WorkingHoursData | null>(
    null
  );

  // Fetch working hours from API
  const {
    data: workingHoursData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['provider-schedules', provider?.id],
    queryFn: async () => {
      if (!provider)
        return { schedules: [], total: 0, page: 1, limit: 50, totalPages: 0 };
      return await appointmentService.getAllProviderSchedules({
        providerId: provider.id,
      });
    },
    enabled: !!provider,
  });

  const workingHours = workingHoursData?.schedules || [];

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WorkingHoursFormData>({
    resolver: zodResolver(workingHoursSchema),
    defaultValues: {
      dayOfWeek: '',
      startTime: '09:00',
      endTime: '17:00',
      isWorking: true,
      breakStartTime: '',
      breakEndTime: '',
      maxAppointmentsPerHour: 2,
      notes: '',
    },
  });

  const isWorking = watch('isWorking');

  // Create/Update working hours mutation
  const saveWorkingHoursMutation = useMutation({
    mutationFn: async (data: WorkingHoursFormData) => {
      if (!provider) throw new Error('No provider selected');

      const workingHoursData = {
        providerId: provider.id,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isWorking: data.isWorking,
        breakStartTime: data.breakStartTime,
        breakEndTime: data.breakEndTime,
        maxAppointmentsPerHour: data.maxAppointmentsPerHour,
        notes: data.notes,
      };

      if (editingHours) {
        // Update existing
        return await appointmentService.updateProviderSchedule(
          editingHours.id,
          workingHoursData
        );
      } else {
        // Create new
        return await appointmentService.createProviderSchedule(
          workingHoursData
        );
      }
    },
    onSuccess: () => {
      showSuccess(
        editingHours
          ? 'Working hours updated successfully'
          : 'Working hours created successfully'
      );
      setEditDialogOpen(false);
      setEditingHours(null);
      reset();
      queryClient.invalidateQueries({
        queryKey: ['provider-schedules', provider?.id],
      });
      onRefresh();
    },
    onError: (error: unknown) => {
      showError(
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Failed to save working hours'
      );
    },
  });

  // Delete working hours mutation
  const deleteWorkingHoursMutation = useMutation({
    mutationFn: async (hoursToDelete: WorkingHoursData) => {
      if (!hoursToDelete.id) throw new Error('No schedule ID provided');
      return await appointmentService.deleteProviderSchedule(hoursToDelete.id);
    },
    onSuccess: () => {
      showSuccess('Working hours deleted successfully');
      queryClient.invalidateQueries({
        queryKey: ['provider-schedules', provider?.id],
      });
      onRefresh();
    },
    onError: (error: unknown) => {
      showError(
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Failed to delete working hours'
      );
    },
  });

  const handleCreateHours = () => {
    reset({
      dayOfWeek: '',
      startTime: '09:00',
      endTime: '17:00',
      isWorking: true,
      breakStartTime: '',
      breakEndTime: '',
      maxAppointmentsPerHour: 2,
      notes: '',
    });
    setEditingHours(null);
    setEditDialogOpen(true);
  };

  const handleEditHours = (hours: WorkingHoursData) => {
    reset({
      dayOfWeek: hours.dayOfWeek,
      startTime: hours.startTime,
      endTime: hours.endTime,
      isWorking: hours.isWorking,
      breakStartTime: hours.breakStartTime || '',
      breakEndTime: hours.breakEndTime || '',
      maxAppointmentsPerHour: hours.maxAppointmentsPerHour,
      notes: hours.notes || '',
    });
    setEditingHours(hours);
    setEditDialogOpen(true);
  };

  const handleDeleteHours = (hours: WorkingHoursData) => {
    setDeletingHours(hours);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingHours) {
      deleteWorkingHoursMutation.mutate(deletingHours);
      setConfirmDialogOpen(false);
      setDeletingHours(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialogOpen(false);
    setDeletingHours(null);
  };

  const onSubmit = handleSubmit((data: WorkingHoursFormData) => {
    saveWorkingHoursMutation.mutate(data);
  });

  const getStatusColor = (isWorking: boolean) => {
    return isWorking ? 'success' : 'default';
  };

  const getStatusText = (isWorking: boolean) => {
    return isWorking ? 'Working' : 'Not Working';
  };

  const formatTime = (time: string) => {
    if (!time || time === '00:00') return 'N/A';
    return time;
  };

  if (!provider) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='info'>
          Please select a provider to manage working hours.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant='h5' sx={{ fontWeight: 600, mb: 1 }}>
          Working Hours Management
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Manage working hours and availability for {provider.user.firstName}{' '}
          {provider.user.lastName}
        </Typography>
      </Box>

      {/* Action Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Business color='primary' />
              <Typography variant='h6' sx={{ fontWeight: 600 }}>
                Weekly Schedule
              </Typography>
            </Box>
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={handleCreateHours}
              sx={{ textTransform: 'none' }}
            >
              Add Working Hours
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Working Hours Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Day</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>End Time</TableCell>
                    <TableCell>Break</TableCell>
                    <TableCell>Max Appointments/Hour</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell align='right'>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {DAYS_OF_WEEK.map((day) => {
                    const hours = workingHours.find(
                      (h) => h.dayOfWeek === day.value
                    );
                    return (
                      <TableRow key={day.value}>
                        <TableCell>
                          <Typography variant='body2' sx={{ fontWeight: 500 }}>
                            {day.label}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              hours ? getStatusText(hours.isWorking) : 'Not Set'
                            }
                            color={
                              hours
                                ? getStatusColor(hours.isWorking)
                                : 'default'
                            }
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {hours ? formatTime(hours.startTime) : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {hours ? formatTime(hours.endTime) : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {hours && hours.breakStartTime && hours.breakEndTime
                              ? `${formatTime(
                                  hours.breakStartTime
                                )} - ${formatTime(hours.breakEndTime)}`
                              : 'No Break'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {hours ? hours.maxAppointmentsPerHour : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' color='text.secondary'>
                            {hours?.notes || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 0.5,
                              justifyContent: 'flex-end',
                            }}
                          >
                            <Tooltip title='Edit Working Hours'>
                              <IconButton
                                size='small'
                                onClick={() => hours && handleEditHours(hours)}
                                disabled={!hours}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Delete Working Hours'>
                              <IconButton
                                size='small'
                                color='error'
                                onClick={() =>
                                  hours && handleDeleteHours(hours)
                                }
                                disabled={
                                  !hours || deleteWorkingHoursMutation.isPending
                                }
                              >
                                {deleteWorkingHoursMutation.isPending ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <Delete />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Working Hours Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          <Typography variant='h6' component='div'>
            {editingHours ? 'Edit Working Hours' : 'Add Working Hours'}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {provider
              ? `For ${provider.user.firstName} ${provider.user.lastName}`
              : 'Select a provider first'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <form onSubmit={onSubmit}>
            <Stack spacing={4}>
              {/* Basic Information Card */}
              <Card variant='outlined'>
                <CardContent>
                  <Typography
                    variant='subtitle1'
                    gutterBottom
                    sx={{ fontWeight: 600, mb: 3 }}
                  >
                    <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Basic Information
                  </Typography>

                  <Stack spacing={3}>
                    {/* Day Selection */}
                    <FormControl fullWidth required error={!!errors.dayOfWeek}>
                      <InputLabel>Day of Week</InputLabel>
                      <Controller
                        name='dayOfWeek'
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            label='Day of Week'
                            disabled={!!editingHours}
                            sx={{ height: '48px' }}
                          >
                            {DAYS_OF_WEEK.map((day) => (
                              <MenuItem key={day.value} value={day.value}>
                                {day.label}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                      {errors.dayOfWeek && (
                        <FormHelperText>
                          {errors.dayOfWeek.message}
                        </FormHelperText>
                      )}
                    </FormControl>

                    {/* Working Status */}
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Controller
                        name='isWorking'
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={field.value}
                                onChange={field.onChange}
                                color='primary'
                              />
                            }
                            label={
                              <Box>
                                <Typography
                                  variant='body1'
                                  sx={{ fontWeight: 500 }}
                                >
                                  Working on this day
                                </Typography>
                                <Typography
                                  variant='body2'
                                  color='text.secondary'
                                >
                                  {field.value
                                    ? 'Provider will be available for appointments'
                                    : 'Provider will not be working on this day'}
                                </Typography>
                              </Box>
                            }
                          />
                        )}
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {isWorking && (
                <>
                  {/* Working Hours Card */}
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography
                        variant='subtitle1'
                        gutterBottom
                        sx={{ fontWeight: 600, mb: 3 }}
                      >
                        <AccessTime sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Working Hours
                      </Typography>

                      <Box
                        sx={{
                          display: 'flex',
                          gap: 2,
                          flexDirection: { xs: 'column', sm: 'row' },
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
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
                                helperText={
                                  errors.startTime?.message ||
                                  'When the working day begins'
                                }
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    height: '48px',
                                  },
                                }}
                              />
                            )}
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Controller
                            name='endTime'
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label='End Time'
                                type='time'
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                required
                                error={!!errors.endTime}
                                helperText={
                                  errors.endTime?.message ||
                                  'When the working day ends'
                                }
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    height: '48px',
                                  },
                                }}
                              />
                            )}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Break Hours Card */}
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography
                        variant='subtitle1'
                        gutterBottom
                        sx={{ fontWeight: 600, mb: 3 }}
                      >
                        <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Break Time (Optional)
                      </Typography>

                      <Box
                        sx={{
                          display: 'flex',
                          gap: 2,
                          flexDirection: { xs: 'column', sm: 'row' },
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Controller
                            name='breakStartTime'
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label='Break Start Time'
                                type='time'
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                helperText='When the break period starts'
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    height: '48px',
                                  },
                                }}
                              />
                            )}
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Controller
                            name='breakEndTime'
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label='Break End Time'
                                type='time'
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                helperText='When the break period ends'
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    height: '48px',
                                  },
                                }}
                              />
                            )}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Capacity Management Card */}
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography
                        variant='subtitle1'
                        gutterBottom
                        sx={{ fontWeight: 600, mb: 3 }}
                      >
                        <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Capacity Management
                      </Typography>

                      <Controller
                        name='maxAppointmentsPerHour'
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label='Max Appointments Per Hour'
                            type='number'
                            fullWidth
                            required
                            inputProps={{ min: 1, max: 10 }}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            error={!!errors.maxAppointmentsPerHour}
                            helperText={
                              errors.maxAppointmentsPerHour?.message ||
                              'Maximum number of appointments that can be scheduled per hour (1-10)'
                            }
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                height: '48px',
                              },
                            }}
                          />
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Notes Card */}
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography
                        variant='subtitle1'
                        gutterBottom
                        sx={{ fontWeight: 600, mb: 3 }}
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
                            rows={4}
                            fullWidth
                            placeholder='Any special notes about working hours for this day...'
                            helperText='Optional: Add any special notes, instructions, or exceptions for this day'
                          />
                        )}
                      />
                    </CardContent>
                  </Card>
                </>
              )}
            </Stack>
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            type='submit'
            disabled={isSubmitting || !provider}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <Save />}
            onClick={onSubmit}
          >
            {isSubmitting
              ? 'Saving...'
              : editingHours
              ? 'Update Hours'
              : 'Save Hours'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelDelete}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          <Typography
            variant='h6'
            component='div'
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Delete color='error' />
            Delete Working Hours
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity='warning' sx={{ mb: 2 }}>
            This action cannot be undone.
          </Alert>
          <Typography variant='body1'>
            Are you sure you want to delete the working hours for{' '}
            <strong>
              {deletingHours &&
                DAYS_OF_WEEK.find(
                  (day) => day.value === deletingHours.dayOfWeek
                )?.label}
            </strong>
            ?
          </Typography>
          {deletingHours && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant='body2' color='text.secondary'>
                <strong>Current Schedule:</strong>
                <br />
                {deletingHours.isWorking ? (
                  <>
                    {formatTime(deletingHours.startTime)} -{' '}
                    {formatTime(deletingHours.endTime)}
                    {deletingHours.breakStartTime &&
                      deletingHours.breakEndTime && (
                        <>
                          <br />
                          Break: {formatTime(
                            deletingHours.breakStartTime
                          )} - {formatTime(deletingHours.breakEndTime)}
                        </>
                      )}
                    <br />
                    Max appointments per hour:{' '}
                    {deletingHours.maxAppointmentsPerHour}
                  </>
                ) : (
                  'Not working on this day'
                )}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={handleCancelDelete}
            disabled={deleteWorkingHoursMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleConfirmDelete}
            disabled={deleteWorkingHoursMutation.isPending}
            startIcon={
              deleteWorkingHoursMutation.isPending ? (
                <CircularProgress size={20} />
              ) : (
                <Delete />
              )
            }
          >
            {deleteWorkingHoursMutation.isPending
              ? 'Deleting...'
              : 'Delete Working Hours'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkingHoursForm;
