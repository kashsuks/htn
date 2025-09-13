const { MongoClient } = require('mongodb');

class MongoDBService {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      return;
    }

    try {
      const connectionString = process.env.MONGODB_URI || 'mongodb+srv://ksukshavasi_db_user:iTnAgh7eaIMgkRLO@stock-fighter.c2rag40.mongodb.net/?retryWrites=true&w=majority&appName=stock-fighter';
      
      this.client = new MongoClient(connectionString);

      await this.client.connect();
      this.db = this.client.db('stock-fighter');
      this.isConnected = true;
      
      console.log('✅ Connected to MongoDB successfully');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('📤 Disconnected from MongoDB');
    }
  }

  // User Profile Operations
  async createUser(userProfile) {
    await this.connect();
    
    const usersCollection = this.db.collection('users');
    
    const newUser = {
      userId: userProfile.userId,
      email: userProfile.email,
      name: userProfile.name,
      picture: userProfile.picture,
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
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      await usersCollection.insertOne(newUser);
      console.log(`✅ MongoDB: Created user ${userProfile.userId}`);
      
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
    } catch (error) {
      if (error.code === 11000) { // Duplicate key error
        throw new Error('User already exists');
      }
      throw error;
    }
  }

  async getUser(userId) {
    await this.connect();
    
    const usersCollection = this.db.collection('users');
    const user = await usersCollection.findOne({ userId });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    console.log(`✅ MongoDB: Retrieved user ${userId}`);
    
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
    await this.connect();
    
    const usersCollection = this.db.collection('users');
    
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    const result = await usersCollection.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      throw new Error('User not found');
    }

    console.log(`✅ MongoDB: Updated user ${userId}`);
    return result.value;
  }

  async updateGameStats(userId, gameResult) {
    await this.connect();
    
    const usersCollection = this.db.collection('users');
    
    // First get the current user to calculate new stats
    const currentUser = await usersCollection.findOne({ userId });
    if (!currentUser) {
      throw new Error('User not found');
    }
    
    const newGamesPlayed = (currentUser.gamesPlayed || 0) + 1;
    const newGamesWon = (currentUser.gamesWon || 0) + (gameResult.won ? 1 : 0);
    const newTotalScore = (currentUser.totalScore || 0) + gameResult.score;
    const newBestScore = Math.max(currentUser.bestScore || 0, gameResult.score);
    const newTotalProfit = (currentUser.totalProfit || 0) + (gameResult.score - 10000); // Assuming starting with $10,000
    const newAverageScore = newTotalScore / newGamesPlayed;
    const newWinRate = newGamesPlayed > 0 ? (newGamesWon / newGamesPlayed) * 100 : 0;

    const updateData = {
      gamesPlayed: newGamesPlayed,
      gamesWon: newGamesWon,
      totalScore: newTotalScore,
      bestScore: newBestScore,
      totalProfit: newTotalProfit,
      averageScore: newAverageScore,
      winRate: newWinRate,
      updatedAt: new Date()
    };

    const result = await usersCollection.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    console.log(`✅ MongoDB: Updated game stats for user ${userId}`);
    
    // Return the user profile in the format expected by the frontend
    return {
      userId: result.value.userId,
      email: result.value.email,
      name: result.value.name,
      picture: result.value.picture,
      gameStats: {
        totalGamesPlayed: result.value.gamesPlayed || 0,
        totalWins: result.value.gamesWon || 0,
        totalLosses: (result.value.gamesPlayed || 0) - (result.value.gamesWon || 0),
        bestScore: result.value.bestScore || 0,
        totalProfit: result.value.totalProfit || 0,
        averageScore: result.value.averageScore || 0,
        winRate: result.value.winRate || 0
      },
      achievements: result.value.achievements || [],
      preferences: result.value.preferences || {
        theme: 'dark',
        notifications: true,
        difficulty: 'medium'
      }
    };
  }

  async getAllUsers() {
    await this.connect();
    
    const usersCollection = this.db.collection('users');
    const users = await usersCollection.find({}).toArray();
    
    console.log(`✅ MongoDB: Retrieved all users (${users.length} users)`);
    return users;
  }

  async addAchievement(userId, achievement) {
    await this.connect();
    
    const usersCollection = this.db.collection('users');
    
    const result = await usersCollection.findOneAndUpdate(
      { userId },
      { 
        $push: { achievements: achievement },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      throw new Error('User not found');
    }

    console.log(`✅ MongoDB: Added achievement ${achievement.id} to user ${userId}`);
    return result.value;
  }

  // Stock Events Operations
  async saveStockEvent(eventData) {
    await this.connect();
    
    const stockEventsCollection = this.db.collection('stockEvents');
    
    const stockEvent = {
      ...eventData,
      timestamp: new Date(),
      createdAt: new Date()
    };

    await stockEventsCollection.insertOne(stockEvent);
    console.log(`✅ MongoDB: Saved stock event for ${eventData.symbol || 'unknown'}`);
    return stockEvent;
  }

  async getStockEvents(symbol, timeRange = null) {
    await this.connect();
    
    const stockEventsCollection = this.db.collection('stockEvents');
    
    let query = { symbol };
    if (timeRange) {
      query.timestamp = {
        $gte: timeRange.start,
        $lte: timeRange.end
      };
    }

    const events = await stockEventsCollection
      .find(query)
      .sort({ timestamp: 1 })
      .toArray();

    console.log(`✅ MongoDB: Retrieved ${events.length} stock events for ${symbol}`);
    return events;
  }

  // Game Sessions Operations
  async saveGameSession(sessionData) {
    await this.connect();
    
    const gameSessionsCollection = this.db.collection('gameSessions');
    
    const gameSession = {
      ...sessionData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await gameSessionsCollection.insertOne(gameSession);
    console.log(`✅ MongoDB: Saved game session ${sessionData.sessionId || 'unknown'}`);
    return gameSession;
  }

  async getGameSessions(userId, limit = 10) {
    await this.connect();
    
    const gameSessionsCollection = this.db.collection('gameSessions');
    
    const sessions = await gameSessionsCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    console.log(`✅ MongoDB: Retrieved ${sessions.length} game sessions for user ${userId}`);
    return sessions;
  }

  // Trading Records Operations
  async saveTradingRecord(tradingData) {
    await this.connect();
    
    const tradingRecordsCollection = this.db.collection('tradingRecords');
    
    const tradingRecord = {
      ...tradingData,
      timestamp: new Date(),
      createdAt: new Date()
    };

    await tradingRecordsCollection.insertOne(tradingRecord);
    console.log(`✅ MongoDB: Saved trading record for ${tradingData.userId || 'unknown'}`);
    return tradingRecord;
  }

  async getTradingRecords(userId, limit = 50) {
    await this.connect();
    
    const tradingRecordsCollection = this.db.collection('tradingRecords');
    
    const records = await tradingRecordsCollection
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    console.log(`✅ MongoDB: Retrieved ${records.length} trading records for user ${userId}`);
    return records;
  }
}

// Export singleton instance
module.exports = new MongoDBService();
