const runBtn = document.getElementById('runBtn');
const status = document.getElementById('status');
const result = document.getElementById('result');


// Google Auth
const connectGoogleBtn =
    document.getElementById('connectGoogleBtn');

const googleAuthStatus =
    document.getElementById('googleAuthStatus');

connectGoogleBtn.addEventListener(
    'click',
    () => {
        window.location.href =
            '/auth/google';
    }
);

const params =
    new URLSearchParams(
        window.location.search
    );

const googleAuth =
    params.get('googleAuth');

if (googleAuth === 'success') {
    googleAuthStatus.textContent =
        'Đã kết nối Google thành công.';
}

if (googleAuth === 'error') {
    googleAuthStatus.textContent =
        'Kết nối Google thất bại.';
}

// Google sheet

const googleSheetUrlInput =
    document.getElementById('googleSheetUrl');

const validateGoogleSheetBtn =
    document.getElementById(
        'validateGoogleSheetBtn'
    );

const exportGoogleSheetBtn =
    document.getElementById(
        'exportGoogleSheetBtn'
    );


const googleSheetStatus =
    document.getElementById(
        'googleSheetStatus'
    );

let googleSheetValidated = false;
let discoveryCompleted = false;

function updateExportButton() {
    exportGoogleSheetBtn.disabled =
        !googleSheetValidated ||
        !discoveryCompleted;
}

validateGoogleSheetBtn.addEventListener(
    'click',
    async () => {

        const spreadsheetUrl =
            googleSheetUrlInput.value.trim();

        googleSheetValidated = false;
        exportGoogleSheetBtn.disabled = true;

        if (!spreadsheetUrl) {
            googleSheetStatus.textContent =
                'Vui lòng nhập URL Google Sheet.';

            return;
        }

        googleSheetStatus.textContent =
            'Đang kiểm tra Google Sheet...';

        try {

            const response =
                await fetch(
                    '/api/google-sheets/validate',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type':
                                'application/json'
                        },
                        body: JSON.stringify({
                            spreadsheetUrl
                        })
                    }
                );

            const result =
                await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.error ||
                    'Không thể kiểm tra Google Sheet.'
                );
            }

            googleSheetValidated = true;
            // exportGoogleSheetBtn.disabled = false;
            updateExportButton();

            googleSheetStatus.textContent =
                `✓ Đã kết nối: ${result.title}`;

        } catch (error) {

            googleSheetStatus.textContent =
                `✗ ${error.message}`;

        }
    }
);

exportGoogleSheetBtn.addEventListener(
    'click',
  async () => {

        console.log('EXPORT GOOGLE SHEET CLICKED');

        const spreadsheetUrl =
            googleSheetUrlInput.value.trim();

        if (!googleSheetValidated) {
            googleSheetStatus.textContent =
                'Vui lòng kiểm tra Google Sheet trước.';

            return;
        }

        if (!spreadsheetUrl) {
            googleSheetStatus.textContent =
                'Vui lòng nhập URL Google Sheet.';

            return;
        }

        exportGoogleSheetBtn.disabled = true;

        googleSheetStatus.textContent =
            'Đang export sang Google Sheet...';

        try {

            const response =
                await fetch(
                    '/api/google-sheets/export',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({
                            spreadsheetUrl
                        })
                    }
                );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.success
            ) {
                throw new Error(
                    result.error ||
                    'Export Google Sheet thất bại.'
                );
            }

            googleSheetStatus.textContent =
                `✓ Đã export ${result.creatorCount} creators vào tab "${result.sheetTitle}"`;

        } catch (error) {

            console.error(error);

            googleSheetStatus.textContent =
                `✗ ${error.message}`;

        } finally {

            // exportGoogleSheetBtn.disabled = false;
            updateExportButton();

        }
    }
);

// Date settings

const dateOptions = document.getElementById('dateOptions');

const dateModeInputs = document.querySelectorAll(
    'input[name="dateMode"]'
);

const dateRangeInputs = document.querySelectorAll(
    'input[name="dateRange"]'
);

function updateDateInputs() {
    const selectedMode = document.querySelector(
        'input[name="dateMode"]:checked'
    ).value;

    const enabled = selectedMode === 'custom';

    dateOptions.classList.toggle('disabled', !enabled);

    dateRangeInputs.forEach(input => {
        input.disabled = !enabled;
    });
}

dateModeInputs.forEach(input => {
    input.addEventListener('change', updateDateInputs);
});

updateDateInputs();


// const dateOptions = document.getElementById('dateOptions');
// const dateFromInput = document.getElementById('dateFrom');
// const dateToInput = document.getElementById('dateTo');

// const dateModeInputs = document.querySelectorAll(
//     'input[name="dateMode"]'
// );



// function updateDateInputs() {
//     const selectedMode = document.querySelector(
//         'input[name="dateMode"]:checked'
//     ).value;

//     const isCustom = selectedMode === 'custom';

//     dateFromInput.disabled = !isCustom;
//     dateToInput.disabled = !isCustom;

//     if (!isCustom) {
//         dateFromInput.value = '';
//         dateToInput.value = '';
//     }
// }

// dateModeInputs.forEach(input => {
//     input.addEventListener('change', updateDateInputs);
// });

// // Quan trọng: chạy ngay khi trang load
// updateDateInputs();

// ============================================================
// MIN / MAX VALIDATION
// ============================================================

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


function setupRangeInputs(minId, maxId) {
    const minInput = document.getElementById(minId);
    const maxInput = document.getElementById(maxId);

    const error = document.createElement('div');

    error.className = 'range-error';

    maxInput.parentElement.appendChild(error);


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

const minVideoCountInput =
    document.getElementById('minVideoCount');

minVideoCountInput.addEventListener('input', () => {
    sanitize(minVideoCountInput);
});


function setupFilterToggle(name, optionsId) {
    const options = document.getElementById(optionsId);
    const radios = document.querySelectorAll(
        `input[name="${name}"]`
    );

    function update() {
        const selected = document.querySelector(
            `input[name="${name}"]:checked`
        );

        const enabled = selected?.value === 'yes';

        options.querySelectorAll('input').forEach(input => {
            input.disabled = !enabled;

            if (!enabled) {
                input.value = '';
            }
        });
    }

    radios.forEach(radio => {
        radio.addEventListener('change', update);
    });

    update();
}

setupFilterToggle(
    'filterFollowers',
    'followersOptions'
);

setupFilterToggle(
    'filterLikes',
    'likesOptions'
);

setupFilterToggle(
    'filterVideoCount',
    'videoCountOptions'
);


// ============================================================
// START DISCOVERY
// ============================================================


runBtn.addEventListener('click', async () => {

    discoveryCompleted = false;
    updateExportButton();

    // --------------------------------------------------------
    // Verified
    // --------------------------------------------------------

    const verifiedFilter =
      document.querySelector(
          'input[name="filterVerified"]:checked'
      ).value;

    // --------------------------------------------------------
    // Validate Min / Max
    // --------------------------------------------------------

    const isFilteredByFollowers =
        document.querySelector(
            'input[name="filterFollowers"]:checked'
        ).value === 'yes';

    const isFilteredByLikes =
        document.querySelector(
            'input[name="filterLikes"]:checked'
        ).value === 'yes';

    if (isFilteredByFollowers && !validateFollowers()) {
        return;
    }

    if (isFilteredByLikes && !validateLikes()) {
        return;
  }

  // --------------------------------------------------------
  // Video counts
  // --------------------------------------------------------

  const isFilteredByVideoCount =
      document.querySelector(
          'input[name="filterVideoCount"]:checked'
      ).value === 'yes';

  const minVideoCount = isFilteredByVideoCount
      ? Number(document.getElementById('minVideoCount').value)
      : undefined;

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

        const dateRange = document.querySelector(
            'input[name="dateRange"]:checked'
        ).value;

        const today = new Date();

        const from = new Date(today);
        const to = new Date(today);

        switch (dateRange) {
            case '1d':
                from.setDate(from.getDate() - 1);
                break;

            case '1w':
                from.setDate(from.getDate() - 7);
                break;

            case '1m':
                from.setMonth(from.getMonth() - 1);
                break;

            case '1y':
                from.setFullYear(from.getFullYear() - 1);
                break;
        }

        const formatDate = date =>
            date.toISOString().split('T')[0];

        dateFrom = formatDate(from);
        dateTo = formatDate(to);
    }
    // const dateMode = document.querySelector(
    //     'input[name="dateMode"]:checked'
    // ).value;

    // let dateFrom;
    // let dateTo;

    // if (dateMode === 'custom') {

    //     dateFrom = dateFromInput.value;
    //     dateTo = dateToInput.value;

    //     if (!dateFrom || !dateTo) {
    //         alert(
    //             'Vui lòng chọn ngày bắt đầu và ngày kết thúc.'
    //         );
    //         return;
    //     }

    //     if (dateFrom > dateTo) {
    //         alert(
    //             'Ngày bắt đầu không được lớn hơn ngày kết thúc.'
    //         );
    //         return;
    //     }
    // }

     // --------------------------------------------------------
    // Filters
    // --------------------------------------------------------

    const minFollowers = isFilteredByFollowers
        ? Number(document.getElementById('minFollowers').value)
        : undefined;

    const maxFollowers = isFilteredByFollowers
        ? Number(document.getElementById('maxFollowers').value)
        : undefined;

    const minLikes = isFilteredByLikes
        ? Number(document.getElementById('minLikes').value)
        : undefined;

    const maxLikes = isFilteredByLikes
        ? Number(document.getElementById('maxLikes').value)
        : undefined;

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

                verifiedFilter,

                isFilteredByFollowers,
                minFollowers,
                maxFollowers,

                isFilteredByLikes,
                minLikes,
                maxLikes,

                isFilteredByVideoCount,
                minVideoCount
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || 'Discovery failed'
            );
        }

        discoveryCompleted = true;
        updateExportButton();

        status.textContent =
            'Hoàn thành!';



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
