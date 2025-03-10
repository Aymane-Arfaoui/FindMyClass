from flask import Flask
from flask_session import Session
import os
from dotenv import load_dotenv
from flask_cors import CORS



def create_app():
    load_dotenv('./.env.local')
    app = Flask(__name__)
    CORS(app)
    

    # App configuration
    app.secret_key = os.environ.get("SECRET_KEY") or os.urandom(24)
    app.config['SESSION_TYPE'] = 'filesystem'  # Store sessions in the filesystem

    Session(app)

    from .routes import main_routes
    from .auth import auth_routes
    from .test import test_routes
    from .navigation import navigation_routes


    # Register blueprints for routes and authentication
    app.register_blueprint(main_routes)
    app.register_blueprint(auth_routes)
    app.register_blueprint(test_routes)
    app.register_blueprint(navigation_routes)

    return app
