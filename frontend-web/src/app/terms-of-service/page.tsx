import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  FileText, 
  Users, 
  Calendar, 
  RefreshCcw, 
  HeartHandshake, 
  Wallet, 
  AlertTriangle, 
  Scale, 
  ArrowRight
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service - TravelFlow',
  description: 'Review the Terms of Service for TravelFlow, covering registration, bookings, safety policies, payouts, and cancellations.',
  keywords: ['terms of service', 'user agreement', 'cancellation policy', 'refunds', 'TravelFlow'],
};

export default function TermsOfServicePage() {
  const sections = [
    { id: 'acceptance', label: '1. Acceptance of Terms', icon: <FileText className="w-4 h-4" /> },
    { id: 'user-roles', label: '2. User Roles & Accounts', icon: <Users className="w-4 h-4" /> },
    { id: 'bookings-fares', label: '3. Bookings & Fares', icon: <Calendar className="w-4 h-4" /> },
    { id: 'cancellation-policy', label: '4. Cancellation & Refunds', icon: <RefreshCcw className="w-4 h-4" /> },
    { id: 'conduct-safety', label: '5. Conduct & Safety Rules', icon: <HeartHandshake className="w-4 h-4" /> },
    { id: 'wallet-payments', label: '6. Wallet & Payments', icon: <Wallet className="w-4 h-4" /> },
    { id: 'liability-limits', label: '7. Limitation of Liability', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'disputes-law', label: '8. Governing Law & Disputes', icon: <Scale className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Navbar />

      {/* Page Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-primary-950 to-gray-900 text-white overflow-hidden py-16 sm:py-20 px-4">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary-500/15 text-primary-300 border border-primary-500/35 mb-4 backdrop-blur-sm">
            <FileText className="w-3.5 h-3.5" />
            <span>Platform User Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-white">
            Terms of Service
          </h1>
          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
            Please read these terms carefully before accessing or using our travel matching, seat reservation, and wallet payout services.
          </p>
          <div className="mt-6 text-sm text-gray-400 font-medium">
            Last Updated: June 6, 2026
          </div>
        </div>
      </section>

      {/* Main content split page */}
      <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 px-2">
                Table of Contents
              </h2>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50/50 transition-all duration-150 group"
                  >
                    <span className="text-gray-400 group-hover:text-primary-500 transition-colors">
                      {section.icon}
                    </span>
                    <span>{section.label}</span>
                  </a>
                ))}
              </nav>
              <div className="mt-6 pt-5 border-t border-gray-100 px-2">
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                  Need clarification on user policies?
                </p>
                <Link 
                  href="/dashboard/support"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Contact Support <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </aside>

          {/* Policy Document Body */}
          <main className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-10 shadow-sm space-y-12">
              
              {/* Acceptance of Terms */}
              <section id="acceptance" className="scroll-mt-24">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 rounded-lg bg-primary-50 text-primary-600">
                    <FileText className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">1. Acceptance of Terms</h2>
                </div>
                <div className="prose prose-slate max-w-none text-gray-600 space-y-4">
                  <p>
                    By creating an account, logging into, or using the <strong>TravelFlow</strong> platform and services, you agree to comply with and be legally bound by these Terms of Service ("Terms"). These terms establish a contractual relationship between you and TravelFlow.
                  </p>
                  <p>
                    If you do not agree to these terms, you are not authorized to use the platform. We reserve the right to revise or amend these Terms at any time, with modifications becoming effective immediately upon posting. Your continued use of the Services after revisions indicates your acceptance of the new terms.
                  </p>
                </div>
              </section>

              {/* User Roles & Accounts */}
              <section id="user-roles" className="scroll-mt-24 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 rounded-lg bg-primary-50 text-primary-600">
                    <Users className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">2. User Roles & Accounts</h2>
                </div>
                <div className="prose prose-slate max-w-none text-gray-600 space-y-4">
                  <p>
                    TravelFlow is a multi-sided platform where users register under specific profiles:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Passengers:</strong> Users booking rides, selecting vehicle seats, and paying for journeys.
                    </li>
                    <li>
                      <strong>Drivers:</strong> Independent service providers operating registered vehicles to transport Passengers.
                    </li>
                    <li>
                      <strong>Fleet Owners / Vehicle Owners:</strong> Operators who register and manage multiple vehicles and assign drivers to service routes.
                    </li>
                  </ul>
                  <p>
                    You agree to provide true, accurate, and complete registration data. You are solely responsible for maintaining the confidentiality of your account credentials. Accounts are non-transferable without written authorization.
                  </p>
                </div>
              </section>

              {/* Bookings & Fares */}
              <section id="bookings-fares" className="scroll-mt-24 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 rounded-lg bg-primary-50 text-primary-600">
                    <Calendar className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">3. Bookings & Fares</h2>
                </div>
                <div className="prose prose-slate max-w-none text-gray-600 space-y-4">
                  <p>
                    Passengers can search for available trips between listed cities, choose seat count layout options, and place bookings.
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Fare Calculations:</strong> Fares are computed dynamically based on travel distance, vehicle type selection (Sedan, SUV, Hatchback, Bus, Luxury), toll fees, and base city pricing.
                    </li>
                    <li>
                      <strong>Seat Reservations:</strong> Bookings are finalized only upon payment confirmation by payment processor partners.
                    </li>
                    <li>
                      <strong>Service Limitations:</strong> TravelFlow acts as a matching agent and does not guarantee vehicle availability on every requested route.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Cancellation & Refunds */}
              <section id="cancellation-policy" className="scroll-mt-24 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 rounded-lg bg-red-50 text-red-600">
                    <RefreshCcw className="w-5 h-5 animate-spin-slow" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">4. Cancellation & Refunds</h2>
                </div>
                <div className="prose prose-slate max-w-none text-gray-600 space-y-4">
                  <p>
                    We maintain clear guidelines for canceling trips to ensure fairness for both passengers and drivers:
                  </p>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-700 leading-relaxed space-y-2">
                    <p>
                      - <strong>Passenger Cancellations:</strong> If canceled more than 24 hours prior to departure, a full refund (minus minimal payment processing fees) is credited to the user's TravelFlow Wallet. If canceled within 24 hours of departure, cancellation penalties apply.
                    </p>
                    <p>
                      - <strong>Driver Cancellations:</strong> If a driver cancels a scheduled trip, affected passengers receive a full 100% refund to their wallets, and TravelFlow staff will prioritize matching them with alternative rides.
                    </p>
                    <p>
                      - <strong>No-Show:</strong> Failure of the passenger to arrive at the designated pickup spot within 15 minutes of departure time is treated as a passenger cancellation without a refund.
                    </p>
                  </div>
                </div>
              </section>

              {/* Conduct & Safety Rules */}
              <section id="conduct-safety" className="scroll-mt-24 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 rounded-lg bg-primary-50 text-primary-600">
                    <HeartHandshake className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">5. Conduct & Safety Rules</h2>
                </div>
                <div className="prose prose-slate max-w-none text-gray-600 space-y-4">
                  <p>
                    We require standard community behavior to preserve safety and quality across our network:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Compliance with Law:</strong> Drivers must hold valid license credentials and satisfy all local transportation requirements. Vehicles must be fully operational and properly insured.
                    </li>
                    <li>
                      <strong>Professional Conduct:</strong> Professional behaviour is expected. Physical aggression, harassment, verbal abuse, or operating under the influence of alcohol or drugs results in immediate account termination.
                    </li>
                    <li>
                      <strong>Emergency Broadcast:</strong> In the event of safety threats or accidents during an active trip, users can trigger the Emergency Alert button to broadcast vehicle locations to security teams.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Wallet & Payments */}
              <section id="wallet-payments" className="scroll-mt-24 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 rounded-lg bg-green-50 text-green-600">
                    <Wallet className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">6. Wallet & Payments</h2>
                </div>
                <div className="prose prose-slate max-w-none text-gray-600 space-y-4">
                  <p>
                    TravelFlow incorporates Razorpay, Stripe, and a digital platform wallet for transactions:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Wallet Load:</strong> Users can pre-fund their TravelFlow wallets to enable one-click booking checkouts. Wallet balances are non-transferable between accounts.
                    </li>
                    <li>
                      <strong>Driver Payouts:</strong> Earnings from executed rides are tracked in real-time. Payout cycles run weekly or according to thresholds, sending funds to verified bank accounts.
                    </li>
                    <li>
                      <strong>Taxes & Commission:</strong> TravelFlow deducts a platform service commission percentage from each booked trip before issuing driver payouts.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section id="liability-limits" className="scroll-mt-24 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                    <AlertTriangle className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">7. Limitation of Liability</h2>
                </div>
                <div className="prose prose-slate max-w-none text-gray-600 space-y-4">
                  <p>
                    TravelFlow acts as an intermediary platform matching passengers and drivers. We do not inspect every individual journey or supervise driver operations in real-time.
                  </p>
                  <p>
                    To the maximum extent permitted by law, TravelFlow shall not be held liable for direct, indirect, incidental, or consequential damages arising from:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>The conduct, delays, actions, or omissions of independent drivers or passengers.</li>
                    <li>Loss, theft, or damage of personal belongings during trips.</li>
                    <li>Internet connection failures, server maintenance down-times, or location tracking coordinates inaccuracies.</li>
                  </ul>
                </div>
              </section>

              {/* Governing Law & Disputes */}
              <section id="disputes-law" className="scroll-mt-24 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 rounded-lg bg-primary-50 text-primary-600">
                    <Scale className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">8. Governing Law & Disputes</h2>
                </div>
                <div className="prose prose-slate max-w-none text-gray-600 space-y-4">
                  <p>
                    These Terms are governed by and construed in accordance with the laws of the State of Delaware (or local state laws where TravelFlow entity is officially registered), without regard to conflict of law principles.
                  </p>
                  <p>
                    Any dispute, controversy, or claim arising out of these Terms or use of the Services shall be resolved in first instance through amicable negotiation with our customer support teams. If unresolved, disputes shall be submitted to binding arbitration in accordance with standard arbitration rules.
                  </p>
                  <p>
                    For questions, legal notices, or queries regarding these Terms, contact our policy officers at <strong>legal@travelflow.com</strong>.
                  </p>
                </div>
              </section>

            </div>
          </main>
          
        </div>
      </div>

      <Footer />
    </div>
  );
}
