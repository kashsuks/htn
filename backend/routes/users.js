const express = require('express');
const router = express.Router();
const dbService = require('../services/mongodb');
const mockDynamoDBService = require('../services/mock-dynamodb');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Check MongoDB connection and fallback if needed
dbService.connect().catch(() => {
  console.log('📝 Falling back to mock database for users route');
  dbService = mockDynamoDBService;
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const userProfile = await dbService.getUser(userId);
    
    res.json(userProfile);
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User profile not found' });
    }
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update user profile
router.post('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { name, email, picture } = req.body;
    
    // Check if profile already exists
    let userProfile;
    try {
      userProfile = await dbService.getUser(userId);
      // Update existing profile
      userProfile = await dbService.updateUser(userId, {
        name,
        email,
        picture
      });
    } catch (error) {
      if (error.message === 'User not found') {
        // Create new profile
        userProfile = await dbService.createUser({
          userId,
          name,
          email,
          picture
        });
      } else {
        throw error;
      }
    }
    
    res.json(userProfile);
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user preferences
router.patch('/profile/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { preferences } = req.body;
    
    const userProfile = await dbService.updateUser(userId, {
      preferences
    });
    
    res.json(userProfile);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record game result
router.post('/game-result', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const gameResult = req.body;
    
    const userProfile = await dbService.updateGameStats(userId, gameResult);
    
    // Check for achievements
    await checkAndAwardAchievements(userId, gameResult, userProfile);
    
    res.json({ success: true, userProfile });
  } catch (error) {
    console.error('Error recording game result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const allUsers = await dbService.getAllUsers();
    
    // Sort by best score and limit results
    const leaderboard = allUsers
      .sort((a, b) => (b.bestScore || 0) - (a.bestScore || 0))
      .slice(0, limit)
      .map(user => ({
        name: user.name,
        bestScore: user.bestScore || 0,
        gamesPlayed: user.gamesPlayed || 0,
        gamesWon: user.gamesWon || 0,
        winRate: user.gamesPlayed > 0 ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0
      }));
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user achievements
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const userProfile = await dbService.getUser(userId);
    
    res.json(userProfile.achievements || []);
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User profile not found' });
    }
    console.error('Error fetching user achievements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's trading records
router.get('/trading-records', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const limit = parseInt(req.query.limit) || 50;
    
    const tradingRecords = await dbService.getTradingRecords(userId, limit);
    
    res.json({
      success: true,
      tradingRecords,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching trading records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's game sessions
router.get('/game-sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const limit = parseInt(req.query.limit) || 10;
    
    const gameSessions = await dbService.getGameSessions(userId, limit);
    
    res.json({
      success: true,
      gameSessions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching game sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save trading record
router.post('/trading-record', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const tradingData = {
      ...req.body,
      userId
    };
    
    const tradingRecord = await dbService.saveTradingRecord(tradingData);
    
    res.status(201).json({
      success: true,
      message: 'Trading record saved successfully',
      tradingRecord,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving trading record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save game session
router.post('/game-session', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const sessionData = {
      ...req.body,
      userId
    };
    
    const gameSession = await dbService.saveGameSession(sessionData);
    
    res.status(201).json({
      success: true,
      message: 'Game session saved successfully',
      gameSession,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving game session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to check and award achievements
async function checkAndAwardAchievements(userId, gameResult, userProfile) {
  const achievements = [];
  const existingAchievements = userProfile.achievements || [];
  const existingIds = existingAchievements.map(a => a.id);
  
  // First Win Achievement
  if (userProfile.gamesWon === 1 && !existingIds.includes('first_win')) {
    achievements.push({
      id: 'first_win',
      name: 'First Victory',
      description: 'Win your first trading battle',
      icon: '🏆',
      rarity: 'common',
      earnedAt: new Date().toISOString()
    });
  }
  
  // Profitable Trader Achievement
  if (gameResult.score > 11000 && !existingIds.includes('profitable_trader')) {
    achievements.push({
      id: 'profitable_trader',
      name: 'Profitable Trader',
      description: 'Earn over $1,000 profit in a single game',
      icon: '💰',
      rarity: 'uncommon',
      earnedAt: new Date().toISOString()
    });
  }
  
  // Master Trader Achievement
  if (gameResult.score > 15000 && !existingIds.includes('master_trader')) {
    achievements.push({
      id: 'master_trader',
      name: 'Master Trader',
      description: 'Earn over $5,000 profit in a single game',
      icon: '🎯',
      rarity: 'rare',
      earnedAt: new Date().toISOString()
    });
  }
  
  // Win Streak Achievement
  const winRate = userProfile.gamesPlayed > 0 ? (userProfile.gamesWon / userProfile.gamesPlayed) * 100 : 0;
  if (userProfile.gamesWon >= 5 && winRate >= 80 && !existingIds.includes('win_streak')) {
    achievements.push({
      id: 'win_streak',
      name: 'Winning Streak',
      description: 'Maintain an 80% win rate with at least 5 wins',
      icon: '🔥',
      rarity: 'epic',
      earnedAt: new Date().toISOString()
    });
  }
  
  // Veteran Achievement
  if (userProfile.gamesPlayed >= 50 && !existingIds.includes('veteran')) {
    achievements.push({
      id: 'veteran',
      name: 'Veteran Trader',
      description: 'Play 50 trading battles',
      icon: '⭐',
      rarity: 'rare',
      earnedAt: new Date().toISOString()
    });
  }
  
  // Award new achievements
  for (const achievement of achievements) {
    try {
      await dbService.addAchievement(userId, achievement);
    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  }
}

module.exports = router;
