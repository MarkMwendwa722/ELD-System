import { useState, useEffect, useRef } from 'react';
import RouteDisplayPage from './RouteDisplayPage';
import EnhancedMap from '../components/EnhancedMap';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  getLocationSuggestions, 
  geocodeAddress,
  createELDLog,
  LocationSuggestion,
  ELDLogData
} from '../services/api';

type ActivityStatus = 'off-duty' | 'sleeper-berth' | 'driving' | 'on-duty-not-driving';

interface TripDetails {
  currentLocation: string;
  activityStatus: ActivityStatus;
  remarks?: string;
  startTime: string;
  endTime: string;
  currentCycleUsed: number;
}

interface ActivityEntry extends TripDetails {
  id: string;
  currentLocationCoords?: [number, number];
}

export default function TripPlanningPage() {
  // Daily log state - all activities must be for the same date
  const [logDate, setLogDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  
  // Daily departure and destination (entered once for the whole day)
  const [dailyDeparture, setDailyDeparture] = useState<string>('');
  const [dailyDestination, setDailyDestination] = useState<string>('');
  const [departureCoordinates, setDepartureCoordinates] = useState<[number, number] | null>(null);
  const [destinationCoordinates, setDestinationCoordinates] = useState<[number, number] | null>(null);
  
  const [formData, setFormData] = useState<TripDetails>({
    currentLocation: '',
    activityStatus: 'off-duty',
    remarks: '',
    startTime: format(new Date(), 'HH:mm'),
    endTime: format(new Date(Date.now() + 30 * 60000), 'HH:mm'),
    currentCycleUsed: 0
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TripDetails, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [showMap, setShowMap] = useState(false); // Control map visibility
  const [dailyLogSubmitted, setDailyLogSubmitted] = useState(false); // Track if entire daily log was submitted
  
  // State for coordinates and location-related data
  const [currentLocationCoords, setCurrentLocationCoords] = useState<[number, number] | null>(null);
  const [departureSuggestions, setDepartureSuggestions] = useState<LocationSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<LocationSuggestion[]>([]);
  const [currentLocationSuggestions, setCurrentLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showDepartureSuggestions, setShowDepartureSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [showCurrentLocationSuggestions, setShowCurrentLocationSuggestions] = useState(false);
  
  // Refs for detecting clicks outside suggestion lists
  const departureSuggestionsRef = useRef<HTMLDivElement>(null);
  const destinationSuggestionsRef = useRef<HTMLDivElement>(null);
  const currentLocationSuggestionsRef = useRef<HTMLDivElement>(null);
  
  // Debounce timers for location suggestions
  const currentLocationDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const departureDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const destinationDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Add click handler to close suggestion dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        departureSuggestionsRef.current && 
        !departureSuggestionsRef.current.contains(event.target as Node)
      ) {
        setShowDepartureSuggestions(false);
      }
      
      if (
        destinationSuggestionsRef.current && 
        !destinationSuggestionsRef.current.contains(event.target as Node)
      ) {
        setShowDestinationSuggestions(false);
      }
      
      if (
        currentLocationSuggestionsRef.current && 
        !currentLocationSuggestionsRef.current.contains(event.target as Node)
      ) {
        setShowCurrentLocationSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle form input changes
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
    
    // Handle current location suggestions with debounce
    if (name === 'currentLocation') {
      // Clear previous timeout
      if (currentLocationDebounceRef.current) {
        clearTimeout(currentLocationDebounceRef.current);
      }
      
      if (value.length >= 3) {
        // Set new timeout for 300ms
        currentLocationDebounceRef.current = setTimeout(async () => {
          try {
            const suggestions = await getLocationSuggestions(value);
            setCurrentLocationSuggestions(suggestions);
            setShowCurrentLocationSuggestions(true);
          } catch (error) {
            toast.error('Failed to load location suggestions');
            setCurrentLocationSuggestions([]);
            setShowCurrentLocationSuggestions(false);
          }
        }, 300);
      } else {
        setCurrentLocationSuggestions([]);
        setShowCurrentLocationSuggestions(false);
      }
    }
  };
  
  // Handle departure location input for suggestions with debounce
  const handleDepartureInputChange = async (value: string) => {
    setDailyDeparture(value);
    
    // Clear previous timeout
    if (departureDebounceRef.current) {
      clearTimeout(departureDebounceRef.current);
    }
    
    if (value.length >= 3) {
      // Set new timeout for 300ms
      departureDebounceRef.current = setTimeout(async () => {
        try {
          const suggestions = await getLocationSuggestions(value);
          setDepartureSuggestions(suggestions);
          setShowDepartureSuggestions(true);
        } catch (error) {
          toast.error('Failed to load departure suggestions');
          setDepartureSuggestions([]);
          setShowDepartureSuggestions(false);
        }
      }, 300);
    } else {
      setDepartureSuggestions([]);
      setShowDepartureSuggestions(false);
    }
  };
  
  // Handle destination location input for suggestions with debounce
  const handleDestinationInputChange = async (value: string) => {
    setDailyDestination(value);
    
    // Clear previous timeout
    if (destinationDebounceRef.current) {
      clearTimeout(destinationDebounceRef.current);
    }
    
    if (value.length >= 3) {
      // Set new timeout for 300ms
      destinationDebounceRef.current = setTimeout(async () => {
        try {
          const suggestions = await getLocationSuggestions(value);
          setDestinationSuggestions(suggestions);
          setShowDestinationSuggestions(true);
        } catch (error) {
          toast.error('Failed to load destination suggestions');
          setDestinationSuggestions([]);
          setShowDestinationSuggestions(false);
        }
      }, 300);
    } else {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
    }
  };
  
  // Handle selection of a location suggestion for departure
  const handleDepartureSuggestionSelect = (suggestion: LocationSuggestion) => {
    setDailyDeparture(suggestion.fullAddress || suggestion.name);
    setDepartureCoordinates(suggestion.coordinates);
    setShowDepartureSuggestions(false);
  };
  
  // Handle selection of a location suggestion for destination
  const handleDestinationSuggestionSelect = (suggestion: LocationSuggestion) => {
    setDailyDestination(suggestion.fullAddress || suggestion.name);
    setDestinationCoordinates(suggestion.coordinates);
    setShowDestinationSuggestions(false);
  };
  
  // Handle selection of a location suggestion for current location
  const handleCurrentLocationSuggestionSelect = (suggestion: LocationSuggestion) => {
    setFormData(prev => ({
      ...prev,
      currentLocation: suggestion.fullAddress || suggestion.name
    }));
    setCurrentLocationCoords(suggestion.coordinates);
    setShowCurrentLocationSuggestions(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TripDetails, string>> = {};

    // Current location is required for ELD compliance
    if (!formData.currentLocation.trim()) {
      newErrors.currentLocation = 'Current location is required for ELD compliance';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    // Check if end time is after start time
    if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    // If activity status is on-duty-not-driving, remarks are required
    if (formData.activityStatus === 'on-duty-not-driving' && !formData.remarks?.trim()) {
      newErrors.remarks = 'Remarks are required for on-duty status';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add activity to the list (like adding education in CV)
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        // Create activity entry
        const activityEntry: ActivityEntry = {
          id: editingActivityId || `activity-${Date.now()}`,
          ...formData,
          currentLocationCoords: currentLocationCoords || undefined
        };

        if (editingActivityId) {
          // Update existing activity
          setActivities(prev => prev.map(act => 
            act.id === editingActivityId ? activityEntry : act
          ));
          setEditingActivityId(null);
          toast.success('Activity updated successfully!');
        } else {
          // Add new activity
          setActivities(prev => [...prev, activityEntry]);
          toast.success('Activity added! Add more activities or submit the daily log.');
        }
        
        // Reset form for next activity
        const [hours, minutes] = formData.endTime.split(':');
        const endDate = new Date();
        endDate.setHours(parseInt(hours), parseInt(minutes));
        const nextEndDate = new Date(endDate.getTime() + 30 * 60000);
        
        setFormData({
          currentLocation: '',
          activityStatus: 'off-duty',
          remarks: '',
          startTime: formData.endTime, // Next activity starts when previous ended
          endTime: format(nextEndDate, 'HH:mm'),
          currentCycleUsed: 0
        });
        setShowMap(true); // Show map with all activities
        
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to add activity. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Submit entire daily log to backend
  const handleSubmitDailyLog = async () => {
    if (activities.length === 0) {
      toast.error('Please add at least one activity before submitting the daily log.');
      return;
    }

    // Validate departure and destination
    if (!dailyDeparture.trim()) {
      toast.error('Please enter a departure location before submitting the daily log.');
      return;
    }

    if (!dailyDestination.trim()) {
      toast.error('Please enter a destination before submitting the daily log.');
      return;
    }

    // Geocode departure and destination if not already done
    let finalDepartureCoords = departureCoordinates;
    let finalDestinationCoords = destinationCoordinates;

    try {
      if (!finalDepartureCoords) {
        finalDepartureCoords = await geocodeAddress(dailyDeparture);
        setDepartureCoordinates(finalDepartureCoords);
      }

      if (!finalDestinationCoords) {
        finalDestinationCoords = await geocodeAddress(dailyDestination);
        setDestinationCoordinates(finalDestinationCoords);
      }
    } catch (error) {
      toast.error('Could not find coordinates for departure or destination. Please check the addresses.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Submit all activities to backend
      for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        // Combine date and time for full datetime
        const startDateTime = `${logDate}T${activity.startTime}:00`;
        const endDateTime = `${logDate}T${activity.endTime}:00`;
        
        const eldLogData: ELDLogData = {
          driver_username: 'default_driver', // TODO: Get from authentication
          driver_first_name: 'Driver',
          driver_last_name: 'User',
          driver_email: 'driver@example.com',
          activityStatus: activity.activityStatus,
          currentLocation: activity.currentLocation,
          currentLatitude: activity.currentLocationCoords ? activity.currentLocationCoords[1] : undefined,
          currentLongitude: activity.currentLocationCoords ? activity.currentLocationCoords[0] : undefined,
          pickupLocation: dailyDeparture,
          pickupLatitude: finalDepartureCoords[1],
          pickupLongitude: finalDepartureCoords[0],
          dropoffLocation: dailyDestination,
          dropoffLatitude: finalDestinationCoords[1],
          dropoffLongitude: finalDestinationCoords[0],
          startTime: startDateTime,
          endTime: endDateTime,
          remarks: activity.remarks,
          currentCycleUsed: activity.currentCycleUsed
        };

        await createELDLog(eldLogData);
        toast.success(`Activity ${i + 1}/${activities.length} saved`, {
          duration: 1500,
        });
      }
      
      setDailyLogSubmitted(true);
      toast.success(`Daily log for ${format(new Date(logDate), 'MMM dd, yyyy')} submitted successfully! ${activities.length} activities recorded.`, {
        duration: 5000,
      });
      
      // Optionally reset for next day
      // setActivities([]);
      // setLogDate(format(new Date(), 'yyyy-MM-dd'));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to submit daily log: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete activity from list
  const handleDeleteActivity = (activityId: string) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      setActivities(prev => prev.filter(act => act.id !== activityId));
    }
  };

  // Edit activity
  const handleEditActivity = (activity: ActivityEntry) => {
    setFormData({
      currentLocation: activity.currentLocation,
      activityStatus: activity.activityStatus,
      remarks: activity.remarks || '',
      startTime: activity.startTime,
      endTime: activity.endTime,
      currentCycleUsed: activity.currentCycleUsed
    });
    setCurrentLocationCoords(activity.currentLocationCoords || null);
    setEditingActivityId(activity.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAddActivity(e);
  };

  // Note: ELD compliance functionality has been removed as per requirements

  // Show route display if trip has been planned
  if (showRoute) {
    return (
      <RouteDisplayPage 
        tripData={{
          currentLocation: formData.currentLocation,
          pickupLocation: dailyDeparture,
          dropoffLocation: dailyDestination,
          currentCycleUsed: formData.currentCycleUsed
        }} 
        onBack={() => setShowRoute(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-0">
      <div className="bg-spotter-dark py-10 px-4 sm:px-8 mb-8 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Title and Description - Centered */}
          <div className="text-center mb-6 animate-fadeIn">
            <h1 className="text-white text-4xl sm:text-5xl font-extrabold mb-4 animate-slideInRight">
              Driver Activity Log
            </h1>
            <p className="text-blue-100 text-lg sm:text-xl font-medium max-w-4xl mx-auto animate-fadeIn delay-200">
              Record and track your driving activities to maintain ELD compliance and optimize your routes
            </p>
          </div>
          
          {/* Dashboard Button - Centered below text */}
          <div className="flex justify-center animate-fadeIn delay-300">
            <a
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white text-base font-semibold rounded-lg hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-200 gap-2 whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              View 24-Hour Dashboard
            </a>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 pb-8 sm:pb-16 relative">
        {/* Date Selector for Daily Log */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-8 transform transition-all hover:shadow-xl animate-fadeIn delay-400 border border-blue-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-spotter-dark">Daily Activity Log Date</h3>
              </div>
              <p className="text-sm text-gray-600 mt-1 ml-8">All activities must be for this date</p>
            </div>
            <div className="relative group">
              <input
                type="date"
                value={logDate}
                onChange={(e) => {
                  if (activities.length > 0 && !confirm('Changing the date will clear all current activities. Continue?')) {
                    return;
                  }
                  setLogDate(e.target.value);
                  setActivities([]);
                }}
                className="pl-4 pr-10 py-3 border border-blue-200 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold text-blue-800 transition-all w-full sm:w-auto"
                disabled={dailyLogSubmitted}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              {dailyLogSubmitted && 
                <div className="absolute -right-2 -top-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              }
            </div>
          </div>
        </div>

        {/* Departure and Destination - Entered once for the entire day */}
        {!dailyLogSubmitted && activities.length === 0 && (
          <div className="bg-white shadow-lg rounded-xl p-6 mb-8 animate-fadeIn delay-500 border-l-4 border-blue-500">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-spotter-dark">
                  Daily Route - Departure & Destination
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <p className="text-sm text-gray-600">Enter the starting point and final destination for today's activities (entered once per day)</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Departure Location */}
              <div className="relative">
                <label htmlFor="dailyDeparture" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span>Departure (Starting Point) <span className="text-red-500">*</span></span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="dailyDeparture"
                    value={dailyDeparture}
                    onChange={(e) => handleDepartureInputChange(e.target.value)}
                    onFocus={() => setShowDepartureSuggestions(departureSuggestions.length > 0)}
                    className="w-full px-4 py-3 pl-10 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm transition-all"
                    placeholder="Enter departure address"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  {showDepartureSuggestions && departureSuggestions.length > 0 && (
                    <div 
                      ref={departureSuggestionsRef}
                      className="absolute z-10 w-full mt-1 bg-white shadow-xl max-h-60 rounded-lg overflow-auto border border-slate-200 animate-fadeIn"
                    >
                      <ul className="py-1">
                        {departureSuggestions.map((suggestion, index) => (
                          <li 
                            key={index} 
                            className="px-4 py-2 hover:bg-green-50 cursor-pointer transition-colors flex items-center gap-2"
                            onClick={() => handleDepartureSuggestionSelect(suggestion)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{suggestion.fullAddress || suggestion.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Destination */}
              <div className="relative">
                <label htmlFor="dailyDestination" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span>Destination (Final Stop) <span className="text-red-500">*</span></span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="dailyDestination"
                    value={dailyDestination}
                    onChange={(e) => handleDestinationInputChange(e.target.value)}
                    onFocus={() => setShowDestinationSuggestions(destinationSuggestions.length > 0)}
                    className="w-full px-4 py-3 pl-10 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm transition-all"
                    placeholder="Enter destination address"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    </div>
                  </div>
                  {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                    <div 
                      ref={destinationSuggestionsRef}
                      className="absolute z-10 w-full mt-1 bg-white shadow-xl max-h-60 rounded-lg overflow-auto border border-slate-200 animate-fadeIn"
                    >
                      <ul className="py-1">
                        {destinationSuggestions.map((suggestion, index) => (
                          <li 
                            key={index} 
                            className="px-4 py-2 hover:bg-red-50 cursor-pointer transition-colors flex items-center gap-2"
                            onClick={() => handleDestinationSuggestionSelect(suggestion)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{suggestion.fullAddress || suggestion.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Timeline - Show added activities */}
        {activities.length > 0 && (
          <div className="bg-white shadow-lg rounded-xl p-6 mb-8 animate-fadeIn">
            {/* Daily Route Summary - Show departure and destination info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
              <div className="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <h4 className="font-semibold text-gray-800">Daily Route</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-600 uppercase">Departure</div>
                    <div className="text-sm font-medium text-gray-900">{dailyDeparture || 'Not set'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-600 uppercase">Destination</div>
                    <div className="text-sm font-medium text-gray-900">{dailyDestination || 'Not set'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <div className="mb-4 sm:mb-0">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-spotter-dark">
                    Activities for {format(new Date(logDate), 'MMMM dd, yyyy')}
                    <span className="ml-2 text-sm font-normal text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                      {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
                    </span>
                  </h3>
                </div>
              </div>
              {!dailyLogSubmitted && (
                <button
                  type="button"
                  onClick={handleSubmitDailyLog}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Submit Daily Log
                    </>
                  )}
                </button>
              )}
            </div>
            
            {/* Activity Timeline */}
            <div className="relative">
              {/* Timeline vertical line */}
              <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-300 to-indigo-500 z-0"></div>
              
              <div className="space-y-6">
                {activities.map((activity, index) => (
                  <div 
                    key={activity.id} 
                    className={`relative pl-14 animate-fadeIn delay-${(index % 5) * 100}`}
                  >
                    <div className="absolute left-0 top-0 z-10">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full text-white font-bold shadow-md ${
                        activity.activityStatus === 'driving' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                        activity.activityStatus === 'on-duty-not-driving' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                        activity.activityStatus === 'off-duty' ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                        'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              activity.activityStatus === 'driving' ? 'bg-green-100 text-green-800' :
                              activity.activityStatus === 'on-duty-not-driving' ? 'bg-yellow-100 text-yellow-800' :
                              activity.activityStatus === 'off-duty' ? 'bg-gray-100 text-gray-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${
                                activity.activityStatus === 'driving' ? 'text-green-700' :
                                activity.activityStatus === 'on-duty-not-driving' ? 'text-yellow-700' :
                                activity.activityStatus === 'off-duty' ? 'text-gray-700' :
                                'text-blue-700'
                              }`} viewBox="0 0 20 20" fill="currentColor">
                                {activity.activityStatus === 'driving' ? (
                                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                ) : activity.activityStatus === 'on-duty-not-driving' ? (
                                  <path fillRule="evenodd" d="M6 3a1 1 0 011-1h.01a1 1 0 010 2H7a1 1 0 01-1-1zm2 3a1 1 0 00-2 0v5a1 1 0 102 0V6zm5-1a1 1 0 00-1 1v5a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                ) : activity.activityStatus === 'off-duty' ? (
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                ) : (
                                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                )}
                              </svg>
                              {activity.activityStatus.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </span>
                            <div className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {activity.startTime} - {activity.endTime}
                            </div>
                          </div>
                          <div className="space-y-2 text-sm text-gray-700">
                            {activity.currentLocation && (
                              <div className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium">{activity.currentLocation}</span>
                              </div>
                            )}
                            {activity.remarks && (
                              <div className="flex items-start gap-2 bg-yellow-50 p-2 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span>{activity.remarks}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {!dailyLogSubmitted && (
                          <div className="flex gap-2 ml-4">
                            <button
                              type="button"
                              onClick={() => handleEditActivity(activity)}
                              className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors shadow-sm"
                              title="Edit activity"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteActivity(activity.id)}
                              className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors shadow-sm"
                              title="Delete activity"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {dailyLogSubmitted && (
              <div className="mt-6 bg-green-50 rounded-xl border border-green-200 p-6 shadow-sm animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-center">
                  <div className="bg-green-100 p-3 rounded-full mb-4 sm:mb-0 sm:mr-4">
                    <svg className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-center sm:text-left">
                    <h4 className="text-lg font-medium text-green-800 mb-1">Daily Log Submitted Successfully!</h4>
                    <p className="text-green-700">
                      All {activities.length} activities have been recorded for {format(new Date(logDate), 'MMMM dd, yyyy')}.
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      You can view your daily logs and compliance data on the 24-Hour Dashboard.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Route Information Section - Required for ELD Compliance */}
          {!dailyLogSubmitted && (
            <>
              <div className="bg-white shadow-lg rounded-xl p-6 border-t-4 border-indigo-500 animate-fadeIn delay-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                      {editingActivityId ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-spotter-dark">
                        {editingActivityId ? 'Edit Activity' : 'Add New Activity'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {editingActivityId ? 'Update the selected activity details' : `Creating activity #${activities.length + 1} for today's log`}
                      </p>
                    </div>
                  </div>
                  
                  {editingActivityId && (
                    <button 
                      type="button"
                      onClick={() => setEditingActivityId(null)}
                      className="text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Activity Status Section */}
              <div className="bg-white shadow-lg rounded-xl p-6 border border-indigo-100 animate-fadeIn delay-400">
            <div className="flex items-center mb-6">
              <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-spotter-dark">Activity Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="relative">
                <label htmlFor="activityStatus" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Activity Status
                </label>
                <div className="relative">
                  <select
                    id="activityStatus"
                    name="activityStatus"
                    value={formData.activityStatus}
                    onChange={handleChange}
                    className="appearance-none w-full px-4 py-3 pl-10 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                  >
                    <option value="driving">Driving</option>
                    <option value="on-duty-not-driving">On Duty (Not Driving)</option>
                    <option value="off-duty">Off Duty</option>
                    <option value="sleeper-berth">Sleeper Berth</option>
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className={`w-5 h-5 rounded-full ${
                      formData.activityStatus === 'driving' ? 'bg-green-100' :
                      formData.activityStatus === 'on-duty-not-driving' ? 'bg-yellow-100' :
                      formData.activityStatus === 'off-duty' ? 'bg-gray-100' :
                      'bg-blue-100'
                    } flex items-center justify-center`}>
                      <div className={`w-3 h-3 rounded-full ${
                        formData.activityStatus === 'driving' ? 'bg-green-500' :
                        formData.activityStatus === 'on-duty-not-driving' ? 'bg-yellow-500' :
                        formData.activityStatus === 'off-duty' ? 'bg-gray-500' :
                        'bg-blue-500'
                      }`}></div>
                    </div>
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Conditional Remarks field - only show when activity status is on-duty-not-driving */}
              {formData.activityStatus === 'on-duty-not-driving' ? (
                <div className="relative animate-fadeIn">
                  <label htmlFor="remarks" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Remarks <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="remarks"
                      name="remarks"
                      value={formData.remarks || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pl-10 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 shadow-sm transition-all"
                      placeholder="Enter reason for on-duty status"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {errors.remarks && (
                      <p className="text-red-600 text-sm mt-1 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.remarks}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="hidden md:block"></div>
              )}
            </div>
            
            {/* Current Location Section */}
            <div className="mb-6">
              <label htmlFor="currentLocation" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Current Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></div>
                  </div>
                </div>
                <input
                  type="text"
                  id="currentLocation"
                  name="currentLocation"
                  value={formData.currentLocation}
                  onChange={handleChange}
                  onFocus={() => setShowCurrentLocationSuggestions(currentLocationSuggestions.length > 0)}
                  className="w-full px-4 py-3 pl-10 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm transition-all"
                  placeholder="Enter your current location"
                />
                {errors.currentLocation && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.currentLocation}
                  </p>
                )}
                {showCurrentLocationSuggestions && currentLocationSuggestions.length > 0 && (
                  <div 
                    ref={currentLocationSuggestionsRef}
                    className="absolute z-10 w-full mt-1 bg-white shadow-xl max-h-60 rounded-lg overflow-auto border border-slate-200 animate-fadeIn"
                  >
                    <div className="sticky top-0 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      LOCATION SUGGESTIONS
                    </div>
                    <ul className="py-1">
                      {currentLocationSuggestions.map((suggestion, index) => (
                        <li 
                          key={index} 
                          className="px-4 py-2 hover:bg-purple-50 cursor-pointer transition-colors flex items-center gap-2"
                          onClick={() => handleCurrentLocationSuggestionSelect(suggestion)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{suggestion.fullAddress || suggestion.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            {/* Time Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label htmlFor="startTime" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-10 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm transition-all text-slate-700 font-medium"
                  />
                </div>
                {errors.startTime && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.startTime}
                  </p>
                )}
              </div>
              
              <div className="relative">
                <label htmlFor="endTime" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  End Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-10 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm transition-all text-slate-700 font-medium"
                  />
                </div>
                {errors.endTime && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.endTime}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-center sm:justify-end items-center mt-8">
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:-translate-y-1 transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-lg">{editingActivityId ? 'Updating Activity...' : 'Adding Activity...'}</span>
                </>
              ) : (
                <>
                  {editingActivityId ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                  <span className="text-lg">{editingActivityId ? 'Update Activity' : 'Add Activity'}</span>
                </>
              )}
            </button>
          </div>
            </>
          )}
        </form>
        
        {/* Map showing all activities */}
        {activities.length > 0 && showMap && departureCoordinates && destinationCoordinates && (
          <div className="bg-[#1D1C4E] rounded-xl shadow-lg p-6 mt-8 card-entrance animate-fadeIn border border-[#2D2C6E]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-[#13123A] p-3 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Trip Map - Planned Route</h3>
              </div>
              <div className="bg-[#13123A] px-4 py-2 rounded-full text-sm font-medium text-[#B4B2FF] border border-[#2D2C6E]">
                {format(new Date(logDate), 'MMMM d, yyyy')}
              </div>
            </div>
            
            <div className="h-96 rounded-xl overflow-hidden border border-[#3D3C8E] shadow-lg relative">
              <EnhancedMap 
                pickupCoordinates={departureCoordinates}
                dropoffCoordinates={destinationCoordinates}
                pickupLocationName={dailyDeparture}
                dropoffLocationName={dailyDestination}
                className="w-full h-full"
                onPickupChange={(coords) => setDepartureCoordinates(coords)}
                onDropoffChange={(coords) => setDestinationCoordinates(coords)}
                allowClickToSetPickup={false}
                allowClickToSetDropoff={false}
                hideLocationPanel={true}
              />
              
              {/* Overlay with loading effect that fades out */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#13123A]/50 via-transparent to-transparent opacity-0 pointer-events-none animate-fadeIn"></div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-[#B4B2FF]">
                Route from <span className="font-semibold text-white">{dailyDeparture}</span> to <span className="font-semibold text-white">{dailyDestination}</span>
              </p>
              <button className="text-sm text-[#8B5CF6] hover:text-[#6D5ACD] flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Map
              </button>
            </div>
            
            <div className="mt-4 p-4 bg-[#13123A] rounded-lg border border-[#2D2C6E]">
              <p className="font-medium text-white mb-3">Map Legend</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-[#6D5ACD] rounded-full mr-2 shadow-md animate-pulse-spotter"></div>
                  <span className="text-sm text-[#B4B2FF]">Start Location</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-[#8B5CF6] rounded-full mr-2 shadow-md animate-pulse-spotter"></div>
                  <span className="text-sm text-[#B4B2FF]">End Location</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-[#7A42F0] rounded-sm mr-2 shadow-md"></div>
                  <span className="text-sm text-[#B4B2FF]">Route Path</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-[#13123A] rounded-full flex items-center justify-center border-2 border-[#3D3C8E] mr-2">
                    <div className="w-3 h-3 bg-[#B4B2FF] rounded-full"></div>
                  </div>
                  <span className="text-sm text-[#B4B2FF]">Waypoints</span>
                </div>
              </div>
            </div>
            
            {/* Trip Locations Section - displayed below legend */}
            {departureCoordinates && destinationCoordinates && (
              <div className="mt-4 bg-white rounded-lg shadow-md border border-gray-200 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Start Location */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-tl-full rounded-tr-full rounded-bl-none rounded-br-full -rotate-45 flex-shrink-0 flex items-center justify-center shadow-md">
                      <svg className="rotate-45 w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-blue-600 mb-1 uppercase tracking-wide text-sm">Start Location</div>
                      {dailyDeparture && (
                        <div className="text-gray-900 font-semibold mb-1.5 text-sm">
                          {dailyDeparture}
                        </div>
                      )}
                      <div className="text-gray-600 text-xs font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                        {departureCoordinates[1].toFixed(5)}°, {departureCoordinates[0].toFixed(5)}°
                      </div>
                    </div>
                  </div>
                  
                  {/* Destination Location */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-500 rounded-tl-full rounded-tr-full rounded-bl-none rounded-br-full -rotate-45 flex-shrink-0 flex items-center justify-center shadow-md">
                      <svg className="rotate-45 w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-red-500 mb-1 uppercase tracking-wide text-sm">Destination</div>
                      {dailyDestination && (
                        <div className="text-gray-900 font-semibold mb-1.5 text-sm">
                          {dailyDestination}
                        </div>
                      )}
                      <div className="text-gray-600 text-xs font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                        {destinationCoordinates[1].toFixed(5)}°, {destinationCoordinates[0].toFixed(5)}°
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
