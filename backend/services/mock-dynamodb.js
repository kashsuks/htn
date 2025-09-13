// Mock DynamoDB service for development - stores data in memory
class MockDynamoDBService {
  constructor() {
    this.users = new Map();
  }

  async createUser(userData) {
    const userId = userData.userId;
    if (this.users.has(userId)) {
      throw new Error('User already exists');
    }

    const newUser = {
      userId,
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
      gamesPlayed: 0,
      gamesWon: 0,
      totalScore: 0,
      bestScore: 0,
      totalProfit: 0,
      averageScore: 0,
      winRate: 0,
      achievements: [],
      preferences: {
        theme: 'dark',
        notifications: true,
        difficulty: 'medium'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.users.set(userId, newUser);
    console.log(`✅ Mock: Created user ${userId}`);
    
    // Return the user profile in the format expected by the frontend
    return {
      userId: newUser.userId,
      email: newUser.email,
      name: newUser.name,
      picture: newUser.picture,
      gameStats: {
        totalGamesPlayed: 0,
        totalWins: 0,
        totalLosses: 0,
        bestScore: 0,
        totalProfit: 0,
        averageScore: 0,
        winRate: 0
      },
      achievements: [],
      preferences: newUser.preferences
    };
  }

  async getUser(userId) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    console.log(`✅ Mock: Retrieved user ${userId}`);
    
    // Return the user profile in the format expected by the frontend
    return {
      userId: user.userId,
      email: user.email,
      name: user.name,
      picture: user.picture,
      gameStats: {
        totalGamesPlayed: user.gamesPlayed || 0,
        totalWins: user.gamesWon || 0,
        totalLosses: (user.gamesPlayed || 0) - (user.gamesWon || 0),
        bestScore: user.bestScore || 0,
        totalProfit: user.totalProfit || 0,
        averageScore: user.averageScore || 0,
        winRate: user.winRate || 0
      },
      achievements: user.achievements || [],
      preferences: user.preferences || {
        theme: 'dark',
        notifications: true,
        difficulty: 'medium'
      }
    };
  }

  async updateUser(userId, updates) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.users.set(userId, updatedUser);
    console.log(`✅ Mock: Updated user ${userId}`);
    return updatedUser;
  }

  async updateGameStats(userId, gameResult) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const newGamesPlayed = (user.gamesPlayed || 0) + 1;
    const newGamesWon = (user.gamesWon || 0) + (gameResult.won ? 1 : 0);
    const newTotalScore = (user.totalScore || 0) + gameResult.score;
    const newBestScore = Math.max(user.bestScore || 0, gameResult.score);
    const newTotalProfit = (user.totalProfit || 0) + (gameResult.score - 10000); // Assuming starting with $10,000
    const newAverageScore = newTotalScore / newGamesPlayed;
    const newWinRate = newGamesPlayed > 0 ? (newGamesWon / newGamesPlayed) * 100 : 0;

    const updatedUser = {
      ...user,
      gamesPlayed: newGamesPlayed,
      gamesWon: newGamesWon,
      totalScore: newTotalScore,
      bestScore: newBestScore,
      totalProfit: newTotalProfit,
      averageScore: newAverageScore,
      winRate: newWinRate,
      updatedAt: new Date().toISOString()
    };

    this.users.set(userId, updatedUser);
    console.log(`✅ Mock: Updated game stats for user ${userId}`);
    
    // Return the user profile in the format expected by the frontend
    return {
      userId: updatedUser.userId,
      email: updatedUser.email,
      name: updatedUser.name,
      picture: updatedUser.picture,
      gameStats: {
        totalGamesPlayed: updatedUser.gamesPlayed || 0,
        totalWins: updatedUser.gamesWon || 0,
        totalLosses: (updatedUser.gamesPlayed || 0) - (updatedUser.gamesWon || 0),
        bestScore: updatedUser.bestScore || 0,
        totalProfit: updatedUser.totalProfit || 0,
        averageScore: updatedUser.averageScore || 0,
        winRate: updatedUser.winRate || 0
      },
      achievements: updatedUser.achievements || [],
      preferences: updatedUser.preferences || {
        theme: 'dark',
        notifications: true,
        difficulty: 'medium'
      }
    };
  }

  async getAllUsers() {
    console.log(`✅ Mock: Retrieved all users (${this.users.size} users)`);
    return Array.from(this.users.values());
  }

  async addAchievement(userId, achievement) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...user,
      achievements: [...(user.achievements || []), achievement],
      updatedAt: new Date().toISOString()
    };

    this.users.set(userId, updatedUser);
    console.log(`✅ Mock: Added achievement ${achievement.id} to user ${userId}`);
    return updatedUser;
  }
}

// Export singleton instance
module.exports = new MockDynamoDBService();
