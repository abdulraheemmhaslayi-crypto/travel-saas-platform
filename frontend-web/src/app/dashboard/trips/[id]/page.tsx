'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  ArrowRight, Sparkles, CheckCircle2, Ticket, AlertCircle, Car,
  Clock, ShieldCheck, Navigation, ChevronDown, ChevronUp, Zap,
  Wifi, Snowflake, Briefcase, Award
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import MapView from '@/components/maps/MapView';

// Clean primary city name for mobile header
function formatShortAddress(address: string): string {
  if (!address) return '';
  const first = address.split(',')[0]?.trim();
  return first || address;
}

// Vehicle Image Selector
function getTripVehicleImage(vehicle?: any): string {
  if (!vehicle) return '/images/vehicles/comfort.png';
  const str = `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.type || ''}`.toLowerCase();
  if (str.includes('innova') || str.includes('xl') || str.includes('van') || (vehicle.seatingCapacity && vehicle.seatingCapacity > 5)) {
    return '/images/vehicles/xl.png';
  }
  if (str.includes('suv') || str.includes('fortuner') || str.includes('audi') || str.includes('creta')) {
    return '/images/vehicles/premium.png';
  }
  if (str.includes('camry') || str.includes('city') || str.includes('sedan') || str.includes('comfort')) {
    return '/images/vehicles/comfort.png';
  }
  return '/images/vehicles/economy.png';
}

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

  // Tab State for Mobile Trip Information (Seats, Route, Vehicle)
  const [mobileActiveTab, setMobileActiveTab] = useState<'seats' | 'route' | 'vehicle'>('seats');

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
      setPickupPoint(currentTrip.origin || currentTrip.source || '');
      setDropPoint(currentTrip.destination || '');
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
        const dateString = currentTrip.departureDate 
          ? new Date(currentTrip.departureDate).toISOString().split('T')[0]
          : undefined;

        const res = await apiClient.searchTrips({
          origin: currentTrip.origin || currentTrip.source,
          destination: currentTrip.destination,
          date: dateString,
        });
        const matches: Trip[] = res.data?.allMatches || res.data?.exactMatches || (Array.isArray(res.data) ? res.data : []);
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

  const isBookingDisabled = 
    !currentTrip ||
    currentTrip.status === 'COMPLETED' || 
    currentTrip.status === 'CANCELLED' || 
    (currentTrip.vehicle && currentTrip.vehicle.status !== 'approved') || 
    !currentTrip.allowBooking;

  // Fare calculations
  const seatPrice = currentTrip?.price || currentTrip?.pricePerSeat || currentTrip?.basePrice || 0;
  const currencySymbol = currentTrip?.currency === 'QAR' ? 'QAR' : '₹';
  const subtotal = seatPrice * selectedSeats.length;
  const platformFee = Math.round(subtotal * 0.10);
  const gstTax = Math.round(subtotal * 0.18);
  const totalFinalAmount = subtotal + platformFee + gstTax;

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
        showToast(`Seat ${unavailableSelected.join(', ')} has already been booked. Please select other seats.`, 'error');
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
        pickupLocation: pickupPoint || currentTrip?.origin || currentTrip?.source,
        dropLocation: dropPoint || currentTrip?.destination,
        passengerName: passengerName || `${user.firstName} ${user.lastName}`,
        passengerEmail: passengerEmail || user.email,
        passengerPhone: passengerPhone || user.phone,
        passengerGenders: genders,
      });

      setBookingId(booking.id);
      setPaymentAmount(Number(booking.finalAmount) || Number(totalFinalAmount));
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

  // Render Skeletons for Loading State
  if (tripLoading) {
    return (
      <div className="space-y-4 animate-pulse max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-200 rounded-xl" />
          <div className="space-y-1.5 flex-1">
            <div className="w-40 h-5 bg-gray-200 rounded" />
            <div className="w-56 h-3.5 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="w-full h-72 bg-gray-200 rounded-2xl" />
          <div className="w-full h-96 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Error boundary layout
  if (loadError || !currentTrip) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Card className="max-w-md w-full border border-red-100 shadow-xl rounded-2xl p-6 text-center space-y-4 bg-white">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-gray-900">Trip Unavailable</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              {loadError || "We couldn't retrieve the details for this trip. It might have been completed, cancelled, or does not exist."}
            </p>
          </div>
          <Button 
            onClick={() => router.push('/dashboard/passenger')} 
            className="w-full font-bold shadow-md rounded-xl"
          >
            Back to Ride Booking
          </Button>
        </Card>
      </div>
    );
  }

  const vehicleImg = getTripVehicleImage(currentTrip.vehicle);

  return (
    <div className="-mx-4 -mt-8 sm:mx-0 sm:mt-0 min-h-screen pb-44 lg:pb-12 bg-slate-50 overflow-x-hidden w-full max-w-full">
      {/* ── Top Header Navigation Bar ── */}
      <header className="bg-white/95 backdrop-blur-md px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-gray-200/80 sticky top-0 z-30 shadow-xs flex items-center justify-between gap-2.5 w-full">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => router.push('/dashboard/passenger')}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-700 active:scale-90 transition-transform border border-gray-200/80 bg-white shrink-0 shadow-xs"
            aria-label="Back to ride search"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="text-xs sm:text-base font-extrabold text-gray-900 tracking-tight truncate flex items-center gap-1.5">
              <span>{formatShortAddress(currentTrip.origin || currentTrip.source || '')}</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{formatShortAddress(currentTrip.destination || '')}</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-500 font-semibold truncate flex items-center gap-1.5 mt-0.5">
              <span>{formatDateTime(currentTrip.departureDate || currentTrip.departureTime || '')}</span>
              <span className="opacity-40">•</span>
              <span className="text-blue-600 font-bold">{currencySymbol} {seatPrice} / seat</span>
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <Badge 
            variant={currentTrip.status === 'SCHEDULED' ? 'info' : currentTrip.status === 'COMPLETED' ? 'success' : 'warning'}
            className="capitalize text-[10px] sm:text-xs font-bold px-2 py-0.5"
          >
            {currentTrip.status}
          </Badge>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 w-full max-w-full">
        {/* Mobile View Tabs Selector (Seats / Route / Vehicle - 3 Equal Balanced Columns) */}
        <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-2xl border border-gray-200/90 mb-3 shadow-xs lg:hidden w-full">
          <button
            type="button"
            onClick={() => setMobileActiveTab('seats')}
            className={cn(
              'py-1.5 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 truncate',
              mobileActiveTab === 'seats'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <Ticket className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Seats</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileActiveTab('route')}
            className={cn(
              'py-1.5 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 truncate',
              mobileActiveTab === 'route'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <Navigation className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Route</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileActiveTab('vehicle')}
            className={cn(
              'py-1.5 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 truncate',
              mobileActiveTab === 'vehicle'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <Car className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Vehicle</span>
          </button>
        </div>

        {/* ── Grid: Desktop Split (Left Details / Right Sticky Booking) & Mobile Flow ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start w-full">
          {/* ════════════════════════════════════════════════════════════════════
             LEFT SECTION (Desktop: 7 Cols / Mobile: Shown on Route or Vehicle Tab)
             ════════════════════════════════════════════════════════════════════ */}
          <div className={cn(
            'space-y-4 sm:space-y-6 lg:col-span-7 w-full',
            mobileActiveTab === 'seats' ? 'hidden lg:block' : 'block'
          )}>
            <TripDetails
              trip={currentTrip}
              onBook={() => setShowBookingModal(true)}
            />
          </div>

          {/* ════════════════════════════════════════════════════════════════════
             RIGHT SECTION: SEAT SELECTION & TICKET BOOKING
             (Desktop: 5 Cols Sticky / Mobile: Primary Focus)
             ════════════════════════════════════════════════════════════════════ */}
          <div className={cn(
            'space-y-3.5 lg:col-span-5 lg:sticky lg:top-20 w-full',
            mobileActiveTab !== 'seats' ? 'hidden lg:block' : 'block'
          )}>
            {/* ── Trip Vehicle Hero Card (Compact for Mobile) ── */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-3.5 sm:p-4 shadow-xs relative overflow-hidden w-full">
              <div className="flex items-center justify-between gap-2.5 mb-2.5 pb-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <img
                    src={vehicleImg}
                    alt={currentTrip.vehicle?.brand || 'Vehicle'}
                    className="w-13 h-9 sm:w-16 sm:h-10 object-contain drop-shadow-sm shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 truncate capitalize">
                      {currentTrip.vehicle ? `${currentTrip.vehicle.brand} ${currentTrip.vehicle.model}` : currentTrip.vehicleName || 'Toyota Innova'}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 truncate flex items-center gap-1.5 mt-0.5">
                      <span className="truncate">{currentTrip.driver?.user ? `Capt. ${currentTrip.driver.user.firstName}` : currentTrip.operatorName || 'Verified Fleet'}</span>
                      <span className="opacity-40">•</span>
                      <span className="text-amber-600 font-bold flex items-center gap-0.5 shrink-0">
                        <Award className="w-3 h-3" /> 4.8
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 min-w-[65px] pl-1">
                  <span className="text-xs sm:text-sm font-black text-blue-600 block whitespace-nowrap">
                    {currencySymbol} {seatPrice}
                  </span>
                  <span className="text-[10px] text-gray-400 block whitespace-nowrap">per seat</span>
                </div>
              </div>

              {/* Boarding Summary (Compact) */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-100" />
                  <span className="font-bold text-gray-900 text-xs truncate">
                    {formatShortAddress(currentTrip.origin || currentTrip.source || '')}
                  </span>
                  <span className="text-[10px] text-gray-400 shrink-0 ml-auto">
                    {currentTrip.departureTime ? new Date(currentTrip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '5:35 PM'}
                  </span>
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-sm bg-rose-500 shrink-0 ring-2 ring-rose-100" />
                  <span className="font-bold text-gray-900 text-xs truncate">
                    {formatShortAddress(currentTrip.destination || '')}
                  </span>
                  <span className="text-[10px] text-gray-400 shrink-0 ml-auto">
                    {currentTrip.arrivalTime ? new Date(currentTrip.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '8:35 PM'}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Interactive Seat Selector Card ── */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-3.5 sm:p-5 shadow-xs space-y-3.5 w-full max-w-full overflow-hidden">
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Choose Your Seat</span>
                </h3>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  {currentTrip.availableSeats} of {currentTrip.totalSeats} open
                </span>
              </div>

              {isBookingDisabled && (
                <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-xs text-red-700 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Booking Unavailable</p>
                    <p className="text-red-600/90 mt-0.5">
                      This trip is not accepting bookings right now. Status: <span className="font-bold uppercase">{currentTrip.status}</span>.
                    </p>
                  </div>
                </div>
              )}

              {/* Gender Preference Toggle (100% Mobile Safe) */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Passenger Gender
                </label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200 w-full">
                  <button
                    type="button"
                    onClick={() => setPassengerGender('male')}
                    className={cn(
                      'py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 truncate',
                      passengerGender === 'male'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    )}
                  >
                    <span className="text-xs font-bold">♂</span>
                    <span>Male</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPassengerGender('female')}
                    className={cn(
                      'py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 truncate',
                      passengerGender === 'female'
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    )}
                  >
                    <span className="text-xs font-bold">♀</span>
                    <span>Female</span>
                  </button>
                </div>
              </div>

              {/* SeatMap Layout */}
              <div className="pt-0.5 w-full">
                <SeatMap
                  seats={currentTrip.seats}
                  vehicleType={currentTrip.vehicleType || currentTrip.vehicle?.type}
                  selectedSeats={selectedSeats}
                  onSeatSelect={handleSeatSelect}
                  maxSelectable={Math.min(4, currentTrip.availableSeats)}
                  passengerGender={passengerGender}
                />
              </div>

              {/* Pricing Breakdown Summary */}
              <div className="pt-2.5 border-t border-gray-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Selected Seats</span>
                  <span className="font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                    {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Ticket Price ({selectedSeats.length} × {currencySymbol}{seatPrice})</span>
                  <span className="font-semibold text-gray-800">{currencySymbol} {subtotal}</span>
                </div>

                {selectedSeats.length > 0 && (
                  <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-gray-150 text-[11px] text-gray-500">
                    <div className="flex justify-between">
                      <span>Platform Service Fee (10%)</span>
                      <span>{currencySymbol} {platformFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST Tax (18%)</span>
                      <span>{currencySymbol} {gstTax}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
                  <span className="text-xs sm:text-sm font-bold text-gray-900">Total Amount</span>
                  <span className="text-base sm:text-lg font-black text-blue-600">
                    {currencySymbol} {totalFinalAmount}
                  </span>
                </div>

                {/* Desktop "Proceed to Book" Button */}
                <button
                  type="button"
                  onClick={() => setShowBookingModal(true)}
                  disabled={selectedSeats.length === 0 || isBookingDisabled}
                  className="hidden lg:flex w-full h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 active:scale-[0.98] transition-all items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Ticket className="w-4 h-4" />
                  <span>{selectedSeats.length === 0 ? 'Select a Seat to Continue' : 'Proceed to Book'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Related Alternative Routes (Bottom recommendations) ── */}
        {relatedTrips.length > 0 && (
          <div className="mt-6 pt-5 border-t border-gray-200 space-y-3">
            <h2 className="text-xs sm:text-sm font-black text-gray-900 tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Other Trips on Similar Routes</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
              {relatedTrips.map((related) => (
                <div
                  key={related.id} 
                  className="p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-700 uppercase">
                        {related.vehicleType}
                      </span>
                      <span className="text-xs font-black text-blue-600">
                        {currencySymbol} {related.pricePerSeat || related.price}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-xs mt-1 truncate">
                      {formatShortAddress(related.origin || related.source || '')} ➔ {formatShortAddress(related.destination)}
                    </h4>
                    <p className="text-[10px] text-gray-400">
                      {formatDateTime(related.departureDate || related.departureTime || '')}
                    </p>
                  </div>

                  <Link 
                    href={`/dashboard/trips/${related.id}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 pt-1.5 border-t border-gray-100"
                  >
                    <span>View Trip</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ════════════════════════════════════════════════════════════════════════
         STICKY BOTTOM ACTION BAR ON MOBILE (Fixed above MobileNav)
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 p-3 pb-20 lg:hidden shadow-[0_-4px_25px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] text-gray-400 font-semibold block leading-none mb-1 truncate">
              {selectedSeats.length > 0 ? `${selectedSeats.length} Seat${selectedSeats.length > 1 ? 's' : ''} (#${selectedSeats.join(', #')})` : 'Select Seat(s)'}
            </span>
            <span className="text-base font-black text-blue-600 leading-none">
              {currencySymbol} {selectedSeats.length > 0 ? totalFinalAmount : seatPrice}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowBookingModal(true)}
            disabled={selectedSeats.length === 0 || isBookingDisabled}
            className="flex-1 max-w-[190px] h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            <span>{selectedSeats.length === 0 ? 'Pick a Seat' : 'Proceed to Book'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Booking Form Confirmation Modal ── */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="Verify Passenger & Booking Details"
        size="md"
      >
        <div className="space-y-3.5">
          {/* Trip Header Banner */}
          <div className="flex items-center gap-2.5 p-2.5 bg-blue-50/60 rounded-xl border border-blue-200/60">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900 text-xs truncate">
                {currentTrip.origin || currentTrip.source} ➔ {currentTrip.destination}
              </p>
              <p className="text-[10px] text-gray-500">
                Departure: {formatDateTime(currentTrip.departureDate || currentTrip.departureTime || '')}
              </p>
            </div>
          </div>

          {/* Passenger Information */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Passenger Contact</h4>
            <div className="space-y-2 text-xs">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User className="w-3.5 h-3.5" />
                </span>
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 font-semibold text-gray-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input 
                    type="tel" 
                    placeholder="Phone Number" 
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 font-semibold text-gray-900 text-xs"
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail className="w-3.5 h-3.5" />
                  </span>
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={passengerEmail}
                    onChange={(e) => setPassengerEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 font-semibold text-gray-900 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Boarding Points */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Boarding & Dropping Points</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Pickup Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. Bus Stand / Hotel" 
                  value={pickupPoint}
                  onChange={(e) => setPickupPoint(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 font-medium text-gray-900 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Drop Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. Railway Station" 
                  value={dropPoint}
                  onChange={(e) => setDropPoint(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 font-medium text-gray-900 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-gray-200 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Selected Seats ({selectedSeats.length})</span>
              <span className="font-bold text-gray-800">{selectedSeats.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Base Fare ({selectedSeats.length} × {currencySymbol}{seatPrice})</span>
              <span className="font-semibold text-gray-800">{currencySymbol} {subtotal}</span>
            </div>
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>Platform Fee & GST Taxes</span>
              <span>{currencySymbol} {platformFee + gstTax}</span>
            </div>
            <div className="border-t border-gray-200 pt-1 flex justify-between text-xs sm:text-sm font-extrabold text-gray-900">
              <span>Final Total Amount</span>
              <span className="text-blue-600 font-black">{currencySymbol} {totalFinalAmount}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1.5">
            <Button
              variant="secondary"
              onClick={() => setShowBookingModal(false)}
              className="flex-1 font-bold rounded-xl h-10 text-xs"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBook} 
              className="flex-1 font-bold rounded-xl h-10 text-xs shadow-md bg-blue-600 hover:bg-blue-700"
            >
              Confirm & Pay
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Payment Gateway Modal ── */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Complete Order Payment"
        size="md"
      >
        <PaymentForm
          amount={Number(paymentAmount) || Number(totalFinalAmount)}
          currency={currentTrip.currency || 'INR'}
          bookingId={bookingId}
          provider="RAZORPAY"
          onSuccess={handlePaymentSuccess}
          onError={(error) => showToast(error, 'error')}
        />
      </Modal>
    </div>
  );
}
