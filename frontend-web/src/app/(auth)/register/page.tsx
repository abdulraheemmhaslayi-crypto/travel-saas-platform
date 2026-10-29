'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '@/lib/validation';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store';
import { USER_TYPES } from '@/lib/constants';
import { MapPin, Mail, Phone, Lock, User, Eye, EyeOff } from 'lucide-react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const { showToast } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    shouldUnregister: false,
  });

  // Only expose allowed public user types
  const allowedUserTypes = ['PASSENGER', 'DRIVER', 'FLEET_OWNER'];
  const userTypeOptions = Object.values(USER_TYPES)
    .filter((t) => allowedUserTypes.includes(t))
    .map((type) => ({
      value: type,
      label: type.replace('_', ' '),
    }));

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...registerData } = data as any;

      const userTypeMap: Record<string, string> = {
        PASSENGER: 'passenger',
        DRIVER: 'driver',
        FLEET_OWNER: 'vehicle_owner',
        ADMIN: 'admin',
        SUPER_ADMIN: 'super_admin',
        SUPPORT: 'support',
      };

      const roleNameMap: Record<string, string> = {
        SUPER_ADMIN: 'super_admin',
        ADMIN: 'admin',
      };

      registerData.userType = userTypeMap[registerData.userType] || registerData.userType;

      // Client-side guard: disallow attempts to register as admin/super_admin
      if (registerData.userType === 'admin' || registerData.userType === 'super_admin') {
        showToast('Registration as admin is not allowed', 'error');
        return;
      }

      await registerUser(registerData);
      showToast('Account created successfully!', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      showToast(message, 'error');
    }
  };

  const password = watch('password');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <MapPin className="w-8 h-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">TravelFlow</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-500'
                  }`}
              >
                {s}
              </div>
              {s < 2 && <div className="w-12 h-0.5 bg-gray-200 mx-2" />}
            </React.Fragment>
          ))}
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {step === 1 ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    placeholder="John"
                    leftIcon={<User className="w-4 h-4" />}
                    error={errors.firstName?.message}
                    {...register('firstName')}
                  />
                  <Input
                    label="Last Name"
                    placeholder="Doe"
                    leftIcon={<User className="w-4 h-4" />}
                    error={errors.lastName?.message}
                    {...register('lastName')}
                  />
                </div>

                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Input
                  label="Phone"
                  type="tel"
                  placeholder="+1234567890"
                  leftIcon={<Phone className="w-4 h-4" />}
                  error={errors.phone?.message}
                  {...register('phone')}
                />

                <Select
                  label="I am a"
                  options={userTypeOptions}
                  error={errors.userType?.message}
                  {...register('userType')}
                />

                <Button
                  type="button"
                  onClick={async () => {
                    const valid = await trigger(['firstName', 'lastName', 'email', 'phone', 'userType']);
                    if (valid) setStep(2);
                  }}
                  className="w-full"
                >
                  Continue
                </Button>
              </>
            ) : (
              <>
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button type="button" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    error={errors.password?.message}
                    {...register('password')}
                  />
                </div>

                <div className="relative">
                  <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />
                </div>

                {/* Password strength indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full ${password.length >= level * 2
                            ? level <= 2
                              ? 'bg-red-400'
                              : level <= 3
                                ? 'bg-yellow-400'
                                : 'bg-green-400'
                            : 'bg-gray-200'
                            }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      {password.length < 6
                        ? 'Too weak'
                        : password.length < 8
                          ? 'Weak'
                          : password.length < 10
                            ? 'Good'
                            : 'Strong'}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="flex-1"
                  >
                    Create Account
                  </Button>
                </div>
              </>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}