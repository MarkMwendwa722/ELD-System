import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface MapProps {
  coordinates: [number, number][]; // Array of [longitude, latitude] coordinates
  startPoint?: [number, number];
  endPoint?: [number, number];
  className?: string;
}

export default function Map({ coordinates, startPoint, endPoint, className = '' }: MapProps) {
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
    <div 
      ref={mapContainer} 
      className={`w-full h-full rounded-lg overflow-hidden ${className}`}
      style={{ minHeight: '300px' }}
    />
  );
}