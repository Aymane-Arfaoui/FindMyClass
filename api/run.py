from flask import Flask
from flask_cors import CORS
from app.navigation import navigation_routes
from chat import chat_routes

app = Flask(__name__)
# Apply CORS globally to all routes
CORS(app, resources={r"/*": {"origins": "*"}})

# Register blueprints
app.register_blueprint(navigation_routes)
app.register_blueprint(chat_routes)

if __name__ == '__main__':
    print("Starting Flask server on http://127.0.0.1:5001")
    app.run(debug=True, host='0.0.0.0', port=5001)