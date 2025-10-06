import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Chip,
  Button,
  Alert,
} from '@mui/material';
import { Person, Event, MedicalServices, Schedule } from '@mui/icons-material';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  patientId?: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string | { id: string; name: string };
}

interface AppointmentConfirmationProps {
  selectedPatient: Patient | null;
  selectedService: Service | null;
  selectedProvider: any;
  selectedDate: Date | null;
  selectedSlot: any;
  appointmentType: string;
  priority: string;
  reason: string;
  symptoms: string;
  notes: string;
  requiresPrePayment: boolean;
  onCreateAppointment: () => void;
  isCreating: boolean;
  formatDate: (date: Date) => string;
  formatTime: (time: string | Date) => string;
}

const AppointmentConfirmation: React.FC<AppointmentConfirmationProps> = ({
  selectedPatient,
  selectedService,
  selectedProvider,
  selectedDate,
  selectedSlot,
  appointmentType,
  priority,
  reason,
  symptoms,
  notes,
  requiresPrePayment,
  onCreateAppointment,
  isCreating,
  formatDate,
  formatTime,
}) => {
  if (
    !selectedPatient ||
    !selectedService ||
    !selectedProvider ||
    !selectedDate ||
    !selectedSlot
  ) {
    return (
      <Box>
        <Alert severity='error'>
          Please complete all required fields before proceeding to confirmation.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant='h6' gutterBottom>
        Confirm Appointment Details
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant='h6' gutterBottom color='primary'>
          📋 Appointment Summary
        </Typography>

        <Grid container spacing={3}>
          {/* Patient Information */}
          <Grid item xs={12} md={6}>
            <Box display='flex' alignItems='center' gap={2} mb={2}>
              <Person color='primary' />
              <Typography variant='h6'>Patient Information</Typography>
            </Box>
            <Typography variant='body1' fontWeight={500}>
              {selectedPatient.firstName} {selectedPatient.lastName}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              ID: {selectedPatient.patientId || selectedPatient.id.slice(-8)}
            </Typography>
          </Grid>

          {/* Service Information */}
          <Grid item xs={12} md={6}>
            <Box display='flex' alignItems='center' gap={2} mb={2}>
              <MedicalServices color='primary' />
              <Typography variant='h6'>Service Details</Typography>
            </Box>
            <Typography variant='body1' fontWeight={500}>
              {selectedService.name}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {typeof selectedService.category === 'string'
                ? selectedService.category
                : selectedService.category?.name}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Price: ${selectedService.price}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Provider Information */}
          <Grid item xs={12} md={6}>
            <Box display='flex' alignItems='center' gap={2} mb={2}>
              <Person color='primary' />
              <Typography variant='h6'>Provider</Typography>
            </Box>
            <Typography variant='body1' fontWeight={500}>
              Dr. {selectedProvider.firstName} {selectedProvider.lastName}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {(selectedProvider as any).department?.name || 'General Medicine'}
            </Typography>
          </Grid>

          {/* Schedule Information */}
          <Grid item xs={12} md={6}>
            <Box display='flex' alignItems='center' gap={2} mb={2}>
              <Schedule color='primary' />
              <Typography variant='h6'>Schedule</Typography>
            </Box>
            <Typography variant='body1' fontWeight={500}>
              {formatDate(selectedDate)}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Time: {formatTime(selectedSlot.startTime)}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Duration: {selectedSlot.duration} minutes
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Appointment Details */}
          <Grid item xs={12} md={6}>
            <Box display='flex' alignItems='center' gap={2} mb={2}>
              <Event color='primary' />
              <Typography variant='h6'>Appointment Details</Typography>
            </Box>
            <Box display='flex' gap={1} mb={1}>
              <Chip
                label={appointmentType.replace('_', ' ')}
                color='primary'
                variant='outlined'
                size='small'
              />
              <Chip
                label={priority}
                color={priority === 'EMERGENCY' ? 'error' : 'default'}
                variant='outlined'
                size='small'
              />
            </Box>
            {requiresPrePayment && (
              <Chip
                label='Pre-payment Required'
                color='warning'
                variant='outlined'
                size='small'
              />
            )}
          </Grid>

          {/* Additional Information */}
          <Grid item xs={12} md={6}>
            <Box display='flex' alignItems='center' gap={2} mb={2}>
              <Typography variant='h6'>Additional Information</Typography>
            </Box>
            {reason && (
              <Typography variant='body2' color='text.secondary' mb={1}>
                <strong>Reason:</strong> {reason}
              </Typography>
            )}
            {symptoms && (
              <Typography variant='body2' color='text.secondary' mb={1}>
                <strong>Symptoms:</strong> {symptoms}
              </Typography>
            )}
            {notes && (
              <Typography variant='body2' color='text.secondary'>
                <strong>Notes:</strong> {notes}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Action Buttons */}
      <Box display='flex' justifyContent='center' gap={2}>
        <Button
          variant='contained'
          size='large'
          onClick={onCreateAppointment}
          disabled={isCreating}
          sx={{ minWidth: 200 }}
        >
          {isCreating
            ? 'Creating Appointment...'
            : 'Confirm & Create Appointment'}
        </Button>
      </Box>

      {/* Important Notes */}
      <Alert severity='info' sx={{ mt: 3 }}>
        <Typography variant='body2'>
          <strong>Important:</strong> Please review all details carefully before
          confirming. Once created, the appointment will be scheduled and
          notifications will be sent to the patient.
        </Typography>
      </Alert>
    </Box>
  );
};

export default AppointmentConfirmation;
