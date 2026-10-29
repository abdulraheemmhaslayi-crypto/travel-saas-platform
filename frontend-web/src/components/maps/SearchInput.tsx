import React from 'react';
import { useGoogleMaps } from '@/lib/mapConfig';
import GoogleAutocomplete from './GoogleAutocomplete';
import OSMAutocomplete from './OSMAutocomplete';

type Props = {
  label: string;
  value: string;
  onPlaceSelect: (address: string, lat: number, lng: number) => void;
  onChange: (v: string) => void;
  required?: boolean;
  isSource?: boolean;
};

export default function SearchInput(props: Props) {
  if (useGoogleMaps) {
    return <GoogleAutocomplete {...props} />;
  }
  return <OSMAutocomplete {...props} />;
}
