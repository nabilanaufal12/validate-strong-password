document.addEventListener('DOMContentLoaded', () => {

    // ===========================================
    // 0. Logika Panel Info Kelompok (BARU)
    // ===========================================
    const panel = document.getElementById('group-panel');
    const openButton = document.getElementById('group-panel-toggle');
    const closeButton = document.getElementById('group-panel-close');
    
    if (panel && openButton && closeButton) {
        openButton.addEventListener('click', () => {
            panel.classList.add('is-open');
        });
        closeButton.addEventListener('click', () => {
            panel.classList.remove('is-open');
        });
    }

    // ===========================================
    // 1. Inisialisasi Elemen UI
    // ===========================================
    const form = document.getElementById('tm-form');
    const passwordInput = document.getElementById('input-string');
    const logArea = document.getElementById('log-area');
    const tapeContainer = document.getElementById('tape-container');
    const resultMessageContainer = document.getElementById('result-message-container');
    const resultMessage = document.getElementById('result-message');
    const resetButton = document.getElementById('reset-button');
    const btnSubmit = form.querySelector('button[type="submit"]');

    // Overlay Elements untuk Animasi Feedback
    const overlayAccept = document.getElementById('result-accepted');
    const overlayReject = document.getElementById('result-rejected');

    if (!form || !passwordInput || !logArea || !tapeContainer || !btnSubmit) {
        console.error('Elemen UI penting tidak ditemukan. Pastikan ID di HTML sesuai.');
        return;
    }

    // ===========================================
    // 2. Fungsi Utilitas
    // ===========================================

    function showFeedback(type) {
        const overlay = (type === 'accepted') ? overlayAccept : overlayReject;
        if (overlay) {
            overlay.classList.add('show');
            setTimeout(() => {
                overlay.classList.remove('show');
            }, 2500);
        }
    }

    function renderTape(tapeData) {
        tapeContainer.innerHTML = '';
        
        // Cek jika tapeData adalah string, ubah jadi object
        let cells = [];
        let headIndex = 0;

        if (typeof tapeData.tape === 'string' && tapeData.head_position !== undefined) {
            // Ini format dari backend (versi baru)
            cells = tapeData.tape.split('');
            headIndex = tapeData.head_position;
        } else if (tapeData.cells && tapeData.head_position !== undefined) {
            // Ini format dari JS (versi lama)
            cells = tapeData.cells;
            headIndex = tapeData.head_position;
        } else {
             tapeContainer.innerHTML = '<div class="tape-placeholder">TAPE: [ERROR_LOAD]...</div>';
             return;
        }

        if (cells.length === 0) {
            tapeContainer.innerHTML = '<div class="tape-placeholder">TAPE: [EMPTY]...</div>';
            return;
        }

        // Tambahkan padding Blank di awal dan akhir untuk visualisasi
        const PADDING_SIZE = 15;
        let paddedCells = [...cells];
        let adjustedHeadIndex = headIndex;

        // Padding kiri
        const leftPadding = Math.max(0, PADDING_SIZE - headIndex);
        for(let i=0; i < leftPadding; i++) {
            paddedCells.unshift('B');
            adjustedHeadIndex++;
        }
 
        // Padding kanan
        const rightPadding = Math.max(0, PADDING_SIZE - (cells.length - 1 - headIndex));
         for(let i=0; i < rightPadding; i++) {
            paddedCells.push('B');
        }

        paddedCells.forEach((symbol, index) => {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'tape-cell';
            
            // Ganti simbol blank (B atau _) dengan visual yang lebih baik
            cellDiv.textContent = (symbol === '_' || symbol === 'B' || symbol === ' ') ? ' ' : symbol;
            if(cellDiv.textContent === ' ') {
                cellDiv.style.opacity = "0.3";
            }

            if (index === adjustedHeadIndex) {
                cellDiv.classList.add('current');
            }

            tapeContainer.appendChild(cellDiv);
        });

        const activeCell = tapeContainer.querySelector('.tape-cell.current');
        if (activeCell) {
            activeCell.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }

    function resetUI() {
        passwordInput.value = '';
        logArea.textContent = '';
        tapeContainer.innerHTML = '<div class="tape-placeholder">TAPE: [STANDBY]... INPUT DIPERLUKAN.</div>';
        resultMessage.textContent = 'STATUS: MENUNGGU INPUT...';
        resultMessage.className = '';
        btnSubmit.disabled = false;
        btnSubmit.textContent = '> RUN_SIMULATION';
    }

    // ===========================================
    // 3. Event Listeners
    // ===========================================

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = passwordInput.value; // Tidak perlu .trim() jika spasi di awal/akhir valid

        // State Loading
        const originalBtnText = btnSubmit.textContent;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '&gt; PROCESSING...';
        
        logArea.textContent = 'Memulai validasi mesin turing...\n';
        resultMessage.textContent = 'Sedang memproses...';
        resultMessage.className = '';
        tapeContainer.innerHTML = '<div class="tape-placeholder">TAPE: [PROCESSING]...</div>';

        try {
            const formData = new FormData(form);

            const response = await fetch('/run', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            // --- Update UI dengan Data Respons ---

            // 1. Update Log
            if (Array.isArray(data.log)) {
                logArea.textContent = data.log.join('\n');
            } else {
                logArea.textContent = data.log;
            }
            logArea.scrollTop = logArea.scrollHeight;

            // 2. Update Pita
            // data.tape (string) dan data.head_position (int)
            renderTape({ tape: data.tape, head_position: data.head_position });

            // 3. Update Hasil
            const resultText = data.result; // "DITERIMA" atau "DITOLAK"
            resultMessage.textContent = `STATUS: ${resultText}`;
            resultMessage.className = ''; // Hapus kelas lama

            if (resultText === 'DITERIMA') {
                resultMessage.classList.add('accepted');
                showFeedback('accepted');
            } else {
                resultMessage.classList.add('rejected');
                showFeedback('rejected');
            }

        } catch (error) {
            console.error('Error:', error);
            logArea.textContent += `\n[SISTEM ERROR]: ${error.message}`;
            resultMessage.textContent = 'Terjadi kesalahan sistem.';
            resultMessage.className = 'rejected';
        } finally {
            // Kembalikan tombol ke kondisi semula
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalBtnText;
        }
    });

    resetButton.addEventListener('click', resetUI);
    passwordInput.focus();
});