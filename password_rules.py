# password_rules.py

lowercase = list('abcdefghijklmnopqrstuvwxyz')
uppercase = list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
numbers = list('0123456789')
specials = list('!@#$%^&*')

alphabet = lowercase + uppercase + numbers + specials

BLANK = '_'
LWR = 'l'
UPR = 'u'
NUM = 'n'
SPC = 's'

tape_alphabet = alphabet + [BLANK, LWR, UPR, NUM, SPC]

states = [
    'q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7',
    'q_len_ok', 'q_rewind_lower', 'q_find_lower',
    'q_rewind_upper', 'q_find_upper',
    'q_rewind_num', 'q_find_num',
    'q_rewind_spec', 'q_find_spec',
    'q_accept', 'q_reject'
]

start_state = 'q0'
accept_state = 'q_accept'
reject_state = 'q_reject'

transitions = {state: {} for state in states}

# --- Helper Functions ---
def add_find_transitions(char_set, from_state, to_state, write_symbol):
    for char in char_set:
        transitions[from_state][char] = [to_state, write_symbol, 'R']

def add_skip_transitions(char_sets, state):
    for char_set in char_sets:
        for char in char_set:
            transitions[state][char] = [state, char, 'R']

def add_rewind_transitions(all_symbols, from_state, to_state):
    for char in all_symbols:
        transitions[from_state][char] = [from_state, char, 'L']
    transitions[from_state][BLANK] = [to_state, BLANK, 'R']

# --- TAHAP 1: Cek Panjang (>= 8) ---
length_check_states = ['q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7']
for i, current_state in enumerate(length_check_states):
    next_state = 'q_len_ok' if i == len(length_check_states) - 1 else length_check_states[i + 1]
    transitions[current_state][BLANK] = [reject_state, BLANK, 'S']
    for char in alphabet:
        transitions[current_state][char] = [next_state, char, 'R']

for char in alphabet:
    transitions['q_len_ok'][char] = ['q_len_ok', char, 'R']
transitions['q_len_ok'][BLANK] = ['q_rewind_lower', BLANK, 'L']

# --- TAHAP 2: Cari Lowercase ---
add_rewind_transitions(alphabet + [UPR, NUM, SPC], 'q_rewind_lower', 'q_find_lower')
add_find_transitions(lowercase, 'q_find_lower', 'q_rewind_upper', LWR)
add_skip_transitions([uppercase, numbers, specials, [UPR, NUM, SPC]], 'q_find_lower')
transitions['q_find_lower'][BLANK] = [reject_state, BLANK, 'S']

# --- TAHAP 3: Cari Uppercase ---
add_rewind_transitions(alphabet + [LWR, NUM, SPC], 'q_rewind_upper', 'q_find_upper')
add_find_transitions(uppercase, 'q_find_upper', 'q_rewind_num', UPR)
add_skip_transitions([lowercase, numbers, specials, [LWR, NUM, SPC]], 'q_find_upper')
transitions['q_find_upper'][BLANK] = [reject_state, BLANK, 'S']

# --- TAHAP 4: Cari Angka ---
add_rewind_transitions(alphabet + [LWR, UPR, SPC], 'q_rewind_num', 'q_find_num')
add_find_transitions(numbers, 'q_find_num', 'q_rewind_spec', NUM)
add_skip_transitions([lowercase, uppercase, specials, [LWR, UPR, SPC]], 'q_find_num')
transitions['q_find_num'][BLANK] = [reject_state, BLANK, 'S']

# --- TAHAP 5: Cari Simbol Spesial ---
add_rewind_transitions(alphabet + [LWR, UPR, NUM], 'q_rewind_spec', 'q_find_spec')
add_find_transitions(specials, 'q_find_spec', accept_state, SPC) # --> ACCEPT!
add_skip_transitions([lowercase, uppercase, numbers, [LWR, UPR, NUM]], 'q_find_spec')
transitions['q_find_spec'][BLANK] = [reject_state, BLANK, 'S']

# --- Ekspor Aturan ---
password_rules_dict = {
    "states": states,
    "alphabet": alphabet,
    "tape_alphabet": tape_alphabet,
    "transitions": transitions,
    "start_state": start_state,
    "accept_state": accept_state,
    "reject_state": reject_state,
    "blankSymbol": BLANK
}