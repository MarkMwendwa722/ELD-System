from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class ELDLog(models.Model):
    """
    Model for storing Electronic Logging Device (ELD) compliance data
    Tracks driver activity, locations, and time records for DOT compliance
    """
    
    # Activity Status Choices (as per FMCSA regulations)
    ACTIVITY_CHOICES = [
        ('off-duty', 'Off Duty'),
        ('sleeper-berth', 'Sleeper Berth'),
        ('driving', 'Driving'),
        ('on-duty-not-driving', 'On Duty (Not Driving)'),
    ]
    
    # Basic Information
    driver = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='eld_logs',
        help_text="Driver associated with this log entry"
    )
    
    # Activity Information
    activity_status = models.CharField(
        max_length=50,
        choices=ACTIVITY_CHOICES,
        help_text="Current duty status of the driver"
    )
    
    # Location Information
    current_location = models.CharField(
        max_length=500,
        help_text="Driver's current location (address or coordinates)"
    )
    current_latitude = models.DecimalField(
        max_digits=10, 
        decimal_places=7,
        null=True,
        blank=True,
        help_text="Current location latitude"
    )
    current_longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        help_text="Current location longitude"
    )
    
    # Route Information (if applicable)
    pickup_location = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Pickup location for the trip"
    )
    pickup_latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        help_text="Pickup location latitude"
    )
    pickup_longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        help_text="Pickup location longitude"
    )
    
    dropoff_location = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Dropoff location for the trip"
    )
    dropoff_latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        help_text="Dropoff location latitude"
    )
    dropoff_longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        help_text="Dropoff location longitude"
    )
    
    # Time Information
    start_time = models.DateTimeField(
        help_text="Start time of the activity"
    )
    end_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text="End time of the activity (null if ongoing)"
    )
    
    # Additional Information
    remarks = models.TextField(
        blank=True,
        null=True,
        help_text="Additional remarks or notes for on-duty status"
    )
    
    # Compliance Information
    odometer_reading = models.IntegerField(
        null=True,
        blank=True,
        help_text="Vehicle odometer reading at time of log"
    )
    engine_hours = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Engine hours at time of log"
    )
    vehicle_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Vehicle identification number or license plate"
    )
    
    # Cycle Information
    current_cycle_used = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0.00,
        help_text="Hours used in current duty cycle"
    )
    
    # Metadata
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this log entry was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When this log entry was last updated"
    )
    
    # Data integrity fields
    is_edited = models.BooleanField(
        default=False,
        help_text="Whether this log has been edited after creation"
    )
    edit_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason for editing this log entry"
    )
    
    class Meta:
        ordering = ['-start_time']
        verbose_name = 'ELD Log'
        verbose_name_plural = 'ELD Logs'
        indexes = [
            models.Index(fields=['driver', 'start_time']),
            models.Index(fields=['activity_status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.driver.username} - {self.get_activity_status_display()} - {self.start_time.strftime('%Y-%m-%d %H:%M')}"
    
    @property
    def duration_minutes(self):
        """Calculate duration of activity in minutes"""
        if self.end_time:
            delta = self.end_time - self.start_time
            return delta.total_seconds() / 60
        else:
            # If ongoing, calculate from start to now
            delta = timezone.now() - self.start_time
            return delta.total_seconds() / 60
    
    @property
    def is_ongoing(self):
        """Check if this activity is still ongoing"""
        return self.end_time is None
    
    def clean(self):
        """Custom validation"""
        from django.core.exceptions import ValidationError
        
        # Ensure end_time is after start_time
        if self.end_time and self.end_time <= self.start_time:
            raise ValidationError("End time must be after start time")
        
        # Validate coordinates are within valid ranges
        if self.current_latitude and not (-90 <= float(self.current_latitude) <= 90):
            raise ValidationError("Latitude must be between -90 and 90 degrees")
            
        if self.current_longitude and not (-180 <= float(self.current_longitude) <= 180):
            raise ValidationError("Longitude must be between -180 and 180 degrees")


class DriverProfile(models.Model):
    """
    Extended driver profile for ELD compliance
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='driver_profile'
    )
    
    # DOT Information
    cdl_number = models.CharField(
        max_length=50,
        unique=True,
        help_text="Commercial Driver's License number"
    )
    dot_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="DOT number"
    )
    
    # Contact Information
    phone_number = models.CharField(
        max_length=20,
        help_text="Driver's phone number"
    )
    
    # Vehicle Assignment
    assigned_vehicle = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Currently assigned vehicle"
    )
    
    # Compliance Settings
    home_terminal_address = models.CharField(
        max_length=500,
        help_text="Driver's home terminal address"
    )
    time_zone = models.CharField(
        max_length=50,
        default='America/New_York',
        help_text="Driver's home terminal time zone"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Driver Profile'
        verbose_name_plural = 'Driver Profiles'
    
    def __str__(self):
        return f"{self.user.get_full_name()} - CDL: {self.cdl_number}"
