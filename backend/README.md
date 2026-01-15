# Reliance Factor - Python Backend

FastAPI backend for the Reliance Factor mobile application.

## Features

- 🔐 JWT Authentication
- 💳 Credit Score Management
- ⛽ Fuel Purchase Tracking
- 💰 Balance & Transactions
- 📊 Dashboard API

## Tech Stack

- **Framework**: FastAPI
- **Database**: MySQL (Azure Database for MySQL)
- **ORM**: SQLAlchemy
- **Auth**: JWT with python-jose
- **Deployment**: Azure App Service / Container Apps

## Quick Start

### Prerequisites

- Python 3.11+
- MySQL Server (local or Azure)

### Local Development

1. **Create virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your MySQL credentials
   ```

4. **Create MySQL database**
   ```sql
   CREATE DATABASE reliance_factor;
   ```

5. **Run the server**
   ```bash
   uvicorn app.main:app --reload
   ```

6. **Access API docs**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/profile` - Get current user profile

### Credit
- `GET /api/v1/credit/score` - Get current credit score
- `POST /api/v1/credit/check` - Perform credit check
- `GET /api/v1/credit/history` - Get score history
- `GET /api/v1/credit/factors` - Get credit factors

### Fuel
- `GET /api/v1/fuel/summary` - Get fuel spending summary
- `GET /api/v1/fuel/history` - Get fuel purchase history
- `POST /api/v1/fuel/purchase` - Add fuel purchase
- `DELETE /api/v1/fuel/purchase/{id}` - Delete fuel purchase

### Balance
- `GET /api/v1/balance` - Get current balance
- `GET /api/v1/balance/transactions` - Get transaction history
- `POST /api/v1/balance/add-funds` - Add funds
- `POST /api/v1/balance/transfer` - Transfer funds

### Dashboard
- `GET /api/v1/dashboard` - Get all dashboard data

## Azure Deployment

### Using Azure App Service

1. Create Azure App Service (Linux, Python 3.11)
2. Set up Azure Database for MySQL
3. Configure environment variables in App Service
4. Deploy using Azure DevOps or GitHub Actions

### Using Docker

```bash
# Build image
docker build -t reliance-factor-api .

# Run locally
docker run -p 8000:8000 --env-file .env reliance-factor-api

# Push to Azure Container Registry
az acr build --registry <your-registry> --image reliance-factor-api:latest .
```

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes/
│   │       ├── auth.py
│   │       ├── credit.py
│   │       ├── fuel.py
│   │       ├── balance.py
│   │       └── dashboard.py
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   ├── db/
│   │   ├── database.py
│   │   └── models.py
│   ├── schemas/
│   │   ├── user.py
│   │   ├── credit.py
│   │   ├── fuel.py
│   │   └── balance.py
│   └── main.py
├── requirements.txt
├── Dockerfile
└── .env.example
```
