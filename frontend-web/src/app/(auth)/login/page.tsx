'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/validation';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store';
import {
  MapPin,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  const { user, isAuthenticated, isInitializing, login, getDashboardPath } = useAuth();
  const { showToast } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [rememberMe, setRememberMe] = useState(true);

  // If already authenticated, redirect straight to dashboard
  useEffect(() => {
    if (!isInitializing && isAuthenticated && user) {
      const target = returnUrl && returnUrl !== '/login' ? returnUrl : getDashboardPath(user);
      router.replace(target);
    }
  }, [isAuthenticated, user, isInitializing, returnUrl, router, getDashboardPath]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const identifier = loginMethod === 'email' ? data.email : data.phone;
      if (!identifier) {
        showToast(`Please enter your ${loginMethod}`, 'error');
        return;
      }

      await login({
        email: loginMethod === 'email' ? identifier : undefined,
        phone: loginMethod === 'phone' ? identifier : undefined,
        password: data.password,
        rememberMe,
      });
      showToast('Welcome back!', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      showToast(message, 'error');
    }
  };

  if (!isInitializing && isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-600 font-medium animate-pulse">Already signed in. Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Decorative background glow orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Floating back button to home/search */}
      <Link
        href="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-gray-200 shadow-xs hover:shadow-sm active:scale-95 transition-all"
      >
        <ArrowLeft className="w-4 h-4 text-gray-500" />
        <span>Back to search</span>
      </Link>

      <div className="max-w-[420px] w-full relative z-10 my-8">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-gray-150 shadow-2xl shadow-slate-200/60 p-6 sm:p-9 transition-all">
          {/* Brand header */}
          <div className="text-center mb-7">
            <Link href="/" className="inline-block group active:scale-95 transition-transform mb-3">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-blue-500 flex items-center justify-center shadow-lg shadow-primary-500/25 mx-auto text-white group-hover:scale-105 transition-transform">
                <MapPin className="w-7 h-7" />
              </div>
            </Link>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Welcome back
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Sign in to manage your trips, bookings & wallet
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Login Method Segmented Switcher */}
            <div className="flex p-1 bg-gray-100 rounded-2xl border border-gray-200/60">
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                  loginMethod === 'email'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                  loginMethod === 'phone'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                Phone
              </button>
            </div>

            {/* Input based on method */}
            {loginMethod === 'email' ? (
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
                error={errors.email?.message}
                {...register('email')}
              />
            ) : (
              <Input
                label="Phone number"
                type="tel"
                placeholder="+919876543210"
                helperText="Include country code (e.g. +91)"
                leftIcon={<Phone className="w-4 h-4 text-gray-400" />}
                error={errors.phone?.message}
                {...register('phone')}
              />
            )}

            {/* Password input */}
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
              <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded-md border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <span className="text-gray-700 font-medium">Remember me</span>
              </label>

              <Link
                href="/forgot-password"
                className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-bold text-sm sm:text-base shadow-md shadow-primary-500/25 active:scale-[0.98] transition-transform"
            >
              Sign In
            </Button>
          </form>

          {/* Sign up prompt */}
          <div className="mt-6 pt-5 border-t border-gray-150 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="font-bold text-primary-600 hover:text-primary-700 transition-colors underline-offset-4 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge & Legal terms */}
        <div className="mt-6 text-center space-y-2">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 bg-white/70 backdrop-blur-xs px-3 py-1 rounded-full border border-gray-200/60 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit SSL encrypted • Fast & secure login</span>
          </p>

          <p className="text-[11px] text-gray-400">
            By signing in, you agree to our{' '}
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <p className="text-gray-500 font-medium">Loading login form...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
