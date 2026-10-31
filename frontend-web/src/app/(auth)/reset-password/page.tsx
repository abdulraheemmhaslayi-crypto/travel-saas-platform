'use client';

import React, { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validation';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import { MapPin, Lock, Eye, EyeOff, CheckCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { showToast } = useAppStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token || '',
    },
  });

  useEffect(() => {
    if (!token) {
      showToast('Invalid or expired reset link', 'error');
    }
  }, [token, showToast]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await apiClient.resetPassword(data);
      setIsSuccess(true);
      showToast('Password reset successful!', 'success');
      setTimeout(() => router.push('/login'), 2500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset password';
      showToast(message, 'error');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl border border-gray-150 p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid or Expired Link</h2>
          <p className="text-sm text-gray-500 mb-6">This password reset link is invalid or has expired.</p>
          <Link href="/forgot-password">
            <Button size="lg" className="w-full rounded-2xl h-12 font-bold">Request New Link</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Decorative background glow orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Floating back button to login */}
      <Link
        href="/login"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-gray-200 shadow-xs hover:shadow-sm active:scale-95 transition-all"
      >
        <ArrowLeft className="w-4 h-4 text-gray-500" />
        <span>Back to sign in</span>
      </Link>

      <div className="max-w-[420px] w-full relative z-10 my-8">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-gray-150 shadow-2xl shadow-slate-200/60 p-6 sm:p-9 transition-all">
          <div className="text-center mb-7">
            <Link href="/" className="inline-block group active:scale-95 transition-transform mb-3">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-blue-500 flex items-center justify-center shadow-lg shadow-primary-500/25 mx-auto text-white group-hover:scale-105 transition-transform">
                <MapPin className="w-7 h-7" />
              </div>
            </Link>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Set new password
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Enter and confirm your new secure password
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center py-2 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Password Updated!</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Your password has been reset successfully. Redirecting you to login...
                </p>
              </div>
              <Link href="/login" className="block pt-2">
                <Button variant="secondary" size="lg" className="w-full h-12 rounded-2xl font-bold">
                  Sign In Now
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input type="hidden" {...register('token')} />

              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
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
                  error={errors.newPassword?.message}
                  {...register('newPassword')}
                />
              </div>

              <div className="relative">
                <Input
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat your new password"
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

              <Button
                type="submit"
                size="lg"
                isLoading={isSubmitting}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-bold text-sm sm:text-base shadow-md shadow-primary-500/25 active:scale-[0.98] transition-transform mt-2"
              >
                Reset Password
              </Button>
            </form>
          )}
        </div>

        {/* Security badge */}
        <div className="mt-6 text-center">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 bg-white/70 backdrop-blur-xs px-3 py-1 rounded-full border border-gray-200/60 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit SSL encrypted</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <p className="text-gray-500 font-medium">Loading form...</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
