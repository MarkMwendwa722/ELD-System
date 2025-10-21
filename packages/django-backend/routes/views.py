from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from decimal import Decimal, InvalidOperation
from bson import ObjectId
from datetime import datetime
import json
import requests
from config.mongodb import get_database

@csrf_exempt
@require_http_methods(["GET", "POST"])
def plan_route(request):
    """
    API endpoint for route planning
    """
    if request.method == 'GET':
        return JsonResponse({
            'message': 'Route planning API endpoint',
            'status': 'active',
            'methods': ['GET', 'POST']
        })
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            # Add your route planning logic here
            return JsonResponse({
                'message': 'Route planned successfully',
                'data': data,
                'status': 'success'
            })
        except json.JSONDecodeError:
            return JsonResponse({
                'error': 'Invalid JSON data',
                'status': 'error'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'error': str(e),
                'status': 'error'
            }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def create_eld_log(request):
    """
    Create a new ELD log entry in MongoDB
    """
    try:
        data = json.loads(request.body)
        db = get_database()
        
        # Parse coordinates safely
        def safe_float(value):
            if value is None or value == '':
                return None
            try:
                return float(value)
            except (ValueError, TypeError):
                return None
        
        # Parse datetime strings
        start_time = datetime.fromisoformat(data['startTime'].replace('Z', '+00:00'))
        end_time = None
        if data.get('endTime'):
            end_time = datetime.fromisoformat(data['endTime'].replace('Z', '+00:00'))
        
        # Create ELD log document
        eld_log = {
            'driver_username': data.get('driver_username', 'default_driver'),
            'driver_first_name': data.get('driver_first_name', 'Driver'),
            'driver_last_name': data.get('driver_last_name', 'User'),
            'driver_email': data.get('driver_email', 'driver@example.com'),
            'activity_status': data['activityStatus'],
            'current_location': data['currentLocation'],
            'current_latitude': safe_float(data.get('currentLatitude')),
            'current_longitude': safe_float(data.get('currentLongitude')),
            'pickup_location': data.get('pickupLocation'),
            'pickup_latitude': safe_float(data.get('pickupLatitude')),
            'pickup_longitude': safe_float(data.get('pickupLongitude')),
            'dropoff_location': data.get('dropoffLocation'),
            'dropoff_latitude': safe_float(data.get('dropoffLatitude')),
            'dropoff_longitude': safe_float(data.get('dropoffLongitude')),
            'start_time': start_time,
            'end_time': end_time,
            'remarks': data.get('remarks'),
            'current_cycle_used': safe_float(data.get('currentCycleUsed', 0)),
            'odometer_reading': data.get('odometerReading'),
            'engine_hours': safe_float(data.get('engineHours')),
            'vehicle_id': data.get('vehicleId'),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Insert into MongoDB
        result = db.eld_logs.insert_one(eld_log)
        
        return JsonResponse({
            'message': 'ELD log created successfully',
            'log_id': str(result.inserted_id),
            'status': 'success'
        }, status=201)
        
    except KeyError as e:
        return JsonResponse({
            'error': f'Missing required field: {str(e)}',
            'status': 'error'
        }, status=400)
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON data',
            'status': 'error'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'status': 'error'
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def get_eld_logs(request):
    """
    Get ELD logs for a driver from MongoDB (with optional date filtering)
    """
    try:
        driver_username = request.GET.get('driver_username', 'default_driver')
        db = get_database()
        
        # Get query parameters
        limit = int(request.GET.get('limit', 100))
        offset = int(request.GET.get('offset', 0))
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        # Build MongoDB query
        query = {'driver_username': driver_username}
        
        # Apply date filters if provided
        if start_date or end_date:
            query['start_time'] = {}
            if start_date:
                start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query['start_time']['$gte'] = start_datetime
            if end_date:
                end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query['start_time']['$lte'] = end_datetime
        
        # Get total count
        total_count = db.eld_logs.count_documents(query)
        
        # Get logs with pagination
        logs_cursor = db.eld_logs.find(query).sort('start_time', 1).skip(offset).limit(limit)
        
        logs_data = []
        for log in logs_cursor:
            # Calculate duration in minutes if end_time exists
            duration_minutes = None
            is_ongoing = True
            if log.get('end_time'):
                is_ongoing = False
                duration = log['end_time'] - log['start_time']
                duration_minutes = int(duration.total_seconds() / 60)
            
            logs_data.append({
                'id': str(log['_id']),
                'driver_username': log.get('driver_username'),
                'driver_first_name': log.get('driver_first_name'),
                'driver_last_name': log.get('driver_last_name'),
                'driver_email': log.get('driver_email'),
                'activityStatus': log.get('activity_status'),
                'currentLocation': log.get('current_location'),
                'currentLatitude': log.get('current_latitude'),
                'currentLongitude': log.get('current_longitude'),
                'pickupLocation': log.get('pickup_location'),
                'pickupLatitude': log.get('pickup_latitude'),
                'pickupLongitude': log.get('pickup_longitude'),
                'dropoffLocation': log.get('dropoff_location'),
                'dropoffLatitude': log.get('dropoff_latitude'),
                'dropoffLongitude': log.get('dropoff_longitude'),
                'startTime': log['start_time'].isoformat(),
                'endTime': log['end_time'].isoformat() if log.get('end_time') else None,
                'remarks': log.get('remarks'),
                'currentCycleUsed': log.get('current_cycle_used', 0),
                'odometerReading': log.get('odometer_reading'),
                'engineHours': log.get('engine_hours'),
                'vehicleId': log.get('vehicle_id'),
                'isOngoing': is_ongoing,
                'durationMinutes': duration_minutes,
                'createdAt': log.get('created_at').isoformat() if log.get('created_at') else None,
                'updatedAt': log.get('updated_at').isoformat() if log.get('updated_at') else None
            })
        
        return JsonResponse({
            'logs': logs_data,
            'count': total_count,
            'offset': offset,
            'limit': limit,
            'status': 'success'
        })
        
    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'status': 'error'
        }, status=500)


@csrf_exempt
@require_http_methods(["PUT"])
def update_eld_log(request, log_id):
    """
    Update an existing ELD log entry in MongoDB
    """
    try:
        data = json.loads(request.body)
        db = get_database()
        
        # Check if log exists
        try:
            object_id = ObjectId(log_id)
        except Exception:
            return JsonResponse({
                'error': 'Invalid log ID format',
                'status': 'error'
            }, status=400)
        
        existing_log = db.eld_logs.find_one({'_id': object_id})
        if not existing_log:
            return JsonResponse({
                'error': 'ELD log not found',
                'status': 'error'
            }, status=404)
        
        # Parse coordinates safely
        def safe_float(value):
            if value is None or value == '':
                return None
            try:
                return float(value)
            except (ValueError, TypeError):
                return None
        
        # Build update document
        update_fields = {
            'updated_at': datetime.utcnow()
        }
        
        # Update fields if provided
        if 'activityStatus' in data:
            update_fields['activity_status'] = data['activityStatus']
        if 'currentLocation' in data:
            update_fields['current_location'] = data['currentLocation']
        if 'currentLatitude' in data:
            update_fields['current_latitude'] = safe_float(data['currentLatitude'])
        if 'currentLongitude' in data:
            update_fields['current_longitude'] = safe_float(data['currentLongitude'])
        if 'endTime' in data and data['endTime']:
            update_fields['end_time'] = datetime.fromisoformat(data['endTime'].replace('Z', '+00:00'))
        if 'remarks' in data:
            update_fields['remarks'] = data['remarks']
        if 'odometerReading' in data:
            update_fields['odometer_reading'] = data['odometerReading']
        if 'engineHours' in data:
            update_fields['engine_hours'] = safe_float(data['engineHours'])
        if 'vehicleId' in data:
            update_fields['vehicle_id'] = data['vehicleId']
        
        # Mark as edited
        update_fields['is_edited'] = True
        if 'editReason' in data:
            update_fields['edit_reason'] = data['editReason']
        
        # Update in MongoDB
        db.eld_logs.update_one(
            {'_id': object_id},
            {'$set': update_fields}
        )
        
        return JsonResponse({
            'message': 'ELD log updated successfully',
            'log_id': log_id,
            'status': 'success'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON data',
            'status': 'error'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'status': 'error'
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def get_route(request):
    """
    Get road-based route between two points using Google Maps Directions API
    """
    try:
        pickup_longitude = request.GET.get('pickupLongitude')
        pickup_latitude = request.GET.get('pickupLatitude')
        dropoff_longitude = request.GET.get('dropoffLongitude')
        dropoff_latitude = request.GET.get('dropoffLatitude')
        
        if not all([pickup_longitude, pickup_latitude, dropoff_longitude, dropoff_latitude]):
            return JsonResponse({
                'error': 'Missing required parameters',
                'status': 'error'
            }, status=400)
        
        # Google Maps API Key
        api_key = 'AIzaSyDwQ17Rk3SZvAH5iubSdeqj65bqfMpQqOU'
        
        url = 'https://maps.googleapis.com/maps/api/directions/json'
        
        params = {
            'origin': f'{pickup_latitude},{pickup_longitude}',
            'destination': f'{dropoff_latitude},{dropoff_longitude}',
            'key': api_key
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if data['status'] == 'OK' and len(data['routes']) > 0:
                route = data['routes'][0]
                leg = route['legs'][0]
                
                # Decode the overview polyline to get coordinates
                # Google uses encoded polyline, we need to decode it
                import polyline  # You may need to install this: pip install polyline
                
                coordinates = polyline.decode(route['overview_polyline']['points'])
                # Convert to [longitude, latitude] format for MapLibre
                coordinates = [[lon, lat] for lat, lon in coordinates]
                
                return JsonResponse({
                    'route': {
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': coordinates
                        },
                        'distance': leg['distance']['value'],  # in meters
                        'duration': leg['duration']['value']   # in seconds
                    },
                    'status': 'success'
                })
            else:
                return JsonResponse({
                    'error': f'Routing failed: {data.get("status", "Unknown error")}',
                    'status': 'error'
                }, status=400)
        else:
            return JsonResponse({
                'error': f'Routing service error: {response.status_code}',
                'status': 'error'
            }, status=response.status_code)
            
    except requests.exceptions.Timeout:
        return JsonResponse({
            'error': 'Route calculation timed out',
            'status': 'error'
        }, status=504)
    except ImportError:
        return JsonResponse({
            'error': 'Polyline library not installed. Please run: pip install polyline',
            'status': 'error'
        }, status=500)
    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'status': 'error'
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def geocode_address(request):
    """
    Convert address to coordinates using Google Maps Geocoding API
    """
    try:
        address = request.GET.get('address')
        
        if not address:
            return JsonResponse({
                'error': 'Address parameter is required',
                'status': 'error'
            }, status=400)
        
        # Google Maps API Key
        api_key = 'AIzaSyDwQ17Rk3SZvAH5iubSdeqj65bqfMpQqOU'
        
        url = 'https://maps.googleapis.com/maps/api/geocode/json'
        params = {
            'address': address,
            'key': api_key
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'OK' and len(data['results']) > 0:
                result = data['results'][0]
                location = result['geometry']['location']
                return JsonResponse({
                    'coordinates': [location['lng'], location['lat']],
                    'placeName': result.get('formatted_address', address),
                    'status': 'success'
                })
            else:
                return JsonResponse({
                    'error': 'No results found for this address',
                    'status': 'error'
                }, status=404)
        else:
            return JsonResponse({
                'error': f'Geocoding service error: {response.status_code}',
                'status': 'error'
            }, status=response.status_code)
            
    except requests.exceptions.Timeout:
        return JsonResponse({
            'error': 'Geocoding request timed out',
            'status': 'error'
        }, status=504)
    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'status': 'error'
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def reverse_geocode(request):
    """
    Convert coordinates to address using Google Maps Geocoding API
    """
    try:
        longitude = request.GET.get('longitude')
        latitude = request.GET.get('latitude')
        
        if not longitude or not latitude:
            return JsonResponse({
                'error': 'Longitude and latitude parameters are required',
                'status': 'error'
            }, status=400)
        
        # Google Maps API Key
        api_key = 'AIzaSyDwQ17Rk3SZvAH5iubSdeqj65bqfMpQqOU'
        
        url = 'https://maps.googleapis.com/maps/api/geocode/json'
        params = {
            'latlng': f'{latitude},{longitude}',
            'key': api_key
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'OK' and len(data['results']) > 0:
                result = data['results'][0]
                return JsonResponse({
                    'placeName': result.get('formatted_address', 'Unknown location'),
                    'address': {comp['types'][0]: comp['long_name'] for comp in result.get('address_components', [])},
                    'status': 'success'
                })
            else:
                return JsonResponse({
                    'placeName': 'Unknown location',
                    'address': {},
                    'status': 'success'
                })
        else:
            return JsonResponse({
                'error': f'Reverse geocoding service error: {response.status_code}',
                'status': 'error'
            }, status=response.status_code)
            
    except requests.exceptions.Timeout:
        return JsonResponse({
            'error': 'Reverse geocoding request timed out',
            'status': 'error'
        }, status=504)
    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'status': 'error'
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def location_suggestions(request):
    """
    Get location suggestions based on query using Google Maps Geocoding API (faster)
    """
    try:
        query = request.GET.get('query')
        
        if not query:
            return JsonResponse({
                'suggestions': [],
                'status': 'success'
            })
        
        if len(query) < 3:
            return JsonResponse({
                'suggestions': [],
                'status': 'success'
            })
        
        # Google Maps API Key
        api_key = 'AIzaSyDwQ17Rk3SZvAH5iubSdeqj65bqfMpQqOU'
        
        # Use Geocoding API instead - single fast call
        url = 'https://maps.googleapis.com/maps/api/geocode/json'
        params = {
            'address': query,
            'key': api_key
        }
        
        response = requests.get(url, params=params, timeout=3)
        
        if response.status_code == 200:
            data = response.json()
            suggestions = []
            
            if data['status'] == 'OK':
                # Get up to 5 results
                for result in data.get('results', [])[:5]:
                    location = result['geometry']['location']
                    
                    # Extract meaningful name from address components
                    name = result.get('formatted_address', query)
                    address_components = result.get('address_components', [])
                    
                    # Try to get a shorter, meaningful name
                    if address_components:
                        # Prefer locality (city) or administrative area
                        for component in address_components:
                            if 'locality' in component.get('types', []):
                                name = component['long_name']
                                break
                            elif 'administrative_area_level_1' in component.get('types', []):
                                name = component['long_name']
                    
                    suggestions.append({
                        'name': name,
                        'fullAddress': result.get('formatted_address', query),
                        'coordinates': [location['lng'], location['lat']]
                    })
            
            return JsonResponse({
                'suggestions': suggestions,
                'status': 'success'
            })
        else:
            return JsonResponse({
                'error': f'Location suggestion service error: {response.status_code}',
                'suggestions': [],
                'status': 'error'
            }, status=response.status_code)
            
    except requests.exceptions.Timeout:
        return JsonResponse({
            'error': 'Location suggestion request timed out',
            'suggestions': [],
            'status': 'error'
        }, status=504)
    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'suggestions': [],
            'status': 'error'
        }, status=500)