import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Paper,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import { patientService } from '../services/patient.service';

import toast from 'react-hot-toast';

// Validation schema
const patientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z
    .date()
    .refine((date) => date !== null, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required'),
  emergencyContact: z.object({
    name: z.string().min(1, 'Emergency contact name is required'),
    relationship: z.string().min(1, 'Relationship is required'),
    phoneNumber: z.string().min(1, 'Emergency contact phone is required'),
  }),
  medicalHistory: z
    .object({
      allergies: z.string().optional(),
      bloodGroup: z
        .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .optional(),
      genotype: z.enum(['AA', 'AS', 'AC', 'SS', 'SC', 'CC']).optional(),
      height: z.string().optional(),
    })
    .optional(),
  insurance: z
    .object({
      provider: z.string().optional(),
      policyNumber: z.string().optional(),
      groupNumber: z.string().optional(),
    })
    .optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

const steps = [
  'Personal Information',
  'Contact Details',
  'Medical Information',
  'Insurance',
];

const AddPatientPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const isEditMode = !!id;

  // SEPARATE STATE FOR EACH STEP - NO SHARED FORM STATE
  const [step1Data, setStep1Data] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: undefined as Date | undefined,
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
  });

  const [step2Data, setStep2Data] = useState({
    phoneNumber: '',
    email: '',
    address: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phoneNumber: '',
    },
  });

  const [step3Data, setStep3Data] = useState({
    allergies: '',
    bloodGroup: undefined as
      | 'A+'
      | 'A-'
      | 'B+'
      | 'B-'
      | 'AB+'
      | 'AB-'
      | 'O+'
      | 'O-'
      | undefined,
    genotype: undefined as 'AA' | 'AS' | 'AC' | 'SS' | 'SC' | 'CC' | undefined,
    height: '',
  });

  const [step4Data, setStep4Data] = useState({
    provider: '',
    policyNumber: '',
    groupNumber: '',
  });

  // Fetch patient data if in edit mode
  const { data: existingPatient, isLoading: isLoadingPatient } = useQuery({
    queryKey: ['patient-for-edit', id],
    queryFn: () => patientService.getPatientByIdForEdit(id!),
    enabled: isEditMode && !!id,
  });

  // Populate form with existing patient data when in edit mode
  useEffect(() => {
    if (existingPatient && isEditMode) {
      let dateOfBirth: Date | undefined;

      if (existingPatient.dateOfBirth) {
        const dateStr = existingPatient.dateOfBirth;
        console.log('Raw date from backend:', dateStr);

        if (typeof dateStr === 'string') {
          // Handle ISO string format like "2025-07-31T23:00:00.000Z"
          const parsedDate = new Date(dateStr);
          console.log('Parsed date from ISO string:', parsedDate);

          if (!isNaN(parsedDate.getTime())) {
            dateOfBirth = parsedDate;
            console.log('Successfully set dateOfBirth:', dateOfBirth);
          } else {
            console.error('Failed to parse ISO date string:', dateStr);
          }
        } else if (
          typeof dateStr === 'object' &&
          dateStr !== null &&
          'getTime' in dateStr
        ) {
          // It's already a Date object
          dateOfBirth = dateStr as Date;
          console.log('Date object from backend:', dateOfBirth);
        } else {
          console.error('Unexpected date format:', dateStr);
        }
      }

      console.log('Setting step1Data with dateOfBirth:', dateOfBirth);
      console.log('DateOfBirth type:', typeof dateOfBirth);
      console.log('DateOfBirth instanceof Date:', dateOfBirth instanceof Date);
      console.log('DateOfBirth getTime():', dateOfBirth?.getTime());

      setStep1Data({
        firstName: existingPatient.firstName || '',
        lastName: existingPatient.lastName || '',
        dateOfBirth,
        gender: existingPatient.gender || 'MALE',
      });

      console.log('Setting step2Data:', {
        phoneNumber: existingPatient.phoneNumber || '',
        email: existingPatient.email || '',
        address: existingPatient.address || '',
        emergencyContact: {
          name: existingPatient.emergencyContact?.name || '',
          relationship: existingPatient.emergencyContact?.relationship || '',
          phoneNumber: existingPatient.emergencyContact?.phoneNumber || '',
        },
      });
      setStep2Data({
        phoneNumber: existingPatient.phoneNumber || '',
        email: existingPatient.email || '',
        address: existingPatient.address || '',
        emergencyContact: {
          name: existingPatient.emergencyContact?.name || '',
          relationship: existingPatient.emergencyContact?.relationship || '',
          phoneNumber: existingPatient.emergencyContact?.phoneNumber || '',
        },
      });

      console.log('Setting step3Data:', {
        allergies: existingPatient.medicalHistory?.allergies || '',
        bloodGroup: existingPatient.medicalHistory?.bloodGroup,
        genotype: existingPatient.medicalHistory?.genotype,
        height: existingPatient.medicalHistory?.height || '',
      });
      setStep3Data({
        allergies: existingPatient.medicalHistory?.allergies || '',
        bloodGroup: existingPatient.medicalHistory?.bloodGroup as any,
        genotype: existingPatient.medicalHistory?.genotype as any,
        height: existingPatient.medicalHistory?.height || '',
      });

      console.log('Setting step4Data (insurance):', {
        provider: existingPatient.insurance?.provider || '',
        policyNumber: existingPatient.insurance?.policyNumber || '',
        groupNumber: existingPatient.insurance?.groupNumber || '',
      });
      setStep4Data({
        provider: existingPatient.insurance?.provider || '',
        policyNumber: existingPatient.insurance?.policyNumber || '',
        groupNumber: existingPatient.insurance?.groupNumber || '',
      });

      // Debug: Check what was actually set
      setTimeout(() => {
        console.log('Final step1Data:', step1Data);
        console.log('Final step4Data (insurance):', step4Data);
      }, 100);

      // Force DatePicker to update by triggering a re-render
      if (dateOfBirth) {
        console.log('Triggering DatePicker re-render with date:', dateOfBirth);
        setDatePickerKey((prev) => prev + 1);
      }
    }
  }, [existingPatient, isEditMode]);

  // Debug: Monitor step data changes
  useEffect(() => {
    console.log('Step1Data changed:', step1Data);
    console.log('Step4Data (insurance) changed:', step4Data);
    console.log('DateOfBirth in step1Data:', step1Data.dateOfBirth);
    console.log('DateOfBirth type in step1Data:', typeof step1Data.dateOfBirth);
    console.log(
      'DateOfBirth instanceof Date in step1Data:',
      step1Data.dateOfBirth instanceof Date
    );
  }, [step1Data, step4Data]);

  // Force re-render of DatePicker when date changes
  const [datePickerKey, setDatePickerKey] = useState(0);

  useEffect(() => {
    if (step1Data.dateOfBirth) {
      setDatePickerKey((prev) => prev + 1);
    }
  }, [step1Data.dateOfBirth]);

  // Create patient mutation
  const createPatientMutation = useMutation({
    mutationFn: patientService.createPatient,
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient created successfully');
      navigate(`/patients/${patient.id}`);
    },
    onError: (error) => {
      console.error('Create patient error:', error);
      toast.error('Failed to create patient');
    },
  });

  // Update patient mutation
  const updatePatientMutation = useMutation({
    mutationFn: (data: PatientFormData) =>
      patientService.updatePatient(id!, data),
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      toast.success('Patient updated successfully');
      navigate(`/patients/${patient.id}`);
    },
    onError: (error) => {
      console.error('Update patient error:', error);
      toast.error('Failed to update patient');
    },
  });

  // Simple step validation
  const validateCurrentStep = (): boolean => {
    switch (activeStep) {
      case 0:
        return !!(
          step1Data.firstName &&
          step1Data.lastName &&
          step1Data.dateOfBirth
        );
      case 1:
        return !!(
          step2Data.phoneNumber &&
          step2Data.address &&
          step2Data.emergencyContact.name &&
          step2Data.emergencyContact.relationship &&
          step2Data.emergencyContact.phoneNumber
        );
      case 2:
        return true; // Medical info is optional
      case 3:
        return true; // Insurance is optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (validateCurrentStep()) {
      const formData: PatientFormData = {
        // Step 1: Personal Information
        firstName: step1Data.firstName,
        lastName: step1Data.lastName,
        dateOfBirth: step1Data.dateOfBirth!,
        gender: step1Data.gender,

        // Step 2: Contact Details
        phoneNumber: step2Data.phoneNumber,
        email: step2Data.email,
        address: step2Data.address,
        emergencyContact: step2Data.emergencyContact,

        // Step 3: Medical Information
        medicalHistory: step3Data,

        // Step 4: Insurance
        insurance: step4Data,
      };

      console.log('Submitting form data:', formData);
      console.log('Is edit mode:', isEditMode);
      console.log('Step 4 data (insurance) being submitted:', step4Data);
      console.log('Insurance field in formData:', formData.insurance);

      if (isEditMode) {
        console.log('Calling updatePatientMutation with:', formData);
        updatePatientMutation.mutate(formData);
      } else {
        console.log('Calling createPatientMutation with:', formData);
        createPatientMutation.mutate(formData);
      }
    }
  };

  const handleCancel = () => {
    navigate('/patients');
  };

  const renderPersonalInformation = () => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
        },
        gap: 3,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <TextField
          label='First Name'
          fullWidth
          required
          value={step1Data.firstName}
          onChange={(e) =>
            setStep1Data((prev) => ({ ...prev, firstName: e.target.value }))
          }
          sx={{ mb: 1 }}
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <TextField
          label='Last Name'
          fullWidth
          required
          value={step1Data.lastName}
          onChange={(e) =>
            setStep1Data((prev) => ({ ...prev, lastName: e.target.value }))
          }
          sx={{ mb: 1 }}
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            key={datePickerKey}
            label='Date of Birth'
            value={step1Data.dateOfBirth}
            onChange={(date) =>
              setStep1Data((prev) => ({
                ...prev,
                dateOfBirth: date || undefined,
              }))
            }
            enableAccessibleFieldDOMStructure={false}
            slots={{
              textField: (params) => (
                <TextField {...params} fullWidth required sx={{ mb: 1 }} />
              ),
            }}
            maxDate={new Date()}
          />
        </LocalizationProvider>
      </Box>
      <Box sx={{ mb: 2 }}>
        <FormControl component='fieldset'>
          <FormLabel component='legend' required>
            Gender
          </FormLabel>
          <RadioGroup
            value={step1Data.gender}
            onChange={(e) =>
              setStep1Data((prev) => ({
                ...prev,
                gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER',
              }))
            }
            row
          >
            <FormControlLabel value='MALE' control={<Radio />} label='Male' />
            <FormControlLabel
              value='FEMALE'
              control={<Radio />}
              label='Female'
            />
            <FormControlLabel value='OTHER' control={<Radio />} label='Other' />
          </RadioGroup>
        </FormControl>
      </Box>
    </Box>
  );

  const renderContactDetails = () => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
        },
        gap: 3,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <TextField
          label='Phone Number'
          fullWidth
          required
          value={step2Data.phoneNumber}
          onChange={(e) =>
            setStep2Data((prev) => ({ ...prev, phoneNumber: e.target.value }))
          }
          sx={{ mb: 1 }}
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <TextField
          label='Email Address'
          type='email'
          fullWidth
          value={step2Data.email}
          onChange={(e) =>
            setStep2Data((prev) => ({ ...prev, email: e.target.value }))
          }
          sx={{ mb: 1 }}
        />
      </Box>
      <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' }, mb: 2 }}>
        <TextField
          label='Address'
          fullWidth
          multiline
          rows={2}
          required
          value={step2Data.address}
          onChange={(e) =>
            setStep2Data((prev) => ({ ...prev, address: e.target.value }))
          }
          sx={{ mb: 1 }}
        />
      </Box>

      <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' }, mb: 2 }}>
        <Divider sx={{ my: 2 }}>
          <Typography variant='h6'>Emergency Contact</Typography>
        </Divider>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          label='Contact Name'
          fullWidth
          required
          value={step2Data.emergencyContact.name}
          onChange={(e) =>
            setStep2Data((prev) => ({
              ...prev,
              emergencyContact: {
                ...prev.emergencyContact,
                name: e.target.value,
              },
            }))
          }
          sx={{ mb: 1 }}
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <TextField
          label='Relationship'
          fullWidth
          required
          value={step2Data.emergencyContact.relationship}
          onChange={(e) =>
            setStep2Data((prev) => ({
              ...prev,
              emergencyContact: {
                ...prev.emergencyContact,
                relationship: e.target.value,
              },
            }))
          }
          sx={{ mb: 1 }}
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <TextField
          label='Contact Phone'
          fullWidth
          required
          value={step2Data.emergencyContact.phoneNumber}
          onChange={(e) =>
            setStep2Data((prev) => ({
              ...prev,
              emergencyContact: {
                ...prev.emergencyContact,
                phoneNumber: e.target.value,
              },
            }))
          }
          sx={{ mb: 1 }}
        />
      </Box>
    </Box>
  );

  const renderMedicalInformation = () => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
        },
        gap: 3,
      }}
    >
      <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' }, mb: 2 }}>
        <Typography variant='h6' gutterBottom>
          Medical Information (Optional)
        </Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <TextField
          label='Allergies'
          fullWidth
          multiline
          rows={3}
          placeholder='List any known allergies...'
          value={step3Data.allergies}
          onChange={(e) =>
            setStep3Data((prev) => ({ ...prev, allergies: e.target.value }))
          }
          sx={{ mb: 1 }}
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth>
          <InputLabel id='blood-group-label'>Blood Group</InputLabel>
          <Select
            labelId='blood-group-label'
            id='blood-group'
            value={step3Data.bloodGroup || ''}
            label='Blood Group'
            onChange={(e) =>
              setStep3Data((prev) => ({ ...prev, bloodGroup: e.target.value }))
            }
          >
            <MenuItem value='A+'>A+</MenuItem>
            <MenuItem value='A-'>A-</MenuItem>
            <MenuItem value='B+'>B+</MenuItem>
            <MenuItem value='B-'>B-</MenuItem>
            <MenuItem value='AB+'>AB+</MenuItem>
            <MenuItem value='AB-'>AB-</MenuItem>
            <MenuItem value='O+'>O+</MenuItem>
            <MenuItem value='O-'>O-</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth>
          <InputLabel id='genotype-label'>Genotype</InputLabel>
          <Select
            labelId='genotype-label'
            id='genotype'
            value={step3Data.genotype || ''}
            label='Genotype'
            onChange={(e) =>
              setStep3Data((prev) => ({ ...prev, genotype: e.target.value }))
            }
          >
            <MenuItem value='AA'>AA</MenuItem>
            <MenuItem value='AS'>AS</MenuItem>
            <MenuItem value='AC'>AC</MenuItem>
            <MenuItem value='SS'>SS</MenuItem>
            <MenuItem value='SC'>SC</MenuItem>
            <MenuItem value='CC'>CC</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ mb: 2 }}>
        <TextField
          label='Height'
          fullWidth
          placeholder='e.g., 175 cm'
          value={step3Data.height}
          onChange={(e) =>
            setStep3Data((prev) => ({ ...prev, height: e.target.value }))
          }
          sx={{ mb: 1 }}
        />
      </Box>
    </Box>
  );

  const renderInsurance = () => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(3, 1fr)',
        },
        gap: 3,
      }}
    >
      <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' }, mb: 2 }}>
        <Typography variant='h6' gutterBottom>
          Insurance Information (Optional)
        </Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <TextField
          label='Insurance Provider'
          fullWidth
          placeholder='e.g., Blue Cross, Aetna'
          value={step4Data.provider}
          onChange={(e) =>
            setStep4Data((prev) => ({ ...prev, provider: e.target.value }))
          }
          sx={{ mb: 1 }}
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <TextField
          label='Policy Number'
          fullWidth
          value={step4Data.policyNumber}
          onChange={(e) =>
            setStep4Data((prev) => ({ ...prev, policyNumber: e.target.value }))
          }
          sx={{ mb: 1 }}
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <TextField
          label='Group Number'
          fullWidth
          value={step4Data.groupNumber}
          onChange={(e) =>
            setStep4Data((prev) => ({ ...prev, groupNumber: e.target.value }))
          }
          sx={{ mb: 1 }}
        />
      </Box>
    </Box>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderPersonalInformation();
      case 1:
        return renderContactDetails();
      case 2:
        return renderMedicalInformation();
      case 3:
        return renderInsurance();
      default:
        return null;
    }
  };

  return (
    <Box>
      <PageHeader
        title={isEditMode ? 'Edit Patient' : 'Add New Patient'}
        subtitle={
          isEditMode
            ? 'Update patient information'
            : 'Enter patient information to create a new record'
        }
        breadcrumbs={<Breadcrumb />}
        showActions={false}
      />

      <Card>
        <CardContent>
          {/* Loading state for edit mode */}
          {isEditMode && isLoadingPatient && (
            <Box
              display='flex'
              justifyContent='center'
              alignItems='center'
              minHeight='200px'
            >
              <Typography>Loading patient data...</Typography>
            </Box>
          )}

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Content */}
          {!isEditMode || !isLoadingPatient ? (
            <>
              <Paper
                elevation={0}
                sx={{ p: 3, mb: 3, backgroundColor: 'grey.50' }}
              >
                {getStepContent(activeStep)}
              </Paper>

              {/* Navigation Buttons */}
              <Box display='flex' justifyContent='space-between'>
                <Box>
                  <Button onClick={handleCancel} sx={{ mr: 1 }}>
                    Cancel
                  </Button>
                  {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}
                </Box>
                <Box>
                  {activeStep < steps.length - 1 ? (
                    <Button
                      type='button'
                      variant='contained'
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type='button'
                      variant='contained'
                      onClick={handleSubmit}
                      disabled={
                        createPatientMutation.isPending ||
                        updatePatientMutation.isPending
                      }
                    >
                      {createPatientMutation.isPending ||
                      updatePatientMutation.isPending
                        ? isEditMode
                          ? 'Updating...'
                          : 'Creating...'
                        : isEditMode
                        ? 'Update Patient'
                        : 'Create Patient'}
                    </Button>
                  )}
                </Box>
              </Box>
            </>
          ) : null}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AddPatientPage;
