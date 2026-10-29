'use client';

import React from 'react';
import { usePassengerStore } from '@/store/slices/passengerStore';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/common/EmptyState';
import {
  Star,
  Trash2,
  Calendar,
  Award,
  UserCheck,
} from 'lucide-react';

export default function FavoriteDriversPage() {
  const { favoriteDrivers, removeFavoriteDriver } = usePassengerStore();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-2 rounded-xl bg-amber-100">
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Favorite Drivers</h1>
        </div>
        <p className="text-sm text-gray-500">
          Drivers you&apos;ve saved from previous trips
        </p>
      </div>

      {favoriteDrivers.length === 0 ? (
        <EmptyState
          title="No favorite drivers"
          description="After completing a trip, you can save your favorite drivers for future bookings."
          customIcon={<UserCheck className="w-8 h-8 text-gray-400" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteDrivers.map((driver) => (
            <div
              key={driver.id}
              className="rounded-2xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all duration-200 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={driver.profileImage}
                    name={`${driver.firstName} ${driver.lastName}`}
                    size="md"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {driver.firstName} {driver.lastName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-semibold text-gray-600">
                        {driver.rating?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeFavoriteDriver(driver.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5" />
                  <span>{driver.totalTrips || 0} trips completed</span>
                </div>
                {driver.lastRodeAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Last rode: {new Date(driver.lastRodeAt).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Saved {new Date(driver.addedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
