export async function loadGooglePlaces(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return;
  if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) return;
  if (!apiKey) {
    throw new Error('Google Maps API key is not set');
  }
  const src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  if (document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
  await new Promise<void>((resolve, reject) => {
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
  });
}
