from flask import Flask, jsonify, request, send_from_directory
import mysql.connector
from mysql.connector import Error
import os

app = Flask(__name__, static_folder='static', static_url_path='')

# MySQL Configuration
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'bloodbank',
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}

def get_db_connection():
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
        
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) as count FROM donors")
        total_donors = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM donations")
        total_donations = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM donations WHERE donation_date = CURDATE()")
        today_donations = cursor.fetchone()['count']
        
        cursor.execute("""
            SELECT COUNT(*) as count FROM donors d
            WHERE d.donor_id NOT IN (
                SELECT donor_id FROM donations
                WHERE donation_date > DATE_SUB(CURDATE(), INTERVAL 90 DAY)
            )
        """)
        eligible_count = cursor.fetchone()['count']
        
        return jsonify({
            "totalDonors": total_donors,
            "totalDonations": total_donations,
            "todayDonations": today_donations,
            "eligibleCount": eligible_count
        })
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/donors', methods=['GET'])
def get_donors():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
        
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                d.donor_id,
                d.name,
                d.age,
                d.gender,
                d.blood_group,
                d.phone,
                d.address,
                d.created_at,
                MAX(dt.donation_date) AS last_donation,
                COUNT(dt.donation_id) AS total_donations,
                DATEDIFF(CURDATE(), MAX(dt.donation_date)) AS days_since,
                CASE
                    WHEN MAX(dt.donation_date) IS NULL THEN 1
                    WHEN DATEDIFF(CURDATE(), MAX(dt.donation_date)) >= 90 THEN 1
                    ELSE 0
                END AS eligible
            FROM donors d
            LEFT JOIN donations dt ON dt.donor_id = d.donor_id
            GROUP BY d.donor_id
            ORDER BY d.created_at DESC
        """)
        donors = cursor.fetchall()
        return jsonify(donors)
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/donors', methods=['POST'])
def add_donor():
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
        
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO donors (name, age, gender, blood_group, phone, address) VALUES (%s, %s, %s, %s, %s, %s)",
            (data['name'], data['age'], data['gender'], data['blood_group'], data['phone'], data['address'])
        )
        conn.commit()
        return jsonify({"success": True}), 201
    except Error as e:
        if e.errno == 1062: # Duplicate entry
            return jsonify({"error": "Phone number already registered."}), 400
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/donate', methods=['POST'])
def record_donation():
    data = request.json
    donor_id = data.get('donor_id')
    
    if not donor_id:
        return jsonify({"error": "Donor ID is required"}), 400
        
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
        
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO donations (donor_id, donation_date) VALUES (%s, CURDATE())", (donor_id,))
        conn.commit()
        return jsonify({"success": True}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/search', methods=['GET'])
def search_donors():
    blood_group = request.args.get('blood_group')
    if not blood_group:
        return jsonify({"error": "Blood group parameter is required"}), 400
        
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
        
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                d.donor_id,
                d.name,
                d.age,
                d.gender,
                d.address,
                MAX(dt.donation_date) AS last_donation,
                DATEDIFF(CURDATE(), MAX(dt.donation_date)) AS days_since,
                CASE WHEN MAX(dt.donation_date) IS NULL THEN 0
                     WHEN DATEDIFF(CURDATE(), MAX(dt.donation_date)) >= 90 THEN 1
                     ELSE 2 END AS sort_order
            FROM donors d
            LEFT JOIN donations dt ON dt.donor_id = d.donor_id
            WHERE d.blood_group = %s
            GROUP BY d.donor_id
            ORDER BY sort_order ASC, d.name ASC
        """, (blood_group,))
        results = cursor.fetchall()
        return jsonify(results)
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
