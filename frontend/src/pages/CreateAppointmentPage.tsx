import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { CalendarToday } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';

// Import the working CustomCalendar component
import CustomCalendar from '../components/appointments/CustomCalendar';

// Import services
import { patientService } from '../services/patient.service';
import { serviceService } from '../services/service.service';
import { appointmentService } from '../services/appointment.service';

// Import types
import type {
  Patient,
  Service,
  User,
  AppointmentSlot,
  PaginatedResponse,
} from '../types';

const steps = [
  'Patient & Service Selection',
  'Provider & Scheduling',
  'Appointment Details',
  'Confirmation & Booking',
];

const CreateAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [activeStep, setActiveStep] = useState(0);

  // State variables
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<User | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointmentType, setAppointmentType] = useState('');
  const [priority, setPriority] = useState('');
  const [reason, setReason] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [requiresPrePayment, setRequiresPrePayment] = useState(true);

  // Custom calendar state variables
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<any>(null);

  // Fetch data
  const { data: patients, isLoading: patientsLoading } = useQuery<
    PaginatedResponse<Patient>
  >({
    queryKey: ['patients', { search: '' }],
    queryFn: () => patientService.getPatients({ search: '', limit: 50 }),
  });

  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await serviceService.getServices({ limit: 100 });
      return Array.isArray(response) ? response : response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: providers, isLoading: providersLoading } = useQuery<
    PaginatedResponse<any>
  >({
    queryKey: ['users', { role: 'DOCTOR', search: '' }],
    queryFn: async () => {
      try {
        // Fetch users with DOCTOR role
        const response = await fetch(
          'http://localhost:3000/api/v1/users?role=DOCTOR&limit=50'
        );
        if (!response.ok) {
          throw new Error('Failed to fetch doctors');
        }
        const data = await response.json();
        console.log('Fetched doctors:', data);

        // For now, we'll use these users but we need to map them to staff member IDs
        // This is a temporary solution until we have proper staff member API
        return data;
      } catch (error) {
        console.error('Error fetching doctors:', error);
        return { data: [] };
      }
    },
  });

  // Fetch available slots
  const {
    data: availableSlots,
    isLoading: slotsLoading,
    refetch: refetchSlots,
  } = useQuery<any[]>({
    queryKey: ['available-slots', selectedProvider?.id, selectedDate],
    queryFn: async () => {
      if (!selectedProvider?.id) return [];

      try {
        // Since slots use staff_member.id as providerId, we need to find the corresponding staff member
        // For now, let's try to fetch all slots and filter by the user's name
        // This is a temporary solution until we have proper user-staff mapping
        const response = await appointmentService.getAllSlots({
          isAvailable: true,
          isBookable: true,
        });

        console.log('Fetched all slots:', response);

        // Filter slots by provider name (this is not ideal but works for now)
        if (response.slots) {
          const filteredSlots = response.slots.filter((slot: any) => {
            const providerName = `${slot.provider?.firstName} ${slot.provider?.lastName}`;
            const selectedProviderName = `${selectedProvider.firstName} ${selectedProvider.lastName}`;
            return providerName === selectedProviderName;
          });
          console.log('Filtered slots for provider:', filteredSlots);
          return filteredSlots;
        }

        return [];
      } catch (error) {
        console.error('Error fetching slots:', error);
        return [];
      }
    },
    enabled: Boolean(selectedProvider?.id),
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: (appointmentData: any) =>
      appointmentService.createAppointment(appointmentData),
    onSuccess: (appointment) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      showSuccess('Appointment created successfully!');
      navigate(`/appointments/${appointment.id}`);
    },
    onError: (error) => {
      console.error('Create appointment error:', error);
      showError('Failed to create appointment. Please try again.');
    },
  });

  // Event handlers
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedPatient(null);
    setSelectedService(null);
    setSelectedProvider(null);
    setSelectedSlot(null);
    setSelectedDate(null);
    setAppointmentType('');
    setPriority('');
    setReason('');
    setSymptoms('');
    setNotes('');
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
  };

  const handleProviderSelect = (provider: User) => {
    setSelectedProvider(provider);
    setSelectedSlot(null);
    setSelectedDate(null);
  };

  const handleSlotSelect = (slot: AppointmentSlot) => {
    setSelectedSlot(slot);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (date && selectedProvider) {
      refetchSlots();
    }
  };

  const handleCreateAppointment = () => {
    if (
      !selectedPatient ||
      !selectedService ||
      !selectedProvider ||
      !selectedSlot
    ) {
      showError('Please complete all required fields');
      return;
    }

    const appointmentData = {
      patientId: selectedPatient.id,
      slotId: selectedSlot.id,
      appointmentType: appointmentType || 'CONSULTATION',
      priority: priority || 'ROUTINE',
      reason,
      symptoms,
      notes,
      requiresPrePayment,
    };

    createAppointmentMutation.mutate(appointmentData);
  };

  const canProceedToNext = () => {
    switch (activeStep) {
      case 0:
        return selectedPatient && selectedService;
      case 1:
        return selectedProvider && selectedDate && selectedSlot;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant='h6' gutterBottom>
              Select Patient and Service
            </Typography>

            {/* Patient Selection */}
            <Box mb={3}>
              <Typography variant='subtitle1' gutterBottom>
                Patient *
              </Typography>
              {selectedPatient ? (
                <Paper
                  sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}
                >
                  <Box>
                    <Typography variant='body1' fontWeight={500}>
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      ID:{' '}
                      {selectedPatient.patientId ||
                        selectedPatient.id.slice(-8)}
                    </Typography>
                  </Box>
                  <Button
                    size='small'
                    onClick={() => setSelectedPatient(null)}
                    sx={{ ml: 'auto' }}
                  >
                    Change
                  </Button>
                </Paper>
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Select Patient</InputLabel>
                  <Select
                    value={selectedPatient?.id || ''}
                    onChange={(e) => {
                      const patient = patients?.data?.find(
                        (p: Patient) => p.id === e.target.value
                      );
                      if (patient) {
                        handlePatientSelect(patient);
                      }
                    }}
                    label='Select Patient'
                    displayEmpty
                  >
                    {patients?.data?.map((patient: Patient) => (
                      <MenuItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} -{' '}
                        {patient.patientId || patient.id.slice(-8)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>

            {/* Service Selection */}
            <Box mb={3}>
              <Typography variant='subtitle1' gutterBottom>
                Service *
              </Typography>
              {selectedService ? (
                <Paper
                  sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}
                >
                  <Box>
                    <Typography variant='body1' fontWeight={500}>
                      {selectedService.name}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {(selectedService as any).currentPrice || 'N/A'}
                    </Typography>
                  </Box>
                  <Button
                    size='small'
                    onClick={() => setSelectedService(null)}
                    sx={{ ml: 'auto' }}
                  >
                    Change
                  </Button>
                </Paper>
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Select Service</InputLabel>
                  <Select
                    value={selectedService?.id || ''}
                    onChange={(e) => {
                      const service = services?.find(
                        (s: Service) => s.id === e.target.value
                      );
                      if (service) {
                        handleServiceSelect(service);
                      }
                    }}
                    label='Select Service'
                    displayEmpty
                  >
                    {services?.map((service: Service) => (
                      <MenuItem key={service.id} value={service.id}>
                        {service.name} -{' '}
                        {(service as any).currentPrice || 'N/A'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </Box>
        );

      case 1:
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
                <Paper
                  sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}
                >
                  <Box>
                    <Typography variant='body1' fontWeight={500}>
                      Dr. {selectedProvider.firstName}{' '}
                      {selectedProvider.lastName}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {selectedProvider.department || 'General Medicine'}
                    </Typography>
                  </Box>
                  <Button
                    size='small'
                    onClick={() => setSelectedProvider(null)}
                    sx={{ ml: 'auto' }}
                  >
                    Change
                  </Button>
                </Paper>
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
                        handleProviderSelect(provider);
                      }
                    }}
                    label='Select Provider'
                    displayEmpty
                  >
                    {providers?.data?.map((provider: any) => (
                      <MenuItem key={provider.id} value={provider.id}>
                        Dr. {provider.firstName} {provider.lastName} -{' '}
                        {provider.department || 'General Medicine'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                  value={selectedDate ? selectedDate.toLocaleDateString() : ''}
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
                onTimeSlotSelect={(slot: any) => setSelectedTimeSlot(slot)}
                availabilityData={availabilityData}
                loadingAvailability={loadingAvailability}
                selectedTimeSlot={selectedTimeSlot}
              />
            </Box>

            {/* Available Slots */}
            {selectedProvider && (
              <Box>
                <Box
                  display='flex'
                  justifyContent='space-between'
                  alignItems='center'
                  mb={2}
                >
                  <Typography variant='subtitle1'>
                    Available Time Slots
                  </Typography>
                  <IconButton
                    onClick={() => refetchSlots()}
                    disabled={slotsLoading}
                  >
                    <CalendarToday />
                  </IconButton>
                </Box>

                {slotsLoading ? (
                  <Box display='flex' justifyContent='center' p={3}>
                    <CircularProgress />
                  </Box>
                ) : availableSlots && availableSlots.length > 0 ? (
                  <Box>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fill, minmax(250px, 1fr))',
                        gap: 2,
                      }}
                    >
                      {availableSlots.map((slot: any) => (
                        <Paper
                          key={slot.id}
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
                          onClick={() => handleSlotSelect(slot)}
                        >
                          <Box textAlign='center'>
                            <Typography variant='h6' color='primary'>
                              {typeof slot.startTime === 'string'
                                ? slot.startTime
                                : slot.startTime.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              Duration: {slot.duration} min
                            </Typography>
                            <Chip
                              label={
                                slot.isAvailable ? 'Available' : 'Unavailable'
                              }
                              color={slot.isAvailable ? 'success' : 'error'}
                              size='small'
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        </Paper>
                      ))}
                    </Box>
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

      case 2:
        return (
          <Box>
            <Typography variant='h6' gutterBottom>
              Appointment Details
            </Typography>

            {/* Appointment Type */}
            <Box mb={3}>
              <FormControl fullWidth>
                <InputLabel>Appointment Type</InputLabel>
                <Select
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                  label='Appointment Type'
                >
                  <MenuItem value='CONSULTATION'>Consultation</MenuItem>
                  <MenuItem value='FOLLOW_UP'>Follow-up</MenuItem>
                  <MenuItem value='EMERGENCY'>Emergency</MenuItem>
                  <MenuItem value='ROUTINE_CHECKUP'>Routine Checkup</MenuItem>
                  <MenuItem value='SPECIALIST_REFERRAL'>
                    Specialist Referral
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Priority */}
            <Box mb={3}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  label='Priority'
                >
                  <MenuItem value='ROUTINE'>Routine</MenuItem>
                  <MenuItem value='URGENT'>Urgent</MenuItem>
                  <MenuItem value='EMERGENCY'>Emergency</MenuItem>
                  <MenuItem value='HIGH'>High</MenuItem>
                  <MenuItem value='MEDIUM'>Medium</MenuItem>
                  <MenuItem value='LOW'>Low</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Reason */}
            <Box mb={3}>
              <TextField
                fullWidth
                label='Reason for Visit'
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                multiline
                rows={3}
                placeholder='Describe the reason for this appointment...'
              />
            </Box>

            {/* Symptoms */}
            <Box mb={3}>
              <TextField
                fullWidth
                label='Symptoms'
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                multiline
                rows={3}
                placeholder='List any symptoms the patient is experiencing...'
              />
            </Box>

            {/* Notes */}
            <Box mb={3}>
              <TextField
                fullWidth
                label='Additional Notes'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
                placeholder='Any additional notes or special requirements...'
              />
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant='h6' gutterBottom>
              Confirm Appointment Details
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant='h6' gutterBottom color='primary'>
                📋 Appointment Summary
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 3,
                }}
              >
                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Patient
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    {selectedPatient?.firstName} {selectedPatient?.lastName}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    ID:{' '}
                    {selectedPatient?.patientId ||
                      selectedPatient?.id.slice(-8)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Service
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    {selectedService?.name}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {(selectedService as any).currentPrice || 'N/A'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Provider
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    Dr. {selectedProvider?.firstName}{' '}
                    {selectedProvider?.lastName}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Date & Time
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    {selectedDate?.toLocaleDateString()}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {selectedSlot?.startTime} ({selectedSlot?.duration} min)
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Alert severity='info' sx={{ mb: 3 }}>
              Please review all details before confirming. Once confirmed, the
              appointment will be scheduled and notifications will be sent to
              the patient.
            </Alert>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth='lg' sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant='h4' gutterBottom align='center'>
          Create New Appointment
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 4, mb: 2 }}>{getStepContent(activeStep)}</Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            color='inherit'
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Box>
            <Button variant='outlined' onClick={handleReset} sx={{ mr: 1 }}>
              Reset
            </Button>
            {activeStep === steps.length - 1 ? null : (
              <Button
                variant='contained'
                onClick={handleNext}
                disabled={!canProceedToNext()}
              >
                {activeStep === steps.length - 2 ? 'Review' : 'Next'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateAppointmentPage;
