'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePassengerStore } from '@/store/slices/passengerStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/common/EmptyState';
import {
  MapPin,
  Search,
  Trash2,
  Plus,
  ArrowRight,
  Route,
} from 'lucide-react';

export default function SavedRoutesPage() {
  const { favoriteRoutes, addFavoriteRoute, removeFavoriteRoute, updateRouteLastSearched } = usePassengerStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOrigin, setNewOrigin] = useState('');
  const [newDestination, setNewDestination] = useState('');

  const handleAdd = () => {
    if (newOrigin.trim() && newDestination.trim()) {
      addFavoriteRoute(newOrigin.trim(), newDestination.trim());
      setNewOrigin('');
      setNewDestination('');
      setShowAddForm(false);
    }
  };

  const handleSearch = (origin: string, destination: string) => {
    updateRouteLastSearched(origin, destination);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-emerald-100">
              <Route className="w-5 h-5 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Saved Routes</h1>
          </div>
          <p className="text-sm text-gray-500">
            Your frequently used routes for quick access
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-1.5">
          <Plus className="w-4 h-4" />
          Add Route
        </Button>
      </div>

      {/* Add Route Form */}
      {showAddForm && (
        <Card>
          <div className="p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Add a New Route</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Origin (e.g., Mumbai)"
                value={newOrigin}
                onChange={(e) => setNewOrigin(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4" />}
              />
              <Input
                placeholder="Destination (e.g., Pune)"
                value={newDestination}
                onChange={(e) => setNewDestination(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4" />}
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleAdd} disabled={!newOrigin.trim() || !newDestination.trim()}>
                Save Route
              </Button>
              <Button size="sm" variant="secondary" onClick={() => { setShowAddForm(false); setNewOrigin(''); setNewDestination(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Routes List */}
      {favoriteRoutes.length === 0 ? (
        <EmptyState
          title="No saved routes"
          description="Save your frequently used routes for quick trip searches"
          customIcon={<Route className="w-8 h-8 text-gray-400" />}
          action={{
            label: 'Add Your First Route',
            onClick: () => setShowAddForm(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteRoutes.map((route) => (
            <div
              key={route.id}
              className="rounded-2xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              <div className="p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                    <div className="w-px h-5 bg-gray-200" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{route.origin}</p>
                    <p className="text-sm font-bold text-gray-900 truncate mt-1">{route.destination}</p>
                  </div>
                </div>

                {route.lastSearchedAt && (
                  <p className="text-[10px] text-gray-400 mb-3">
                    Last searched: {new Date(route.lastSearchedAt).toLocaleDateString()}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/trips/search?origin=${encodeURIComponent(route.origin)}&destination=${encodeURIComponent(route.destination)}`}
                    className="flex-1"
                    onClick={() => handleSearch(route.origin, route.destination)}
                  >
                    <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary-50 text-primary-700 text-sm font-bold hover:bg-primary-100 transition-colors">
                      <Search className="w-3.5 h-3.5" />
                      Search
                    </button>
                  </Link>
                  <button
                    onClick={() => removeFavoriteRoute(route.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
