'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { TripSeat } from '@/types/trip';
import { Sparkles, Check } from 'lucide-react';

interface SeatMapProps {
  seats?: TripSeat[];
  vehicleType?: string;
  selectedSeats: number[];
  onSeatSelect: (seatNumber: number) => void;
  maxSelectable?: number;
  passengerGender?: 'male' | 'female';
}

const SeatMap: React.FC<SeatMapProps> = ({
  seats = [],
  vehicleType = 'Sedan',
  selectedSeats,
  onSeatSelect,
  maxSelectable = 4,
  passengerGender = 'female',
}) => {
  const totalSeatsCount = seats && seats.length > 0 ? seats.length : (vehicleType === 'Bus' ? 40 : 7);
  
  // Safe mapping of seats from backend
  const seatsList: TripSeat[] = seats && seats.length > 0
    ? seats
    : Array.from({ length: totalSeatsCount }, (_, i) => ({
        id: `mock-${i + 1}`,
        tripId: '',
        seatNumber: (i + 1).toString(),
        seatType: 'window',
        status: 'available',
        createdAt: '',
        updatedAt: '',
      }));

  const getSeatStatus = (seatNumber: number) => {
    if (selectedSeats.includes(seatNumber)) return 'selected';
    const seatObj = seatsList.find((s) => parseInt(s.seatNumber, 10) === seatNumber);
    if (!seatObj) return 'booked';
    return seatObj.status; // 'available' | 'booked' | 'reserved' | 'blocked' | 'unavailable'
  };

  const getSeatGender = (seatNumber: number): 'male' | 'female' | null => {
    const seatObj = seatsList.find((s) => parseInt(s.seatNumber, 10) === seatNumber);
    const g = seatObj?.gender?.toLowerCase();
    if (g === 'male' || g === 'm') return 'male';
    if (g === 'female' || g === 'f') return 'female';
    return null;
  };

  const isSeatRecommended = (seatNumber: number) => {
    if (!passengerGender || passengerGender !== 'female') return false;
    
    const cols = vehicleType === 'Bus' ? 4 : 2;
    const sIndex = seatNumber - 1;
    const row = Math.floor(sIndex / cols);
    const col = sIndex % cols;
    
    const adjacentIndices: number[] = [];
    if (col > 0) adjacentIndices.push(sIndex - 1);
    if (col < cols - 1) adjacentIndices.push(sIndex + 1);
    
    for (const adjIdx of adjacentIndices) {
      const adjSeatNumber = adjIdx + 1;
      const adjSeat = seatsList.find((s) => parseInt(s.seatNumber, 10) === adjSeatNumber);
      if (adjSeat && adjSeat.status !== 'available' && adjSeat.gender?.toLowerCase() === 'female') {
        return true;
      }
    }
    
    return false;
  };

  const handleSeatClick = (seatNumber: number) => {
    const status = getSeatStatus(seatNumber);
    if (status !== 'available' && status !== 'selected') return;
    
    if (selectedSeats.includes(seatNumber)) {
      onSeatSelect(seatNumber);
    } else if (selectedSeats.length < maxSelectable) {
      onSeatSelect(seatNumber);
    }
  };

  // Generate seat layout based on vehicle type
  const generateSeats = () => {
    const grid: number[][] = [];
    const cols = vehicleType === 'Bus' ? 4 : 2;
    
    for (let i = 0; i < totalSeatsCount; i += cols) {
      const row: number[] = [];
      for (let j = 0; j < cols && i + j < totalSeatsCount; j++) {
        row.push(i + j + 1);
      }
      grid.push(row);
    }
    return grid;
  };

  const seatLayout = generateSeats();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Select Seats</h3>
        <p className="text-xs text-slate-600 font-semibold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
          {selectedSeats.length} of {maxSelectable} selected
        </p>
      </div>

      <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col items-center">
        {/* Front of vehicle & Steering Wheel indicator */}
        <div className="flex justify-between items-center w-full max-w-[210px] mb-4 px-1">
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            Front of vehicle
          </div>
          <div
            className="w-9 h-9 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center shadow-xs"
            title="Driver Seat (Front Right / Left)"
          >
            <svg
              className="w-5 h-5 text-slate-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="3" x2="12" y2="9" />
              <line x1="12" y1="15" x2="12" y2="21" />
              <line x1="3" y1="12" x2="9" y2="12" />
              <line x1="15" y1="12" x2="21" y2="12" />
            </svg>
          </div>
        </div>

        {/* Seat grid */}
        <div className="space-y-3 w-full max-w-[210px]">
          {seatLayout.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-3.5 justify-center">
              {row.map((seatNumber) => {
                const status = getSeatStatus(seatNumber);
                const gender = getSeatGender(seatNumber);
                const recommended = status === 'available' && isSeatRecommended(seatNumber);
                const isUnavailable = status !== 'available' && status !== 'selected';
                const isSelected = status === 'selected';

                return (
                  <button
                    key={seatNumber}
                    type="button"
                    onClick={() => handleSeatClick(seatNumber)}
                    disabled={isUnavailable}
                    className={cn(
                      'w-11 h-11 sm:w-12 sm:h-12 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 select-none relative active:scale-95',
                      // 1. Available state
                      status === 'available' &&
                        !recommended &&
                        'bg-white text-slate-800 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer shadow-2xs',
                      // 2. Recommended for female
                      status === 'available' &&
                        recommended &&
                        'bg-pink-50/70 text-pink-900 border-pink-400 ring-2 ring-pink-300 ring-offset-1 hover:bg-pink-100 cursor-pointer shadow-xs',
                      // 3. Selected by Current User (Female)
                      isSelected &&
                        passengerGender === 'female' &&
                        'bg-pink-600 text-white border-pink-700 shadow-md shadow-pink-200 scale-105 ring-2 ring-pink-400 ring-offset-1 cursor-pointer font-bold',
                      // 4. Selected by Current User (Male)
                      isSelected &&
                        passengerGender === 'male' &&
                        'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-200 scale-105 ring-2 ring-blue-400 ring-offset-1 cursor-pointer font-bold',
                      // 5. Booked / Reserved by Female
                      isUnavailable &&
                        gender === 'female' &&
                        'bg-pink-50 text-pink-700 border-pink-300 cursor-not-allowed opacity-90',
                      // 6. Booked / Reserved by Male
                      isUnavailable &&
                        gender === 'male' &&
                        'bg-blue-50 text-blue-700 border-blue-300 cursor-not-allowed opacity-90',
                      // 7. Booked (Unspecified / General) - NEUTRAL GRAY
                      isUnavailable &&
                        !gender &&
                        'bg-slate-100 text-slate-500 border-slate-300 cursor-not-allowed opacity-80'
                    )}
                    title={
                      isSelected
                        ? `Seat ${seatNumber} - Selected by you (${passengerGender === 'female' ? 'Female' : 'Male'})`
                        : isUnavailable
                        ? `Seat ${seatNumber} - Booked ${gender ? `by ${gender === 'female' ? 'Female' : 'Male'} passenger` : ''}`
                        : recommended
                        ? `Seat ${seatNumber} - Available (Recommended next to female co-passenger)`
                        : `Seat ${seatNumber} - Available`
                    }
                  >
                    {/* Seat Number */}
                    <span
                      className={cn(
                        'text-xs font-extrabold leading-none',
                        isSelected && 'text-white'
                      )}
                    >
                      {seatNumber}
                    </span>

                    {/* Gender Indicator Badges on Seat */}
                    {isSelected && (
                      <span className="text-[10px] font-black leading-none mt-0.5 text-white">
                        {passengerGender === 'female' ? '♀' : '♂'}
                      </span>
                    )}

                    {!isSelected && isUnavailable && gender === 'female' && (
                      <span className="text-[11px] font-black leading-none mt-0.5 text-pink-600">
                        ♀
                      </span>
                    )}

                    {!isSelected && isUnavailable && gender === 'male' && (
                      <span className="text-[11px] font-black leading-none mt-0.5 text-blue-600">
                        ♂
                      </span>
                    )}

                    {!isSelected && isUnavailable && !gender && (
                      <span className="text-[9px] font-bold leading-none mt-0.5 text-slate-400">
                        ✕
                      </span>
                    )}

                    {/* Corner badge for Recommended */}
                    {status === 'available' && recommended && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500 items-center justify-center text-[7px] text-white font-bold">
                          ★
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Clear Gender-Differentiated Legend ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
          Seat Status & Gender Legend
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-semibold text-slate-700">
          {/* Available */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-white border-2 border-slate-300 shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-600">
              #
            </div>
            <span className="text-[11px]">Available</span>
          </div>

          {/* Selected by You */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-5 h-5 rounded-lg text-white shrink-0 flex items-center justify-center text-[10px] font-black shadow-xs',
                passengerGender === 'female'
                  ? 'bg-pink-600 border border-pink-700'
                  : 'bg-blue-600 border border-blue-700'
              )}
            >
              {passengerGender === 'female' ? '♀' : '♂'}
            </div>
            <span className="text-[11px]">Selected (You)</span>
          </div>

          {/* Booked (Female) */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-pink-50 border-2 border-pink-400 text-pink-600 shrink-0 flex items-center justify-center text-[11px] font-black">
              ♀
            </div>
            <span className="text-[11px] text-pink-800">Booked (Female)</span>
          </div>

          {/* Booked (Male) */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-blue-50 border-2 border-blue-400 text-blue-600 shrink-0 flex items-center justify-center text-[11px] font-black">
              ♂
            </div>
            <span className="text-[11px] text-blue-800">Booked (Male)</span>
          </div>

          {/* Booked (General) */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-slate-100 border-2 border-slate-300 text-slate-400 shrink-0 flex items-center justify-center text-[10px] font-bold">
              ✕
            </div>
            <span className="text-[11px] text-slate-500">Booked (General)</span>
          </div>

          {/* Recommended for Women */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-pink-50 border-2 border-pink-400 ring-2 ring-pink-300 text-pink-600 shrink-0 flex items-center justify-center text-[10px] font-black">
              ★
            </div>
            <span className="text-[11px] text-pink-900">Women Safety</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
