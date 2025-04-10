import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('./.env.local')

# Google Maps API key
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')

# OpenAI API key
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY') 