from django.urls import path
from .views import plan_route, create_eld_log, get_eld_logs, update_eld_log

urlpatterns = [
    path('plan/', plan_route, name='plan_route'),
    path('eld-logs/', create_eld_log, name='create_eld_log'),
    path('eld-logs/list/', get_eld_logs, name='get_eld_logs'),
    path('eld-logs/<int:log_id>/', update_eld_log, name='update_eld_log'),
]
