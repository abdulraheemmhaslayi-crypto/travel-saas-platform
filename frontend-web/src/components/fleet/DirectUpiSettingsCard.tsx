'use client';

import React, { useState, useRef } from 'react';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/slices/authSlice';
import { useAppStore } from '@/store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  QrCode,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Upload,
  Save,
  Smartphone,
  Eye,
  Trash2,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';

export default function DirectUpiSettingsCard() {
  const { user, setUser } = useAuthStore();
  const { showToast } = useAppStore();

  const [upiId, setUpiId] = useState(user?.upiId || '');
  const [upiAccountName, setUpiAccountName] = useState(user?.upiAccountName || '');
  const [upiQrCodeUrl, setUpiQrCodeUrl] = useState(user?.upiQrCodeUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generate dynamic QR code URL based on UPI URI specification: upi://pay?pa=...&pn=...
  const dynamicQrCodeUrl = upiId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
        `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
          upiAccountName || 'Fleet Operator'
        )}&cu=INR`
      )}`
    : '';

  const activeQrUrl = upiQrCodeUrl || dynamicQrCodeUrl;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('UPI ID copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQrFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, JPEG)', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('QR code image size must be under 5MB', 'error');
      return;
    }

    setIsUploadingQr(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.getClient().post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.url || res.data?.fileUrl;
      if (url) {
        setUpiQrCodeUrl(url);
        showToast('QR Code image uploaded successfully!', 'success');
      }
    } catch {
      // Fallback to Data URL for instant offline/direct persistence
      const reader = new FileReader();
      reader.onloadend = () => {
        setUpiQrCodeUrl(reader.result as string);
        showToast('QR Code loaded into profile preview!', 'success');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingQr(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (upiId && !upiId.includes('@')) {
      showToast('Please enter a valid UPI ID (e.g. yourname@okhdfcbank or 9876543210@paytm)', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await apiClient.updateProfile({
        upiId: upiId.trim(),
        upiAccountName: upiAccountName.trim(),
        upiQrCodeUrl: upiQrCodeUrl.trim() || undefined,
      });

      if (res?.data) {
        setUser(res.data);
      }
      showToast('UPI & Payment QR settings saved successfully! Passengers will pay directly to your account.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update UPI settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border border-gray-200 shadow-sm p-5 sm:p-6 bg-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Direct Passenger UPI & QR Code Settings
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Receive 100% of seat ticket payments directly into your Bank/UPI account with 0% gateway fees.
            </p>
          </div>
        </div>

        {upiId ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Direct UPI Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Not Configured
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Form Inputs */}
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Your UPI ID (VPA)"
            placeholder="e.g. 9876543210@paytm or owner@okhdfcbank"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            helperText="Passengers will transfer ticket fare to this UPI handle."
          />

          <Input
            label="Beneficiary / Business Account Name"
            placeholder="e.g. Ramesh Sharma or Sharma Travels"
            value={upiAccountName}
            onChange={(e) => setUpiAccountName(e.target.value)}
            helperText="Shown to passengers on the UPI payment verification screen."
          />

          {/* QR Code Upload Section */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              UPI QR Code Image
            </label>
            <p className="text-xs text-gray-500">
              Upload your printed Google Pay, PhonePe, Paytm, or BHIM QR code image.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleQrFileUpload(file);
              }}
            />

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingQr}
                className="font-bold text-xs"
              >
                {isUploadingQr ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Upload QR Image
                  </>
                )}
              </Button>

              {upiQrCodeUrl && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setUpiQrCodeUrl('')}
                  className="font-bold text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Remove Custom QR
                </Button>
              )}
            </div>

            <Input
              label=""
              placeholder="Or enter QR image URL directly (e.g. https://...)"
              value={upiQrCodeUrl}
              onChange={(e) => setUpiQrCodeUrl(e.target.value)}
              className="text-xs mt-2"
            />
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900 leading-relaxed">
              <strong>How it works:</strong> When passengers book a seat on your vehicle, they scan this QR code or click &apos;Pay via UPI App&apos; on mobile. The payment credits straight to your bank account. You then approve their 12-digit UTR in your dashboard!
            </p>
          </div>

          <Button type="submit" disabled={isSaving || isUploadingQr} className="w-full sm:w-auto">
            <Save className="w-4 h-4 mr-1.5" />
            {isSaving ? 'Saving...' : 'Save UPI & QR Configuration'}
          </Button>
        </form>

        {/* Live Passenger Preview Box */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <Eye className="w-4 h-4 text-blue-600" />
            Passenger Payment Preview
          </div>

          {activeQrUrl ? (
            <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-xs inline-block">
              <img
                src={activeQrUrl}
                alt="Direct UPI QR"
                className="w-44 h-44 object-contain mx-auto rounded-lg"
              />
            </div>
          ) : (
            <div className="w-44 h-44 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-4 text-gray-400">
              <QrCode className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-xs">Enter your UPI ID or upload a QR image to generate live preview</p>
            </div>
          )}

          <div className="w-full max-w-xs space-y-1">
            <p className="text-sm font-bold text-gray-900">
              {upiAccountName || user?.firstName || 'Vehicle Operator'}
            </p>
            {upiId ? (
              <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-blue-700 bg-blue-50 py-1 px-2.5 rounded-lg border border-blue-200">
                <span>{upiId}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(upiId)}
                  className="hover:text-blue-900 transition-colors p-0.5"
                  title="Copy UPI ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No UPI ID set</p>
            )}
            {upiQrCodeUrl && (
              <span className="text-[10px] text-emerald-600 font-semibold block pt-1">
                ✓ Using uploaded custom QR code
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
