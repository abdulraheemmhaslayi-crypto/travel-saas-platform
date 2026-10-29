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
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
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
  FileText
} from 'lucide-react';
import { KycStatus } from '@/types/auth';

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
    }, 400); // 400ms transition loader
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
      showToast(`${field === 'selfie' ? 'Selfie' : field === 'documentFront' ? 'Front ID' : 'Back ID'} uploaded successfully`, 'success');
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

      // Update user in global store dynamically to show actual status!
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

  const kycStatusConfig: Record<KycStatus, { color: string; icon: React.ReactNode }> = {
    PENDING: { color: 'bg-gray-100 text-gray-800', icon: <Shield className="w-4 h-4 text-gray-500" /> },
    SUBMITTED: { color: 'bg-yellow-100 text-yellow-800', icon: <Upload className="w-4 h-4 text-yellow-600 animate-bounce" /> },
    VERIFIED: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4 text-green-600" /> },
    REJECTED: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4 text-red-600" /> },
  };

  const kycKey = (user?.kycStatus || 'PENDING') as KycStatus;
  const kycConfig = kycStatusConfig[kycKey] ?? kycStatusConfig.PENDING;

  // Build user documents list dynamically from actual user KYC properties
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

  const tabs = [
    { id: 'personal', label: 'Personal Details', icon: <User className="w-4 h-4" /> },
    { id: 'documents', label: 'Verification Documents', icon: <FileText className="w-4 h-4" /> },
    { id: 'kyc', label: 'KYC Status', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Management</h1>
        <p className="text-gray-600 mt-1">Manage profile information, submit compliance papers, and check verification statuses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <div className="p-6 text-center">
              <Avatar
                src={user.profileImage}
                name={`${user.firstName} ${user.lastName}`}
                size="xl"
                className="mx-auto mb-4"
              />
              <h2 className="text-xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-500 text-sm truncate">{user.email}</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Badge variant="outline">{user.userType}</Badge>
                <Badge variant="info">{user.role}</Badge>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold ${kycConfig.color}`}>
                  {kycConfig.icon}
                  <span>KYC: {user.kycStatus ?? 'PENDING'}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* KYC Action Box */}
          {user.kycStatus === 'PENDING' && (
            <Card className="bg-indigo-50/30 border-indigo-100">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-primary-600 shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Complete KYC Verification</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Unlock wallet withdrawals, higher booking limits, and full trip access by verifying your identity documents.
                    </p>
                    <Button
                      size="sm"
                      className="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white font-medium"
                      onClick={() => setShowKycModal(true)}
                    >
                      Submit ID Proof
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Tabbed Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tab Selector Headers */}
          <div className="bg-white rounded-xl border border-gray-100 p-1.5 shadow-sm flex gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-150
                    ${isActive 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
                  `}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panels */}
          {isTabLoading ? (
            <Loading text={`Loading ${activeTab}...`} />
          ) : (
            <div className="animate-fadeIn">
              
              {/* TAB 1: PERSONAL INFORMATION */}
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  <Card>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                        {!isEditing && (
                          <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                            Edit Profile
                          </Button>
                        )}
                      </div>

                      <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            label="First Name"
                            disabled={!isEditing}
                            leftIcon={<User className="w-4 h-4 text-gray-400" />}
                            error={errors.firstName?.message}
                            {...register('firstName')}
                          />
                          <Input
                            label="Last Name"
                            disabled={!isEditing}
                            leftIcon={<User className="w-4 h-4 text-gray-400" />}
                            error={errors.lastName?.message}
                            {...register('lastName')}
                          />
                          <Input
                            label="Email Address"
                            type="email"
                            disabled
                            leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
                            value={user.email}
                          />
                          <Input
                            label="Phone Number"
                            disabled={!isEditing}
                            leftIcon={<Phone className="w-4 h-4 text-gray-400" />}
                            error={errors.phone?.message}
                            {...register('phone')}
                          />
                          <div className="sm:col-span-2">
                            <Input
                              label="Profile Image URL"
                              disabled={!isEditing}
                              error={errors.profileImage?.message}
                              {...register('profileImage')}
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Street Address</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                              <Input
                                label="Street Address"
                                disabled={!isEditing}
                                error={errors.address?.message}
                                {...register('address')}
                              />
                            </div>
                            <Input
                              label="City"
                              disabled={!isEditing}
                              error={errors.city?.message}
                              {...register('city')}
                            />
                            <Input
                              label="State"
                              disabled={!isEditing}
                              error={errors.state?.message}
                              {...register('state')}
                            />
                            <Input
                              label="Pincode"
                              disabled={!isEditing}
                              error={errors.pincode?.message}
                              {...register('pincode')}
                            />
                            <Input
                              label="Country"
                              disabled={!isEditing}
                              error={errors.country?.message}
                              {...register('country')}
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Emergency Contact</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                              label="Contact Person Name"
                              disabled={!isEditing}
                              leftIcon={<User className="w-4 h-4 text-gray-400" />}
                              error={errors.emergencyContactName?.message}
                              {...register('emergencyContactName')}
                            />
                            <Input
                              label="Emergency Contact Phone"
                              disabled={!isEditing}
                              leftIcon={<Phone className="w-4 h-4 text-gray-400" />}
                              error={errors.emergencyContactPhone?.message}
                              {...register('emergencyContactPhone')}
                            />
                          </div>
                        </div>

                        {isEditing && (
                          <div className="flex gap-3 pt-4">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                setIsEditing(false);
                                reset();
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" isLoading={isSubmitting}>
                              Save Changes
                            </Button>
                          </div>
                        )}
                      </form>
                    </div>
                  </Card>

                  {/* Account Metadata Card */}
                  <Card>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-500 font-medium text-xs uppercase tracking-wider">Unique User ID</p>
                          <p className="font-mono text-gray-900 mt-1">{user.id}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-500 font-medium text-xs uppercase tracking-wider">Account Role Type</p>
                          <p className="font-semibold text-gray-900 mt-1 capitalize">{user.userType}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-500 font-medium text-xs uppercase tracking-wider">Registration Date</p>
                          <p className="font-semibold text-gray-900 mt-1">
                            {new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-500 font-medium text-xs uppercase tracking-wider">Last Sync Date</p>
                          <p className="font-semibold text-gray-900 mt-1">
                            {new Date(user.updatedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* TAB 2: VERIFICATION DOCUMENTS PANEL */}
              {activeTab === 'documents' && (
                <div className="space-y-6">
                  {/* Documents List */}
                  <Card>
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">Submitted Documents Checklist</h3>
                      <Badge variant="outline">{userDocs.length} Active Files</Badge>
                    </div>
                    {userDocs.length === 0 ? (
                      <div className="p-12 text-center text-gray-500 space-y-2">
                        <FileText className="w-10 h-10 text-gray-300 mx-auto" />
                        <p className="font-semibold text-gray-700">No verification documents uploaded</p>
                        <p className="text-xs max-w-sm mx-auto">Please submit your identity details below to complete your profile verification checklist.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 bg-white">
                        {userDocs.map((doc, idx) => (
                          <div key={idx} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-gray-50/30 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="p-2.5 bg-indigo-50 rounded-xl">
                                <FileText className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{doc.name}</h4>
                                <p className="font-mono text-xs text-gray-500 mt-0.5">ID: {doc.number}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Submitted on: {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <div>
                              <Badge variant={doc.status === 'VERIFIED' ? 'success' : doc.status === 'SUBMITTED' ? 'warning' : 'danger'}>
                                {doc.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* KYC submit card inline if not verified */}
                  {user.kycStatus !== 'VERIFIED' && (
                    <Card className="p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border-indigo-100">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">Upload Verification Papers</h3>
                      <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                        To match with passengers/rides and handle online billing, verify your government ID.
                      </p>
                      <Button 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => setShowKycModal(true)}
                      >
                        <Upload className="w-4 h-4 mr-1.5" />
                        Submit Verification Document
                      </Button>
                    </Card>
                  )}
                </div>
              )}

              {/* TAB 3: KYC STATUS DETAILS PANEL */}
              {activeTab === 'kyc' && (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <Card className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                        user.kycStatus === 'VERIFIED' 
                          ? 'bg-green-100 text-green-700' 
                          : user.kycStatus === 'SUBMITTED' 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.kycStatus === 'VERIFIED' ? (
                          <CheckCircle className="w-8 h-8" />
                        ) : user.kycStatus === 'SUBMITTED' ? (
                          <Upload className="w-8 h-8 animate-bounce" />
                        ) : (
                          <Shield className="w-8 h-8" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          KYC Status: {user.kycStatus || 'NOT VERIFIED'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {user.kycStatus === 'VERIFIED' 
                            ? 'Your account is fully compliant. All matching and payments features are available.'
                            : user.kycStatus === 'SUBMITTED'
                            ? 'Your papers are under verification. This typically takes between 12-24 hours.'
                            : 'Identity validation is required. Complete verification to activate ride matching.'}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Verification Criteria Checklist */}
                  <Card>
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h3 className="font-bold text-gray-900">Compliance Checklist</h3>
                    </div>
                    <div className="divide-y divide-gray-100 bg-white text-sm text-gray-600">
                      <div className="p-4 flex items-center justify-between">
                        <span className="font-medium text-gray-950">Mobile OTP Verification</span>
                        <Badge variant="success">Completed</Badge>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <span className="font-medium text-gray-950">Email Link Verification</span>
                        <Badge variant="success">Completed</Badge>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <span className="font-medium text-gray-950">Identity Proof Matching</span>
                        <Badge 
                          variant={user.kycStatus === 'VERIFIED' ? 'success' : user.kycStatus === 'SUBMITTED' ? 'warning' : 'danger'}
                        >
                          {user.kycStatus === 'VERIFIED' ? 'Passed' : user.kycStatus === 'SUBMITTED' ? 'In Review' : 'Missing'}
                        </Badge>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <span className="font-medium text-gray-950">Business Credentials Check</span>
                        <Badge 
                          variant={user.kycStatus === 'VERIFIED' ? 'success' : user.kycStatus === 'SUBMITTED' ? 'warning' : 'danger'}
                        >
                          {user.kycStatus === 'VERIFIED' ? 'Passed' : user.kycStatus === 'SUBMITTED' ? 'In Review' : 'Missing'}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* KYC Upload Modal */}
      <Modal
        isOpen={showKycModal}
        onClose={() => {
          if (!kycForm.formState.isSubmitting) setShowKycModal(false);
        }}
        title="Submit Verification Credentials"
        size="md"
        footer={
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              onClick={() => setShowKycModal(false)}
              disabled={kycForm.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={kycForm.handleSubmit(onSubmitKyc)}
              isLoading={kycForm.formState.isSubmitting}
            >
              Submit Credentials
            </Button>
          </div>
        }
      >
        <form onSubmit={kycForm.handleSubmit(onSubmitKyc)} className="space-y-4">
          <Select
            label="Document ID Proof Type"
            placeholder="Choose verification document"
            options={[
              { value: 'AADHAAR', label: 'Aadhaar Card' },
              { value: 'DRIVERS_LICENSE', label: "Driver's License" },
              { value: 'NATIONAL_ID', label: 'Passport / National ID' },
              { value: 'PAN', label: 'PAN Card Details' },
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

          <div className="grid grid-cols-1 gap-4 pt-2">
            {/* Front Document Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                className={`p-4 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                  uploads.documentFront.status === 'uploading'
                    ? 'border-indigo-400 bg-indigo-50/20'
                    : uploads.documentFront.status === 'success'
                    ? 'border-green-400 bg-green-50/20'
                    : uploads.documentFront.status === 'error'
                    ? 'border-red-400 bg-red-50/20'
                    : 'border-gray-200 hover:border-indigo-400 bg-gray-50/50'
                }`}
              >
                {uploads.documentFront.status === 'success' ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle className="w-6 h-6 text-green-500 mb-1" />
                    <p className="text-xs font-semibold text-gray-700 truncate max-w-full">
                      {uploads.documentFront.fileName}
                    </p>
                    <p className="text-[10px] text-green-600">Click to replace</p>
                  </div>
                ) : uploads.documentFront.status === 'uploading' ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-indigo-700">Uploading: {uploads.documentFront.progress}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 animate-pulse">
                      <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-150" style={{ width: `${uploads.documentFront.progress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-gray-700">Browse ID Front page</p>
                    <p className="text-[10px] text-gray-400">PDF, JPG, PNG up to 5MB</p>
                  </div>
                )}
              </div>
              {kycForm.formState.errors.documentFront && (
                <p className="text-xs text-red-500 mt-1">{kycForm.formState.errors.documentFront.message}</p>
              )}
            </div>

            {/* Back Document Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                className={`p-4 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                  uploads.documentBack.status === 'uploading'
                    ? 'border-indigo-400 bg-indigo-50/20'
                    : uploads.documentBack.status === 'success'
                    ? 'border-green-400 bg-green-50/20'
                    : uploads.documentBack.status === 'error'
                    ? 'border-red-400 bg-red-50/20'
                    : 'border-gray-200 hover:border-indigo-400 bg-gray-50/50'
                }`}
              >
                {uploads.documentBack.status === 'success' ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle className="w-6 h-6 text-green-500 mb-1" />
                    <p className="text-xs font-semibold text-gray-700 truncate max-w-full">
                      {uploads.documentBack.fileName}
                    </p>
                    <p className="text-[10px] text-green-600">Click to replace</p>
                  </div>
                ) : uploads.documentBack.status === 'uploading' ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-indigo-700">Uploading: {uploads.documentBack.progress}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 animate-pulse">
                      <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-150" style={{ width: `${uploads.documentBack.progress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-gray-700">Browse ID Back page</p>
                    <p className="text-[10px] text-gray-400">PDF, JPG, PNG up to 5MB</p>
                  </div>
                )}
              </div>
              {kycForm.formState.errors.documentBack && (
                <p className="text-xs text-red-500 mt-1">{kycForm.formState.errors.documentBack.message}</p>
              )}
            </div>

            {/* Selfie Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Your Selfie Photo <span className="text-red-500">*</span>
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
                className={`p-4 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                  uploads.selfie.status === 'uploading'
                    ? 'border-indigo-400 bg-indigo-50/20'
                    : uploads.selfie.status === 'success'
                    ? 'border-green-400 bg-green-50/20'
                    : uploads.selfie.status === 'error'
                    ? 'border-red-400 bg-red-50/20'
                    : 'border-gray-200 hover:border-indigo-400 bg-gray-50/50'
                }`}
              >
                {uploads.selfie.status === 'success' ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle className="w-6 h-6 text-green-500 mb-1" />
                    <p className="text-xs font-semibold text-gray-700 truncate max-w-full">
                      {uploads.selfie.fileName}
                    </p>
                    <p className="text-[10px] text-green-600">Click to replace</p>
                  </div>
                ) : uploads.selfie.status === 'uploading' ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-indigo-700">Uploading: {uploads.selfie.progress}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 animate-pulse">
                      <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-150" style={{ width: `${uploads.selfie.progress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-gray-700">Browse Selfie Image</p>
                    <p className="text-[10px] text-gray-400">JPG, PNG up to 5MB</p>
                  </div>
                )}
              </div>
              {kycForm.formState.errors.selfie && (
                <p className="text-xs text-red-500 mt-1">{kycForm.formState.errors.selfie.message}</p>
              )}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<Loading text="Loading profile content..." />}>
      <ProfileContent />
    </Suspense>
  );
}