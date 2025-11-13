Cyberpunk Turing Machine Validator

Simulator validasi password berbasis Mesin Turing, dibalut dengan antarmuka visual bergaya Cyberpunk / Hacker Terminal. Proyek ini dibuat untuk mata kuliah Teori Bahasa dan Otomata.

(Disarankan: Ganti placeholder di atas dengan screenshot atau GIF dari aplikasi Anda)

🚀 Tentang Proyek

Proyek ini adalah implementasi web dari Mesin Turing (Turing Machine) yang dirancang khusus untuk memvalidasi kriteria strong password. Ini bukan sekadar backend checker, melainkan simulator visual penuh yang mengekspos cara kerja Mesin Turing secara fundamental.

Pengguna dapat memasukkan string, dan aplikasi akan memvisualisasikan pergerakan head pada infinite tape serta transisi state ($\delta$) yang terjadi langkah-demi-langkah, semuanya disajikan dalam antarmuka Hacker/Cyberpunk yang imersif.

☣️ Fitur Utama

Visualisasi Pita (Tape) Real-time: Lihat pergerakan head dan perubahan simbol pada pita secara live-animated saat mesin memproses input.

Log Eksekusi Step-by-Step: Sebuah panel terminal yang mencatat setiap transisi state ($\delta$), simbol yang dibaca, simbol yang ditulis, dan arah pergerakan.

Aturan Validasi "Strong Password": Mesin Turing ini secara formal memvalidasi kriteria berikut:

Panjang minimum (≥ 8 karakter)

Setidaknya mengandung satu huruf kecil (a-z)

Setidaknya mengandung satu huruf besar (A-Z)

Setidaknya mengandung satu angka (0-9)

Setidaknya mengandung satu simbol spesial (!, @, #, dll.)

Antarmuka Cyberpunk: Estetika Glassmorphism (efek kaca) dan Neon (efek cahaya), dilengkapi dengan sound effect retro untuk pengalaman yang imersif.

🛠️ Teknologi yang Digunakan

Backend:

Python 3

Flask: Sebagai micro-framework web server.

Flask-CORS: Untuk menangani Cross-Origin Resource Sharing.

Frontend:

HTML5: Struktur semantik untuk UI.

CSS3: Styling kustom (Glassmorphism, Neon FX, Flexbox/Grid).

Vanilla JavaScript (ES6+): Untuk menangani logika DOM, animasi, dan fetch API.

⚙️ Instalasi & Menjalankan

Untuk menjalankan simulator ini di mesin lokal Anda, ikuti langkah-langkah berikut.

Clone Repositori

git clone [https://github.com/username/repo-name.git](https://github.com/username/repo-name.git)
cd repo-name


Buat dan Aktifkan Virtual Environment
(Sangat disarankan untuk menjaga dependensi proyek tetap terisolasi)

# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate


Install Dependensi
Proyek ini membutuhkan Flask dan Flask-CORS.

pip install -r requirements.txt


(Jika file requirements.txt tidak ada, install manual):

pip install Flask Flask-CORS


Jalankan Aplikasi Flask
Server pengembangan akan dimulai.

python app.py


Akses Aplikasi
Buka browser Anda dan navigasi ke http://127.0.0.1:5000

Proyek ini dikembangkan sebagai bagian dari studi Teori Bahasa dan Otomata.