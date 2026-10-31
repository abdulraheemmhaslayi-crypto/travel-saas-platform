'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '@/lib/validation';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store';
import {
  MapPin,
  Mail,
  Phone,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Car,
  Users,
  Building2,
  Check,
} from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const { user, isAuthenticated, isInitializing, register: registerUser, getDashboardPath } = useAuth();
  const { showToast } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!isInitializing && isAuthenticated && user) {
      router.replace(getDashboardPath(user));
    }
  }, [isAuthenticated, user, isInitializing, router, getDashboardPath]);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userType: 'PASSENGER',
    },
    shouldUnregister: false,
  });

  const selectedUserType = watch('userType') || 'PASSENGER';
  const password = watch('password') || '';

  const roleCards = [
    {
      id: 'PASSENGER',
      title: 'Passenger',
      description: 'Search & book rides',
      icon: Users,
      badge: 'Popular',
    },
    {
      id: 'DRIVER',
      title: 'Driver',
      description: 'Offer rides & earn',
      icon: Car,
      badge: 'Earn 90%',
    },
    {
      id: 'FLEET_OWNER',
      title: 'Fleet Owner',
      description: 'Manage fleet & trips',
      icon: Building2,
      badge: 'Business',
    },
  ];

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

  // Password validation checklist checks
  const hasMinLength = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passedChecksCount = [hasMinLength, hasLower, hasUpper, hasNumber].filter(Boolean).length;

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Decorative background glow orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Floating back button to home */}
      <Link
        href="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-gray-200 shadow-xs hover:shadow-sm active:scale-95 transition-all"
      >
        <ArrowLeft className="w-4 h-4 text-gray-500" />
        <span>Back to search</span>
      </Link>

      <div className="max-w-[480px] w-full relative z-10 my-8">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-gray-150 shadow-2xl shadow-slate-200/60 p-6 sm:p-9 transition-all">
          {/* Brand header */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-block group active:scale-95 transition-transform mb-3">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-blue-500 flex items-center justify-center shadow-lg shadow-primary-500/25 mx-auto text-white group-hover:scale-105 transition-transform">
                <MapPin className="w-7 h-7" />
              </div>
            </Link>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Create your account
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Join thousands of travelers, drivers & fleet owners
            </p>
          </div>

          {/* Stepper Header */}
          <div className="flex items-center justify-center gap-3 mb-6 bg-slate-50 p-2 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= 1 ? 'bg-primary-600 text-white shadow-xs' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className={`text-xs font-semibold ${step >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                Account Details
              </span>
            </div>

            <div className={`w-8 h-0.5 rounded-full ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />

            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 2 ? 'bg-primary-600 text-white shadow-xs' : 'bg-gray-200 text-gray-500'
                }`}
              >
                2
              </div>
              <span className={`text-xs font-semibold ${step === 2 ? 'text-gray-900' : 'text-gray-400'}`}>
                Security
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 ? (
              <div className="space-y-4 animate-fadeIn">
                {/* Account Role Selector Cards */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    I want to join as:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {roleCards.map((role) => {
                      const Icon = role.icon;
                      const isSelected = selectedUserType === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setValue('userType', role.id as any)}
                          className={`relative p-3 rounded-2xl border text-left transition-all duration-150 flex flex-col items-center justify-center text-center group active:scale-95 ${
                            isSelected
                              ? 'border-primary-600 bg-primary-50/60 ring-2 ring-primary-500/20 shadow-xs'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-colors ${
                              isSelected ? 'bg-primary-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`text-xs font-bold block ${isSelected ? 'text-primary-700' : 'text-gray-800'}`}>
                            {role.title}
                          </span>
                          <span className="text-[10px] text-gray-400 mt-0.5 leading-tight line-clamp-1">
                            {role.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.userType && (
                    <p className="mt-1.5 text-xs font-medium text-danger-600">{errors.userType.message}</p>
                  )}
                </div>

                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="First Name"
                    placeholder="John"
                    leftIcon={<User className="w-4 h-4 text-gray-400" />}
                    error={errors.firstName?.message}
                    {...register('firstName')}
                  />
                  <Input
                    label="Last Name"
                    placeholder="Doe"
                    leftIcon={<User className="w-4 h-4 text-gray-400" />}
                    error={errors.lastName?.message}
                    {...register('lastName')}
                  />
                </div>

                {/* Email */}
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
                  error={errors.email?.message}
                  {...register('email')}
                />

                {/* Phone */}
                <Input
                  label="Phone number"
                  type="tel"
                  placeholder="+919876543210"
                  helperText="Include country code (e.g. +91)"
                  leftIcon={<Phone className="w-4 h-4 text-gray-400" />}
                  error={errors.phone?.message}
                  {...register('phone')}
                />

                {/* Next button */}
                <Button
                  type="button"
                  size="lg"
                  onClick={async () => {
                    const valid = await trigger(['firstName', 'lastName', 'email', 'phone', 'userType']);
                    if (valid) setStep(2);
                  }}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-bold text-sm sm:text-base shadow-md shadow-primary-500/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  <span>Continue to Security</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                {/* Password input */}
                <div className="relative">
                  <Input
                    label="Create Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    error={errors.password?.message}
                    {...register('password')}
                  />
                </div>

                {/* Confirm Password input */}
                <div className="relative">
                  <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />
                </div>

                {/* Password strength indicators */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-gray-150 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-600">Password strength:</span>
                    <span
                      className={`font-bold ${
                        passedChecksCount <= 1
                          ? 'text-red-500'
                          : passedChecksCount <= 3
                          ? 'text-amber-500'
                          : 'text-emerald-600'
                      }`}
                    >
                      {passedChecksCount === 0 && 'Enter password'}
                      {passedChecksCount === 1 && 'Too weak'}
                      {passedChecksCount === 2 && 'Fair'}
                      {passedChecksCount === 3 && 'Good'}
                      {passedChecksCount === 4 && 'Strong'}
                    </span>
                  </div>

                  <div className="flex gap-1.5 h-1.5">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`flex-1 rounded-full transition-all duration-200 ${
                          passedChecksCount >= level
                            ? passedChecksCount <= 1
                              ? 'bg-red-400'
                              : passedChecksCount <= 3
                              ? 'bg-amber-400'
                              : 'bg-emerald-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Checklist */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-gray-600">
                    <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>
                      <Check className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-600' : 'text-gray-300'}`} />
                      8+ characters
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>
                      <Check className={`w-3.5 h-3.5 ${hasUpper ? 'text-emerald-600' : 'text-gray-300'}`} />
                      1 uppercase letter
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>
                      <Check className={`w-3.5 h-3.5 ${hasLower ? 'text-emerald-600' : 'text-gray-300'}`} />
                      1 lowercase letter
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>
                      <Check className={`w-3.5 h-3.5 ${hasNumber ? 'text-emerald-600' : 'text-gray-300'}`} />
                      1 number digit
                    </span>
                  </div>
                </div>

                {/* Back & Submit buttons */}
                <div className="flex gap-2.5 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={() => setStep(1)}
                    className="flex-1 h-12 rounded-2xl font-bold border-gray-200"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    isLoading={isSubmitting}
                    className="flex-2 h-12 rounded-2xl bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-bold shadow-md shadow-primary-500/20 active:scale-[0.98] transition-transform"
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            )}
          </form>

          {/* Sign in prompt */}
          <div className="mt-6 pt-5 border-t border-gray-150 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-bold text-primary-600 hover:text-primary-700 transition-colors underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge & Legal terms */}
        <div className="mt-6 text-center space-y-2">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 bg-white/70 backdrop-blur-xs px-3 py-1 rounded-full border border-gray-200/60 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Identity protected • Verified community</span>
          </p>

          <p className="text-[11px] text-gray-400">
            By creating an account, you agree to our{' '}
            <Link href="/terms-of-service" className="text-gray-600 hover:underline">
              Terms of Service
            </Link>{' '}
            &{' '}
            <Link href="/privacy-policy" className="text-gray-600 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
