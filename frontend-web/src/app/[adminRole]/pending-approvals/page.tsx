'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import DataTable from '@/components/admin/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Loading from '@/components/common/Loading';
import { formatDateTime } from '@/lib/utils';
import { FileText, UserCheck, Car, ShieldAlert, Check, X, Eye, ClipboardList } from 'lucide-react';

export default function AdminPendingApprovalsPage() {
  const { showToast } = useAppStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const adminRole = params?.adminRole as string || 'admin';

  // Active tab can be kyc | drivers | vehicles | documents
  const activeTab = searchParams.get('tab') || 'kyc';
  const highlightId = searchParams.get('id');

  const [approvals, setApprovals] = useState<{ kyc: any[]; vehicles: any[] }>({ kyc: [], vehicles: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    loadApprovals();
  }, []);

  useEffect(() => {
    // If highlightId is present in URL, auto-select it for review when approvals load
    if (highlightId && approvals.kyc.length || approvals.vehicles.length) {
      if (activeTab === 'kyc' || activeTab === 'drivers') {
        const found = approvals.kyc.find((u) => u.id === highlightId);
        if (found) setSelectedItem({ type: 'kyc', data: found });
      } else if (activeTab === 'vehicles') {
        const found = approvals.vehicles.find((v) => v.id === highlightId);
        if (found) setSelectedItem({ type: 'vehicle', data: found });
      }
    }
  }, [highlightId, approvals, activeTab]);

  const loadApprovals = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getPendingApprovals();
      setApprovals({
        kyc: response.data?.kyc || [],
        vehicles: response.data?.vehicles || [],
      });
    } catch (error) {
      showToast('Unable to load pending approvals', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKycApproval = async (userId: string, approved: boolean) => {
    setIsActionLoading(true);
    try {
      await apiClient.verifyKyc(userId, {
        status: approved ? 'approved' : 'rejected',
        reason: approved ? undefined : rejectionReason || 'Document details could not be verified.',
      });
      showToast(`KYC submission ${approved ? 'approved' : 'rejected'} successfully.`, 'success');
      setSelectedItem(null);
      setRejectionReason('');
      loadApprovals();
      // Remove query param id
      router.push(`/${adminRole}/pending-approvals?tab=${activeTab}`);
    } catch (err) {
      showToast('Failed to complete KYC verification.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleVehicleApproval = async (vehicleId: string, approved: boolean) => {
    setIsActionLoading(true);
    try {
      await apiClient.verifyVehicle(vehicleId, {
        status: approved ? 'approved' : 'rejected',
        reason: approved ? undefined : rejectionReason || 'Vehicle registration document verification failed.',
      });
      showToast(`Vehicle registration ${approved ? 'approved' : 'rejected'} successfully.`, 'success');
      setSelectedItem(null);
      setRejectionReason('');
      loadApprovals();
      router.push(`/${adminRole}/pending-approvals?tab=${activeTab}`);
    } catch (err) {
      showToast('Failed to complete vehicle verification.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setSelectedItem(null);
    router.push(`/${adminRole}/pending-approvals?tab=${tab}`);
  };

  // Filter users by Type for separating KYC and Driver verification
  const kycList = approvals.kyc.filter((u) => String(u.userType).toUpperCase() !== 'DRIVER');
  const driverList = approvals.kyc.filter((u) => String(u.userType).toUpperCase() === 'DRIVER');

  const vehicleList = approvals.vehicles;

  // Documents list collects all users/vehicles with pending files
  const documentsList = [
    ...approvals.kyc.map((u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}`, type: 'User KYC', docType: u.kycDocumentType || 'Aadhaar/Passport', date: u.kycSubmittedAt, data: u, itemType: 'kyc' })),
    ...approvals.vehicles.map((v) => ({ id: v.id, name: `${v.brand} ${v.model} (${v.registrationNumber})`, type: 'Vehicle RC', docType: 'Registration Certificate', date: v.createdAt, data: v, itemType: 'vehicle' })),
  ];

  const renderActiveTable = () => {
    switch (activeTab) {
      case 'kyc':
        return (
          <DataTable
            title="KYC Registrations"
            subtitle="Identity verifications for passengers and operators"
            columns={kycColumns}
            data={kycList}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            totalCount={kycList.length}
            page={1}
            onPageChange={() => {}}
            emptyMessage="No pending KYC approvals."
          />
        );
      case 'drivers':
        return (
          <DataTable
            title="Driver Verifications"
            subtitle="KYC and commercial document audits for drivers"
            columns={driverColumns}
            data={driverList}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            totalCount={driverList.length}
            page={1}
            onPageChange={() => {}}
            emptyMessage="No pending driver applications."
          />
        );
      case 'vehicles':
        return (
          <DataTable
            title="Vehicle Registrations"
            subtitle="Partners vehicle approvals and safety check audits"
            columns={vehicleColumns}
            data={vehicleList}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            totalCount={vehicleList.length}
            page={1}
            onPageChange={() => {}}
            emptyMessage="No pending vehicle approvals."
          />
        );
      case 'documents':
        return (
          <DataTable
            title="Document Verification Queue"
            subtitle="Unified queue of all pending documents"
            columns={documentColumns}
            data={documentsList}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            totalCount={documentsList.length}
            page={1}
            onPageChange={() => {}}
            emptyMessage="No documents waiting to be audited."
          />
        );
      default:
        return null;
    }
  };

  const kycColumns = [
    {
      key: 'name',
      header: 'Applicant',
      render: (u: any) => (
        <div>
          <p className="font-bold text-gray-900">{u.firstName} {u.lastName}</p>
          <p className="text-xs text-gray-500 font-medium">{u.email}</p>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone' },
    {
      key: 'kycDocumentType',
      header: 'Document',
      render: (u: any) => (
        <Badge variant="outline" className="uppercase text-[10px] font-bold">
          {u.kycDocumentType || 'Passport/Govt ID'}
        </Badge>
      ),
    },
    {
      key: 'kycSubmittedAt',
      header: 'Submitted At',
      render: (u: any) => formatDateTime(u.kycSubmittedAt),
    },
    {
      key: 'actions',
      header: 'Audit Review',
      render: (u: any) => (
        <Button
          size="sm"
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5"
          onClick={() => setSelectedItem({ type: 'kyc', data: u })}
        >
          <Eye className="w-3.5 h-3.5" />
          Review Files
        </Button>
      ),
    },
  ];

  const driverColumns = [
    {
      key: 'name',
      header: 'Driver Name',
      render: (u: any) => (
        <div>
          <p className="font-bold text-gray-900">{u.firstName} {u.lastName}</p>
          <p className="text-xs text-gray-500 font-medium">{u.email}</p>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone Number' },
    {
      key: 'kycSubmittedAt',
      header: 'Submitted',
      render: (u: any) => formatDateTime(u.kycSubmittedAt),
    },
    {
      key: 'actions',
      header: 'Audit Review',
      render: (u: any) => (
        <Button
          size="sm"
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5"
          onClick={() => setSelectedItem({ type: 'kyc', data: u })}
        >
          <Eye className="w-3.5 h-3.5" />
          Review Credentials
        </Button>
      ),
    },
  ];

  const vehicleColumns = [
    {
      key: 'registrationNumber',
      header: 'Plate & Model',
      render: (v: any) => (
        <div>
          <p className="font-bold text-gray-900">{v.registrationNumber}</p>
          <p className="text-xs text-gray-500 font-medium">{v.brand} {v.model}</p>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Owner Partner',
      render: (v: any) => v.owner?.firstName ? `${v.owner.firstName} ${v.owner.lastName}` : v.owner?.email || 'N/A',
    },
    {
      key: 'vehicleType',
      header: 'Vehicle Category',
      render: (v: any) => (
        <Badge variant="outline" className="uppercase text-[10px] font-bold">
          {v.vehicleType || 'Standard'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Submitted At',
      render: (v: any) => formatDateTime(v.createdAt),
    },
    {
      key: 'actions',
      header: 'Audit Review',
      render: (v: any) => (
        <Button
          size="sm"
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5"
          onClick={() => setSelectedItem({ type: 'vehicle', data: v })}
        >
          <Eye className="w-3.5 h-3.5" />
          Review Vehicle
        </Button>
      ),
    },
  ];

  const documentColumns = [
    {
      key: 'name',
      header: 'Subject / Entity',
      render: (item: any) => (
        <div>
          <p className="font-bold text-gray-900">{item.name}</p>
          <p className="text-xs text-gray-400 font-semibold">{item.type}</p>
        </div>
      ),
    },
    {
      key: 'docType',
      header: 'Document Type',
      render: (item: any) => <Badge variant="outline" className="uppercase text-[9px] font-bold">{item.docType}</Badge>,
    },
    {
      key: 'date',
      header: 'Uploaded Date',
      render: (item: any) => formatDateTime(item.date),
    },
    {
      key: 'actions',
      header: 'Audit Review',
      render: (item: any) => (
        <Button
          size="sm"
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5"
          onClick={() => setSelectedItem({ type: item.itemType, data: item.data })}
        >
          <Eye className="w-3.5 h-3.5" />
          Review File
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Verification Center</h1>
          <p className="text-gray-500 mt-1 font-medium">Verify users identity KYC, driver licenses, and vehicle compliance</p>
        </div>
        <Button onClick={loadApprovals} variant="secondary" className="font-semibold">Refresh Queue</Button>
      </div>

      {/* Verification Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto space-x-6">
        {[
          { id: 'kyc', label: 'KYC Approvals', icon: <UserCheck className="w-4.5 h-4.5" /> },
          { id: 'drivers', label: 'Driver Verification', icon: <FileText className="w-4.5 h-4.5" /> },
          { id: 'vehicles', label: 'Vehicle Verification', icon: <Car className="w-4.5 h-4.5" /> },
          { id: 'documents', label: 'Document Queue', icon: <ClipboardList className="w-4.5 h-4.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 pb-3 text-sm font-bold tracking-wide border-b-2 shrink-0 transition-all ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main table view */}
        <div className="lg:col-span-2 space-y-4">
          {renderActiveTable()}
        </div>

        {/* Audit Details Panel (Reviewing details modal) */}
        <div>
          {selectedItem ? (
            <Card className="p-6 border border-primary-200 shadow-lg relative overflow-hidden bg-white">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-indigo-600" />
              
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-650" />
                Document Audit Sheet
              </h3>

              {selectedItem.type === 'kyc' ? (
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Applicant</p>
                    <p className="font-extrabold text-slate-800 text-base">{selectedItem.data.firstName} {selectedItem.data.lastName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedItem.data.email} | {selectedItem.data.phone}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Document Type</p>
                      <Badge variant="outline" className="mt-0.5 uppercase font-bold">{selectedItem.data.kycDocumentType || 'Government ID'}</Badge>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Doc Number</p>
                      <p className="font-bold text-slate-800 mt-0.5">{selectedItem.data.kycDocumentNumber || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Document Image Views */}
                  <div className="space-y-3 pt-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Submitted Files</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="border border-gray-150 rounded-lg p-1 bg-slate-50">
                        <p className="text-[9px] font-bold text-center text-gray-500 mb-1">Doc Front</p>
                        {selectedItem.data.kycDocumentFront ? (
                          <img src={selectedItem.data.kycDocumentFront} alt="Doc Front" className="w-full h-24 object-cover rounded" />
                        ) : (
                          <div className="h-24 rounded bg-gray-250 flex items-center justify-center text-xs text-gray-400 font-medium">Front Side Missing</div>
                        )}
                      </div>
                      <div className="border border-gray-150 rounded-lg p-1 bg-slate-50">
                        <p className="text-[9px] font-bold text-center text-gray-500 mb-1">Doc Back</p>
                        {selectedItem.data.kycDocumentBack ? (
                          <img src={selectedItem.data.kycDocumentBack} alt="Doc Back" className="w-full h-24 object-cover rounded" />
                        ) : (
                          <div className="h-24 rounded bg-gray-250 flex items-center justify-center text-xs text-gray-400 font-medium">Back Side Missing</div>
                        )}
                      </div>
                    </div>

                    <div className="border border-gray-150 rounded-lg p-1 bg-slate-50">
                      <p className="text-[9px] font-bold text-center text-gray-500 mb-1">Selfie Verification</p>
                      {selectedItem.data.kycSelfie ? (
                        <img src={selectedItem.data.kycSelfie} alt="Selfie" className="w-full h-36 object-cover rounded" />
                      ) : (
                        <div className="h-36 rounded bg-gray-250 flex items-center justify-center text-xs text-gray-400 font-medium">Selfie Missing</div>
                      )}
                    </div>
                  </div>

                  {/* Rejection input */}
                  <div className="pt-2">
                    <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Audit Rejection Notes</label>
                    <textarea
                      placeholder="Specify reason if rejecting KYC..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500 focus:outline-none"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      disabled={isActionLoading}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs gap-1"
                      onClick={() => handleKycApproval(selectedItem.data.id, true)}
                    >
                      <Check className="w-4 h-4" />
                      Approve KYC
                    </Button>
                    <Button
                      disabled={isActionLoading}
                      variant="danger"
                      className="flex-1 font-bold py-2 rounded-xl text-xs gap-1"
                      onClick={() => handleKycApproval(selectedItem.data.id, false)}
                    >
                      <X className="w-4 h-4" />
                      Reject KYC
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Vehicle Plate</p>
                    <p className="font-extrabold text-slate-800 text-base">{selectedItem.data.registrationNumber}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedItem.data.brand} {selectedItem.data.model} | {selectedItem.data.color}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Category Type</p>
                      <Badge variant="outline" className="mt-0.5 uppercase font-bold">{selectedItem.data.vehicleType || 'Standard'}</Badge>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Year of Mfg</p>
                      <p className="font-bold text-slate-800 mt-0.5">{selectedItem.data.year || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Partner Operator</p>
                    <p className="font-bold text-slate-800">{selectedItem.data.owner?.firstName} {selectedItem.data.owner?.lastName || selectedItem.data.owner?.email}</p>
                  </div>

                  {/* RC Doc */}
                  <div className="pt-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Registration Documents (RC)</p>
                    {selectedItem.data.documentUrl ? (
                      <div className="border border-gray-150 rounded-lg p-1 bg-slate-50">
                        <img src={selectedItem.data.documentUrl} alt="RC Document" className="w-full h-44 object-cover rounded" />
                      </div>
                    ) : (
                      <div className="h-44 border border-gray-150 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-xs text-gray-400 font-semibold p-4 text-center">
                        <ShieldAlert className="w-8 h-8 text-amber-500 mb-1.5" />
                        No Registration Certificate document file uploaded by partner
                      </div>
                    )}
                  </div>

                  {/* Rejection input */}
                  <div className="pt-2">
                    <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Audit Rejection Notes</label>
                    <textarea
                      placeholder="Specify reason if rejecting vehicle..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500 focus:outline-none"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      disabled={isActionLoading}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs gap-1"
                      onClick={() => handleVehicleApproval(selectedItem.data.id, true)}
                    >
                      <Check className="w-4 h-4" />
                      Approve Vehicle
                    </Button>
                    <Button
                      disabled={isActionLoading}
                      variant="danger"
                      className="flex-1 font-bold py-2 rounded-xl text-xs gap-1"
                      onClick={() => handleVehicleApproval(selectedItem.data.id, false)}
                    >
                      <X className="w-4 h-4" />
                      Reject Vehicle
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-6 border border-dashed border-gray-300 text-center py-16 bg-white rounded-2xl">
              <FileText className="w-12 h-12 text-gray-305 mx-auto animate-pulse" />
              <h4 className="font-bold text-gray-800 mt-4 text-sm md:text-base">No file selected for review</h4>
              <p className="text-gray-450 text-xs mt-1.5 max-w-xs mx-auto">
                Select an applicant or vehicle from the queue list to inspect files, review logs, and audit credentials.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
