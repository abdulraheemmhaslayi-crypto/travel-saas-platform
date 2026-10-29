'use client';

import React, { useEffect, useRef } from 'react';
import { LiveLocation } from '@/types/trip';
import { MapPin, Navigation } from 'lucide-react';
import Card from '@/components/ui/Card';

interface LiveMapProps {
  locations: LiveLocation[];
  currentLocation?: LiveLocation;
  destination?: { lat: number; lng: number };
  className?: string;
}

// Simple canvas-based map component (placeholder for real map integration)
// In production, replace with react-leaflet or Mapbox GL JS
const LiveMap: React.FC<LiveMapProps> = ({
  locations,
  currentLocation,
  destination,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid background
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw route path
    if (locations.length > 1) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      const scaleX = canvas.width / 100;
      const scaleY = canvas.height / 100;

      locations.forEach((loc, index) => {
        const x = ((loc.longitude + 180) / 360) * canvas.width;
        const y = ((90 - loc.latitude) / 180) * canvas.height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Draw location points
    locations.forEach((loc) => {
      const x = ((loc.longitude + 180) / 360) * canvas.width;
      const y = ((90 - loc.latitude) / 180) * canvas.height;

      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw current location
    if (currentLocation) {
      const x = ((currentLocation.longitude + 180) / 360) * canvas.width;
      const y = ((90 - currentLocation.latitude) / 180) * canvas.height;

      // Pulse effect
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw destination
    if (destination) {
      const x = ((destination.lng + 180) / 360) * canvas.width;
      const y = ((90 - destination.lat) / 180) * canvas.height;

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [locations, currentLocation, destination]);

  return (
    <Card className={className}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full h-64 bg-gray-50 rounded-lg"
        />
        
        {/* Overlay controls */}
        <div className="absolute top-4 right-4 space-y-2">
          <div className="bg-white rounded-lg shadow-md p-2 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Destination</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <span>Route</span>
            </div>
          </div>
        </div>

        {/* Location info */}
        {currentLocation && (
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <Navigation className="w-4 h-4 text-primary-600" />
              <span className="font-medium">
                {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </span>
            </div>
            {currentLocation.speed !== undefined && (
              <p className="text-xs text-gray-500 mt-1">
                Speed: {currentLocation.speed.toFixed(1)} km/h
              </p>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{locations.length} location points</span>
          </div>
          {locations.length > 0 && (
            <span>
              Last updated: {new Date(locations[locations.length - 1].timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default LiveMap;