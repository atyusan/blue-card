import React from 'react';
import { Box, Typography, Divider, Stack } from '@mui/material';
import { formatDate, formatCurrency } from '../utils';

interface PrintableReceiptProps {
  payment: any;
  hospitalInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
}

const PrintableReceipt: React.FC<PrintableReceiptProps> = ({
  payment,
  hospitalInfo = {
    name: 'HealthCare Medical Center',
    address: '123 Medical Drive, Health City, HC 12345',
    phone: '+1 (555) 123-4567',
    email: 'billing@healthcare.com',
  },
}) => {
  if (!payment) return null;

  return (
    <Box
      sx={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: 3,
        backgroundColor: 'white',
        color: 'black',
        fontFamily: 'Arial, sans-serif',
        '@media print': {
          margin: 0,
          padding: 2,
          boxShadow: 'none',
          backgroundColor: 'white',
          color: 'black',
        },
      }}
    >
      {/* Hospital Header */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        {hospitalInfo.logo && (
          <img
            src={hospitalInfo.logo}
            alt='Hospital Logo'
            style={{ maxHeight: '60px', marginBottom: '10px' }}
          />
        )}
        <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 1 }}>
          {hospitalInfo.name}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          {hospitalInfo.address}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Phone: {hospitalInfo.phone} | Email: {hospitalInfo.email}
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Receipt Title */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
          PAYMENT RECEIPT
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Receipt #{payment.reference}
        </Typography>
      </Box>

      {/* Payment Information */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 3,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 2 }}>
            Payment Details
          </Typography>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant='body2'>Payment ID:</Typography>
              <Typography variant='body2' sx={{ fontWeight: 'medium' }}>
                {payment.id?.slice(-12) || 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant='body2'>Reference:</Typography>
              <Typography variant='body2' sx={{ fontWeight: 'medium' }}>
                {payment.reference}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant='body2'>Payment Method:</Typography>
              <Typography variant='body2' sx={{ fontWeight: 'medium' }}>
                {payment.method}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant='body2'>Status:</Typography>
              <Typography variant='body2' sx={{ fontWeight: 'medium' }}>
                {payment.status}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant='body2'>Date Processed:</Typography>
              <Typography variant='body2' sx={{ fontWeight: 'medium' }}>
                {payment.processedAt ? formatDate(payment.processedAt) : 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant='body2'>Processed By:</Typography>
              <Typography variant='body2' sx={{ fontWeight: 'medium' }}>
                {payment.processedBy || 'System'}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box>
          <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 2 }}>
            Patient Information
          </Typography>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant='body2'>Patient Name:</Typography>
              <Typography variant='body2' sx={{ fontWeight: 'medium' }}>
                {payment.patient?.firstName} {payment.patient?.lastName}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant='body2'>Patient ID:</Typography>
              <Typography variant='body2' sx={{ fontWeight: 'medium' }}>
                {payment.patient?.patientId}
              </Typography>
            </Box>
            {payment.patient?.phone && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant='body2'>Phone:</Typography>
                <Typography variant='body2' sx={{ fontWeight: 'medium' }}>
                  {payment.patient.phone}
                </Typography>
              </Box>
            )}
            {payment.patient?.email && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant='body2'>Email:</Typography>
                <Typography variant='body2' sx={{ fontWeight: 'medium' }}>
                  {payment.patient.email}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Invoice Information */}
      {payment.invoice && (
        <>
          <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 2 }}>
            Invoice Information
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 3,
              mb: 3,
            }}
          >
            <Box>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2'>Invoice Number:</Typography>
                  <Typography variant='body2' sx={{ fontWeight: 'medium' }}>
                    {payment.invoice.invoiceNumber ||
                      payment.invoice.number ||
                      'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2'>Invoice Total:</Typography>
                  <Typography variant='body2' sx={{ fontWeight: 'medium' }}>
                    {payment.invoice.totalAmount
                      ? formatCurrency(payment.invoice.totalAmount)
                      : 'N/A'}
                  </Typography>
                </Box>
              </Stack>
            </Box>
            <Box>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2'>Due Date:</Typography>
                  <Typography variant='body2' sx={{ fontWeight: 'medium' }}>
                    {payment.invoice.dueDate
                      ? formatDate(payment.invoice.dueDate)
                      : 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2'>Remaining Balance:</Typography>
                  <Typography variant='body2' sx={{ fontWeight: 'medium' }}>
                    {payment.invoice.balance
                      ? formatCurrency(payment.invoice.balance)
                      : 'N/A'}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
          <Divider sx={{ mb: 3 }} />
        </>
      )}

      {/* Payment Amount Summary */}
      <Box
        sx={{
          border: '2px solid #e0e0e0',
          borderRadius: 1,
          p: 2,
          mb: 3,
          backgroundColor: '#f5f5f5',
        }}
      >
        <Typography
          variant='h6'
          sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}
        >
          Payment Summary
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant='body1'>Payment Amount:</Typography>
          <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
            {formatCurrency(payment.amount)}
          </Typography>
        </Box>

        {payment.fee && payment.fee > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              Processing Fee:
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {formatCurrency(payment.fee)}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
            Total Paid:
          </Typography>
          <Typography
            variant='h6'
            sx={{ fontWeight: 'bold', color: 'success.main' }}
          >
            {formatCurrency(payment.amount + (payment.fee || 0))}
          </Typography>
        </Box>
      </Box>

      {/* Notes */}
      {payment.notes && (
        <Box sx={{ mb: 3 }}>
          <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 1 }}>
            Notes
          </Typography>
          <Typography
            variant='body2'
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              p: 2,
              backgroundColor: '#f9f9f9',
            }}
          >
            {payment.notes}
          </Typography>
        </Box>
      )}

      {/* Footer */}
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant='body2' color='text.secondary'>
          Thank you for your payment!
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Please keep this receipt for your records.
        </Typography>
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant='caption' color='text.secondary'>
          Receipt generated on {formatDate(new Date())} | This is an
          automatically generated receipt.
        </Typography>
      </Box>
    </Box>
  );
};

export default PrintableReceipt;
