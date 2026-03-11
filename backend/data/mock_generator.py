# backend/data/mock_generator.py

from faker import Faker
import random, json, os

# en_IN = English (India) — gives Indian names and addresses
fake = Faker('en_IN')

# These are the categories your data will use
crime_types = [
    "Robbery", "Theft", "Murder", "Assault",
    "Cybercrime", "Kidnapping", "Fraud", "Chain Snatching",
    "Vehicle Theft", "Drug Trafficking"
]

districts = [
    "Bengaluru Urban", "Mysuru", "Hubli-Dharwad",
    "Mangaluru", "Belagavi", "Kalaburagi", "Shivamogga"
]

statuses = ["Open", "Under Investigation", "Closed", "Chargesheeted"]

def generate_cases(n=500):
    cases = []
    for i in range(n):
        case = {
            # f-string creates "KSP-2024-1000", "KSP-2024-1001" etc
            "case_id": f"KSP-2024-{1000 + i}",
            "type": random.choice(crime_types),
            "district": random.choice(districts),
            "status": random.choice(statuses),

            # fake.date_between = random date between 2 years ago and today
            "date": fake.date_between('-2y', 'today').isoformat(),

            # fake.paragraph = generates random realistic text
            "description": fake.paragraph(nb_sentences=6),

            "officer_assigned": fake.name(),
            "accused_name": fake.name(),
            "victim_name": fake.name(),
            "location": fake.address(),

            # Karnataka is roughly between these lat/lng coordinates
            "lat": round(random.uniform(11.5, 18.5), 6),
            "lng": round(random.uniform(74.0, 78.5), 6),

            # Some cases have multiple accused (for network graph later)
            "associates": [fake.name() for _ in range(random.randint(0, 3))]
        }
        cases.append(case)
    return cases

# Generate and save to file
cases = generate_cases(500)
with open("mock_cases.json", "w") as f:
    json.dump(cases, f, indent=2)

print(f"✅ Generated {len(cases)} mock KSP cases")