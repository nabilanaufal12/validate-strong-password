from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
# Import file-file logika Python Anda
from turing_machine import TuringMachine
from password_rules import password_rules_dict 

app = Flask(__name__)
CORS(app) 

@app.route('/')
def index():
    """Menampilkan halaman utama."""
    return render_template('index.html')

@app.route('/run', methods=['POST'])
def run_simulation():
    """Menjalankan simulasi Turing Machine."""
    try:
        # 1. Ambil data dari 'FormData' (bukan JSON)
        # Nama 'input_string' harus sesuai dengan atribut 'name' di HTML
        password = request.form.get('input_string')

        if password is None:
            return jsonify({"error": "Data 'input_string' tidak ditemukan."}), 400

        # 2. Buat instance Mesin Turing BARU untuk setiap request.
        # Kita teruskan 'password' ke constructor dan 'rules' dari file Anda.
        tm = TuringMachine(input_string=password, rules=password_rules_dict)
        
        # 3. Jalankan simulasi.
        # Metode run() di turing_machine.py Anda sudah mengembalikan dict hasil.
        result_data = tm.run()

        # 4. Kembalikan hasil sebagai JSON ke frontend.
        return jsonify(result_data)

    except Exception as e:
        print(f"Terjadi Error di Server: {e}")
        return jsonify({
            'result': 'ERROR',
            'log': [f"System Error: {str(e)}"],
            'tape': password if password else "B",
            'head_position': 0
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)