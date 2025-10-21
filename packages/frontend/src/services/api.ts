// services/api.ts
import axios from 'axios';

// Base URL for backend API
// In production: Uses /api for Vercel serverless functions
// In development: Uses Vite proxy (/api/django) -> http://localhost:8000
const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_BASE_URL || '/api')
  : 'http://localhost:8000/api';

// Interface for location suggestions
export interface LocationSuggestion {
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  fullAddress?: string;
}

// Create axios instance for API requests
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000, // 5 seconds - faster with optimized backend
  headers: {
    'Content-Type': 'application/json'
  }
});

// Enhanced location detection with better error handling and retry logic
export const getCurrentLocation = async (options?: {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  retryAttempts?: number;
}): Promise<[number, number]> => {
  const {
    enableHighAccuracy = true,
    timeout = 15000, // Increased timeout
    maximumAge = 300000, // 5 minutes cache
    retryAttempts = 2
  } = options || {};

  // Check if geolocation is supported
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser. Please enter your location manually.');
  }

  // Check if we're on HTTPS or localhost (required for geolocation)
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    throw new Error('Location access requires a secure connection (HTTPS). Please enter your location manually.');
  }

  const attemptLocation = (attempt: number): Promise<[number, number]> => {
    return new Promise((resolve, reject) => {
      // Use different accuracy settings for retries
      const locationOptions = {
        enableHighAccuracy: attempt === 0 ? enableHighAccuracy : false,
        timeout: attempt === 0 ? timeout : timeout / 2,
        maximumAge: attempt === 0 ? maximumAge : 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Validate position accuracy
          if (position.coords.accuracy > 10000) { // More than 10km accuracy
            if (attempt < retryAttempts) {
              console.warn(`Location accuracy too low (${position.coords.accuracy}m), retrying...`);
              attemptLocation(attempt + 1).then(resolve).catch(reject);
              return;
            }
          }

          // Note: geolocation returns [latitude, longitude], but we need [longitude, latitude] for MapLibre
          resolve([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          let errorMessage = 'Unable to get your location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions and try again, or enter your location manually.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Please check your connection and try again.';
              break;
            case error.TIMEOUT:
              if (attempt < retryAttempts) {
                console.warn(`Location request timed out, retrying... (attempt ${attempt + 1})`);
                attemptLocation(attempt + 1).then(resolve).catch(reject);
                return;
              }
              errorMessage = 'Location request timed out. Please try again or enter your location manually.';
              break;
            default:
              errorMessage = `Location error: ${error.message}. Please enter your location manually.`;
          }

          if (attempt < retryAttempts && error.code !== error.PERMISSION_DENIED) {
            console.warn(`Location attempt ${attempt + 1} failed, retrying...`);
            setTimeout(() => {
              attemptLocation(attempt + 1).then(resolve).catch(reject);
            }, 1000);
          } else {
            reject(new Error(errorMessage));
          }
        },
        locationOptions
      );
    });
  };

  return attemptLocation(0);
};

// Get current location with permission check
export const getCurrentLocationWithPermission = async (): Promise<{
  coordinates?: [number, number];
  permission: 'granted' | 'denied' | 'prompt' | 'unsupported';
  error?: string;
}> => {
  try {
    // Check if permissions API is available
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        
        if (permission.state === 'denied') {
          return {
            permission: 'denied',
            error: 'Location access denied. Please enable location permissions in your browser settings.'
          };
        }
        
        if (permission.state === 'granted') {
          const coordinates = await getCurrentLocation();
          return { coordinates, permission: 'granted' };
        }
        
        // If prompt, try to get location (will trigger permission request)
        const coordinates = await getCurrentLocation();
        return { coordinates, permission: 'granted' };
        
      } catch (permissionError) {
        console.warn('Permission API error:', permissionError);
        // Fall back to direct geolocation attempt
      }
    }
    
    // Fallback for browsers without permission API
    const coordinates = await getCurrentLocation();
    return { coordinates, permission: 'granted' };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown location error';
    
    if (errorMessage.includes('denied')) {
      return { permission: 'denied', error: errorMessage };
    }
    
    return { 
      permission: 'prompt', 
      error: errorMessage 
    };
  }
};

// Reverse geocode coordinates to address using backend API
export const reverseGeocode = async (coordinates: [number, number]): Promise<string> => {
  try {
    const [longitude, latitude] = coordinates;
    const response = await api.get('/reverse-geocode', {
      params: { longitude, latitude }
    });

    return response.data.placeName || 'Unknown location';
  } catch (error) {
    console.error('Error during reverse geocoding:', error);
    return 'Unknown location';
  }
};

// Geocode address to coordinates using backend API
export const geocodeAddress = async (address: string): Promise<[number, number]> => {
  try {
    const response = await api.get('/geocode', {
      params: { address }
    });

    if (response.data && response.data.coordinates) {
      return response.data.coordinates as [number, number];
    }

    throw new Error('No location found for this address');
  } catch (error) {
    console.error('Error during geocoding:', error);
    throw error;
  }
};

// Get location suggestions based on search input from backend API
export const getLocationSuggestions = async (query: string): Promise<LocationSuggestion[]> => {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const response = await api.get('/location-suggestions', {
      params: { query }
    });

    return response.data.suggestions || [];
  } catch (error) {
    console.error('Error getting location suggestions:', error);
    return [];
  }
};

// ELD Log interface for type safety
export interface ELDLogData {
  driver_username?: string;
  driver_first_name?: string;
  driver_last_name?: string;
  driver_email?: string;
  activityStatus: 'off-duty' | 'sleeper-berth' | 'driving' | 'on-duty-not-driving';
  currentLocation: string;
  currentLatitude?: number;
  currentLongitude?: number;
  pickupLocation: string; // Required for ELD compliance
  pickupLatitude: number; // Required for ELD compliance
  pickupLongitude: number; // Required for ELD compliance
  dropoffLocation: string; // Required for ELD compliance
  dropoffLatitude: number; // Required for ELD compliance
  dropoffLongitude: number; // Required for ELD compliance
  startTime: string;
  endTime?: string;
  remarks?: string;
  currentCycleUsed?: number;
  odometerReading?: number;
  engineHours?: number;
  vehicleId?: string;
}

// ELD Log response interface (what we get back from the server)
export interface ELDLogResponse {
  id: number;
  driver_username: string;
  driver_first_name: string;
  driver_last_name: string;
  driver_email: string;
  activityStatus: 'off-duty' | 'sleeper-berth' | 'driving' | 'on-duty-not-driving';
  currentLocation: string;
  currentLatitude?: number;
  currentLongitude?: number;
  pickupLocation?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropoffLocation?: string;
  dropoffLatitude?: number;
  dropoffLongitude?: number;
  startTime: string;
  endTime: string;
  remarks?: string;
  currentCycleUsed: number;
  odometerReading?: number;
  engineHours?: number;
  vehicleId?: string;
  createdAt: string;
  updatedAt: string;
}

// Create a new ELD log entry
export const createELDLog = async (logData: ELDLogData): Promise<{ log_id: number; message: string }> => {
  try {
    const response = await api.post('/eld-logs/', logData);
    return response.data;
  } catch (error) {
    console.error('Error creating ELD log:', error);
    throw error;
  }
};

// Get ELD logs for a driver (optionally filtered by date range)
export const getELDLogs = async (
  driverUsername: string = 'default_driver',
  startDate?: string,
  endDate?: string,
  limit: number = 100,
  offset: number = 0
): Promise<ELDLogResponse[]> => {
  try {
    const params: any = {
      driver_username: driverUsername,
      limit,
      offset
    };

    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await api.get('/eld-logs/list/', { params });
    
    // Return just the logs array
    return response.data.logs || response.data || [];
  } catch (error) {
    console.error('Error fetching ELD logs:', error);
    throw error;
  }
};

// Update an existing ELD log
export const updateELDLog = async (
  logId: number,
  updateData: Partial<ELDLogData> & { editReason?: string }
): Promise<{ message: string }> => {
  try {
    const response = await api.put(`/eld-logs/${logId}/`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating ELD log:', error);
    throw error;
  }
};

// Get route between two points from backend API
export const getRoute = async (
  pickup: [number, number],
  dropoff: [number, number]
): Promise<{
  geometry: { coordinates: [number, number][] };
  distance: number;
  duration: number;
}> => {
  try {
    const [pickupLongitude, pickupLatitude] = pickup;
    const [dropoffLongitude, dropoffLatitude] = dropoff;
    
    // Set a timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await api.get('/route', {
        params: {
          pickupLongitude,
          pickupLatitude,
          dropoffLongitude,
          dropoffLatitude
        },
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (response.data && response.data.route) {
        return response.data.route;
      }
      
      throw new Error('No route found');
    } catch (axiosError: any) {
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Check if this was a timeout error
      if (axiosError.name === 'AbortError' || axiosError.code === 'ECONNABORTED') {
        throw new Error('Route calculation timed out');
      }
      
      throw axiosError;
    }
  } catch (error) {
    console.error('Error getting route:', error);
    throw error;
  }
};