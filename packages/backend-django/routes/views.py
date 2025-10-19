from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.exceptions import ValidationError
from decimal import Decimal, InvalidOperation
import json
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
    Get ELD logs for a driver
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
        limit = int(request.GET.get('limit', 50))
        offset = int(request.GET.get('offset', 0))
        
        # Get logs for the driver
        logs = ELDLog.objects.filter(driver=driver)[offset:offset + limit]
        
        logs_data = []
        for log in logs:
            logs_data.append({
                'id': log.id,
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
            'count': len(logs_data),
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