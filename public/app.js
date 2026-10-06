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

// ============================================================
// MIN / MAX VALIDATION
// ============================================================

function setupRangeInputs(minId, maxId) {
    const minInput = document.getElementById(minId);
    const maxInput = document.getElementById(maxId);

    const error = document.createElement('div');

    error.className = 'range-error';

    maxInput.parentElement.appendChild(error);

    function sanitize(input) {
        input.value = input.value.replace(/\D/g, '');
    }

    function validate() {
        error.textContent = '';

        // Cho phép để trống
        if (
            minInput.value === '' ||
            maxInput.value === ''
        ) {
            return true;
        }

        const min = Number(minInput.value);
        const max = Number(maxInput.value);

        if (max < min) {
            error.textContent =
                'Giá trị tối đa phải lớn hơn hoặc bằng giá trị tối thiểu.';

            return false;
        }

        return true;
    }

    minInput.addEventListener('input', () => {
        sanitize(minInput);
        validate();
    });

    maxInput.addEventListener('input', () => {
        sanitize(maxInput);
        validate();
    });

    return validate;
}

const validateFollowers = setupRangeInputs(
    'minFollowers',
    'maxFollowers'
);

const validateLikes = setupRangeInputs(
    'minLikes',
    'maxLikes'
);


// ============================================================
// START DISCOVERY
// ============================================================


runBtn.addEventListener('click', async () => {

    // --------------------------------------------------------
    // Validate Min / Max
    // --------------------------------------------------------

    if (!validateFollowers() || !validateLikes()) {
        return;
    }

     // --------------------------------------------------------
    // Keywords
    // --------------------------------------------------------

    const keywords = document
        .getElementById('keywords')
        .value
        .split('\n')
        .map(value => value.trim())
        .filter(Boolean);

    if (keywords.length === 0) {
        alert('Vui lòng nhập ít nhất một keyword.');
        return;
    }


    // --------------------------------------------------------
    // Search type
    // --------------------------------------------------------

    const searchType = document.querySelector(
        'input[name="searchType"]:checked'
    ).value;


    // --------------------------------------------------------
    // Limit
    // --------------------------------------------------------

    const limit = Number(
        document.getElementById('limit').value
    );

    if (!Number.isInteger(limit) || limit <= 0) {
        alert('Số lượng video phải lớn hơn 0.');
        return;
    }


    // --------------------------------------------------------
    // Sort
    // --------------------------------------------------------

    const sortBy = document.querySelector(
        'input[name="sort"]:checked'
    ).value;


    // --------------------------------------------------------
    // Date
    // --------------------------------------------------------

    const dateMode = document.querySelector(
        'input[name="dateMode"]:checked'
    ).value;

    let dateFrom;
    let dateTo;

    if (dateMode === 'custom') {

        dateFrom = dateFromInput.value;
        dateTo = dateToInput.value;

        if (!dateFrom || !dateTo) {
            alert(
                'Vui lòng chọn ngày bắt đầu và ngày kết thúc.'
            );
            return;
        }

        if (dateFrom > dateTo) {
            alert(
                'Ngày bắt đầu không được lớn hơn ngày kết thúc.'
            );
            return;
        }
    }

     // --------------------------------------------------------
    // Filters
    // --------------------------------------------------------

    const minFollowersInput =
        document.getElementById('minFollowers');

    const maxFollowersInput =
        document.getElementById('maxFollowers');

    const minLikesInput =
        document.getElementById('minLikes');

    const maxLikesInput =
        document.getElementById('maxLikes');


    // Blank = undefined
    // Có giá trị = Number

    const minFollowers =
        minFollowersInput.value === ''
            ? undefined
            : Number(minFollowersInput.value);

    const maxFollowers =
        maxFollowersInput.value === ''
            ? undefined
            : Number(maxFollowersInput.value);

    const minLikes =
        minLikesInput.value === ''
            ? undefined
            : Number(minLikesInput.value);

    const maxLikes =
        maxLikesInput.value === ''
            ? undefined
            : Number(maxLikesInput.value);

    // --------------------------------------------------------
    // Start
    // --------------------------------------------------------


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
                dateTo,
                minFollowers,
                maxFollowers,
                minLikes,
                maxLikes
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
