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
  Heart,
  ArrowRight,
} from 'lucide-react';

export default function FavoriteRoutesPage() {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-red-100">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Favorite Routes</h1>
          </div>
          <p className="text-sm text-gray-500">
            Save your go-to routes for quick access
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-1.5">
          <Plus className="w-4 h-4" />
          Add Route
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <div className="p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Add a Favorite Route</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="From (e.g., Mumbai)"
                value={newOrigin}
                onChange={(e) => setNewOrigin(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4" />}
              />
              <Input
                placeholder="To (e.g., Pune)"
                value={newDestination}
                onChange={(e) => setNewDestination(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4" />}
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleAdd} disabled={!newOrigin.trim() || !newDestination.trim()}>
                <Heart className="w-3.5 h-3.5 mr-1.5" />
                Save as Favorite
              </Button>
              <Button size="sm" variant="secondary" onClick={() => { setShowAddForm(false); setNewOrigin(''); setNewDestination(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {favoriteRoutes.length === 0 ? (
        <EmptyState
          title="No favorite routes"
          description="Save routes you use frequently so you can search them in one tap."
          customIcon={<Heart className="w-8 h-8 text-gray-400" />}
          action={{
            label: 'Add Your First Route',
            onClick: () => setShowAddForm(true),
          }}
        />
      ) : (
        <div className="space-y-3">
          {favoriteRoutes.map((route) => (
            <div
              key={route.id}
              className="rounded-2xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all duration-200 p-4 flex items-center gap-4"
            >
              <div className="p-2 rounded-xl bg-primary-50">
                <MapPin className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">
                  {route.origin} → {route.destination}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Saved {new Date(route.addedAt).toLocaleDateString()}
                  {route.lastSearchedAt && ` · Last searched ${new Date(route.lastSearchedAt).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/dashboard/trips/search?origin=${encodeURIComponent(route.origin)}&destination=${encodeURIComponent(route.destination)}`}
                  onClick={() => updateRouteLastSearched(route.origin, route.destination)}
                >
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-50 text-primary-700 text-xs font-bold hover:bg-primary-100 transition-colors">
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
          ))}
        </div>
      )}
    </div>
  );
}
