'use client';

import React from 'react';
import { SearchFilters } from '@/types/trip';
import { VEHICLE_TYPES } from '@/lib/constants';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Filter, X } from 'lucide-react';

interface TripFilterProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onReset: () => void;
  onApply: () => void;
}

const TripFilter: React.FC<TripFilterProps> = ({
  filters,
  onChange,
  onReset,
  onApply,
}) => {
  const vehicleOptions = VEHICLE_TYPES.map((type) => ({
    value: type,
    label: type,
  }));

  const handleChange = (field: keyof SearchFilters, value: unknown) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          Advanced Filters
        </h3>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 font-semibold transition-colors duration-200"
        >
          <X className="w-3.5 h-3.5" />
          Clear Filters
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vehicle Type */}
        <Select
          label="Vehicle Type"
          placeholder="All types"
          options={[{ value: '', label: 'All types' }, ...vehicleOptions]}
          value={filters.vehicleType || ''}
          onChange={(e) => handleChange('vehicleType', e.target.value)}
        />

        {/* Min Price */}
        <Input
          label="Min Price (₹)"
          type="number"
          placeholder="0"
          value={filters.minPrice || ''}
          onChange={(e) => handleChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
        />

        {/* Max Price */}
        <Input
          label="Max Price (₹)"
          type="number"
          placeholder="Max"
          value={filters.maxPrice || ''}
          onChange={(e) => handleChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
        />

        {/* Available Seats */}
        <Input
          label="Seats Required"
          type="number"
          placeholder="e.g. 1"
          min="1"
          value={filters.availableSeats || ''}
          onChange={(e) => handleChange('availableSeats', e.target.value ? Number(e.target.value) : undefined)}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={onApply} size="sm" className="bg-blue-600 hover:bg-blue-700">
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

export default TripFilter;