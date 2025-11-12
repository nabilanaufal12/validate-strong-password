from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from turing_machine import TuringMachine

# --- INI PERBAIKANNYA ---
# Kita mengimpor DICTIONARY-nya, bukan fungsi yang tidak ada
from password_rules import password_rules_dict
# --- AKHIR PERBAIKAN ---

app = Flask(__name__)
CORS(app)  # Izinkan CORS untuk seluruh aplikasi

# Inisialisasi Mesin Turing satu kali
try:
    # --- INI PERBAIKANNYA ---
    # Gunakan dictionary yang sudah diimpor
    tm_rules = password_rules_dict
    # --- AKHIR PERBAIKAN ---

    turing_machine = TuringMachine(tm_rules)
    print("Mesin Turing berhasil dimuat dengan aturan.")
except Exception as e:
    print(f"Gagal memuat aturan Mesin Turing: {e}")
    turing_machine = None

@app.route('/')
def index():
    """Menyajikan halaman utama simulator."""
    return render_template('index.html')

@app.route('/run', methods=['POST'])
def run_simulation():
    """Menjalankan simulasi Mesin Turing."""
    if turing_machine is None:
        return jsonify({"error": "Mesin Turing tidak terinisialisasi."}), 500

    try:
        # Ambil data JSON yang dikirim oleh JavaScript
        data = request.get_json()
        if not data or 'password' not in data:
            return jsonify({"error": "Password tidak ditemukan dalam request."}), 400

        password = data.get('password')

        # Reset dan jalankan Mesin Turing
        turing_machine.reset() # Pastikan mesin di-reset sebelum setiap run
        log, result, tape_history = turing_machine.run(password)

        # Dapatkan status akhir
        final_tape, final_head, final_status = turing_machine.get_final_state()

        # Format data persis seperti yang diharapkan oleh main.js
        response_data = {
            "log": log,
            "status": final_status,
            "result": "DITERIMA" if result else "DITOLAK",
            "tape": {
                "cells": final_tape,
                "head": final_head
            }
        }

        return jsonify(response_data)

    except Exception as e:
        print(f"Error selama simulasi: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)