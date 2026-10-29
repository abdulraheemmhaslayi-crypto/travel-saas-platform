import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  Shield, 
  MapPin, 
  User, 
  CreditCard, 
  Eye, 
  Lock, 
  FileText, 
  Smartphone, 
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy - TravelFlow',
  description: 'Understand how TravelFlow collects, uses, and safeguards your personal data, including location tracking and KYC validation.',
  keywords: ['privacy policy', 'data protection', 'location tracking', 'KYC', 'TravelFlow'],
};

export default function PrivacyPolicyPage() {
  const sections = [
    { id: 'introduction', label: '1. Introduction', icon: <Shield className="w-4 h-4" /> },
    { id: 'info-collected', label: '2. Information We Collect', icon: <User className="w-4 h-4" /> },
    { id: 'location-tracking', label: '3. Real-Time Location Tracking', icon: <MapPin className="w-4 h-4" /> },
    { id: 'kyc-data', label: '4. KYC & Vehicle Documents', icon: <FileText className="w-4 h-4" /> },
    { id: 'data-usage', label: '5. How We Use Your Data', icon: <Eye className="w-4 h-4" /> },
    { id: 'data-sharing', label: '6. Data Sharing & Third Parties', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'payments-security', label: '7. Payments & Data Security', icon: <Lock className="w-4 h-4" /> },
    { id: 'your-rights', label: '8. Your Rights & Contacts', icon: <CreditCard className="w-4 h-4" /> },
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
            <Shield className="w-3.5 h-3.5 animate-pulse" />
            <span>Privacy & Security First</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-white">
            Privacy Policy
          </h1>
          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
            Learn how TravelFlow collects, processes, and protects your personal data, and how we handle location tracking and document verification.
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
                  Have questions about our privacy practices?
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
              
              {/* Introduction */}
              <section id="introduction" className="scroll-mt-24">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 rounded-lg bg-primary-50 text-primary-600">
                    <Shield className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">1. Introduction</h2>
                </div>
                <div className="prose prose-slate max-w-none text-gray-600 space-y-4">
                  <p>
                    Welcome to <strong>TravelFlow</strong> ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy governs your use of our SaaS travel platform, website, mobile-responsive screens, and APIs (collectively, the "Services").
                  </p>
                  <p>
                    By registering for an account, accessing, or using our Services, you consent to the practices described in this Privacy Policy. If you do not agree to the terms herein, you should immediately cease the use of our services.
                  </p>
                </div>
              </section>

              {/* Information We Collect */}
              <section id="info-collected" className="scroll-mt-24 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 rounded-lg bg-primary-50 text-primary-600">
                    <User className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">2. Information We Collect</h2>
                </div>
                <div className="prose prose-slate max-w-none text-gray-600 space-y-4">
                  <p>
                    We collect personal information that you provide voluntarily when registering on our platform, setting up your user profile, or booking a trip. The information we collect varies depending on your chosen user type:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>All Users:</strong> Full name, email address, mobile phone number, profile image, and account password.
                    </li>
                    <li>
                      <strong>Passengers:</strong> Payment preferences, travel history, emergency contact numbers, and feedback reviews.
                    </li>
                    <li>
                      <strong>Drivers:</strong> Driver license details, vehicle details (make, model, color, registration number, seating capacity), and operational availability.
                    </li>
                    <li>
                      <strong>Fleet Owners:</strong> Fleet company details, registration credentials, multiple vehicles lists, and employee assignments.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Real-Time Location Tracking */}
              <section id="location-tracking" className="scroll-mt-24 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 rounded-lg bg-red-50 text-red-600">
                    <MapPin className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">3. Real-Time Location Tracking</h2>
                </div>
                <div className="prose prose-slate max-w-none text-gray-600 space-y-4">
                  <p>
                    To enable essential core features of TravelFlow, such as driver matching, routing updates, emergency broadcasts, and real-time navigation status, we must collect precise or approximate geolocation data:
                  </p>
                  <div className="p-4 rounded-xl bg-red-50/50 border border-red-100 text-sm text-red-800 leading-relaxed space-y-2">
                    <p className="font-semibold flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-red-500" /> Geolocation Requirements:
                    </p>
                    <p>
                      - <strong>For Drivers:</strong> We collect real-time location data when the TravelFlow app or browser interface is open and you are marked "online" or executing a scheduled trip.
                    </p>
                    <p>
                      - <strong>For Passengers:</strong> We collect location coordinates when searching for nearby trips, matching with rides, and tracking your active journey.
                    </p>
                  </div>
                  <p>
                    You can manage or disable location sharing through your device or browser settings. However, disabling this will prevent you from tracking active rides, getting accurate matching recommendations, or using live trip-sharing features.
                  </p>
                </div>
              </section>

              {/* KYC and Vehicle Data */}
              <section id="kyc-data" className="scroll-mt-24 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 rounded-lg bg-primary-50 text-primary-600">
                    <FileText className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">4. KYC & Vehicle Documents</h2>
                </div>
                <div className="prose prose-slate max-w-none text-gray-600 space-y-4">
                  <p>
                    For community safety and regulatory compliance, we require background checks and identity verification documents (Know Your Customer or KYC) for service providers:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Drivers & Owners:</strong> Government-issued ID, driver's license scans, vehicle registration documents (RC), and proof of vehicle insurance.
                    </li>
                    <li>
                      <strong>Fleet Owners:</strong> Business registration license, commercial operating permits, and tax identification numbers.
                    </li>
                  </ul>
                  <p>
                    These documents are processed securely, stored under strict encryption rules, and reviewed only by authorized verification staff. They are never shared publicly or exposed in matching screens.
                  </p>
                </div>
              </section>

              {/* How We Use Your Data */}
              <section id="data-usage" className="scroll-mt-24 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 rounded-lg bg-primary-50 text-primary-600">
                    <Eye className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">5. How We Use Your Data</h2>
                </div>
                <div className="prose prose-slate max-w-none text-gray-600 space-y-4">
                  <p>
                    We process your information for purposes based on legitimate business interests, the fulfillment of our contract with you, compliance with legal obligations, and security checks:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Trip Execution:</strong> Match passengers with rides, locate vehicles, compute ETA, and provide route navigation instructions.</li>
                    <li><strong>Financial Transactions:</strong> Process booking payments, handle driver payouts, manage wallet balances, and issue refund receipts.</li>
                    <li><strong>User Notifications:</strong> Send booking updates, alert passengers of driver arrival, notify payout status, and distribute safety alerts.</li>
                    <li><strong>Customer Support:</strong> Resolve disputes, investigate booking issues, address payment errors, and assist with general inquiries.</li>
                  </ul>
                </div>
              </section>

              {/* Data Sharing and Third Parties */}
              <section id="data-sharing" className="scroll-mt-24 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 rounded-lg bg-primary-50 text-primary-600">
                    <Smartphone className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">6. Data Sharing & Third Parties</h2>
                </div>
                <div className="prose prose-slate max-w-none text-gray-600 space-y-4">
                  <p>
                    We do not sell, rent, or trade your personal information. We only share data in the following specific circumstances:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Between Passengers & Drivers:</strong> To facilitate a ride, we share the passenger's first name, pickup location, destination, and avatar image with the driver. We share the driver's name, profile photo, vehicle details, ratings, and phone number with the passenger.
                    </li>
                    <li>
                      <strong>Payment Gateways:</strong> We share necessary credit card, wallet, and billing details with payment providers (Razorpay and Stripe) to process secure payments.
                    </li>
                    <li>
                      <strong>Legal & Safety:</strong> We may share location and user identity details with law enforcement or emergency responders in the event of accidents, safety threats, or legal notices.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Payments and Security */}
              <section id="payments-security" className="scroll-mt-24 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 rounded-lg bg-green-50 text-green-600">
                    <Lock className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">7. Payments & Data Security</h2>
                </div>
                <div className="prose prose-slate max-w-none text-gray-600 space-y-4">
                  <p>
                    Security is central to TravelFlow operations. We implement appropriate technical and organizational security measures:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Encryption:</strong> All data in transit is encrypted using Secure Socket Layer (SSL) protocols, and database fields are encrypted at rest.</li>
                    <li><strong>Payment Compliance:</strong> TravelFlow does not store raw credit card numbers on its servers. All payments are processed through PCI-DSS compliant third-party gateways (Stripe/Razorpay).</li>
                    <li><strong>Access Restrictions:</strong> Only authorized staff with specific administrative privileges can view verified KYC files, audit logs, or system profiles.</li>
                  </ul>
                </div>
              </section>

              {/* Your Rights and Contacts */}
              <section id="your-rights" className="scroll-mt-24 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 rounded-lg bg-primary-50 text-primary-600">
                    <CreditCard className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">8. Your Rights & Contacts</h2>
                </div>
                <div className="prose prose-slate max-w-none text-gray-600 space-y-4">
                  <p>
                    Depending on your location, you may have specific rights regarding your personal information under local regulations. These rights include accessing, modifying, updating, or requesting the deletion of your account records.
                  </p>
                  <p>
                    You can manage your profile, phone number, and preferences directly from the profile settings. To request full deletion of your user records or files, please contact us:
                  </p>
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 text-sm mt-4 space-y-2">
                    <p><strong>Email Support:</strong> privacy@travelflow.com</p>
                    <p><strong>Hotline:</strong> +1 (555) 123-4567</p>
                    <p><strong>Mailing Address:</strong> TravelFlow Security Operations, 100 Innovation Way, Suite 400, Austin, TX 78701</p>
                  </div>
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
