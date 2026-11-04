'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/validation';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
} from 'lucide-react';

export default function MobileLoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  const { user, isAuthenticated, isInitializing, login, getDashboardPath } = useAuth();
  const { showToast } = useAppStore();

  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [rememberMe, setRememberMe] = useState(true);

  // Form handling
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      phone: '',
      password: '',
    },
  });

  const emailValue = watch('email') || '';
  const phoneValue = watch('phone') || '';
  const isEmailValid = emailValue.includes('@') && emailValue.includes('.');
  const isPhoneValid = phoneValue.replace(/\D/g, '').length >= 10;

  // Redirect if already authenticated
  useEffect(() => {
    if (!isInitializing && isAuthenticated && user) {
      const target = returnUrl && returnUrl !== '/login' ? returnUrl : getDashboardPath(user);
      router.replace(target);
    }
  }, [isAuthenticated, user, isInitializing, returnUrl, router, getDashboardPath]);

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
      showToast('Welcome back to Kokan Travel!', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      showToast(message, 'error');
    }
  };

  const handleGoogleSignIn = () => {
    // In production or development with NextAuth/OAuth
    showToast('Redirecting to Google Secure Sign-in...', 'info');
    if (typeof window !== 'undefined') {
      window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent(returnUrl)}`;
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
    <div className="min-h-screen bg-[#F0F5FA] relative flex flex-col justify-between overflow-x-hidden select-none font-sans">
      {/* ── TOP HERO LANDSCAPE & BRAND LOGO ───────────────────────────── */}
      <div className="relative w-full h-[220px] sm:h-[240px] shrink-0 overflow-hidden">
        {/* Scenic Kokan Beach Landscape Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/images/kokan-mobile-header.jpg')`,
            backgroundPosition: 'center 35%',
          }}
        />

        {/* Subtle top gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/30 pointer-events-none" />

        {/* Back to Home / Search Button */}
        <Link
          href="/"
          className="absolute top-4 left-4 z-20 flex items-center gap-1.5 text-xs font-bold text-white bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>

        {/* Brand Logo in Top Center of Scenery */}
        <div className="absolute top-7 inset-x-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          <div className="flex items-center gap-2 drop-shadow-md">
            {/* Palm & Sun Emblem */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 relative shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Sun */}
                <circle cx="68" cy="38" r="22" fill="#F59E0B" />
                {/* Ocean Waves */}
                <path d="M 10 74 Q 35 60 60 74 T 100 70 L 100 86 Q 65 76 35 86 Z" fill="#0284C7" />
                <path d="M 15 82 Q 40 68 70 82 T 100 80 L 100 95 Q 65 85 25 95 Z" fill="#38BDF8" />
                {/* Palm Trunk */}
                <path d="M 45 74 Q 38 48 32 28 Q 30 23 34 20 Q 38 23 36 28 Q 42 48 48 74 Z" fill="#047857" />
                {/* Palm Fronds */}
                <path d="M 33 22 Q 15 13 5 26 Q 18 26 32 24 Z" fill="#10B981" />
                <path d="M 34 21 Q 22 3 36 0 Q 32 12 34 21 Z" fill="#059669" />
                <path d="M 35 22 Q 50 8 58 22 Q 46 20 35 23 Z" fill="#10B981" />
                <path d="M 33 24 Q 20 36 12 46 Q 24 38 33 26 Z" fill="#047857" />
                <path d="M 36 24 Q 52 33 60 43 Q 48 38 36 26 Z" fill="#059669" />
              </svg>
            </div>

            {/* Brand Title */}
            <div className="text-left">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none drop-shadow-sm">
                <span className="text-[#0B2545]">Kokan </span>
                <span className="text-[#0284C7]">Tour</span>
              </h1>
              <p className="text-[9px] sm:text-[10px] font-bold text-[#1E293B] tracking-wider mt-0.5 uppercase drop-shadow-2xs">
                Travel • Book • Explore
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN WHITE FLOATING CARD ──────────────────────────────────── */}
      <div className="relative z-10 -mt-7 sm:-mt-8 flex-1 max-w-md w-full mx-auto px-0 sm:px-4 flex flex-col justify-between">
        <div className="bg-white rounded-t-[32px] sm:rounded-3xl shadow-[0_-8px_35px_rgba(0,0,0,0.12)] border-t border-gray-100/80 px-5 sm:px-7 pt-4 pb-7 flex-1 flex flex-col justify-between">
          <div>
            {/* Top Center User Icon Badge */}
            <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] border border-[#DCE7FD] flex items-center justify-center text-[#2563EB] mx-auto mb-2 shadow-2xs">
              <User className="w-6 h-6 stroke-[2]" />
            </div>

            {/* Header Text */}
            <h2 className="text-[23px] sm:text-[25px] font-extrabold text-[#0F172A] text-center tracking-tight">
              Welcome Back!
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 text-center mt-1 mb-5">
              Sign in to manage your trips, bookings & wallet
            </p>

            {/* Segmented Switcher (Email / Phone) */}
            <div className="flex p-1 bg-[#F1F5F9] rounded-2xl mb-4 border border-gray-150/60">
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                  loginMethod === 'email'
                    ? 'bg-[#1D68F2] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                  loginMethod === 'phone'
                    ? 'bg-[#1D68F2] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Phone</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              {/* Email / Phone Field */}
              <div>
                <label className="text-xs font-bold text-[#0F172A] block mb-1">
                  {loginMethod === 'email' ? 'Email address' : 'Phone number'}
                </label>
                <div
                  className={`relative flex items-center bg-white border rounded-xl px-3.5 py-2.5 transition-all ${
                    errors.email || errors.phone
                      ? 'border-red-400 ring-2 ring-red-100'
                      : 'border-gray-200 focus-within:border-[#1D68F2] focus-within:ring-2 focus-within:ring-blue-100'
                  }`}
                >
                  {loginMethod === 'email' ? (
                    <Mail className="w-4.5 h-4.5 text-gray-400 mr-2.5 shrink-0" />
                  ) : (
                    <Phone className="w-4.5 h-4.5 text-gray-400 mr-2.5 shrink-0" />
                  )}

                  <input
                    type={loginMethod === 'email' ? 'email' : 'tel'}
                    placeholder={
                      loginMethod === 'email'
                        ? 'abdul.razzaque@quikro.com'
                        : '+91 98765 43210'
                    }
                    className="w-full text-sm font-medium text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
                    autoComplete={loginMethod === 'email' ? 'email' : 'tel'}
                    {...register(loginMethod === 'email' ? 'email' : 'phone')}
                  />

                  {/* Green validation checkmark when valid */}
                  {((loginMethod === 'email' && isEmailValid) ||
                    (loginMethod === 'phone' && isPhoneValid)) && (
                    <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0 stroke-[3]" />
                  )}
                </div>
                {loginMethod === 'email' && errors.email && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.email.message}</p>
                )}
                {loginMethod === 'phone' && errors.phone && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.phone.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="text-xs font-bold text-[#0F172A] block mb-1">
                  Password
                </label>
                <div
                  className={`relative flex items-center bg-white border rounded-xl px-3.5 py-2.5 transition-all ${
                    errors.password
                      ? 'border-red-400 ring-2 ring-red-100'
                      : 'border-gray-200 focus-within:border-[#1D68F2] focus-within:ring-2 focus-within:ring-blue-100'
                  }`}
                >
                  <Lock className="w-4.5 h-4.5 text-gray-400 mr-2.5 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    className="w-full text-sm font-medium text-gray-900 placeholder:text-gray-400 bg-transparent outline-none tracking-wider"
                    autoComplete="current-password"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4.5 h-4.5 text-gray-500" />
                    ) : (
                      <Eye className="w-4.5 h-4.5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1 pb-1">
                <label
                  htmlFor="mobile-remember-me"
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    id="mobile-remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded-md border-gray-300 text-[#1D68F2] focus:ring-[#1D68F2] cursor-pointer"
                  />
                  <span className="text-gray-700 font-semibold text-xs">Remember me</span>
                </label>

                <Link
                  href="/forgot-password"
                  className="font-bold text-[#1D68F2] hover:text-blue-700 transition-colors text-xs"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Primary Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 sm:h-12 bg-gradient-to-r from-[#1D68F2] to-[#2563EB] hover:from-blue-700 hover:to-blue-600 text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Divider "or continue with" */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-[11px] font-medium text-gray-400">
                  or continue with
                </span>
              </div>
            </div>

            {/* Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full h-11 sm:h-12 bg-white border border-gray-250 hover:bg-gray-50 active:scale-[0.99] text-gray-800 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-2xs"
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Footer Sign-up Link */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-600">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="font-bold text-[#1D68F2] hover:text-blue-700 hover:underline transition-colors ml-1"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Decorative Coastal Foliage / Palm Leaves */}
        <div className="relative w-full h-12 overflow-hidden pointer-events-none -mt-2">
          <div
            className="absolute inset-0 bg-cover bg-bottom opacity-90"
            style={{
              backgroundImage: `url('/images/kokan-mobile-footer.png')`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
