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

function formatVehicleName(name?: string): string {

  if (!name) return 'Toyota Innova';

  return name.replace(/\btyota\b/gi, 'Toyota');

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

  const tripId = (params?.id as string) || '';

  

  const { user, isAuthenticated } = useAuthStore();

  const { currentTrip, getTrip, isLoading: tripLoading } = useTripStore();

  const { createBooking } = useBookingStore();

  const { showToast } = useAppStore();

  const userType = String(user?.userType || (user as any)?.role || '').toUpperCase();
  const isFleetOwner = userType === 'FLEET_OWNER' || userType === 'VEHICLE_OWNER';
  const isDriver = userType === 'DRIVER';
  const isAdmin = userType === 'ADMIN' || userType === 'SUPER_ADMIN';

  const handleBack = () => {
    if (isFleetOwner) {
      router.push('/dashboard/fleet-owner/trips');
    } else if (isDriver) {
      router.push('/dashboard/driver');
    } else if (isAdmin) {
      router.push('/dashboard/admin/trips');
    } else {
      router.push('/dashboard/passenger');
    }
  };

  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  const [passengerGender, setPassengerGender] = useState<'male' | 'female'>('male');

  const [seatGenders, setSeatGenders] = useState<Record<number, 'male' | 'female'>>({});

  const [showBookingModal, setShowBookingModal] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [bookingId, setBookingId] = useState<string>('');

  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const [relatedTrips, setRelatedTrips] = useState<Trip[]>([]);

  const [loadError, setLoadError] = useState<string | null>(null);

  // Tab State for Mobile Trip Information (Seats, Route, Vehicle)

  const [mobileActiveTab, setMobileActiveTab] = useState<'seats' | 'route'>('seats');
  const [isBookingFullCar, setIsBookingFullCar] = useState(false);

  useEffect(() => {
    if (currentTrip?.bookingMode === 'FULL_VEHICLE') {
      setIsBookingFullCar(true);
      const total = currentTrip.totalSeats || currentTrip.availableSeats || 4;
      setSelectedSeats(Array.from({ length: total }, (_, i) => i + 1));
    }
  }, [currentTrip?.bookingMode, currentTrip?.totalSeats, currentTrip?.availableSeats]);

  // Per-passenger details form state

  interface PassengerInput {

    name: string;

    age: string;

    gender: 'male' | 'female';

  }

  const [passengersBySeat, setPassengersBySeat] = useState<Record<number, PassengerInput>>({});

  // Booking details form state

  const [pickupPoint, setPickupPoint] = useState('');

  const [dropPoint, setDropPoint] = useState('');

  const [passengerName, setPassengerName] = useState('');

  const [passengerEmail, setPassengerEmail] = useState('');

  const [passengerPhone, setPassengerPhone] = useState('');

  const updatePassengerInfo = (seatNum: number, field: keyof PassengerInput, value: string) => {

    setPassengersBySeat((prev) => {

      const current = prev[seatNum] || { name: '', age: '', gender: 'male' };

      const updated = { ...current, [field]: value };

      if (field === 'gender') {

        setSeatGenders((g) => ({ ...g, [seatNum]: value as 'male' | 'female' }));

      }

      return { ...prev, [seatNum]: updated };

    });

  };

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
      if (currentTrip.bookingMode === 'FULL_VEHICLE') {
        setIsBookingFullCar(true);
        const total = currentTrip.totalSeats || currentTrip.availableSeats || 4;
        const allSeats = currentTrip.seats?.filter(s => s.status === 'available').map(s => parseInt(s.seatNumber, 10)) || Array.from({ length: total }, (_, i) => i + 1);
        setSelectedSeats(allSeats);
      }
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

    setSelectedSeats((prev) => {

      if (prev.includes(seatNumber)) {

        setSeatGenders((gMap) => {

          const next = { ...gMap };

          delete next[seatNumber];

          return next;

        });

        setPassengersBySeat((pMap) => {

          const next = { ...pMap };

          delete next[seatNumber];

          return next;

        });

        return prev.filter((s) => s !== seatNumber);

      } else {

        const maxLimit = Math.min(4, currentTrip?.availableSeats || 4);

        if (prev.length >= maxLimit) {

          showToast(`Maximum ${maxLimit} seats can be selected`, 'info');

          return prev;

        }

        setSeatGenders((gMap) => ({

          ...gMap,

          [seatNumber]: passengerGender,

        }));

        setPassengersBySeat((pMap) => {

          const defaultName = prev.length === 0 && user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';

          return {

            ...pMap,

            [seatNumber]: {

              name: pMap[seatNumber]?.name || defaultName,

              age: pMap[seatNumber]?.age || '',

              gender: pMap[seatNumber]?.gender || passengerGender || 'male',

            },

          };

        });

        return [...prev, seatNumber];

      }

    });

  };

  const toggleSeatGender = (seatNumber: number) => {

    setSeatGenders((prev) => {

      const current = prev[seatNumber] || passengerGender;

      const nextGender = current === 'female' ? 'male' : 'female';

      return {

        ...prev,

        [seatNumber]: nextGender,

      };

    });

  };

  const isBookingDisabled = 

    !currentTrip ||

    currentTrip.status === 'COMPLETED' || 

    currentTrip.status === 'CANCELLED' || 

    (currentTrip.vehicle && currentTrip.vehicle.status !== 'approved') || 

    !currentTrip.allowBooking;

  // Fare calculations

  const seatPrice = Math.round(Number(currentTrip?.price || currentTrip?.pricePerSeat || currentTrip?.basePrice || 0));
  const currencySymbol = currentTrip?.currency === 'QAR' ? 'QAR' : '₹';
  const isFullVehicle =
    (currentTrip?.bookingMode || '').toUpperCase() === 'FULL_VEHICLE' ||
    isBookingFullCar ||
    (Boolean(currentTrip?.fullVehiclePrice) && Number(currentTrip?.fullVehiclePrice) > 0);
  const fullVehiclePrice = Math.round(Number(currentTrip?.fullVehiclePrice || (seatPrice * (currentTrip?.totalSeats || 4))));
  const subtotal = Math.round(isFullVehicle ? fullVehiclePrice : (seatPrice * selectedSeats.length));
  const platformFee = Math.round(subtotal * 0.10);
  const gstTax = Math.round(subtotal * 0.18);
  const totalFinalAmount = Math.round(subtotal + platformFee + gstTax);

  const handleProceedToBooking = () => {
    if (!isAuthenticated || !user) {
      showToast('Please sign in to proceed with booking', 'info');
      router.push('/login?returnUrl=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (isFullVehicle) {
      const total = currentTrip?.totalSeats || currentTrip?.availableSeats || 4;
      const allSeats = currentTrip?.seats?.filter(s => s.status === 'available').map(s => parseInt(s.seatNumber, 10)) || Array.from({ length: total }, (_, i) => i + 1);
      setSelectedSeats(allSeats);
      setPassengersBySeat((prev) => {
        const next = { ...prev };
        const primaryName = (passengerName && passengerName.trim()) || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Primary Passenger';
        allSeats.forEach((seatNum, idx) => {
          next[seatNum] = {
            name: idx === 0 ? primaryName : `Passenger ${idx + 1}`,
            age: '28',
            gender: passengerGender || 'male',
          };
        });
        return next;
      });
      setShowBookingModal(true);
      return;
    }

    // Normal seat flow
    setPassengersBySeat((prev) => {
      const next = { ...prev };
      selectedSeats.forEach((seatNum, idx) => {
        if (!next[seatNum]) {
          const defaultName = idx === 0 && user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
          next[seatNum] = {
            name: defaultName,
            age: '',
            gender: seatGenders[seatNum] || passengerGender || 'male',
          };
        }
      });
      return next;
    });
    setShowBookingModal(true);
  };

  const handleBook = async () => {
    if (!isAuthenticated || !user) {
      showToast('Please sign in to book a seat', 'error');
      router.push('/login?returnUrl=' + encodeURIComponent(window.location.pathname));
      return;
    }

    let seatsToBook = selectedSeats;
    if (seatsToBook.length === 0) {
      if (isFullVehicle) {
        const total = currentTrip?.totalSeats || currentTrip?.availableSeats || 4;
        seatsToBook = currentTrip?.seats?.filter(s => s.status === 'available').map(s => parseInt(s.seatNumber, 10)) || Array.from({ length: total }, (_, i) => i + 1);
        setSelectedSeats(seatsToBook);
      } else {
        showToast('Please select at least one seat', 'error');
        return;
      }
    }

    const defaultPrimaryName = (passengerName && passengerName.trim()) || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Passenger';
    const finalPhone = (passengerPhone && passengerPhone.trim().length >= 10) ? passengerPhone.trim() : (user?.phone || '9876543210');
    const finalEmail = passengerEmail || user?.email || 'passenger@example.com';

    try {
      await getTrip(tripId);
      const freshTrip = useTripStore.getState().currentTrip;
      if (!freshTrip) {
        showToast('Trip is no longer available.', 'error');
        return;
      }

      // Check if any selected seat is not available
      const unavailableSelected = seatsToBook.filter((seatNum) => {
        const freshSeat = freshTrip.seats?.find(
          (s) => parseInt(s.seatNumber, 10) === seatNum
        );
        return !freshSeat || freshSeat.status !== 'available';
      });

      if (unavailableSelected.length > 0) {
        showToast(`Seat ${unavailableSelected.join(', ')} has already been booked. Please select other seats.`, 'error');
        setSelectedSeats((prev) => prev.filter(s => !unavailableSelected.includes(s)));
        setSeatGenders((gMap) => {
          const next = { ...gMap };
          unavailableSelected.forEach((s) => delete next[s]);
          return next;
        });
        setPassengersBySeat((pMap) => {
          const next = { ...pMap };
          unavailableSelected.forEach((s) => delete next[s]);
          return next;
        });
        setShowBookingModal(false);
        return;
      }

      const genders: Record<string, string> = {};
      const passengersPayload = seatsToBook.map((seatNum, idx) => {
        const info = passengersBySeat[seatNum];
        const g = info?.gender || seatGenders[seatNum] || passengerGender || 'male';
        genders[seatNum.toString()] = g;

        const seatPassengerName = isFullVehicle
          ? (idx === 0 ? defaultPrimaryName : `Passenger ${idx + 1}`)
          : ((info?.name && info.name.trim()) || (idx === 0 ? defaultPrimaryName : `Passenger ${idx + 1}`));
        const parsedAge = info?.age ? parseInt(info.age, 10) : undefined;
        const seatPassengerAge = (parsedAge && !isNaN(parsedAge) && parsedAge >= 1 && parsedAge <= 120) ? parsedAge : 25;

        return {
          seatNumber: seatNum.toString(),
          name: seatPassengerName,
          age: seatPassengerAge,
          gender: g,
        };
      });

      const primaryPassenger = passengersPayload[0];

      const booking = await createBooking({
        tripId,
        seatNumbers: seatsToBook.map(s => s.toString()),
        bookingType: 'one_way',
        paymentMethod: 'razorpay',
        pickupLocation: pickupPoint || currentTrip?.origin || currentTrip?.source,
        dropLocation: dropPoint || currentTrip?.destination,
        passengerName: primaryPassenger?.name || defaultPrimaryName,
        passengerEmail: finalEmail,
        passengerPhone: finalPhone,
        passengerGenders: genders,
        passengers: passengersPayload,
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
            onClick={handleBack} 
            className="w-full font-bold shadow-md rounded-xl"
          >
            {isFleetOwner ? 'Back to Fleet Trips' : 'Back to Ride Booking'}
          </Button>

        </Card>

      </div>

    );

  }

  const vehicleImg = getTripVehicleImage(currentTrip.vehicle);

  return (

    <div className="w-full pb-36 lg:pb-8">

      {/* Mobile Sticky Top App Bar */}

      <header className="block md:hidden bg-white/95 backdrop-blur-md px-3.5 py-2.5 border-b border-gray-200/90 sticky top-0 z-30 shadow-xs w-full">

        <div className="flex items-center justify-between gap-2.5">

          <button
            type="button"
            onClick={handleBack}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-700 active:scale-90 transition-transform border border-gray-200 bg-white shrink-0 shadow-2xs"
            aria-label="Back"
          >

            <ArrowLeft className="w-4 h-4 text-gray-700" />

          </button>

          <div className="min-w-0 flex-1">

            <h1 className="text-xs font-extrabold text-gray-900 tracking-tight truncate flex items-center gap-1">

              <span className="truncate">{formatShortAddress(currentTrip.origin || currentTrip.source || '')}</span>

              <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />

              <span className="truncate">{formatShortAddress(currentTrip.destination || '')}</span>

            </h1>

            <p className="text-[10px] text-gray-500 font-semibold truncate flex items-center gap-1 mt-0.5">

              <span>{formatDateTime(currentTrip.departureDate || currentTrip.departureTime || '')}</span>

              <span className="opacity-40">•</span>

              <span className="text-[#4F46E5] font-bold">
                {isFullVehicle
                  ? `${currencySymbol} ${fullVehiclePrice} (Entire Car)`
                  : `${currencySymbol} ${seatPrice}/seat`}
              </span>

            </p>

          </div>

          <Badge 

            variant={currentTrip.status === 'SCHEDULED' ? 'info' : currentTrip.status === 'COMPLETED' ? 'warning' : 'success'}
            className="capitalize text-xs font-bold px-3 py-1 rounded-full shrink-0"

          >

            {currentTrip.status}

          </Badge>

        </div>

      </header>

      {/* Main Content Container */}

      <div className="w-full px-3.5 sm:px-0 pt-2.5 lg:pt-0">

        {/* Desktop Hero Header Card */}

        <div className="hidden md:block bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs mb-6">

          <div className="flex items-center justify-between gap-4 mb-3">

            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#4F46E5] transition-colors py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isFleetOwner ? 'Back to Fleet Trips' : 'Back to Ride Search'}</span>
            </button>

            <div className="flex items-center gap-2">

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[#4F46E5] text-xs font-bold">

                <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />

                <span>Verified Express Corridor</span>

              </span>

              <Badge

                variant={currentTrip.status === 'SCHEDULED' ? 'info' : currentTrip.status === 'COMPLETED' ? 'success' : 'warning'}

                className="capitalize text-xs font-bold px-3 py-1"

              >

                {currentTrip.status}

              </Badge>

            </div>

          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">

            <div className="min-w-0 flex-1">

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">

                <span className="truncate">{currentTrip.origin || currentTrip.source}</span>

                <ArrowRight className="w-5 h-5 text-slate-400 shrink-0" />

                <span className="truncate">{currentTrip.destination}</span>

              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium mt-2">

                <span className="flex items-center gap-1.5 text-slate-800 font-bold">

                  <Calendar className="w-3.5 h-3.5 text-[#4F46E5]" />

                  {formatDateTime(currentTrip.departureDate || currentTrip.departureTime || '')}

                </span>

                <span className="text-slate-300">•</span>

                <span className="flex items-center gap-1">

                  <Clock className="w-3.5 h-3.5 text-slate-400" />

                  {currentTrip.estimatedDuration ? `${Math.floor(currentTrip.estimatedDuration / 60)}h ${currentTrip.estimatedDuration % 60}m duration` : 'Standard Transit'}

                </span>

                {currentTrip.distanceKm ? (

                  <>

                    <span className="text-slate-300">•</span>

                    <span className="flex items-center gap-1">

                      <Navigation className="w-3.5 h-3.5 text-slate-400" />

                      {currentTrip.distanceKm} km route

                    </span>

                  </>

                ) : null}

                <span className="text-slate-300">•</span>

                <span className="flex items-center gap-1 text-emerald-600 font-bold">

                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />

                  100% AC Verified Fleet

                </span>

              </div>

            </div>

            <div className="flex items-baseline gap-1.5 bg-indigo-50/70 border border-indigo-200/80 px-4 py-2.5 rounded-2xl shrink-0 self-start md:self-auto">

              <span className="text-xs font-bold text-slate-500">From</span>

              <span className="text-2xl font-black text-[#4F46E5]">{currencySymbol} {seatPrice}</span>

              <span className="text-xs font-semibold text-slate-500">/ seat</span>

            </div>

          </div>

        </div>

        {/* Mobile View Tabs Selector (Seats / Route / Vehicle - 3 Equal Balanced Columns) */}

        <div className="grid grid-cols-2 gap-1.5 bg-white p-1 rounded-2xl border border-gray-200/90 mb-3 shadow-2xs md:hidden w-full">
          <button
            type="button"
            onClick={() => setMobileActiveTab('seats')}
            className={cn(
              'py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 truncate',
              mobileActiveTab === 'seats'
                ? 'bg-[#4F46E5] text-white shadow-xs'
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
              'py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 truncate',
              mobileActiveTab === 'route'
                ? 'bg-[#4F46E5] text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <Navigation className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Route</span>
          </button>
        </div>

        {/* ── Grid: Desktop Split (Left Details / Right Sticky Booking) & Mobile Flow ── */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start w-full">

          {/* ════════════════════════════════════════════════════════════════════

             LEFT SECTION (Desktop: 7 Cols / Mobile: Shown on Route or Vehicle Tab)

             ════════════════════════════════════════════════════════════════════ */}

          <div className={cn(

            'space-y-4 sm:space-y-6 lg:col-span-7 w-full',

            mobileActiveTab === 'seats' ? 'hidden md:block' : 'block'

          )}>

            <TripDetails
              trip={currentTrip}
              onBook={() => setShowBookingModal(true)}
              hideHeaderCard={true}
              canViewDriverContact={isFleetOwner || isAdmin}
            />

          </div>

          {/* ════════════════════════════════════════════════════════════════════

             RIGHT SECTION: SEAT SELECTION & TICKET BOOKING

             (Desktop: 5 Cols Sticky / Mobile: Primary Focus)

             ════════════════════════════════════════════════════════════════════ */}

          <div className={cn(

            'space-y-3.5 lg:col-span-5 lg:sticky lg:top-20 w-full',

            mobileActiveTab !== 'seats' ? 'hidden md:block' : 'block'

          )}>

            {/* Complete Car Only / Booking Mode Notice */}
            {currentTrip?.bookingMode === 'FULL_VEHICLE' && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/90 border border-indigo-200/90 text-indigo-950 mb-3 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Car className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                        Complete Car Booking Only
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase tracking-wider">
                        Private Cab
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      The fleet owner has listed this trip for entire vehicle booking. All {currentTrip.totalSeats || 4} seats are reserved exclusively for you and your group.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* When trip offers BOTH per-seat and full-car options */}
            {currentTrip?.bookingMode === 'BOTH' && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 mb-3 space-y-2">
                <p className="text-xs font-bold text-slate-800">Booking Option:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBookingFullCar(false);
                      setSelectedSeats([]);
                    }}
                    className={cn(
                      'py-2 px-2.5 rounded-xl border font-bold transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer',
                      !isBookingFullCar
                        ? 'border-[#4F46E5] bg-white text-[#4F46E5] shadow-2xs'
                        : 'border-slate-200 bg-white/50 text-slate-600'
                    )}
                  >
                    <span>Per Seat</span>
                    <span className="text-[10px] font-semibold text-slate-400">₹{seatPrice}/seat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsBookingFullCar(true);
                      const total = currentTrip.totalSeats || currentTrip.availableSeats || 4;
                      setSelectedSeats(Array.from({ length: total }, (_, i) => i + 1));
                    }}
                    className={cn(
                      'py-2 px-2.5 rounded-xl border font-bold transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer',
                      isBookingFullCar
                        ? 'border-[#4F46E5] bg-white text-[#4F46E5] shadow-2xs'
                        : 'border-slate-200 bg-white/50 text-slate-600'
                    )}
                  >
                    <span>Complete Car</span>
                    <span className="text-[10px] font-semibold text-slate-400">₹{fullVehiclePrice} total</span>
                  </button>
                </div>
              </div>
            )}

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

                      {formatVehicleName(currentTrip.vehicle ? `${currentTrip.vehicle.brand} ${currentTrip.vehicle.model}` : currentTrip.vehicleName || 'Toyota Innova')}

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

                  <span className="text-xs sm:text-sm font-black text-[#4F46E5] block whitespace-nowrap">
                    {currencySymbol} {isFullVehicle ? fullVehiclePrice : seatPrice}
                  </span>
                  <span className="text-[10px] text-gray-400 block whitespace-nowrap">
                    {isFullVehicle ? 'entire car' : 'per seat'}
                  </span>

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

            {/* ── Interactive Seat Selector Card OR Private Cab Reservation Card ── */}
            {isFullVehicle ? (
              <div className="bg-white rounded-3xl border-2 border-indigo-100 p-4 sm:p-5 shadow-sm space-y-4 w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] flex items-center justify-center shrink-0 shadow-2xs">
                      <Car className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                        Complete Car Reservation
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Private Cab • Reserved exclusively for your group
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-[10px] uppercase tracking-wider">
                    Full Car
                  </span>
                </div>

                {/* Vehicle Showcase Card */}
                <div className="bg-gradient-to-br from-indigo-50/70 via-slate-50 to-white rounded-2xl border border-indigo-100 p-4 flex items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#4F46E5] bg-white px-2 py-0.5 rounded-md border border-indigo-100 inline-block">
                      {currentTrip?.vehicleType || 'Intercity AC MPV'}
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 truncate">
                      {formatVehicleName(currentTrip?.vehicle ? `${currentTrip.vehicle.brand} ${currentTrip.vehicle.model}` : currentTrip?.vehicleName || 'Toyota Innova')}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium flex items-center gap-2 mt-0.5">
                      <span>👥 Up to {currentTrip?.totalSeats || 4} Passengers</span>
                      <span>•</span>
                      <span>🧳 Luggage Allowed</span>
                    </p>
                  </div>
                  <img
                    src={vehicleImg}
                    alt="Vehicle"
                    className="w-20 h-14 sm:w-24 sm:h-16 object-contain drop-shadow-md shrink-0"
                  />
                </div>

                {/* Key Benefits */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-slate-700 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">100% Private (No Strangers)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-slate-700 font-semibold">
                    <Snowflake className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">Chilled AC Comfort</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-slate-700 font-semibold">
                    <Navigation className="w-4 h-4 text-[#4F46E5] shrink-0" />
                    <span className="truncate">Direct Non-Stop Ride</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-slate-700 font-semibold">
                    <Award className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate">Verified Fleet Driver</span>
                  </div>
                </div>

                {/* Transparent Bill Breakdown */}
                <div className="bg-slate-50/90 rounded-2xl border border-slate-200 p-3.5 sm:p-4 space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-xs font-bold text-slate-800">
                    <span>Fare Breakdown & Bill</span>
                    <span className="text-[10px] text-[#4F46E5] font-extrabold uppercase">Full Cab Charter</span>
                  </div>

                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Complete Vehicle Base Fare</span>
                    <span className="font-bold text-slate-900">{currencySymbol} {fullVehiclePrice}</span>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Platform Service Fee (10%)</span>
                    <span>{currencySymbol} {platformFee}</span>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>GST Taxes (18%)</span>
                    <span>{currencySymbol} {gstTax}</span>
                  </div>

                  <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                    <div>
                      <span className="text-xs sm:text-sm font-black text-slate-900 block leading-tight">
                        Total Payable Amount
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        All vehicle seats & tolls included
                      </span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-[#4F46E5]">
                      {currencySymbol} {totalFinalAmount}
                    </span>
                  </div>
                </div>

                {/* Direct CTA Button */}
                <button
                  type="button"
                  onClick={handleProceedToBooking}
                  disabled={isBookingDisabled}
                  className="w-full h-12 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black text-sm sm:text-base shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Car className="w-4.5 h-4.5 stroke-[2.2]" />
                  <span>Book Entire Car • {currencySymbol}{totalFinalAmount}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200/90 p-3.5 sm:p-5 shadow-xs space-y-3.5 w-full max-w-full overflow-hidden">

              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">

                <h3 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5">

                  <Ticket className="w-4 h-4 text-[#4F46E5] shrink-0" />

                  <span>Choose Your Seat</span>

                </h3>

                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-[#4F46E5]">

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

              {/* Gender Preference Toggle for Seat Selection */}

              <div>

                <div className="flex items-center justify-between mb-1">

                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">

                    Gender For Seat Selection

                  </label>

                  <span className="text-[10px] font-semibold text-slate-400">

                    Active: {passengerGender === 'female' ? '♀ Female' : '♂ Male'}

                  </span>

                </div>

                <div className="grid grid-cols-2 gap-2 bg-gray-100/80 p-1 rounded-xl border border-gray-200 w-full">

                  <button

                    type="button"

                    onClick={() => setPassengerGender('male')}

                    className={cn(

                      'py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 truncate active:scale-95',

                      passengerGender === 'male'

                        ? 'bg-[#4F46E5] text-white shadow-xs ring-1 ring-indigo-700/20'

                        : 'text-gray-600 hover:text-gray-900 bg-transparent'

                    )}

                  >

                    <span className="text-sm font-bold">♂</span>

                    <span>Male</span>

                  </button>

                  <button

                    type="button"

                    onClick={() => setPassengerGender('female')}

                    className={cn(

                      'py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 truncate active:scale-95',

                      passengerGender === 'female'

                        ? 'bg-pink-600 text-white shadow-xs ring-1 ring-pink-700/20'

                        : 'text-gray-600 hover:text-gray-900 bg-transparent'

                    )}

                  >

                    <span className="text-sm font-bold">♀</span>

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

                  seatGenders={seatGenders}

                  onSeatSelect={handleSeatSelect}

                  maxSelectable={Math.min(4, currentTrip.availableSeats)}

                  passengerGender={passengerGender}

                />

              </div>

              {/* Pricing Breakdown Summary */}

              <div className="pt-2.5 border-t border-gray-100 space-y-2 text-xs">

                <div className="flex items-center justify-between">

                  <span className="text-slate-600 font-semibold">Selected Seats</span>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">

                    {selectedSeats.length > 0 ? (

                      selectedSeats.map((s) => {

                        const sGender = seatGenders[s] || passengerGender;

                        return (

                          <span

                            key={s}

                            className={cn(

                              "font-extrabold px-2 py-0.5 rounded-lg text-xs flex items-center gap-1.5 border shadow-2xs transition-all",

                              sGender === 'female'

                                ? "bg-pink-50 text-pink-700 border-pink-300"

                                : "bg-indigo-50 text-[#4F46E5] border-blue-300"

                            )}

                          >

                            <span>Seat #{s}</span>

                            <button

                              type="button"

                              onClick={() => toggleSeatGender(s)}

                              title="Click to toggle Male/Female for this seat"

                              className={cn(

                                "font-black text-[10px] px-1.5 py-0.5 rounded transition-transform active:scale-90 flex items-center gap-0.5 cursor-pointer",

                                sGender === 'female'

                                  ? "bg-pink-200/80 hover:bg-pink-300 text-pink-900"

                                  : "bg-blue-200/80 hover:bg-blue-300 text-blue-900"

                              )}

                            >

                              <span>{sGender === 'female' ? '♀ Female' : '♂ Male'}</span>

                              <span className="text-[9px] opacity-70 ml-0.5">⇄</span>

                            </button>

                          </span>

                        );

                      })

                    ) : (

                      <span className="font-semibold text-slate-400">None selected</span>

                    )}

                  </div>

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

                  onClick={handleProceedToBooking}

                  disabled={selectedSeats.length === 0 || isBookingDisabled}

                  className="hidden lg:flex w-full h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 active:scale-[0.98] transition-all items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:pointer-events-none"

                >

                  <Ticket className="w-4 h-4" />

                  <span>{selectedSeats.length === 0 ? 'Select a Seat to Continue' : 'Proceed to Book'}</span>

                </button>

              </div>

            </div>
            )}

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

                    className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1 pt-1.5 border-t border-gray-100"

                  >

                    <span>View Trip</span>

                    <ArrowRight className="w-3.5 h-3.5" />

                  </Link>

                </div>

              ))}

            </div>

          </div>

        )}

      </div>

      {/* ════════════════════════════════════════════════════════════════════════

         STICKY BOTTOM ACTION BAR ON MOBILE (Fixed above MobileNav)

         ════════════════════════════════════════════════════════════════════════ */}

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 p-3 pb-[calc(env(safe-area-inset-bottom,0px)+74px)] md:hidden shadow-[0_-4px_25px_rgba(0,0,0,0.08)]">

        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">

          <div className="min-w-0">

            <div className="text-[10px] font-bold block leading-none mb-1 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
              {isFullVehicle ? (
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider">
                    Full Car
                  </span>
                  <span className="text-slate-700 font-extrabold text-[11px] truncate">
                    Entire Car Reserved ({currentTrip?.totalSeats || 4} Seats Private)
                  </span>
                </div>
              ) : selectedSeats.length > 0 ? (
                <>
                  <span className="text-slate-700 font-extrabold shrink-0">
                    {selectedSeats.length} Seat{selectedSeats.length > 1 ? 's' : ''}:
                  </span>
                  {selectedSeats.map((s) => {
                    const g = seatGenders[s] || passengerGender;
                    return (
                      <span
                        key={s}
                        className={cn(
                          "font-black text-[9px] px-1.5 py-0.5 rounded border shrink-0 flex items-center gap-0.5",
                          g === 'female'
                            ? "bg-pink-50 text-pink-700 border-pink-200"
                            : "bg-indigo-50 text-[#4F46E5] border-blue-200"
                        )}
                      >
                        #{s} {g === 'female' ? '♀' : '♂'}
                      </span>
                    );
                  })}
                </>
              ) : (
                <span className="text-slate-400">Select Seat(s)</span>
              )}
            </div>

            <span className="text-lg font-black text-[#4F46E5] leading-none">
              {currencySymbol} {totalFinalAmount}
            </span>

          </div>

          <button
            type="button"
            onClick={
              isFullVehicle
                ? handleProceedToBooking
                : mobileActiveTab !== 'seats'
                ? () => {
                    setMobileActiveTab('seats');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                : handleProceedToBooking
            }
            disabled={isBookingDisabled || (!isFullVehicle && selectedSeats.length === 0)}
            className={cn(
              "px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 shrink-0",
              isBookingDisabled || (!isFullVehicle && selectedSeats.length === 0)
                ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                : "bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-indigo-500/20"
            )}
          >
            <span>
              {isFullVehicle
                ? `Book Entire Car • ${currencySymbol}${totalFinalAmount}`
                : selectedSeats.length === 0
                ? 'Pick a Seat'
                : 'Proceed to Book'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>

      {/* ── Booking Form Confirmation Modal ── */}

      <Modal

        isOpen={showBookingModal}

        onClose={() => setShowBookingModal(false)}

        title={isFullVehicle ? "Confirm Private Cab Booking" : "Passenger Details & Booking Confirmation"}

        size="lg"

      >

        <div className="space-y-4 max-h-[75vh] overflow-y-auto px-0.5 py-1 [scrollbar-width:thin]">

          {/* Trip Header Banner */}

          <div className="flex items-center gap-2.5 p-3 bg-indigo-50/70 rounded-2xl border border-indigo-200/70 shadow-2xs">

            <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shrink-0 shadow-xs">

              <Car className="w-4 h-4" />

            </div>

            <div className="min-w-0 flex-1">

              <p className="font-extrabold text-gray-900 text-xs sm:text-sm truncate flex items-center gap-1.5">

                <span>{currentTrip.origin || currentTrip.source}</span>

                <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />

                <span>{currentTrip.destination}</span>

              </p>

              <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">

                Departure: <span className="font-semibold text-gray-700">{formatDateTime(currentTrip.departureDate || currentTrip.departureTime || '')}</span>

              </p>

            </div>

          </div>

          {/* Section: Primary Contact Information */}

          <div className="space-y-2 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">

            <div className="flex items-center justify-between">

              <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">

                <Phone className="w-3.5 h-3.5 text-[#4F46E5]" />

                <span>Contact Details</span>

              </h4>

              <span className="text-[10px] text-gray-400 font-medium">Ticket SMS / WhatsApp / Email</span>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">

              <div>

                <label className="text-[11px] font-semibold text-gray-600 block mb-1">

                  Mobile Number <span className="text-red-500">*</span>

                </label>

                <div className="relative">

                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">

                    +91

                  </span>

                  <input 

                    type="tel" 

                    placeholder="10-digit mobile number" 

                    value={passengerPhone}

                    onChange={(e) => setPassengerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}

                    className="w-full pl-11 pr-3 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5] font-semibold text-gray-900 text-xs shadow-2xs outline-hidden"

                  />

                </div>

              </div>

              <div>

                <label className="text-[11px] font-semibold text-gray-600 block mb-1">

                  Email Address

                </label>

                <div className="relative">

                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">

                    <Mail className="w-3.5 h-3.5" />

                  </span>

                  <input 

                    type="email" 

                    placeholder="email@example.com" 

                    value={passengerEmail}

                    onChange={(e) => setPassengerEmail(e.target.value)}

                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5] font-medium text-gray-900 text-xs shadow-2xs outline-hidden"

                  />

                </div>

              </div>

            </div>

          </div>

          {/* Section: Passenger Details or Full Vehicle Notice */}
          {isFullVehicle ? (
            <div className="p-3.5 bg-gradient-to-r from-indigo-50/80 via-blue-50/40 to-indigo-50/80 rounded-2xl border border-indigo-200/80 flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Car className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-gray-900">Private Cab (Entire Car Reserved)</h4>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    All Seats Included
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Aapne puri gaadi book ki hai. Alag se sabhi passengers ki details add karne ki zarurat nahi hai. Driver aapke primary contact number par call karke pickup karega.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <span>Passenger Details</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Optional</span>
                    <span className="text-[11px] font-bold text-[#4F46E5] bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'}
                    </span>
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Aap chahein toh details fill karein ya skip kar sakte hain</p>
                </div>
              </div>

              <div className="space-y-3">
                {selectedSeats.map((seatNum, idx) => {
                  const info = passengersBySeat[seatNum] || { name: '', age: '', gender: seatGenders[seatNum] || 'male' };
                  const currentGender = info.gender || 'male';

                  return (
                    <div 
                      key={seatNum} 
                      className="p-3.5 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-3 transition-all hover:border-indigo-300 hover:shadow-xs"
                    >
                      {/* Passenger Card Header */}
                      <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#4F46E5] text-white text-[11px] font-black px-2.5 py-0.5 rounded-lg shadow-2xs flex items-center gap-1">
                            Seat #{seatNum}
                          </span>
                          <span className="text-xs font-bold text-gray-700">
                            Passenger {idx + 1}
                          </span>
                        </div>

                        {/* Gender Selector Toggle Buttons */}
                        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl border border-gray-200/80">
                          <button
                            type="button"
                            onClick={() => updatePassengerInfo(seatNum, 'gender', 'male')}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1",
                              currentGender === 'male'
                                ? "bg-[#4F46E5] text-white shadow-xs scale-102"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                            )}
                          >
                            <span>♂</span>
                            <span>Male</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePassengerInfo(seatNum, 'gender', 'female')}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1",
                              currentGender === 'female'
                                ? "bg-pink-600 text-white shadow-xs scale-102"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                            )}
                          >
                            <span>♀</span>
                            <span>Female</span>
                          </button>
                        </div>
                      </div>

                      {/* Inputs: Full Name & Age */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                            Full Name <span className="text-[10px] text-gray-400 font-normal">(Optional)</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                              <User className="w-3.5 h-3.5" />
                            </span>
                            <input
                              type="text"
                              placeholder="e.g. Rahul Sharma (Optional)"
                              value={info.name}
                              onChange={(e) => updatePassengerInfo(seatNum, 'name', e.target.value)}
                              className="w-full pl-8 pr-3 py-2 bg-gray-50/80 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5] font-semibold text-gray-900 text-xs shadow-2xs outline-hidden"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                            Age <span className="text-[10px] text-gray-400 font-normal">(Optional)</span>
                          </label>
                          <input
                            type="number"
                            placeholder="Age (Optional)"
                            min="1"
                            max="120"
                            value={info.age}
                            onChange={(e) => updatePassengerInfo(seatNum, 'age', e.target.value.replace(/\D/g, '').slice(0, 3))}
                            className="w-full px-3 py-2 bg-gray-50/80 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5] font-semibold text-gray-900 text-xs shadow-2xs outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Boarding Points */}

          <div className="space-y-2 bg-slate-50/70 p-3 rounded-2xl border border-slate-200">

            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Boarding & Dropping Locations</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">

              <div>

                <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Pickup Location</label>

                <input 

                  type="text" 

                  placeholder="e.g. Bus Stand / Hotel" 

                  value={pickupPoint}

                  onChange={(e) => setPickupPoint(e.target.value)}

                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xl focus:ring-1 focus:ring-[#4F46E5] font-medium text-gray-900 text-xs shadow-2xs outline-hidden"

                />

              </div>

              <div>

                <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Drop Location</label>

                <input 

                  type="text" 

                  placeholder="e.g. Railway Station" 

                  value={dropPoint}

                  onChange={(e) => setDropPoint(e.target.value)}

                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xl focus:ring-1 focus:ring-[#4F46E5] font-medium text-gray-900 text-xs shadow-2xs outline-hidden"

                />

              </div>

            </div>

          </div>

          {/* Pricing Summary */}

          <div className="bg-slate-50 p-3 rounded-2xl border border-gray-200 space-y-1.5 text-xs">

            <div className="flex justify-between items-start gap-2">
              <span className="text-gray-500 font-medium">{isFullVehicle ? 'Booking Type' : `Selected Seats (${selectedSeats.length})`}</span>
              <div className="flex items-center gap-1.5 font-bold text-gray-800 flex-wrap justify-end">
                {isFullVehicle ? (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 shadow-2xs bg-emerald-50 text-emerald-800 border-emerald-200">
                    Entire Vehicle ({currentTrip?.totalSeats || 4} Seats Private)
                  </span>
                ) : (
                  selectedSeats.map((s) => {
                    const info = passengersBySeat[s];
                    const g = info?.gender || seatGenders[s] || passengerGender;
                    return (
                      <span
                        key={s}
                        className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 shadow-2xs",
                          g === 'female'
                            ? "bg-pink-50 text-pink-700 border-pink-200"
                            : "bg-indigo-50 text-[#4F46E5] border-indigo-200"
                        )}
                      >
                        <span>Seat #{s}</span>
                        <span>{g === 'female' ? '♀ Female' : '♂ Male'}</span>
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-between">

              <span className="text-gray-500">{isFullVehicle ? 'Base Fare (Entire Car)' : `Base Fare (${selectedSeats.length} × ${currencySymbol}${seatPrice})`}</span>

              <span className="font-semibold text-gray-800">{currencySymbol} {subtotal}</span>

            </div>

            <div className="flex justify-between text-[11px] text-gray-500">

              <span>Platform Fee (10%) & GST Taxes (18%)</span>

              <span>{currencySymbol} {platformFee + gstTax}</span>

            </div>

            <div className="border-t border-gray-200 pt-1.5 flex justify-between text-xs sm:text-sm font-extrabold text-gray-900">

              <span>Total Payable Amount</span>

              <span className="text-[#4F46E5] font-black text-base sm:text-lg">{currencySymbol} {totalFinalAmount}</span>

            </div>

          </div>

          {/* Action Buttons */}

          <div className="flex gap-2.5 pt-2 sticky bottom-0 bg-white/95 backdrop-blur-xs py-2 border-t border-gray-100">

            <Button

              variant="secondary"

              onClick={() => setShowBookingModal(false)}

              className="flex-1 font-bold rounded-xl h-11 text-xs border-gray-300"

            >

              Back

            </Button>

            <Button 

              onClick={handleBook} 

              className="flex-1 font-bold rounded-xl h-11 text-xs shadow-md bg-[#4F46E5] hover:bg-[#4338CA] text-white flex items-center justify-center gap-2"

            >

              <span>Confirm & Pay {currencySymbol}{totalFinalAmount}</span>

              <ArrowRight className="w-4 h-4" />

            </Button>

          </div>

        </div>

      </Modal>

      {/* ── Payment Modal: Direct Vehicle Owner UPI / QR ── */}

      <Modal

        isOpen={showPaymentModal}

        onClose={() => setShowPaymentModal(false)}

        title="Pay Vehicle Owner via UPI / QR"

        size="md"

      >

        <PaymentForm

          amount={Number(paymentAmount) || Number(totalFinalAmount)}

          currency={currentTrip.currency || 'INR'}

          bookingId={bookingId}

          ownerUpiId={currentTrip.vehicle?.upiId || (currentTrip.vehicle as any)?.owner?.upiId}

          ownerName={currentTrip.vehicle?.upiAccountName || (currentTrip.vehicle as any)?.owner?.upiAccountName || currentTrip.operatorName}

          ownerQrCodeUrl={currentTrip.vehicle?.upiQrCodeUrl || (currentTrip.vehicle as any)?.owner?.upiQrCodeUrl}

          provider="DIRECT_UPI"

          onSuccess={handlePaymentSuccess}

          onError={(error) => showToast(error, 'error')}

        />

      </Modal>

    </div>

  );

}

