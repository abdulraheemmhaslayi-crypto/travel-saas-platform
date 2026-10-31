'use client';

import React from 'react';
import { useGoogleMaps } from '@/lib/mapConfig';
import GoogleAutocomplete from './GoogleAutocomplete';
import OSMAutocomplete, { OSMAutocompleteProps } from './OSMAutocomplete';

export type SearchInputProps = OSMAutocompleteProps;

export default function SearchInput(props: SearchInputProps) {
  if (useGoogleMaps) {
    return <GoogleAutocomplete {...props} />;
  }
  return <OSMAutocomplete {...props} />;
}
