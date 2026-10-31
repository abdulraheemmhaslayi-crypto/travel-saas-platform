'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileUpdateSchema, type ProfileUpdateFormData, kycSchema, type KycFormData } from '@/lib/validation';
import { useAuthStore } from '@/store/slices/authSlice';
import { useAppStore } from '@/store';
import apiClient from '@/lib/api';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Loading from '@/components/common/Loading';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Upload, 
  CheckCircle, 
  XCircle, 
  FileText,
  MapPin,
  Edit3,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { KycStatus } from '@/types/auth';
import { cn } from '@/lib/utils';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser } = useAuthStore();
  const { showToast } = useAppStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [isTabLoading, setIsTabLoading] = useState(false);

  const activeTab = searchParams ? searchParams.get('tab') || 'personal' : 'personal';

  useEffect(() => {
    setIsTabLoading(true);
    const timer = setTimeout(() => {
      setIsTabLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    router.push(`/dashboard/profile?tab=${tabId}`, { scroll: false });
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      pincode: user?.pincode || '',
      country: user?.country || '',
      emergencyContactName: user?.emergencyContactName || '',
      emergencyContactPhone: user?.emergencyContactPhone || '',
      profileImage: user?.profileImage || '',
    },
  });

  const kycForm = useForm<KycFormData>({
    resolver: zodResolver(kycSchema),
  });

  const [uploads, setUploads] = useState({
    documentFront: { progress: 0, status: 'idle', url: '', error: '', fileName: '' },
    documentBack: { progress: 0, status: 'idle', url: '', error: '', fileName: '' },
    selfie: { progress: 0, status: 'idle', url: '', error: '', fileName: '' },
  });

  useEffect(() => {
    kycForm.register('documentFront');
    kycForm.register('documentBack');
    kycForm.register('selfie');
  }, [kycForm]);

  const handleFileUpload = async (field: 'documentFront' | 'documentBack' | 'selfie', file: File) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setUploads(prev => ({
        ...prev,
        [field]: { ...prev[field], status: 'error', error: 'Only PDF, JPG, JPEG, and PNG are allowed' }
      }));
      showToast('Invalid file format. Only PDF, JPG, JPEG, and PNG are allowed.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploads(prev => ({
        ...prev,
        [field]: { ...prev[field], status: 'error', error: 'File size must be less than 5MB' }
      }));
      showToast('File size exceeds 5MB limit.', 'error');
      return;
    }

    setUploads(prev => ({
      ...prev,
      [field]: { progress: 0, status: 'uploading', url: '', error: '', fileName: file.name }
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.getClient().post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploads(prev => ({
            ...prev,
            [field]: { ...prev[field], progress: percentCompleted }
          }));
        },
      });

      const url = response.data.url;
      setUploads(prev => ({
        ...prev,
        [field]: { ...prev[field], status: 'success', url, progress: 100 }
      }));
      kycForm.setValue(field, url, { shouldValidate: true });
      showToast(`${field === 'selfie' ? 'Selfie' : field === 'documentFront' ? 'Front ID' : 'Back ID'} uploaded`, 'success');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Upload failed';
      setUploads(prev => ({
        ...prev,
        [field]: { ...prev[field], status: 'error', error: msg }
      }));
      showToast(`Upload failed: ${msg}`, 'error');
    }
  };

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
        country: user.country || '',
        emergencyContactName: user.emergencyContactName || '',
        emergencyContactPhone: user.emergencyContactPhone || '',
        profileImage: user.profileImage || '',
      });
    }
  }, [user, reset]);

  const onSubmitProfile = async (data: ProfileUpdateFormData) => {
    try {
      const response = await apiClient.updateProfile(data);
      setUser(response.data);
      showToast('Profile updated successfully', 'success');
      setIsEditing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update failed';
      showToast(message, 'error');
    }
  };

  const onSubmitKyc = async (data: KycFormData) => {
    try {
      await apiClient.submitKyc(data);
      showToast('KYC submitted for review', 'success');
      setShowKycModal(false);

      if (user) {
        setUser({
          ...user,
          kycStatus: 'SUBMITTED' as any,
          kycDocumentType: data.documentType,
          kycDocumentNumber: data.documentNumber,
          kycSubmittedAt: new Date() as any
        });
      }
      kycForm.reset();
      setUploads({
        documentFront: { progress: 0, status: 'idle', url: '', error: '', fileName: '' },
        documentBack: { progress: 0, status: 'idle', url: '', error: '', fileName: '' },
        selfie: { progress: 0, status: 'idle', url: '', error: '', fileName: '' },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'KYC submission failed';
      showToast(message, 'error');
    }
  };

  if (!user) {
    return <Loading fullScreen text="Loading profile..." />;
  }

  const kycStatus = (user?.kycStatus || 'PENDING') as KycStatus;

  // Real user documents list
  const userDocs = [];
  if (user.kycDocumentType || user.kycDocumentNumber) {
    userDocs.push({
      name: user.kycDocumentType === 'AADHAAR' 
        ? 'Aadhaar Card' 
        : user.kycDocumentType === 'DRIVERS_LICENSE' 
        ? "Driver's License" 
        : user.kycDocumentType === 'PASSPORT'
        ? 'Passport'
        : user.kycDocumentType || 'Government ID',
      number: user.kycDocumentNumber || 'N/A',
      type: user.kycDocumentType || 'ID',
      status: user.kycStatus || 'SUBMITTED',
      uploadedAt: user.kycSubmittedAt || user.updatedAt || new Date().toISOString()
    });
  }

  const fullAddress = [user.address, user.city, user.state, user.pincode, user.country]
    .filter(Boolean)
    .join(', ');

  const tabs = [
    { id: 'personal', label: 'Personal', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'kyc', label: 'KYC Status', icon: <Shield className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 w-full min-w-0 pb-28 md:pb-12">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            My Profile
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Manage your account and verification details
          </p>
        </div>

        {/* KYC Badge */}
        <div className="shrink-0">
          {kycStatus === 'VERIFIED' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              <span>Verified</span>
            </span>
          ) : kycStatus === 'SUBMITTED' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3 h-3 text-amber-600 animate-spin" />
              <span>In Review</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setShowKycModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 active:scale-95 transition-all"
            >
              <Shield className="w-3 h-3 text-blue-600" />
              <span>Verify KYC</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Profile Summary Card (Compact & Mobile-First) ─────────── */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <Avatar
            src={user.profileImage}
            name={`${user.firstName || ''} ${user.lastName || ''}`}
            size="lg"
            className="shrink-0 shadow-xs"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-gray-900 truncate">
                {user.firstName || 'User'} {user.lastName || ''}
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider shrink-0">
                {user.userType || 'PASSENGER'}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
            {user.phone && (
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">{user.phone}</p>
            )}
          </div>
        </div>

        {/* KYC Incomplete Notice (Only if pending) */}
        {kycStatus === 'PENDING' && (
          <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs text-gray-600 truncate">
                Identity verification is pending
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowKycModal(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 shrink-0"
            >
              Verify Now →
            </button>
          </div>
        )}
      </div>

      {/* ── Mobile-Optimized Tab Bar ───────────────────────────────── */}
      <div className="w-full min-w-0 overflow-x-auto pb-0.5 scrollbar-hide">
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/90 rounded-2xl w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content Panels ───────────────────────────────────────── */}
      {isTabLoading ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-gray-200/90">
          <Loading text="Loading..." />
        </div>
      ) : (
        <div>
          {/* TAB 1: PERSONAL DETAILS */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                  <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
                    Personal Details
                  </h3>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-200/80 active:scale-95 transition-all shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {!isEditing ? (
                  /* Clean Read-Only Data Rows (iOS / Uber Style) */
                  <div className="divide-y divide-gray-100 text-xs sm:text-sm">
                    <div className="py-2.5 flex items-start justify-between gap-3">
                      <span className="text-gray-500 font-medium">Full Name</span>
                      <span className="font-bold text-gray-900 text-right">
                        {user.firstName} {user.lastName || '—'}
                      </span>
                    </div>

                    <div className="py-2.5 flex items-start justify-between gap-3">
                      <span className="text-gray-500 font-medium">Email Address</span>
                      <span className="font-bold text-gray-900 text-right truncate">
                        {user.email}
                      </span>
                    </div>

                    <div className="py-2.5 flex items-start justify-between gap-3">
                      <span className="text-gray-500 font-medium">Phone Number</span>
                      <span className="font-bold text-gray-900 text-right font-mono">
                        {user.phone || 'Not provided'}
                      </span>
                    </div>

                    <div className="py-2.5 flex items-start justify-between gap-3">
                      <span className="text-gray-500 font-medium">Street Address</span>
                      <span className="font-bold text-gray-900 text-right max-w-xs break-words">
                        {fullAddress || 'Not provided'}
                      </span>
                    </div>

                    <div className="py-2.5 flex items-start justify-between gap-3">
                      <span className="text-gray-500 font-medium">Emergency Contact</span>
                      <span className="font-bold text-gray-900 text-right">
                        {user.emergencyContactName ? (
                          <span>{user.emergencyContactName} ({user.emergencyContactPhone || '—'})</span>
                        ) : (
                          'Not provided'
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Edit Form */
                  <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="First Name"
                        error={errors.firstName?.message}
                        {...register('firstName')}
                      />
                      <Input
                        label="Last Name"
                        error={errors.lastName?.message}
                        {...register('lastName')}
                      />
                      <Input
                        label="Phone Number"
                        type="tel"
                        error={errors.phone?.message}
                        {...register('phone')}
                      />
                      <Input
                        label="Email Address"
                        type="email"
                        disabled
                        value={user.email}
                      />
                    </div>

                    <div className="pt-2">
                      <p className="text-xs font-bold text-gray-700 mb-2">Address Details</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <Input
                            label="Street Address"
                            error={errors.address?.message}
                            {...register('address')}
                          />
                        </div>
                        <Input
                          label="City"
                          error={errors.city?.message}
                          {...register('city')}
                        />
                        <Input
                          label="State"
                          error={errors.state?.message}
                          {...register('state')}
                        />
                        <Input
                          label="Pincode"
                          error={errors.pincode?.message}
                          {...register('pincode')}
                        />
                        <Input
                          label="Country"
                          error={errors.country?.message}
                          {...register('country')}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-xs font-bold text-gray-700 mb-2">Emergency Contact</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Contact Name"
                          error={errors.emergencyContactName?.message}
                          {...register('emergencyContactName')}
                        />
                        <Input
                          label="Contact Phone"
                          error={errors.emergencyContactPhone?.message}
                          {...register('emergencyContactPhone')}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          reset();
                        }}
                        className="flex-1 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs active:scale-95 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
                      >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Account Metadata */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Account Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-semibold">User ID</p>
                    <p className="font-mono text-gray-900 font-bold truncate mt-0.5">{user.id.slice(0, 12)}...</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-semibold">Member Since</p>
                    <p className="font-bold text-gray-900 mt-0.5">
                      {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VERIFICATION DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                  <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
                    Verification Documents
                  </h3>
                  <span className="text-xs font-bold text-gray-400">
                    {userDocs.length} {userDocs.length === 1 ? 'file' : 'files'}
                  </span>
                </div>

                {userDocs.length === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
                      <FileText className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-gray-700">No documents uploaded</p>
                    <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                      Submit your identity document (Aadhaar, DL, or Passport) to verify your account.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowKycModal(true)}
                      className="mt-3 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs active:scale-95 transition-all shadow-xs"
                    >
                      Upload ID Document
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {userDocs.map((doc, idx) => (
                      <div
                        key={idx}
                        className="p-3 sm:p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-900 truncate">{doc.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">#{doc.number}</p>
                          </div>
                        </div>

                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 uppercase tracking-wide',
                            doc.status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          )}
                        >
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: KYC STATUS */}
          {activeTab === 'kyc' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0',
                      kycStatus === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : kycStatus === 'SUBMITTED'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {kycStatus === 'VERIFIED' ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : kycStatus === 'SUBMITTED' ? (
                      <Clock className="w-6 h-6 animate-spin" />
                    ) : (
                      <Shield className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
                      Status: {kycStatus}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      {kycStatus === 'VERIFIED'
                        ? 'Your identity is fully verified.'
                        : kycStatus === 'SUBMITTED'
                        ? 'Your documents are being reviewed (typically within 24 hours).'
                        : 'Identity verification is required for full account access.'}
                    </p>
                  </div>
                </div>

                {kycStatus === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => setShowKycModal(true)}
                    className="w-full mt-4 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs active:scale-95 transition-all shadow-xs"
                  >
                    Start Verification
                  </button>
                )}
              </div>

              {/* Compliance checklist */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
                <h4 className="text-xs font-bold text-gray-900 mb-3">Verification Checklist</h4>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-gray-50 flex items-center justify-between">
                    <span className="font-semibold text-gray-800">Phone Verification</span>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Completed
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-gray-50 flex items-center justify-between">
                    <span className="font-semibold text-gray-800">Email Verification</span>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Completed
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-gray-50 flex items-center justify-between">
                    <span className="font-semibold text-gray-800">Government ID Proof</span>
                    <span
                      className={cn(
                        'text-[10px] font-bold',
                        kycStatus === 'VERIFIED'
                          ? 'text-emerald-600'
                          : kycStatus === 'SUBMITTED'
                          ? 'text-amber-600'
                          : 'text-gray-400'
                      )}
                    >
                      {kycStatus === 'VERIFIED' ? 'Verified' : kycStatus === 'SUBMITTED' ? 'In Review' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── KYC Upload Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={showKycModal}
        onClose={() => {
          if (!kycForm.formState.isSubmitting) setShowKycModal(false);
        }}
        title="Submit Verification Document"
        size="sm"
      >
        <form onSubmit={kycForm.handleSubmit(onSubmitKyc)} className="space-y-3.5 pt-1">
          <Select
            label="ID Document Type"
            placeholder="Select document"
            options={[
              { value: 'AADHAAR', label: 'Aadhaar Card' },
              { value: 'DRIVERS_LICENSE', label: "Driver's License" },
              { value: 'PASSPORT', label: 'Passport' },
              { value: 'PAN', label: 'PAN Card' },
            ]}
            error={kycForm.formState.errors.documentType?.message}
            {...kycForm.register('documentType')}
            required
          />
          
          <Input
            label="Document Number"
            placeholder="e.g. XXXX-XXXX-1234"
            error={kycForm.formState.errors.documentNumber?.message}
            {...kycForm.register('documentNumber')}
            required
          />

          <div className="space-y-2.5 pt-1">
            {/* Front Document */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Document Front Copy <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                id="docFrontInput"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload('documentFront', file);
                }}
              />
              <div
                onClick={() => document.getElementById('docFrontInput')?.click()}
                className={cn(
                  'p-3 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all',
                  uploads.documentFront.status === 'success'
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-gray-200 hover:border-blue-400 bg-gray-50/50'
                )}
              >
                {uploads.documentFront.status === 'success' ? (
                  <p className="text-xs font-bold text-emerald-700 truncate">
                    ✓ {uploads.documentFront.fileName}
                  </p>
                ) : (
                  <p className="text-xs font-bold text-gray-600">
                    + Upload Front Copy (PDF/JPG/PNG)
                  </p>
                )}
              </div>
            </div>

            {/* Back Document */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Document Back Copy <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                id="docBackInput"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload('documentBack', file);
                }}
              />
              <div
                onClick={() => document.getElementById('docBackInput')?.click()}
                className={cn(
                  'p-3 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all',
                  uploads.documentBack.status === 'success'
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-gray-200 hover:border-blue-400 bg-gray-50/50'
                )}
              >
                {uploads.documentBack.status === 'success' ? (
                  <p className="text-xs font-bold text-emerald-700 truncate">
                    ✓ {uploads.documentBack.fileName}
                  </p>
                ) : (
                  <p className="text-xs font-bold text-gray-600">
                    + Upload Back Copy (PDF/JPG/PNG)
                  </p>
                )}
              </div>
            </div>

            {/* Selfie Photo */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Selfie Photo <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                id="selfieInput"
                className="hidden"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload('selfie', file);
                }}
              />
              <div
                onClick={() => document.getElementById('selfieInput')?.click()}
                className={cn(
                  'p-3 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all',
                  uploads.selfie.status === 'success'
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-gray-200 hover:border-blue-400 bg-gray-50/50'
                )}
              >
                {uploads.selfie.status === 'success' ? (
                  <p className="text-xs font-bold text-emerald-700 truncate">
                    ✓ {uploads.selfie.fileName}
                  </p>
                ) : (
                  <p className="text-xs font-bold text-gray-600">
                    + Upload Selfie Photo
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={kycForm.formState.isSubmitting}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm active:scale-[0.98] transition-all"
            >
              {kycForm.formState.isSubmitting ? 'Submitting...' : 'Submit Credentials'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<Loading text="Loading profile..." />}>
      <ProfileContent />
    </Suspense>
  );
}
