import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Chip } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Typography } from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  People,
  Security,
} from '@mui/icons-material';
import { Role } from '@/types/role';
import { useRoles } from '@/hooks/useRoles';
import { RoleForm } from './RoleForm';
import { RoleDetails } from './RoleDetails';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/context/ToastContext';

interface RoleListProps {
  onRefresh?: () => void;
}

export const RoleList: React.FC<RoleListProps> = ({ onRefresh }) => {
  const { showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const {
    roles,
    isLoading,
    error,
    createRole,
    updateRole,
    deleteRole,
    refetch,
  } = useRoles();

  const filteredRoles =
    roles?.filter(
      (role) =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleCreate = () => {
    setSelectedRole(null);
    setIsFormOpen(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsFormOpen(true);
  };

  const handleView = (role: Role) => {
    setSelectedRole(role);
    setIsDetailsOpen(true);
  };

  const handleDelete = (role: Role) => {
    setRoleToDelete(role);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;

    try {
      await deleteRole(roleToDelete.id);
      showSuccess('Role deleted successfully');
      refetch();
      onRefresh?.();
    } catch (error) {
      showError('Failed to delete role');
    } finally {
      setIsDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleFormSubmit = async (data: Partial<Role>) => {
    try {
      if (selectedRole) {
        await updateRole(selectedRole.id, data);
        showSuccess('Role updated successfully');
      } else {
        await createRole(data);
        showSuccess('Role created successfully');
      }
      setIsFormOpen(false);
      setSelectedRole(null);
      refetch();
      onRefresh?.();
    } catch (error) {
      showError(
        selectedRole ? 'Failed to update role' : 'Failed to create role'
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='flex items-center justify-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-red-600'>
            Error loading roles: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <Typography variant='h6' component='h2'>
              Roles & Permissions
            </Typography>
            <Button onClick={handleCreate} size='sm'>
              <Add sx={{ fontSize: 16, mr: 1 }} />
              Add Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex items-center space-x-2 mb-4'>
            <div className='relative flex-1'>
              <Search
                sx={{
                  position: 'absolute',
                  left: 8,
                  top: 10,
                  fontSize: 16,
                  color: 'text.secondary',
                }}
              />
              <Input
                placeholder='Search roles...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-8'
              />
            </div>
          </div>

          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Staff Count</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <Chip label={role.code} variant='outlined' />
                    </TableCell>
                    <TableCell className='font-medium'>{role.name}</TableCell>
                    <TableCell className='text-muted-foreground'>
                      {role.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <Security
                          sx={{ fontSize: 16, color: 'text.secondary' }}
                        />
                        <span className='text-sm'>
                          {Array.isArray(role.permissions)
                            ? role.permissions.length
                            : 0}{' '}
                          permissions
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={role.isActive ? 'Active' : 'Inactive'}
                        variant={role.isActive ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <People
                          sx={{ fontSize: 16, color: 'text.secondary' }}
                        />
                        <span>{role._count?.staffRoleAssignments || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end space-x-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleView(role)}
                        >
                          <Visibility sx={{ fontSize: 16 }} />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleEdit(role)}
                        >
                          <Edit sx={{ fontSize: 16 }} />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDelete(role)}
                          className='text-red-600 hover:text-red-700'
                        >
                          <Delete sx={{ fontSize: 16 }} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRoles.length === 0 && (
            <div className='text-center py-8 text-muted-foreground'>
              {searchTerm
                ? 'No roles found matching your search.'
                : 'No roles found.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Form Modal */}
      <RoleForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedRole(null);
        }}
        onSubmit={handleFormSubmit}
        role={selectedRole}
      />

      {/* Role Details Modal */}
      <RoleDetails
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedRole(null);
        }}
        role={selectedRole}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title='Delete Role'
        message={`Are you sure you want to delete "${roleToDelete?.name}"? This action cannot be undone.`}
        confirmText='Delete'
        cancelText='Cancel'
        variant='destructive'
      />
    </div>
  );
};
