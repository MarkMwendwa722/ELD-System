from django.urls import path
from .views import (
    plan_route, 
    create_eld_log, 
    get_eld_logs, 
    update_eld_log,
    get_route,
    geocode_address,
    reverse_geocode,
    location_suggestions
)

urlpatterns = [
    path('plan/', plan_route, name='plan_route'),
    path('eld-logs/', create_eld_log, name='create_eld_log'),
    path('eld-logs/list/', get_eld_logs, name='get_eld_logs'),
    path('eld-logs/<int:log_id>/', update_eld_log, name='update_eld_log'),
    path('route', get_route, name='get_route'),
    path('geocode', geocode_address, name='geocode_address'),
    path('reverse-geocode', reverse_geocode, name='reverse_geocode'),
    path('location-suggestions', location_suggestions, name='location_suggestions'),
]
