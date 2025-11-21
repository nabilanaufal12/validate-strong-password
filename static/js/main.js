document.addEventListener('DOMContentLoaded', () => {

    // ===========================================
    // 0. Audio Context (Sound Effect: Retro Beep)
    // ===========================================
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playCyberSound() {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // Tipe suara 'square' untuk nuansa 8-bit / komputer jadul
        oscillator.type = 'square';
        // Frekuensi mulai tinggi lalu turun cepat (efek "tik")
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.05);

        // Volume envelope (fade out cepat)
        gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.05);
    }

    // ===========================================
    // 1. Inisialisasi Elemen UI
    // ===========================================
    const form = document.getElementById('tm-form');
    const passwordInput = document.getElementById('input-string');
    const logArea = document.getElementById('log-area');
    const tapeContainer = document.getElementById('tape-container');
    const resultMessage = document.getElementById('result-message');
    const resetButton = document.getElementById('reset-button');
    const btnSubmit = form ? form.querySelector('button[type="submit"]') : null;

    // Panel Info Kelompok
    const panel = document.getElementById('group-panel');
    const openButton = document.getElementById('group-panel-toggle');
    const closeButton = document.getElementById('group-panel-close');
    
    if (panel && openButton && closeButton) {
        openButton.addEventListener('click', () => panel.classList.add('is-open'));
        closeButton.addEventListener('click', () => panel.classList.remove('is-open'));
    }

    // Overlay Feedback (Animasi layar penuh)
    const overlayAccept = document.getElementById('result-accepted');
    const overlayReject = document.getElementById('result-rejected');

    // Variabel global untuk interval animasi
    let animationInterval = null;

    // ===========================================
    // 2. Fungsi Visualisasi Pita (Render Tape)
    // ===========================================

    function renderTape(tapeData) {
        tapeContainer.innerHTML = '';
        
        let cells = [];
        let headIndex = 0;

        // Normalisasi data: backend mungkin mengirim string atau array
        if (typeof tapeData.tape === 'string') {
            cells = tapeData.tape.split('');
            headIndex = tapeData.head_position || 0;
        } else if (Array.isArray(tapeData.cells)) {
            cells = tapeData.cells;
            headIndex = tapeData.head_position || 0;
        } else {
             tapeContainer.innerHTML = '<div class="tape-placeholder">DATA CORRUPT</div>';
             return;
        }

        if (cells.length === 0) {
            tapeContainer.innerHTML = '<div class="tape-placeholder">SYSTEM STANDBY</div>';
            return;
        }

        // --- Visual Padding Logic ---
        // Menambahkan kotak kosong (B) di kiri/kanan agar Head selalu terlihat di tengah
        const PADDING_SIZE = 10; 
        let paddedCells = [...cells];
        let adjustedHeadIndex = headIndex;

        // Padding Kiri
        const leftPadding = Math.max(0, PADDING_SIZE - headIndex);
        for(let i=0; i < leftPadding; i++) {
            paddedCells.unshift('B');
            adjustedHeadIndex++;
        }
 
        // Padding Kanan
        const rightPadding = Math.max(0, PADDING_SIZE - (cells.length - 1 - headIndex));
         for(let i=0; i < rightPadding; i++) {
            paddedCells.push('B');
        }

        // Render setiap sel
        paddedCells.forEach((symbol, index) => {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'tape-cell';
            
            // Cek apakah simbol adalah Blank ('_' atau 'B' atau spasi)
            const isBlank = (symbol === '_' || symbol === 'B' || symbol === ' ');

            // Jika blank, kosongkan textContent agar visualnya bersih
            // Jika bukan, tampilkan karakter aslinya
            cellDiv.textContent = isBlank ? '' : symbol;
            
            // Opsional: Beri sedikit opacity pada kotak kosong
            if(isBlank) {
                cellDiv.style.opacity = "0.5"; 
            }

            // Highlight posisi Head saat ini
            if (index === adjustedHeadIndex) {
                cellDiv.classList.add('current');
            }

            tapeContainer.appendChild(cellDiv);
        });

        // Auto Scroll agar sel aktif (Head) selalu di tengah container
        const activeCell = tapeContainer.querySelector('.tape-cell.current');
        if (activeCell) {
            activeCell.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
        }
    }

    // ===========================================
    // 3. Logika Animasi & Parsing Log
    // ===========================================

    // Helper: Mengambil data pita dari teks log baris "TAPE   : ... a [b] c ..."
    function parseTapeFromLogLine(logLine) {
        // Cari baris yang dimulai dengan "   TAPE   :"
        const match = logLine.match(/TAPE\s+:\s+(.*)/);
        if (!match) return null;

        // Bersihkan string: hapus "..." dan spasi berlebih
        let rawContent = match[1].replace(/\.\.\./g, " ").trim();
        
        // Pecah menjadi array berdasarkan spasi
        const tokens = rawContent.split(/\s+/);
        
        let cells = [];
        let headPos = 0;

        // Cari token yang dibungkus kurung siku, misal "[a]" yang menandakan head
        tokens.forEach((token) => {
            if (!token) return;
            
            if (token.startsWith('[') && token.endsWith(']')) {
                // Ini adalah posisi Head
                headPos = cells.length;
                cells.push(token.slice(1, -1)); // Ambil char di dalamnya
            } else {
                cells.push(token);
            }
        });

        return { cells: cells, head_position: headPos };
    }

    function animateProcessing(data) {
        const logs = data.log; 
        let step = 0;
        const totalSteps = logs.length;
        
        // Reset Log UI
        logArea.textContent = "INITIALIZING VALIDATION PROTOCOLS...\n";
        
        // Kecepatan Animasi (semakin kecil angka, semakin cepat)
        const stepDelay = 100; 

        animationInterval = setInterval(() => {
            // Cek apakah animasi selesai
            if (step >= totalSteps) {
                clearInterval(animationInterval);
                finishAnimation(data);
                return;
            }

            const currentLog = logs[step];
            
            // 1. Update Terminal Log (tambah baris)
            logArea.textContent += currentLog + "\n";
            logArea.scrollTop = logArea.scrollHeight;

            // 2. Update Animasi Pita (Parsing dari string log)
            const tapeSnapshot = parseTapeFromLogLine(currentLog);
            if (tapeSnapshot) {
                renderTape(tapeSnapshot);
            }

            // 3. Mainkan Efek Suara
            playCyberSound();

            step++;
        }, stepDelay);
    }

    function finishAnimation(data) {
        // Tampilkan Pita Hasil Akhir yang lengkap dari backend
        renderTape({ tape: data.tape, head_position: data.head_position });

        // Tampilkan Status Akhir (Diterima/Ditolak)
        const resultText = data.result; 
        resultMessage.textContent = `STATUS: ${resultText}`;
        resultMessage.className = ''; // Reset class

        const overlay = (resultText === 'DITERIMA') ? overlayAccept : overlayReject;
        
        if (resultText === 'DITERIMA') {
            resultMessage.classList.add('accepted');
            logArea.textContent += "\n>>> ACCESS GRANTED. PASSWORD IS STRONG.";
        } else {
            resultMessage.classList.add('rejected');
            logArea.textContent += "\n>>> ACCESS DENIED. PASSWORD WEAK.";
        }
        
        // Tampilkan Overlay layar penuh sebentar
        if (overlay) {
            overlay.classList.add('show');
            setTimeout(() => overlay.classList.remove('show'), 2500);
        }

        logArea.scrollTop = logArea.scrollHeight;
        
        // Aktifkan kembali tombol submit
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '> RUN_SIMULATION';
        }
    }

    // ===========================================
    // 4. Event Listener Submit Form
    // ===========================================

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Hentikan animasi lama jika ada
            if (animationInterval) clearInterval(animationInterval);
            
            // UI Loading State
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = '&gt; PROCESSING...';
            }
            
            logArea.textContent = 'CONNECTING TO TURING CORE...\n';
            resultMessage.textContent = 'MENGANALISIS...';
            resultMessage.className = '';
            tapeContainer.innerHTML = '<div class="tape-placeholder">LOADING DATA...</div>';

            try {
                const formData = new FormData(form);

                // Request ke Python Backend
                const response = await fetch('/run', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || `Server Error: ${response.status}`);
                }
                
                // Jalankan Animasi
                animateProcessing(data);

            } catch (error) {
                console.error('Error:', error);
                logArea.textContent += `\n[CRITICAL FAILURE]: ${error.message}`;
                resultMessage.textContent = 'SYSTEM FAILURE';
                resultMessage.classList.add('rejected');
                
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '> RUN_SIMULATION';
                }
            }
        });
    }

    // ===========================================
    // 5. Tombol Reset
    // ===========================================
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (animationInterval) clearInterval(animationInterval);
            passwordInput.value = '';
            logArea.textContent = 'WAITING FOR PROCESS...';
            tapeContainer.innerHTML = '<div class="tape-placeholder">SYSTEM STANDBY</div>';
            resultMessage.textContent = 'STATUS: MENUNGGU INPUT...';
            resultMessage.className = '';
            
            // Reset checklist syarat visual
            document.querySelectorAll('.req-list li').forEach(li => {
                li.classList.remove('valid', 'invalid');
                const icon = li.querySelector('.status-icon');
                if(icon) icon.textContent = '[ ]';
            });

            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '> RUN_SIMULATION';
            }
            passwordInput.focus();
        });
    }

    // ===========================================
    // 6. Client-Side Realtime Requirement Check
    // ===========================================
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            const val = e.target.value;

            // Helper function untuk update tampilan checklist
            const updateReq = (id, isValid) => {
                const el = document.getElementById(id);
                if (!el) return;
                
                const icon = el.querySelector('.status-icon');
                if (isValid) {
                    el.classList.add('valid');
                    el.classList.remove('invalid');
                    if(icon) icon.textContent = '[x]';
                } else {
                    el.classList.remove('valid');
                    // el.classList.add('invalid'); // Opsional, aktifkan jika ingin merah saat salah
                    if(icon) icon.textContent = '[ ]';
                }
            };

            // Regex Validasi (Sesuai dengan aturan Python)
            // 1. Panjang >= 8
            updateReq('req-length', val.length >= 8);

            // 2. Huruf Kecil (a-z)
            updateReq('req-lower', /[a-z]/.test(val));

            // 3. Huruf Besar (A-Z)
            updateReq('req-upper', /[A-Z]/.test(val));

            // 4. Angka (0-9)
            updateReq('req-number', /[0-9]/.test(val));

            // 5. Simbol Spesial
            // List simbol ini harus sinkron dengan password_rules.py
            updateReq('req-special', /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/`~]/.test(val));
        });
        
        // Fokus otomatis saat halaman dimuat
        passwordInput.focus();
    }
});