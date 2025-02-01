from flask import Flask
from flask_session import Session
import os
from dotenv import load_dotenv
# app = Flask(__name__)

def create_app():
    load_dotenv('./.env.local')
    app = Flask(__name__)
    

    # App configuration
    app.secret_key = os.environ.get("SECRET_KEY") or os.urandom(24)
    app.config['SESSION_TYPE'] = 'filesystem'  # Store sessions in the filesystem

    Session(app)

    from .routes import main_routes
    from .auth import auth_routes

    # Register blueprints for routes and authentication
    app.register_blueprint(main_routes)
    app.register_blueprint(auth_routes)

    return app
