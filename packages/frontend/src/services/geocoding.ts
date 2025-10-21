// services/geocoding.ts
import { debounce } from 'lodash';

// MapTiler API key
const MAPTILER_KEY = 'IR034Q32N8Pnp6fBDlqy';

// Interface for location suggestions
export interface LocationSuggestion {
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  fullAddress?: string;
}

// Get current location using browser geolocation API
export const getCurrentLocation = (): Promise<[number, number]> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Note: geolocation returns [latitude, longitude], but we need [longitude, latitude] for MapLibre
        resolve([position.coords.longitude, position.coords.latitude]);
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

// Reverse geocode coordinates to address
export const reverseGeocode = async (coordinates: [number, number]): Promise<string> => {
  try {
    const [longitude, latitude] = coordinates;
    const response = await fetch(
      `https://api.maptiler.com/geocoding/${longitude},${latitude}.json?key=${MAPTILER_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to reverse geocode');
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      return data.features[0].place_name || 'Unknown location';
    }

    return 'Unknown location';
  } catch (error) {
    console.error('Error during reverse geocoding:', error);
    return 'Unknown location';
  }
};

// Geocode address to coordinates
export const geocodeAddress = async (address: string): Promise<[number, number]> => {
  try {
    const response = await fetch(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(address)}.json?key=${MAPTILER_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to geocode address');
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center;
      return [longitude, latitude];
    }

    throw new Error('No location found for this address');
  } catch (error) {
    console.error('Error during geocoding:', error);
    throw error;
  }
};

// Get location suggestions based on search input
export const getLocationSuggestions = async (query: string): Promise<LocationSuggestion[]> => {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to get location suggestions');
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      return data.features.map((feature: any): LocationSuggestion => ({
        name: feature.text || feature.place_name,
        fullAddress: feature.place_name,
        coordinates: feature.center
      })).slice(0, 5); // Limit to 5 suggestions
    }

    return [];
  } catch (error) {
    console.error('Error getting location suggestions:', error);
    return [];
  }
};

// Debounced version of getLocationSuggestions to prevent too many API calls
export const debouncedGetLocationSuggestions = debounce(getLocationSuggestions, 500);

// Get driving route between two points
export const getRoute = async (
  pickup: [number, number],
  dropoff: [number, number]
): Promise<[number, number][]> => {
  try {
    const response = await fetch(
      `https://api.maptiler.com/directions/driving/${pickup[0]},${pickup[1]};${dropoff[0]},${dropoff[1]}?key=${MAPTILER_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch route');
    }

    const routeData = await response.json();

    if (!routeData.routes || routeData.routes.length === 0) {
      throw new Error('No route found');
    }

    return routeData.routes[0].geometry.coordinates;
  } catch (error) {
    console.error('Error getting route:', error);
    // If API fails, return a straight line between the points
    return [pickup, dropoff];
  }
};