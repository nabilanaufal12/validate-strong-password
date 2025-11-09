// js/main.js (Versi Dinamis)

// --- 1. Dapatkan Referensi ke Elemen HTML ---
const form = document.getElementById('validator-form');
const input = document.getElementById('password-input');
const runButton = document.getElementById('run-button');
const resetButton = document.getElementById('reset-button');
const tapeContainer = document.getElementById('tape-container');
const traceOutput = document.getElementById('trace-output');
const resultDisplay = document.getElementById('result-display');
const currentStateDisplay = document.getElementById('current-state');

// --- 2. Variabel Global ---
let simulationInterval;
const SIMULATION_SPEED_MS = 150;
// Alamat server Python Anda
const API_URL = 'http://127.0.0.1:5000/validate'; 

// --- 3. Tambahkan Event Listeners ---
form.addEventListener('submit', (e) => {
    e.preventDefault();
    runSimulation();
});
resetButton.addEventListener('click', resetUI);

// Helper 'sleep' untuk animasi
const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Fungsi utama untuk MEMULAI simulasi
 */
async function runSimulation() {
    const inputString = input.value;
    resetUI();
    
    runButton.disabled = true;
    input.disabled = true;
    traceOutput.textContent = 'Menghubungi server Python...';

    try {
        // 1. Kirim password ke server Python
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: inputString }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        // 2. Dapatkan hasil simulasi LENGKAP dari server
        const result = await response.json();
        
        // 3. Animasikan hasil (seperti di laporan kating [cite: 952-971])
        traceOutput.textContent = ''; // Bersihkan log
        for (const step of result.trace) {
            updateStepUI(step);
            await sleep(SIMULATION_SPEED_MS);
        }

        // 4. Tampilkan hasil akhir
        displayFinalResult(result.accepted);

    } catch (error) {
        traceOutput.textContent = `Error: Tidak bisa terhubung ke server.\n${error.message}`;
        displayFinalResult(false); // Otomatis reject jika error
    } finally {
        runButton.disabled = false;
        input.disabled = false;
    }
}

/**
 * Memperbarui UI (Pita, State, Jejak) setelah satu langkah
 * 'step' adalah satu objek dari array 'trace' dari server
 */
function updateStepUI(step) {
    traceOutput.textContent += `${step.note}\n${step.tape_str}\n`;
    traceOutput.scrollTop = traceOutput.scrollHeight;
    currentStateDisplay.textContent = step.current_state;
    updateTapeUI(step.tape, step.head);
}

function displayFinalResult(isAccepted) {
    resultDisplay.classList.remove('accept', 'reject');
    if (isAccepted) {
        resultDisplay.textContent = 'DITERIMA';
        resultDisplay.classList.add('accept');
    } else {
        resultDisplay.textContent = 'DITOLAK';
        resultDisplay.classList.add('reject');
    }
    resultDisplay.style.display = 'block';
}

function updateTapeUI(tape, head) {
    tapeContainer.innerHTML = '';
    const viewStart = Math.max(0, head - 10);
    const viewEnd = Math.min(tape.length, head + 20);

    for (let i = viewStart; i < viewEnd; i++) {
        const symbol = tape[i] || '_';
        const cell = document.createElement('div');
        cell.className = 'tape-cell';
        cell.textContent = symbol;
        if (i === head) {
            cell.classList.add('head');
        }
        tapeContainer.appendChild(cell);
    }
}

function resetUI() {
    clearInterval(simulationInterval);
    tapeContainer.innerHTML = '';
    traceOutput.textContent = 'Menunggu input...';
    currentStateDisplay.textContent = '-';
    resultDisplay.style.display = 'none';
    runButton.disabled = false;
    input.disabled = false;
    input.value = '';
}

resetUI();