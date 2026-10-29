'use client';

import React from 'react';
import { Trip } from '@/types/trip';
import { formatDateTime, formatDuration } from '@/lib/utils';
import { MapPin, Flag, Clock, Navigation } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface TripProgressProps {
  trip: Trip;
  currentLocation?: { latitude: number; longitude: number };
  estimatedArrival?: string;
  progress?: number; // 0-100
}

const TripProgress: React.FC<TripProgressProps> = ({
  trip,
  currentLocation,
  estimatedArrival,
  progress = 0,
}) => {
  const now = new Date();
  const departure = new Date(trip.departureDate);
  const isActive = trip.status === 'ACTIVE';
  const isCompleted = trip.status === 'COMPLETED';

  const getProgressColor = () => {
    if (progress < 30) return 'bg-blue-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card>
      <div className="p-6">
        {/* Status Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Trip Progress</h3>
            <p className="text-sm text-gray-500">
              {trip.origin} → {trip.destination}
            </p>
          </div>
          <Badge variant={isCompleted ? 'success' : isActive ? 'info' : 'default'}>
            {trip.status}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="relative mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all duration-500 rounded-full', getProgressColor())}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          {/* Waypoints */}
          <div className="absolute top-4 left-0 transform -translate-x-1/2 text-center">
            <div className={cn(
              'w-4 h-4 rounded-full border-2 mx-auto mb-1',
              progress >= 0 ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-300'
            )} />
            <span className="text-xs text-gray-600">Start</span>
          </div>
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center">
            <div className={cn(
              'w-4 h-4 rounded-full border-2 mx-auto mb-1',
              progress >= 50 ? 'bg-yellow-500 border-yellow-500' : 'bg-white border-gray-300'
            )} />
            <span className="text-xs text-gray-600">Midway</span>
          </div>
          <div className="absolute top-4 right-0 transform translate-x-1/2 text-center">
            <div className={cn(
              'w-4 h-4 rounded-full border-2 mx-auto mb-1',
              progress >= 100 ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'
            )} />
            <span className="text-xs text-gray-600">End</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Departure</p>
            <p className="text-sm font-medium text-gray-900">{formatDateTime(trip.departureDate)}</p>
          </div>

          {estimatedArrival && (
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Flag className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Est. Arrival</p>
              <p className="text-sm font-medium text-gray-900">{formatDateTime(estimatedArrival)}</p>
            </div>
          )}

          {currentLocation && (
            <div className="text-center p-3 bg-primary-50 rounded-lg">
              <Navigation className="w-5 h-5 text-primary-600 mx-auto mb-1" />
              <p className="text-xs text-primary-600">Current Location</p>
              <p className="text-sm font-medium text-primary-700">
                {currentLocation.latitude.toFixed(2)}, {currentLocation.longitude.toFixed(2)}
              </p>
            </div>
          )}

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <MapPin className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Progress</p>
            <p className="text-sm font-medium text-gray-900">{Math.round(progress)}%</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

import { cn } from '@/lib/utils';

export default TripProgress;