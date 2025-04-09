from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure SQLite database
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'chargers.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# Define Charger model
class Charger(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    location = db.Column(db.String(120), nullable=False)
    available = db.Column(db.Boolean, default=True)
    power = db.Column(db.String(20), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    last_used = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'location': self.location,
            'available': self.available,
            'power': self.power,
            'type': self.type,
            'notes': self.notes,
            'lastUsed': self.last_used.isoformat() if self.last_used else None,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }

# Create tables if they don't exist
with app.app_context():
    db.create_all()
    
    # Add sample data if the database is empty
    if Charger.query.count() == 0:
        sample_chargers = [
            Charger(
                location="Downtown Parking Garage", 
                available=True, 
                power="50kW", 
                type="CCS", 
                notes="Located near the elevator on level 2"
            ),
            Charger(
                location="City Hall - North Lot", 
                available=False, 
                power="150kW", 
                type="CCS/CHAdeMO", 
                notes="Available to public during business hours"
            ),
            Charger(
                location="Shopping Mall - Level 2", 
                available=True, 
                power="22kW", 
                type="Type 2", 
                notes="4 hour maximum charging time"
            ),
            Charger(
                location="Public Library", 
                available=True, 
                power="11kW", 
                type="Type 2", 
                notes="Free charging for library card holders"
            ),
            Charger(
                location="Central Park - East Entrance", 
                available=False, 
                power="7kW", 
                type="Type 1", 
                notes="Solar powered charger"
            ),
            Charger(
                location="Tech Campus - Building A", 
                available=True, 
                power="350kW", 
                type="CCS", 
                notes="High-speed charging station"
            )
        ]
        
        for charger in sample_chargers:
            db.session.add(charger)
        
        db.session.commit()

# API Routes
@app.route('/chargers', methods=['GET'])
def get_chargers():
    """Get all chargers or filter by availability"""
    available = request.args.get('available')
    query = Charger.query
    
    if available is not None:
        query = query.filter(Charger.available == (available.lower() == 'true'))
        
    chargers = query.all()
    return jsonify([charger.to_dict() for charger in chargers])

@app.route('/chargers/<int:charger_id>', methods=['GET'])
def get_charger(charger_id):
    """Get a specific charger by ID"""
    charger = Charger.query.get_or_404(charger_id)
    return jsonify(charger.to_dict())

@app.route('/chargers', methods=['POST'])
def add_charger():
    """Add a new charger"""
    data = request.json
    
    # Validate required fields
    required_fields = ['location', 'power', 'type']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    new_charger = Charger(
        location=data['location'],
        available=data.get('available', True),
        power=data['power'],
        type=data['type'],
        notes=data.get('notes', '')
    )
    
    db.session.add(new_charger)
    db.session.commit()
    
    return jsonify(new_charger.to_dict()), 201

@app.route('/chargers/<int:charger_id>', methods=['PUT', 'PATCH'])
def update_charger(charger_id):
    """Update an existing charger"""
    charger = Charger.query.get_or_404(charger_id)
    data = request.json
    
    # Update fields if they are in the request
    if 'location' in data:
        charger.location = data['location']
    if 'available' in data:
        charger.available = data['available']
        if data['available'] is False:
            # Update last_used timestamp when marking as unavailable
            charger.last_used = datetime.utcnow()
    if 'power' in data:
        charger.power = data['power']
    if 'type' in data:
        charger.type = data['type']
    if 'notes' in data:
        charger.notes = data['notes']
    
    db.session.commit()
    return jsonify(charger.to_dict())

@app.route('/chargers/<int:charger_id>', methods=['DELETE'])
def delete_charger(charger_id):
    """Delete a charger"""
    charger = Charger.query.get_or_404(charger_id)
    db.session.delete(charger)
    db.session.commit()
    return jsonify({'message': 'Charger deleted successfully'}), 200

@app.route('/chargers/stats', methods=['GET'])
def get_charger_stats():
    """Get statistics about chargers"""
    total_chargers = Charger.query.count()
    available_chargers = Charger.query.filter_by(available=True).count()
    unavailable_chargers = total_chargers - available_chargers
    
    # Group by charger type
    charger_types = {}
    types = db.session.query(Charger.type, db.func.count(Charger.id))\
        .group_by(Charger.type)\
        .all()
    
    for charger_type, count in types:
        charger_types[charger_type] = count
    
    return jsonify({
        'totalChargers': total_chargers,
        'availableChargers': available_chargers,
        'unavailableChargers': unavailable_chargers,
        'chargerTypes': charger_types
    })

# Error Handlers
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True)