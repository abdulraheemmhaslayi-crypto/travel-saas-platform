'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTripStore } from '@/store/slices/tripSlice';
import { useBookingStore } from '@/store/slices/bookingSlice';
import { useAuthStore } from '@/store/slices/authSlice';
import { useAppStore } from '@/store';
import TripDetails from '@/components/trips/TripDetails';
import SeatMap from '@/components/trips/SeatMap';
import PaymentForm from '@/components/payments/PaymentForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import apiClient from '@/lib/api';
import { Trip } from '@/types/trip';
import { 
  ArrowLeft, MapPin, Calendar, User, Phone, Mail, ShieldAlert, 
  ArrowRight, Sparkles, CheckCircle2, Ticket, AlertCircle 
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  
  const { user } = useAuthStore();
  const { currentTrip, getTrip, isLoading: tripLoading } = useTripStore();
  const { createBooking } = useBookingStore();
  const { showToast } = useAppStore();

  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [passengerGender, setPassengerGender] = useState<'male' | 'female'>('female');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingId, setBookingId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [relatedTrips, setRelatedTrips] = useState<Trip[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Booking details form state
  const [pickupPoint, setPickupPoint] = useState('');
  const [dropPoint, setDropPoint] = useState('');
  const [passengerName, setPassengerName] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');

  // Fetch Trip Details
  useEffect(() => {
    if (tripId) {
      setLoadError(null);
      getTrip(tripId).catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Failed to retrieve trip');
      });
    }
  }, [tripId, getTrip]);

  // Set default passenger form inputs once trip and user are available
  useEffect(() => {
    if (currentTrip) {
      setPickupPoint(currentTrip.origin);
      setDropPoint(currentTrip.destination);
    }
    if (user) {
      setPassengerName(`${user.firstName} ${user.lastName}`);
      setPassengerEmail(user.email || '');
      setPassengerPhone(user.phone || '');
    }
  }, [currentTrip, user]);

  // Fetch related alternative trips
  useEffect(() => {
    const fetchRelated = async () => {
      if (!currentTrip) return;
      try {
        const dateString = new Date(currentTrip.departureDate).toISOString().split('T')[0];
        const res = await apiClient.searchTrips({
          origin: currentTrip.origin,
          destination: currentTrip.destination,
          date: dateString,
        });
        const matches: Trip[] = res.data.allMatches || (Array.isArray(res.data) ? res.data : []);
        // Filter out current trip and restrict to top 3 recommendations
        setRelatedTrips(matches.filter(t => t.id !== currentTrip.id).slice(0, 3));
      } catch (e) {
        console.warn('Failed to fetch related trips', e);
      }
    };
    fetchRelated();
  }, [currentTrip]);

  const handleSeatSelect = (seatNumber: number) => {
    setSelectedSeats((prev) =>
      prev.includes(seatNumber)
        ? prev.filter((s) => s !== seatNumber)
        : [...prev, seatNumber]
    );
  };

  const handleBook = async () => {
    if (!user) {
      showToast('Please login to book a seat', 'error');
      router.push('/login');
      return;
    }

    if (selectedSeats.length === 0) {
      showToast('Please select at least one seat', 'error');
      return;
    }

    try {
      // Re-fetch seat availability before validating
      await getTrip(tripId);
      
      const freshTrip = useTripStore.getState().currentTrip;
      if (!freshTrip) {
        showToast('Trip is no longer available.', 'error');
        return;
      }

      // Check if any selected seat is not available
      const unavailableSelected = selectedSeats.filter((seatNum) => {
        const freshSeat = freshTrip.seats?.find(
          (s) => parseInt(s.seatNumber, 10) === seatNum
        );
        return !freshSeat || freshSeat.status !== 'available';
      });

      if (unavailableSelected.length > 0) {
        if (unavailableSelected.length === 1) {
          showToast(`Seat ${unavailableSelected[0]} has already been booked. Please select another seat.`, 'error');
        } else {
          showToast(`Seats ${unavailableSelected.join(', ')} have already been booked. Please select other seats.`, 'error');
        }
        // Deselect the unavailable seats from selectedSeats
        setSelectedSeats((prev) => prev.filter(s => !unavailableSelected.includes(s)));
        setShowBookingModal(false);
        return;
      }

      const genders: Record<string, string> = {};
      selectedSeats.forEach((seatNum) => {
        genders[seatNum.toString()] = passengerGender;
      });

      const booking = await createBooking({
        tripId,
        seatNumbers: selectedSeats.map(s => s.toString()),
        bookingType: 'one_way',
        paymentMethod: 'razorpay',
        pickupLocation: pickupPoint || currentTrip?.origin,
        dropLocation: dropPoint || currentTrip?.destination,
        passengerName: passengerName || `${user.firstName} ${user.lastName}`,
        passengerEmail: passengerEmail || user.email,
        passengerPhone: passengerPhone || user.phone,
        passengerGenders: genders,
      });

      setBookingId(booking.id);
      setPaymentAmount(booking.finalAmount);
      setShowBookingModal(false);
      setShowPaymentModal(true);
      showToast('Booking created! Please complete your payment.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Booking failed';
      showToast(message, 'error');
    }
  };

  const handlePaymentSuccess = () => {
    showToast('Payment successful! Your booking is confirmed.', 'success');
    router.push('/dashboard/bookings');
  };

  // Render Skeletons for Premium UX
  if (tripLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          <div className="space-y-2">
            <div className="w-32 h-6 bg-gray-200 rounded" />
            <div className="w-48 h-4 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="w-full h-80 bg-gray-200 rounded-2xl" />
            <div className="w-full h-64 bg-gray-200 rounded-2xl" />
            <div className="w-full h-44 bg-gray-200 rounded-2xl" />
          </div>
          <div className="space-y-6">
            <div className="w-full h-[400px] bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error boundary layout
  if (loadError || !currentTrip) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Card className="max-w-md w-full border border-red-100 shadow-xl rounded-2xl p-8 text-center space-y-6 bg-white">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">Trip Unavailable</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {loadError || "We couldn't retrieve the details for this trip. It might have been completed, cancelled, or does not exist."}
            </p>
          </div>
          <Button 
            onClick={() => router.push('/dashboard/trips')} 
            className="w-full font-bold shadow-md"
          >
            Back to Trips Search
          </Button>
        </Card>
      </div>
    );
  }

  const isBookingDisabled = 
    currentTrip.status === 'COMPLETED' || 
    currentTrip.status === 'CANCELLED' || 
    (currentTrip.vehicle && currentTrip.vehicle.status !== 'approved') || 
    !currentTrip.allowBooking;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header Navigation */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/trips"
          className="p-2 hover:bg-gray-100 rounded-xl transition-all border border-transparent hover:border-gray-200 shadow-sm bg-white"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Trip Details</h1>
          <p className="text-sm text-gray-500 font-semibold flex items-center gap-1">
            <span>{currentTrip.origin}</span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span>{currentTrip.destination}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Route and Vehicle Details */}
        <div className="lg:col-span-2">
          <TripDetails
            trip={currentTrip}
            onBook={() => setShowBookingModal(true)}
          />
        </div>

        {/* Right Side: Seat Selector and Pricing Details */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary-500" /> Ticket Booking
            </h3>

            {isBookingDisabled ? (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 mb-4 text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Booking Unavailable</p>
                  <p className="text-red-600/90 mt-0.5">
                    This trip is no longer accepting bookings. Status: <span className="font-bold uppercase">{currentTrip.status}</span>.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="mb-4 space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase block">Passenger Gender</label>
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setPassengerGender('male')}
                  className={cn(
                    'py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5',
                    passengerGender === 'male'
                      ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <span className="text-sm font-bold">♂</span> Male
                </button>
                <button
                  type="button"
                  onClick={() => setPassengerGender('female')}
                  className={cn(
                    'py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5',
                    passengerGender === 'female'
                      ? 'bg-pink-600 text-white shadow-sm font-extrabold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <span className="text-sm font-bold">♀</span> Female
                </button>
              </div>
            </div>

            <SeatMap
              seats={currentTrip.seats}
              vehicleType={currentTrip.vehicleType}
              selectedSeats={selectedSeats}
              onSeatSelect={handleSeatSelect}
              maxSelectable={Math.min(4, currentTrip.availableSeats)}
              passengerGender={passengerGender}
            />

            <div className="mt-6 pt-4 border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-gray-500">Selected Seats</span>
                <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-md">
                  {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-gray-500">Base Ticket Price</span>
                <span className="text-gray-800">
                  {formatCurrency(currentTrip.price * selectedSeats.length, currentTrip.currency)}
                </span>
              </div>
              
              {/* Est. taxes and platform fee breakdown */}
              {selectedSeats.length > 0 && (
                <div className="space-y-1.5 bg-gray-50 p-3 rounded-xl text-[11px] font-semibold text-gray-500 border border-gray-100">
                  <div className="flex justify-between">
                    <span>Platform Service Fee (10%)</span>
                    <span>{formatCurrency(currentTrip.price * selectedSeats.length * 0.10, currentTrip.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST Tax (18%)</span>
                    <span>{formatCurrency(currentTrip.price * selectedSeats.length * 0.18, currentTrip.currency)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm font-bold text-gray-900">Total Est. Price</span>
                <span className="text-xl font-black text-primary-600">
                  {formatCurrency(currentTrip.price * selectedSeats.length * 1.28, currentTrip.currency)}
                </span>
              </div>

              <Button
                onClick={() => setShowBookingModal(true)}
                disabled={selectedSeats.length === 0 || isBookingDisabled}
                className="w-full py-3 font-bold shadow-md transition-all mt-2"
              >
                Proceed to Book
              </Button>
              
              <p className="text-[10px] text-center text-gray-400 font-semibold">
                Remaining Available Seats: {currentTrip.availableSeats} of {currentTrip.totalSeats}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alternative Recommendations Section */}
      {relatedTrips.length > 0 && (
        <div className="pt-6 border-t border-gray-100 space-y-4">
          <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-100" /> Similar Routes Available
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedTrips.map((related) => (
              <Card 
                key={related.id} 
                className="border border-gray-200 hover:border-primary-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">{related.vehicleType}</Badge>
                    <span className="text-lg font-black text-primary-600">
                      {formatCurrency(related.price, related.currency)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{related.origin} to {related.destination}</h4>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      Date: {formatDateTime(related.departureDate)}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-semibold">{related.availableSeats} seats left</span>
                  <Link 
                    href={`/dashboard/trips/${related.id}`}
                    className="text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1"
                  >
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Booking Form Confirmation Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="Verify Passenger & Booking Details"
        size="md"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
            <div>
              <p className="font-bold text-gray-900 text-sm">
                {currentTrip.origin} → {currentTrip.destination}
              </p>
              <p className="text-xs text-gray-500 font-semibold">
                Departure: {new Date(currentTrip.departureDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Passenger Information Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Passenger Information</h4>
            <div className="space-y-3 text-xs">
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  placeholder="Passenger Name" 
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-gray-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input 
                    type="tel" 
                    placeholder="Phone Number" 
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-medium"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-gray-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={passengerEmail}
                    onChange={(e) => setPassengerEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pickup and Drop Point Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Boarding Locations</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Pickup Point</label>
                <input 
                  type="text" 
                  placeholder="e.g. Bus Stand / Hotel" 
                  value={pickupPoint}
                  onChange={(e) => setPickupPoint(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Drop Point</label>
                <input 
                  type="text" 
                  placeholder="e.g. Railway Station" 
                  value={dropPoint}
                  onChange={(e) => setDropPoint(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2.5 text-xs font-semibold text-gray-600">
            <div className="flex justify-between">
              <span>Selected Seats ({selectedSeats.length})</span>
              <span className="text-gray-800">{selectedSeats.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span>Price per seat</span>
              <span>{formatCurrency(currentTrip.price, currentTrip.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Base Fare</span>
              <span>{formatCurrency(currentTrip.price * selectedSeats.length, currentTrip.currency)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>Taxes & Service Fees (Platform + GST)</span>
              <span>{formatCurrency(currentTrip.price * selectedSeats.length * 0.28, currentTrip.currency)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold text-gray-900">
              <span>Estimated Final Amount</span>
              <span className="text-primary-600 font-black">
                {formatCurrency(currentTrip.price * selectedSeats.length * 1.28, currentTrip.currency)}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowBookingModal(false)}
              className="flex-1 font-bold rounded-xl"
            >
              Cancel
            </Button>
            <Button onClick={handleBook} className="flex-1 font-bold rounded-xl shadow-md">
              Confirm & Pay
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment Gateway Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Complete Order Payment"
        size="md"
      >
        <PaymentForm
          amount={paymentAmount}
          currency={currentTrip.currency}
          bookingId={bookingId}
          provider="RAZORPAY"
          onSuccess={handlePaymentSuccess}
          onError={(error) => showToast(error, 'error')}
        />
      </Modal>
    </div>
  );
}