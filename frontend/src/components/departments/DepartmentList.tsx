import React, { useState, useEffect } from 'react';
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
import { Add, Search, Edit, Delete, Visibility } from '@mui/icons-material';
import { Department } from '@/types/department';
import { useDepartments } from '@/hooks/useDepartments';
import { DepartmentForm } from './DepartmentForm';
import { DepartmentDetails } from './DepartmentDetails';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/context/ToastContext';

interface DepartmentListProps {
  onRefresh?: () => void;
}

export const DepartmentList: React.FC<DepartmentListProps> = ({
  onRefresh,
}) => {
  const { showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] =
    useState<Department | null>(null);

  const {
    departments,
    isLoading,
    error,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    refetch,
  } = useDepartments();

  const filteredDepartments =
    departments?.filter(
      (dept) =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleCreate = () => {
    setSelectedDepartment(null);
    setIsFormOpen(true);
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setIsFormOpen(true);
  };

  const handleView = (department: Department) => {
    setSelectedDepartment(department);
    setIsDetailsOpen(true);
  };

  const handleDelete = (department: Department) => {
    setDepartmentToDelete(department);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!departmentToDelete) return;

    try {
      await deleteDepartment(departmentToDelete.id);
      showSuccess('Department deleted successfully');
      refetch();
      onRefresh?.();
    } catch (error) {
      showError('Failed to delete department');
    } finally {
      setIsDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    }
  };

  const handleFormSubmit = async (data: Partial<Department>) => {
    try {
      if (selectedDepartment) {
        await updateDepartment(selectedDepartment.id, data);
        showSuccess('Department updated successfully');
      } else {
        await createDepartment(data);
        showSuccess('Department created successfully');
      }
      setIsFormOpen(false);
      setSelectedDepartment(null);
      refetch();
      onRefresh?.();
    } catch (error) {
      showError(
        selectedDepartment
          ? 'Failed to update department'
          : 'Failed to create department'
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
            Error loading departments: {error.message}
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
              Departments
            </Typography>
            <Button onClick={handleCreate} size='sm'>
              <Add sx={{ fontSize: 16, mr: 1 }} />
              Add Department
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
                placeholder='Search departments...'
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
                  <TableHead>Status</TableHead>
                  <TableHead>Staff Count</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell>
                      <Chip label={department.code} variant='outlined' />
                    </TableCell>
                    <TableCell className='font-medium'>
                      {department.name}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {department.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={department.isActive ? 'Active' : 'Inactive'}
                        variant={department.isActive ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      {department._count?.staffMembers || 0}
                    </TableCell>
                    <TableCell>{department._count?.services || 0}</TableCell>
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end space-x-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleView(department)}
                        >
                          <Visibility sx={{ fontSize: 16 }} />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleEdit(department)}
                        >
                          <Edit sx={{ fontSize: 16 }} />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDelete(department)}
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

          {filteredDepartments.length === 0 && (
            <div className='text-center py-8 text-muted-foreground'>
              {searchTerm
                ? 'No departments found matching your search.'
                : 'No departments found.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Department Form Modal */}
      <DepartmentForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedDepartment(null);
        }}
        onSubmit={handleFormSubmit}
        department={selectedDepartment}
      />

      {/* Department Details Modal */}
      <DepartmentDetails
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedDepartment(null);
        }}
        department={selectedDepartment}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title='Delete Department'
        message={`Are you sure you want to delete "${departmentToDelete?.name}"? This action cannot be undone.`}
        confirmText='Delete'
        cancelText='Cancel'
        variant='destructive'
      />
    </div>
  );
};
