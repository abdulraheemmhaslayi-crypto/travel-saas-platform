export const useGoogleMaps =
  typeof process !== 'undefined' &&
  typeof process.env !== 'undefined' &&
  String(process.env.NEXT_PUBLIC_USE_GOOGLE_MAPS).toLowerCase() === 'true';

export const googleMapsApiKey =
  typeof process !== 'undefined' &&
  typeof process.env !== 'undefined'
    ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    : '';

export default { useGoogleMaps, googleMapsApiKey };
