document.addEventListener('DOMContentLoaded', () => {

    // ===========================================
    // 1. Logika Panel Nama Kelompok
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
    // 2. Logika Inti Simulator Mesin Turing
    // ===========================================
    const form = document.getElementById('tm-form');
    const passwordInput = document.getElementById('password');
    const logContent = document.getElementById('log-content');
    const tapeContainer = document.getElementById('tape-container');
    const statusText = document.getElementById('status-text');
    const resultText = document.getElementById('result-text');

    // Pastikan semua elemen penting ada
    if (!form || !passwordInput || !logContent || !tapeContainer || !statusText || !resultText) {
        console.error('Error: Elemen UI penting tidak ditemukan. Periksa ID di index.html.');
        return;
    }

    // Listener untuk form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Mencegah form me-reload halaman

        const password = passwordInput.value;

        // Tampilkan status loading
        statusText.textContent = 'Menjalankan...';
        resultText.textContent = '-';
        resultText.className = ''; // Hapus kelas .accepted / .rejected
        logContent.textContent = 'Memulai eksekusi...';
        tapeContainer.innerHTML = ''; // Kosongkan pita

        try {
            // Kirim data ke backend Flask
            const response = await fetch('/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: password })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // 3. Update UI dengan data dari backend

            // Update Jejak Eksekusi (Log)
            logContent.textContent = data.log.join('\n');

            // Update Status
            statusText.textContent = data.status;

            // Update Hasil
            resultText.textContent = data.result;
            resultText.classList.remove('accepted', 'rejected'); // Hapus kelas lama
            if (data.result === 'DITERIMA') {
                resultText.classList.add('accepted');
            } else {
                resultText.classList.add('rejected');
            }

            // Update Visualisasi Pita
            tapeContainer.innerHTML = ''; // Pastikan kosong
            data.tape.cells.forEach((cell, index) => {
                const cellDiv = document.createElement('div');
                cellDiv.className = 'tape-cell';

                // Gunakan 'B' untuk simbol blank
                cellDiv.textContent = cell === null ? 'B' : cell;

                if (index === data.tape.head) {
                    cellDiv.classList.add('active');
                    cellDiv.id = 'head'; // Tandai posisi head
                }
                if (cell === null) {
                    cellDiv.classList.add('header'); // Beri gaya untuk sel blank
                }
                tapeContainer.appendChild(cellDiv);
            });

        } catch (error) {
            console.error('Fetch error:', error);
            statusText.textContent = 'Error';
            resultText.textContent = 'Gagal terhubung ke server.';
            resultText.classList.add('rejected');
        }
    });
});