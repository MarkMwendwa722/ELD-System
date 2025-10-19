import { useState, useEffect, useRef } from 'react';
import RouteDisplayPage from './RouteDisplayPage';
import EnhancedMap from '../components/EnhancedMap';
import { format } from 'date-fns';
import { 
  getCurrentLocation, 
  getCurrentLocationWithPermission,
  reverseGeocode, 
  getLocationSuggestions, 
  geocodeAddress,
  createELDLog,
  LocationSuggestion,
  ELDLogData
} from '../services/api';

type ActivityStatus = 'off-duty' | 'sleeper-berth' | 'driving' | 'on-duty-not-driving';

interface TripDetails {
  currentLocation: string;
  pickupLocation: string;
  dropoffLocation: string;
  activityStatus: ActivityStatus;
  remarks?: string;
  startTime: string;
  endTime: string;
  currentCycleUsed: number;
}

export default function TripPlanningPage() {
  const [formData, setFormData] = useState<TripDetails>({
    currentLocation: '',
    pickupLocation: '',
    dropoffLocation: '',
    activityStatus: 'off-duty',
    remarks: '',
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(new Date(Date.now() + 30 * 60000), "yyyy-MM-dd'T'HH:mm"), // Default to 30 minutes later
    currentCycleUsed: 0
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TripDetails, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  
  // State for coordinates and location-related data
  const [pickupCoordinates, setPickupCoordinates] = useState<[number, number] | null>(null);
  const [dropoffCoordinates, setDropoffCoordinates] = useState<[number, number] | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
  const [locationError, setLocationError] = useState<string>('');
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationSuggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<LocationSuggestion[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  
  // Refs for detecting clicks outside suggestion lists
  const pickupSuggestionsRef = useRef<HTMLDivElement>(null);
  const dropoffSuggestionsRef = useRef<HTMLDivElement>(null);;

  // Get current location when component mounts with improved error handling
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        setIsLoadingLocation(true);
        setLocationError('');
        
        // Use the enhanced location function with permission checking
        const result = await getCurrentLocationWithPermission();
        
        setLocationPermission(result.permission);
        
        if (result.coordinates) {
          setPickupCoordinates(result.coordinates);
          
          // Reverse geocode to get address
          try {
            const address = await reverseGeocode(result.coordinates);
            setFormData(prev => ({
              ...prev,
              pickupLocation: address,
              currentLocation: address // Also set as current location
            }));
          } catch (geocodeError) {
            console.warn('Failed to reverse geocode:', geocodeError);
            // Still set coordinates even if reverse geocoding fails
            setFormData(prev => ({
              ...prev,
              pickupLocation: `${result.coordinates![1].toFixed(6)}, ${result.coordinates![0].toFixed(6)}`,
              currentLocation: `${result.coordinates![1].toFixed(6)}, ${result.coordinates![0].toFixed(6)}`
            }));
          }
        } else if (result.error) {
          setLocationError(result.error);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unable to get your location';
        setLocationError(errorMessage);
        console.error('Error getting user location:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    };
    
    // Only attempt to get location automatically on first load
    getUserLocation();
    
    // Add click handler to close suggestion dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickupSuggestionsRef.current && 
        !pickupSuggestionsRef.current.contains(event.target as Node)
      ) {
        setShowPickupSuggestions(false);
      }
      
      if (
        dropoffSuggestionsRef.current && 
        !dropoffSuggestionsRef.current.contains(event.target as Node)
      ) {
        setShowDropoffSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof TripDetails]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }

    // Show/hide remarks field when activity status changes
    if (name === 'activityStatus') {
      if (value === 'on-duty-not-driving' && !formData.remarks) {
        setFormData(prev => ({ ...prev, remarks: '' }));
      }
    }
    
    // Handle location input changes for suggestions
    if (name === 'pickupLocation') {
      handlePickupInputChange(value);
    } else if (name === 'dropoffLocation') {
      handleDropoffInputChange(value);
    }
  };
  
  // Handle pickup location input for suggestions
  const handlePickupInputChange = async (value: string) => {
    if (value.length >= 3) {
      try {
        const suggestions = await getLocationSuggestions(value);
        setPickupSuggestions(suggestions);
        setShowPickupSuggestions(true);
      } catch (error) {
        console.error('Error getting pickup suggestions:', error);
      }
    } else {
      setPickupSuggestions([]);
      setShowPickupSuggestions(false);
    }
  };
  
  // Handle dropoff location input for suggestions
  const handleDropoffInputChange = async (value: string) => {
    if (value.length >= 3) {
      try {
        const suggestions = await getLocationSuggestions(value);
        setDropoffSuggestions(suggestions);
        setShowDropoffSuggestions(true);
      } catch (error) {
        console.error('Error getting dropoff suggestions:', error);
      }
    } else {
      setDropoffSuggestions([]);
      setShowDropoffSuggestions(false);
    }
  };
  
  // Handle selection of a location suggestion for pickup
  const handlePickupSuggestionSelect = (suggestion: LocationSuggestion) => {
    setFormData(prev => ({
      ...prev,
      pickupLocation: suggestion.fullAddress || suggestion.name
    }));
    setPickupCoordinates(suggestion.coordinates);
    setShowPickupSuggestions(false);
  };
  
  // Handle selection of a location suggestion for dropoff
  const handleDropoffSuggestionSelect = (suggestion: LocationSuggestion) => {
    setFormData(prev => ({
      ...prev,
      dropoffLocation: suggestion.fullAddress || suggestion.name
    }));
    setDropoffCoordinates(suggestion.coordinates);
    setShowDropoffSuggestions(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TripDetails, string>> = {};

    if (!formData.currentLocation.trim()) {
      newErrors.currentLocation = 'Current location is required';
    }

    if (!formData.pickupLocation.trim()) {
      newErrors.pickupLocation = 'Pickup location is required';
    }

    if (!formData.dropoffLocation.trim()) {
      newErrors.dropoffLocation = 'Dropoff location is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    // Check if end time is after start time
    if (formData.startTime && formData.endTime && new Date(formData.endTime) <= new Date(formData.startTime)) {
      newErrors.endTime = 'End time must be after start time';
    }

    // If activity status is on-duty-not-driving, remarks are required
    if (formData.activityStatus === 'on-duty-not-driving' && !formData.remarks?.trim()) {
      newErrors.remarks = 'Remarks are required for on-duty status';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        // If coordinates are not yet set, try to geocode the addresses
        if (!pickupCoordinates && formData.pickupLocation) {
          try {
            const coordinates = await geocodeAddress(formData.pickupLocation);
            setPickupCoordinates(coordinates);
          } catch (error) {
            console.error('Error geocoding pickup location:', error);
            throw new Error('Could not find coordinates for pickup location.');
          }
        }
        
        if (!dropoffCoordinates && formData.dropoffLocation) {
          try {
            const coordinates = await geocodeAddress(formData.dropoffLocation);
            setDropoffCoordinates(coordinates);
          } catch (error) {
            console.error('Error geocoding dropoff location:', error);
            throw new Error('Could not find coordinates for dropoff location.');
          }
        }
        
        console.log('Trip Details:', {
          ...formData,
          pickupCoordinates,
          dropoffCoordinates
        });
        
        // Create ELD log entry
        try {
          const eldLogData: ELDLogData = {
            driver_username: 'default_driver', // In production, get from authentication
            driver_first_name: 'Driver',
            driver_last_name: 'User',
            driver_email: 'driver@example.com',
            activityStatus: formData.activityStatus,
            currentLocation: formData.currentLocation,
            currentLatitude: pickupCoordinates ? pickupCoordinates[1] : undefined, // Assuming current location matches pickup for now
            currentLongitude: pickupCoordinates ? pickupCoordinates[0] : undefined,
            pickupLocation: formData.pickupLocation,
            pickupLatitude: pickupCoordinates ? pickupCoordinates[1] : undefined,
            pickupLongitude: pickupCoordinates ? pickupCoordinates[0] : undefined,
            dropoffLocation: formData.dropoffLocation,
            dropoffLatitude: dropoffCoordinates ? dropoffCoordinates[1] : undefined,
            dropoffLongitude: dropoffCoordinates ? dropoffCoordinates[0] : undefined,
            startTime: formData.startTime,
            endTime: formData.endTime,
            remarks: formData.remarks,
            currentCycleUsed: formData.currentCycleUsed
          };

          const logResponse = await createELDLog(eldLogData);
          console.log('ELD Log created:', logResponse);
          
        } catch (eldError) {
          console.error('Error creating ELD log:', eldError);
          // Don't block the user flow, but log the error
          alert('Trip planned successfully, but there was an issue saving the ELD log. Please contact support if this persists.');
        }
        
        // Navigate to route display page
        setShowRoute(true);
        
      } catch (error) {
        console.error('Error planning trip:', error);
        alert(error instanceof Error ? error.message : 'Error planning trip. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Note: ELD compliance functionality has been removed as per requirements

  // Show route display if trip has been planned
  if (showRoute) {
    return (
      <RouteDisplayPage 
        tripData={formData} 
        onBack={() => setShowRoute(false)} 
      />
    );
  }

  // Show route display if trip has been planned
  if (showRoute) {
    return (
      <RouteDisplayPage 
        tripData={formData} 
        onBack={() => setShowRoute(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-0">
      <div className="bg-white py-8 text-center mb-8 shadow-md border-b border-slate-200">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-2xl text-white">🚛</span>
          </div>
          <h1 className="text-slate-800 text-5xl font-extrabold mb-0">
            ELD Spotter
          </h1>
        </div>
        <p className="text-slate-600 text-xl font-medium m-0">
          Professional Route Planning & ELD Compliance Management
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 pb-8 sm:pb-16">
        <div className="text-center mb-6 sm:mb-10 text-slate-700">
          <h2 className="text-2xl sm:text-4xl font-bold mb-2">Trip Planning</h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Enter your trip details to get optimized route instructions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Information Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Route Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pickup Location */}
              <div className="relative">
                <label htmlFor="pickupLocation" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <span>Pickup Location</span>
                  {isLoadingLocation && (
                    <div className="ml-2 w-4 h-4 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="pickupLocation"
                    name="pickupLocation"
                    value={formData.pickupLocation}
                    onChange={handleChange}
                    onFocus={() => setShowPickupSuggestions(pickupSuggestions.length > 0)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter pickup address"
                  />
                  <button 
                    type="button"
                    onClick={async () => {
                      try {
                        setIsLoadingLocation(true);
                        setLocationError('');
                        
                        const result = await getCurrentLocationWithPermission();
                        setLocationPermission(result.permission);
                        
                        if (result.coordinates) {
                          setPickupCoordinates(result.coordinates);
                          
                          try {
                            const address = await reverseGeocode(result.coordinates);
                            setFormData(prev => ({
                              ...prev,
                              pickupLocation: address
                            }));
                          } catch (geocodeError) {
                            console.warn('Failed to reverse geocode:', geocodeError);
                            // Still set coordinates even if reverse geocoding fails
                            setFormData(prev => ({
                              ...prev,
                              pickupLocation: `${result.coordinates![1].toFixed(6)}, ${result.coordinates![0].toFixed(6)}`
                            }));
                          }
                        } else if (result.error) {
                          setLocationError(result.error);
                        }
                      } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Could not get your location. Please enter it manually.';
                        setLocationError(errorMessage);
                        console.error('Error getting location:', error);
                      } finally {
                        setIsLoadingLocation(false);
                      }
                    }}
                    disabled={isLoadingLocation || locationPermission === 'denied'}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded ${
                      isLoadingLocation 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : locationPermission === 'denied'
                        ? 'text-red-400 cursor-not-allowed'
                        : pickupCoordinates 
                        ? 'text-green-600 hover:text-green-800' 
                        : 'text-blue-600 hover:text-blue-800'
                    } transition-colors`}
                    title={
                      locationPermission === 'denied' 
                        ? 'Location access denied - Please enable in browser settings'
                        : isLoadingLocation 
                        ? 'Getting your location...'
                        : pickupCoordinates 
                        ? 'Update location'
                        : 'Use current location'
                    }
                  >
                    {isLoadingLocation ? (
                      <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : locationPermission === 'denied' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                      </svg>
                    ) : pickupCoordinates ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
                {showPickupSuggestions && pickupSuggestions.length > 0 && (
                  <div 
                    ref={pickupSuggestionsRef}
                    className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md overflow-auto"
                  >
                    <ul className="py-1">
                      {pickupSuggestions.map((suggestion, index) => (
                        <li 
                          key={index} 
                          className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                          onClick={() => handlePickupSuggestionSelect(suggestion)}
                        >
                          {suggestion.fullAddress || suggestion.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {errors.pickupLocation && (
                  <p className="text-red-600 text-sm mt-1">{errors.pickupLocation}</p>
                )}
                {locationError && (
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mt-2 rounded">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-amber-700">{locationError}</p>
                        {locationPermission === 'denied' && (
                          <p className="text-xs text-amber-600 mt-1">
                            To enable location access: Click the location icon in your browser's address bar and allow location permissions.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Dropoff Location */}
              <div className="relative">
                <label htmlFor="dropoffLocation" className="block text-sm font-medium text-gray-700 mb-1">Dropoff Location</label>
                <input
                  type="text"
                  id="dropoffLocation"
                  name="dropoffLocation"
                  value={formData.dropoffLocation}
                  onChange={handleChange}
                  onFocus={() => setShowDropoffSuggestions(dropoffSuggestions.length > 0)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter destination address"
                />
                {showDropoffSuggestions && dropoffSuggestions.length > 0 && (
                  <div 
                    ref={dropoffSuggestionsRef}
                    className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md overflow-auto"
                  >
                    <ul className="py-1">
                      {dropoffSuggestions.map((suggestion, index) => (
                        <li 
                          key={index} 
                          className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                          onClick={() => handleDropoffSuggestionSelect(suggestion)}
                        >
                          {suggestion.fullAddress || suggestion.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {errors.dropoffLocation && (
                  <p className="text-red-600 text-sm mt-1">{errors.dropoffLocation}</p>
                )}
              </div>
            </div>
            
            {/* Map Component */}
            <div className="mt-6 h-64 border rounded-md overflow-hidden">
              <EnhancedMap 
                pickupCoordinates={pickupCoordinates}
                dropoffCoordinates={dropoffCoordinates}
                className="w-full h-full"
                onPickupChange={(coords) => {
                  setPickupCoordinates(coords);
                  reverseGeocode(coords).then(address => {
                    setFormData(prev => ({
                      ...prev,
                      pickupLocation: address
                    }));
                  });
                }}
                onDropoffChange={(coords) => {
                  setDropoffCoordinates(coords);
                  reverseGeocode(coords).then(address => {
                    setFormData(prev => ({
                      ...prev,
                      dropoffLocation: address
                    }));
                  });
                }}
              />
            </div>
          </div>
          
          {/* Activity Status Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Activity Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="activityStatus" className="block text-sm font-medium text-gray-700 mb-1">Activity Status</label>
                <select
                  id="activityStatus"
                  name="activityStatus"
                  value={formData.activityStatus}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="driving">Driving</option>
                  <option value="on-duty-not-driving">On Duty (Not Driving)</option>
                  <option value="off-duty">Off Duty</option>
                  <option value="sleeper-berth">Sleeper Berth</option>
                </select>
              </div>
              
              {/* Conditional Remarks field - only show when activity status is on-duty-not-driving */}
              {formData.activityStatus === 'on-duty-not-driving' && (
                <div>
                  <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <input
                    type="text"
                    id="remarks"
                    name="remarks"
                    value={formData.remarks || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter reason for on-duty status"
                  />
                  {errors.remarks && (
                    <p className="text-red-600 text-sm mt-1">{errors.remarks}</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Current Location Section */}
            <div className="mb-4">
              <label htmlFor="currentLocation" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <span>Current Location</span>
                {isLoadingLocation && (
                  <div className="ml-2 w-4 h-4 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="currentLocation"
                  name="currentLocation"
                  value={formData.currentLocation}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your current location"
                />
                <button 
                  type="button"
                  onClick={async () => {
                    try {
                      setIsLoadingLocation(true);
                      setLocationError('');
                      
                      const result = await getCurrentLocationWithPermission();
                      setLocationPermission(result.permission);
                      
                      if (result.coordinates) {
                        try {
                          const address = await reverseGeocode(result.coordinates);
                          setFormData(prev => ({
                            ...prev,
                            currentLocation: address
                          }));
                        } catch (geocodeError) {
                          console.warn('Failed to reverse geocode:', geocodeError);
                          // Still set coordinates even if reverse geocoding fails
                          setFormData(prev => ({
                            ...prev,
                            currentLocation: `${result.coordinates![1].toFixed(6)}, ${result.coordinates![0].toFixed(6)}`
                          }));
                        }
                      } else if (result.error) {
                        setLocationError(result.error);
                      }
                    } catch (error) {
                      const errorMessage = error instanceof Error ? error.message : 'Could not get your location. Please enter it manually.';
                      setLocationError(errorMessage);
                      console.error('Error getting location:', error);
                    } finally {
                      setIsLoadingLocation(false);
                    }
                  }}
                  disabled={isLoadingLocation || locationPermission === 'denied'}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded ${
                    isLoadingLocation 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : locationPermission === 'denied'
                      ? 'text-red-400 cursor-not-allowed'
                      : formData.currentLocation 
                      ? 'text-green-600 hover:text-green-800' 
                      : 'text-blue-600 hover:text-blue-800'
                  } transition-colors`}
                  title={
                    locationPermission === 'denied' 
                      ? 'Location access denied - Please enable in browser settings'
                      : isLoadingLocation 
                      ? 'Getting your location...'
                      : formData.currentLocation 
                      ? 'Update current location'
                      : 'Use current location'
                  }
                >
                  {isLoadingLocation ? (
                    <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : locationPermission === 'denied' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                    </svg>
                  ) : formData.currentLocation ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.currentLocation && (
                <p className="text-red-600 text-sm mt-1">{errors.currentLocation}</p>
              )}
              {locationError && !errors.currentLocation && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mt-2 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-amber-700">{locationError}</p>
                      {locationPermission === 'denied' && (
                        <p className="text-xs text-amber-600 mt-1">
                          To enable location access: Click the location icon in your browser's address bar and allow location permissions.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Time Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.startTime && (
                  <p className="text-red-600 text-sm mt-1">{errors.startTime}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.endTime && (
                  <p className="text-red-600 text-sm mt-1">{errors.endTime}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {isLoadingLocation ? (
                <span className="flex items-center">
                  <svg className="animate-spin mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Getting your location...
                </span>
              ) : locationPermission === 'denied' ? (
                <span className="flex items-center text-amber-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Location access denied
                </span>
              ) : pickupCoordinates ? (
                <span className="flex items-center text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Location detected
                </span>
              ) : (
                <span className="flex items-center text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Enter pickup location manually or use location button
                </span>
              )}
            </div>
            
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isSubmitting || !pickupCoordinates || !dropoffCoordinates}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Planning Trip...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Plan Trip
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}