import os
from flask import Blueprint, redirect, request, session, url_for
from google_auth_oauthlib.flow import Flow
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from dotenv import load_dotenv

load_dotenv('./.env.local') # Load environment variables from .env.local file
auth_routes = Blueprint('auth', __name__)

# Load environment variables for Google Client ID and Secret
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = "http://localhost:5000/auth/callback"

# Configure OAuth flow
flow = Flow.from_client_config(
    {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    },
    scopes=["openid", "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"]
)
flow.redirect_uri = REDIRECT_URI

@auth_routes.route('/auth/login')
def login():
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    session['state'] = state
    return redirect(authorization_url)

@auth_routes.route('/auth/callback')
def callback():
    flow.fetch_token(authorization_response=request.url)

    credentials = flow.credentials
    id_info = id_token.verify_oauth2_token(
        credentials.id_token,
        google_requests.Request(),
        GOOGLE_CLIENT_ID,
    )

    # Store user info in session for later use
    session['user'] = {
        'email': id_info.get('email'),
        'name': id_info.get('name'),
        'picture': id_info.get('picture'),
    }

    return redirect(url_for('main.logged_in'))

@auth_routes.route('/auth/logout')
def logout():
    session.clear()
    return {"message": "Logged out successfully"}
