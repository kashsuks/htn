require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

// Configuration for AWS DynamoDB
const config = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};
const client = new DynamoDBClient(config);

const tableName = process.env.DYNAMODB_TABLE_NAME || 'stock-fighter-users';

const tableParams = {
  TableName: tableName,
  KeySchema: [
    {
      AttributeName: 'userId',
      KeyType: 'HASH' // Partition key
    }
  ],
  AttributeDefinitions: [
    {
      AttributeName: 'userId',
      AttributeType: 'S'
    }
  ],
  BillingMode: 'PAY_PER_REQUEST' // On-demand billing
};

async function createTable() {
  try {
    // Check if table already exists
    try {
      const describeCommand = new DescribeTableCommand({ TableName: tableName });
      await client.send(describeCommand);
      console.log(`✅ Table '${tableName}' already exists`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    // Create the table
    console.log(`🔄 Creating table '${tableName}'...`);
    const createCommand = new CreateTableCommand(tableParams);
    const result = await client.send(createCommand);
    console.log(`✅ Table '${tableName}' created successfully!`);
    console.log('Table ARN:', result.TableDescription.TableArn);
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  createTable();
}

module.exports = { createTable };
