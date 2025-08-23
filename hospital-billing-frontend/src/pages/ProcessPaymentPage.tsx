import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { toast } from 'react-hot-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { paymentService } from '../services/payment.service';
import { invoiceService } from '../services/invoice.service';
import { patientService } from '../services/patient.service';
import { formatCurrency, formatDate } from '../utils';

interface PaymentData {
  invoiceId: string;
  patientId: string;
  amount: string;
  method: string;
  reference: string;
  notes: string;
  processDate: Date | null;
  fee: number;
  feeType: string;
  feeValue: number;
  sendReceipt: boolean;
  receiptEmail: string;
}

interface ValidationErrors {
  invoiceId?: string;
  patientId?: string;
  amount?: string;
  method?: string;
  reference?: string;
  processDate?: string;
}

const steps = [
  'Select Invoice',
  'Payment Details',
  'Processing Fees',
  'Receipt Options',
  'Confirmation',
];

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'insurance', label: 'Insurance' },
];

const feeTypes = [
  { value: 'PERCENTAGE', label: 'Percentage' },
  { value: 'FIXED', label: 'Fixed Amount' },
];

export default function ProcessPaymentPage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    invoiceId: '',
    patientId: '',
    amount: '',
    method: '',
    reference: '',
    notes: '',
    processDate: new Date(),
    fee: 0,
    feeType: 'PERCENTAGE' as const,
    feeValue: 0,
    sendReceipt: false,
    receiptEmail: '',
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Fetch invoices
  const { data: invoicesResponse } = useQuery({
    queryKey: ['invoices', 'unpaid'],
    queryFn: () => invoiceService.getInvoices({ status: 'unpaid' }),
  });

  // Fetch patients
  const { data: patientsResponse } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientService.getPatients(),
  });

  const invoices = invoicesResponse?.data || [];
  const patients = patientsResponse?.data || [];

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: paymentService.processPayment,
    onSuccess: () => {
      toast.success('Payment processed successfully!');
      setShowConfirmation(false);
      navigate('/payments');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process payment');
    },
  });

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateStep = (): boolean => {
    const errors: ValidationErrors = {};

    switch (activeStep) {
      case 0:
        if (!paymentData.invoiceId) errors.invoiceId = 'Invoice is required';
        if (!paymentData.patientId) errors.patientId = 'Patient is required';
        break;
      case 1:
        if (!paymentData.amount) errors.amount = 'Amount is required';
        if (!paymentData.method) errors.method = 'Payment method is required';
        if (!paymentData.reference) errors.reference = 'Reference is required';
        if (!paymentData.processDate)
          errors.processDate = 'Process date is required';
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInvoiceSelect = (invoiceId: string) => {
    const invoice = invoices.find((inv: any) => inv.id === invoiceId);
    if (invoice) {
      setSelectedInvoice(invoice);
      setPaymentData((prev) => ({
        ...prev,
        invoiceId,
        patientId: invoice.patientId,
        amount: invoice.totalAmount.toString(),
      }));
      setSelectedPatient(patients.find((p: any) => p.id === invoice.patientId));
    }
  };

  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find((p: any) => p.id === patientId);
    if (patient) {
      setSelectedPatient(patient);
      setPaymentData((prev) => ({ ...prev, patientId }));
    }
  };

  const handleProcessPayment = () => {
    if (validateStep()) {
      const payload = {
        invoiceId: paymentData.invoiceId,
        patientId: paymentData.patientId,
        amount: parseFloat(paymentData.amount),
        method: paymentData.method,
        reference: paymentData.reference,
        notes: paymentData.notes,
        processDate:
          paymentData.processDate?.toISOString() || new Date().toISOString(),
        fee: paymentData.fee,
        feeType: paymentData.feeType as 'FIXED' | 'PERCENTAGE' | undefined,
        feeValue: paymentData.feeValue,
        sendReceipt: paymentData.sendReceipt,
        receiptEmail: paymentData.receiptEmail,
      };

      processPaymentMutation.mutate(payload);
    }
  };

  const calculateTotalAmount = () => {
    const baseAmount = parseFloat(paymentData.amount) || 0;
    let feeAmount = 0;

    if (paymentData.feeType === 'PERCENTAGE') {
      feeAmount = (baseAmount * paymentData.feeValue) / 100;
    } else {
      feeAmount = paymentData.feeValue;
    }

    return baseAmount + feeAmount;
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>
              Select Invoice and Patient
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 3,
                mb: 3,
              }}
            >
              <FormControl
                fullWidth
                required
                error={!!validationErrors.invoiceId}
              >
                <InputLabel>Select Invoice</InputLabel>
                <Select
                  value={paymentData.invoiceId}
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                  label='Select Invoice'
                >
                  {invoices.map((invoice: any) => (
                    <MenuItem key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber || invoice.number} -{' '}
                      {formatCurrency(invoice.totalAmount)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                fullWidth
                required
                error={!!validationErrors.patientId}
              >
                <InputLabel>Select Patient</InputLabel>
                <Select
                  value={paymentData.patientId}
                  onChange={(e) => handlePatientSelect(e.target.value)}
                  label='Select Patient'
                >
                  {patients.map((patient: any) => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {selectedInvoice && (
              <Card variant='outlined' sx={{ mb: 2 }}>
                <CardContent>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Selected Invoice Details
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                      gap: 2,
                    }}
                  >
                    <Typography variant='body2'>
                      <strong>Invoice:</strong>{' '}
                      {selectedInvoice.invoiceNumber || selectedInvoice.number}
                    </Typography>
                    <Typography variant='body2'>
                      <strong>Amount:</strong>{' '}
                      {formatCurrency(selectedInvoice.totalAmount)}
                    </Typography>
                    <Typography variant='body2'>
                      <strong>Due Date:</strong>{' '}
                      {formatDate(selectedInvoice.dueDate)}
                    </Typography>
                    <Typography variant='body2'>
                      <strong>Status:</strong> {selectedInvoice.status}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            {selectedPatient && (
              <Card variant='outlined'>
                <CardContent>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Patient Information
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                      gap: 2,
                    }}
                  >
                    <Typography variant='body2'>
                      <strong>Name:</strong> {selectedPatient.firstName}{' '}
                      {selectedPatient.lastName}
                    </Typography>
                    <Typography variant='body2'>
                      <strong>ID:</strong> {selectedPatient.patientId}
                    </Typography>
                    <Typography variant='body2'>
                      <strong>Phone:</strong> {selectedPatient.phone}
                    </Typography>
                    <Typography variant='body2'>
                      <strong>Email:</strong> {selectedPatient.email}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 1:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>
              Payment Details
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 3,
                mb: 3,
              }}
            >
              <TextField
                fullWidth
                label='Amount'
                type='number'
                value={paymentData.amount}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                required
                error={!!validationErrors.amount}
                helperText={validationErrors.amount}
              />

              <FormControl fullWidth required error={!!validationErrors.method}>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentData.method}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      method: e.target.value,
                    }))
                  }
                  label='Payment Method'
                >
                  {paymentMethods.map((method) => (
                    <MenuItem key={method.value} value={method.value}>
                      {method.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 3,
                mb: 3,
              }}
            >
              <TextField
                fullWidth
                label='Reference Number'
                value={paymentData.reference}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    reference: e.target.value,
                  }))
                }
                required
                error={!!validationErrors.reference}
                helperText={validationErrors.reference}
              />

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label='Process Date'
                  value={paymentData.processDate}
                  onChange={(newValue) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      processDate: newValue,
                    }))
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!validationErrors.processDate,
                      helperText: validationErrors.processDate,
                    },
                  }}
                />
              </LocalizationProvider>
            </Box>

            <TextField
              fullWidth
              label='Notes'
              multiline
              rows={3}
              value={paymentData.notes}
              onChange={(e) =>
                setPaymentData((prev) => ({ ...prev, notes: e.target.value }))
              }
              sx={{ mb: 2 }}
            />
          </Box>
        );

      case 2:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>
              Processing Fees
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                gap: 3,
                mb: 3,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>Fee Type</InputLabel>
                <Select
                  value={paymentData.feeType}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      feeType: e.target.value,
                    }))
                  }
                  label='Fee Type'
                >
                  {feeTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label='Fee Value'
                type='number'
                value={paymentData.feeValue}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    feeValue: parseFloat(e.target.value) || 0,
                  }))
                }
                InputProps={{
                  endAdornment:
                    paymentData.feeType === 'PERCENTAGE' ? '%' : null,
                }}
              />

              <TextField
                fullWidth
                label='Fee Amount'
                value={
                  paymentData.feeType === 'PERCENTAGE'
                    ? `${(
                        ((parseFloat(paymentData.amount) || 0) *
                          paymentData.feeValue) /
                        100
                      ).toFixed(2)}`
                    : paymentData.feeValue.toFixed(2)
                }
                InputProps={{ readOnly: true }}
              />
            </Box>

            <Card variant='outlined' sx={{ mt: 2 }}>
              <CardContent>
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  gutterBottom
                >
                  Fee Summary
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <Typography variant='body2'>
                    <strong>Base Amount:</strong>{' '}
                    {formatCurrency(parseFloat(paymentData.amount) || 0)}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Fee Amount:</strong>{' '}
                    {paymentData.feeType === 'PERCENTAGE'
                      ? `${(
                          ((parseFloat(paymentData.amount) || 0) *
                            paymentData.feeValue) /
                          100
                        ).toFixed(2)}`
                      : formatCurrency(paymentData.feeValue)}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Total Amount:</strong>{' '}
                    {formatCurrency(calculateTotalAmount())}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>
              Receipt Options
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 3,
                mb: 3,
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={paymentData.sendReceipt}
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        sendReceipt: e.target.checked,
                      }))
                    }
                  />
                }
                label='Send Receipt'
              />

              {paymentData.sendReceipt && (
                <TextField
                  fullWidth
                  label='Receipt Email'
                  type='email'
                  value={paymentData.receiptEmail}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      receiptEmail: e.target.value,
                    }))
                  }
                  placeholder={selectedPatient?.email || 'Enter email address'}
                />
              )}
            </Box>

            <Card variant='outlined'>
              <CardContent>
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  gutterBottom
                >
                  Receipt Preview
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <Typography variant='body2'>
                    <strong>Invoice:</strong>{' '}
                    {selectedInvoice?.invoiceNumber || selectedInvoice?.number}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Patient:</strong> {selectedPatient?.firstName}{' '}
                    {selectedPatient?.lastName}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Amount:</strong>{' '}
                    {formatCurrency(calculateTotalAmount())}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Method:</strong> {paymentData.method}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Reference:</strong> {paymentData.reference}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Date:</strong>{' '}
                    {paymentData.processDate
                      ? formatDate(paymentData.processDate)
                      : 'N/A'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      case 4:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>
              Confirm Payment
            </Typography>

            <Typography variant='body1' sx={{ mb: 3 }}>
              Please review the payment details before processing:
            </Typography>

            <Card variant='outlined' sx={{ mb: 3 }}>
              <CardContent>
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  gutterBottom
                >
                  Payment Summary
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <Typography variant='body2'>
                    <strong>Invoice:</strong>{' '}
                    {selectedInvoice?.invoiceNumber || selectedInvoice?.number}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Patient:</strong> {selectedPatient?.firstName}{' '}
                    {selectedPatient?.lastName}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Base Amount:</strong>{' '}
                    {formatCurrency(parseFloat(paymentData.amount) || 0)}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Fee Amount:</strong>{' '}
                    {paymentData.feeType === 'PERCENTAGE'
                      ? `${(
                          ((parseFloat(paymentData.amount) || 0) *
                            paymentData.feeValue) /
                          100
                        ).toFixed(2)}`
                      : formatCurrency(paymentData.feeValue)}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Total Amount:</strong>{' '}
                    {formatCurrency(calculateTotalAmount())}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Payment Method:</strong> {paymentData.method}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Reference:</strong> {paymentData.reference}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Process Date:</strong>{' '}
                    {paymentData.processDate
                      ? formatDate(paymentData.processDate)
                      : 'N/A'}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Send Receipt:</strong>{' '}
                    {paymentData.sendReceipt ? 'Yes' : 'No'}
                  </Typography>
                  {paymentData.sendReceipt && (
                    <Typography variant='body2'>
                      <strong>Receipt Email:</strong> {paymentData.receiptEmail}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>

            <Typography variant='body2' color='text.secondary'>
              Click "Process Payment" to complete the transaction.
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant='h4' gutterBottom>
        Process Payment
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card>{renderStepContent()}</Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button disabled={activeStep === 0} onClick={handleBack}>
          Back
        </Button>

        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant='contained'
              color='primary'
              onClick={() => setShowConfirmation(true)}
              disabled={processPaymentMutation.isPending}
            >
              {processPaymentMutation.isPending
                ? 'Processing...'
                : 'Process Payment'}
            </Button>
          ) : (
            <Button variant='contained' onClick={handleNext}>
              Next
            </Button>
          )}
        </Box>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
      >
        <DialogTitle>Confirm Payment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to process this payment for{' '}
            {formatCurrency(calculateTotalAmount())}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmation(false)}>Cancel</Button>
          <Button
            onClick={handleProcessPayment}
            variant='contained'
            color='primary'
            disabled={processPaymentMutation.isPending}
          >
            {processPaymentMutation.isPending ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
