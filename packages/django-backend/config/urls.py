from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

@require_http_methods(["GET"])
def health_check(request):
    return JsonResponse({
        'status': 'OK',
        'service': 'Spotter Django API',
        'version': '1.0.0'
    })

@require_http_methods(["GET"])
def root_view(request):
    return JsonResponse({
        'message': 'Spotter ELD API',
        'version': '1.0.0',
        'endpoints': {
            'health': '/health',
            'api': '/api/',
            'eld_logs': '/api/eld-logs/',
            'route_planning': '/api/route',
            'admin': '/admin/'
        }
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', root_view, name='root'),
    path('health', health_check, name='health'),
    path('api/', include('routes.urls')),
]
