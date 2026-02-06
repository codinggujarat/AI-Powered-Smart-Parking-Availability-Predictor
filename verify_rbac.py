import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_rbac_logic():
    # 1. Register a NEW USER
    new_user_email = "test_driver@smartpark.ai"
    print(f"Testing Registration for {new_user_email}...")
    reg_data = {"email": new_user_email, "name": "Test Driver", "password": "password123"}
    requests.post(f"{BASE_URL}/users/register", json=reg_data)
    
    # 2. Login as the NEW USER
    print("Testing Login for new user...")
    login_data = {"username": new_user_email, "password": "password123"}
    resp = requests.post(f"{BASE_URL}/users/login", data=login_data)
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Check Role via /users/me
    print("Verifying role via /users/me...")
    resp = requests.get(f"{BASE_URL}/users/me", headers=headers)
    profile = resp.json()
    print(f"Profile: {profile['email']}, Role: {'Admin' if profile['is_admin'] else 'User'}")
    assert profile['is_admin'] is False, "ERROR: New registered user should NOT be an admin"
    
    # 4. Attempt Admin Actions (Should Fail)
    print("\nAttempting unauthorized admin actions...")
    
    # Attempt to list all users
    resp = requests.get(f"{BASE_URL}/admin/users", headers=headers)
    print(f"List users status: {resp.status_code} (Expected: 403 or 401)")
    
    # Attempt to create event
    event_data = {
        "event_name": "Hack Attempt",
        "event_type": "None",
        "start_time": "2026-02-07T10:00:00",
        "end_time": "2026-02-07T12:00:00",
        "latitude": 23.0,
        "longitude": 72.0,
        "venue": "Nowhere",
        "expected_attendance": 0
    }
    resp = requests.post(f"{BASE_URL}/events", json=event_data, headers=headers)
    print(f"Create event status: {resp.status_code} (Expected: 403 or 401)")

    # 5. Check persistence of Admin status for Admin
    print("\nVerifying Admin status for existing admin...")
    login_admin = {"username": "admin@smartpark.ai", "password": "password123"}
    resp = requests.post(f"{BASE_URL}/users/login", data=login_admin)
    admin_token = resp.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    resp = requests.get(f"{BASE_URL}/users/me", headers=admin_headers)
    admin_profile = resp.json()
    print(f"Admin Profile: {admin_profile['email']}, Role: {'Admin' if admin_profile['is_admin'] else 'User'}")
    assert admin_profile['is_admin'] is True, "ERROR: admin@smartpark.ai should be an admin"

    print("\n✅ RBAC Logic Verification Complete!")

if __name__ == "__main__":
    try:
        test_rbac_logic()
    except Exception as e:
        print(f"❌ Verification Failed: {str(e)}")
