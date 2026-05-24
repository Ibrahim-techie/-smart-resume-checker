import os
from urllib.parse import urlparse

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

_client = None


def _get_database_name(mongo_uri: str) -> str:
    parsed = urlparse(mongo_uri)
    database_name = parsed.path.lstrip('/').split('?')[0]
    return database_name or 'smartResumeChecker'


def get_db():
    global _client

    mongo_uri = os.environ.get('MONGO_URI')
    if not mongo_uri:
        raise RuntimeError('MONGO_URI is required for AI service database updates')

    if _client is None:
        _client = MongoClient(mongo_uri)

    return _client[_get_database_name(mongo_uri)]
