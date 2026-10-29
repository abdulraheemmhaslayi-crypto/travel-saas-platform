'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useTripStore } from '@/store/slices/tripSlice';
import { usePassengerStore } from '@/store/slices/passengerStore';
import { formatCurrency } from '@/lib/utils';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import {
  TrendingUp,
  MapPin,
  ArrowRight,
  Heart,
  Search,
  Sparkles,
} from 'lucide-react';

export default function PopularRoutesPage() {
  const { popularRoutes, isLoading, getPopularRoutes } = useTripStore();
  const { addFavoriteRoute, removeFavoriteRoute, isFavoriteRoute } = usePassengerStore();

  useEffect(() => {
    getPopularRoutes();
  }, [getPopularRoutes]);

  if (isLoading) return <Loading text="Loading popular routes..." />;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-2 rounded-xl bg-purple-100">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Popular Routes</h1>
        </div>
        <p className="text-sm text-gray-500">
          Most searched and booked routes on our platform
        </p>
      </div>

      {popularRoutes.length === 0 ? (
        <EmptyState
          title="No popular routes yet"
          description="Routes will appear here as trips are booked on the platform."
          customIcon={<MapPin className="w-8 h-8 text-gray-400" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularRoutes.map((route, index) => {
            const isFav = isFavoriteRoute(route.origin, route.destination);
            return (
              <div
                key={route.id}
                className="rounded-2xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-200 overflow-hidden group"
              >
                {/* Gradient header */}
                <div className={`h-2 ${
                  index < 3
                    ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-red-400'
                    : 'bg-gradient-to-r from-primary-400 to-blue-400'
                }`} />

                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {index < 3 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span className="text-[10px] font-bold text-amber-700">#{index + 1}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (isFav) {
                          const stored = usePassengerStore.getState().favoriteRoutes.find(
                            (r) => r.origin === route.origin && r.destination === route.destination
                          );
                          if (stored) removeFavoriteRoute(stored.id);
                        } else {
                          addFavoriteRoute(route.origin, route.destination);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          isFav ? 'text-red-500 fill-red-500' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                      <div className="w-px h-6 bg-gray-200" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{route.origin}</p>
                      <p className="text-sm font-bold text-gray-900 truncate mt-2">{route.destination}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Avg. price</p>
                      <p className="text-lg font-extrabold text-gray-900">
                        {formatCurrency(route.avgPrice)}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/trips/search?origin=${encodeURIComponent(route.origin)}&destination=${encodeURIComponent(route.destination)}`}
                    >
                      <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-50 text-primary-700 text-sm font-bold hover:bg-primary-100 transition-colors">
                        <Search className="w-3.5 h-3.5" />
                        Search
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
