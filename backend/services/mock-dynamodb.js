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
      achievements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.users.set(userId, newUser);
    console.log(`✅ Mock: Created user ${userId}`);
    return newUser;
  }

  async getUser(userId) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    console.log(`✅ Mock: Retrieved user ${userId}`);
    return user;
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

    const updatedUser = {
      ...user,
      gamesPlayed: user.gamesPlayed + 1,
      gamesWon: gameResult.won ? user.gamesWon + 1 : user.gamesWon,
      totalScore: user.totalScore + gameResult.score,
      bestScore: Math.max(user.bestScore, gameResult.score),
      updatedAt: new Date().toISOString()
    };

    this.users.set(userId, updatedUser);
    console.log(`✅ Mock: Updated game stats for user ${userId}`);
    return updatedUser;
  }

  async getAllUsers() {
    console.log(`✅ Mock: Retrieved all users (${this.users.size} users)`);
    return Array.from(this.users.values());
  }
}

// Export singleton instance
module.exports = new MockDynamoDBService();
