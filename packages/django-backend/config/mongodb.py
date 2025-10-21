"""
MongoDB connection handler for Django
"""
import os
from pymongo import MongoClient
from urllib.parse import quote_plus

def get_mongodb_client():
    """
    Returns a MongoDB client instance
    """
    mongodb_uri = os.getenv('MONGODB_URI')
    if not mongodb_uri:
        raise ValueError("MONGODB_URI environment variable is not set")
    
    client = MongoClient(mongodb_uri)
    return client

def get_database():
    """
    Returns the MongoDB database instance
    """
    client = get_mongodb_client()
    db_name = os.getenv('MONGODB_NAME', 'spotter_db')
    return client[db_name]
