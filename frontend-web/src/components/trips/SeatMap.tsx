'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { TripSeat } from '@/types/trip';

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
  passengerGender,
}) => {
  const totalSeatsCount = seats && seats.length > 0 ? seats.length : (vehicleType === 'Bus' ? 40 : 4);
  
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

  const getSeatGender = (seatNumber: number) => {
    const seatObj = seatsList.find((s) => parseInt(s.seatNumber, 10) === seatNumber);
    return seatObj?.gender;
  };

  const isSeatRecommended = (seatNumber: number) => {
    if (!passengerGender) return false;
    
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
      if (adjSeat && adjSeat.status !== 'available' && adjSeat.gender === passengerGender) {
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

  const seatColors = {
    available: 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-500 cursor-pointer',
    selected: 'bg-sky-500 text-white border-sky-600 cursor-pointer shadow-md scale-105 shadow-sky-100',
    booked: 'bg-rose-50 text-rose-500 border-rose-200 cursor-not-allowed opacity-80',
    reserved: 'bg-amber-50 text-amber-700 border-amber-300 cursor-not-allowed opacity-80',
    blocked: 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50',
    unavailable: 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50',
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
        <h3 className="text-sm font-semibold text-gray-700">Select Seats</h3>
        <p className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">
          {selectedSeats.length} of {maxSelectable} selected
        </p>
      </div>

      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-3.5 sm:p-5 flex flex-col items-center">
        {/* Driver seat indicator */}
        <div className="flex justify-between w-full max-w-[200px] mb-3 px-2">
          <div className="text-xs text-gray-400 font-medium self-center">Front of vehicle</div>
          <div className="w-9 h-9 rounded-xl bg-gray-200 border border-gray-300 flex items-center justify-center shadow-xs" title="Driver Seat">
            <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9"/>
              <circle cx="12" cy="12" r="3"/>
              <line x1="12" y1="3" x2="12" y2="9"/>
              <line x1="12" y1="15" x2="12" y2="21"/>
              <line x1="3" y1="12" x2="9" y2="12"/>
              <line x1="15" y1="12" x2="21" y2="12"/>
            </svg>
          </div>
        </div>

        {/* Seat grid */}
        <div className="space-y-3 w-full max-w-[200px]">
          {seatLayout.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-3 justify-center">
              {row.map((seatNumber) => {
                const status = getSeatStatus(seatNumber);
                const gender = getSeatGender(seatNumber);
                const recommended = status === 'available' && isSeatRecommended(seatNumber);
                const isUnavailable = status !== 'available' && status !== 'selected';

                return (
                  <button
                    key={seatNumber}
                    onClick={() => handleSeatClick(seatNumber)}
                    disabled={isUnavailable}
                    className={cn(
                      'w-10 h-10 rounded-xl border-2 flex flex-col items-center justify-center text-sm font-semibold transition-all duration-200 select-none relative',
                      isUnavailable && gender === 'male' && 'border-blue-400 bg-blue-50 text-blue-700 opacity-90',
                      isUnavailable && gender === 'female' && 'border-pink-400 bg-pink-50 text-pink-700 opacity-90',
                      isUnavailable && !gender && (seatColors[status as keyof typeof seatColors] || seatColors.booked),
                      status === 'available' && recommended && 'border-indigo-500 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-600 text-indigo-700 ring-2 ring-indigo-300 ring-offset-1',
                      status === 'available' && !recommended && seatColors.available,
                      status === 'selected' && seatColors.selected
                    )}
                    title={`Seat ${seatNumber} - ${status}${gender ? ` (${gender})` : ''}${recommended ? ' (Recommended)' : ''}`}
                  >
                    <span className="text-[11px] leading-none">{seatNumber}</span>
                    {isUnavailable && gender === 'male' && (
                      <span className="text-[10px] leading-none mt-0.5 text-blue-500 font-bold">♂</span>
                    )}
                    {isUnavailable && gender === 'female' && (
                      <span className="text-[10px] leading-none mt-0.5 text-pink-500 font-bold">♀</span>
                    )}
                    {status === 'available' && recommended && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-gray-100 pt-3 text-[10px] text-gray-600 font-semibold justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-emerald-50 border border-emerald-300 shrink-0" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-sky-500 border border-sky-600 shadow-sm shrink-0" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-amber-50 border border-amber-300 shrink-0" />
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-rose-50 border border-rose-200 shrink-0" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200 shrink-0" />
          <span>Blocked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-blue-50 border border-blue-400 flex items-center justify-center shrink-0 text-blue-500 font-bold">♂</div>
          <span>Male</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-pink-50 border border-pink-400 flex items-center justify-center shrink-0 text-pink-500 font-bold">♀</div>
          <span>Female</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-indigo-50 border border-indigo-500 relative shrink-0">
            <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
          </div>
          <span>Recommended</span>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;