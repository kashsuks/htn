console.log('☁️ Using AWS DynamoDB service');

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.DYNAMODB_TABLE_NAME || 'stock-fighter';

class DynamoDBService {
    async createUser(userProfile) {
      const params = {
        TableName: tableName,
        Item: {
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        ConditionExpression: 'attribute_not_exists(userId)'
      };

      try {
        await docClient.send(new PutCommand(params));
        
        // Return the user profile in the format expected by the frontend
        return {
          userId: params.Item.userId,
          email: params.Item.email,
          name: params.Item.name,
          picture: params.Item.picture,
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
          preferences: params.Item.preferences
        };
      } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
          throw new Error('User already exists');
        }
        throw error;
      }
    }

    async getUser(userId) {
      const params = {
        TableName: tableName,
        Key: { userId }
      };

      const result = await docClient.send(new GetCommand(params));
      if (!result.Item) {
        throw new Error('User not found');
      }
      
      // Return the user profile in the format expected by the frontend
      return {
        userId: result.Item.userId,
        email: result.Item.email,
        name: result.Item.name,
        picture: result.Item.picture,
        gameStats: {
          totalGamesPlayed: result.Item.gamesPlayed || 0,
          totalWins: result.Item.gamesWon || 0,
          totalLosses: (result.Item.gamesPlayed || 0) - (result.Item.gamesWon || 0),
          bestScore: result.Item.bestScore || 0,
          totalProfit: result.Item.totalProfit || 0,
          averageScore: result.Item.averageScore || 0,
          winRate: result.Item.winRate || 0
        },
        achievements: result.Item.achievements || [],
        preferences: result.Item.preferences || {
          theme: 'dark',
          notifications: true,
          difficulty: 'medium'
        }
      };
    }

    async updateUser(userId, updates) {
      const updateExpression = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      Object.keys(updates).forEach((key, index) => {
        updateExpression.push(`#attr${index} = :val${index}`);
        expressionAttributeNames[`#attr${index}`] = key;
        expressionAttributeValues[`:val${index}`] = updates[key];
      });

      updateExpression.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();

      const params = {
        TableName: tableName,
        Key: { userId },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      };

      const result = await docClient.send(new UpdateCommand(params));
      return result.Attributes;
    }

    async updateGameStats(userId, gameResult) {
      // First get the current user to calculate new stats
      const currentUser = await this.getUser(userId);
      
      const newGamesPlayed = (currentUser.gamesPlayed || 0) + 1;
      const newGamesWon = (currentUser.gamesWon || 0) + (gameResult.won ? 1 : 0);
      const newTotalScore = (currentUser.totalScore || 0) + gameResult.score;
      const newBestScore = Math.max(currentUser.bestScore || 0, gameResult.score);
      const newTotalProfit = (currentUser.totalProfit || 0) + (gameResult.score - 10000); // Assuming starting with $10,000
      const newAverageScore = newTotalScore / newGamesPlayed;
      const newWinRate = newGamesPlayed > 0 ? (newGamesWon / newGamesPlayed) * 100 : 0;

      const params = {
        TableName: tableName,
        Key: { userId },
        UpdateExpression: 'SET gamesPlayed = :gamesPlayed, gamesWon = :gamesWon, totalScore = :totalScore, bestScore = :bestScore, totalProfit = :totalProfit, averageScore = :averageScore, winRate = :winRate, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':gamesPlayed': newGamesPlayed,
          ':gamesWon': newGamesWon,
          ':totalScore': newTotalScore,
          ':bestScore': newBestScore,
          ':totalProfit': newTotalProfit,
          ':averageScore': newAverageScore,
          ':winRate': newWinRate,
          ':updatedAt': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
      };

      const result = await docClient.send(new UpdateCommand(params));
      
      // Return the user profile in the format expected by the frontend
      return {
        userId: result.Attributes.userId,
        email: result.Attributes.email,
        name: result.Attributes.name,
        picture: result.Attributes.picture,
        gameStats: {
          totalGamesPlayed: result.Attributes.gamesPlayed || 0,
          totalWins: result.Attributes.gamesWon || 0,
          totalLosses: (result.Attributes.gamesPlayed || 0) - (result.Attributes.gamesWon || 0),
          bestScore: result.Attributes.bestScore || 0,
          totalProfit: result.Attributes.totalProfit || 0,
          averageScore: result.Attributes.averageScore || 0,
          winRate: result.Attributes.winRate || 0
        },
        achievements: result.Attributes.achievements || [],
        preferences: result.Attributes.preferences || {
          theme: 'dark',
          notifications: true,
          difficulty: 'medium'
        }
      };
    }

    async getAllUsers() {
      const params = {
        TableName: tableName
      };

      const result = await docClient.send(new ScanCommand(params));
      return result.Items || [];
    }

    async addAchievement(userId, achievement) {
      const params = {
        TableName: tableName,
        Key: { userId },
        UpdateExpression: 'SET achievements = list_append(if_not_exists(achievements, :empty_list), :achievement), updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':achievement': [achievement],
          ':empty_list': [],
          ':updatedAt': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
      };

      const result = await docClient.send(new UpdateCommand(params));
      return result.Attributes;
    }
  }

module.exports = new DynamoDBService();
