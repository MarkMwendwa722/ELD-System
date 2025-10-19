interface RouteStep {
  id: number;
  instruction: string;
  distance: string;
  duration: string;
  type: 'turn' | 'straight' | 'merge' | 'exit';
}

interface ELDLog {
  timestamp: string;
  status: 'driving' | 'on-duty' | 'sleeper' | 'off-duty';
  duration: number;
  location: string;
}

interface RouteDisplayProps {
  tripData: {
    currentLocation: string;
    pickupLocation: string;
    dropoffLocation: string;
    currentCycleUsed: number;
  };
  onBack: () => void;
}

import Map from '../components/Map';

export default function RouteDisplayPage({ tripData, onBack }: RouteDisplayProps) {
  // Mock route data - this would come from your routing API
  const routeSteps: RouteStep[] = [
    {
      id: 1,
      instruction: `Head northeast on Main St toward ${tripData.pickupLocation}`,
      distance: "0.5 mi",
      duration: "2 min",
      type: "straight"
    },
    {
      id: 2,
      instruction: "Turn right onto Highway 94 E",
      distance: "45.2 mi",
      duration: "52 min",
      type: "turn"
    },
    {
      id: 3,
      instruction: "Merge onto I-75 N via EXIT 126",
      distance: "128.7 mi",
      duration: "2h 15m",
      type: "merge"
    },
    {
      id: 4,
      instruction: "Take EXIT 89 toward Distribution Center",
      distance: "2.3 mi",
      duration: "5 min",
      type: "exit"
    },
    {
      id: 5,
      instruction: `Arrive at ${tripData.dropoffLocation}`,
      distance: "0.1 mi",
      duration: "1 min",
      type: "straight"
    }
  ];

  // Mock ELD logs - this would come from your ELD system
  const eldLogs: ELDLog[] = [
    {
      timestamp: "2025-10-17T06:00:00",
      status: "off-duty",
      duration: 10,
      location: tripData.currentLocation
    },
    {
      timestamp: "2025-10-17T16:00:00",
      status: "on-duty",
      duration: 2,
      location: tripData.currentLocation
    },
    {
      timestamp: "2025-10-17T18:00:00",
      status: "driving",
      duration: 6,
      location: "En route"
    }
  ];

  const totalDistance = "176.8 miles";
  const totalDuration = "3h 15m";
  const estimatedDrivingTime = 6.25; // hours
  const projectedCycleUsed = tripData.currentCycleUsed + estimatedDrivingTime;
  
  // Mock route coordinates (would normally come from a routing API)
  const routeCoordinates: [number, number][] = [
    [-87.6298, 41.8781], // Chicago
    [-87.5000, 41.4700], // Gary, Indiana
    [-86.2500, 41.7000], // South Bend
    [-85.6681, 42.9634], // Grand Rapids
    [-83.0458, 42.3314]  // Detroit
  ];

  const getStatusIcon = (type: RouteStep['type']) => {
    switch (type) {
      case 'turn': return '↪️';
      case 'merge': return '🔀';
      case 'exit': return '🚪';
      default: return '➡️';
    }
  };

  const getELDStatusColor = (status: ELDLog['status']) => {
    switch (status) {
      case 'driving': return '#ef4444';
      case 'on-duty': return '#f59e0b';
      case 'sleeper': return '#3b82f6';
      case 'off-duty': return '#10b981';
    }
  };

  const getComplianceStatus = (projectedHours: number) => {
    if (projectedHours >= 70) return { status: 'critical', message: 'VIOLATION: Will exceed 70-hour limit' };
    if (projectedHours >= 65) return { status: 'critical', message: 'Critical: Very close to limit' };
    if (projectedHours >= 60) return { status: 'warning', message: 'Warning: Approaching limit' };
    return { status: 'good', message: 'Good: Within safe limits' };
  };

  const complianceStatus = getComplianceStatus(projectedCycleUsed);

  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-8 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-slate-100">
        <div className="absolute inset-0 opacity-40" style={{ 
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a0aec0' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" 
        }}></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 mb-4 sm:mb-8 relative z-10">
        <button onClick={onBack} className="bg-white text-blue-600 border border-slate-200 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold cursor-pointer transition-all duration-200 mb-4 hover:bg-slate-50 animate-fade-in-left">
          ← Back to Planning
        </button>
        <div className="text-center text-slate-800 animate-fade-in-up">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-2xl">🗺️</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold mb-0">Route & ELD Analysis</h1>
          </div>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">Optimized truck route with compliance monitoring</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 relative z-10">
        {/* Route Summary */}
        <div className="bg-white rounded-xl p-6 sm:p-8 mb-6 sm:mb-8 shadow-md animate-fade-in-up animation-delay-300 hover:shadow-lg transition-all duration-300 border border-slate-200">
          <h2 className="text-slate-800 text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-3 pb-2 border-b border-slate-200">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-blue-600 text-lg">📊</span>
            </div>
            Trip Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center p-4 sm:p-6 bg-blue-50 rounded-lg border border-blue-100 hover:shadow-md transition-all duration-300 animate-slide-in-up animation-delay-400">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">📍</span>
              </div>
              <div className="block text-slate-600 text-xs font-semibold mb-2 uppercase tracking-wider">Total Distance</div>
              <div className="block text-slate-900 text-xl sm:text-2xl font-bold">{totalDistance}</div>
            </div>
            <div className="text-center p-4 sm:p-6 bg-green-50 rounded-lg border border-green-100 hover:shadow-md transition-all duration-300 animate-slide-in-up animation-delay-500">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">⏱️</span>
              </div>
              <div className="block text-slate-600 text-xs font-semibold mb-2 uppercase tracking-wider">Estimated Time</div>
              <div className="block text-slate-900 text-xl sm:text-2xl font-bold">{totalDuration}</div>
            </div>
            <div className="text-center p-4 sm:p-6 bg-purple-50 rounded-lg border border-purple-100 hover:shadow-md transition-all duration-300 animate-slide-in-up animation-delay-600">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">🚛</span>
              </div>
              <div className="block text-slate-600 text-xs font-semibold mb-2 uppercase tracking-wider">Driving Hours</div>
              <div className="block text-slate-900 text-xl sm:text-2xl font-bold">{estimatedDrivingTime}h</div>
            </div>
            <div className="text-center p-4 sm:p-6 bg-amber-50 rounded-lg border border-amber-100 hover:shadow-md transition-all duration-300 animate-slide-in-up animation-delay-700">
              <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">⚡</span>
              </div>
              <div className="block text-slate-600 text-xs font-semibold mb-2 uppercase tracking-wider">Fuel Efficiency</div>
              <div className="block text-slate-900 text-xl sm:text-2xl font-bold">8.2 MPG</div>
            </div>
            <div className="text-center p-4 sm:p-6 bg-slate-100 rounded-lg border border-slate-200 hover:shadow-md transition-all duration-300 animate-slide-in-up animation-delay-800">
              <div className="w-12 h-12 bg-slate-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">⛽</span>
              </div>
              <div className="block text-slate-600 text-xs font-semibold mb-2 uppercase tracking-wider">Fuel Stops</div>
              <div className="block text-slate-900 text-xl sm:text-2xl font-bold">2 recommended</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Route Instructions */}
          <div className="bg-white rounded-lg p-6 sm:p-8 shadow-md border border-slate-200">
            <h2 className="text-slate-800 text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-3 pb-2 border-b border-slate-200">
              🛣️ Route Instructions
            </h2>
            <div className="rounded-lg h-72 sm:h-96 mb-6 sm:mb-8">
              <Map 
                coordinates={routeCoordinates}
                startPoint={routeCoordinates[0]}
                endPoint={routeCoordinates[routeCoordinates.length - 1]}
                className="shadow-md"
              />
            </div>
            
            <div className="space-y-0">
              {routeSteps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-4 py-4 border-b border-slate-200 last:border-b-0 hover:bg-slate-50 px-2 rounded-md transition-colors duration-150">
                  <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="text-xl flex-shrink-0">{getStatusIcon(step.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-800 font-semibold mb-1 leading-relaxed">{step.instruction}</div>
                    <div className="text-slate-500 text-sm flex items-center gap-2">
                      <span>{step.distance}</span>
                      <span>•</span>
                      <span>{step.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ELD Compliance */}
          <div className="bg-white rounded-lg p-6 sm:p-8 shadow-md border border-slate-200">
            <h2 className="text-slate-800 text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-3 pb-2 border-b border-slate-200">
              ⏰ ELD Compliance
            </h2>
            
            <div className={`flex items-center gap-3 px-5 py-4 rounded-lg mb-8 font-semibold text-base border ${
              complianceStatus.status === 'good' 
                ? 'bg-green-50 text-green-800 border-green-300' 
                : complianceStatus.status === 'warning'
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-red-50 text-red-800 border-red-300'
            }`}>
              <div className="text-xl">
                {complianceStatus.status === 'critical' ? '⚠️' : 
                 complianceStatus.status === 'warning' ? '⚡' : '✅'}
              </div>
              <div>{complianceStatus.message}</div>
            </div>

            <div className="mb-8">
              <h3 className="text-slate-700 text-lg font-semibold mb-4 pb-2 border-b border-slate-200">Cycle Hour Projection</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">Current Cycle Used:</span>
                  <span className="font-semibold text-slate-900">{tripData.currentCycleUsed}h</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">Estimated Driving Time:</span>
                  <span className="font-semibold text-slate-900">+{estimatedDrivingTime}h</span>
                </div>
                <div className="h-px bg-slate-200 my-2"></div>
                <div className="flex justify-between items-center py-1 font-bold text-lg">
                  <span className="text-slate-900">Projected Total:</span>
                  <span className={`font-bold ${
                    complianceStatus.status === 'good' 
                      ? 'text-green-600' 
                      : complianceStatus.status === 'warning'
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }`}>
                    {projectedCycleUsed.toFixed(1)}h / 70h
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-slate-700 text-lg font-semibold mb-4 pb-2 border-b border-slate-200">Recent ELD Logs</h3>
              <div className="space-y-0">
                {eldLogs.map((log, index) => (
                  <div key={index} className="flex items-center gap-3 py-3 border-b border-slate-200 last:border-b-0 hover:bg-slate-50 px-2 rounded-md transition-colors duration-150">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getELDStatusColor(log.status) }}
                    ></div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 text-sm mb-1">{log.status.replace('-', ' ').toUpperCase()}</div>
                      <div className="text-slate-500 text-xs flex items-center gap-2">
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span>{log.duration}h</span>
                        <span>•</span>
                        <span>{log.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="compliance-recommendations">
              <h3 className="text-slate-700 text-lg font-semibold mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">💡 Recommendations</h3>
              <ul className="list-none p-0 m-0 space-y-2">
                {projectedCycleUsed >= 65 ? (
                  <li className="p-3 rounded-lg text-sm leading-relaxed bg-red-50 text-red-800 border-l-4 border-red-500">
                    Consider splitting this trip or taking extended rest
                  </li>
                ) : projectedCycleUsed >= 60 ? (
                  <li className="p-3 rounded-lg text-sm leading-relaxed bg-yellow-50 text-amber-800 border-l-4 border-amber-500">
                    Plan for extended rest after this trip
                  </li>
                ) : (
                  <li className="p-3 rounded-lg text-sm leading-relaxed bg-green-50 text-green-800 border-l-4 border-green-500">
                    Trip is within safe compliance limits
                  </li>
                )}
                <li className="p-3 rounded-lg text-sm leading-relaxed bg-slate-50 text-slate-700 border-l-4 border-slate-400">
                  Schedule fuel stops at mile markers 45 and 128
                </li>
                <li className="p-3 rounded-lg text-sm leading-relaxed bg-slate-50 text-slate-700 border-l-4 border-slate-400">
                  Check weather conditions before departure
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}