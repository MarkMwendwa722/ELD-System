import { useState, useEffect, useRef } from 'react';
import RouteDisplayPage from './RouteDisplayPage';
import EnhancedMap from '../components/EnhancedMap';
import { format } from 'date-fns';
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
    
    // Handle current location suggestions
    if (name === 'currentLocation' && value.length >= 3) {
      try {
        const suggestions = await getLocationSuggestions(value);
        setCurrentLocationSuggestions(suggestions);
        setShowCurrentLocationSuggestions(true);
      } catch (error) {
        console.error('Error getting current location suggestions:', error);
      }
    } else if (name === 'currentLocation') {
      setCurrentLocationSuggestions([]);
      setShowCurrentLocationSuggestions(false);
    }
  };
  
  // Handle departure location input for suggestions
  const handleDepartureInputChange = async (value: string) => {
    setDailyDeparture(value);
    if (value.length >= 3) {
      try {
        const suggestions = await getLocationSuggestions(value);
        setDepartureSuggestions(suggestions);
        setShowDepartureSuggestions(true);
      } catch (error) {
        console.error('Error getting departure suggestions:', error);
      }
    } else {
      setDepartureSuggestions([]);
      setShowDepartureSuggestions(false);
    }
  };
  
  // Handle destination location input for suggestions
  const handleDestinationInputChange = async (value: string) => {
    setDailyDestination(value);
    if (value.length >= 3) {
      try {
        const suggestions = await getLocationSuggestions(value);
        setDestinationSuggestions(suggestions);
        setShowDestinationSuggestions(true);
      } catch (error) {
        console.error('Error getting destination suggestions:', error);
      }
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
          alert('Activity updated successfully!');
        } else {
          // Add new activity
          setActivities(prev => [...prev, activityEntry]);
          alert('Activity added successfully! Add more activities or submit the daily log.');
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
        console.error('Error adding activity:', error);
        alert(error instanceof Error ? error.message : 'Error adding activity. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Submit entire daily log to backend
  const handleSubmitDailyLog = async () => {
    if (activities.length === 0) {
      alert('Please add at least one activity before submitting the daily log.');
      return;
    }

    // Validate departure and destination
    if (!dailyDeparture.trim()) {
      alert('Please enter a departure location before submitting the daily log.');
      return;
    }

    if (!dailyDestination.trim()) {
      alert('Please enter a destination before submitting the daily log.');
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
      alert('Could not find coordinates for departure or destination. Please check the addresses.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Submit all activities to backend
      for (const activity of activities) {
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
      }
      
      setDailyLogSubmitted(true);
      alert(`Daily log for ${format(new Date(logDate), 'MMM dd, yyyy')} submitted successfully! ${activities.length} activities recorded.`);
      
      // Optionally reset for next day
      // setActivities([]);
      // setLogDate(format(new Date(), 'yyyy-MM-dd'));
      
    } catch (error) {
      console.error('Error submitting daily log:', error);
      alert('Error submitting daily log. Please try again.');
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
          Electronic Logging Device - Driver Activity Management
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 pb-8 sm:pb-16">
        <div className="text-center mb-6 sm:mb-10 text-slate-700">
          <h2 className="text-2xl sm:text-4xl font-bold mb-2">Driver Activity Log</h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-4">
            Record your driving activity for ELD compliance
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            View 24-Hour Dashboard
          </a>
        </div>

        {/* Date Selector for Daily Log */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Daily Activity Log Date</h3>
              <p className="text-sm text-gray-600 mt-1">All activities must be for this date</p>
            </div>
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
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
              disabled={dailyLogSubmitted}
            />
          </div>
        </div>

        {/* Departure and Destination - Entered once for the entire day */}
        {!dailyLogSubmitted && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Daily Route - Departure & Destination
              <span className="text-red-500 ml-1">*</span>
            </h3>
            <p className="text-sm text-gray-600 mb-4">Enter the starting point and final destination for today's activities</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Departure Location */}
              <div className="relative">
                <label htmlFor="dailyDeparture" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <span>Departure (Starting Point) <span className="text-red-500">*</span></span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="dailyDeparture"
                    value={dailyDeparture}
                    onChange={(e) => handleDepartureInputChange(e.target.value)}
                    onFocus={() => setShowDepartureSuggestions(departureSuggestions.length > 0)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter departure address"
                    required
                  />
                  {showDepartureSuggestions && departureSuggestions.length > 0 && (
                    <div 
                      ref={departureSuggestionsRef}
                      className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md overflow-auto"
                    >
                      <ul className="py-1">
                        {departureSuggestions.map((suggestion, index) => (
                          <li 
                            key={index} 
                            className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                            onClick={() => handleDepartureSuggestionSelect(suggestion)}
                          >
                            {suggestion.fullAddress || suggestion.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Destination */}
              <div className="relative">
                <label htmlFor="dailyDestination" className="block text-sm font-medium text-gray-700 mb-1">
                  Destination (Final Stop) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="dailyDestination"
                  value={dailyDestination}
                  onChange={(e) => handleDestinationInputChange(e.target.value)}
                  onFocus={() => setShowDestinationSuggestions(destinationSuggestions.length > 0)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter destination address"
                  required
                />
                {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                  <div 
                    ref={destinationSuggestionsRef}
                    className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md overflow-auto"
                  >
                    <ul className="py-1">
                      {destinationSuggestions.map((suggestion, index) => (
                        <li 
                          key={index} 
                          className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                          onClick={() => handleDestinationSuggestionSelect(suggestion)}
                        >
                          {suggestion.fullAddress || suggestion.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Activity Timeline - Show added activities */}
        {activities.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Activities for {format(new Date(logDate), 'MMMM dd, yyyy')}
                <span className="ml-2 text-sm font-normal text-gray-600">({activities.length} {activities.length === 1 ? 'activity' : 'activities'})</span>
              </h3>
              {!dailyLogSubmitted && (
                <button
                  type="button"
                  onClick={handleSubmitDailyLog}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                          {index + 1}
                        </span>
                        <div>
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            activity.activityStatus === 'driving' ? 'bg-green-100 text-green-800' :
                            activity.activityStatus === 'on-duty-not-driving' ? 'bg-yellow-100 text-yellow-800' :
                            activity.activityStatus === 'off-duty' ? 'bg-gray-100 text-gray-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {activity.activityStatus.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {activity.startTime} - {activity.endTime}
                        </div>
                      </div>
                      <div className="ml-11 space-y-1 text-sm text-gray-700">
                        {activity.currentLocation && (
                          <div className="flex items-start gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span><strong>Location:</strong> {activity.currentLocation}</span>
                          </div>
                        )}
                        {activity.remarks && (
                          <div className="flex items-start gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span><strong>Note:</strong> {activity.remarks}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {!dailyLogSubmitted && (
                      <div className="flex gap-2 ml-4">
                        <button
                          type="button"
                          onClick={() => handleEditActivity(activity)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit activity"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(activity.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
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
              ))}
            </div>
            
            {dailyLogSubmitted && (
              <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      Daily log submitted successfully! All {activities.length} activities have been recorded.
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
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {editingActivityId ? 'Edit Activity' : 'Add New Activity'}
                    <span className="text-gray-500 text-sm ml-2 font-normal">
                      {editingActivityId ? '(Editing)' : `(Activity #${activities.length + 1})`}
                    </span>
                  </h3>
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
              <label htmlFor="currentLocation" className="block text-sm font-medium text-gray-700 mb-1">
                Current Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="currentLocation"
                  name="currentLocation"
                  value={formData.currentLocation}
                  onChange={handleChange}
                  onFocus={() => setShowCurrentLocationSuggestions(currentLocationSuggestions.length > 0)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your current location"
                />
                {showCurrentLocationSuggestions && currentLocationSuggestions.length > 0 && (
                  <div 
                    ref={currentLocationSuggestionsRef}
                    className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md overflow-auto"
                  >
                    <ul className="py-1">
                      {currentLocationSuggestions.map((suggestion, index) => (
                        <li 
                          key={index} 
                          className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                          onClick={() => handleCurrentLocationSuggestionSelect(suggestion)}
                        >
                          {suggestion.fullAddress || suggestion.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            {/* Time Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
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
                  type="time"
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
          <div className="flex justify-end items-center">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {editingActivityId ? 'Updating Activity...' : 'Adding Activity...'}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  {editingActivityId ? 'Update Activity' : 'Add Activity'}
                </>
              )}
            </button>
          </div>
            </>
          )}
        </form>
        
        {/* Map showing all activities */}
        {activities.length > 0 && showMap && departureCoordinates && destinationCoordinates && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Route Visualization</h3>
            <div className="h-96 border rounded-md overflow-hidden">
              <EnhancedMap 
                pickupCoordinates={departureCoordinates}
                dropoffCoordinates={destinationCoordinates}
                className="w-full h-full"
                onPickupChange={(coords) => setDepartureCoordinates(coords)}
                onDropoffChange={(coords) => setDestinationCoordinates(coords)}
                allowClickToSetPickup={false}
                allowClickToSetDropoff={false}
              />
            </div>
            <div className="mt-4 text-sm text-gray-700">
              <p className="font-medium">Map Legend:</p>
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
                  <span>Departure (Starting Point)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                  <span>Destination (Final Point)</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">Markers can be dragged to adjust locations. The blue line shows the suggested route.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
