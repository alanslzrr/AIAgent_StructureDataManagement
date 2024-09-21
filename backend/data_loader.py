import pymongo

def setup_mongodb():
    uri = "mongodb+srv://alanslzr:alanslzr@clusterphoenix.ffv0t.mongodb.net/?retryWrites=true&w=majority&appName=ClusterPhoenix"
    client = pymongo.MongoClient(uri)
    db = client["calibration_database"]
    collection = db["calibration_data"]
    print(f"MongoDB connection established. Collection: {collection.name}")
    return collection