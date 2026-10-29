'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/validation';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store';
import { MapPin, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  const { login } = useAuth();
  const { showToast } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
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
      });
      showToast('Welcome back!', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      showToast(message, 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <MapPin className="w-8 h-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900"> T</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600">
            Don't have an account?
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Sign up
            </Link>
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Login Method Toggle */}
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  loginMethod === 'email'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  loginMethod === 'phone'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Phone
              </button>
            </div>

            {loginMethod === 'email' ? (
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />
            ) : (
              <Input
                label="Phone number"
                type="tel"
                placeholder="+1234567890"
                leftIcon={<Phone className="w-4 h-4" />}
                error={errors.phone?.message}
                {...register('phone')}
              />
            )}

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Sign In
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-gray-500">
          By signing in, you agree to our{' '}
          <Link href="/terms-of-service" className="underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy-policy" className="underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading login form...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}