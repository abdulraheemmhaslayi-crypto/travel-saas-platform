'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validation';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import { MapPin, Mail, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const { showToast } = useAppStore();
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await apiClient.forgotPassword(data);
      setIsSubmitted(true);
      showToast('Password reset link sent to your email', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset link';
      showToast(message, 'error');
    }
  };

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
              Reset your password
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Enter your email and we&apos;ll send you a recovery link
            </p>
          </div>

          {isSubmitted ? (
            <div className="text-center py-2 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Check your email</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  We&apos;ve sent a password reset link to your email address. Please follow the instructions to reset your password.
                </p>
              </div>
              <Link href="/login" className="block pt-2">
                <Button variant="secondary" size="lg" className="w-full h-12 rounded-2xl font-bold">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Button
                type="submit"
                size="lg"
                isLoading={isSubmitting}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-bold text-sm sm:text-base shadow-md shadow-primary-500/25 active:scale-[0.98] transition-transform"
              >
                Send Reset Link
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary-600 hover:text-primary-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Remember your password? Sign in
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Security badge */}
        <div className="mt-6 text-center">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 bg-white/70 backdrop-blur-xs px-3 py-1 rounded-full border border-gray-200/60 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure account recovery</span>
          </p>
        </div>
      </div>
    </div>
  );
}
