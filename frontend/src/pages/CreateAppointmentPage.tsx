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
  Alert,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';

// Import the new AppointmentCalendar component
import AppointmentCalendar from '../components/AppointmentCalendar';

// Import services
import { patientService } from '../services/patient.service';
import { serviceService } from '../services/service.service';
import { appointmentService } from '../services/appointment.service';
import { staffService } from '../services/staff.service';

// Import types
import type { Patient, AppointmentSlot, PaginatedResponse } from '../types';
import type { Service } from '../types/department';
import type { StaffMember } from '../services/staff.service';

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
  const [selectedProvider, setSelectedProvider] = useState<StaffMember | null>(
    null
  );
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointmentType, setAppointmentType] = useState('');
  const [priority, setPriority] = useState('');
  const [reason, setReason] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [requiresPrePayment] = useState(true);

  // Fetch data
  const { data: patients } = useQuery<PaginatedResponse<Patient>>({
    queryKey: ['patients', { search: '' }],
    queryFn: () => patientService.getPatients({ search: '', limit: 50 }),
  });

  const { data: services } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await serviceService.getServices({});
      return Array.isArray(response) ? response : response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: providers,
    isLoading: providersLoading,
    error: providersError,
  } = useQuery({
    queryKey: [
      'service-providers',
      { isActive: true, departmentId: selectedService?.departmentId },
    ],
    queryFn: async () => {
      const result = await staffService.getServiceProviders({
        isActive: true,
        limit: 100,
        // Filter by department if a service is selected
        ...(selectedService?.departmentId && {
          departmentId: selectedService.departmentId,
        }),
      });
      return result;
    },
    staleTime: 5 * 60 * 1000,
    // Only fetch providers if a service is selected
    enabled: !!selectedService,
  });

  // Fetch available slots for the selected provider
  const { data: availableSlots } = useQuery<any[]>({
    queryKey: ['available-slots', selectedProvider?.id],
    queryFn: async () => {
      if (!selectedProvider?.id) return [];

      try {
        // Fetch all available slots for the provider (not filtered by date)
        const response = await appointmentService.getAllSlots({
          providerId: selectedProvider.id,
          isAvailable: true,
          isBookable: true,
        });

        return response.slots || [];
      } catch (error) {
        console.error('Error fetching slots:', error);
        return [];
      }
    },
    enabled: Boolean(selectedProvider?.id),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
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
    // Reset provider when service changes
    setSelectedProvider(null);
    setSelectedSlot(null);
    setSelectedDate(null);
  };

  const handleProviderSelect = (provider: StaffMember) => {
    setSelectedProvider(provider);
    setSelectedSlot(null);
    setSelectedDate(null);
  };

  const handleSlotSelect = (slot: AppointmentSlot) => {
    setSelectedSlot(slot);
  };

  const handleSubmitAppointment = () => {
    if (
      !selectedPatient ||
      !selectedService ||
      !selectedProvider ||
      !selectedSlot
    ) {
      showError('Please complete all required fields');
      return;
    }

    // Map frontend appointment types to backend expected values
    const getBackendAppointmentType = (frontendType: string) => {
      const typeMap: Record<string, string> = {
        CONSULTATION: 'GENERAL_CONSULTATION',
        FOLLOW_UP: 'FOLLOW_UP',
        EMERGENCY: 'EMERGENCY',
        ROUTINE_CHECKUP: 'PREVENTIVE_CARE',
        SPECIALIST_REFERRAL: 'SPECIALIST_CONSULTATION',
      };
      return typeMap[frontendType] || 'GENERAL_CONSULTATION';
    };

    // Calculate end time based on start time and duration
    const startTime = new Date(selectedSlot.startTime);
    const endTime = new Date(
      startTime.getTime() + selectedSlot.duration * 60000
    ); // duration in minutes to milliseconds

    const appointmentData = {
      patientId: selectedPatient.id,
      slotId: selectedSlot.id,
      appointmentType: getBackendAppointmentType(
        appointmentType || 'CONSULTATION'
      ),
      priority: priority || 'ROUTINE',
      reason,
      symptoms,
      notes,
      requiresPrePayment,
      scheduledStart: startTime.toISOString(),
      scheduledEnd: endTime.toISOString(),
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
                Provider *{' '}
                {selectedService && (
                  <Typography
                    component='span'
                    variant='caption'
                    color='text.secondary'
                  >
                    (Filtered by {selectedService.name})
                  </Typography>
                )}
              </Typography>
              {selectedProvider ? (
                <Paper
                  sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}
                >
                  <Box>
                    <Typography variant='body1' fontWeight={500}>
                      Dr. {selectedProvider.user.firstName}{' '}
                      {selectedProvider.user.lastName}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {selectedProvider.department?.name || 'General Medicine'}
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
                <FormControl fullWidth disabled={!selectedService}>
                  <InputLabel>Select Provider</InputLabel>
                  <Select
                    value={selectedProvider?.id || ''}
                    onChange={(e) => {
                      const provider = providers?.data?.find(
                        (p: StaffMember) => p.id === e.target.value
                      );
                      if (provider) {
                        handleProviderSelect(provider);
                      }
                    }}
                    label='Select Provider'
                    displayEmpty
                  >
                    {!selectedService && (
                      <MenuItem disabled>
                        <Typography variant='body2' color='text.secondary'>
                          Please select a service first
                        </Typography>
                      </MenuItem>
                    )}
                    {selectedService && providersLoading && (
                      <MenuItem disabled>
                        <Typography variant='body2' color='text.secondary'>
                          Loading providers for {selectedService.name}...
                        </Typography>
                      </MenuItem>
                    )}
                    {selectedService && providersError && (
                      <MenuItem disabled>
                        <Typography variant='body2' color='error'>
                          Error loading providers
                        </Typography>
                      </MenuItem>
                    )}
                    {selectedService &&
                      providers?.data?.length === 0 &&
                      !providersLoading && (
                        <MenuItem disabled>
                          <Typography variant='body2' color='text.secondary'>
                            No providers available for {selectedService.name}
                          </Typography>
                        </MenuItem>
                      )}
                    {providers?.data?.map((provider: StaffMember) => (
                      <MenuItem key={provider.id} value={provider.id}>
                        Dr. {provider.user.firstName} {provider.user.lastName} -{' '}
                        {provider.department?.name || 'General Medicine'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>

            {/* Appointment Calendar */}
            {selectedProvider && (
              <AppointmentCalendar
                timeSlots={availableSlots || []}
                selectedDate={
                  selectedDate ? selectedDate.toISOString().split('T')[0] : null
                }
                onDateSelect={(dateString) => {
                  setSelectedDate(new Date(dateString));
                }}
                onTimeSlotSelect={(timeSlot) => {
                  handleSlotSelect(timeSlot as any);
                }}
              />
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
                    Dr. {selectedProvider?.user.firstName}{' '}
                    {selectedProvider?.user.lastName}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {selectedProvider?.department?.name || 'General Medicine'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Date & Time
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    {selectedDate?.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {selectedSlot &&
                      new Date(selectedSlot.startTime).toLocaleTimeString(
                        'en-US',
                        {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        }
                      )}{' '}
                    ({selectedSlot?.duration} minutes)
                  </Typography>
                </Box>

                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Appointment Type
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    {appointmentType || 'Not specified'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Priority
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    {priority || 'Not specified'}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Additional Details */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant='h6' gutterBottom color='primary'>
                📝 Additional Information
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {reason && (
                  <Box>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Reason for Visit
                    </Typography>
                    <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                      {reason}
                    </Typography>
                  </Box>
                )}

                {symptoms && (
                  <Box>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Symptoms
                    </Typography>
                    <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                      {symptoms}
                    </Typography>
                  </Box>
                )}

                {notes && (
                  <Box>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Additional Notes
                    </Typography>
                    <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                      {notes}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            <Alert severity='info' sx={{ mb: 3 }}>
              Please review all details before confirming. Once confirmed, the
              appointment will be scheduled and notifications will be sent to
              the patient.
            </Alert>

            {/* Submit Button */}
            <Box display='flex' justifyContent='center' gap={2}>
              <Button
                variant='outlined'
                onClick={() => setActiveStep(2)}
                size='large'
              >
                Back to Edit
              </Button>
              <Button
                variant='contained'
                onClick={handleSubmitAppointment}
                size='large'
                disabled={
                  !selectedPatient ||
                  !selectedService ||
                  !selectedProvider ||
                  !selectedSlot
                }
                sx={{ minWidth: 200 }}
              >
                Confirm & Book Appointment
              </Button>
            </Box>
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
