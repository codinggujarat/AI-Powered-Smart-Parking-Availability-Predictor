import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from .database import SessionLocal, engine
from . import models, auth

# Set seed for reproducibility
np.random.seed(42)
random.seed(42)

def generate_zones(db: Session, count=10):
    zones = []
    base_lat, base_lon = 23.0225, 72.5714  # Ahmedabad coordinates
    
    zone_types = ['Street', 'Garage', 'Lot']
    districts = ['Downtown', 'Central', 'Commercial', 'Residential']
    
    for i in range(count):
        zone_id = f"ZONE_{i+1:03d}"
        zone = models.Zone(
            zone_id=zone_id,
            zone_name=f"{random.choice(districts)} Parking {i+1}",
            zone_type=random.choice(zone_types),
            district=random.choice(districts),
            latitude=base_lat + random.uniform(-0.05, 0.05),
            longitude=base_lon + random.uniform(-0.05, 0.05),
            total_capacity=random.randint(50, 200),
            hourly_rate=float(random.randint(10, 50)),
            operating_hours="24/7"
        )
        db.add(zone)
        zones.append(zone)
    db.commit()
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
