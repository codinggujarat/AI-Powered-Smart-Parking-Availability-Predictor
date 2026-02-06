# AI-Powered Smart Parking Availability Predictor
### 🚀 Submission for Codeversity 2026 (IIT Gandhinagar)

**Developed by Team: CodingGujarat**

---

## 👨‍💻 Team Details

| Name | Role | ID | University | Email |
|------|------|----|------------|-------|
| **Aman Nayak** | Team Lead | HS-IITGN-145-56957070 | Ganpat University | amannayak2911@gmail.com |
| **Dadhaniya Hiren** | Member | HS-IITGN-145-828F7495 | KSV University | dadhaniyahiren2580@gmail.com |
| **Dadhaniya Himanshu**| Member | HS-IITGN-145-4ADB3FD9 | KSV University | himanshu30290@gmail.com |
| **Patel Krish** | Member | HS-IITGN-145-B1C56985 | KSV University | jaymin9904947@gmail.com |

---

## 🎯 Problem Statement
**Artificial Intelligence | Medium | Smart Cities**

Urban areas face persistent parking challenges due to increasing vehicle density and unpredictable demand. The goal is to develop an AI system that predicts parking availability in city zones based on:
- 🕒 Time of day & Day of week
- 📍 Geographic Location
- 🎉 Local Events (Concerts, Festivals, etc.)
- 🚗 Traffic Patterns

The solution helps commuters make informed decisions, reduces congestion, and aids city planning.

---

## 🌟 Comprehensive Feature Suite

### 🧠 Artificial Intelligence Core
*   **Predictive Availability Model**: Utilizes Random Forest Regression to forecast parking retention rates with high confidence.
*   **Real-time Confidence Scoring**: AI provides a 'Confidence Level' (Percentage) for every prediction to ensure trust.
*   **Dynamic Retraining Pipeline**: Admin panel supports on-demand model retraining when new data is uploaded.
*   **Feature Importance Visualization**: Transparency into the AI's logic, showing how factors like 'Hour' or 'Events' influence results.

### 🗺️ Interactive Mapping & Navigation
*   **Live City Map**: Powered by **Google Maps JavaScript API**, featuring custom markers for real-time status.
*   **Live User/Vehicle Tracking**: Uses `geolocation` API to track and display the driver's real-time position on the map.
*   **Smart Color Coding**: Intuitive indicators (Green > 60%, Yellow 30-60%, Red < 30%) for instant decision-making.
*   **One-Click Navigation**: "Navigate to Zone" button deeply integrated with Google Maps Directions.
*   **Nearby Alternatives**: Automatically improved suggestions for nearby parking if the selected zone is full.

### 👤 Advanced User Experience
*   **Secure Authentication**: Robust Login and Registration system using JWT (JSON Web Tokens) and BCrypt hashing.
*   **Enhanced User Profiles**: Captures detailed demographics including State, Country, Pincode, and Address for better analytics.
*   **Favorites System**: Users can 'Star' frequently visited zones for quick access from the sidebar.
*   **Smart Search**: Instantly filter map zones by name, district, or keyword.

### 📅 Temporal & Event Intelligence
*   **Time-Travel Predictions**: Filter map data to see future availability for +1 Hour, +2 Hours, or +4 Hours.
*   **Event Impact Alerts**: System automatically detects nearby large events (Concerts, Sports) and displays warning badges to users.
*   **Historical Trends**: Interactive charts showing daily 'Peak Hours' and 'Average Occupancy' statistics for every zone.

### 🛡️ Admin Command Center (Admin AI)
*   **System Telemetry**: Real-time monitoring dashboard showing API Latency, System Uptime, and Active Requests.
*   **User Management**: Full RBAC capabilities to View, Promote, Demote, or Ban users.
*   **Data Hub**: Interface to upload new CSV datasets to the backend.
*   **Event Manager**: Tools to Add or Delete system-wide events that affect predictions.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework**: React 18 (Vite)
*   **Styling**: Tailwind CSS (Custom "Pure White" Professional Theme)
*   **Maps**: **Google Maps JavaScript API** (via `@react-google-maps/api`)
*   **Charts**: Chart.js / React-Chartjs-2
*   **Icons**: Lucide React

### Backend
*   **Framework**: FastAPI (Python 3.10+)
*   **Database**: SQLite (SQLAlchemy ORM)
*   **Authentication**: OAuth2 with Password Flow (JWT)
*   **Validation**: Pydantic Schemas

### Machine Learning
*   **Model**: Random Forest Regressor (Scikit-learn)
*   **Data Processing**: Pandas, NumPy
*   **Persistence**: Joblib

---

## 🚀 How to Run Locally

### Option 1: One-Click Start (Windows)
1.  Run **`run_backend.bat`** to start the API server.
2.  Run **`run_frontend.bat`** to launch the web application.

### Option 2: Manual Setup

**1. Backend Setup**
```bash
cd backend
python -m venv venv
# Activate venv (Windows: venv\Scripts\activate)
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload
```

**2. Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

---

*Built with ❤️ by Team CodingGujarat for Codeversity 2026*
