'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Menu,
  Bell,
  MapPin,
  Truck,
  Plus,
  RefreshCw,
  Search,
  ChevronRight,
  ChevronLeft,
  X,
  Layers,
  IndianRupee,
  TrendingUp,
  HelpCircle,
  FileText,
  Shield,
  Eye,
  Edit,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  Users,
  Car,
  Zap,
  Wind,
  Wifi,
  Fuel,
  Settings2,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type VehicleTab = 'all' | 'types' | 'approval' | 'maintenance' | 'verification';

export interface FleetVehiclesMobileProps {
  user: any;
  unreadCount: number;
  vehicles: any[];
  vehicleStats?: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    suspended: number;
  } | null;
  currentTab: VehicleTab;
  setCurrentTab: (tab: VehicleTab) => void;
  isLoading: boolean;
  onRefresh: () => void;
  onAddVehicle: () => void;
  onViewDetails: (vehicle: any) => void;
  onEditVehicle: (vehicle: any) => void;
  onDeleteVehicle?: (vehicle: any) => void;
}

export default function FleetVehiclesMobile({
  user,
  unreadCount,
  vehicles,
  vehicleStats,
  currentTab,
  setCurrentTab,
  isLoading,
  onRefresh,
  onAddVehicle,
  onViewDetails,
  onEditVehicle,
  onDeleteVehicle,
}: FleetVehiclesMobileProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // User initials for top avatar (e.g. "RS")
  const initials = useMemo(() => {
    const f = user?.firstName?.[0] || 'R';
    const l = user?.lastName?.[0] || 'S';
    return `${f}${l}`.toUpperCase();
  }, [user]);

  // Vehicle Stats calculations
  const totalVehicles = vehicleStats?.total ?? vehicles.length;
  const approvedVehicles = vehicleStats?.approved ?? vehicles.filter(
    (v) => (v.status || v.approvalStatus || '').toLowerCase() === 'approved' || (v.status || v.approvalStatus || '').toLowerCase() === 'active'
  ).length;
  const pendingVehicles = vehicleStats?.pending ?? vehicles.filter(
    (v) => (v.status || v.approvalStatus || '').toLowerCase() === 'pending'
  ).length;
  const rejectedVehicles = (vehicleStats?.rejected ?? 0) + (vehicleStats?.suspended ?? 0) || vehicles.filter(
    (v) => {
      const s = (v.status || v.approvalStatus || '').toLowerCase();
      return s === 'rejected' || s === 'suspended';
    }
  ).length;

  // Tabs List matching app design
  const tabsList: { id: VehicleTab; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Vehicles', icon: <Car className="w-3.5 h-3.5" /> },
    { id: 'types', label: 'By Type', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'approval', label: 'Approval Status', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Settings2 className="w-3.5 h-3.5" /> },
    { id: 'verification', label: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  // Filtering based on tab and search
  const filteredVehicles = useMemo(() => {
    let list = [...vehicles];

    if (currentTab === 'approval') {
      // Sort with pending first
      list.sort((a, b) => {
        const order: Record<string, number> = { pending: 0, rejected: 1, suspended: 2, approved: 3, active: 3 };
        return (order[(a.status || '').toLowerCase()] ?? 9) - (order[(b.status || '').toLowerCase()] ?? 9);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((v) => {
        const name = `${v.make || v.brand || ''} ${v.model || ''}`.toLowerCase();
        const reg = (v.registrationNumber || '').toLowerCase();
        const type = (v.type || '').toLowerCase();
        return name.includes(q) || reg.includes(q) || type.includes(q);
      });
    }

    return list;
  }, [vehicles, currentTab, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredVehicles.length / pageSize) || 1;
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVehicles.slice(start, start + pageSize);
  }, [filteredVehicles, currentPage, pageSize]);

  // Grouped vehicles by type for the 'types' tab
  const groupedByType = useMemo(() => {
    const groups: Record<string, any[]> = {};
    vehicles.forEach((v) => {
      const rawType = v.type || v.vehicle?.type || 'sedan';
      const t = rawType.toLowerCase() === 'unknown' ? 'sedan' : rawType.toLowerCase();
      if (!groups[t]) groups[t] = [];
      groups[t].push(v);
    });
    return groups;
  }, [vehicles]);

  const getStatusBadge = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s === 'approved' || s === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Approved
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Pending
        </span>
      );
    }
    if (s === 'suspended') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
          <AlertTriangle className="w-3 h-3 text-orange-600" />
          Suspended
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3 h-3 text-rose-600" />
        {status || 'Rejected'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] pb-24 text-slate-800">
      {/* ─── Top Header Bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-1.5 -ml-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 text-slate-800" />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-[#4F46E5] flex items-center justify-center text-white shadow-sm">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900">
              Kokan Travel
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/notifications"
            className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/dashboard/profile"
            className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors shadow-sm"
          >
            {initials}
          </Link>
        </div>
      </header>

      {/* ─── Main Content Container ────────────────────────────────── */}
      <main className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Banner Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/60 to-purple-100/50 p-4 border border-purple-100/60 shadow-sm">
          <div className="relative z-10 max-w-[70%]">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Vehicles</h1>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Manage your fleet vehicles and specifications.
            </p>
          </div>

                    {/* Decorative Modern Car Graphic */}
          <div className="absolute -right-2 bottom-0 opacity-95 pointer-events-none">
            <div className="relative w-32 h-14 flex items-end justify-end">
              <img
                src="/images/banner-car.png"
                alt="Fleet Vehicle"
                className="w-auto h-full max-h-13 object-contain drop-shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons: Refresh & Add Vehicle */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white border border-slate-200/80 shadow-sm text-slate-700 text-xs font-bold hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-slate-600', isLoading && 'animate-spin')} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onAddVehicle}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#4F46E5] text-white shadow-sm shadow-indigo-200 text-xs font-bold hover:bg-[#4338CA] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Vehicle</span>
          </button>
        </div>

        {/* ─── 4 Stat Cards Grid (2x2) ─────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Total Vehicles */}
          <div className="bg-white rounded-2xl p-3.5 border border-purple-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <Car className="w-5 h-5 text-[#4F46E5]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                TOTAL VEHICLES
              </p>
              <p className="text-xl font-bold text-slate-900 leading-tight">
                {totalVehicles}
              </p>
            </div>
          </div>

          {/* Approved / Active */}
          <div className="bg-white rounded-2xl p-3.5 border border-emerald-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                APPROVED
              </p>
              <p className="text-xl font-bold text-emerald-600 leading-tight">
                {approvedVehicles}
              </p>
            </div>
          </div>

          {/* Pending Approval */}
          <div className="bg-white rounded-2xl p-3.5 border border-amber-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                PENDING
              </p>
              <p className="text-xl font-bold text-amber-600 leading-tight">
                {pendingVehicles}
              </p>
            </div>
          </div>

          {/* Rejected / Suspended */}
          <div className="bg-white rounded-2xl p-3.5 border border-rose-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                REJECTED
              </p>
              <p className="text-xl font-bold text-rose-600 leading-tight">
                {rejectedVehicles}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Scrollable Pill Tabs ─────────────────────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
          {tabsList.map((tab) => {
            const isSelected = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCurrentTab(tab.id);
                  setCurrentPage(1);
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm',
                  isSelected
                    ? 'bg-[#4F46E5] text-white shadow-indigo-200'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar for Quick lookup */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by model, make or plate..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ─── Types Tab Specific View ─────────────────────────────── */}
        {currentTab === 'types' ? (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Vehicles by Type</h2>
            {Object.keys(groupedByType).length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm">
                <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No vehicles categorized yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {Object.entries(groupedByType).map(([type, list]) => {
                  const approved = list.filter(
                    (v) => (v.status || v.approvalStatus || '').toLowerCase() === 'approved' || (v.status || v.approvalStatus || '').toLowerCase() === 'active'
                  ).length;
                  const pending = list.filter(
                    (v) => (v.status || v.approvalStatus || '').toLowerCase() === 'pending'
                  ).length;
                  return (
                    <div
                      key={type}
                      className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-[#4F46E5]">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-slate-900 capitalize">{type}</h3>
                            <p className="text-[11px] text-slate-400">{list.length} vehicle{list.length > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#4F46E5] bg-indigo-50 px-2 py-0.5 rounded-full">
                          {list.length} total
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <p className="font-bold text-slate-800 text-sm">{list.length}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">Total</p>
                        </div>
                        <div className="bg-emerald-50 p-2 rounded-xl">
                          <p className="font-bold text-emerald-700 text-sm">{approved}</p>
                          <p className="text-[10px] text-emerald-600 font-semibold">Approved</p>
                        </div>
                        <div className="bg-amber-50 p-2 rounded-xl">
                          <p className="font-bold text-amber-700 text-sm">{pending}</p>
                          <p className="text-[10px] text-amber-600 font-semibold">Pending</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ─── Vehicle Cards List ──────────────────────────────────── */
          <div className="space-y-3">
            <div className="flex items-center justify-between pt-1">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Fleet Vehicles</h2>
                <p className="text-[11px] text-slate-400">
                  {currentTab === 'all'
                    ? 'Active vehicle roster'
                    : currentTab === 'approval'
                    ? 'Review approval & verification'
                    : currentTab === 'maintenance'
                    ? 'Service and readiness'
                    : 'Vehicle documents'}
                </p>
              </div>
              <button
                onClick={onAddVehicle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-[#4F46E5] text-xs font-bold hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {paginatedVehicles.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                  <Car className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">No vehicles found</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    {searchQuery
                      ? 'No vehicle matched your search criteria.'
                      : 'Add your first vehicle to start organizing routes and trips.'}
                  </p>
                </div>
                {!searchQuery && (
                  <button
                    onClick={onAddVehicle}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4F46E5] text-white text-xs font-bold hover:bg-[#4338CA] shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Vehicle</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedVehicles.map((vehicle) => {
                  const brand = vehicle.make || vehicle.brand || 'Vehicle';
                  const model = vehicle.model || '';
                  const plate = vehicle.registrationNumber || 'No Plate';
                  const type = vehicle.type || 'Sedan';
                  const seating = vehicle.seatingCapacity || vehicle.capacity || 4;
                  const fuel = vehicle.fuelType || 'Petrol';
                  const transmission = vehicle.transmission || 'Manual';

                  return (
                    <div
                      key={vehicle.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3 transition-all hover:shadow-md"
                    >
                      {/* Top Row: Type & Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F46E5] bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          {type}
                        </span>
                        {getStatusBadge(vehicle.status || vehicle.approvalStatus)}
                      </div>

                      {/* Middle Row: Name & Plate */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 leading-snug capitalize">
                            {brand} {model}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {plate}
                            </span>
                            {vehicle.color && (
                              <span className="text-[11px] text-slate-500 capitalize">
                                • {vehicle.color}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Thumbnail or Icon */}
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {vehicle.vehicleImage ? (
                            <img
                              src={vehicle.vehicleImage}
                              alt={brand}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Truck className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Specs Mini Bar */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2.5 rounded-xl text-center">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">SEATS</p>
                          <p className="text-xs font-bold text-slate-800">{seating} Seats</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">FUEL</p>
                          <p className="text-xs font-bold text-slate-800 capitalize">{fuel}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">GEAR</p>
                          <p className="text-xs font-bold text-slate-800 capitalize">{transmission}</p>
                        </div>
                      </div>

                      {/* Amenities Row if any */}
                      {(vehicle.hasAC || vehicle.hasWifi || vehicle.hasCharging) && (
                        <div className="flex items-center gap-3 pt-0.5 text-[11px] text-slate-500 font-medium">
                          {vehicle.hasAC && (
                            <span className="flex items-center gap-1">
                              <Wind className="w-3.5 h-3.5 text-cyan-600" /> AC
                            </span>
                          )}
                          {vehicle.hasWifi && (
                            <span className="flex items-center gap-1">
                              <Wifi className="w-3.5 h-3.5 text-blue-600" /> Wi-Fi
                            </span>
                          )}
                          {vehicle.hasCharging && (
                            <span className="flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5 text-amber-500" /> USB
                            </span>
                          )}
                        </div>
                      )}

                      {/* Documents / Compliance Notice if rejection */}
                      {(vehicle.rejectionReason || vehicle.suspensionReason) && (
                        <div className="bg-rose-50 text-rose-700 text-[11px] p-2.5 rounded-xl border border-rose-100 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Notice:</strong> {vehicle.rejectionReason || vehicle.suspensionReason}
                          </span>
                        </div>
                      )}

                      {/* Action Buttons Row */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => onViewDetails(vehicle)}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Details</span>
                        </button>

                        <button
                          onClick={() => onEditVehicle(vehicle)}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#4F46E5] text-white text-xs font-bold hover:bg-[#4338CA] transition-colors shadow-sm"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit Specs</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-3 pb-2 flex flex-col items-center gap-2">
                <p className="text-[11px] text-slate-500 font-semibold">
                  Showing {(currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, filteredVehicles.length)} of{' '}
                  {filteredVehicles.length} results
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                    aria-label="First page"
                  >
                    «
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="w-8 h-8 rounded-lg bg-[#4F46E5] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {currentPage}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                    aria-label="Last page"
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── Slide-over Drawer Menu ─────────────────────────────────── */}
      {isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed top-0 bottom-0 left-0 w-[280px] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#4F46E5] flex items-center justify-center text-white">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="font-bold text-base text-slate-900">Kokan Travel</span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#4F46E5] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Fleet Owner'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || 'fleet@kokan.com'}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1 text-xs font-semibold text-slate-700">
              <Link
                href="/dashboard/fleet-owner"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Dashboard Overview</span>
              </Link>
              <Link
                href="/dashboard/fleet-owner/trips"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Manage Trips</span>
              </Link>
              <Link
                href="/dashboard/fleet-owner/vehicles"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-50 text-[#4F46E5]"
              >
                <Car className="w-4 h-4 text-[#4F46E5]" />
                <span>Fleet Vehicles</span>
              </Link>
              <Link
                href="/dashboard/fleet-owner/drivers"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Users className="w-4 h-4 text-slate-500" />
                <span>Driver Management</span>
              </Link>
              <Link
                href="/dashboard/fleet-owner/earnings"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <IndianRupee className="w-4 h-4 text-slate-500" />
                <span>Revenue & Earnings</span>
              </Link>
              <Link
                href="/dashboard/fleet-owner/analytics"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <TrendingUp className="w-4 h-4 text-slate-500" />
                <span>Fleet Analytics</span>
              </Link>
              <Link
                href="/dashboard/support"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <span>Support Tickets</span>
              </Link>
              <Link
                href="/dashboard/profile"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>Account Profile & KYC</span>
              </Link>
            </div>

            <div className="p-3 border-t border-slate-100 text-center text-[10px] text-slate-400 font-semibold">
              Kokan Travel Operator Portal v2.0
            </div>
          </div>
        </>
      )}
    </div>
  );
}
