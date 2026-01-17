# test_database_direct.py
import os
import django
import sqlite3
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edu2job_backend.settings')
django.setup()

from accounts.models import Education

print("🗄️ DIRECT DATABASE INSPECTION")
print("=" * 60)

# Path to your SQLite database
db_path = Path(__file__).parent / "db.sqlite3"

print(f"\n1️⃣ Database Location: {db_path}")
print(f"   Exists: {db_path.exists()}")

if db_path.exists():
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("\n2️⃣ Checking Education Table Structure:")
        cursor.execute("PRAGMA table_info(accounts_education);")
        columns = cursor.fetchall()
        
        print("   Columns in accounts_education:")
        for col in columns:
            print(f"     {col[1]} ({col[2]})")
        
        print("\n3️⃣ Checking Sample Data (RAW from database):")
        cursor.execute("SELECT id, degree, specialization, university, cgpa FROM accounts_education LIMIT 3;")
        rows = cursor.fetchall()
        
        for row in rows:
            print(f"\n   Record ID: {row[0]}")
            print(f"   Degree: {row[1]}")
            print(f"   Specialization (RAW): {row[2][:50] if row[2] else 'None'}...")
            print(f"   University (RAW): {row[3][:50] if row[3] else 'None'}...")
            print(f"   CGPA (RAW): {row[4][:50] if row[4] else 'None'}...")
            
            # Check if it looks encrypted
            if row[2] and row[2].startswith('gAAAAA'):
                print(f"   🔒 Specialization is ENCRYPTED")
            else:
                print(f"   ⚠️  Specialization may NOT be encrypted")
                
            if row[3] and row[3].startswith('gAAAAA'):
                print(f"   🔒 University is ENCRYPTED")
            else:
                print(f"   ⚠️  University may NOT be encrypted")
                
            if row[4] and row[4].startswith('gAAAAA'):
                print(f"   🔒 CGPA is ENCRYPTED")
            else:
                print(f"   ⚠️  CGPA may NOT be encrypted")
        
        print("\n4️⃣ Checking ML Preprocessed Data Table:")
        cursor.execute("SELECT COUNT(*) FROM accounts_mlpreprocesseddata;")
        ml_count = cursor.fetchone()[0]
        print(f"   Total ML records: {ml_count}")
        
        if ml_count > 0:
            cursor.execute("SELECT id, encoded_data FROM accounts_mlpreprocesseddata LIMIT 1;")
            ml_row = cursor.fetchone()
            if ml_row:
                print(f"\n   Sample ML Record ID: {ml_row[0]}")
                # Try to parse JSON
                try:
                    ml_data = eval(ml_row[1])  # Be careful with eval in production!
                    print(f"   Has 'ml_ready': {ml_data.get('ml_ready', False)}")
                    print(f"   Has 'features': {'features' in ml_data}")
                except:
                    print(f"   Could not parse encoded_data")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Database error: {e}")

print("\n5️⃣ Checking via Django ORM:")
try:
    educations = Education.objects.all()[:3]
    print(f"   Total education records: {Education.objects.count()}")
    
    for edu in educations:
        print(f"\n   Education ID: {edu.id}")
        print(f"   Degree: {edu.degree}")
        
        # Check encryption status
        spec = edu.specialization
        univ = edu.university
        cgpa = edu.cgpa
        
        print(f"   Specialization in DB: {spec[:50] if spec else 'None'}...")
        print(f"   Decrypted: {edu.get_decrypted_specialization()}")
        
        print(f"   University in DB: {univ[:50] if univ else 'None'}...")
        print(f"   Decrypted: {edu.get_decrypted_university()}")
        
        print(f"   CGPA in DB: {cgpa[:50] if cgpa else 'None'}...")
        print(f"   Decrypted: {edu.get_decrypted_cgpa()}")
        
except Exception as e:
    print(f"❌ ORM error: {e}")

print("\n" + "=" * 60)
print("🔑 ENCRYPTION STATUS CHECK")
print("=" * 60)

# Final verification
print("\nTo verify encryption is working:")
print("1. Look for 'gAAAAA' at start of database fields")
print("2. Decrypted values should match original input")
print("3. Model methods should return readable data")
print("\nTo verify ML preprocessing:")
print("1. MLPreprocessedData table should have records")
print("2. encoded_data should contain features array")
print("3. Features should be 5 numbers (3 categorical + 2 numerical)")