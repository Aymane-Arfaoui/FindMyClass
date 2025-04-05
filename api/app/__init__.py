from flask import Flask
from flask_session import Session
import os
from dotenv import load_dotenv
from flask_cors import CORS



def create_app():
    load_dotenv('./.env.local')
    app = Flask(__name__)
    CORS(app)

    from .test import test_routes
    from .navigation import navigation_routes
    from .integrated_routes import integrated_routes


    # Register blueprints for routes and authentication
    app.register_blueprint(test_routes)
    app.register_blueprint(navigation_routes)
    app.register_blueprint(integrated_routes)

    return app
