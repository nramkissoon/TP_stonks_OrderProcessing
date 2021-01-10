import AWS from 'aws-sdk';
import { OrderExecutionInfo } from './executeOrders';

// put new account value data into DB
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