from flask import Flask, request, jsonify
from flask_cors import CORS
from data_loader import setup_mongodb
from query_generator import load_prompt_template, setup_langchain, generate_and_execute_query
from utils import get_dashboard_data
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Inicialización
collection = setup_mongodb()
prompt = load_prompt_template()
chain = setup_langchain(prompt)

@app.route('/api/dashboard', methods=['GET'])
def dashboard():
    try:
        data = get_dashboard_data(collection)
        return jsonify(data)
    except Exception as e:
        print(f"Error fetching dashboard data: {str(e)}")
        return jsonify({"error": "Failed to fetch dashboard data"}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    user_message = request.json['message']
    print(f"Received message: {user_message}")
    try:
        results = generate_and_execute_query(chain, user_message, collection)
        print(f"Query results: {results}")
        if results:
            response = str(results)  # Convert results to string for display
        else:
            response = "No results found or an error occurred."
        print(f"Sending response: {response}")
        return jsonify({"response": response})
    except Exception as e:
        print(f"Error in chat function: {str(e)}")
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)