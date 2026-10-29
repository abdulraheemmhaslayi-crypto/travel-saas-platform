import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Search,
  Shield,
  Clock,
  CreditCard,
  Star,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Footer from '@/components/layout/Footer';

export default function HomePage() {
  const features = [
    {
      icon: <Search className="w-6 h-6 text-primary-600" />,
      title: 'Easy Search',
      description: 'Find trips between cities with advanced filters and real-time availability.',
    },
    {
      icon: <Shield className="w-6 h-6 text-primary-600" />,
      title: 'Secure Booking',
      description: 'Book with confidence using our secure payment system and verified drivers.',
    },
    {
      icon: <Clock className="w-6 h-6 text-primary-600" />,
      title: 'Real-time Tracking',
      description: 'Track your trip in real-time and share your location with loved ones.',
    },
    {
      icon: <CreditCard className="w-6 h-6 text-primary-600" />,
      title: 'Flexible Payments',
      description: 'Pay with Stripe, Razorpay, or use your wallet for seamless transactions.',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Frequent Traveler',
      content: 'TravelFlow has made my weekly commute so much easier. The booking process is seamless!',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      role: 'Business Traveler',
      content: 'Reliable service with great drivers. The real-time tracking gives me peace of mind.',
      rating: 5,
    },
    {
      name: 'Priya Sharma',
      role: 'Student',
      content: 'Affordable prices and easy booking. Perfect for students traveling between cities.',
      rating: 4,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-8 h-8" />
              <span className="text-2xl font-bold">TravelFlow</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Travel Smarter, <br />
              <span className="text-primary-200">Not Harder</span>
            </h1>

            <p className="text-lg sm:text-xl text-primary-100 mb-8 max-w-2xl">
              Book intercity trips with verified drivers, track your journey in real-time,
              and enjoy a seamless travel experience.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard/trips/search">
                <Button variant="ghost" size="lg" className="text-white hover:bg-white/10 border border-white/30">
                  Search Trips
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-6 mt-12 text-sm text-primary-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>10,000+ Trips</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>500+ Drivers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>50+ Cities</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose TravelFlow?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We provide a complete travel solution with safety, convenience, and affordability at its core.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Book your trip in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Search', description: 'Enter your origin, destination, and travel date.' },
              { step: '02', title: 'Book', description: 'Choose your preferred trip and select your seats.' },
              { step: '03', title: 'Travel', description: 'Pay securely and track your trip in real-time.' },
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-200 -z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Travelers Say</h2>
            <p className="text-lg text-gray-600">Trusted by thousands of happy travelers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < testimonial.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                        }`}
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">{testimonial.content}</p>
                <div>
                  <p className="font-medium text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg text-primary-100 mb-8">
            Join thousands of travelers who trust TravelFlow for their intercity travel needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
                Create Free Account
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="lg" className="text-white hover:bg-white/10 border border-white/30">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}