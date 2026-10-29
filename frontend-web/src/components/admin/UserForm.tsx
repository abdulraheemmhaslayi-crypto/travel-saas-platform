'use client';

import React, { useEffect, useState } from 'react';
import { User, KycStatus } from '@/types/auth';
import { ROLES, USER_TYPES } from '@/lib/constants';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, Shield, CheckCircle, XCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const userFormSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
  userType: z.enum(['PASSENGER', 'DRIVER', 'FLEET_OWNER', 'SUPPORT', 'ADMIN', 'SUPER_ADMIN']),
  isSuspended: z.boolean(),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  user?: User;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  onVerifyKyc?: (userId: string, status: 'VERIFIED' | 'REJECTED') => Promise<void>;
  onSuspend?: (userId: string) => Promise<void>;
  mode?: 'create' | 'edit' | 'view';
}

const UserForm: React.FC<UserFormProps> = ({
  user,
  isOpen,
  onClose,
  onSubmit,
  onVerifyKyc,
  onSuspend,
  mode = 'view',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: user
      ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          userType: user.userType,
          isSuspended: user.isSuspended,
        }
      : {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          role: 'USER',
          userType: 'PASSENGER',
          isSuspended: false,
        },
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        userType: user.userType,
        isSuspended: user.isSuspended,
      });
    }
  }, [user, reset]);

  const handleFormSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = Object.values(ROLES).map((role) => ({
    value: role,
    label: role.replace('_', ' '),
  }));

  const userTypeOptions = Object.values(USER_TYPES).map((type) => ({
    value: type,
    label: type.replace('_', ' '),
  }));

  const isEditable = mode === 'edit' || mode === 'create';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'create'
          ? 'Create User'
          : mode === 'edit'
          ? 'Edit User'
          : 'User Details'
      }
      size="lg"
      footer={
        isEditable ? (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(handleFormSubmit)} isLoading={isSubmitting}>
              {mode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          </div>
        ) : null
      }
    >
      <div className="grid grid-cols-1 gap-6">
        {user && (
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
            <Avatar
              src={user.profileImage}
              name={`${user.firstName} ${user.lastName}`}
              size="xl"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.isSuspended ? 'danger' : 'success'} size="sm">
                  {user.isSuspended ? 'Suspended' : 'Active'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              {...register('firstName')}
              error={errors.firstName?.message}
              disabled={!isEditable}
            />
            <Input
              label="Last Name"
              {...register('lastName')}
              error={errors.lastName?.message}
              disabled={!isEditable}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              disabled={!isEditable}
              leftIcon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="Phone"
              {...register('phone')}
              error={errors.phone?.message}
              disabled={!isEditable}
              leftIcon={<Phone className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Role"
              options={roleOptions}
              {...register('role')}
              error={errors.role?.message}
              disabled={!isEditable}
            />
            <Select
              label="User Type"
              options={userTypeOptions}
              {...register('userType')}
              error={errors.userType?.message}
              disabled={!isEditable}
            />
          </div>

          {isEditable && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="isSuspended"
                {...register('isSuspended')}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="isSuspended" className="text-sm text-gray-700">
                Suspend user account
              </label>
            </div>
          )}

          {!isEditable && user && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Created</p>
                <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Last Updated</p>
                <p className="font-medium">{new Date(user.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {user && !isEditable && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900">KYC Status</p>
                    <p className="text-sm text-gray-500">
                      Current status: <span className="font-medium">{user.kycStatus}</span>
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    user.kycStatus === 'VERIFIED'
                      ? 'success'
                      : user.kycStatus === 'REJECTED'
                      ? 'danger'
                      : user.kycStatus === 'SUBMITTED'
                      ? 'warning'
                      : 'default'
                  }
                >
                  {user.kycStatus}
                </Badge>
              </div>

              {user.kycStatus === 'SUBMITTED' && onVerifyKyc && (
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => onVerifyKyc(user.id, 'VERIFIED')}
                    leftIcon={<CheckCircle className="w-4 h-4" />}
                  >
                    Approve KYC
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => onVerifyKyc(user.id, 'REJECTED')}
                    leftIcon={<XCircle className="w-4 h-4" />}
                  >
                    Reject KYC
                  </Button>
                </div>
              )}

              {onSuspend && (
                <Button
                  variant={user.isSuspended ? 'secondary' : 'danger'}
                  className="w-full"
                  onClick={() => onSuspend(user.id)}
                >
                  {user.isSuspended ? 'Reactivate Account' : 'Suspend Account'}
                </Button>
              )}
            </div>
          )}
        </form>
      </div>
    </Modal>
  );
};

export default UserForm;
