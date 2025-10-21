import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import EnhancedMap from '../components/EnhancedMap';
import { getELDLogs, ELDLogResponse } from '../services/api';

interface ActivityLog extends ELDLogResponse {
  duration?: number; // in minutes
}

export default function ELDDashboard() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showMap, setShowMap] = useState(false);
  const [drivingTime, setDrivingTime] = useState(0);
  const [onDutyTime, setOnDutyTime] = useState(0);
  const [offDutyTime, setOffDutyTime] = useState(0);

  // Fetch logs for selected date
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const startDate = `${selectedDate}T00:00:00`;
        const endDate = `${selectedDate}T23:59:59`;

        const fetchedLogs = await getELDLogs('default_driver', startDate, endDate);

        // Calculate duration for each log
        const logsWithDuration = fetchedLogs.map((log) => {
          const start = new Date(log.startTime);
          const end = new Date(log.endTime);
          const duration = Math.round((end.getTime() - start.getTime()) / 60000); // minutes

          return { ...log, duration };
        });

        setLogs(logsWithDuration);

        // Calculate total times by activity type
        let driving = 0;
        let onDuty = 0;
        let offDuty = 0;

        logsWithDuration.forEach(log => {
          const duration = log.duration || 0;
          switch (log.activityStatus) {
            case 'driving':
              driving += duration;
              break;
            case 'on-duty-not-driving':
              onDuty += duration;
              break;
            case 'off-duty':
            case 'sleeper-berth':
              offDuty += duration;
              break;
          }
        });

        setDrivingTime(driving);
        setOnDutyTime(onDuty);
        setOffDutyTime(offDuty);

      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [selectedDate]);

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Get all locations with coordinates for map display
  const mapLocations = logs
    .filter(log => log.currentLatitude && log.currentLongitude)
    .map(log => ({
      id: log.id,
      // Ensure correct format [longitude, latitude] for MapLibre GL
      coordinates: [parseFloat(log.currentLongitude!.toString()), parseFloat(log.currentLatitude!.toString())] as [number, number],
      location: log.currentLocation,
      status: log.activityStatus,
      time: log.startTime,
      remarks: log.remarks
    }));

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Header with Unsplash image background */}
      <div className="py-16 text-center mb-8 shadow-lg relative overflow-hidden">
        {/* Unsplash image background with overlay */}
        <div className="absolute inset-0 bg-cover bg-center z-0" 
             style={{backgroundImage: "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&h=400&fit=crop')"}}> 
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-blue-900/60 to-purple-900/60"></div>
        </div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6D5ACD] via-[#8B5CF6] to-[#7A42F0] z-10"></div>
        <div className="relative z-10 animate-fadeIn py-6">
          <div className="inline-flex items-center gap-4 mb-5 animate-slideInLeft">
            <h1 className="text-white text-5xl font-extrabold mb-0 tracking-tight drop-shadow-lg">
              ELD Dashboard
            </h1>
          </div>
          <p className="text-white text-xl font-medium m-0 animate-slideInRight delay-300 max-w-2xl mx-auto drop-shadow-lg">
            24-Hour Activity Log & Trip Visualization
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 animate-slideInRight delay-500">
            <span className="px-3 py-1 bg-[#6D5ACD] text-white rounded-full text-sm font-medium shadow-lg">Real-time Tracking</span>
            <span className="px-3 py-1 bg-[#7A42F0] text-white rounded-full text-sm font-medium shadow-lg">DOT Compliance</span>
            <span className="px-3 py-1 bg-[#8B5CF6] text-white rounded-full text-sm font-medium shadow-lg">Trip Management</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#6D5ACD] via-[#8B5CF6] to-[#7A42F0] z-10"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-8">
        {/* Enhanced Date Selector & Action Buttons */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
            <div className="bg-[#1D1C4E] p-4 sm:p-6 rounded-xl shadow-lg flex-1 sm:max-w-xs card-entrance border border-[#2D2C6E]">
              <div className="mb-3">
                <label className="block text-sm font-semibold text-white">
                  Select Activity Date
                </label>
              </div>
              <div className="custom-date-input relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-4 py-3 pl-10 border border-[#3D3C8E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6D5ACD] focus:border-[#6D5ACD] text-white bg-[#13123A] shadow-sm transition-all duration-200"
                  style={{colorScheme: 'dark'}}
                />
                <div className="custom-date-input-icon absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#8B5CF6]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={() => setShowMap(!showMap)}
                disabled={mapLocations.length === 0}
                className="flex-1 sm:flex-none px-5 py-3 sm:py-4 bg-[#6D5ACD] text-white rounded-lg hover:bg-[#7A42F0] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{showMap ? 'Hide Map' : 'Show Trip Map'}</span>
              </button>
              
              <button
                className="flex-1 sm:flex-none px-5 py-3 sm:py-4 bg-[#1D1C4E] border border-[#3D3C8E] text-white rounded-lg hover:bg-[#2D2C6E] flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#8B5CF6]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Export Data</span>
              </button>
            </div>
          </div>

          {/* Enhanced Summary Cards with animations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#1D1C4E] rounded-xl shadow-lg p-6 card-entrance delay-200 hover:shadow-xl transition-all duration-300 relative overflow-hidden hover:scale-105 border border-[#2D2C6E]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#6D5ACD] rounded-full filter blur-3xl opacity-20 -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-[#B4B2FF] uppercase tracking-wider">Driving Time</p>
                  <p className="text-4xl font-bold text-white mt-1">{formatDuration(drivingTime)}</p>
                  <div className="flex items-center mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#8B5CF6] mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-[#B4B2FF]">Daily limit: <span className="font-semibold">11 hours</span></p>
                  </div>
                </div>
                <div className="bg-[#13123A] w-16 h-16 rounded-lg flex items-center justify-center text-[#6D5ACD] shadow-md border border-[#2D2C6E]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-[#1D1C4E] rounded-xl shadow-lg p-6 card-entrance delay-300 hover:shadow-xl transition-all duration-300 relative overflow-hidden hover:scale-105 border border-[#2D2C6E]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6] rounded-full filter blur-3xl opacity-20 -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-[#B4B2FF] uppercase tracking-wider">On-Duty Time</p>
                  <p className="text-4xl font-bold text-white mt-1">{formatDuration(onDutyTime)}</p>
                  <div className="flex items-center mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#8B5CF6] mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-[#B4B2FF]">Daily limit: <span className="font-semibold">14 hours</span></p>
                  </div>
                </div>
                <div className="bg-[#13123A] w-16 h-16 rounded-lg flex items-center justify-center text-[#7A42F0] shadow-md border border-[#2D2C6E]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-[#1D1C4E] rounded-xl shadow-lg p-6 card-entrance delay-400 hover:shadow-xl transition-all duration-300 relative overflow-hidden hover:scale-105 border border-[#2D2C6E]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#7A42F0] rounded-full filter blur-3xl opacity-20 -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-[#B4B2FF] uppercase tracking-wider">Off-Duty Time</p>
                  <p className="text-4xl font-bold text-white mt-1">{formatDuration(offDutyTime)}</p>
                  <div className="flex items-center mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#8B5CF6] mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-[#B4B2FF]">Required: <span className="font-semibold">10 hours</span></p>
                  </div>
                </div>
                <div className="bg-[#13123A] w-16 h-16 rounded-lg flex items-center justify-center text-[#8B5CF6] shadow-md border border-[#2D2C6E]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Map Visualization */}
        {showMap && mapLocations.length > 0 && (
          <div className="bg-[#1D1C4E] rounded-xl shadow-lg p-6 mb-8 card-entrance animate-fadeIn border border-[#2D2C6E]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-[#13123A] p-3 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Trip Map - Driver Activity</h3>
              </div>
              <div className="bg-[#13123A] px-4 py-2 rounded-full text-sm font-medium text-[#B4B2FF] border border-[#2D2C6E]">
                {format(new Date(selectedDate), 'MMMM d, yyyy')}
              </div>
            </div>
            
            <div className="h-96 rounded-xl overflow-hidden border border-[#3D3C8E] shadow-lg relative">
              {/* Map component without location info overlay - it will be displayed below */}
              <EnhancedMap 
                pickupCoordinates={mapLocations[0]?.coordinates}
                dropoffCoordinates={mapLocations[mapLocations.length - 1]?.coordinates}
                pickupLocationName={mapLocations[0]?.location}
                dropoffLocationName={mapLocations[mapLocations.length - 1]?.location}
                className="w-full h-full"
                onPickupChange={() => {}}
                onDropoffChange={() => {}}
                allowClickToSetPickup={false}
                allowClickToSetDropoff={false}
                hideLocationPanel={true}
              />
              
              {/* Overlay with loading effect that fades out */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#13123A]/50 via-transparent to-transparent opacity-0 pointer-events-none animate-fadeIn"></div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-[#B4B2FF]">
                Showing <span className="font-semibold text-white">{mapLocations.length}</span> activity location(s)
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
                  <span className="text-sm text-[#B4B2FF]">Rest Stops</span>
                </div>
              </div>
            </div>
            
            {/* Trip Locations Section - displayed below legend */}
            {mapLocations.length > 0 && (
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
                      {mapLocations[0]?.location && (
                        <div className="text-gray-900 font-semibold mb-1.5 text-sm">
                          {mapLocations[0].location}
                        </div>
                      )}
                      <div className="text-gray-600 text-xs font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                        {mapLocations[0]?.coordinates[1].toFixed(5)}°, {mapLocations[0]?.coordinates[0].toFixed(5)}°
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
                      {mapLocations[mapLocations.length - 1]?.location && (
                        <div className="text-gray-900 font-semibold mb-1.5 text-sm">
                          {mapLocations[mapLocations.length - 1].location}
                        </div>
                      )}
                      <div className="text-gray-600 text-xs font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                        {mapLocations[mapLocations.length - 1]?.coordinates[1].toFixed(5)}°, {mapLocations[mapLocations.length - 1]?.coordinates[0].toFixed(5)}°
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Activity Timeline */}
        <div className="bg-white rounded-xl shadow-lg p-6 overflow-hidden">
          <div className="flex items-center mb-6 justify-between">
            <div className="flex items-center">
              <div className="bg-gray-100 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#121212]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#121212]">Activity Timeline</h3>
            </div>
            <div className="text-sm text-[#121212] font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {logs.length} Activities | {formatDuration(drivingTime + onDutyTime)} Total Time
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 card-entrance">
              <div className="w-16 h-16 relative">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-t-4 border-gray-700 animate-spin"></div>
              </div>
              <p className="mt-4 text-[#121212] font-medium">Loading activity data...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl card-entrance">
              <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#121212]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[#121212] text-lg font-medium mb-2">No activity logs for this date</p>
              <p className="text-[#121212] text-sm max-w-md mx-auto">Select a different date or add new activity logs to track your hours of service.</p>
              <a href="/" className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add New Activity
              </a>
            </div>
          ) : (
            <div className="space-y-6 relative">
              {/* Timeline vertical line removed */}
              
              {logs.map((log, index) => {
                const accentClass = log.activityStatus === 'driving'
                  ? 'bg-blue-500'
                  : log.activityStatus === 'on-duty-not-driving'
                    ? 'bg-amber-500'
                    : log.activityStatus === 'off-duty'
                      ? 'bg-green-500'
                      : 'bg-gray-500';

                const badgeClass = accentClass;

                return (
                  <div
                    key={log.id}
                    className="relative z-10 card-entrance"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="relative ml-10">
                      <div className={`absolute -left-6 top-0 h-full w-3 rounded-r-xl ${accentClass}`} />
                      <div className="bg-white rounded-xl p-5 hover:shadow-md transition-shadow border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center flex-wrap gap-3 mb-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${badgeClass}`}>
                                {log.activityStatus.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </span>
                              <span className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm text-[#121212]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {formatDuration(log.duration || 0)}
                              </span>
                              <div className="inline-flex text-xs bg-gray-100 text-[#121212] px-2 py-1 rounded border border-gray-200">
                                #{log.id}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3">
                              <div className="flex items-center text-sm text-[#121212]">
                                <div className="bg-gray-100 p-1.5 rounded-md mr-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#121212]" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div>
                                  <span className="text-xs text-[#121212]">TIME WINDOW</span>
                                  <div className="font-medium">
                                    {formatTime(log.startTime)}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-3 w-3 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                    {formatTime(log.endTime)}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center text-sm text-[#121212]">
                                <div className="bg-gray-100 p-1.5 rounded-md mr-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#121212]" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div>
                                  <span className="text-xs text-[#121212]">LOCATION</span>
                                  <div className="font-medium">{log.currentLocation}</div>
                                </div>
                              </div>
                            </div>

                            {log.remarks && (
                              <div className="mt-4 bg-gray-100 p-3 rounded-md text-sm text-[#121212] border border-gray-200">
                                <div className="flex">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#121212] mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                  <span>{log.remarks}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Back to Log Entry Button - Only shown when there are activities */}
        {logs.length > 0 && (
          <div className="mt-6 text-center">
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 bg-white text-[#121212] font-medium rounded-md shadow hover:bg-gray-100 gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New Activity Log
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
