import streamlit as st
import pandas as pd
import joblib

# Import database functions
from utils import (
    get_db_connection, initialize_database, create_user,
    authenticate_user, reset_user_password
)

# Streamlit configuration (must be FIRST)
st.set_page_config(page_title="Fraud Detection App", layout="wide")

# -------- DB Initialization --------
if "db_initialized" not in st.session_state:
    initialize_database()
    st.session_state.db_initialized = True

# -------- Load Model + Scaler --------
@st.cache_resource
def load_model_and_scaler():
    model = joblib.load('./random_forest_model.joblib')
    scaler = joblib.load('./scaler.joblib')
    return model, scaler

model, scaler = load_model_and_scaler()

# -------- Preprocessing Columns --------
categorical_cols_for_ohe = [
    "Transaction_Location", "Card_Type", "Transaction_Currency",
    "Transaction_Status", "Authentication_Method", "Transaction_Category"
]

numerical_cols_to_scale = [
    "Transaction_Amount", "Previous_Transaction_Count",
    "Distance_Between_Transactions_km",
    "Time_Since_Last_Transaction_min", "Transaction_Velocity"
]

final_model_features = [
    "Transaction_Amount", "Previous_Transaction_Count",
    "Distance_Between_Transactions_km", "Time_Since_Last_Transaction_min",
    "Transaction_Velocity", "Transaction_Hour", "Transaction_DayOfWeek",
    "Transaction_Month",
    "Transaction_Location_Bukhara", "Transaction_Location_Fergana",
    "Transaction_Location_Jizzakh", "Transaction_Location_Kashkadarya",
    "Transaction_Location_Khorezm", "Transaction_Location_Namangan",
    "Transaction_Location_Navoiy", "Transaction_Location_Samarkand",
    "Transaction_Location_Sirdarya", "Transaction_Location_Surkhandarya",
    "Transaction_Location_Tashkent",
    "Card_Type_UzCard", "Transaction_Currency_UZS",
    "Transaction_Status_Reversed", "Transaction_Status_Successful",
    "Authentication_Method_Biometric", "Authentication_Method_Password",
    "Transaction_Category_Cash Out", "Transaction_Category_Payment",
    "Transaction_Category_Transfer"
]


# -------- Prediction Function --------
def predict_transaction(raw_input_data):
    df = pd.DataFrame([raw_input_data])

    # DateTime Processing
    try:
        df["Transaction_DateTime"] = pd.to_datetime(
            df["Transaction_Date"] + " " + df["Transaction_Time"],
            format="%m/%d/%Y %H:%M",
            errors="coerce"
        )
    except:
        return "Error", 0.0

    df["Transaction_Hour"] = df["Transaction_DateTime"].dt.hour
    df["Transaction_DayOfWeek"] = df["Transaction_DateTime"].dt.dayofweek
    df["Transaction_Month"] = df["Transaction_DateTime"].dt.month

    df.drop(columns=["Transaction_Date", "Transaction_Time", "Transaction_DateTime"], inplace=True)

    # One-Hot Encoding (safe)
    df = pd.get_dummies(df, columns=categorical_cols_for_ohe, drop_first=True)

    # Column alignment
    df = df.reindex(columns=final_model_features, fill_value=0)

    # Scale numerical data
    df[numerical_cols_to_scale] = scaler.transform(df[numerical_cols_to_scale])

    # Prediction
    prediction = model.predict(df)[0]
    probability = model.predict_proba(df)[0][1]

    return ("Fraud" if prediction == 1 else "Legit", round(probability, 4))


# -------- Session State (Login System) --------
if "logged_in" not in st.session_state:
    st.session_state.logged_in = False
    st.session_state.username = None
    st.session_state.user_id = None


# -------- Login Form --------
def show_login_form():
    st.sidebar.subheader("Login")

    with st.sidebar.form("login_form"):
        username = st.text_input("Username", key="login_username")
        password = st.text_input("Password", type="password", key="login_password")
        submit = st.form_submit_button("Login")

        if submit:
            user = authenticate_user(username, password)
            if user:
                st.session_state.logged_in = True
                st.session_state.username = user["username"]
                st.session_state.user_id = user["id"]
                st.sidebar.success(f"Welcome {st.session_state.username}")
                st.rerun()
            else:
                st.sidebar.error("Incorrect username or password.")


# -------- Register Form --------
def show_register_form():
    st.sidebar.subheader("Register")

    with st.sidebar.form("register_form"):
        new_user = st.text_input("New Username", key="reg_user")
        new_pass = st.text_input("New Password", type="password", key="reg_pass")
        submit = st.form_submit_button("Register")

        if submit:
            if new_user and new_pass:
                if create_user(new_user, new_pass):
                    st.sidebar.success("Account created successfully! Login now.")
                    st.rerun()
            else:
                st.sidebar.error("Both fields are required.")


# -------- Logout Button --------
def show_logout_button():
    if st.sidebar.button("Logout"):
        st.session_state.logged_in = False
        st.session_state.username = None
        st.session_state.user_id = None
        st.rerun()


# =============================================================
#               MAIN UI LOGIC
# =============================================================
if not st.session_state.logged_in:
    st.title("🔐 Please Login or Register")
    show_login_form()
    show_register_form()
    st.info("Login to access fraud detection features.")
else:
    st.sidebar.write(f"👤 Logged in as: **{st.session_state.username}**")
    show_logout_button()

    st.title("💳 Real-Time Transaction Fraud Detection – Overview")

    st.markdown


