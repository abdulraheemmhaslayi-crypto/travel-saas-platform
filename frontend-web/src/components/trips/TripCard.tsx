'use client';

import React from 'react';
import Link from 'next/link';
import { Trip } from '@/types/trip';
import { formatCurrency } from '@/lib/utils';
import { MapPin, Calendar, Users, ArrowRight, Clock, Star, Landmark } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface TripCardProps {
  trip: Trip;
  variant?: 'default' | 'compact' | 'detailed';
  onBook?: (tripId: string) => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, variant = 'default', onBook }) => {
  const isUpcoming = new Date(trip.departureTime || trip.departureDate) > new Date();

  const formatTimeOnly = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'N/A';
    }
  };

  const formatDateOnly = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const getVehicleEmoji = (type: string) => {
    const t = String(type).toUpperCase();
    if (t.includes('SEDAN')) return '🚗';
    if (t.includes('SUV')) return '🚙';
    if (t.includes('HATCHBACK')) return '🚗';
    if (t.includes('BUS')) return '🚌';
    if (t.includes('VAN')) return '🚐';
    return '🚗';
  };

  if (variant === 'compact') {
    return (
      <Card className="hover:shadow-md transition-all duration-200 border border-gray-100 bg-white">
        <div className="flex items-center justify-between p-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span className="text-base">{getVehicleEmoji(trip.vehicleType || 'sedan')}</span>
              <span>{trip.origin}</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              <span>{trip.destination}</span>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{formatDateOnly(trip.departureTime || trip.departureDate)} • {formatTimeOnly(trip.departureTime || trip.departureDate)}</span>
            </p>
            {trip.matchDetails && (
              <p className="text-xs font-semibold text-indigo-600 mt-1">
                {trip.matchDetails.rank === 1 && "Exact Match"}
                {trip.matchDetails.rank === 2 && `Boards at ${trip.matchDetails.sourceStop}, alights at ${trip.matchDetails.destStop}`}
                {trip.matchDetails.rank === 3 && `Near Source: ${trip.matchDetails.sourceStop}`}
                {trip.matchDetails.rank === 4 && `Near Dest: ${trip.matchDetails.destStop}`}
                {trip.matchDetails.rank === 5 && `Nearby Stops`}
                {trip.matchDetails.rank === 6 && (trip.matchDetails.isDepartureOnly ? `Near Source: ${trip.matchDetails.sourceStop}` : `Near Dest: ${trip.matchDetails.destStop}`)}
              </p>
            )}
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <p className="text-lg font-bold text-blue-600">
              {formatCurrency(trip.pricePerSeat || trip.price || 0, trip.currency || 'INR')}
            </p>
            <Badge variant={trip.availableSeats > 0 ? 'success' : 'danger'} size="sm">
              {trip.availableSeats} seats left
            </Badge>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border border-gray-200 bg-white rounded-2xl overflow-hidden">
      <div className="p-6 space-y-4">
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getVehicleEmoji(trip.vehicleType || 'sedan')}</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
              {trip.vehicleType || 'Sedan'}
            </span>
            <Badge variant={isUpcoming ? 'info' : trip.status === 'COMPLETED' ? 'success' : 'default'}>
              {trip.status}
            </Badge>
          </div>
          <div className="text-right">
            <span className="text-2xl font-extrabold text-blue-600">
              {formatCurrency(trip.pricePerSeat || trip.price || 0, trip.currency || 'INR')}
            </span>
            <span className="text-xs text-gray-400 block mt-0.5">per seat</span>
          </div>
        </div>

        {/* Route Row */}
        <div className="py-2">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>{trip.origin}</span>
            <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
            <span>{trip.destination}</span>
          </h3>

          {trip.matchDetails && (
            <div className="mt-2 text-xs font-semibold text-indigo-700 bg-indigo-50/75 border border-indigo-100/50 px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                {trip.matchDetails.rank === 1 && "Exact Route Match"}
                {trip.matchDetails.rank === 2 && `Route Match: boards at ${trip.matchDetails.sourceStop}, alights at ${trip.matchDetails.destStop}`}
                {trip.matchDetails.rank === 3 && `Nearby Departure: boards at ${trip.matchDetails.sourceStop} (${trip.matchDetails.sourceDist?.toFixed(1)}km away)`}
                {trip.matchDetails.rank === 4 && `Nearby Destination: alights at ${trip.matchDetails.destStop} (${trip.matchDetails.destDist?.toFixed(1)}km away)`}
                {trip.matchDetails.rank === 5 && `Nearby Route: boards at ${trip.matchDetails.sourceStop} (${trip.matchDetails.sourceDist?.toFixed(1)}km away), alights at ${trip.matchDetails.destStop} (${trip.matchDetails.destDist?.toFixed(1)}km away)`}
                {trip.matchDetails.rank === 6 && (
                  trip.matchDetails.isDepartureOnly 
                    ? `Starts near you: boarding at ${trip.matchDetails.sourceStop} (${trip.matchDetails.sourceDist?.toFixed(1)}km away)`
                    : `Passes near your destination: alights at ${trip.matchDetails.destStop} (${trip.matchDetails.destDist?.toFixed(1)}km away)`
                )}
              </span>
            </div>
          )}
        </div>

        {/* Departure/Arrival info in a row */}
        <div className="grid grid-cols-2 gap-4 py-3 bg-gray-50 rounded-xl px-4 text-sm text-gray-700">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Departure</p>
            <p className="font-bold text-gray-900 mt-0.5">{formatTimeOnly(trip.departureTime || trip.departureDate)}</p>
            <p className="text-xs text-gray-500">{formatDateOnly(trip.departureTime || trip.departureDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Arrival (Estimated)</p>
            <p className="font-bold text-gray-900 mt-0.5">{trip.arrivalTime ? formatTimeOnly(trip.arrivalTime) : 'Flexible'}</p>
            <p className="text-xs text-gray-500">{trip.arrivalTime ? formatDateOnly(trip.arrivalTime) : 'Same day'}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{trip.availableSeats} seat{trip.availableSeats !== 1 ? 's' : ''} available</span>
          </div>
          {trip.driver && (
            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
              <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                {(trip.driver.user?.firstName || (trip.driver as any).firstName || 'D')[0]}
                {(trip.driver.user?.lastName || (trip.driver as any).lastName || '')[0]}
              </span>
              <span>
                {trip.driver.user?.firstName || (trip.driver as any).firstName || 'Driver'} {trip.driver.user?.lastName || (trip.driver as any).lastName || ''}
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions Row */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 gap-3">
          <Link
            href={`/dashboard/trips/${trip.id}`}
            className="text-sm font-bold text-gray-600 hover:text-gray-900 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            View Details
          </Link>
          {onBook && trip.availableSeats > 0 ? (
            <button
              onClick={() => onBook(trip.id)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow shadow-blue-100 hover:shadow-md hover:scale-[1.01] transition-all duration-200"
            >
              Book Now
            </button>
          ) : (
            <span className="text-xs font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded">Sold Out</span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TripCard;