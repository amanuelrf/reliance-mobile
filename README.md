# Reliance Factor

A cross-platform mobile application for credit monitoring, fuel tracking, and financial management.

## 📱 Features

- **Home Dashboard** - Overview of your financial health
- **Credit Check** - Monitor your credit score and factors
- **Fuel Tracker** - Track fuel purchases and savings
- **Balance** - View account balance and transactions

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   MOBILE APP (React Native / Expo)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │   Home   │  │   Fuel   │  │ Balance  │  │  Credit Check  │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API (HTTPS)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AZURE CLOUD                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Python Backend (FastAPI)                     │  │
│  │              Azure App Service / Container Apps           │  │
│  └──────────────────────────────┬───────────────────────────┘  │
│                                 │                               │
│  ┌──────────────────────────────▼───────────────────────────┐  │
│  │              Azure Database for MySQL                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology | Azure Service |
|-------|------------|---------------|
| Mobile | React Native + Expo | - |
| Backend | Python + FastAPI | Azure App Service |
| Database | MySQL | Azure Database for MySQL |
| Auth | JWT Tokens | - |

## 📦 Project Structure

```
reliance-factor/
├── app/                    # Expo Router pages
│   ├── (tabs)/
│   │   ├── index.tsx       # Home screen
│   │   ├── fuel.tsx        # Fuel tracker
│   │   ├── balance.tsx     # Balance & transactions
│   │   └── credit-check.tsx # Credit monitoring
│   └── _layout.tsx
├── components/             # Reusable UI components
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       └── stat-card.tsx
├── services/               # API communication
│   └── api.ts
├── constants/              # Theme & configuration
│   └── theme.ts
└── backend/                # Python FastAPI backend
    ├── app/
    │   ├── api/routes/     # API endpoints
    │   ├── core/           # Config & security
    │   ├── db/             # Database models
    │   └── schemas/        # Pydantic schemas
    ├── requirements.txt
    └── Dockerfile
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- MySQL Server
- Expo CLI (`npm install -g expo-cli`)

### Mobile App (Frontend)

```bash
# Install dependencies
npm install

# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

### Python Backend

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create MySQL database
mysql -u root -p -e "CREATE DATABASE reliance_factor;"

# Set environment variables (create .env file)
# MYSQL_HOST=localhost
# MYSQL_USER=root
# MYSQL_PASSWORD=your_password
# MYSQL_DATABASE=reliance_factor
# SECRET_KEY=your-secret-key

# Run the server
uvicorn app.main:app --reload
```

### Access the APIs

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 💰 Azure Cost Estimate

| Service | Monthly Cost |
|---------|-------------|
| App Service (B1) | ~$13 |
| Azure MySQL (Basic) | ~$25 |
| **Total** | **~$38/month** |

## 📱 Screenshots

The app features a modern, clean design with:
- Deep teal primary color (`#0D9488`)
- Coral accent color (`#F97316`)
- Full dark mode support
- Native iOS and Android styling

## 🔐 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/profile` - Get profile

### Credit
- `GET /api/v1/credit/score` - Get credit score
- `POST /api/v1/credit/check` - Perform credit check
- `GET /api/v1/credit/history` - Score history

### Fuel
- `GET /api/v1/fuel/summary` - Fuel summary
- `POST /api/v1/fuel/purchase` - Add purchase
- `GET /api/v1/fuel/history` - Purchase history

### Balance
- `GET /api/v1/balance` - Get balance
- `GET /api/v1/balance/transactions` - Transactions
- `POST /api/v1/balance/add-funds` - Add funds

## 📄 License

MIT License
