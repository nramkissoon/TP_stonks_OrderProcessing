import AWS from 'aws-sdk';
import { AccountValue } from '../utils/accountValue';

export const getMostRecentAccountValue = async (db: AWS.DynamoDB) => {
  const params = {
    TableName: process.env.DYNAMO_DB_ACCOUNT_VALUE_TABLE_NAME,
    ConsistentRead: true,
    ScanIndexForward: false,
    Limit: 1,
    ExpressionAttributeValues: {
      ':s': {S: 'account_value'}
    },
    ExpressionAttributeNames: {
      "#k": "key",
      "#t": "timestamp"
    },
    KeyConditionExpression: '#k = :s',
    ProjectionExpression: '#k, #t, day_gain_percent, day_gain_total, mkt_value, total_gain_total, total_gain_percent, previous_day_mkt_value',
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
    const accountValue: AccountValue = {
      key: dbResponse['key'],
      timestamp: dbResponse['timestamp'],
      mkt_value: dbResponse['mkt_value'],
      day_gain_total: dbResponse['day_gain_total'],
      day_gain_percent: dbResponse['day_gain_percent'],
      total_gain_total: dbResponse['total_gain_total'],
      total_gain_percent: dbResponse['total_gain_percent'],
      previous_day_mkt_value: dbResponse['previous_day_mkt_value'],
    }
    return accountValue;
  }
  return null;
}

// put new account value data into DB
export const putNewAccountValueIntoDB = async (db: AWS.DynamoDB, accountValue: AccountValue) => {
  const params = {
    TableName: process.env.DYNAMO_DB_ACCOUNT_VALUE_TABLE_NAME,
    Item: AWS.DynamoDB.Converter.marshall(accountValue)
  }
  const responseCode = await db.putItem(params)
    .promise()
    .then((res) => {
      if (res.$response) return res.$response.httpResponse.statusCode;
    });
  return responseCode
}