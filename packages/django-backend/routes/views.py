from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.exceptions import ValidationError
from decimal import Decimal, InvalidOperation
import json
import requests
from .models import ELDLog, DriverProfile

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
    Create a new ELD log entry
    """
    try:
        data = json.loads(request.body)
        
        # For now, create a default user if none exists (in production, use proper authentication)
        driver, created = User.objects.get_or_create(
            username=data.get('driver_username', 'default_driver'),
            defaults={
                'first_name': data.get('driver_first_name', 'Driver'),
                'last_name': data.get('driver_last_name', 'User'),
                'email': data.get('driver_email', 'driver@example.com')
            }
        )
        
        # Parse coordinates safely
        def safe_decimal(value):
            if value is None or value == '':
                return None
            try:
                return Decimal(str(value))
            except (InvalidOperation, ValueError):
                return None
        
        # Parse datetime strings
        start_time = timezone.datetime.fromisoformat(data['startTime'].replace('Z', '+00:00'))
        end_time = None
        if data.get('endTime'):
            end_time = timezone.datetime.fromisoformat(data['endTime'].replace('Z', '+00:00'))
        
        # Create ELD log entry
        eld_log = ELDLog.objects.create(
            driver=driver,
            activity_status=data['activityStatus'],
            current_location=data['currentLocation'],
            current_latitude=safe_decimal(data.get('currentLatitude')),
            current_longitude=safe_decimal(data.get('currentLongitude')),
            pickup_location=data.get('pickupLocation'),
            pickup_latitude=safe_decimal(data.get('pickupLatitude')),
            pickup_longitude=safe_decimal(data.get('pickupLongitude')),
            dropoff_location=data.get('dropoffLocation'),
            dropoff_latitude=safe_decimal(data.get('dropoffLatitude')),
            dropoff_longitude=safe_decimal(data.get('dropoffLongitude')),
            start_time=start_time,
            end_time=end_time,
            remarks=data.get('remarks'),
            current_cycle_used=safe_decimal(data.get('currentCycleUsed', 0)),
            odometer_reading=data.get('odometerReading'),
            engine_hours=safe_decimal(data.get('engineHours')),
            vehicle_id=data.get('vehicleId')
        )
        
        return JsonResponse({
            'message': 'ELD log created successfully',
            'log_id': eld_log.id,
            'status': 'success'
        }, status=201)
        
    except KeyError as e:
        return JsonResponse({
            'error': f'Missing required field: {str(e)}',
            'status': 'error'
        }, status=400)
    except ValidationError as e:
        return JsonResponse({
            'error': f'Validation error: {str(e)}',
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
    Get ELD logs for a driver (with optional date filtering)
    """
    try:
        driver_username = request.GET.get('driver_username', 'default_driver')
        
        try:
            driver = User.objects.get(username=driver_username)
        except User.DoesNotExist:
            return JsonResponse({
                'error': 'Driver not found',
                'status': 'error'
            }, status=404)
        
        # Get query parameters
        limit = int(request.GET.get('limit', 100))
        offset = int(request.GET.get('offset', 0))
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        # Start with base query
        logs_query = ELDLog.objects.filter(driver=driver)
        
        # Apply date filters if provided
        if start_date:
            start_datetime = timezone.datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            logs_query = logs_query.filter(start_time__gte=start_datetime)
        
        if end_date:
            end_datetime = timezone.datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            logs_query = logs_query.filter(start_time__lte=end_datetime)
        
        # Order by start_time and apply pagination
        logs = logs_query.order_by('start_time')[offset:offset + limit]
        total_count = logs_query.count()
        
        logs_data = []
        for log in logs:
            logs_data.append({
                'id': log.id,
                'driver_username': driver.username,
                'driver_first_name': driver.first_name,
                'driver_last_name': driver.last_name,
                'driver_email': driver.email,
                'activityStatus': log.activity_status,
                'currentLocation': log.current_location,
                'currentLatitude': float(log.current_latitude) if log.current_latitude else None,
                'currentLongitude': float(log.current_longitude) if log.current_longitude else None,
                'pickupLocation': log.pickup_location,
                'pickupLatitude': float(log.pickup_latitude) if log.pickup_latitude else None,
                'pickupLongitude': float(log.pickup_longitude) if log.pickup_longitude else None,
                'dropoffLocation': log.dropoff_location,
                'dropoffLatitude': float(log.dropoff_latitude) if log.dropoff_latitude else None,
                'dropoffLongitude': float(log.dropoff_longitude) if log.dropoff_longitude else None,
                'startTime': log.start_time.isoformat(),
                'endTime': log.end_time.isoformat() if log.end_time else None,
                'remarks': log.remarks,
                'currentCycleUsed': float(log.current_cycle_used),
                'odometerReading': log.odometer_reading,
                'engineHours': float(log.engine_hours) if log.engine_hours else None,
                'vehicleId': log.vehicle_id,
                'isOngoing': log.is_ongoing,
                'durationMinutes': log.duration_minutes,
                'createdAt': log.created_at.isoformat(),
                'updatedAt': log.updated_at.isoformat()
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
    Update an existing ELD log entry
    """
    try:
        data = json.loads(request.body)
        
        try:
            eld_log = ELDLog.objects.get(id=log_id)
        except ELDLog.DoesNotExist:
            return JsonResponse({
                'error': 'ELD log not found',
                'status': 'error'
            }, status=404)
        
        # Parse coordinates safely
        def safe_decimal(value):
            if value is None or value == '':
                return None
            try:
                return Decimal(str(value))
            except (InvalidOperation, ValueError):
                return None
        
        # Update fields if provided
        if 'activityStatus' in data:
            eld_log.activity_status = data['activityStatus']
        if 'currentLocation' in data:
            eld_log.current_location = data['currentLocation']
        if 'currentLatitude' in data:
            eld_log.current_latitude = safe_decimal(data['currentLatitude'])
        if 'currentLongitude' in data:
            eld_log.current_longitude = safe_decimal(data['currentLongitude'])
        if 'endTime' in data and data['endTime']:
            eld_log.end_time = timezone.datetime.fromisoformat(data['endTime'].replace('Z', '+00:00'))
        if 'remarks' in data:
            eld_log.remarks = data['remarks']
        if 'odometerReading' in data:
            eld_log.odometer_reading = data['odometerReading']
        if 'engineHours' in data:
            eld_log.engine_hours = safe_decimal(data['engineHours'])
        if 'vehicleId' in data:
            eld_log.vehicle_id = data['vehicleId']
        
        # Mark as edited
        eld_log.is_edited = True
        if 'editReason' in data:
            eld_log.edit_reason = data['editReason']
        
        eld_log.save()
        
        return JsonResponse({
            'message': 'ELD log updated successfully',
            'log_id': eld_log.id,
            'status': 'success'
        })
        
    except ValidationError as e:
        return JsonResponse({
            'error': f'Validation error: {str(e)}',
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