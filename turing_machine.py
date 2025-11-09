# turing_machine.py

class TuringMachine:
    def __init__(self, rules):
        self.states = set(rules['states'])
        self.alphabet = set(rules['alphabet'])
        self.tape_alphabet = set(rules['tape_alphabet'])
        self.transitions = rules['transitions']
        self.start_state = rules['start_state']
        self.accept_state = rules['accept_state']
        self.reject_state = rules['reject_state']
        self.blank_symbol = rules.get('blank_symbol', '_')
        
        self.tape = []
        self.head = 0
        self.current_state = ''
        self.trace = []
        self.step_count = 0

    def initialize(self, input_string):
        self.head = 1
        self.current_state = self.start_state
        self.trace = []
        self.step_count = 0

        input_tape = list(input_string) if input_string else [self.blank_symbol]
        self.tape = [self.blank_symbol] + input_tape + [self.blank_symbol] * 100
        
        self._log_trace('Inisialisasi')

    def is_halting_state(self):
        return self.current_state == self.accept_state or self.current_state == self.reject_state

    def get_trace(self):
        return self.trace

    def step(self):
        if self.is_halting_state():
            return

        self.step_count += 1
        if self.step_count > 1000:
            self.current_state = self.reject_state
            self._log_trace('Error: Simulasi melebihi 1000 langkah (Infinite Loop?). Ditolak.')
            return

        current_symbol = self.tape[self.head]

        rule = self.transitions.get(self.current_state, {}).get(current_symbol)

        if not rule:
            self.current_state = self.reject_state
            self._log_trace(f'Transisi tidak ditemukan untuk ({self.current_state}, {current_symbol}), pindah ke REJECT')
            return

        [new_state, write_symbol, move_direction] = rule
        
        self._log_trace(f'δ({self.current_state}, {current_symbol}) → ({new_state}, {write_symbol}, {move_direction})')

        self.tape[self.head] = write_symbol
        
        if move_direction == 'R':
            self.head += 1
        elif move_direction == 'L':
            self.head = max(0, self.head - 1)

        self.current_state = new_state

    def _log_trace(self, note):
        start = max(0, self.head - 5)
        end = min(len(self.tape), self.head + 20)
        
        tape_str_list = []
        for i in range(start, end):
            if i == self.head:
                tape_str_list.append(f'[{self.tape[i]}]')
            else:
                tape_str_list.append(f' {self.tape[i]} ')
        
        tape_str = "".join(tape_str_list)
        if start > 0: tape_str = '... ' + tape_str
        if end < len(self.tape): tape_str += ' ...'

        self.trace.append({
            "note": f'State: {self.current_state:<10} | {note}',
            "tape_str": f'Tape : {tape_str}\n',
            "current_state": self.current_state,
            "tape": self.tape[:30], # Kirim snapshot pita untuk UI
            "head": self.head
        })

    def run(self):
        self.initialize(self.input_string)
        
        while not self.is_halting_state():
            self.step()
        
        is_accepted = self.current_state == self.accept_state
        self._log_trace(f'Status Akhir: {self.current_state}')
        
        return {
            "accepted": is_accepted,
            "trace": self.get_trace()
        }