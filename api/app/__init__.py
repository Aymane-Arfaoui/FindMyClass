from flask import Flask
from flask_session import Session
import os
from dotenv import load_dotenv
from flask_cors import CORS



def create_app():
    load_dotenv()
    app = Flask(__name__)
    CORS(app)
    
    # Configure Flask-Session
    app.config['SESSION_TYPE'] = 'filesystem'
    Session(app)
    
    # Register blueprints
    from .navigation import navigation_routes
    from .integrated_routes import integrated_routes


    # Register blueprints for routes and authentication
    app.register_blueprint(navigation_routes)
    app.register_blueprint(integrated_routes)

    from .routes import api
    
    app.register_blueprint(api)
    
    return app
