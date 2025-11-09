# app.py
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from turing_machine import TuringMachine
from password_rules import password_rules_dict

app = Flask(__name__)
CORS(app) # Izinkan permintaan dari JavaScript

# Route untuk menyajikan index.html
@app.route('/')
def index():
    return render_template('index.html')

# Endpoint API yang akan dipanggil oleh JavaScript
@app.route('/validate', methods=['POST'])
def validate_password():
    data = request.get_json()
    input_string = data.get('password', '')

    tm = TuringMachine(password_rules_dict)
    
    tm.initialize(input_string)
    while not tm.is_halting_state():
        tm.step()

    is_accepted = tm.current_state == tm.accept_state
    
    return jsonify({
        "accepted": is_accepted,
        "trace": tm.get_trace()
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)