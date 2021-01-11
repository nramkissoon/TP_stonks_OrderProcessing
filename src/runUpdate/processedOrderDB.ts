import AWS from 'aws-sdk';
import { OrderExecutionInfo } from './executeOrders';

export const getMostRecentProcessedOrders = async (db: AWS.DynamoDB) => {
  const params = {
    TableName: process.env.DYNAMO_DB_PROCESSED_ORDERS_TABLE_NAME,
    ConsistentRead: true,
    ScanIndexForward: false,
    Limit: 1,
    ExpressionAttributeValues: {
      ':s': {S: 'processed_orders'}
    },
    ExpressionAttributeNames: {
      "#k": "key",
      "#t": "timestamp"
    },
    KeyConditionExpression: '#k = :s',
    ProjectionExpression: '#k, #t, processedOrders',
  }
  const dbResponse = await db.query(params)
    .promise()
    .catch((err) => null)
    .then((res) => {
      if (res && res.Items) {
        return AWS.DynamoDB.Converter.unmarshall(res.Items[0]);
      } else { return null; }
    });
  if (dbResponse) {
    const processOrders = {
      key: dbResponse['key'],
      timestamp: dbResponse['timestamp'],
      processedOrders: dbResponse['processedOrders'],
    }
    return processOrders;
  }
  return null;
}

// put new processed Order data into DB
export const putNewProcessedOrdersIntoDB = async (db: AWS.DynamoDB, processedOrders: OrderExecutionInfo[]) => {
  const params = {
    TableName: process.env.DYNAMO_DB_PROCESSED_ORDERS_TABLE_NAME,
    Item: AWS.DynamoDB.Converter.marshall({
      key: 'processed_orders',
      timestamp: new Date().getTime(),
      processedOrders: processedOrders
    })
  }
  const responseCode = await db.putItem(params)
    .promise()
    .then((res) => {
      if (res.$response) return res.$response.httpResponse.statusCode;
    });
  return responseCode
}