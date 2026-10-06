const runBtn = document.getElementById('runBtn');
const status = document.getElementById('status');
const result = document.getElementById('result');

const dateOptions = document.getElementById('dateOptions');
const dateFromInput = document.getElementById('dateFrom');
const dateToInput = document.getElementById('dateTo');

const dateModeInputs = document.querySelectorAll(
    'input[name="dateMode"]'
);

// dateModeInputs.forEach(input => {

//     input.addEventListener('change', () => {

//         dateOptions.classList.toggle(
//             'hidden',
//             input.value !== 'custom'
//         );

//     });

// });


function updateDateInputs() {
    const selectedMode = document.querySelector(
        'input[name="dateMode"]:checked'
    ).value;

    const isCustom = selectedMode === 'custom';

    dateFromInput.disabled = !isCustom;
    dateToInput.disabled = !isCustom;

    if (!isCustom) {
        dateFromInput.value = '';
        dateToInput.value = '';
    }
}

dateModeInputs.forEach(input => {
    input.addEventListener('change', updateDateInputs);
});

// Quan trọng: chạy ngay khi trang load
updateDateInputs();

runBtn.addEventListener('click', async () => {

    const searchType = document.querySelector(
        'input[name="searchType"]:checked'
    ).value;

    const keywords = document
        .getElementById('keywords')
        .value
        .split('\n')
        .map(value => value.trim())
        .filter(Boolean);

    const limit = Number(
        document.getElementById('limit').value
    );

    const sortBy = document.querySelector(
        'input[name="sort"]:checked'
    ).value;

    const dateMode = document.querySelector(
        'input[name="dateMode"]:checked'
    ).value;

    let dateFrom;
    let dateTo;

    if (dateMode === 'custom') {

        dateFrom =
            document.getElementById('dateFrom').value;

        dateTo =
            document.getElementById('dateTo').value;

        if (!dateFrom || !dateTo) {
            alert('Vui lòng chọn ngày bắt đầu và ngày kết thúc.');
            return;
        }

        if (dateFrom > dateTo) {
            alert('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
            return;
        }
    }

    if (keywords.length === 0) {
        alert('Vui lòng nhập ít nhất một keyword.');
        return;
    }

    runBtn.disabled = true;

    status.textContent = 'Đang tìm kiếm...';
    result.innerHTML = '';

    try {

        const response = await fetch('/api/discover', {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                queries: keywords,
                searchType,
                limit,
                sortBy,
                dateFrom,
                dateTo
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || 'Discovery failed'
            );
        }

        status.textContent = 'Hoàn thành!';

        // result.innerHTML = `
        //     <div class="summary">
        //         Tìm thấy
        //         <strong>${data.count}</strong>
        //         videos
        //     </div>
        // `;
        result.innerHTML = `
            <div class="summary">
                Tìm thấy
                <strong>${data.count}</strong>
                videos từ
                <strong>${data.creatorCount}</strong>
                creators
            </div>

            <div class="download-section">
                <div class="download-title">
                    Kết quả
                </div>

                <div class="download-buttons">
                    <a
                        class="download-btn"
                        href="${data.downloads.csv}"
                        download
                    >
                        Tải CSV
                    </a>

                    <a
                        class="download-btn secondary"
                        href="${data.downloads.json}"
                        download
                    >
                        Tải JSON
                    </a>
                </div>
            </div>
        `;

    } catch (error) {

        console.error(error);

        status.textContent =
            `Lỗi: ${error.message}`;

    } finally {

        runBtn.disabled = false;

    }
});
