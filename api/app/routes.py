from flask import Blueprint, request, jsonify
from ..chat import handle_task_query, is_task_query

api = Blueprint('api', __name__)

@api.route('/chat/tasks', methods=['POST'])
def process_task_chat():
    try:
        data = request.json
        query = data.get('query')
        tasks = data.get('tasks', [])
        
        if not is_task_query(query):
            return jsonify({
                'response': "I can help you with your tasks! Try asking about your tasks or deadlines."
            })
        
        # Process the query with tasks context
        response = handle_task_query(query, tasks)
        
        return jsonify({
            'response': response
        })
    except Exception as e:
        print(f"Error processing chat: {str(e)}")  # Debug print
        return jsonify({
            'error': str(e)
        }), 500

@api.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}) 