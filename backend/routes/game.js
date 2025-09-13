const express = require('express');
const router = express.Router();

// In-memory storage for game sessions (in production, use Redis or database)
const gameSessions = new Map();
const stockPrices = new Map();

// Initialize sample stock data that matches your frontend
const initializeStocks = () => {
  const stocks = [
    { symbol: 'TECH', name: 'TechCorp', price: 150.00, change: 0, sector: 'Technology' },
    { symbol: 'ENER', name: 'EnergyPlus', price: 89.50, change: 0, sector: 'Energy' },
    { symbol: 'HEAL', name: 'HealthMax', price: 210.75, change: 0, sector: 'Healthcare' },
    { symbol: 'FINA', name: 'FinanceOne', price: 95.25, change: 0, sector: 'Finance' },
    { symbol: 'CONS', name: 'ConsumerCo', price: 75.00, change: 0, sector: 'Consumer' },
    { symbol: 'INDU', name: 'Industrial', price: 120.50, change: 0, sector: 'Industrial' }
  ];

  stocks.forEach(stock => {
    stockPrices.set(stock.symbol, {
      ...stock,
      previousPrice: stock.price,
      change: 0,
      changePercent: 0,
      volume: Math.floor(Math.random() * 1000000) + 100000,
      lastUpdated: new Date().toISOString()
    });
  });
};

// Initialize stocks on startup
initializeStocks();

// POST /game/start - Start a new 3-round battle game
router.post('/start', (req, res) => {
  try {
    const { gameConfig, rbcClientId, rbcPortfolioId } = req.body;

    if (!gameConfig || !rbcClientId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'gameConfig and rbcClientId are required',
        timestamp: new Date().toISOString()
      });
    }

    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const gameSession = {
      gameId,
      gameConfig,
      rbcClientId,
      rbcPortfolioId,
      status: 'active',
      currentRound: 1,
      totalRounds: 3,
      playerPortfolio: {
        cash: gameConfig.initialCash || 10000,
        positions: {},
        totalValue: gameConfig.initialCash || 10000
      },
      rbcPortfolio: {
        portfolioId: rbcPortfolioId,
        initialValue: gameConfig.initialCash || 10000,
        currentValue: gameConfig.initialCash || 10000,
        totalReturn: 0,
        totalReturnPercent: 0
      },
      rounds: [],
      events: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    gameSessions.set(gameId, gameSession);

    // Generate first round event
    const roundEvent = generateRoundEvent(1);
    gameSession.events.push(roundEvent);
    gameSession.rounds.push({
      roundNumber: 1,
      event: roundEvent,
      playerActions: [],
      rbcPerformance: 0,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Game started successfully',
      game: {
        gameId,
        gameConfig,
        currentRound: 1,
        totalRounds: 3,
        playerPortfolio: gameSession.playerPortfolio,
        rbcPortfolio: gameSession.rbcPortfolio,
        currentEvent: roundEvent,
        status: 'active'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({
      error: 'Failed to start game',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /game/:gameId - Get game status
router.get('/:gameId', (req, res) => {
  try {
    const { gameId } = req.params;
    const game = gameSessions.get(gameId);

    if (!game) {
      return res.status(404).json({
        error: 'Game not found',
        message: 'The requested game does not exist',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      game: {
        gameId: game.gameId,
        gameConfig: game.gameConfig,
        status: game.status,
        currentRound: game.currentRound,
        totalRounds: game.totalRounds,
        playerPortfolio: game.playerPortfolio,
        rbcPortfolio: game.rbcPortfolio,
        currentEvent: game.events[game.events.length - 1],
        rounds: game.rounds,
        createdAt: game.createdAt,
        lastUpdated: game.lastUpdated
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({
      error: 'Failed to fetch game',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /game/:gameId/trade - Execute a trade
router.post('/:gameId/trade', (req, res) => {
  try {
    const { gameId } = req.params;
    const { symbol, action, quantity = 1 } = req.body;

    const game = gameSessions.get(gameId);
    if (!game) {
      return res.status(404).json({
        error: 'Game not found',
        message: 'The requested game does not exist',
        timestamp: new Date().toISOString()
      });
    }

    if (game.status !== 'active') {
      return res.status(400).json({
        error: 'Game not active',
        message: 'Cannot trade in a completed or inactive game',
        timestamp: new Date().toISOString()
      });
    }

    const stock = stockPrices.get(symbol);
    if (!stock) {
      return res.status(404).json({
        error: 'Stock not found',
        message: 'The requested stock symbol does not exist',
        timestamp: new Date().toISOString()
      });
    }

    const tradeValue = stock.price * quantity;
    const currentRound = game.rounds[game.rounds.length - 1];

    if (action === 'buy') {
      if (game.playerPortfolio.cash < tradeValue) {
        return res.status(400).json({
          error: 'Insufficient funds',
          message: 'Not enough cash to complete this trade',
          timestamp: new Date().toISOString()
        });
      }

      game.playerPortfolio.cash -= tradeValue;
      game.playerPortfolio.positions[symbol] = (game.playerPortfolio.positions[symbol] || 0) + quantity;

    } else if (action === 'sell') {
      if (!game.playerPortfolio.positions[symbol] || game.playerPortfolio.positions[symbol] < quantity) {
        return res.status(400).json({
          error: 'Insufficient shares',
          message: 'Not enough shares to complete this trade',
          timestamp: new Date().toISOString()
        });
      }

      game.playerPortfolio.cash += tradeValue;
      game.playerPortfolio.positions[symbol] -= quantity;

      if (game.playerPortfolio.positions[symbol] === 0) {
        delete game.playerPortfolio.positions[symbol];
      }
    }

    // Update portfolio total value
    game.playerPortfolio.totalValue = game.playerPortfolio.cash + 
      Object.entries(game.playerPortfolio.positions).reduce((total, [symbol, shares]) => {
        const stock = stockPrices.get(symbol);
        return total + (stock ? stock.price * shares : 0);
      }, 0);

    // Record trade
    const trade = {
      symbol,
      action,
      quantity,
      price: stock.price,
      value: tradeValue,
      timestamp: new Date().toISOString()
    };

    currentRound.playerActions.push(trade);
    game.lastUpdated = new Date().toISOString();

    res.json({
      success: true,
      message: 'Trade executed successfully',
      trade,
      portfolio: game.playerPortfolio,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error executing trade:', error);
    res.status(500).json({
      error: 'Failed to execute trade',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /game/:gameId/next-round - Advance to next round
router.post('/:gameId/next-round', (req, res) => {
  try {
    const { gameId } = req.params;
    const game = gameSessions.get(gameId);

    if (!game) {
      return res.status(404).json({
        error: 'Game not found',
        message: 'The requested game does not exist',
        timestamp: new Date().toISOString()
      });
    }

    if (game.currentRound >= game.totalRounds) {
      return res.status(400).json({
        error: 'Game completed',
        message: 'All rounds have been completed',
        timestamp: new Date().toISOString()
      });
    }

    // Complete current round
    const currentRound = game.rounds[game.rounds.length - 1];
    currentRound.status = 'completed';
    currentRound.rbcPerformance = calculateRBCPerformance(game.rbcPortfolio, currentRound.event);

    // Advance to next round
    game.currentRound++;
    
    if (game.currentRound <= game.totalRounds) {
      const nextEvent = generateRoundEvent(game.currentRound);
      game.events.push(nextEvent);
      game.rounds.push({
        roundNumber: game.currentRound,
        event: nextEvent,
        playerActions: [],
        rbcPerformance: 0,
        status: 'active'
      });
    } else {
      // Game completed
      game.status = 'completed';
      game.lastUpdated = new Date().toISOString();
    }

    res.json({
      success: true,
      message: game.status === 'completed' ? 'Game completed' : 'Advanced to next round',
      game: {
        gameId: game.gameId,
        currentRound: game.currentRound,
        totalRounds: game.totalRounds,
        status: game.status,
        playerPortfolio: game.playerPortfolio,
        rbcPortfolio: game.rbcPortfolio,
        currentEvent: game.events[game.events.length - 1],
        rounds: game.rounds
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error advancing round:', error);
    res.status(500).json({
      error: 'Failed to advance round',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /game/:gameId/stocks - Get current stock prices
router.get('/:gameId/stocks', (req, res) => {
  try {
    const { gameId } = req.params;
    const game = gameSessions.get(gameId);

    if (!game) {
      return res.status(404).json({
        error: 'Game not found',
        message: 'The requested game does not exist',
        timestamp: new Date().toISOString()
      });
    }

    const stocks = Array.from(stockPrices.values());
    
    res.json({
      success: true,
      stocks,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({
      error: 'Failed to fetch stocks',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /game/:gameId/update-stocks - Update stock prices (for events)
router.post('/:gameId/update-stocks', (req, res) => {
  try {
    const { gameId } = req.params;
    const { event } = req.body;

    const game = gameSessions.get(gameId);
    if (!game) {
      return res.status(404).json({
        error: 'Game not found',
        message: 'The requested game does not exist',
        timestamp: new Date().toISOString()
      });
    }

    // Apply event to stock prices
    if (event) {
      applyEventToStocks(event);
    }

    const stocks = Array.from(stockPrices.values());
    
    res.json({
      success: true,
      stocks,
      event,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating stocks:', error);
    res.status(500).json({
      error: 'Failed to update stocks',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to generate round events
function generateRoundEvent(roundNumber) {
  const events = [
    {
      type: 'news',
      title: 'Tech Giant Reports Strong Earnings',
      description: 'Major technology company exceeds quarterly expectations, driving sector optimism.',
      impact: 'positive',
      affectedSectors: ['Technology'],
      multiplier: 1.05
    },
    {
      type: 'news',
      title: 'Federal Reserve Hints at Rate Changes',
      description: 'Central bank signals potential policy shifts affecting market sentiment.',
      impact: 'negative',
      affectedSectors: ['Finance'],
      multiplier: 0.95
    },
    {
      type: 'news',
      title: 'Oil Prices Surge on Supply Concerns',
      description: 'Energy sector sees significant gains as crude oil prices reach new highs.',
      impact: 'positive',
      affectedSectors: ['Energy'],
      multiplier: 1.08
    },
    {
      type: 'character',
      title: 'The Oracle Speaks',
      description: 'Mysterious market guru predicts major sector rotation.',
      impact: 'mixed',
      affectedSectors: ['Technology', 'Healthcare'],
      multiplier: 1.02
    },
    {
      type: 'news',
      title: 'Healthcare Breakthrough Announced',
      description: 'Major pharmaceutical company announces promising drug trial results.',
      impact: 'positive',
      affectedSectors: ['Healthcare'],
      multiplier: 1.06
    },
    {
      type: 'character',
      title: 'Market Bear Roars',
      description: 'Famous bear market analyst warns of overvaluation.',
      impact: 'negative',
      affectedSectors: ['Technology', 'Finance'],
      multiplier: 0.98
    }
  ];

  const event = events[Math.floor(Math.random() * events.length)];
  
  // Apply event to stock prices
  applyEventToStocks(event);

  return {
    ...event,
    roundNumber,
    timestamp: new Date().toISOString()
  };
}

// Helper function to apply event to stock prices
function applyEventToStocks(event) {
  stockPrices.forEach((stock, symbol) => {
    if (event.affectedSectors.includes(stock.sector)) {
      const change = (Math.random() - 0.5) * 0.1 * event.multiplier; // ±5% change
      const newPrice = stock.price * (1 + change);
      
      stock.previousPrice = stock.price;
      stock.price = Math.max(newPrice, 0.01); // Ensure price doesn't go below $0.01
      stock.change = stock.price - stock.previousPrice;
      stock.changePercent = (stock.change / stock.previousPrice) * 100;
      stock.lastUpdated = new Date().toISOString();
    }
  });
}

// Helper function to calculate RBC performance
function calculateRBCPerformance(rbcPortfolio, event) {
  // Simulate steady growth with some volatility
  const baseGrowth = 0.02; // 2% base growth
  const volatility = (Math.random() - 0.5) * 0.01; // ±0.5% volatility
  const eventImpact = event.impact === 'positive' ? 0.01 : event.impact === 'negative' ? -0.01 : 0;
  
  const totalGrowth = baseGrowth + volatility + eventImpact;
  const newValue = rbcPortfolio.currentValue * (1 + totalGrowth);
  
  rbcPortfolio.currentValue = newValue;
  rbcPortfolio.totalReturn = newValue - rbcPortfolio.initialValue;
  rbcPortfolio.totalReturnPercent = (rbcPortfolio.totalReturn / rbcPortfolio.initialValue) * 100;
  
  return totalGrowth;
}

module.exports = router;