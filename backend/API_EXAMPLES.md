# API Examples for InvestEase Showdown

This document provides detailed examples of how to use the InvestEase Showdown backend API.

## 🔑 Authentication

All RBC API endpoints require valid API credentials. Set these in your `.env` file:

```bash
RBC_API_KEY=your_rbc_api_key_here
RBC_API_SECRET=your_rbc_api_secret_here
```

## 📊 RBC InvestEase API Examples

### 1. Create a New Portfolio

**Request:**
```http
POST /api/rbc/portfolio
Content-Type: application/json

{
  "userId": "student_123",
  "goal": "retirement",
  "timeframe": 30,
  "initialDeposit": 10000
}
```

**Response:**
```json
{
  "success": true,
  "message": "RBC InvestEase portfolio created successfully",
  "portfolio": {
    "portfolioId": "rbc_port_456789",
    "userId": "student_123",
    "goal": "retirement",
    "timeframe": 30,
    "initialDeposit": 10000,
    "currentValue": 10000,
    "allocations": {
      "stocks": 60,
      "bonds": 30,
      "cash": 10
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "status": "active"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Get Portfolio Details

**Request:**
```http
GET /api/rbc/portfolio/rbc_port_456789
```

**Response:**
```json
{
  "success": true,
  "portfolio": {
    "portfolioId": "rbc_port_456789",
    "currentValue": 10250.50,
    "initialValue": 10000,
    "totalReturn": 250.50,
    "totalReturnPercent": 2.51,
    "allocations": {
      "stocks": 60,
      "bonds": 30,
      "cash": 10
    },
    "lastUpdated": "2024-01-15T11:00:00.000Z",
    "status": "active",
    "goal": "retirement",
    "timeframe": 30
  },
  "timestamp": "2024-01-15T11:00:00.000Z"
}
```

### 3. Add Contribution to Portfolio

**Request:**
```http
POST /api/rbc/portfolio/rbc_port_456789/contribute
Content-Type: application/json

{
  "amount": 1000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contribution added successfully",
  "contribution": {
    "portfolioId": "rbc_port_456789",
    "amount": 1000,
    "newBalance": 11250.50,
    "contributionId": "contrib_789",
    "timestamp": "2024-01-15T11:15:00.000Z"
  },
  "timestamp": "2024-01-15T11:15:00.000Z"
}
```

### 4. Get Portfolio Performance

**Request:**
```http
GET /api/rbc/portfolio/rbc_port_456789/performance?period=1M
```

**Response:**
```json
{
  "success": true,
  "performance": {
    "portfolioId": "rbc_port_456789",
    "period": "1M",
    "dataPoints": [
      {
        "date": "2024-01-01",
        "value": 10000,
        "return": 0
      },
      {
        "date": "2024-01-15",
        "value": 10250.50,
        "return": 2.51
      }
    ],
    "totalReturn": 250.50,
    "totalReturnPercent": 2.51,
    "volatility": 0.12,
    "sharpeRatio": 1.8,
    "maxDrawdown": -0.05,
    "startDate": "2024-01-01",
    "endDate": "2024-01-15"
  },
  "timestamp": "2024-01-15T11:20:00.000Z"
}
```

### 5. Get Asset Allocations

**Request:**
```http
GET /api/rbc/portfolio/rbc_port_456789/allocations
```

**Response:**
```json
{
  "success": true,
  "allocations": {
    "portfolioId": "rbc_port_456789",
    "stocks": 60,
    "bonds": 30,
    "cash": 10,
    "alternatives": 0,
    "lastRebalanced": "2024-01-01T00:00:00.000Z",
    "nextRebalancing": "2024-04-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-15T11:25:00.000Z"
}
```

### 6. Get Available Goals

**Request:**
```http
GET /api/rbc/goals
```

**Response:**
```json
{
  "success": true,
  "goals": [
    {
      "id": "retirement",
      "name": "Retirement",
      "description": "Long-term retirement planning"
    },
    {
      "id": "education",
      "name": "Education",
      "description": "Save for education expenses"
    },
    {
      "id": "house",
      "name": "House Purchase",
      "description": "Save for a down payment"
    },
    {
      "id": "emergency",
      "name": "Emergency Fund",
      "description": "Build an emergency fund"
    },
    {
      "id": "general",
      "name": "General Investing",
      "description": "General wealth building"
    }
  ],
  "timestamp": "2024-01-15T11:30:00.000Z"
}
```

## 🎮 Game API Examples

### 1. Start a New Game

**Request:**
```http
POST /api/game/start
Content-Type: application/json

{
  "userId": "student_123",
  "rbcPortfolioId": "rbc_port_456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Game started successfully",
  "game": {
    "gameId": "game_1705312200000_abc123def",
    "userId": "student_123",
    "currentRound": 1,
    "totalRounds": 3,
    "playerPortfolio": {
      "cash": 10000,
      "positions": [],
      "totalValue": 10000
    },
    "rbcPortfolio": {
      "portfolioId": "rbc_port_456789",
      "initialValue": 10000,
      "currentValue": 10000,
      "totalReturn": 0,
      "totalReturnPercent": 0
    },
    "currentEvent": {
      "type": "news",
      "title": "Tech Giant Reports Strong Earnings",
      "description": "Major technology company exceeds quarterly expectations, driving sector optimism.",
      "impact": "positive",
      "affectedSectors": ["Technology"],
      "multiplier": 1.05,
      "roundNumber": 1,
      "timestamp": "2024-01-15T11:35:00.000Z"
    },
    "status": "active"
  },
  "timestamp": "2024-01-15T11:35:00.000Z"
}
```

### 2. Get Game Status

**Request:**
```http
GET /api/game/game_1705312200000_abc123def
```

**Response:**
```json
{
  "success": true,
  "game": {
    "gameId": "game_1705312200000_abc123def",
    "userId": "student_123",
    "status": "active",
    "currentRound": 1,
    "totalRounds": 3,
    "playerPortfolio": {
      "cash": 8500,
      "positions": [
        {
          "symbol": "AAPL",
          "quantity": 10,
          "averagePrice": 150,
          "currentPrice": 157.50
        }
      ],
      "totalValue": 10075
    },
    "rbcPortfolio": {
      "portfolioId": "rbc_port_456789",
      "initialValue": 10000,
      "currentValue": 10020,
      "totalReturn": 20,
      "totalReturnPercent": 0.2
    },
    "currentEvent": {
      "type": "news",
      "title": "Tech Giant Reports Strong Earnings",
      "description": "Major technology company exceeds quarterly expectations, driving sector optimism.",
      "impact": "positive",
      "affectedSectors": ["Technology"],
      "multiplier": 1.05,
      "roundNumber": 1,
      "timestamp": "2024-01-15T11:35:00.000Z"
    },
    "rounds": [
      {
        "roundNumber": 1,
        "event": {
          "type": "news",
          "title": "Tech Giant Reports Strong Earnings",
          "description": "Major technology company exceeds quarterly expectations, driving sector optimism.",
          "impact": "positive",
          "affectedSectors": ["Technology"],
          "multiplier": 1.05,
          "roundNumber": 1,
          "timestamp": "2024-01-15T11:35:00.000Z"
        },
        "playerActions": [
          {
            "symbol": "AAPL",
            "action": "buy",
            "quantity": 10,
            "price": 150,
            "value": 1500,
            "timestamp": "2024-01-15T11:36:00.000Z"
          }
        ],
        "rbcPerformance": 0.002,
        "status": "active"
      }
    ],
    "createdAt": "2024-01-15T11:35:00.000Z",
    "lastUpdated": "2024-01-15T11:36:00.000Z"
  },
  "timestamp": "2024-01-15T11:36:00.000Z"
}
```

### 3. Execute a Trade

**Request:**
```http
POST /api/game/game_1705312200000_abc123def/trade
Content-Type: application/json

{
  "symbol": "MSFT",
  "action": "buy",
  "quantity": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trade executed successfully",
  "trade": {
    "symbol": "MSFT",
    "action": "buy",
    "quantity": 5,
    "price": 315.00,
    "value": 1575,
    "timestamp": "2024-01-15T11:37:00.000Z"
  },
  "portfolio": {
    "cash": 6925,
    "positions": [
      {
        "symbol": "AAPL",
        "quantity": 10,
        "averagePrice": 150,
        "currentPrice": 157.50
      },
      {
        "symbol": "MSFT",
        "quantity": 5,
        "averagePrice": 315,
        "currentPrice": 315
      }
    ],
    "totalValue": 10075
  },
  "timestamp": "2024-01-15T11:37:00.000Z"
}
```

### 4. Advance to Next Round

**Request:**
```http
POST /api/game/game_1705312200000_abc123def/next-round
```

**Response:**
```json
{
  "success": true,
  "message": "Advanced to next round",
  "game": {
    "gameId": "game_1705312200000_abc123def",
    "currentRound": 2,
    "totalRounds": 3,
    "status": "active",
    "playerPortfolio": {
      "cash": 6925,
      "positions": [
        {
          "symbol": "AAPL",
          "quantity": 10,
          "averagePrice": 150,
          "currentPrice": 157.50
        },
        {
          "symbol": "MSFT",
          "quantity": 5,
          "averagePrice": 315,
          "currentPrice": 315
        }
      ],
      "totalValue": 10075
    },
    "rbcPortfolio": {
      "portfolioId": "rbc_port_456789",
      "initialValue": 10000,
      "currentValue": 10040,
      "totalReturn": 40,
      "totalReturnPercent": 0.4
    },
    "currentEvent": {
      "type": "character",
      "title": "The Oracle Speaks",
      "description": "Mysterious market guru predicts major sector rotation.",
      "impact": "mixed",
      "affectedSectors": ["Technology", "Healthcare"],
      "multiplier": 1.02,
      "roundNumber": 2,
      "timestamp": "2024-01-15T11:40:00.000Z"
    },
    "rounds": [
      {
        "roundNumber": 1,
        "event": {
          "type": "news",
          "title": "Tech Giant Reports Strong Earnings",
          "description": "Major technology company exceeds quarterly expectations, driving sector optimism.",
          "impact": "positive",
          "affectedSectors": ["Technology"],
          "multiplier": 1.05,
          "roundNumber": 1,
          "timestamp": "2024-01-15T11:35:00.000Z"
        },
        "playerActions": [
          {
            "symbol": "AAPL",
            "action": "buy",
            "quantity": 10,
            "price": 150,
            "value": 1500,
            "timestamp": "2024-01-15T11:36:00.000Z"
          },
          {
            "symbol": "MSFT",
            "action": "buy",
            "quantity": 5,
            "price": 315,
            "value": 1575,
            "timestamp": "2024-01-15T11:37:00.000Z"
          }
        ],
        "rbcPerformance": 0.002,
        "status": "completed"
      },
      {
        "roundNumber": 2,
        "event": {
          "type": "character",
          "title": "The Oracle Speaks",
          "description": "Mysterious market guru predicts major sector rotation.",
          "impact": "mixed",
          "affectedSectors": ["Technology", "Healthcare"],
          "multiplier": 1.02,
          "roundNumber": 2,
          "timestamp": "2024-01-15T11:40:00.000Z"
        },
        "playerActions": [],
        "rbcPerformance": 0,
        "status": "active"
      }
    ]
  },
  "timestamp": "2024-01-15T11:40:00.000Z"
}
```

### 5. Get Current Stock Prices

**Request:**
```http
GET /api/game/game_1705312200000_abc123def/stocks
```

**Response:**
```json
{
  "success": true,
  "stocks": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "price": 157.50,
      "previousPrice": 150.00,
      "change": 7.50,
      "changePercent": 5.00,
      "volume": 850000,
      "sector": "Technology",
      "lastUpdated": "2024-01-15T11:40:00.000Z"
    },
    {
      "symbol": "MSFT",
      "name": "Microsoft Corp.",
      "price": 315.00,
      "previousPrice": 300.00,
      "change": 15.00,
      "changePercent": 5.00,
      "volume": 650000,
      "sector": "Technology",
      "lastUpdated": "2024-01-15T11:40:00.000Z"
    },
    {
      "symbol": "GOOGL",
      "name": "Alphabet Inc.",
      "price": 2500.00,
      "previousPrice": 2500.00,
      "change": 0,
      "changePercent": 0,
      "volume": 150000,
      "sector": "Technology",
      "lastUpdated": "2024-01-15T11:40:00.000Z"
    }
  ],
  "timestamp": "2024-01-15T11:40:00.000Z"
}
```

## 🚨 Error Examples

### Missing API Keys
```json
{
  "error": "RBC API configuration missing",
  "message": "Please configure RBC_API_KEY and RBC_API_SECRET in environment variables",
  "timestamp": "2024-01-15T11:45:00.000Z"
}
```

### Invalid Portfolio ID
```json
{
  "error": "Portfolio not found",
  "message": "The requested portfolio does not exist",
  "timestamp": "2024-01-15T11:45:00.000Z"
}
```

### Insufficient Funds
```json
{
  "error": "Insufficient funds",
  "message": "Not enough cash to complete this trade",
  "timestamp": "2024-01-15T11:45:00.000Z"
}
```

### Game Not Found
```json
{
  "error": "Game not found",
  "message": "The requested game does not exist",
  "timestamp": "2024-01-15T11:45:00.000Z"
}
```

## 🔧 Frontend Integration

### JavaScript/React Example

```javascript
// Create RBC Portfolio
const createPortfolio = async (userId, goal, timeframe, initialDeposit) => {
  const response = await fetch('/api/rbc/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, goal, timeframe, initialDeposit })
  });
  return await response.json();
};

// Start Game
const startGame = async (userId, rbcPortfolioId) => {
  const response = await fetch('/api/game/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, rbcPortfolioId })
  });
  return await response.json();
};

// Execute Trade
const executeTrade = async (gameId, symbol, action, quantity) => {
  const response = await fetch(`/api/game/${gameId}/trade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, action, quantity })
  });
  return await response.json();
};

// Get Game Status
const getGameStatus = async (gameId) => {
  const response = await fetch(`/api/game/${gameId}`);
  return await response.json();
};
```

## 📝 Notes

- All timestamps are in ISO 8601 format
- All monetary values are in USD
- Stock prices are updated in real-time based on events
- Game sessions are stored in memory (use Redis for production)
- CORS is configured for localhost:3000 by default
- All API calls are logged for debugging purposes
