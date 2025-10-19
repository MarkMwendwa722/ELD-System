#!/usr/bin/env python3
"""
Simple test script to verify ELD API endpoints are working
"""
import requests
import json
from datetime import datetime, timedelta

# API base URL
BASE_URL = "http://127.0.0.1:8000/api"

def test_create_eld_log():
    """Test creating a new ELD log entry"""
    print("Testing ELD log creation...")
    
    # Prepare test data
    now = datetime.now()
    end_time = now + timedelta(hours=8)  # 8-hour shift
    
    test_data = {
        "driver_username": "test_driver",
        "driver_first_name": "John",
        "driver_last_name": "Doe",
        "driver_email": "john.doe@example.com",
        "activityStatus": "on-duty-not-driving",
        "currentLocation": "123 Main St, Anytown, USA",
        "currentLatitude": 40.7128,
        "currentLongitude": -74.0060,
        "pickupLocation": "456 Oak Ave, Anytown, USA",
        "pickupLatitude": 40.7589,
        "pickupLongitude": -73.9851,
        "dropoffLocation": "789 Pine St, Anytown, USA",
        "dropoffLatitude": 40.6892,
        "dropoffLongitude": -74.0445,
        "startTime": now.isoformat(),
        "endTime": end_time.isoformat(),
        "remarks": "Loading cargo at warehouse",
        "currentCycleUsed": 2.5,
        "odometerReading": 125000,
        "engineHours": 3500.5,
        "vehicleId": "TRUCK001"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/eld-logs/", json=test_data)
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ ELD log created successfully! Log ID: {result.get('log_id')}")
            return result.get('log_id')
        else:
            print(f"❌ Failed to create ELD log. Status: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error making request: {e}")
        return None

def test_get_eld_logs():
    """Test retrieving ELD logs"""
    print("\nTesting ELD log retrieval...")
    
    try:
        response = requests.get(f"{BASE_URL}/eld-logs/list/", params={
            "driver_username": "test_driver",
            "limit": 10
        })
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Retrieved {result.get('count', 0)} ELD logs successfully!")
            
            # Print summary of logs
            for log in result.get('logs', []):
                print(f"  - Log {log['id']}: {log['activityStatus']} at {log['currentLocation']}")
                
            return result.get('logs', [])
        else:
            print(f"❌ Failed to retrieve ELD logs. Status: {response.status_code}")
            print(f"Response: {response.text}")
            return []
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error making request: {e}")
        return []

def test_update_eld_log(log_id):
    """Test updating an ELD log"""
    if not log_id:
        print("\nSkipping update test - no log ID available")
        return
        
    print(f"\nTesting ELD log update for log ID {log_id}...")
    
    update_data = {
        "activityStatus": "driving",
        "remarks": "Started driving to delivery location",
        "editReason": "Activity status changed from on-duty to driving"
    }
    
    try:
        response = requests.put(f"{BASE_URL}/eld-logs/{log_id}/", json=update_data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ ELD log updated successfully! {result.get('message')}")
        else:
            print(f"❌ Failed to update ELD log. Status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error making request: {e}")

def main():
    """Run all tests"""
    print("🚛 Testing ELD API Endpoints")
    print("=" * 40)
    
    # Test creation
    log_id = test_create_eld_log()
    
    # Test retrieval
    logs = test_get_eld_logs()
    
    # Test update
    test_update_eld_log(log_id)
    
    print("\n" + "=" * 40)
    print("✅ All tests completed!")

if __name__ == "__main__":
    main()