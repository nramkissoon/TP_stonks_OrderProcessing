import AWS from 'aws-sdk';
import request from 'request';

// get the access token needed to make authorized requests for real time data
export const getTdApiAccessTokenFromDynamoDB = async (db: AWS.DynamoDB) => {
  const params = {
    TableName: process.env.DYNAMO_DB_API_CREDENTIALS_TABLE_NAME,
    ConsistentRead: true,
    AttributesToGet: [
      "value"
    ],
    Key: {
      'key': {
        S: 'access_token'
      }
    }
  };
  const accessToken = await db.getItem(params)
    .promise()
    .then((res) => {
      if (res.Item) return res['Item']['value']['S'];
    });
  return accessToken;
}

export const TdApiGetQuotes = async (tickers: string[], db: AWS.DynamoDB) => {
  const apiKey = process.env.TD_API_KEY;
  const tdAccessToken = await getTdApiAccessTokenFromDynamoDB(db);
  const authorization = 'Bearer ' + tdAccessToken;
  const apiURI = 'https://api.tdameritrade.com/v1/marketdata/quotes';
  const tickersQS = tickers.join(",")
  const options: request.CoreOptions = {
    headers: {
      Authorization: authorization
    },
    qs: {
      apiKey: apiKey,
      symbol: tickersQS
    }
  }
  let apiResponseBody = new Promise((resolve, reject) => {
    request.get(apiURI, options, (err, response, body) => {
      if (err) reject(err);
      if (response.statusCode !== 200) {
        // TODO add logic for API status notif
        resolve({});
      }
      resolve(JSON.parse(body));
    })
  });
  return apiResponseBody;
}