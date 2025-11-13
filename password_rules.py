# password_rules.py

# --- 1. Definisi Alfabet (Sesuai PDF Bagian 2) ---
lowercase = list('abcdefghijklmnopqrstuvwxyz')
uppercase = list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
numbers = list('0123456789')
specials = list('!@#$%^&*()_+-=[]{}|;:,.<>?/`~')

# Himpunan input simbol (Sigma)
alphabet = lowercase + uppercase + numbers + specials

# --- 2. Definisi Simbol Pita (Gamma) ---
# Termasuk simbol input, Blank, dan Penanda (markers) yang disebutkan di PDF
BLANK = 'B' 
LWR = 'l' # Penanda lowercase ketemu
UPR = 'u' # Penanda uppercase ketemu
NUM = 'n' # Penanda number ketemu
SPC = 's' # Penanda special ketemu

tape_alphabet = alphabet + [BLANK, LWR, UPR, NUM, SPC]

# --- 3. Definisi State (Sesuai PDF Bagian 1) ---
states = [
    'q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', # Cek Panjang
    'q_len_ok',
    'q_rewind_lower', 'q_find_lower', # Cari Lowercase
    'q_rewind_upper', 'q_find_upper', # Cari Uppercase
    'q_rewind_num', 'q_find_num',     # Cari Angka
    'q_rewind_spec', 'q_find_spec',   # Cari Simbol
    'q_accept', 'q_reject'
]

start_state = 'q0'
accept_state = 'q_accept'
reject_state = 'q_reject'

# Inisialisasi Struktur Transisi
transitions = {state: {} for state in states}

# --- 4. Fungsi Helper untuk Mempermudah Penulisan Transisi ---

def add_rewind_transitions(state_name, next_state_on_blank):
    """Logika Rewind: Gerak Kiri (L) sampai ketemu Blank, lalu Kanan (R)"""
    # Jika baca karakter apapun (alphabet + markers), tetap di state, geser L
    for char in tape_alphabet:
        if char != BLANK:
            transitions[state_name][char] = [state_name, char, 'L']
    # Jika ketemu Blank, pindah ke fase pencarian berikutnya, geser R
    transitions[state_name][BLANK] = [next_state_on_blank, BLANK, 'R']

def add_search_transitions(state_name, target_chars, marker, success_state):
    """Logika Find: Scan Kanan (R). Jika ketemu target -> Tulis Marker -> Pindah State"""
    
    # 1. Jika ketemu target: Tulis marker, Pindah ke state rewind berikutnya (atau accept), Geser R
    for char in target_chars:
        transitions[state_name][char] = [success_state, marker, 'R']
        
    # 2. Jika ketemu karakter lain atau marker yang sudah ada: Skip (tetap di state, geser R)
    # Gabungkan semua simbol yang BUKAN target
    all_skips = [c for c in tape_alphabet if c not in target_chars and c != BLANK]
    for char in all_skips:
        # Jangan menimpa aturan target jika ada duplikasi di list
        if char not in transitions[state_name]:
            transitions[state_name][char] = [state_name, char, 'R']
            
    # 3. Jika ketemu BLANK (habis): Reject (karena target tidak ditemukan)
    transitions[state_name][BLANK] = [reject_state, BLANK, 'S']


# --- 5. Implementasi Tabel Transisi (Sesuai PDF) ---

# === TAHAP 1: Validasi Panjang Minimum 8 Karakter (q0 - q7) ===
length_states = ['q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7']

for i, state in enumerate(length_states):
    # Tentukan state tujuan: q(i+1) atau q_len_ok
    next_state = length_states[i+1] if i < len(length_states) - 1 else 'q_len_ok'
    
    # Jika baca karakter apapun, lanjut ke next_state (hitung +1)
    for char in alphabet:
        transitions[state][char] = [next_state, char, 'R']
        
    # Jika ketemu Blank di tengah jalan (panjang < 8) -> Reject
    transitions[state][BLANK] = [reject_state, BLANK, 'S']

# Di q_len_ok, kita teruskan scan sampai ujung kanan (ketemu Blank) sebelum mulai Rewind pertama
for char in alphabet:
    transitions['q_len_ok'][char] = ['q_len_ok', char, 'R']
transitions['q_len_ok'][BLANK] = ['q_rewind_lower', BLANK, 'L']


# === TAHAP 2: Cari Lowercase ===
# Rewind sampai awal
add_rewind_transitions('q_rewind_lower', 'q_find_lower')
# Cari [a-z]. Jika ketemu, tulis 'l', lanjut ke rewind_upper
add_search_transitions('q_find_lower', lowercase, LWR, 'q_rewind_upper')


# === TAHAP 3: Cari Uppercase ===
# Rewind sampai awal
add_rewind_transitions('q_rewind_upper', 'q_find_upper')
# Cari [A-Z]. Jika ketemu, tulis 'u', lanjut ke rewind_num
add_search_transitions('q_find_upper', uppercase, UPR, 'q_rewind_num')


# === TAHAP 4: Cari Angka ===
# Rewind sampai awal (sesuai snippet PDF: qrewind_num)
add_rewind_transitions('q_rewind_num', 'q_find_num')
# Cari [0-9]. Jika ketemu, tulis 'n', lanjut ke rewind_spec
add_search_transitions('q_find_num', numbers, NUM, 'q_rewind_spec')


# === TAHAP 5: Cari Simbol Spesial ===
# Rewind sampai awal
add_rewind_transitions('q_rewind_spec', 'q_find_spec')
# Cari [sym*]. Jika ketemu, tulis 's', MASUK KE ACCEPT STATE!
add_search_transitions('q_find_spec', specials, SPC, accept_state)


# --- 6. Ekspor Rules ---
# PENTING: Format ini disesuaikan agar langsung bisa dibaca turing_machine.py
password_rules_dict = transitions