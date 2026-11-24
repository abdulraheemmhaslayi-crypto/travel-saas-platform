'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Menu, MapPin, Bell, Filter, Ticket, Folder, Clock, 
  CheckCircle2, Plus, AlertCircle, ChevronRight, MessageSquare, 
  Search, X 
} from 'lucide-react';
import { useAuthStore } from '@/store/slices/authSlice';
import { SupportTicket, TicketStatus, TicketPriority, TicketCategory } from '@/types/support';
import { formatDateTime, cn } from '@/lib/utils';
import Loading from '@/components/common/Loading';

interface SupportTicketsMobileProps {
  tickets: SupportTicket[];
  filters: any;
  totalCount: number;
  isLoading: boolean;
  showFilters: boolean;
  setShowFilters: (val: boolean) => void;
  handleFilterChange: (key: string, value: string) => void;
  setShowCreateModal: (val: boolean) => void;
  onOpenSidebar?: () => void;
}

export default function SupportTicketsMobile({
  tickets,
  filters,
  totalCount,
  isLoading,
  showFilters,
  setShowFilters,
  handleFilterChange,
  setShowCreateModal,
}: SupportTicketsMobileProps) {
  const { user } = useAuthStore();
  const initials = user?.firstName
    ? `${user.firstName.charAt(0)}${user.lastName ? user.lastName.charAt(0) : ''}`.toUpperCase()
    : 'RS';

  // KPI Calculations
  const openCount = tickets.filter((t) => t.status === TicketStatus.OPEN).length;
  const inProgressCount = tickets.filter((t) => t.status === TicketStatus.IN_PROGRESS).length;
  const resolvedCount = tickets.filter((t) => t.status === TicketStatus.RESOLVED).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-900">
      {/* ── 1. Top App Bar matching Kokan Travel header ──────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-2xs">
        {/* Left: Menu Hamburger + Kokan Travel Logo */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-all"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </button>

          <Link href="/dashboard/fleet-owner" className="flex items-center gap-2 active:scale-95 transition-transform">
            <div className="w-7 h-7 rounded-full bg-[#4F46E5] flex items-center justify-center text-white shadow-xs shrink-0">
              <MapPin className="w-4 h-4 fill-white text-[#4F46E5]" />
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">Kokan Travel</span>
          </Link>
        </div>

        {/* Right: Notifications Bell + User Avatar */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/notifications"
            className="relative w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 active:scale-90 transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 stroke-[2]" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              5
            </span>
          </Link>

          <Link
            href="/dashboard/profile"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/90 flex items-center justify-center text-[11px] font-bold text-slate-700 active:scale-90 transition-all"
            aria-label="User Profile"
          >
            {initials}
          </Link>
        </div>
      </header>

      {/* ── 2. Hero Header Banner (Gradient with Customer Headset Illustration) ─ */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#7C3AED] p-4 text-white shadow-xs border border-indigo-400/30">
          <div className="relative z-10 max-w-[70%]">
            <h1 className="text-xl font-bold text-white tracking-tight leading-tight">
              Support Tickets
            </h1>
            <p className="text-xs text-indigo-100 mt-1 leading-relaxed font-normal">
              Manage your support requests and track their status.
            </p>
          </div>

          {/* Customer Support Headset with Speech Bubble Illustration */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-95 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20 shadow-inner">
              <svg 
                className="w-10 h-10 text-white drop-shadow-sm" 
                viewBox="0 0 40 40" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                {/* Headset Band */}
                <path d="M8 20a12 12 0 0 1 24 0v5" />
                {/* Ear Cups */}
                <rect x="5" y="19" width="5" height="9" rx="2.5" fill="white" stroke="none" />
                <rect x="30" y="19" width="5" height="9" rx="2.5" fill="white" stroke="none" />
                {/* Mic Extension */}
                <path d="M30 25c0 4-3 7-8 7h-2" strokeWidth="2.2" />
                <circle cx="18" cy="32" r="2" fill="white" stroke="none" />
                {/* Speech Bubble */}
                <rect x="23" y="10" width="13" height="9" rx="3" fill="white" stroke="none" />
                <path d="M26 19l-2 3v-3h2z" fill="white" stroke="none" />
                {/* Three dots in speech bubble */}
                <circle cx="26" cy="14.5" r="1" fill="#4F46E5" stroke="none" />
                <circle cx="29.5" cy="14.5" r="1" fill="#4F46E5" stroke="none" />
                <circle cx="33" cy="14.5" r="1" fill="#4F46E5" stroke="none" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Filters Control Bar ────────────────────────────────────────── */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">Filters</h2>
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </button>
        </div>

        {/* Expandable Filters Card */}
        {showFilters && (
          <div className="mt-2.5 p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:border-[#4F46E5] focus:outline-hidden"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Priority
                </label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:border-[#4F46E5] focus:outline-hidden"
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tickets by subject..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#4F46E5] focus:outline-hidden"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. 2x2 KPI Metric Cards matching screenshot ───────────────────── */}
      <div className="px-4 py-1">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: TOTAL TICKETS */}
          <div className="bg-[#FAF8FF] border border-purple-100 rounded-2xl p-3 flex items-center gap-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#4F46E5] flex items-center justify-center shrink-0">
              <Ticket className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                TOTAL TICKETS
              </p>
              <p className="text-xl font-bold text-slate-900 leading-tight mt-0.5">
                {totalCount || tickets.length}
              </p>
            </div>
          </div>

          {/* Card 2: OPEN */}
          <div className="bg-[#F0F9FF] border border-sky-100 rounded-2xl p-3 flex items-center gap-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <Folder className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                OPEN
              </p>
              <p className="text-xl font-bold text-sky-600 leading-tight mt-0.5">
                {openCount}
              </p>
            </div>
          </div>

          {/* Card 3: IN PROGRESS */}
          <div className="bg-[#FFFDF0] border border-amber-100 rounded-2xl p-3 flex items-center gap-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                IN PROGRESS
              </p>
              <p className="text-xl font-bold text-amber-600 leading-tight mt-0.5">
                {inProgressCount}
              </p>
            </div>
          </div>

          {/* Card 4: RESOLVED */}
          <div className="bg-[#F0FDF4] border border-emerald-100 rounded-2xl p-3 flex items-center gap-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                RESOLVED
              </p>
              <p className="text-xl font-bold text-emerald-600 leading-tight mt-0.5">
                {resolvedCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Main Content Area: Empty State or Ticket Cards ─────────────── */}
      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="py-12">
            <Loading text="Loading support tickets..." />
          </div>
        ) : tickets.length === 0 ? (
          /* Empty State Illustration Matching Screenshot */
          <div className="py-8 text-center space-y-4">
            {/* 3D Ticket Graphic Illustration */}
            <div className="relative w-44 h-36 mx-auto flex items-center justify-center">
              {/* Soft purple glow backdrop */}
              <div className="absolute w-36 h-36 rounded-full bg-purple-100/60 blur-xl" />

              {/* Radial Burst / Motion Rays */}
              <div className="absolute -top-1 left-7 w-1 h-3.5 bg-indigo-500 rounded-full rotate-[-45deg]" />
              <div className="absolute -top-3 left-16 w-1 h-3.5 bg-indigo-500 rounded-full" />
              <div className="absolute -top-1 right-18 w-1 h-3.5 bg-indigo-500 rounded-full rotate-[45deg]" />

              {/* 3D Tickets Isometric SVG */}
              <svg viewBox="0 0 160 120" fill="none" className="w-40 h-32 relative z-10 drop-shadow-md">
                {/* Back Ticket (Purple shadow / depth) */}
                <g transform="rotate(-6 80 60)">
                  <rect x="24" y="30" width="112" height="52" rx="10" fill="#818CF8" />
                  <circle cx="24" cy="56" r="6" fill="#F8FAFC" />
                  <circle cx="136" cy="56" r="6" fill="#F8FAFC" />
                  <line x1="50" y1="36" x2="50" y2="76" stroke="#C7D2FE" strokeWidth="2" strokeDasharray="3 3" />
                </g>

                {/* Front Ticket (White 3D Embossed Ticket) */}
                <g transform="rotate(6 80 60)">
                  <rect x="24" y="38" width="112" height="52" rx="10" fill="#FFFFFF" stroke="#E0E7FF" strokeWidth="2" />
                  <rect x="25" y="39" width="110" height="50" rx="9" fill="url(#ticketGlow)" />
                  <circle cx="24" cy="64" r="6" fill="#F8FAFC" stroke="#E0E7FF" strokeWidth="1.5" />
                  <circle cx="136" cy="64" r="6" fill="#F8FAFC" stroke="#E0E7FF" strokeWidth="1.5" />
                  <line x1="50" y1="44" x2="50" y2="84" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="3 3" />
                  <rect x="60" y="52" width="56" height="8" rx="4" fill="#F1F5F9" />
                  <rect x="60" y="66" width="36" height="6" rx="3" fill="#F1F5F9" />
                </g>

                <defs>
                  <linearGradient id="ticketGlow" x1="24" y1="38" x2="136" y2="90" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFFFFF" />
                    <stop offset="1" stopColor="#F8FAFC" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Typography */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                No tickets found
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-1">
                Create your first support ticket to get started.
              </p>
            </div>

            {/* Create Ticket Primary Button */}
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="h-12 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-sm px-8 shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 mx-auto active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Ticket</span>
            </button>
          </div>
        ) : (
          /* When tickets exist, render clean mobile ticket list */
          <div className="space-y-3 pb-4">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Your Tickets ({tickets.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#4F46E5] hover:underline"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New Ticket</span>
              </button>
            </div>

            {tickets.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/support/${t.id}`}
                className="block bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:border-indigo-300 transition-all active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] font-bold text-slate-400">
                        #{t.ticketNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                        {String(t.category || '').toLowerCase().replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 truncate">
                      {t.subject}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase',
                        t.status === TicketStatus.OPEN && 'bg-blue-50 text-blue-700 border border-blue-200',
                        t.status === TicketStatus.IN_PROGRESS && 'bg-amber-50 text-amber-700 border border-amber-200',
                        t.status === TicketStatus.RESOLVED && 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                        t.status === TicketStatus.CLOSED && 'bg-slate-100 text-slate-700 border border-slate-200'
                      )}
                    >
                      {t.status.replace(/_/g, ' ')}
                    </span>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {t.priority}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium">
                    {formatDateTime(t.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
