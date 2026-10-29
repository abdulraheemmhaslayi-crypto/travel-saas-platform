'use client';

import React from 'react';
import { Trip } from '@/types/trip';
import TripCard from './TripCard';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/common/EmptyState';

interface TripListProps {
  trips: Trip[];
  isLoading?: boolean;
  onBook?: (tripId: string) => void;
  emptyMessage?: string;
  variant?: 'default' | 'compact';
}

const TripList: React.FC<TripListProps> = ({
  trips,
  isLoading = false,
  onBook,
  emptyMessage = 'No trips found',
  variant = 'default',
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonCard key={index} variant={variant} />
        ))}
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <EmptyState
        title="No trips available"
        description={emptyMessage}
        icon="search"
      />
    );
  }

  return (
    <div className={variant === 'compact' ? 'space-y-3' : 'space-y-4'}>
      {trips.map((trip) => (
        <TripCard
          key={trip.id}
          trip={trip}
          variant={variant}
          onBook={onBook}
        />
      ))}
    </div>
  );
};

function SkeletonCard({ variant }: { variant: string }) {
  if (variant === 'compact') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton variant="text" width="60%" height="1rem" />
            <Skeleton variant="text" width="40%" height="0.75rem" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton variant="text" width="5rem" height="1.5rem" />
            <Skeleton variant="text" width="4rem" height="1rem" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" width="8rem" height="1.5rem" />
          <Skeleton variant="text" width="12rem" height="1rem" />
        </div>
        <Skeleton variant="text" width="6rem" height="2rem" />
      </div>
      <Skeleton variant="text" width="100%" height="1rem" />
      <Skeleton variant="text" width="80%" height="1rem" />
      <div className="flex gap-2">
        <Skeleton variant="rounded" width="4rem" height="1.5rem" />
        <Skeleton variant="rounded" width="4rem" height="1.5rem" />
      </div>
    </div>
  );
}

export default TripList;