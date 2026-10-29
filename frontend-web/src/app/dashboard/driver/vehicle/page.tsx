'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/slices/authSlice';
import {
  Car,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Settings,
  Shield,
  ShieldAlert,
} from 'lucide-react';

export default function DriverVehiclePage() {
  const { user } = useAuthStore();
  const [vehicle, setVehicle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assigned' | 'documents' | 'maintenance'>('assigned');
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([
    { id: 1, type: 'Oil Change & Filter', date: '2026-05-15', cost: 3500, km: '12,450 km', status: 'Completed' },
    { id: 2, type: 'Tire Rotation & Balance', date: '2026-04-10', cost: 1800, km: '9,800 km', status: 'Completed' },
    { id: 3, type: 'Brake Pad Replacement', date: '2026-02-12', cost: 5200, km: '6,200 km', status: 'Completed' },
  ]);
  const [reminderRecords, setReminderRecords] = useState<any[]>([
    { id: 1, type: 'Air Filter Change', date: '2026-06-20', kmReminder: '15,000 km', severity: 'medium' },
    { id: 2, type: 'Annual Vehicle Fitness Cert', date: '2026-07-05', kmReminder: 'N/A', severity: 'high' },
  ]);

  useEffect(() => {
    fetchVehicle();
  }, []);

  const fetchVehicle = async () => {
    setIsLoading(true);
    try {
      // Fetch the driver's vehicles
      const resp = await apiClient.get('/vehicles/my-vehicles');
      const payload = resp.data || resp;
      const vehicleList = Array.isArray(payload) ? payload : payload.data || [];
      if (vehicleList.length > 0) {
        setVehicle(vehicleList[0]);
      } else {
        // Fallback: try checking active trips to get assigned vehicle
        const activeTripResp = await apiClient.get('/driver/trips/active');
        const activeTripPayload = activeTripResp.data || activeTripResp;
        const activeTripList = Array.isArray(activeTripPayload) ? activeTripPayload : activeTripPayload.data || [];
        if (activeTripList.length > 0 && activeTripList[0].vehicle) {
          setVehicle(activeTripList[0].vehicle);
        }
      }
    } catch (e) {
      console.error('Failed to fetch vehicle:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const documentList = vehicle
    ? [
        { name: 'Registration Certificate (RC)', number: vehicle.rcNumber || 'RC-892301B', status: 'approved', expiry: '2031-10-15' },
        { name: 'Vehicle Commercial Permit', number: vehicle.permitNumber || 'PM-88123A', status: 'approved', expiry: '2027-04-12' },
        { name: 'Third Party Liability Insurance', number: vehicle.insuranceNumber || 'IN-77123A', status: 'pending_expiry', expiry: '2026-06-20' },
        { name: 'Pollution Under Control (PUC)', number: vehicle.pollutionNumber || 'PUC-99120', status: 'approved', expiry: '2026-12-05' },
        { name: 'Fitness Certificate', number: vehicle.fitnessNumber || 'FT-123A', status: 'approved', expiry: '2026-09-30' },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="text-sm text-gray-500">Monitor vehicle assignments, compliance documents, and logs</p>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-gray-200 overflow-x-auto space-x-6">
          {(['assigned', 'documents', 'maintenance'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold capitalize tracking-wide transition-all border-b-2 shrink-0 ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab === 'assigned' ? 'Assigned Vehicle' : `${tab} Records`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Loading text="Loading vehicle logs..." />
        ) : vehicle ? (
          <div className="space-y-6 animate-fadeIn">
            {activeTab === 'assigned' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Vehicle details sheet */}
                  <Card className="p-6">
                    <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
                      <div className="bg-primary-100 text-primary-700 p-3 rounded-xl">
                        <Car className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">
                          Plate Number: <span className="text-gray-900 uppercase font-bold">{vehicle.registrationNumber}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-5 text-sm font-semibold text-gray-500">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Manufacturing Year</p>
                        <p className="text-gray-800 mt-1">{vehicle.year || '2023'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Color</p>
                        <p className="text-gray-800 mt-1">{vehicle.color || 'White'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Seating Capacity</p>
                        <p className="text-gray-800 mt-1">{vehicle.seatingCapacity || 12} Seats</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Transmission</p>
                        <p className="text-gray-800 mt-1">{vehicle.transmission || 'Manual'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Fuel Type</p>
                        <p className="text-gray-800 mt-1">{vehicle.fuelType || 'Diesel'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">AC Status</p>
                        <p className="text-gray-800 mt-1">{vehicle.hasAC ? 'Air Conditioned' : 'Non AC'}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Vehicle Features */}
                  <Card className="p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Vehicle Features & Amenities</h3>
                    <div className="flex flex-wrap gap-2.5">
                      <span className={`text-xs px-3.5 py-1.5 rounded-full font-bold border ${vehicle.hasAC ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>Air Conditioning (AC)</span>
                      <span className={`text-xs px-3.5 py-1.5 rounded-full font-bold border ${vehicle.hasWifi ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>High Speed Wifi</span>
                      <span className={`text-xs px-3.5 py-1.5 rounded-full font-bold border ${vehicle.hasCharging ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>USB Charging Ports</span>
                      <span className={`text-xs px-3.5 py-1.5 rounded-full font-bold border ${vehicle.hasToilet ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>Onboard Toilet</span>
                    </div>
                  </Card>
                </div>

                {/* Status and compliance summary */}
                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Approval Status</h3>
                    <div className="flex items-center gap-3">
                      <Badge variant={vehicle.status === 'approved' ? 'success' : 'default'} className="px-3 py-1 text-xs font-bold uppercase">
                        {vehicle.status || 'PENDING'}
                      </Badge>
                      <span className="text-xs text-gray-500 font-semibold">Registered commercial vehicle</span>
                    </div>
                  </Card>

                  {/* Expiry Warning Widget */}
                  <Card className="p-6 border border-amber-200 bg-amber-50/75">
                    <div className="flex gap-3">
                      <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
                      <div>
                        <h4 className="font-bold text-amber-900 text-sm">Compliance Warning</h4>
                        <p className="text-xs text-amber-800 font-medium mt-1">
                          Vehicle insurance expires in 15 days (2026-06-20). Renew immediately to avoid route suspension.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <Card className="p-6">
                <h3 className="text-base font-bold text-gray-900 mb-5">Compliance Documents</h3>
                <div className="divide-y divide-gray-100">
                  {documentList.map((doc, idx) => (
                    <div key={idx} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm text-gray-900">{doc.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Doc ID: {doc.number} • Expiry: {doc.expiry}</p>
                        </div>
                      </div>
                      <Badge
                        variant={doc.status === 'approved' ? 'success' : 'default'}
                        className={`px-2.5 py-0.5 uppercase text-[10px] font-bold ${
                          doc.status === 'pending_expiry' ? 'bg-amber-500 text-white' : ''
                        }`}
                      >
                        {doc.status === 'pending_expiry' ? 'Expires Soon' : doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === 'maintenance' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="p-6">
                    <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-primary-500" />
                      Maintenance Logs
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100 text-sm">
                        <thead>
                          <tr className="text-left text-gray-400 text-xs font-semibold uppercase border-b border-gray-150">
                            <th className="pb-3 pl-2">Service Type</th>
                            <th className="pb-3">Date</th>
                            <th className="pb-3">Mileage</th>
                            <th className="pb-3">Cost</th>
                            <th className="pb-3 text-right font-bold pr-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                          {maintenanceRecords.map((rec) => (
                            <tr key={rec.id}>
                              <td className="py-3.5 pl-2 font-bold text-gray-900">{rec.type}</td>
                              <td className="py-3.5">{rec.date}</td>
                              <td className="py-3.5">{rec.km}</td>
                              <td className="py-3.5 text-gray-900">₹{rec.cost.toLocaleString('en-IN')}</td>
                              <td className="py-3.5 text-right pr-2">
                                <Badge variant="success" className="text-[10px] font-bold px-2 py-0.5">{rec.status}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>

                <div>
                  <Card className="p-6">
                    <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-500" />
                      Service Reminders
                    </h3>
                    <div className="space-y-3.5">
                      {reminderRecords.map((rem) => (
                        <div key={rem.id} className="p-3.5 rounded-xl border border-gray-100 bg-slate-50 flex items-start gap-3">
                          <Wrench className={`w-5 h-5 shrink-0 mt-0.5 ${rem.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
                          <div>
                            <p className="text-xs font-bold text-slate-900">{rem.type}</p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Due Date: {rem.date} • Limit: {rem.kmReminder}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            title="No Assigned Vehicle"
            description="You currently do not have any vehicle assigned to your profile. Please contact fleet management."
            customIcon={<Car className="w-8 h-8 text-gray-400" />}
          />
        )}
      </div>
    </div>
  );
}
