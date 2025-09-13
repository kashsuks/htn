const express = require('express');
const router = express.Router();

// In-memory storage for RBC trading sessions
const rbcTradingSessions = new Map();

// POST /rbc-trading/start - Start RBC trading simulation
router.post('/start', (req, res) => {
  try {
    const { gameConfig, rbcClientId, rbcPortfolioId, roundNumber } = req.body;

    if (!gameConfig || !rbcClientId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'gameConfig and rbcClientId are required',
        timestamp: new Date().toISOString()
      });
    }

    const sessionId = `rbc_trading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const tradingSession = {
      sessionId,
      gameConfig,
      rbcClientId,
      rbcPortfolioId,
      roundNumber: roundNumber || 1,
      status: 'active',
      startTime: new Date().toISOString(),
      duration: 30000, // 30 seconds
      currentValue: gameConfig.initialCash || 10000,
      startValue: gameConfig.initialCash || 10000,
      trades: [],
      isAITurn: false,
      lastUpdated: new Date().toISOString()
    };

    rbcTradingSessions.set(sessionId, tradingSession);

    res.status(201).json({
      success: true,
      message: 'RBC trading session started',
      session: {
        sessionId,
        gameConfig,
        roundNumber: tradingSession.roundNumber,
        status: 'active',
        currentValue: tradingSession.currentValue,
        startValue: tradingSession.startValue,
        duration: tradingSession.duration,
        isAITurn: tradingSession.isAITurn
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error starting RBC trading session:', error);
    res.status(500).json({
      error: 'Failed to start RBC trading session',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /rbc-trading/:sessionId - Get trading session status
router.get('/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = rbcTradingSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Trading session not found',
        message: 'The requested trading session does not exist',
        timestamp: new Date().toISOString()
      });
    }

    // Calculate time remaining
    const now = new Date();
    const startTime = new Date(session.startTime);
    const elapsed = now.getTime() - startTime.getTime();
    const timeRemaining = Math.max(0, session.duration - elapsed);

    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        gameConfig: session.gameConfig,
        roundNumber: session.roundNumber,
        status: timeRemaining > 0 ? 'active' : 'completed',
        currentValue: session.currentValue,
        startValue: session.startValue,
        timeRemaining: Math.ceil(timeRemaining / 1000),
        totalTime: Math.ceil(session.duration / 1000),
        trades: session.trades,
        isAITurn: session.isAITurn,
        lastUpdated: session.lastUpdated
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching trading session:', error);
    res.status(500).json({
      error: 'Failed to fetch trading session',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /rbc-trading/:sessionId/complete - Complete trading session
router.post('/:sessionId/complete', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { finalValue } = req.body;

    const session = rbcTradingSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Trading session not found',
        message: 'The requested trading session does not exist',
        timestamp: new Date().toISOString()
      });
    }

    session.status = 'completed';
    session.currentValue = finalValue || session.currentValue;
    session.lastUpdated = new Date().toISOString();

    res.json({
      success: true,
      message: 'Trading session completed',
      session: {
        sessionId: session.sessionId,
        finalValue: session.currentValue,
        startValue: session.startValue,
        totalReturn: session.currentValue - session.startValue,
        totalReturnPercent: ((session.currentValue - session.startValue) / session.startValue) * 100,
        trades: session.trades,
        status: 'completed'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error completing trading session:', error);
    res.status(500).json({
      error: 'Failed to complete trading session',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /rbc-trading/:sessionId/ai-trade - Simulate AI trade
router.post('/:sessionId/ai-trade', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { stockSymbol, action, quantity, price } = req.body;

    const session = rbcTradingSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Trading session not found',
        message: 'The requested trading session does not exist',
        timestamp: new Date().toISOString()
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        error: 'Session not active',
        message: 'Cannot trade in a completed session',
        timestamp: new Date().toISOString()
      });
    }

    // Record AI trade
    const trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      action: action.toUpperCase(),
      stock: stockSymbol,
      shares: quantity,
      price: price,
      timestamp: Date.now()
    };

    session.trades.push(trade);
    session.lastUpdated = new Date().toISOString();

    res.json({
      success: true,
      message: 'AI trade recorded',
      trade,
      session: {
        sessionId: session.sessionId,
        currentValue: session.currentValue,
        trades: session.trades
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error recording AI trade:', error);
    res.status(500).json({
      error: 'Failed to record AI trade',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /rbc-trading/:sessionId/update-value - Update portfolio value
router.post('/:sessionId/update-value', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { newValue } = req.body;

    const session = rbcTradingSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Trading session not found',
        message: 'The requested trading session does not exist',
        timestamp: new Date().toISOString()
      });
    }

    session.currentValue = newValue;
    session.lastUpdated = new Date().toISOString();

    res.json({
      success: true,
      message: 'Portfolio value updated',
      session: {
        sessionId: session.sessionId,
        currentValue: session.currentValue,
        startValue: session.startValue,
        totalReturn: session.currentValue - session.startValue,
        totalReturnPercent: ((session.currentValue - session.startValue) / session.startValue) * 100
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating portfolio value:', error);
    res.status(500).json({
      error: 'Failed to update portfolio value',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
