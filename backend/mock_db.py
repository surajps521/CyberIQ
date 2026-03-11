import random

DISTRICTS = ["Bengaluru South", "Bengaluru North", "Bengaluru East", "Bengaluru West", "Mysuru", "Hubli", "Mangalore", "Belagavi", "Tumakuru", "Dharwad"]
CRIME_TYPES = ["Theft", "Chain Snatching", "Robbery", "Vehicle Theft", "Cybercrime", "Assault", "Burglary", "Fraud", "Murder", "Kidnapping"]
STATUSES = ["Open", "Investigating", "Closed", "Chargesheeted"]
OFFICERS = ["Inspector Sharma", "SI Ravi Kumar", "Inspector Patil", "SI Deepa Nair", "Inspector Mohan"]

def generate_cases(n=100):
    cases = []
    for i in range(1, n+1):
        district = random.choice(DISTRICTS)
        crime = random.choice(CRIME_TYPES)
        cases.append({
            "id": f"KSP/{district[:3].upper()}/2024/{4000+i}",
            "crime_type": crime,
            "district": district,
            "area": f"{district} Area {random.randint(1,5)}",
            "date": f"{random.randint(1,28):02d}/{random.randint(1,12):02d}/2024",
            "status": random.choice(STATUSES),
            "officer": random.choice(OFFICERS),
            "victims": random.randint(1, 3),
            "accused": random.randint(1, 4),
            "description": f"{crime} case reported in {district}. Under investigation.",
            "priority": random.choice(["High", "Medium", "Low"]),
        })
    return cases

MOCK_CASES = generate_cases(100)
MOCK_CRIMINALS = [
    {"id":"C001","name":"Rajesh Yadav","alias":"Raja","age":34,"cases":5,"area":"BTM Layout","status":"Wanted","crimes":["Robbery","Chain Snatching"]},
    {"id":"C002","name":"Vikram Singh","alias":"Vikki","age":41,"cases":8,"area":"Jayanagar","status":"Arrested","crimes":["Assault","Murder"]},
    {"id":"C003","name":"Suresh Kumar","alias":"Suri","age":28,"cases":3,"area":"Koramangala","status":"Under Trial","crimes":["Theft","Burglary"]},
    {"id":"C004","name":"Deepak Nair","alias":"Deep","age":38,"cases":6,"area":"Hebbal","status":"Wanted","crimes":["Vehicle Theft","Robbery"]},
    {"id":"C005","name":"Mohan Das","alias":"Monu","age":25,"cases":1,"area":"Electronic City","status":"Released","crimes":["Fraud"]},
]
