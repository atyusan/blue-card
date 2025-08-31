import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Avatar,
  Button,
  Skeleton,
} from '@mui/material';
import { Person } from '@mui/icons-material';

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
  isActive: boolean;
}

interface PatientServiceSelectionProps {
  patients: any;
  patientsLoading: boolean;
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient) => void;
  services: Service[];
  servicesLoading: boolean;
  selectedService: Service | null;
  onServiceSelect: (service: Service) => void;
}

const PatientServiceSelection: React.FC<PatientServiceSelectionProps> = ({
  patients,
  patientsLoading,
  selectedPatient,
  onPatientSelect,
  services,
  servicesLoading,
  selectedService,
  onServiceSelect,
}) => {
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
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Person />
            </Avatar>
            <Box>
              <Typography variant='body1' fontWeight={500}>
                {selectedPatient.firstName} {selectedPatient.lastName}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                ID: {selectedPatient.patientId || selectedPatient.id.slice(-8)}
              </Typography>
            </Box>
            <Button
              size='small'
              onClick={() => onPatientSelect(null as any)}
              sx={{ ml: 'auto' }}
            >
              Change
            </Button>
          </Paper>
        ) : (
          <Box>
            {patientsLoading ? (
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
                <InputLabel>Select Patient</InputLabel>
                <Select
                  value={selectedPatient?.id || ''}
                  onChange={(e) => {
                    const patient = patients?.data?.find(
                      (p: Patient) => p.id === e.target.value
                    );
                    if (patient) {
                      onPatientSelect(patient);
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
        )}
      </Box>

      {/* Service Selection */}
      <Box mb={3}>
        <Typography variant='subtitle1' gutterBottom>
          Service *
        </Typography>
        {selectedService ? (
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant='body1' fontWeight={500}>
                {selectedService.name}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {typeof selectedService.category === 'string'
                  ? selectedService.category
                  : selectedService.category?.name}{' '}
                - ${selectedService.price}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {selectedService.description}
              </Typography>
            </Box>
            <Button
              size='small'
              onClick={() => onServiceSelect(null as any)}
              sx={{ ml: 'auto' }}
            >
              Change
            </Button>
          </Paper>
        ) : (
          <Box>
            {servicesLoading ? (
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
                <InputLabel>Select Service</InputLabel>
                <Select
                  value={selectedService?.id || ''}
                  onChange={(e) => {
                    const service = services.find(
                      (s: Service) => s.id === e.target.value
                    );
                    if (service) {
                      onServiceSelect(service);
                    }
                  }}
                  label='Select Service'
                  displayEmpty
                >
                  {services.map((service: Service) => (
                    <MenuItem key={service.id} value={service.id}>
                      {service.name} -{' '}
                      {typeof service.category === 'string'
                        ? service.category
                        : service.category?.name}{' '}
                      (${service.price})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PatientServiceSelection;
