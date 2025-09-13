const express = require('express');
const router = express.Router();
const mongoDBService = require('../services/mongodb');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Save stock event
router.post('/save', optionalAuth, async (req, res) => {
  try {
    const stockEvent = await mongoDBService.saveStockEvent(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Stock event saved successfully',
      stockEvent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving stock event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get stock events for a symbol
router.get('/:symbol', optionalAuth, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { startTime, endTime } = req.query;
    
    let timeRange = null;
    if (startTime && endTime) {
      timeRange = {
        start: new Date(startTime),
        end: new Date(endTime)
      };
    }
    
    const stockEvents = await mongoDBService.getStockEvents(symbol, timeRange);
    
    res.json({
      success: true,
      symbol,
      stockEvents,
      count: stockEvents.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stock events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent stock events (last 24 hours)
router.get('/recent/:symbol', optionalAuth, async (req, res) => {
  try {
    const { symbol } = req.params;
    const hours = parseInt(req.query.hours) || 24;
    
    const timeRange = {
      start: new Date(Date.now() - (hours * 60 * 60 * 1000)),
      end: new Date()
    };
    
    const stockEvents = await mongoDBService.getStockEvents(symbol, timeRange);
    
    res.json({
      success: true,
      symbol,
      stockEvents,
      count: stockEvents.length,
      timeRange: {
        start: timeRange.start.toISOString(),
        end: timeRange.end.toISOString(),
        hours
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching recent stock events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get stock price history for charting
router.get('/history/:symbol', optionalAuth, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '1d', interval = '1m' } = req.query;
    
    // Calculate time range based on period
    let hours;
    switch (period) {
      case '1h': hours = 1; break;
      case '4h': hours = 4; break;
      case '1d': hours = 24; break;
      case '1w': hours = 24 * 7; break;
      case '1m': hours = 24 * 30; break;
      default: hours = 24;
    }
    
    const timeRange = {
      start: new Date(Date.now() - (hours * 60 * 60 * 1000)),
      end: new Date()
    };
    
    const stockEvents = await mongoDBService.getStockEvents(symbol, timeRange);
    
    // Process events for charting (group by interval if needed)
    const chartData = stockEvents.map(event => ({
      timestamp: event.timestamp,
      price: event.price,
      volume: event.volume || 0,
      change: event.change || 0,
      changePercent: event.changePercent || 0
    }));
    
    res.json({
      success: true,
      symbol,
      period,
      interval,
      chartData,
      count: chartData.length,
      timeRange: {
        start: timeRange.start.toISOString(),
        end: timeRange.end.toISOString(),
        hours
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stock history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get market overview (all symbols)
router.get('/market/overview', optionalAuth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // This would typically aggregate data from stock events
    // For now, return a placeholder structure
    res.json({
      success: true,
      message: 'Market overview endpoint - implementation needed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching market overview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
