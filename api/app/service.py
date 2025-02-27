from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from dotenv import load_dotenv
import os

load_dotenv('../../.env')

app = Flask(__name__)
CORS(app)

API_USER = os.getenv('API_USER')
CONCORDIA_API_KEY = os.getenv('CONCORDIA_API_KEY')

@app.route('/api/buildinglist', methods=['GET'])
def get_building_list():
    try:
        print('Fetching building list from Concordia API...')
        response = requests.get(
            'https://opendata.concordia.ca/API/v1/facilities/buildinglist/',
            auth=(API_USER, CONCORDIA_API_KEY),
            headers={'Accept': 'application/json'}
        )

        print('API response received:', response.status_code)
        return jsonify(response.json()), response.status_code

    except requests.exceptions.RequestException as e:
        if hasattr(e.response, 'status_code'):
            print('API responded with error:', e.response.status_code, e.response.text)
            return jsonify({'error': e.response.text}), e.response.status_code
        else:
            print('Error:', str(e))
            return jsonify({'error': 'Failed to fetch building list'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3001, host='0.0.0.0')