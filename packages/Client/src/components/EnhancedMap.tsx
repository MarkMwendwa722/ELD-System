import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { getRoute } from '../services/api';

interface EnhancedMapProps {
  pickupCoordinates?: [number, number] | null;
  dropoffCoordinates?: [number, number] | null;
  className?: string;
  onPickupChange?: (coords: [number, number]) => void;
  onDropoffChange?: (coords: [number, number]) => void;
  allowClickToSetPickup?: boolean;
  allowClickToSetDropoff?: boolean;
}

// Free map tiles from OpenStreetMap

export default function EnhancedMap({ 
  pickupCoordinates, 
  dropoffCoordinates, 
  className = '',
  onPickupChange,
  onDropoffChange,
  allowClickToSetPickup = true,
  allowClickToSetDropoff = true
}: EnhancedMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeLoaded, setRouteLoaded] = useState(false);
  const [isDirectLineFallback, setIsDirectLineFallback] = useState(false);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  
  // Helper function to clear route layers and sources
  const clearRouteLayers = () => {
    if (!map.current) return;
    
    // Remove existing route-related layers
    ['route', 'route-outline', 'route-glow', 'point-animation'].forEach(id => {
      if (map.current && map.current.getLayer(id)) {
        map.current.removeLayer(id);
      }
    });
    
    // Remove existing route-related sources
    ['route', 'point-animation'].forEach(id => {
      if (map.current && map.current.getSource(id)) {
        map.current.removeSource(id);
      }
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Default to a central location if no coordinates provided
    // Using central Europe as default view for better initial display
    const initialCenter = pickupCoordinates || [10.0, 51.0]; // Default: Central Europe
    const initialZoom = pickupCoordinates ? 9 : 5; // Zoom out more if no coordinates
    
    // Use a simpler, more reliable map style from OpenStreetMap
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            // Fix the tile URL format - {z}/{x}/{y} are the correct placeholders
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: initialCenter,
      zoom: initialZoom
    });
    
    // Explicitly handle map errors
    map.current.on('error', (e) => {
      console.error('MapLibre Error:', e);
    });

    // Wait for map to fully load before adding controls
    map.current.on('load', () => {
      console.log('Map loaded successfully');
      
      // Add navigation controls (zoom in/out)
      if (map.current) {
        try {
          // Add navigation controls
          map.current.addControl(new maplibregl.NavigationControl());
          
          // Add geolocate control with better positioning
          const geolocateControl = new maplibregl.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true
            },
            trackUserLocation: true
          });
          
          map.current.addControl(geolocateControl, 'top-right');
          
          // Add click event for setting pickup/dropoff locations
          map.current.on('click', (e) => {
            const clickCoords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
            
            // If no pickup coordinates set and clicking is allowed, set pickup
            if (!pickupCoordinates && allowClickToSetPickup && onPickupChange) {
              onPickupChange(clickCoords);
            }
            // If pickup is set but no dropoff, and clicking is allowed, set dropoff
            else if (pickupCoordinates && !dropoffCoordinates && allowClickToSetDropoff && onDropoffChange) {
              onDropoffChange(clickCoords);
            }
          });
          
          // Show cursor as pointer when hovering over map (to indicate clickability)
          if (allowClickToSetPickup || allowClickToSetDropoff) {
            map.current.getCanvas().style.cursor = 'crosshair';
          }
          
          // Force a resize to ensure the map fills its container
          map.current.resize();
          
          // Mark map as loaded
          setMapLoaded(true);
          
          // Add a visual indicator that map is loaded
          console.log('Map controls added successfully');
        } catch (error) {
          console.error('Error adding map controls:', error);
        }
      }
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [pickupCoordinates]);

  // Function to draw a direct line between points as a fallback
  const drawDirectLine = () => {
    if (!map.current || !pickupCoordinates || !dropoffCoordinates) return;
    
    // Ensure map is loaded before trying to add sources/layers
    const drawLine = () => {
      console.log('Drawing direct line fallback');
      // Clear any existing route layers
      clearRouteLayers();
      
      if (map.current && mapLoaded) {
        // Add a simple straight line source
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [pickupCoordinates, dropoffCoordinates]
            }
          }
        });
        
        // Add route outline (thicker, black line underneath for border effect)
        map.current.addLayer({
          id: 'route-outline',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#000000',
            'line-width': 7,
            'line-opacity': 0.3,
          }
        });

        // Add main route line (dashed, amber color)
        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#f59e0b', // Amber color for direct line
            'line-width': 5,
            'line-opacity': 0.8,
            'line-dasharray': [2, 1] // Make it dashed to indicate it's not a real route
          }
        });
        
        // Set states
        setIsDirectLineFallback(true);
        setRouteLoaded(true);
        
        // Fit map to bounds
        const bounds = new maplibregl.LngLatBounds()
          .extend(pickupCoordinates as maplibregl.LngLatLike)
          .extend(dropoffCoordinates as maplibregl.LngLatLike);

        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
          duration: 1000
        });
      }
    };
    
    // Check if map is loaded, otherwise wait for the load event
    if (map.current.loaded() && mapLoaded) {
      drawLine();
    } else {
      console.log('Map not ready for direct line, waiting for load');
      map.current.once('load', () => {
        setMapLoaded(true);
        drawLine();
      });
    }
  };

  // Handle changes in coordinates and fetch road-based route
  useEffect(() => {
    if (!map.current || !pickupCoordinates || !dropoffCoordinates) return;
    
    // Ensure map is loaded before proceeding
    const handleMapReady = () => {
      console.log('Handling map ready for coordinates', pickupCoordinates, dropoffCoordinates);
      // Reset the direct line fallback state
      setIsDirectLineFallback(false);

      if (map.current) {
        // Create custom pickup marker element with Tailwind classes
        const pickupEl = document.createElement('div');
        pickupEl.className = 'custom-marker pickup-marker';
        
        // Create marker container
        const pickupContainer = document.createElement('div');
        pickupContainer.className = 'relative';
        
        // Create marker pin
        const pickupPin = document.createElement('div');
        pickupPin.className = 'bg-blue-600 w-10 h-10 rounded-tl-full rounded-tr-full rounded-bl-none rounded-br-full -rotate-45 border-3 border-white shadow-lg flex items-center justify-center cursor-move transition-transform hover:scale-110';
        
        // Create SVG icon
        const pickupSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        pickupSvg.setAttribute('class', 'rotate-45 w-5 h-5 text-white');
        pickupSvg.setAttribute('viewBox', '0 0 20 20');
        pickupSvg.setAttribute('fill', 'currentColor');
        
        const pickupPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pickupPath.setAttribute('fill-rule', 'evenodd');
        pickupPath.setAttribute('d', 'M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z');
        pickupPath.setAttribute('clip-rule', 'evenodd');
        
        pickupSvg.appendChild(pickupPath);
        pickupPin.appendChild(pickupSvg);
        
        // Create label
        const pickupLabel = document.createElement('div');
        pickupLabel.className = 'absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap shadow-md animate-bounce';
        pickupLabel.textContent = 'PICKUP';
        
        pickupContainer.appendChild(pickupPin);
        pickupContainer.appendChild(pickupLabel);
        pickupEl.appendChild(pickupContainer);

        // Create custom dropoff marker element with Tailwind classes
        const dropoffEl = document.createElement('div');
        dropoffEl.className = 'custom-marker dropoff-marker';
        
        // Create marker container
        const dropoffContainer = document.createElement('div');
        dropoffContainer.className = 'relative';
        
        // Create marker pin
        const dropoffPin = document.createElement('div');
        dropoffPin.className = 'bg-red-500 w-10 h-10 rounded-tl-full rounded-tr-full rounded-bl-none rounded-br-full -rotate-45 border-3 border-white shadow-lg flex items-center justify-center cursor-move transition-all hover:scale-110';
        
        // Create SVG icon
        const dropoffSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        dropoffSvg.setAttribute('class', 'rotate-45 w-5 h-5 text-white');
        dropoffSvg.setAttribute('viewBox', '0 0 20 20');
        dropoffSvg.setAttribute('fill', 'currentColor');
        
        const dropoffPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        dropoffPath.setAttribute('fill-rule', 'evenodd');
        dropoffPath.setAttribute('d', 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z');
        dropoffPath.setAttribute('clip-rule', 'evenodd');
        
        dropoffSvg.appendChild(dropoffPath);
        dropoffPin.appendChild(dropoffSvg);
        
        // Create label
        const dropoffLabel = document.createElement('div');
        dropoffLabel.className = 'absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap shadow-md animate-bounce';
        dropoffLabel.textContent = 'DESTINATION';
        
        dropoffContainer.appendChild(dropoffPin);
        dropoffContainer.appendChild(dropoffLabel);
        dropoffEl.appendChild(dropoffContainer);

        // Create markers with custom elements - ensure coordinates are valid numbers
        const pickupMarker = new maplibregl.Marker({ 
          element: pickupEl,
          draggable: onPickupChange !== undefined,
          anchor: 'bottom'
        })
          .setLngLat([
            typeof pickupCoordinates[0] === 'number' ? pickupCoordinates[0] : parseFloat(String(pickupCoordinates[0])),
            typeof pickupCoordinates[1] === 'number' ? pickupCoordinates[1] : parseFloat(String(pickupCoordinates[1]))
          ])
          .addTo(map.current);

        const dropoffMarker = new maplibregl.Marker({ 
          element: dropoffEl,
          draggable: onDropoffChange !== undefined,
          anchor: 'bottom'
        })
          .setLngLat([
            typeof dropoffCoordinates[0] === 'number' ? dropoffCoordinates[0] : parseFloat(String(dropoffCoordinates[0])),
            typeof dropoffCoordinates[1] === 'number' ? dropoffCoordinates[1] : parseFloat(String(dropoffCoordinates[1]))
          ])
          .addTo(map.current);

        // Convert coordinates to number if they're not already
        const pickupLat = typeof pickupCoordinates[1] === 'number' ? pickupCoordinates[1] : parseFloat(String(pickupCoordinates[1]));
        const pickupLng = typeof pickupCoordinates[0] === 'number' ? pickupCoordinates[0] : parseFloat(String(pickupCoordinates[0]));
        const dropoffLat = typeof dropoffCoordinates[1] === 'number' ? dropoffCoordinates[1] : parseFloat(String(dropoffCoordinates[1]));
        const dropoffLng = typeof dropoffCoordinates[0] === 'number' ? dropoffCoordinates[0] : parseFloat(String(dropoffCoordinates[0]));
        
        // Add popups to markers with Tailwind classes
        const pickupPopup = new maplibregl.Popup({ 
          offset: 25,
          closeButton: true,
          closeOnClick: false
        }).setHTML(`
          <div class="p-3 min-w-[180px] bg-white rounded-lg shadow-lg">
            <div class="flex items-center mb-2">
              <span class="text-blue-600 mr-1">📍</span>
              <div class="font-bold text-blue-600">Pickup Location</div>
            </div>
            <div class="text-sm text-gray-600 bg-gray-50 p-1.5 rounded border border-gray-100">
              ${pickupLat.toFixed(6)}, ${pickupLng.toFixed(6)}
            </div>
            <div class="text-xs text-gray-500 mt-2 italic flex items-center">
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              ${onPickupChange ? 'Drag marker to adjust location' : 'Starting point of journey'}
            </div>
          </div>
        `);

        const dropoffPopup = new maplibregl.Popup({ 
          offset: 25,
          closeButton: true,
          closeOnClick: false
        }).setHTML(`
          <div class="p-3 min-w-[180px] bg-white rounded-lg shadow-lg">
            <div class="flex items-center mb-2">
              <span class="text-red-500 mr-1">🎯</span>
              <div class="font-bold text-red-500">Destination</div>
            </div>
            <div class="text-sm text-gray-600 bg-gray-50 p-1.5 rounded border border-gray-100">
              ${dropoffLat.toFixed(6)}, ${dropoffLng.toFixed(6)}
            </div>
            <div class="text-xs text-gray-500 mt-2 italic flex items-center">
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              ${onDropoffChange ? 'Drag marker to adjust destination' : 'Final destination point'}
            </div>
          </div>
        `);

        pickupMarker.setPopup(pickupPopup);
        dropoffMarker.setPopup(dropoffPopup);

        // Show popups briefly on load
        setTimeout(() => {
          pickupPopup.addTo(map.current!);
          setTimeout(() => pickupPopup.remove(), 3000);
        }, 500);

        setTimeout(() => {
          dropoffPopup.addTo(map.current!);
          setTimeout(() => dropoffPopup.remove(), 3000);
        }, 800);

        // Add drag events to update coordinates
        if (onPickupChange) {
          pickupMarker.on('dragend', () => {
            const lngLat = pickupMarker.getLngLat();
            onPickupChange([lngLat.lng, lngLat.lat]);
            // Update popup content with Tailwind classes
            pickupPopup.setHTML(`
              <div class="p-3 min-w-[180px] bg-white rounded-lg shadow-lg">
                <div class="flex items-center mb-2">
                  <span class="text-blue-600 mr-1">📍</span>
                  <div class="font-bold text-blue-600">Pickup Location</div>
                </div>
                <div class="text-sm text-gray-600 bg-gray-50 p-1.5 rounded border border-gray-100">
                  ${lngLat.lat.toFixed(6)}, ${lngLat.lng.toFixed(6)}
                </div>
                <div class="text-xs text-gray-500 mt-2 italic flex items-center">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Coordinates updated - drag to adjust further
                </div>
              </div>
            `);
          });
        }

        if (onDropoffChange) {
          dropoffMarker.on('dragend', () => {
            const lngLat = dropoffMarker.getLngLat();
            onDropoffChange([lngLat.lng, lngLat.lat]);
            // Update popup content with Tailwind classes
            dropoffPopup.setHTML(`
              <div class="p-3 min-w-[180px] bg-white rounded-lg shadow-lg">
                <div class="flex items-center mb-2">
                  <span class="text-red-500 mr-1">🎯</span>
                  <div class="font-bold text-red-500">Destination</div>
                </div>
                <div class="text-sm text-gray-600 bg-gray-50 p-1.5 rounded border border-gray-100">
                  ${lngLat.lat.toFixed(6)}, ${lngLat.lng.toFixed(6)}
                </div>
                <div class="text-xs text-gray-500 mt-2 italic flex items-center">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Coordinates updated - drag to adjust further
                </div>
              </div>
            `);
          });
        }

        // Fetch the road-based route using our backend service
        const fetchRoute = async () => {
          try {
            setRouteLoaded(false);
            
            // Use backend for route calculation - this handles timeouts internally
            const routeData = await getRoute(
              pickupCoordinates as [number, number],
              dropoffCoordinates as [number, number]
            );
            
            // Handle case where we got an empty response
            if (!routeData || !routeData.geometry || !routeData.geometry.coordinates) {
              console.error('Invalid route data received:', routeData);
              drawDirectLine();
              return;
            }
            
            // OpenRouteService returns a full GeoJSON geometry
            const coordinates = routeData.geometry.coordinates;
            
            // Store the route distance and duration
            setRouteDistance(routeData.distance);
            setRouteDuration(routeData.duration);
            
            // Add route line to the map
            if (map.current) {
              // Clear existing routes
              clearRouteLayers();
              
              // Add the main route source - OpenRouteService returns a full GeoJSON geometry
              map.current.addSource('route', {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: routeData.geometry.coordinates
                  }
                }
              });
              
              // Add route outline
              map.current.addLayer({
                id: 'route-outline',
                type: 'line',
                source: 'route',
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round'
                },
                paint: {
                  'line-color': '#000000',
                  'line-width': 8,
                  'line-opacity': 0.4
                }
              });
              
              // Add main route line
              map.current.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round'
                },
                paint: {
                  'line-color': '#0A84FF', // Uber-like blue
                  'line-width': 5,
                  'line-opacity': 0.9
                }
              });
              
              // Fit map to the route bounds
              const bounds = new maplibregl.LngLatBounds();
              coordinates.forEach((coord: [number, number]) => {
                bounds.extend(coord as maplibregl.LngLatLike);
              });

              map.current.fitBounds(bounds, {
                padding: 70,
                maxZoom: 15,
                duration: 1000
              });
              
              setRouteLoaded(true);
            }
          } catch (error) {
            console.error('Error fetching route:', error);
            drawDirectLine();
          }
        };

        // Only fetch route if we have both coordinates
        if (pickupCoordinates && dropoffCoordinates) {
          fetchRoute();
        }

        // Cleanup function to remove markers on unmount
        return () => {
          pickupMarker?.remove();
          dropoffMarker?.remove();
        };
      }
    };
    
    // Check if map is loaded, otherwise wait for the load event
    if (map.current.loaded() && mapLoaded) {
      handleMapReady();
    } else {
      console.log('Map not yet loaded, waiting for load event');
      map.current.once('load', () => {
        console.log('Map load event triggered');
        setMapLoaded(true);
        handleMapReady();
      });
    }
  }, [pickupCoordinates, dropoffCoordinates, onPickupChange, onDropoffChange, mapLoaded]);

  return (
    <div 
      ref={mapContainer} 
      className={`w-full h-full rounded-lg overflow-hidden relative ${className}`}
      style={{ minHeight: '300px' }}
    >
      {/* Map loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-white bg-opacity-90">
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* Map loading animation */}
              <div className="absolute inset-0 rounded-full bg-gray-300 opacity-30 animate-ping"></div>
              <div className="absolute inset-1 rounded-full bg-gray-400 opacity-40 animate-pulse"></div>
              <div className="relative rounded-full h-14 w-14 bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                <div className="text-[#121212]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="text-[#121212] font-medium text-sm mt-4 bg-gray-100 px-6 py-2 rounded-full shadow-md animate-pulse border border-gray-200">
              Loading map...
            </div>
          </div>
        </div>
      )}
      
      {/* Route loading indicator */}
      {mapLoaded && !routeLoaded && pickupCoordinates && dropoffCoordinates && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-60">
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* Outer pulse animation */}
              <div className="absolute inset-0 rounded-full bg-gray-300 opacity-30 animate-ping"></div>
              {/* Inner pulse animation */}
              <div className="absolute inset-1 rounded-full bg-gray-400 opacity-40 animate-pulse"></div>
              {/* Core circle */}
              <div className="relative rounded-full h-14 w-14 bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                <div className="text-[#121212] animate-spin">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="text-[#121212] font-medium text-sm mt-4 bg-gray-100 px-6 py-2 rounded-full shadow-md border border-gray-200 flex items-center">
              <div className="mr-2">
                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full"></div>
              </div>
              Finding best route...
            </div>
          </div>
        </div>
      )}
      {isDirectLineFallback && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white border-l-4 border-gray-300 text-[#121212] p-3 rounded-lg shadow-lg z-10 max-w-xs animate-pulse transition-all duration-500 ease-in-out">
          <div className="flex items-start">
            <div className="mr-2 animate-bounce">⚠️</div>
            <div>
              <p className="font-bold text-sm flex items-center">
                <svg className="w-4 h-4 mr-1 text-[#121212]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                Using simplified route
              </p>
              <p className="text-xs mt-1">Road-based routing was not available. Showing direct line instead.</p>
            </div>
          </div>
        </div>
      )}
      {routeLoaded && routeDistance && routeDuration && !isDirectLineFallback && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg z-10 animate-pulse p-4 flex items-center transition-all duration-300 hover:scale-105 border border-gray-200">
          <div className="bg-gray-100 rounded-full p-2 mr-3 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#121212]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-[#121212]">Route Info</div>
            <div className="text-sm flex space-x-3 text-[#121212]">
              <span className="inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {Math.round(routeDuration / 60)} min
              </span>
              <span className="inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {(routeDistance / 1000).toFixed(1)} km
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Click-to-set instructions */}
      {mapLoaded && (allowClickToSetPickup || allowClickToSetDropoff) && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md z-10 p-3 max-w-xs border border-gray-200 animate-fadeIn">
          <div className="text-sm">
            {!pickupCoordinates && allowClickToSetPickup ? (
              <div className="flex items-center text-[#121212] animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#121212]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Click map to set pickup location
              </div>
            ) : pickupCoordinates && !dropoffCoordinates && allowClickToSetDropoff ? (
              <div className="flex items-center text-[#121212] animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#121212]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Click map to set dropoff location
              </div>
            ) : pickupCoordinates && dropoffCoordinates ? (
              <div className="flex items-center text-[#121212]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#121212]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Drag markers to adjust locations
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}