import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface MapProps {
  coordinates: [number, number][]; // Array of [longitude, latitude] coordinates
  startPoint?: [number, number];
  endPoint?: [number, number];
  startLocationName?: string;
  endLocationName?: string;
  className?: string;
}

export default function Map({ 
  coordinates, 
  startPoint, 
  endPoint, 
  startLocationName,
  endLocationName,
  className = '' 
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://api.maptiler.com/maps/base-v4/style.json?key=IR034Q32N8Pnp6fBDlqy',
      center: coordinates[0] || [0, 0],
      zoom: 9
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl());

    // Fit bounds to show the entire route
    if (coordinates.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      coordinates.forEach(coord => {
        bounds.extend(coord as maplibregl.LngLatLike);
      });

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
        duration: 1000
      });
    }

    // Create a GeoJSON line for the route
    map.current.on('load', () => {
      if (!map.current) return;
      
      // Add route line
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        }
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 5,
          'line-opacity': 0.8
        }
      });

      // Add start marker
      if (startPoint) {
        new maplibregl.Marker({ color: '#2563eb' })
          .setLngLat(startPoint)
          .addTo(map.current)
          .setPopup(new maplibregl.Popup().setHTML('<strong>Starting Point</strong>'));
      }

      // Add end marker
      if (endPoint) {
        new maplibregl.Marker({ color: '#ef4444' })
          .setLngLat(endPoint)
          .addTo(map.current)
          .setPopup(new maplibregl.Popup().setHTML('<strong>Destination</strong>'));
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [coordinates, startPoint, endPoint]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainer} 
        className={`w-full h-full rounded-lg overflow-hidden ${className}`}
        style={{ minHeight: '300px' }}
      />
      
      {/* Location Information Display at bottom of map */}
      {startPoint && endPoint && (
        <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg z-10 p-3 border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Start Location */}
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 shadow-md">
                <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-blue-600 mb-0.5 uppercase tracking-wide">Starting Point</div>
                {startLocationName && (
                  <div className="text-gray-900 font-semibold mb-1 line-clamp-2">
                    {startLocationName}
                  </div>
                )}
                <div className="text-gray-600 text-[10px] font-mono bg-gray-50 px-1.5 py-0.5 rounded inline-block">
                  {startPoint[1].toFixed(5)}°, {startPoint[0].toFixed(5)}°
                </div>
              </div>
            </div>
            
            {/* End Location */}
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-red-500 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 shadow-md">
                <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L9 10.586V7a1 1 0 012 0v3.586l1.293-1.293a1 1 0 011.414 1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-red-500 mb-0.5 uppercase tracking-wide">Destination</div>
                {endLocationName && (
                  <div className="text-gray-900 font-semibold mb-1 line-clamp-2">
                    {endLocationName}
                  </div>
                )}
                <div className="text-gray-600 text-[10px] font-mono bg-gray-50 px-1.5 py-0.5 rounded inline-block">
                  {endPoint[1].toFixed(5)}°, {endPoint[0].toFixed(5)}°
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}