import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  Typography,
  Chip,
  Button,
  Alert,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Stack,
  Divider,
  useTheme,
  alpha,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  Science,
  Person,
  CalendarToday,
  Warning,
  CheckCircle,
  AccessTime,
  LocalHospital,
  Assignment,
} from '@mui/icons-material';
import { formatDate } from '@/utils';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import { labRequestService } from '../services/lab-request.service';

const LabResultDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const {
    data: labRequest,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['lab-result', id],
    queryFn: () => labRequestService.getLabRequestById(id!),
    enabled: !!id,
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'STAT':
        return 'error';
      case 'URGENT':
        return 'warning';
      default:
        return 'success';
    }
  };

  const getResultStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return 'error';
      case 'COMPLETED':
        return 'success';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box>
        <PageHeader title='Lab Result Details' breadcrumbs={<Breadcrumb />} />
        <Stack spacing={3}>
          <Skeleton
            variant='rectangular'
            height={200}
            sx={{ borderRadius: 3 }}
          />
          <Skeleton
            variant='rectangular'
            height={300}
            sx={{ borderRadius: 3 }}
          />
        </Stack>
      </Box>
    );
  }

  if (error || !labRequest) {
    return (
      <Box>
        <PageHeader title='Lab Result Details' breadcrumbs={<Breadcrumb />} />
        <Alert severity='error' sx={{ borderRadius: 2 }}>
          Failed to load lab result details. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title='Lab Result Details'
        breadcrumbs={<Breadcrumb />}
        actions={
          <Button
            variant='outlined'
            startIcon={<ArrowBack />}
            onClick={() => navigate('/lab/results')}
            sx={{ borderRadius: 2 }}
          >
            Back to Results
          </Button>
        }
      />

      <Stack spacing={3}>
        {/* Header Card */}
        <Card
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.info.main,
              0.05
            )} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
          }}
        >
          <Box p={3}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}
            >
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Avatar
                  sx={{
                    bgcolor: 'info.main',
                    width: 64,
                    height: 64,
                  }}
                >
                  <Science sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant='h5' fontWeight={700} gutterBottom>
                    {labRequest.testName}
                  </Typography>
                  <Typography variant='body1' color='text.secondary'>
                    {labRequest.testType}
                    {labRequest.specimenType && ` - ${labRequest.specimenType}`}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Chip
                  label={labRequest.urgency}
                  size='small'
                  color={getUrgencyColor(labRequest.urgency) as any}
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  label={labRequest.status}
                  size='small'
                  color='success'
                  variant='outlined'
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Box>

            {labRequest.description && (
              <Alert severity='info' sx={{ borderRadius: 2 }}>
                <Typography variant='body2'>
                  {labRequest.description}
                </Typography>
              </Alert>
            )}
          </Box>
        </Card>

        {/* Patient & Provider Information */}
        <Card
          sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
        >
          <Box p={3}>
            <Typography variant='h6' fontWeight={600} gutterBottom>
              Request Information
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 3,
              }}
            >
              {/* Patient */}
              <Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <Person fontSize='small' color='action' />
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    fontWeight={600}
                  >
                    Patient
                  </Typography>
                </Box>
                <Typography variant='body1' fontWeight={600}>
                  {labRequest.treatment?.patient?.firstName}{' '}
                  {labRequest.treatment?.patient?.lastName}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Patient ID: {labRequest.treatment?.patient?.patientId}
                </Typography>
              </Box>

              {/* Requesting Provider */}
              <Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <LocalHospital fontSize='small' color='action' />
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    fontWeight={600}
                  >
                    Requested By
                  </Typography>
                </Box>
                <Typography variant='body1' fontWeight={600}>
                  Dr. {labRequest.requestingProvider?.user?.firstName}{' '}
                  {labRequest.requestingProvider?.user?.lastName}
                </Typography>
              </Box>

              {/* Lab Provider */}
              {labRequest.labProvider && (
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Science fontSize='small' color='action' />
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      fontWeight={600}
                    >
                      Processed By
                    </Typography>
                  </Box>
                  <Typography variant='body1' fontWeight={600}>
                    {labRequest.labProvider?.user?.firstName}{' '}
                    {labRequest.labProvider?.user?.lastName}
                  </Typography>
                </Box>
              )}

              {/* Requested Date */}
              <Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <CalendarToday fontSize='small' color='action' />
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    fontWeight={600}
                  >
                    Requested
                  </Typography>
                </Box>
                <Typography variant='body1'>
                  {formatDate(labRequest.requestedAt)}
                </Typography>
              </Box>

              {/* Completed Date */}
              {labRequest.completedAt && (
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <AccessTime fontSize='small' color='action' />
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      fontWeight={600}
                    >
                      Completed
                    </Typography>
                  </Box>
                  <Typography variant='body1'>
                    {formatDate(labRequest.completedAt)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Card>

        {/* Test Results */}
        {labRequest.results && labRequest.results.length > 0 && (
          <Card
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box p={3}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}
              >
                <Assignment color='primary' />
                <Typography variant='h6' fontWeight={600}>
                  Test Results ({labRequest.results.length})
                </Typography>
              </Box>
              <TableContainer
                component={Paper}
                variant='outlined'
                sx={{ borderRadius: 2 }}
              >
                <Table>
                  <TableHead>
                    <TableRow
                      sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}
                    >
                      <TableCell>
                        <Typography variant='subtitle2' fontWeight={700}>
                          Result Type
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='subtitle2' fontWeight={700}>
                          Value
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='subtitle2' fontWeight={700}>
                          Normal Range
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='subtitle2' fontWeight={700}>
                          Unit
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='subtitle2' fontWeight={700}>
                          Status
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {labRequest.results.map((result: any, index: number) => (
                      <TableRow
                        key={result.id || index}
                        sx={{
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.02),
                          },
                          bgcolor:
                            result.status === 'CRITICAL'
                              ? alpha(theme.palette.error.main, 0.05)
                              : 'inherit',
                        }}
                      >
                        <TableCell>
                          <Typography variant='body2' fontWeight={600}>
                            {result.resultType}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant='body1'
                            fontWeight={700}
                            color={
                              result.status === 'CRITICAL'
                                ? 'error.main'
                                : 'inherit'
                            }
                          >
                            {result.resultValue || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' color='text.secondary'>
                            {result.normalRange || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {result.unit || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={result.status}
                            size='small'
                            color={getResultStatusColor(result.status) as any}
                            icon={
                              result.status === 'CRITICAL' ? (
                                <Warning />
                              ) : (
                                <CheckCircle />
                              )
                            }
                            variant='outlined'
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Critical Results Alert */}
              {labRequest.results.some((r: any) => r.status === 'CRITICAL') && (
                <Alert severity='error' sx={{ mt: 3, borderRadius: 2 }}>
                  <Typography variant='body2' fontWeight={600}>
                    ⚠️ This test contains critical results that require
                    immediate attention
                  </Typography>
                </Alert>
              )}

              {/* Results Notes */}
              {labRequest.results.some((r: any) => r.notes) && (
                <Box mt={3}>
                  <Typography variant='subtitle2' fontWeight={600} gutterBottom>
                    Additional Notes
                  </Typography>
                  {labRequest.results
                    .filter((r: any) => r.notes)
                    .map((result: any, index: number) => (
                      <Alert
                        key={index}
                        severity='info'
                        sx={{ mb: 1, borderRadius: 2 }}
                      >
                        <Typography variant='body2'>
                          <strong>{result.resultType}:</strong> {result.notes}
                        </Typography>
                      </Alert>
                    ))}
                </Box>
              )}
            </Box>
          </Card>
        )}

        {/* Collection Instructions */}
        {labRequest.collectionInstructions && (
          <Card
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box p={3}>
              <Typography variant='h6' fontWeight={600} gutterBottom>
                Collection Instructions
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant='body2' color='text.secondary'>
                {labRequest.collectionInstructions}
              </Typography>
            </Box>
          </Card>
        )}
      </Stack>
    </Box>
  );
};

export default LabResultDetailsPage;
