import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';

interface AppointmentDetailsProps {
  appointmentType: string;
  onAppointmentTypeChange: (type: string) => void;
  priority: string;
  onPriorityChange: (priority: string) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  symptoms: string;
  onSymptomsChange: (symptoms: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  requiresPrePayment: boolean;
  onRequiresPrePaymentChange: (requires: boolean) => void;
}

const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({
  appointmentType,
  onAppointmentTypeChange,
  priority,
  onPriorityChange,
  reason,
  onReasonChange,
  symptoms,
  onSymptomsChange,
  notes,
  onNotesChange,
  requiresPrePayment,
  onRequiresPrePaymentChange,
}) => {
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
            onChange={(e) => onAppointmentTypeChange(e.target.value)}
            label='Appointment Type'
          >
            <MenuItem value='CONSULTATION'>Consultation</MenuItem>
            <MenuItem value='FOLLOW_UP'>Follow-up</MenuItem>
            <MenuItem value='EMERGENCY'>Emergency</MenuItem>
            <MenuItem value='ROUTINE_CHECKUP'>Routine Checkup</MenuItem>
            <MenuItem value='SPECIALIST_REFERRAL'>Specialist Referral</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Priority */}
      <Box mb={3}>
        <FormControl fullWidth>
          <InputLabel>Priority</InputLabel>
          <Select
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value)}
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
          onChange={(e) => onReasonChange(e.target.value)}
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
          onChange={(e) => onSymptomsChange(e.target.value)}
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
          onChange={(e) => onNotesChange(e.target.value)}
          multiline
          rows={3}
          placeholder='Any additional notes or special requirements...'
        />
      </Box>

      {/* Pre-payment Requirement */}
      <Box mb={3}>
        <FormControlLabel
          control={
            <Checkbox
              checked={requiresPrePayment}
              onChange={(e) => onRequiresPrePaymentChange(e.target.checked)}
            />
          }
          label='Requires Pre-payment'
        />
        <Typography variant='body2' color='text.secondary' sx={{ ml: 4 }}>
          Check this if the appointment requires payment before the visit
        </Typography>
      </Box>
    </Box>
  );
};

export default AppointmentDetails;
