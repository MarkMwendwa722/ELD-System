from django.urls import path
from .views import plan_route

urlpatterns = [
    path('plan/', plan_route, name='plan_route'),
]
