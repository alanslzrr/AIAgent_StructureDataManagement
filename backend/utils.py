from datetime import datetime, timedelta

def find_nearest_expiring_certificate(collection):
    current_date = datetime.now().date()
    
    # Pipeline for nearest expiring certificate
    nearest_expiring_pipeline = [
        {"$unwind": "$Standards"},
        {"$match": {"Standards.DueDate": {"$gt": current_date.isoformat()}}},
        {"$sort": {"Standards.DueDate": 1}},
        {"$limit": 1},
        {"$project": {
            "Certificate": "$CertNo",
            "Standard": {"$concat": ["$Standards.Description", " (ID ", "$Standards.IdInst", ")"]},
            "Expiration_date": "$Standards.DueDate",
            "Days_until_expiration": {
                "$divide": [
                    {"$subtract": [
                        {"$dateFromString": {"dateString": "$Standards.DueDate"}},
                        {"$dateFromString": {"dateString": current_date.isoformat()}}
                    ]},
                    86400000  # milliseconds in a day
                ]
            }
        }}
    ]

    # Pipeline for last expired certificate
    last_expired_pipeline = [
        {"$unwind": "$Standards"},
        {"$match": {"Standards.DueDate": {"$lt": current_date.isoformat()}}},
        {"$sort": {"Standards.DueDate": -1}},
        {"$limit": 1},
        {"$project": {
            "Certificate": "$CertNo",
            "Standard": {"$concat": ["$Standards.Description", " (ID ", "$Standards.IdInst", ")"]},
            "Expiration_date": "$Standards.DueDate",
            "Days_since_expiration": {
                "$divide": [
                    {"$subtract": [
                        {"$dateFromString": {"dateString": current_date.isoformat()}},
                        {"$dateFromString": {"dateString": "$Standards.DueDate"}}
                    ]},
                    86400000  # milliseconds in a day
                ]
            }
        }}
    ]

    nearest_expiring = list(collection.aggregate(nearest_expiring_pipeline))
    
    if nearest_expiring:
        cert_info = nearest_expiring[0]
        return {
            "Type": "Nearest Expiring",
            "Certificate": cert_info["Certificate"],
            "Standard": cert_info["Standard"],
            "Expiration date": cert_info["Expiration_date"],
            "Days until expiration": int(cert_info['Days_until_expiration'])
        }
    else:
        last_expired = list(collection.aggregate(last_expired_pipeline))
        if last_expired:
            cert_info = last_expired[0]
            return {
                "Type": "Last Expired",
                "Certificate": cert_info["Certificate"],
                "Standard": cert_info["Standard"],
                "Expiration date": cert_info["Expiration_date"],
                "Days since expiration": int(cert_info['Days_since_expiration'])
            }
        else:
            return {"Type": "No Certificates", "Status": "No certificates found in the database."}
        
import re

def celsius_to_fahrenheit(celsius):
    return celsius * 9/5 + 32

def fahrenheit_to_celsius(fahrenheit):
    return (fahrenheit - 32) * 5/9

def extract_number_and_unit(value):
    match = re.match(r"(-?\d+(?:\.\d+)?)\s*°?([CF])?", value)
    if match:
        number = float(match.group(1))
        unit = match.group(2) or 'C'  # Default to Celsius if no unit is specified
        return number, unit
    return None, None

def get_dashboard_data(collection):
    current_date = datetime.now().date()
    
    # Pipeline para contar certificados
    count_pipeline = [
        {"$facet": {
            "total": [{"$count": "count"}],
            "expiring_soon": [
                {"$unwind": "$Standards"},
                {"$match": {
                    "Standards.DueDate": {
                        "$gte": current_date.isoformat(),
                        "$lte": (current_date + timedelta(days=30)).isoformat()
                    }
                }},
                {"$group": {"_id": "$CertNo"}},
                {"$count": "count"}
            ],
            "accredited": [
                {"$match": {"IsAccredited": True}},
                {"$count": "count"}
            ]
        }},
        {"$project": {
            "totalCertificates": {"$ifNull": [{"$arrayElemAt": ["$total.count", 0]}, 0]},
            "expiringCertificates": {"$ifNull": [{"$arrayElemAt": ["$expiring_soon.count", 0]}, 0]},
            "accreditedCertificates": {"$ifNull": [{"$arrayElemAt": ["$accredited.count", 0]}, 0]}
        }}
    ]

    # Pipeline para tipos de equipo
    equipment_types_pipeline = [
        {"$group": {"_id": "$EquipmentType", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
        {"$project": {"_id": 0, "type": "$_id", "count": 1}}
    ]

    # Ejecutar pipelines
    counts = list(collection.aggregate(count_pipeline))[0]
    equipment_types = list(collection.aggregate(equipment_types_pipeline))

    # Calcular condiciones ambientales promedio en Python
    all_docs = list(collection.find({}, {"EnvironmentalTemperature": 1, "EnvironmentalRelativeHumidity": 1, "EnvironmentalBarometricPressure": 1}))
    
    temps = []
    humidities = []
    pressures = []

    for doc in all_docs:
        temp = doc.get("EnvironmentalTemperature", "")
        humidity = doc.get("EnvironmentalRelativeHumidity", "")
        pressure = doc.get("EnvironmentalBarometricPressure", "")

        temp_value, temp_unit = extract_number_and_unit(temp)
        if temp_value is not None:
            if temp_unit == 'F':
                temp_value = fahrenheit_to_celsius(temp_value)
            temps.append(temp_value)

        humidity_value, _ = extract_number_and_unit(humidity)
        if humidity_value is not None:
            humidities.append(humidity_value)

        pressure_value, _ = extract_number_and_unit(pressure)
        if pressure_value is not None:
            pressures.append(pressure_value)

    avg_temp = sum(temps) / len(temps) if temps else None
    avg_humidity = sum(humidities) / len(humidities) if humidities else None
    avg_pressure = sum(pressures) / len(pressures) if pressures else None

    env_conditions = {
        "avgTemperature": f"{avg_temp:.1f}°C" if avg_temp is not None else "N/A",
        "avgHumidity": f"{avg_humidity:.1f}%" if avg_humidity is not None else "N/A",
        "avgPressure": f"{avg_pressure:.1f} kPa" if avg_pressure is not None else "N/A"
    }

    # Preparar resultado
    result = {
        "totalCertificates": counts.get("totalCertificates", 0),
        "expiringCertificates": counts.get("expiringCertificates", 0),
        "accreditedCertificates": counts.get("accreditedCertificates", 0),
        "equipmentTypes": {item["type"]: item["count"] for item in equipment_types},
        "environmentalConditions": env_conditions
    }

    return result