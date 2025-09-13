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
          achievements: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        ConditionExpression: 'attribute_not_exists(userId)'
      };

      try {
        await docClient.send(new PutCommand(params));
        return params.Item;
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
      return result.Item;
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
      const params = {
        TableName: tableName,
        Key: { userId },
        UpdateExpression: 'ADD gamesPlayed :one, gamesWon :won, totalScore :score SET bestScore = if_not_exists(bestScore, :zero), bestScore = if_not_exists(bestScore, :score), updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':one': 1,
          ':won': gameResult.won ? 1 : 0,
          ':score': gameResult.score,
          ':zero': 0,
          ':updatedAt': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
      };

      const result = await docClient.send(new UpdateCommand(params));
      return result.Attributes;
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
