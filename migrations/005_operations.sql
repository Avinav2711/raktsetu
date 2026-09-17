CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name TEXT NOT NULL,
  donor_email TEXT,
  blood_group TEXT NOT NULL,
  units INTEGER NOT NULL DEFAULT 1,
  facility TEXT NOT NULL,
  city TEXT NOT NULL,
  donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS camps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  facility TEXT NOT NULL,
  city TEXT NOT NULL,
  camp_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 50,
  booked INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name TEXT NOT NULL,
  donor_email TEXT,
  camp_id UUID REFERENCES camps(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Booked',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO camps (name, facility, city, camp_date, start_time, end_time, capacity, booked)
SELECT 'Community Blood Drive', 'Community Centre', 'Delhi', '2026-09-25', '10:00 AM', '4:00 PM', 60, 32
WHERE NOT EXISTS (SELECT 1 FROM camps WHERE name = 'Community Blood Drive');

INSERT INTO camps (name, facility, city, camp_date, start_time, end_time, capacity, booked)
SELECT 'LifeCare Donation Camp', 'LifeCare Hospital', 'Delhi', '2026-10-02', '9:00 AM', '3:00 PM', 70, 29
WHERE NOT EXISTS (SELECT 1 FROM camps WHERE name = 'LifeCare Donation Camp');

INSERT INTO inventory (facility, city, blood_group, units, status)
SELECT 'LifeCare Hospital', 'Delhi', 'O+', 18, 'Available'
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE facility='LifeCare Hospital' AND blood_group='O+');

INSERT INTO inventory (facility, city, blood_group, units, status)
SELECT 'LifeCare Hospital', 'Delhi', 'O-', 6, 'Low stock'
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE facility='LifeCare Hospital' AND blood_group='O-');

INSERT INTO inventory (facility, city, blood_group, units, status)
SELECT 'City Blood Bank', 'Delhi', 'A+', 22, 'Available'
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE facility='City Blood Bank' AND blood_group='A+');

INSERT INTO inventory (facility, city, blood_group, units, status)
SELECT 'City Blood Bank', 'Delhi', 'B+', 4, 'Critical'
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE facility='City Blood Bank' AND blood_group='B+');

INSERT INTO inventory (facility, city, blood_group, units, status)
SELECT 'Metro Hospital', 'Sonipat', 'AB+', 9, 'Available'
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE facility='Metro Hospital' AND blood_group='AB+');