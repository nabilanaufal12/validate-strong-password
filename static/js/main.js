document.addEventListener('DOMContentLoaded', () => {

    // ===========================================
    // 1. Inisialisasi Elemen UI
    // ===========================================
    const form = document.getElementById('tm-form');
    const passwordInput = document.getElementById('input-string'); // Sesuaikan dengan ID di HTML baru
    const logArea = document.getElementById('log-area');
    const tapeContainer = document.getElementById('tape-container');
    const resultMessageContainer = document.getElementById('result-message-container');
    const resultMessage = document.getElementById('result-message');
    const resetButton = document.getElementById('reset-button');

    // Overlay Elements untuk Animasi Feedback
    const overlayAccept = document.getElementById('result-accepted');
    const overlayReject = document.getElementById('result-rejected');

    // Cek apakah elemen penting ada untuk menghindari error
    if (!form || !passwordInput || !logArea || !tapeContainer) {
        console.error('Elemen UI penting tidak ditemukan. Pastikan ID di HTML sesuai.');
        return;
    }

    // ===========================================
    // 2. Fungsi Utilitas
    // ===========================================

    // Fungsi untuk menampilkan overlay feedback animasi
    function showFeedback(type) {
        const overlay = (type === 'accepted') ? overlayAccept : overlayReject;
        
        if (overlay) {
            overlay.classList.add('show');
            
            // Sembunyikan overlay secara otomatis setelah 2.5 detik
            setTimeout(() => {
                overlay.classList.remove('show');
            }, 2500);
        }
    }

    // Fungsi untuk merender Pita (Tape)
    function renderTape(tapeData) {
        tapeContainer.innerHTML = ''; // Bersihkan pita sebelumnya

        // tapeData diharapkan berisi array of characters, dan index head
        // Namun, dari kode backend biasanya kita menerima list state akhir.
        // Untuk visualisasi statis hasil akhir:
        
        const cells = tapeData.cells || []; 
        const headIndex = tapeData.head_position || 0;

        if (cells.length === 0) {
            tapeContainer.innerHTML = '<div class="tape-placeholder">Pita Kosong</div>';
            return;
        }

        cells.forEach((symbol, index) => {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'tape-cell';
            
            // Jika simbol adalah blank (misal '_'), ganti dengan 'B' atau spasi untuk visual
            cellDiv.textContent = (symbol === '_' || symbol === ' ') ? 'B' : symbol;

            // Tandai posisi head
            if (index === headIndex) {
                cellDiv.classList.add('current');
            }

            tapeContainer.appendChild(cellDiv);
        });

        // Auto-scroll pita agar head terlihat di tengah (opsional)
        const activeCell = tapeContainer.querySelector('.tape-cell.current');
        if (activeCell) {
            activeCell.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }

    // ===========================================
    // 3. Event Listeners
    // ===========================================

    // Handle Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = passwordInput.value.trim();

        if (!password) {
            alert("Mohon masukkan password terlebih dahulu.");
            return;
        }

        // State Loading
        const btnSubmit = form.querySelector('button[type="submit"]');
        const originalBtnText = btnSubmit.textContent;
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Memproses...';
        
        // Reset tampilan sementara
        logArea.textContent = 'Memulai validasi mesin turing...\n';
        resultMessage.textContent = 'Sedang memproses...';
        resultMessage.style.color = 'var(--text-secondary)';
        tapeContainer.innerHTML = '';

        try {
            // Kirim request ke backend
            // Menggunakan FormData agar sesuai dengan request.form di Flask
            const formData = new FormData(form);

            const response = await fetch('/run', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // --- Update UI dengan Data Respons ---

            // 1. Update Log Area (Jejak Eksekusi)
            // Jika backend mengirim log sebagai array, kita join. Jika string, langsung pakai.
            if (Array.isArray(data.log)) {
                logArea.textContent = data.log.join('\n');
            } else {
                logArea.textContent = data.log;
            }
            // Auto scroll ke bawah log
            logArea.scrollTop = logArea.scrollHeight;

            // 2. Update Pita (Visualisasi Akhir)
            // Asumsi backend mengirim struktur: { tape: "string_tape", head: index }
            // Kita ubah string menjadi array untuk fungsi renderTape
            const tapeCells = data.tape.split(''); 
            // Jika backend tidak mengirim posisi head akhir, default ke akhir string
            const headPos = data.head_position !== undefined ? data.head_position : tapeCells.length - 1;
            
            renderTape({
                cells: tapeCells,
                head_position: headPos
            });

            // 3. Update Hasil dan Animasi
            const resultText = data.result; // "DITERIMA" atau "DITOLAK"
            resultMessage.textContent = `Status Akhir: ${resultText}`;

            if (resultText === 'DITERIMA') {
                resultMessage.style.color = 'var(--green-accept)';
                showFeedback('accepted');
            } else {
                resultMessage.style.color = 'var(--red-reject)';
                showFeedback('rejected');
            }

        } catch (error) {
            console.error('Error:', error);
            logArea.textContent += `\n[SISTEM ERROR]: ${error.message}`;
            resultMessage.textContent = 'Terjadi kesalahan sistem.';
            resultMessage.style.color = 'var(--red-reject)';
        } finally {
            // Kembalikan tombol ke kondisi semula
            btnSubmit.disabled = false;
            btnSubmit.textContent = originalBtnText;
        }
    });

    // Handle Tombol Reset
    resetButton.addEventListener('click', () => {
        // Reset Form
        passwordInput.value = '';
        
        // Reset Log
        logArea.textContent = '';
        
        // Reset Pita
        tapeContainer.innerHTML = '';
        
        // Reset Pesan Hasil
        resultMessage.textContent = 'Masukkan password dan jalankan untuk melihat hasil.';
        resultMessage.style.color = 'var(--text-primary)'; // Kembali ke warna default
    });

    // (Opsional) Focus ke input saat halaman dimuat
    passwordInput.focus();
});