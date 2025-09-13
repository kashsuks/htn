# InvestEase Showdown Backend

A Node.js Express backend for the InvestEase Showdown trading simulation game, integrating with the RBC InvestEase API for a Street Fighter-inspired 3-round battle format.

## 🎮 Game Overview

Students compete against RBC InvestEase in a 3-round trading battle where:
- **Round 1**: Student makes manual trading decisions based on AI-generated events
- **Round 2**: AI opponent trades with the same market conditions  
- **Round 3**: Final showdown with RBC InvestEase's steady growth

## 🚀 Features

- **RBC InvestEase API Integration**: Create portfolios, track performance, manage contributions
- **3-Round Battle System**: Street Fighter-inspired gameplay mechanics
- **Real-time Stock Simulation**: Dynamic price changes based on events
- **AI Event Generation**: News events and character announcements affecting markets
- **Portfolio Management**: Complete trading system with buy/sell operations
- **Performance Tracking**: Compare student vs RBC InvestEase results

## 📋 API Endpoints

### RBC InvestEase Integration

#### Create Portfolio
```http
POST /api/rbc/portfolio
Content-Type: application/json

{
  "userId": "user123",
  "goal": "retirement",
  "timeframe": 30,
  "initialDeposit": 10000
}
```

#### Get Portfolio Details
```http
GET /api/rbc/portfolio/:portfolioId
```

#### Add Contribution
```http
POST /api/rbc/portfolio/:portfolioId/contribute
Content-Type: application/json

{
  "amount": 1000
}
```

#### Get Performance Data
```http
GET /api/rbc/portfolio/:portfolioId/performance?period=1M
```

#### Get Asset Allocations
```http
GET /api/rbc/portfolio/:portfolioId/allocations
```

#### Get Available Goals
```http
GET /api/rbc/goals
```

### Game Management

#### Start New Game
```http
POST /api/game/start
Content-Type: application/json

{
  "userId": "user123",
  "rbcPortfolioId": "portfolio456"
}
```

#### Get Game Status
```http
GET /api/game/:gameId
```

#### Execute Trade
```http
POST /api/game/:gameId/trade
Content-Type: application/json

{
  "symbol": "AAPL",
  "action": "buy",
  "quantity": 10
}
```

#### Advance to Next Round
```http
POST /api/game/:gameId/next-round
```

#### Get Current Stock Prices
```http
GET /api/game/:gameId/stocks
```

## 🛠 Setup & Installation

### Prerequisites
- Node.js 14+ 
- npm or yarn
- RBC InvestEase API credentials

### Installation

1. **Clone and install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your RBC API credentials
   ```

3. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

### Environment Variables

```bash
# RBC InvestEase API Configuration
RBC_API_KEY=your_rbc_api_key_here
RBC_API_SECRET=your_rbc_api_secret_here
RBC_BASE_URL=https://api.rbc.com/investease

# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Game Configuration
INITIAL_DEPOSIT=10000
GAME_DURATION_SECONDS=30
ROUNDS=3
```

## 🎯 Game Flow

### 1. Game Initialization
- Student creates RBC InvestEase portfolio with goal and timeframe
- Backend starts new game session with 3 rounds
- First round event is generated (news/character event)

### 2. Round Execution
- **Student Round**: 30 seconds to make trading decisions
- **AI Round**: AI opponent trades with same market conditions
- **RBC Round**: Steady growth simulation continues

### 3. Event System
- **News Events**: Financial news affecting specific sectors
- **Character Events**: Fun announcements with market impact
- **Market Volatility**: Dynamic price changes based on events

### 4. Scoring & Results
- Compare final portfolio values
- Calculate returns and performance metrics
- Determine round and overall winner

## 📊 Stock Simulation

The backend simulates a realistic stock market with:
- **10 Major Stocks**: AAPL, MSFT, GOOGL, AMZN, TSLA, JPM, JNJ, XOM, WMT, PG
- **Sector-based Events**: Technology, Finance, Healthcare, Energy, Consumer
- **Dynamic Pricing**: Real-time price updates based on events
- **Volume Simulation**: Realistic trading volume patterns

## 🔧 Development

### Project Structure
```
backend/
├── server.js              # Main server file
├── routes/
│   ├── rbc.js            # RBC InvestEase API routes
│   └── game.js           # Game management routes
├── package.json
├── env.example
└── README.md
```

### Error Handling
- Comprehensive error responses with timestamps
- API key validation
- Input validation for all endpoints
- Detailed logging for debugging

### CORS Configuration
- Configurable CORS origins
- Credentials support for frontend integration
- Development and production settings

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```bash
docker build -t investease-backend .
docker run -p 3000:3000 investease-backend
```

## 📝 Example Usage

### Complete Game Flow

1. **Create RBC Portfolio**
   ```javascript
   const response = await fetch('/api/rbc/portfolio', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       userId: 'student123',
       goal: 'retirement',
       timeframe: 30,
       initialDeposit: 10000
     })
   });
   const { portfolio } = await response.json();
   ```

2. **Start Game**
   ```javascript
   const gameResponse = await fetch('/api/game/start', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       userId: 'student123',
       rbcPortfolioId: portfolio.portfolioId
     })
   });
   const { game } = await gameResponse.json();
   ```

3. **Execute Trades**
   ```javascript
   const tradeResponse = await fetch(`/api/game/${game.gameId}/trade`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       symbol: 'AAPL',
       action: 'buy',
       quantity: 10
     })
   });
   ```

4. **Advance Rounds**
   ```javascript
   const nextRoundResponse = await fetch(`/api/game/${game.gameId}/next-round`, {
     method: 'POST'
   });
   ```

## 🔍 Health Check

```http
GET /health
```

Returns server status, uptime, memory usage, and environment information.

## 📞 Support

For questions or issues during the hackathon, check the logs for detailed error messages and ensure your RBC API credentials are properly configured.

## 🏆 Hackathon Notes

- All API calls are logged for debugging
- Error responses include helpful messages
- CORS is configured for localhost:3000 (frontend)
- In-memory storage for game sessions (use Redis in production)
- Mock RBC API responses if credentials are not available
