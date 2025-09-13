const express = require('express');
const router = express.Router();
const dynamoDBService = require('../services/dynamodb');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const userProfile = await dynamoDBService.getUser(userId);
    
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
      userProfile = await dynamoDBService.getUser(userId);
      // Update existing profile
      userProfile = await dynamoDBService.updateUser(userId, {
        name,
        email,
        picture
      });
    } catch (error) {
      if (error.message === 'User not found') {
        // Create new profile
        userProfile = await dynamoDBService.createUser({
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
    
    const userProfile = await dynamoDBService.updateUser(userId, {
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
    
    const userProfile = await dynamoDBService.updateGameStats(userId, gameResult);
    
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
    const allUsers = await dynamoDBService.getAllUsers();
    
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
    const userProfile = await dynamoDBService.getUser(userId);
    
    res.json(userProfile.achievements || []);
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User profile not found' });
    }
    console.error('Error fetching user achievements:', error);
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
      await dynamoDBService.addAchievement(userId, achievement);
    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  }
}

module.exports = router;
