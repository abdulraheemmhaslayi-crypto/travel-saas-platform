'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import TextArea from '@/components/ui/TextArea';
import Loading from '@/components/common/Loading';
import type { Vehicle, VehicleDocument, VehicleApprovalHistory } from '@/types/vehicle';
import {
  ArrowLeft,
  Truck,
  User,
  FileText,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  RefreshCw,
  AlertTriangle,
  Calendar,
  MapPin,
  Fuel,
  Settings,
  Users,
  Wifi,
  Zap,
  Wind,
  ExternalLink,
  Phone,
  Mail,
  History as HistoryIcon,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { variant: 'warning' | 'success' | 'danger' | 'info' | 'default'; label: string; icon: React.ReactNode }> = {
  pending: { variant: 'warning', label: 'Pending Review', icon: <Clock className="w-4 h-4" /> },
  approved: { variant: 'success', label: 'Approved', icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { variant: 'danger', label: 'Rejected', icon: <XCircle className="w-4 h-4" /> },
  suspended: { variant: 'default', label: 'Suspended', icon: <Ban className="w-4 h-4" /> },
  active: { variant: 'success', label: 'Active', icon: <CheckCircle className="w-4 h-4" /> },
  inactive: { variant: 'default', label: 'Inactive', icon: <Ban className="w-4 h-4" /> },
  maintenance: { variant: 'info', label: 'Maintenance', icon: <Settings className="w-4 h-4" /> },
};

const DOC_STATUS_CONFIG: Record<string, { variant: 'warning' | 'success' | 'danger'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'success', label: 'Verified' },
  rejected: { variant: 'danger', label: 'Rejected' },
};

const DOC_TYPE_LABELS: Record<string, string> = {
  rc: 'Registration Certificate',
  insurance: 'Insurance',
  permit: 'Permit',
  fitness: 'Fitness Certificate',
  pollution: 'Pollution Certificate',
  ownership: 'Ownership Proof',
  other: 'Other Document',
};

export default function AdminVehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useAppStore();
  const vehicleId = params?.id as string;
  const adminRole = params?.adminRole as string || 'admin';

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [history, setHistory] = useState<VehicleApprovalHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // Action modal
  const [actionModal, setActionModal] = useState<'approve' | 'reject' | 'suspend' | 'reactivate' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadVehicle = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getVehicle(vehicleId);
      const data = response.data?.data || response.data;
      setVehicle(data);
    } catch {
      showToast('Unable to load vehicle details', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId, showToast]);

  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const response = await apiClient.getVehicleApprovalHistory(vehicleId);
      const data = response.data?.data || response.data;
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      // Non-critical — fail silently
    } finally {
      setIsHistoryLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    if (vehicleId) {
      loadVehicle();
      loadHistory();
    }
  }, [vehicleId, loadVehicle, loadHistory]);

  const handleAction = async () => {
    if (!vehicle || !actionModal) return;

    if ((actionModal === 'reject' || actionModal === 'suspend') && !actionReason.trim()) {
      showToast('Please provide a reason', 'error');
      return;
    }

    setIsActionLoading(true);
    try {
      switch (actionModal) {
        case 'approve':
          await apiClient.verifyVehicle(vehicle.id, { status: 'approved' });
          showToast('Vehicle approved successfully', 'success');
          break;
        case 'reject':
          await apiClient.verifyVehicle(vehicle.id, { status: 'rejected', reason: actionReason });
          showToast('Vehicle rejected', 'success');
          break;
        case 'suspend':
          await apiClient.suspendVehicle(vehicle.id, { reason: actionReason });
          showToast('Vehicle suspended', 'success');
          break;
        case 'reactivate':
          await apiClient.reactivateVehicle(vehicle.id);
          showToast('Vehicle reactivated', 'success');
          break;
      }
      setActionModal(null);
      setActionReason('');
      loadVehicle();
      loadHistory();
    } catch (err: any) {
      const msg = err?.response?.data?.message || `Failed to ${actionModal} vehicle`;
      showToast(msg, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading vehicle details..." />;
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Truck className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Vehicle Not Found</h2>
        <p className="text-gray-500 mb-6">The vehicle you&apos;re looking for could not be found.</p>
        <Button onClick={() => router.push(`/${adminRole}/vehicles`)}>Back to Vehicles</Button>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[vehicle.status?.toLowerCase()] || STATUS_CONFIG.pending;
  const status = vehicle.status?.toLowerCase();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push(`/${adminRole}/vehicles`)}
            className="mt-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Back to vehicles"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">
                {vehicle.brand} {vehicle.model}
              </h1>
              <Badge variant={statusInfo.variant} size="md" dot>
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-sm">
                {vehicle.registrationNumber}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-sm">{vehicle.year} · {vehicle.color} · <span className="capitalize">{vehicle.type}</span></span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap ml-11 md:ml-0">
          {status === 'pending' && (
            <>
              <Button
                onClick={() => { setActionReason(''); setActionModal('approve'); }}
                className="!bg-green-600 hover:!bg-green-700 !text-white"
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Approve
              </Button>
              <Button
                onClick={() => { setActionReason(''); setActionModal('reject'); }}
                variant="danger"
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Reject
              </Button>
            </>
          )}
          {status === 'approved' && (
            <Button
              onClick={() => { setActionReason(''); setActionModal('suspend'); }}
              className="!bg-orange-600 hover:!bg-orange-700 !text-white"
              leftIcon={<Ban className="w-4 h-4" />}
            >
              Suspend
            </Button>
          )}
          {status === 'suspended' && (
            <Button
              onClick={() => { setActionReason(''); setActionModal('reactivate'); }}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Reactivate
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Information */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-primary-600" />
                Vehicle Information
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                <InfoField label="Brand" value={vehicle.brand} />
                <InfoField label="Model" value={vehicle.model} />
                <InfoField label="Year" value={String(vehicle.year)} />
                <InfoField label="Color" value={vehicle.color} />
                <InfoField label="Type" value={vehicle.type} capitalize />
                <InfoField label="Seating Capacity" value={`${vehicle.seatingCapacity} seats`} icon={<Users className="w-3.5 h-3.5" />} />
                <InfoField label="Fuel Type" value={vehicle.fuelType || '—'} icon={<Fuel className="w-3.5 h-3.5" />} />
                <InfoField label="Transmission" value={vehicle.transmission || '—'} icon={<Settings className="w-3.5 h-3.5" />} capitalize />
                <InfoField label="Registration No." value={vehicle.registrationNumber} mono />
              </div>

              {/* Amenities */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  <AmenityTag label="AC" active={vehicle.hasAC} icon={<Wind className="w-3.5 h-3.5" />} />
                  <AmenityTag label="WiFi" active={vehicle.hasWifi} icon={<Wifi className="w-3.5 h-3.5" />} />
                  <AmenityTag label="Charging" active={vehicle.hasCharging} icon={<Zap className="w-3.5 h-3.5" />} />
                  <AmenityTag label="Entertainment" active={vehicle.hasEntertainment} />
                  <AmenityTag label="Luggage Space" active={vehicle.hasLuggageSpace} />
                </div>
              </div>

              {/* Pricing */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">Pricing</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Base Price</p>
                    <p className="text-lg font-bold text-gray-900">₹{Number(vehicle.basePrice || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Per Km</p>
                    <p className="text-lg font-bold text-gray-900">₹{Number(vehicle.pricePerKm || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Documents */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary-600" />
                Documents
              </h2>

              {/* Inline documents from entity fields */}
              <div className="space-y-3">
                <DocumentRow
                  label="Registration Certificate (RC)"
                  number={vehicle.rcNumber}
                  documentUrl={vehicle.rcDocument}
                />
                <DocumentRow
                  label="Insurance"
                  number={vehicle.insuranceNumber}
                  expiry={vehicle.insuranceExpiry}
                  documentUrl={vehicle.insuranceDocument}
                />
                <DocumentRow
                  label="Permit"
                  number={vehicle.permitNumber}
                  expiry={vehicle.permitExpiry}
                  documentUrl={vehicle.permitDocument}
                />
                <DocumentRow
                  label="Fitness Certificate"
                  documentUrl={vehicle.fitnessCertificate}
                  expiry={vehicle.fitnessExpiry}
                />
              </div>

              {/* Uploaded document records */}
              {vehicle.documents && vehicle.documents.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-3">Uploaded Documents</p>
                  <div className="space-y-3">
                    {vehicle.documents.map((doc) => {
                      const docStatus = DOC_STATUS_CONFIG[doc.status?.toLowerCase()] || DOC_STATUS_CONFIG.pending;
                      return (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {DOC_TYPE_LABELS[doc.documentType] || doc.documentType}
                              </p>
                              {doc.documentNumber && (
                                <p className="text-xs text-gray-500 font-mono">{doc.documentNumber}</p>
                              )}
                              {doc.expiryDate && (
                                <p className="text-xs text-gray-500">
                                  Expires: {new Date(doc.expiryDate).toLocaleDateString('en-IN')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={docStatus.variant} size="sm">
                              {docStatus.label}
                            </Badge>
                            {doc.documentUrl && (
                              <a
                                href={doc.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
                                title="View Document"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Approval History */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <HistoryIcon className="w-5 h-5 text-primary-600" />
                Approval History
              </h2>

              {isHistoryLoading ? (
                <Loading text="Loading history..." />
              ) : history.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No approval history available</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-6 bottom-6 w-px bg-gray-200" />

                  <div className="space-y-4">
                    {history.map((entry, index) => (
                      <div key={entry.id || index} className="relative flex gap-4 pl-2">
                        <div className={`relative z-10 w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                          entry.action === 'approve'
                            ? 'border-green-500 bg-green-50'
                            : entry.action === 'reject'
                            ? 'border-red-500 bg-red-50'
                            : entry.action === 'suspend'
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-400 bg-gray-50'
                        }`}>
                          <div className={`absolute inset-1 rounded-full ${
                            entry.action === 'approve'
                              ? 'bg-green-500'
                              : entry.action === 'reject'
                              ? 'bg-red-500'
                              : entry.action === 'suspend'
                              ? 'bg-orange-500'
                              : 'bg-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0 pb-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {entry.description || `Vehicle ${entry.action}`}
                              </p>
                              {entry.user && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  by {entry.user.firstName} {entry.user.lastName}
                                </p>
                              )}
                              {entry.metadata && typeof entry.metadata === 'object' && (entry.metadata as any).reason && (
                                <p className="text-xs text-gray-500 mt-1 italic">
                                  Reason: {(entry.metadata as any).reason}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                              {new Date(entry.createdAt).toLocaleString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column — Sidebar Details */}
        <div className="space-y-6">
          {/* Vehicle Owner */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-primary-600" />
                Owner Details
              </h2>

              {vehicle.owner ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                      {vehicle.owner.profileImage ? (
                        <img
                          src={vehicle.owner.profileImage}
                          alt={`${vehicle.owner.firstName} ${vehicle.owner.lastName}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-primary-700">
                          {vehicle.owner.firstName?.[0]}{vehicle.owner.lastName?.[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {vehicle.owner.firstName} {vehicle.owner.lastName}
                      </p>
                      <p className="text-xs text-gray-500">Vehicle Owner</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {vehicle.owner.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700 truncate">{vehicle.owner.email}</span>
                      </div>
                    )}
                    {vehicle.owner.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700">{vehicle.owner.phone}</span>
                      </div>
                    )}
                  </div>

                  {vehicle.owner.kycDocumentType && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">KYC Info</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Document Type</span>
                          <span className="text-gray-900 capitalize">{vehicle.owner.kycDocumentType}</span>
                        </div>
                        {vehicle.owner.kycDocumentNumber && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Document No.</span>
                            <span className="text-gray-900 font-mono text-xs">{vehicle.owner.kycDocumentNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Owner information not available</p>
              )}
            </div>
          </Card>

          {/* Verification Status */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary-600" />
                Verification Status
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {statusInfo.icon}
                  <Badge variant={statusInfo.variant} size="md" dot>
                    {statusInfo.label}
                  </Badge>
                </div>

                <div className="space-y-3 text-sm">
                  {vehicle.approvedAt && (
                    <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-green-800">Approved</p>
                        <p className="text-green-700 text-xs mt-0.5">
                          {new Date(vehicle.approvedAt).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {vehicle.rejectedAt && vehicle.rejectionReason && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                      <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-red-800">Rejected</p>
                        <p className="text-red-700 text-xs mt-0.5">
                          {new Date(vehicle.rejectedAt).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                        <p className="text-red-600 text-xs mt-1 italic">Reason: {vehicle.rejectionReason}</p>
                      </div>
                    </div>
                  )}

                  {vehicle.suspendedAt && vehicle.suspensionReason && (
                    <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
                      <Ban className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-orange-800">Suspended</p>
                        <p className="text-orange-700 text-xs mt-0.5">
                          {new Date(vehicle.suspendedAt).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                        <p className="text-orange-600 text-xs mt-1 italic">Reason: {vehicle.suspensionReason}</p>
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Created
                      </span>
                      <span className="text-gray-700 text-xs">
                        {vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        }) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Updated
                      </span>
                      <span className="text-gray-700 text-xs">
                        {vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        }) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Insurance Info */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary-600" />
                Insurance Information
              </h2>
              <div className="space-y-3 text-sm">
                <InfoRow label="Insurance No." value={vehicle.insuranceNumber || '—'} />
                <InfoRow
                  label="Expiry Date"
                  value={vehicle.insuranceExpiry
                    ? new Date(vehicle.insuranceExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'
                  }
                  warn={vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry) < new Date() : false}
                />
                {vehicle.insuranceDocument && (
                  <a
                    href={vehicle.insuranceDocument}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Insurance Document
                  </a>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Action Modal */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => { setActionModal(null); setActionReason(''); }}
        title={
          actionModal === 'approve' ? 'Approve Vehicle'
            : actionModal === 'reject' ? 'Reject Vehicle'
            : actionModal === 'suspend' ? 'Suspend Vehicle'
            : 'Reactivate Vehicle'
        }
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => { setActionModal(null); setActionReason(''); }}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <button
              onClick={handleAction}
              disabled={isActionLoading}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                actionModal === 'approve' ? 'bg-green-600 hover:bg-green-700'
                  : actionModal === 'reject' ? 'bg-red-600 hover:bg-red-700'
                  : actionModal === 'suspend' ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isActionLoading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {actionModal === 'approve' ? 'Approve'
                : actionModal === 'reject' ? 'Reject'
                : actionModal === 'suspend' ? 'Suspend'
                : 'Reactivate'
              }
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {(actionModal === 'approve' || actionModal === 'reactivate') ? (
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                {actionModal === 'approve'
                  ? `This will approve the vehicle and make it available for trip assignments.`
                  : `This will reactivate the vehicle and restore it to approved status.`
                }
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  {actionModal === 'reject'
                    ? 'This will reject the vehicle registration. The owner will be notified.'
                    : 'This will suspend the vehicle and remove it from active service.'
                  }
                </p>
              </div>
              <TextArea
                label="Reason"
                placeholder={`Enter reason for ${actionModal}ing this vehicle...`}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
                required
              />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

// Helper Components

function InfoField({ label, value, capitalize, mono, icon }: {
  label: string;
  value: string;
  capitalize?: boolean;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-sm text-gray-900 mt-0.5 flex items-center gap-1 ${capitalize ? 'capitalize' : ''} ${mono ? 'font-mono' : ''}`}>
        {icon}
        {value}
      </p>
    </div>
  );
}

function InfoRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${warn ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
        {warn && (
          <span className="ml-1 text-xs text-red-500 font-normal">(Expired)</span>
        )}
      </span>
    </div>
  );
}

function AmenityTag({ label, active, icon }: { label: string; active: boolean; icon?: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
      active
        ? 'bg-green-50 text-green-700 border border-green-200'
        : 'bg-gray-50 text-gray-400 border border-gray-200'
    }`}>
      {icon}
      {label}
    </span>
  );
}

function DocumentRow({ label, number, expiry, documentUrl }: {
  label: string;
  number?: string;
  expiry?: string;
  documentUrl?: string;
}) {
  const hasData = number || documentUrl;
  const isExpired = expiry ? new Date(expiry) < new Date() : false;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3 min-w-0">
        <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {number && <p className="text-xs text-gray-500 font-mono">{number}</p>}
          {expiry && (
            <p className={`text-xs ${isExpired ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
              {isExpired ? '⚠ Expired: ' : 'Expires: '}
              {new Date(expiry).toLocaleDateString('en-IN')}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {hasData ? (
          <Badge variant="success" size="sm">Uploaded</Badge>
        ) : (
          <Badge variant="warning" size="sm">Missing</Badge>
        )}
        {documentUrl && (
          <a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
            title="View Document"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
