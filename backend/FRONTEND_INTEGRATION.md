# Frontend Integration Guide

This document explains how the backend integrates with your existing React frontend components.

## 🎮 Game Flow Integration

Your frontend follows this flow:
1. **Start Screen** → **Game Setup** → **Battle System** → **Results**
2. **Battle System** manages 3 rounds: Player → VS → AI → Results

## 🔗 API Endpoints for Frontend

### 1. Team Registration (GameSetup.tsx)

**Frontend calls:**
```javascript
await rbcApi.registerTeam(teamData);
```

**Backend endpoint:**
```http
POST /api/rbc/teams/register
Content-Type: application/json

{
  "team_name": "Your Team Name",
  "contact_email": "team@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "teamId": "team_123",
  "jwtToken": "jwt_token_here",
  "expiresAt": "2024-01-15T12:00:00.000Z"
}
```

### 2. Client Creation (GameSetup.tsx)

**Frontend calls:**
```javascript
await rbcApi.createClient(clientData);
```

**Backend endpoint:**
```http
POST /api/rbc/clients
Content-Type: application/json

{
  "name": "Player Name",
  "email": "player@example.com",
  "cash": 10000,
  "token": "jwt_token_here"
}
```

### 3. Portfolio Creation (GameSetup.tsx)

**Frontend calls:**
```javascript
await rbcApi.createPortfolio(clientId, portfolioData);
```

**Backend endpoint:**
```http
POST /api/rbc/clients/{clientId}/portfolios
Content-Type: application/json

{
  "type": "aggressive_growth",
  "initialAmount": 10000,
  "token": "jwt_token_here"
}
```

### 4. Game Session Management (BattleSystem.tsx)

**Start Game:**
```http
POST /api/game/start
Content-Type: application/json

{
  "gameConfig": {
    "timeframe": 30,
    "goal": "Buy a new gaming setup",
    "cost": 3000,
    "initialCash": 10000,
    "teamName": "Your Team",
    "contactEmail": "team@example.com"
  },
  "rbcClientId": "client_123",
  "rbcPortfolioId": "portfolio_456"
}
```

**Get Game Status:**
```http
GET /api/game/{gameId}
```

**Advance Round:**
```http
POST /api/game/{gameId}/next-round
```

### 5. Stock Trading (RBCTradingGame.tsx)

**Get Stock Prices:**
```http
GET /api/game/{gameId}/stocks
```

**Execute Trade:**
```http
POST /api/game/{gameId}/trade
Content-Type: application/json

{
  "symbol": "TECH",
  "action": "buy",
  "quantity": 1
}
```

**Update Stock Prices (for events):**
```http
POST /api/game/{gameId}/update-stocks
Content-Type: application/json

{
  "event": {
    "type": "news",
    "title": "Tech Giant Reports Strong Earnings",
    "impact": "positive",
    "affectedSectors": ["Technology"],
    "multiplier": 1.05
  }
}
```

### 6. RBC Trading Simulation (RBCTradingGame.tsx)

**Start Trading Session:**
```http
POST /api/rbc-trading/start
Content-Type: application/json

{
  "gameConfig": { /* game config */ },
  "rbcClientId": "client_123",
  "rbcPortfolioId": "portfolio_456",
  "roundNumber": 1
}
```

**Get Trading Session:**
```http
GET /api/rbc-trading/{sessionId}
```

**Complete Trading Session:**
```http
POST /api/rbc-trading/{sessionId}/complete
Content-Type: application/json

{
  "finalValue": 10500
}
```

**Record AI Trade:**
```http
POST /api/rbc-trading/{sessionId}/ai-trade
Content-Type: application/json

{
  "stockSymbol": "TECH",
  "action": "BUY",
  "quantity": 5,
  "price": 150.00
}
```

## 🎯 Frontend Component Integration

### GameSetup.tsx
- Uses `rbcApi.registerTeam()` → `POST /api/rbc/teams/register`
- Uses `rbcApi.createClient()` → `POST /api/rbc/clients`
- Creates game config with team info and investment goals

### BattleSystem.tsx
- Manages 3-round battle flow
- Calls `POST /api/game/start` to initialize game
- Calls `POST /api/game/{gameId}/next-round` to advance rounds
- Tracks round results and determines winner

### RBCTradingGame.tsx
- Handles both player and AI trading
- Uses stock trading endpoints for player actions
- Uses RBC trading endpoints for AI simulation
- Manages 30-second trading rounds

### AITradingFeed.tsx
- Displays AI trades in real-time
- Shows current portfolio value and P&L
- Updates based on AI trade events

## 📊 Data Flow

```
1. GameSetup → Register Team → Create Client → Create Portfolio
2. BattleSystem → Start Game → Initialize 3 Rounds
3. RBCTradingGame (Player) → Trade Stocks → Complete Round
4. RBCTradingGame (AI) → Simulate RBC Portfolio → Complete Round
5. Results → Compare Performance → Determine Winner
```

## 🔧 Stock Data Structure

Your frontend expects stocks in this format:
```javascript
{
  symbol: 'TECH',
  name: 'TechCorp',
  price: 150.00,
  change: 5.00,
  changePercent: 3.33
}
```

Backend provides:
```json
{
  "success": true,
  "stocks": [
    {
      "symbol": "TECH",
      "name": "TechCorp",
      "price": 150.00,
      "previousPrice": 145.00,
      "change": 5.00,
      "changePercent": 3.45,
      "volume": 850000,
      "sector": "Technology",
      "lastUpdated": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## 🎮 Game Events

Your frontend handles events like:
- News events affecting stock prices
- Character popups with market impact
- Real-time price updates

Backend provides:
```json
{
  "type": "news",
  "title": "Tech Giant Reports Strong Earnings",
  "description": "Major technology company exceeds quarterly expectations.",
  "impact": "positive",
  "affectedSectors": ["Technology"],
  "multiplier": 1.05,
  "roundNumber": 1,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🚀 Quick Start

1. **Start Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Update Frontend API URL:**
   ```javascript
   // In your frontend, update the API base URL
   const API_BASE_URL = 'http://localhost:3001/api';
   ```

3. **Test Integration:**
   - Frontend calls backend for team registration
   - Backend proxies to RBC InvestEase API
   - Game sessions managed by backend
   - Real-time updates via polling

## 🔍 Debugging

- All API calls are logged in backend console
- Frontend can check `/health` endpoint for backend status
- Error responses include helpful messages
- CORS configured for localhost:3000

## 📝 Notes

- Backend acts as proxy to RBC InvestEase API
- Game sessions stored in memory (use Redis for production)
- Stock prices updated based on events
- AI trading simulation matches your frontend expectations
- 3-round battle system fully integrated
