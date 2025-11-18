// -------------------- TAILWIND CONFIG --------------------
tailwind.config = {
    theme: {
        extend: {
            colors: {
                'primary': '#0d9488',
                'secondary-bg': '#f0fdfa'
            }
        }
    }
};

// -------------------- GLOBAL STATE --------------------
const API_BASE_URL = "http://127.0.0.1:8000";
let currentPage = "home";
let chatHistory = [];
let csvData = [];

// -------------------- NAVIGATION --------------------
function navigateTo(pageId) {
    currentPage = pageId;

    document.querySelectorAll(".page-content").forEach(page => {
        page.classList.add("hidden");
    });

    const target = document.getElementById(pageId);
    if (target) target.classList.remove("hidden");

    document.querySelectorAll(".nav-link").forEach(nav => {
        nav.classList.toggle("active", nav.dataset.page === pageId);
    });

    if (pageId === "csv_viewer") loadCsvData();
    if (pageId === "chatbot") renderChatHistory();
}

// -------------------- API HELPER --------------------
async function apiCall(endpoint, method = "GET", data = null) {
    let options = { method, headers: { "Content-Type": "application/json" } };
    if (data) options.body = JSON.stringify(data);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        if (!response.ok) {
            const err = await response.json().catch(() => ({
                detail: `HTTP ${response.status}: ${response.statusText}`
            }));
            throw new Error(err.detail);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        return { error: error.message, status: "error" };
    }
}

// -------------------- FRAUD DETECTION --------------------
function setupFraudDetection() {
    const form = document.getElementById("fraud-form");
    if (!form) return;

    form.addEventListener("submit", handleFraudSubmit);

    const today = new Date();
    document.getElementById("transaction_date").value = today.toISOString().split("T")[0];
    document.getElementById("transaction_time").value = today.toTimeString().substring(0, 5);
}

const encoders = {
    Transaction_Location: {
        "Andijan": 0, "Bukhara": 1, "Jizzakh": 2, "Karakalpakstan": 3,
        "Khorezm": 4, "Namangan": 5, "Navoiy": 6, "Samarkand": 7,
        "Surkhandarya": 8, "Syrdarya": 9, "Tashkent": 10
    },
    Card_Type: { "Humo": 0, "UzCard": 1 },
    Transaction_Currency: { "USD": 0, "UZS": 1 },
    Transaction_Status: { "Failed": 0, "Reversed": 1, "Successful": 2 },
    Authentication_Method: { "2FA": 0, "Biometric": 1, "Password": 2 },
    Transaction_Category: { "Cash In": 0, "Cash Out": 1, "Payment": 2, "Transfer": 3 }
};

async function handleFraudSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const resultDiv = document.getElementById("fraud-result");
    const submitBtn = form.querySelector("button[type='submit']");

    // Loading state
    resultDiv.innerHTML = `<div class="text-center py-4 text-primary">Processing transaction...</div>`;
    submitBtn.disabled = true;
    submitBtn.innerHTML =
        `<span class="animate-spin inline-block w-4 h-4 border-t-2 border-white rounded-full mr-2"></span>Analyzing...`;

    const raw = {
        Transaction_Amount: parseFloat(form.amount.value),
        Transaction_Location: form.transaction_location.value,
        Merchant_ID: parseInt(form.merchant_id.value),
        Device_ID: parseInt(form.device_id.value),
        Card_Type: form.card_type.value,
        Transaction_Currency: form.transaction_currency.value,
        Transaction_Status: form.transaction_status.value,
        Previous_Transaction_Count: parseInt(form.previous_transaction_count.value),
        Distance_Between_Transactions_km: parseFloat(form.distance_between_transactions_km.value),
        Time_Since_Last_Transaction_min: parseFloat(form.time_since_last_transaction_min.value),
        Authentication_Method: form.authentication_method.value,
        Transaction_Velocity: parseInt(form.transaction_velocity.value),
        Transaction_Category: form.category.value
    };

    const dateObj = new Date(form.transaction_date.value + " " + form.transaction_time.value);
    raw.Year = dateObj.getFullYear();
    raw.Month = dateObj.getMonth() + 1;
    raw.Day = dateObj.getDate();
    raw.Hour = dateObj.getHours();

    // Encode
    const encoded = {
        Transaction_Amount: raw.Transaction_Amount,
        Transaction_Location: encoders.Transaction_Location[raw.Transaction_Location],
        Merchant_ID: raw.Merchant_ID,
        Device_ID: raw.Device_ID,
        Card_Type: encoders.Card_Type[raw.Card_Type],
        Transaction_Currency: encoders.Transaction_Currency[raw.Transaction_Currency],
        Transaction_Status: encoders.Transaction_Status[raw.Transaction_Status],
        Previous_Transaction_Count: raw.Previous_Transaction_Count,
        Distance_Between_Transactions_km: raw.Distance_Between_Transactions_km,
        Time_Since_Last_Transaction_min: raw.Time_Since_Last_Transaction_min,
        Authentication_Method: encoders.Authentication_Method[raw.Authentication_Method],
        Transaction_Velocity: raw.Transaction_Velocity,
        Transaction_Category: encoders.Transaction_Category[raw.Transaction_Category],
        Year: raw.Year,
        Month: raw.Month,
        Day: raw.Day,
        Hour: raw.Hour
    };

    const feature_vector = Object.values(encoded);

    const result = await apiCall("/predict_fraud", "POST", { feature_vector });

    submitBtn.disabled = false;
    submitBtn.textContent = "Detect Fraud";

    if (result?.is_fraud !== undefined) {
        const isFraud = result.is_fraud === 1;
        const prob = result.probability.toFixed(3);

        resultDiv.innerHTML = `
            <div class="p-6 mt-4 rounded-xl shadow-lg ${isFraud ? "bg-red-100" : "bg-green-100"}">
                <h3 class="text-2xl font-bold mb-2">Analysis Complete</h3>
                <p class="text-lg">
                    Prediction:
                    <span class="font-extrabold ${isFraud ? "text-red-600" : "text-green-600"}">
                        ${isFraud ? "Fraud Detected" : "Normal Transaction"}
                    </span>
                </p>
                <p class="text-sm text-gray-700">Probability: <strong>${prob}</strong></p>
            </div>`;
    } else {
        resultDiv.innerHTML =
            `<div class="p-4 mt-4 rounded-xl bg-red-100 text-red-600">Error processing request.</div>`;
    }
}

// -------------------- CHATBOT --------------------
function setupChatbot() {
    const form = document.getElementById("chat-form");
    if (!form) return;

    form.addEventListener("submit", handleChatSubmit);

    if (chatHistory.length === 0) {
        chatHistory.push({ role: "bot", text: "Hello! I am your BFSI Chatbot." });
    }

    renderChatHistory();
}

async function handleChatSubmit(event) {
    event.preventDefault();

    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;

    chatHistory.push({ role: "user", text });
    input.value = "";
    renderChatHistory();

    // Loading bubble
    const chatBox = document.getElementById("chat-history");
    const loader = document.createElement("div");
    loader.className = "message-bubble bot-bubble animate-pulse";
    loader.textContent = "Thinking...";
    chatBox.appendChild(loader);

    const result = await apiCall("/chat", "POST", { message: text });
    loader.remove();

    chatHistory.push({
        role: "bot",
        text: result?.reply || "Sorry, backend did not respond."
    });

    renderChatHistory();
}

function renderChatHistory() {
    const box = document.getElementById("chat-history");
    box.innerHTML = "";

    chatHistory.forEach(msg => {
        let bubble = document.createElement("div");
        bubble.className =
            `message-bubble ${msg.role === "user" ? "user-bubble ml-auto" : "bot-bubble mr-auto"}`;
        bubble.textContent = msg.text;
        box.appendChild(bubble);
    });

    box.scrollTop = box.scrollHeight;
}

// -------------------- CSV VIEWER --------------------
async function loadCsvData() {
    const tableHead = document.getElementById("csv-table-head");
    const tableBody = document.getElementById("csv-table-body");
    const status = document.getElementById("csv-status");

    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    status.innerHTML =
        `<div class="text-center py-4 text-primary">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p class="mt-2">Loading data...</p>
        </div>`;

    const result = await apiCall("/csv_data");

    if (result.error) {
        status.innerHTML = `<div class="text-center text-red-600 py-4">${result.error}</div>`;
        return;
    }

    const { data, columns, total_rows, displayed_rows } = result;

    // Table headers
    tableHead.innerHTML =
        `<tr>${columns.map(c => `<th class="px-6 py-3 text-left text-xs font-semibold text-gray-600">${c}</th>`).join("")}</tr>`;

    // Table rows
    tableBody.innerHTML =
        data.map(row =>
            `<tr class="hover:bg-gray-50">${columns.map(c =>
                `<td class="px-6 py-4 text-sm">${row[c] ?? ""}</td>`
            ).join("")}</tr>`
        ).join("");

    status.innerHTML =
        `<div class="text-sm text-gray-600 py-2">Showing ${displayed_rows} of ${total_rows} rows</div>`;
}

// -------------------- MODAL --------------------
function showModal(title, message) {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-message").textContent = message;
    document.getElementById("custom-modal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("custom-modal").classList.add("hidden");
}

// -------------------- INITIALIZATION --------------------
window.onload = () => {
    setupFraudDetection();
    setupChatbot();
    document.getElementById("modal-close-btn").addEventListener("click", closeModal);
    navigateTo("home");
};
