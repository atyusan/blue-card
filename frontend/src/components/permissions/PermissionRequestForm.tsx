import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Typography } from '@mui/material';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Chip } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  CalendarToday,
  AccessTime,
  Security,
  Warning,
} from '@mui/icons-material';

const permissionRequestSchema = z.object({
  permission: z.string().min(1, 'Permission is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  urgency: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  expiresAt: z.string().min(1, 'Expiration date is required'),
  approvers: z.array(z.string()).min(1, 'At least one approver is required'),
});

type PermissionRequestFormData = z.infer<typeof permissionRequestSchema>;

interface PermissionRequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PermissionRequestForm: React.FC<PermissionRequestFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { user, staffMember, hasPermission } = useAuth();
  const { showError, showSuccess } = useToast();
  const [availablePermissions, setAvailablePermissions] = useState<string[]>(
    []
  );
  const [potentialApprovers, setPotentialApprovers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PermissionRequestFormData>({
    resolver: zodResolver(permissionRequestSchema),
    defaultValues: {
      permission: '',
      reason: '',
      urgency: 'NORMAL',
      expiresAt: '',
      approvers: [],
    },
  });

  useEffect(() => {
    // Load available permissions and potential approvers
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      // In a real app, you'd fetch these from your API
      const permissions = [
        'manage_patients',
        'view_billing',
        'edit_billing',
        'manage_lab_tests',
        'manage_medications',
        'perform_surgery',
        'manage_cash_transactions',
        'view_audit_logs',
      ];

      const approvers = [
        {
          id: '1',
          name: 'Dr. John Smith',
          role: 'Department Head',
          department: 'Cardiology',
        },
        {
          id: '2',
          name: 'Dr. Sarah Johnson',
          role: 'Medical Director',
          department: 'General',
        },
        {
          id: '3',
          name: 'Nurse Manager',
          role: 'Nursing Director',
          department: 'General',
        },
      ];

      setAvailablePermissions(permissions);
      setPotentialApprovers(approvers);
    } catch (error) {
      console.error('Failed to load form data:', error);
      showError('Failed to load form data');
    }
  };

  const onSubmit = async (data: PermissionRequestFormData) => {
    try {
      setIsSubmitting(true);

      // Validate expiration date
      const expirationDate = new Date(data.expiresAt);
      const now = new Date();

      if (expirationDate <= now) {
        showError('Expiration date must be in the future');
        return;
      }

      // In a real app, you'd submit this to your API
      console.log('Submitting permission request:', data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showSuccess('Permission request submitted successfully');
      onSuccess?.();
    } catch (error) {
      console.error('Failed to submit permission request:', error);
      showError('Failed to submit permission request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'LOW':
        return 'bg-green-100 text-green-800';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'LOW':
        return '🟢';
      case 'NORMAL':
        return '🔵';
      case 'HIGH':
        return '🟠';
      case 'URGENT':
        return '🔴';
      default:
        return '⚪';
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-red-600'>
            You must be logged in to request permissions.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='max-w-2xl mx-auto'>
      <CardHeader>
        <Typography
          variant='h6'
          component='h2'
          className='flex items-center gap-2'
        >
          <Security sx={{ fontSize: 20 }} />
          Request Temporary Permission
        </Typography>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* User Information */}
          <div className='bg-gray-50 p-4 rounded-lg'>
            <h3 className='font-medium mb-2'>Requesting User</h3>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-muted-foreground'>Name:</span>
                <span className='ml-2 font-medium'>
                  {user.firstName} {user.lastName}
                </span>
              </div>
              <div>
                <span className='text-muted-foreground'>Department:</span>
                <span className='ml-2 font-medium'>
                  {staffMember?.department?.name || 'Not assigned'}
                </span>
              </div>
              <div>
                <span className='text-muted-foreground'>Email:</span>
                <span className='ml-2 font-medium'>{user.email}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>
                  Current Permissions:
                </span>
                <span className='ml-2 font-medium'>
                  {user.permissions ? (user.permissions as string[]).length : 0}
                </span>
              </div>
            </div>
          </div>

          {/* Permission Selection */}
          <div className='space-y-2'>
            <Label htmlFor='permission'>Permission Required *</Label>
            <Select
              value={form.watch('permission')}
              onValueChange={(value) => form.setValue('permission', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select a permission' />
              </SelectTrigger>
              <SelectContent>
                {availablePermissions.map((permission) => (
                  <SelectItem key={permission} value={permission}>
                    {permission.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.permission && (
              <p className='text-sm text-red-600'>
                {form.formState.errors.permission.message}
              </p>
            )}
          </div>

          {/* Reason */}
          <div className='space-y-2'>
            <Label htmlFor='reason'>Reason for Request *</Label>
            <Textarea
              id='reason'
              placeholder='Please provide a detailed reason for requesting this permission...'
              {...form.register('reason')}
              rows={4}
            />
            {form.formState.errors.reason && (
              <p className='text-sm text-red-600'>
                {form.formState.errors.reason.message}
              </p>
            )}
          </div>

          {/* Urgency and Expiration */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='urgency'>Urgency Level *</Label>
              <Select
                value={form.watch('urgency')}
                onValueChange={(value) =>
                  form.setValue('urgency', value as any)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='LOW'>Low</SelectItem>
                  <SelectItem value='NORMAL'>Normal</SelectItem>
                  <SelectItem value='HIGH'>High</SelectItem>
                  <SelectItem value='URGENT'>Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='expiresAt'>Expiration Date *</Label>
              <Input
                id='expiresAt'
                type='datetime-local'
                {...form.register('expiresAt')}
                min={new Date().toISOString().slice(0, 16)}
              />
              {form.formState.errors.expiresAt && (
                <p className='text-sm text-red-600'>
                  {form.formState.errors.expiresAt.message}
                </p>
              )}
            </div>
          </div>

          {/* Approvers Selection */}
          <div className='space-y-2'>
            <Label>Select Approvers *</Label>
            <div className='space-y-2'>
              {potentialApprovers.map((approver) => (
                <label
                  key={approver.id}
                  className='flex items-center space-x-2'
                >
                  <input
                    type='checkbox'
                    value={approver.id}
                    checked={form.watch('approvers').includes(approver.id)}
                    onChange={(e) => {
                      const currentApprovers = form.watch('approvers');
                      if (e.target.checked) {
                        form.setValue('approvers', [
                          ...currentApprovers,
                          approver.id,
                        ]);
                      } else {
                        form.setValue(
                          'approvers',
                          currentApprovers.filter((id) => id !== approver.id)
                        );
                      }
                    }}
                    className='rounded border-gray-300'
                  />
                  <div className='flex-1'>
                    <span className='font-medium'>{approver.name}</span>
                    <span className='text-sm text-muted-foreground ml-2'>
                      {approver.role} •{' '}
                      {approver.department?.name || 'No Department'}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            {form.formState.errors.approvers && (
              <p className='text-sm text-red-600'>
                {form.formState.errors.approvers.message}
              </p>
            )}
          </div>

          {/* Request Summary */}
          <div className='bg-blue-50 p-4 rounded-lg'>
            <h3 className='font-medium mb-2 flex items-center gap-2'>
              <Warning sx={{ fontSize: 16 }} />
              Request Summary
            </h3>
            <div className='space-y-2 text-sm'>
              <div className='flex items-center justify-between'>
                <span>Permission:</span>
                <Chip
                  label={form.watch('permission') || 'Not selected'}
                  variant='outlined'
                />
              </div>
              <div className='flex items-center justify-between'>
                <span>Urgency:</span>
                <Chip
                  label={`${getUrgencyIcon(form.watch('urgency'))} ${form.watch(
                    'urgency'
                  )}`}
                  className={getUrgencyColor(form.watch('urgency'))}
                />
              </div>
              <div className='flex items-center justify-between'>
                <span>Expires:</span>
                <span className='text-muted-foreground'>
                  {form.watch('expiresAt')
                    ? new Date(form.watch('expiresAt')).toLocaleString()
                    : 'Not set'}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span>Approvers:</span>
                <span className='text-muted-foreground'>
                  {form.watch('approvers').length} selected
                </span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className='flex justify-end space-x-3'>
            <Button
              type='button'
              variant='outline'
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting}
              className='min-w-[120px]'
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
