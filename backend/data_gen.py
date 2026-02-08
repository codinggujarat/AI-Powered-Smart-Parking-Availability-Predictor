import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend import models, auth

# Set seed for reproducibility
np.random.seed(42)
random.seed(42)

def generate_zones(db: Session):
    zones = []
    
    # Gujarat Cities with Coordinates
    gujarat_cities = {
        "Ahmedabad": (23.0225, 72.5714),
        "Gandhinagar": (23.2156, 72.6369),
        "Surat": (21.1702, 72.8311),
        "Vadodara": (22.3072, 73.1812),
        "Rajkot": (22.3039, 70.8022),
        "Bhavnagar": (21.7645, 72.1519),
        "Jamnagar": (22.4707, 70.0577),
        "Junagadh": (21.5222, 70.4579),
        "Anand": (22.5645, 72.9289),
        "Nadiad": (22.6916, 72.8634),
        "Morbi": (22.8116, 70.8238),
        "Mehsana": (23.6000, 72.4000),
        "Bharuch": (21.7051, 72.9959),
        "Vapi": (20.3893, 72.9106),
        "Valsad": (20.5960, 72.9347),
        "Porbandar": (21.6417, 69.6293),
        "Godhra": (22.7788, 73.6143),
        "Patan": (23.8493, 72.1266),
        "Palanpur": (24.1724, 72.4346),
        "Botad": (22.1706, 71.6698),
        "Amreli": (21.6032, 71.2221),
        "Bhuj": (23.2420, 69.6669)
    }
    
    zone_types = ['Street', 'Garage', 'Lot', 'Mall', 'Station']
    districts = ['Central', 'North', 'South', 'East', 'West', 'Market', 'Station Road']
    
    total_generated = 0
    
    for city_name, (lat, lon) in gujarat_cities.items():
        # Generate 5-8 zones per city
        city_count = random.randint(5, 8)
        
        for i in range(city_count):
            # Use 4 chars to avoid collisions (e.g. Bhavnagar vs Bharuch)
            prefix = city_name[:4].upper()
            zone_id = f"ZONE_{prefix}_{i+1:03d}"
            
            # Add some noise to coordinates to spread them out
            zone_lat = lat + random.uniform(-0.04, 0.04)
            zone_lon = lon + random.uniform(-0.04, 0.04)
            
            zone_type = random.choice(zone_types)
            district_name = random.choice(districts)
            
            zone = models.Zone(
                zone_id=zone_id,
                zone_name=f"{city_name} {district_name} Parking {i+1}",
                zone_type=zone_type,
                district=city_name, # Use City as District for search grouping
                latitude=zone_lat,
                longitude=zone_lon,
                total_capacity=random.randint(40, 300),
                hourly_rate=float(random.randint(20, 100)),
                operating_hours="24/7"
            )
            db.add(zone)
            zones.append(zone)
            total_generated += 1
            
    db.commit()
    print(f"Generated {total_generated} zones across {len(gujarat_cities)} cities.")
    return zones

def generate_events(db: Session, count=5):
    events = []
    base_lat, base_lon = 23.0225, 72.5714
    event_types = ['Sports', 'Concert', 'Festival', 'Conference']
    
    start_date = datetime.utcnow()
    
    for i in range(count):
        event_start = start_date + timedelta(days=random.randint(-5, 15), hours=random.randint(10, 20))
        event_end = event_start + timedelta(hours=random.randint(3, 6))
        
        event = models.Event(
            event_name=f"Big {random.choice(event_types)} Event {i+1}",
            event_type=random.choice(event_types),
            start_time=event_start,
            end_time=event_end,
            latitude=base_lat + random.uniform(-0.02, 0.02),
            longitude=base_lon + random.uniform(-0.02, 0.02),
            venue=f"Stadium {i+1}",
            expected_attendance=random.randint(5000, 50000)
        )
        db.add(event)
        events.append(event)
    db.commit()
    return events

def generate_occupancy(db: Session, zones, days=30):
    end_time = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    start_time = end_time - timedelta(days=days)
    
    current_time = start_time
    while current_time <= end_time:
        hour = current_time.hour
        is_weekend = current_time.weekday() >= 5
        
        for zone in zones:
            # Base occupancy pattern
            if 7 <= hour <= 9:  # Morning rush
                base_occ = random.uniform(0.6, 0.9)
            elif 17 <= hour <= 19:  # Evening rush
                base_occ = random.uniform(0.7, 0.95)
            elif 22 <= hour or hour <= 6:  # Night
                base_occ = random.uniform(0.1, 0.3)
            else:
                base_occ = random.uniform(0.4, 0.7)
                
            if is_weekend:
                base_occ += random.uniform(-0.1, 0.2)
            
            # Clamp to [0, 1]
            occupancy_pct = max(0.0, min(1.0, base_occ))
            occupied = int(zone.total_capacity * occupancy_pct)
            
            occ_record = models.Occupancy(
                zone_id=zone.zone_id,
                timestamp=current_time,
                occupied_spots=occupied,
                total_capacity=zone.total_capacity,
                occupancy_percentage=occupancy_pct * 100,
                data_source="Synthetic Generator"
            )
            db.add(occ_record)
        
        if current_time.hour == 0:
            db.commit()
            print(f"Generated data for {current_time.date()}")
            
        current_time += timedelta(hours=1)
    db.commit()

def run_gen():
    print("Clearing existing data...")
    models.Base.metadata.drop_all(bind=engine)
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("Seeding default admin user...")
        admin = db.query(models.User).filter(models.User.email == "admin@smartpark.ai").first()
        if not admin:
            admin = models.User(
                email="admin@smartpark.ai",
                hashed_password=auth.get_password_hash("password123"),
                name="Admin User",
                is_admin=True
            )
            db.add(admin)
            db.commit()
            print("Admin user created.")

        print("Generating zones...")
        zones = generate_zones(db)
        print("Generating events...")
        generate_events(db)
        print("Generating occupancy data...")
        generate_occupancy(db, zones)
        print("Data generation complete!")
    finally:
        db.close()

if __name__ == "__main__":
    run_gen()
