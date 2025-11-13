class TuringMachine:
    def __init__(self, input_string, rules=None):
        # 1. Setup Input dan Pita
        self.input_string = input_string if input_string else ""
        self.blank_symbol = 'B' # Simbol untuk sel kosong
        
        # Inisialisasi pita dengan input string
        # Kita beri padding blank symbol di kiri dan kanan
        self.tape = list(self.input_string) if self.input_string else [self.blank_symbol]
        self.head = 0
        self.step_count = 0
        self.trace_log = [] # Menyimpan jejak eksekusi untuk UI

        # 2. Setup Rules (Aturan Transisi)
        # Format: 'state_sekarang': {'simbol_baca': ('state_baru', 'tulis_simbol', 'arah')}
        if rules:
            self.transitions = rules
        else:
            # DEFAULT RULES: Validasi Password Sederhana
            # Logika: Scan pita, cari simbol '@'. 
            # Jika ketemu '@' -> terima. Jika habis -> tolak.
            self.transitions = self._get_default_rules()

        self.current_state = 'q0'
        self.accept_state = 'q_accept'
        self.reject_state = 'q_reject'

    def _get_default_rules(self):
        """
        Aturan bawaan: Menerima jika string mengandung karakter '@'.
        Ini hanya contoh logika. Anda bisa menggantinya dengan logika password yang lebih kompleks.
        """
        rules = {
            'q0': {
                # Jika baca karakter apapun selain @, geser Kanan (R)
                **{c: ('q0', c, 'R') for c in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%^&*()_+-=[]{}|;:,.<>?/`~ "},
                # Jika ketemu '@', pindah state ke q_found
                '@': ('q_found', '@', 'R'),
                # Jika ketemu Blank (akhir string) tanpa nemu @, tolak
                'B': ('q_reject', 'B', 'S') 
            },
            'q_found': {
                # Setelah ketemu @, scan sisa string sampai akhir (Blank)
                **{c: ('q_found', c, 'R') for c in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%^&*()_+-=[]{}|;:,.<>?/`~ @"},
                # Jika ketemu Blank, berarti validasi selesai -> TERIMA
                'B': ('q_accept', 'B', 'S')
            }
        }
        return rules

    def _expand_tape(self):
        """
        Mencegah IndexError (Infinite Tape Logic).
        Menambah 'B' jika head bergerak ke luar batas array.
        """
        if self.head < 0:
            self.tape.insert(0, self.blank_symbol)
            self.head = 0 # Head kembali ke index 0 (elemen baru)
        elif self.head >= len(self.tape):
            self.tape.append(self.blank_symbol)

    def _log_step(self, action_desc):
        """
        Membuat format log yang rapi untuk tampilan 'Code Editor' di UI.
        """
        # Buat visualisasi pita (hanya area sekitar head)
        start = max(0, self.head - 10)
        end = min(len(self.tape), self.head + 10)
        tape_segment = ""
        
        for i in range(start, end):
            val = self.tape[i]
            if i == self.head:
                tape_segment += f"[{val}]" # Tandai posisi head
            else:
                tape_segment += f" {val} "
        
        if start > 0: tape_segment = "..." + tape_segment
        if end < len(self.tape): tape_segment += "..."

        # Format string log
        log_entry = (
            f"STEP {self.step_count:03} | {self.current_state:<10} \n"
            f"   ACTION : {action_desc}\n"
            f"   TAPE   : {tape_segment}\n"
            f"{'-'*40}"
        )
        self.trace_log.append(log_entry)

    def step(self):
        """Eksekusi satu langkah"""
        self._expand_tape()
        
        # Cek apakah sudah di state berhenti
        if self.current_state in [self.accept_state, self.reject_state]:
            return False

        # 1. Baca simbol
        current_symbol = self.tape[self.head]

        # 2. Cari aturan transisi
        # Ambil rule berdasarkan state sekarang
        state_rules = self.transitions.get(self.current_state, {})
        
        # Cek apakah ada transisi untuk simbol ini
        # Jika tidak ada spesifik, cek apakah ada wildcard (opsional logic)
        instruction = state_rules.get(current_symbol)

        if instruction:
            new_state, write_symbol, direction = instruction
            
            # Log sebelum berubah
            action_msg = f"Read '{current_symbol}' -> Write '{write_symbol}' -> Move {direction} -> To {new_state}"
            self._log_step(action_msg)

            # 3. Tulis simbol
            self.tape[self.head] = write_symbol

            # 4. Pindah Head
            if direction == 'R':
                self.head += 1
            elif direction == 'L':
                self.head -= 1
            # 'S' atau lainnya berarti diam (Stay)

            # 5. Update State
            self.current_state = new_state
            self.step_count += 1
            return True
        else:
            # Tidak ada transisi yang didefinisikan -> REJECT implicit
            self._log_step(f"No rule for ({self.current_state}, '{current_symbol}'). HALT.")
            self.current_state = self.reject_state
            return False

    def run(self):
        """Jalankan simulasi sampai selesai atau limit tercapai"""
        max_steps = 1000 # Safety break agar tidak infinite loop browser
        
        self._log_step("INITIALIZING TAPE")

        while self.current_state not in [self.accept_state, self.reject_state] and self.step_count < max_steps:
            running = self.step()
            if not running:
                break
        
        # Tentukan hasil akhir teks
        if self.current_state == self.accept_state:
            result_text = "DITERIMA"
        elif self.step_count >= max_steps:
            result_text = "TIMEOUT (Loop?)"
            self.trace_log.append("\n[ERROR] Batas langkah maksimum (1000) terlampaui.")
        else:
            result_text = "DITOLAK"

        # Return struktur data yang diharapkan oleh main.js
        return {
            "result": result_text,
            "status": self.current_state,
            "log": self.trace_log,
            "tape": "".join(self.tape), # Kirim pita penuh sebagai string
            "head_position": self.head
        }