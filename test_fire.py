import firebase_admin
from firebase_admin import credentials, firestore

try:
    print("Connecting to Firebase...")
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ SUCCESS! Nayi key ekdum perfectly kaam kar rahi hai.")
except Exception as e:
    print(f"❌ ERROR: {e}")