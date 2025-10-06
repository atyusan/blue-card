import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Chip } from '@/components/ui/badge';
import { Role } from '@/types/role';
import { Close, Add } from '@mui/icons-material';

const roleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code must be at most 20 characters'),
  description: z.string().optional(),
  permissions: z
    .array(z.string())
    .min(1, 'At least one permission is required'),
  isActive: z.boolean().default(true),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Role>) => Promise<void>;
  role?: Role | null;
}

// Common permission groups
const PERMISSION_GROUPS = {
  'Patient Management': [
    'view_patients',
    'edit_patients',
    'create_patients',
    'delete_patients',
  ],
  Appointments: [
    'view_appointments',
    'edit_appointments',
    'create_appointments',
    'delete_appointments',
    'cancel_appointments',
    'reschedule_appointments',
    'manage_appointment_waitlist',
  ],
  'Provider Availability': [
    'manage_provider_availability',
    'view_provider_availability',
    'manage_provider_schedules',
    'manage_provider_time_off',
  ],
  'Appointment Slots': [
    'manage_appointment_slots',
    'view_appointment_slots',
    'delete_appointment_slots',
  ],
  'Billing & Payments': [
    'view_billing',
    'edit_billing',
    'create_billing',
    'view_payments',
    'edit_payments',
    'process_payments',
  ],
  'Lab & Tests': [
    'view_lab_orders',
    'create_lab_orders',
    'manage_lab_tests',
    'view_lab_results',
  ],
  Pharmacy: [
    'view_prescriptions',
    'create_prescriptions',
    'manage_medications',
    'dispense_medications',
  ],
  Surgery: [
    'view_surgeries',
    'schedule_surgeries',
    'manage_surgical_procedures',
  ],
  'Cash Management': [
    'manage_cash_transactions',
    'approve_cash_requests',
    'view_cash_reports',
  ],
  'System Administration': [
    'manage_users',
    'manage_roles',
    'manage_departments',
    'view_audit_logs',
    'system_configuration',
  ],
};

export const RoleForm: React.FC<RoleFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  role,
}) => {
  const [customPermission, setCustomPermission] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    Array.isArray(role?.permissions) ? role.permissions : []
  );

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name || '',
      code: role?.code || '',
      description: role?.description || '',
      permissions: Array.isArray(role?.permissions) ? role.permissions : [],
      isActive: role?.isActive ?? true,
    },
  });

  const isSubmitting = form.formState.isSubmitting;
  const isEdit = !!role;

  const handlePermissionToggle = (permission: string) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permission)) {
        return prev.filter((p) => p !== permission);
      } else {
        return [...prev, permission];
      }
    });
  };

  const handleAddCustomPermission = () => {
    if (
      customPermission.trim() &&
      !selectedPermissions.includes(customPermission.trim())
    ) {
      setSelectedPermissions((prev) => [...prev, customPermission.trim()]);
      setCustomPermission('');
    }
  };

  const handleRemovePermission = (permission: string) => {
    setSelectedPermissions((prev) => prev.filter((p) => p !== permission));
  };

  const handleSubmit = async (data: RoleFormData) => {
    try {
      const formData = {
        ...data,
        permissions: selectedPermissions,
      };
      await onSubmit(formData);
      setSelectedPermissions([]);
      setCustomPermission('');
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedPermissions([]);
    setCustomPermission('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[700px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Role' : 'Create New Role'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-4'
          >
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter role name'
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='code'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter role code (e.g., DOCTOR, NURSE)'
                        {...field}
                        disabled={isSubmitting}
                        className='uppercase'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Enter role description'
                      {...field}
                      disabled={isSubmitting}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Permissions Section */}
            <div className='space-y-4'>
              <div>
                <FormLabel className='text-base'>Permissions *</FormLabel>
                <div className='text-sm text-muted-foreground mb-3'>
                  Select the permissions this role should have
                </div>
              </div>

              {/* Permission Groups */}
              <div className='space-y-4'>
                {Object.entries(PERMISSION_GROUPS).map(
                  ([groupName, permissions]) => (
                    <div key={groupName} className='border rounded-lg p-4'>
                      <h4 className='font-medium mb-3'>{groupName}</h4>
                      <div className='grid grid-cols-2 gap-2'>
                        {permissions.map((permission) => (
                          <label
                            key={permission}
                            className='flex items-center space-x-2'
                          >
                            <input
                              type='checkbox'
                              checked={selectedPermissions.includes(permission)}
                              onChange={() =>
                                handlePermissionToggle(permission)
                              }
                              className='rounded border-gray-300'
                            />
                            <span className='text-sm'>
                              {permission.replace(/_/g, ' ')}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Custom Permission Input */}
              <div className='flex space-x-2'>
                <Input
                  placeholder='Add custom permission (e.g., custom_feature)'
                  value={customPermission}
                  onChange={(e) => setCustomPermission(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === 'Enter' && handleAddCustomPermission()
                  }
                  disabled={isSubmitting}
                />
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleAddCustomPermission}
                  disabled={!customPermission.trim() || isSubmitting}
                >
                  <Add sx={{ fontSize: 16 }} />
                </Button>
              </div>

              {/* Selected Permissions Display */}
              {selectedPermissions.length > 0 && (
                <div>
                  <FormLabel className='text-sm font-medium'>
                    Selected Permissions:
                  </FormLabel>
                  <div className='flex flex-wrap gap-2 mt-2'>
                    {selectedPermissions.map((permission) => (
                      <Chip
                        key={permission}
                        label={permission}
                        variant='outlined'
                        onDelete={() => handleRemovePermission(permission)}
                        className='flex items-center gap-1'
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name='isActive'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>Active Status</FormLabel>
                    <div className='text-sm text-muted-foreground'>
                      Enable or disable this role
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className='flex justify-end space-x-2 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isSubmitting || selectedPermissions.length === 0}
              >
                {isSubmitting
                  ? 'Saving...'
                  : isEdit
                  ? 'Update Role'
                  : 'Create Role'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
