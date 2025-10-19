import requests
import json
import sys

BASE_URL = 'http://localhost:5000'

print("=" * 60)
print("Testing Weekly Advisor Endpoint with Formatted Response")
print("=" * 60)

# Try to login with existing user
print("\nAttempting login...")
login_response = requests.post(
    f'{BASE_URL}/api/auth/login',
    json={
        'username': 'weeklytest',
        'password': 'TestPassword123!'
    }
)

if login_response.status_code != 200:
    print(f"Login failed: {login_response.json()}")
    sys.exit(1)

token = login_response.json().get('token')
print(f"Login successful, got token")

# Test the weekly-advisor endpoint
print(f"\nFetching weekly advisor data...")
advisor_response = requests.get(
    f'{BASE_URL}/api/weekly-advisor',
    headers={'Authorization': f'Bearer {token}'}
)

if advisor_response.status_code != 200:
    print(f"Failed: {advisor_response.status_code}")
    print(f"Response: {advisor_response.text}")
    sys.exit(1)

data = advisor_response.json()
print(f"\nSUCCESS! Weekly Review with Markdown Formatting:")
print("=" * 60)
print("\nWEEKLY REVIEW (RAW MARKDOWN):")
print(data['weeklyReview'])
print("\n" + "=" * 60)
print("Response metadata:")
print(f"  - Course Count: {data.get('courseCount')}")
print(f"  - Assignment Count: {data.get('assignmentCount')}")
print(f"  - Event Count: {data.get('eventCount')}")
print("=" * 60)
