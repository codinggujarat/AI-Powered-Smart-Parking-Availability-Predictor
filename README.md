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
- 📍 Geographic Location (GPS Tracking)
- 🎉 Local Events (Concerts, Festivals, etc.)
- 🚗 Historical Demand Patterns

The solution helps commuters make informed decisions, reduces congestion, and aids city planning.

---

## 🌟 Comprehensive Feature Suite

### 🧠 Artificial Intelligence Core
*   **Predictive Availability Model**: Utilizes **Random Forest Regression** to forecast parking retention rates with high confidence.
*   **Real-time Confidence Scoring**: AI provides a 'Confidence Level' (Percentage) for every prediction to ensure trust.
*   **Dynamic Retraining Pipeline**: Admin panel supports on-demand model retraining when new data is accumulated.
*   **Feature Importance Visualization**: Transparency into the AI's logic, showing how factors like 'Hour' or 'Events' influence results.

### 🗺️ Interactive Mapping & Navigation
*   **Live City Map**: Powered by **Google Maps JavaScript API**, featuring 138+ parking zones across 22 major cities in Gujarat.
*   **Live User Tracking**: Integrated `geolocation` tracking to display the driver's real-time position on the map.
*   **Smart Color Coding**: Dynamic markers (Green > 60%, Yellow 30-60%, Red < 30%) updated via AI predictions.
*   **One-Click Navigation**: Direct integration with Google Maps Directions for seamless routing to the selected zone.
*   **Nearby Alternatives**: Intelligent suggestions for nearby parking if the primary choice is congested.

### 👤 Advanced User Experience
*   **Dual Authentication**: Support for Secure JWT-based registration and **Google OAuth 2.0 (SSO)**.
*   **Theme Management**: Modern UI with persistent **System/Light/Dark Mode** support.
*   **Enhanced Profiles**: Captures detailed demographics (State, Address, Pincode) for personalized urban analytics.
*   **Favorites & Search**: predictive search dropdown and 'Star' functionality for quick access to frequent zones.

### 🛡️ Admin Management Console
*   **Model Performance Monitoring**: Live tracking of MAE, R2 scores, and accuracy metrics.
*   **User RBAC**: Manage personnel with promote/demote and clearance level controls.
*   **Event Orchestration**: Tools to add/delete regional events and instantly update AI predictions.
*   **Telemetry Hub**: Real-time diagnostics of API latency, uptime, and system health.

---

## 📊 Data Coverage (Gujarat Expansion)
The platform features an expanded dataset of **138+ Parking Zones** covering these major cities:
- Ahmedabad, Surat, Vadodara, Rajkot, Bhavnagar, Jamnagar, Junagadh, Gandhinagar, Anand, Mehsana, Morbi, Nadiad, Bharuch, Porbandar, Valsad, Vapi, Navsari, Veraval, Bhuj, Godhra, Palanpur, Patan.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite** (Ultra-fast build tool)
- **Tailwind CSS** (State-of-the-art responsive design)
- **Google Maps JS API** (Premier mapping solution)
- **Lucide React** (Consistent iconography)
- **Chart.js** (Dynamic data visualizations)

### Backend
- **FastAPI** (High-performance Python framework)
- **SQLAlchemy** (Robust SQLite Object-Relational Mapping)
- **JWT & OAuth2** (Industry-standard security)
- **Pydantic v2** (Strict data validation)

### Machine Learning
- **Scikit-learn** (RandomForestRegressor implementation)
- **Pandas & NumPy** (High-dimensional data processing)
- **Joblib** (Model persistence and serialization)

---

## 🚀 Getting Started

### Admin Credentials (Evaluation)
- **Email**: `admin@smartpark.ai`
- **Password**: `password123`

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google Maps API Key (Provide in `.env`)

### Fast Installation (Windows One-Click)
1.  Run **`run_backend.bat`** (Starts FastAPI on port 8000)
2.  Run **`run_frontend.bat`** (Starts Vite on port 5173)

### 🌍 Production Deployment
For deploying to Render (Backend) and Vercel (Frontend), see our comprehensive **[Deployment Guide](file:///c:/Users/amann/Downloads/AI-Powered%20Smart%20Parking%20Availability%20Predictor/DEPLOYMENT.md)**.

### Manual Installation
**1. Backend**
```bash
cd backend
python -m venv venv
# Windows: venv\\Scripts\\activate | Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**2. Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

*Built with ❤️ by Team CodingGujarat for Codeversity 2026*
