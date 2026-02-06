import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_admin_flow():
    # 1. Login
    print("Testing Login...")
    login_data = {"username": "admin@smartpark.ai", "password": "password123"}
    resp = requests.post(f"{BASE_URL}/users/login", data=login_data)
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login success!")

    # 2. List Users
    print("\nTesting List Users...")
    resp = requests.get(f"{BASE_URL}/admin/users", headers=headers)
    if resp.status_code == 200:
        users = resp.json()
        print(f"Successfully fetched {len(users)} users.")
        for u in users:
            print(f"- {u['email']} (Admin: {u['is_admin']})")
    else:
        print(f"List users failed: {resp.text}")

    # 3. Retrain Model
    print("\nTesting Model Retraining...")
    resp = requests.post(f"{BASE_URL}/admin/retrain", headers=headers)
    if resp.status_code == 200:
        print("Retraining success!")
        print(f"Result: {json.dumps(resp.json(), indent=2)}")
    else:
        print(f"Retraining failed: {resp.text}")

if __name__ == "__main__":
    test_admin_flow()
