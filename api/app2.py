# from flask import Flask, redirect, request, url_for
# # Python standard libraries
# import json
# import os
# from oauthlib.oauth2 import WebApplicationClient
# import requests
# from dotenv import load_dotenv
# from flask_login import (
#     LoginManager,
#     current_user,
#     login_required,
#     login_user,
#     logout_user,
# )
# from oauthlib.oauth2 import WebApplicationClient
# import requests

# load_dotenv()
# GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", None)
# GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", None)
# GOOGLE_DISCOVERY_URL = (
#     "https://accounts.google.com/.well-known/openid-configuration"
# )
# app = Flask(__name__)
# app.secret_key = os.environ.get("SECRET_KEY") or os.urandom(24)

# # User session management setup
# # https://flask-login.readthedocs.io/en/latest
# login_manager = LoginManager()
# login_manager.init_app(app)

# client = WebApplicationClient(GOOGLE_CLIENT_ID)

# @app.route("/login")
# def login():
#     # Find out what URL to hit for Google login
#     google_provider_cfg = get_google_provider_cfg()
#     authorization_endpoint = google_provider_cfg["authorization_endpoint"]

#     # Use library to construct the request for Google login and provide
#     # scopes that let you retrieve user's profile from Google
#     request_uri = client.prepare_request_uri(
#         authorization_endpoint,
#         redirect_uri=request.base_url + "/callback",
#         scope=["openid", "email", "profile"],
#     )
#     return redirect(request_uri)

# def get_google_provider_cfg():
#     return requests.get(GOOGLE_DISCOVERY_URL).json()