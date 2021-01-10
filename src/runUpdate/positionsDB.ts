import AWS from 'aws-sdk';

// get ALL positions from DynamoDB Table
export const getPositionsFromDB = async (db: AWS.DynamoDB) => {
  const params = {
    TableName: process.env.DYNAMO_DB_POSITIONS_TABLE_NAME,
    ConsistentRead: true
  }
  const positions = await db.scan(params)
    .promise()
    .catch((err) => null)
    .then((res) => {
      if (res && res.Items) {
        const result: {}[] = [];
        res.Items.forEach((item) => {
          result.push(AWS.DynamoDB.Converter.unmarshall(item));
        });
        return result;
      } else {
        return null;
      }
    });
  return positions;
}

// create the request objects for positions that need to be deleted because quantity is 0
const getDeleteRequestItemsForDBUpdate = (positions: {}[]) => {
  const deleteRequests: {}[] = [];
  positions.forEach((position) => {
    if (position['quantity'] <= 0) {
      const deleteRequest = {
        DeleteRequest: {
          Key: {
            'POSITION': {S: position['POSITION']}
          }
        }
      };
      deleteRequests.push(deleteRequest);
    }
  });
  return deleteRequests;
}

// batch delete positions with 0 quantity from DB
export const deleteItemsFromDBWithZeroQuantity = async (positions: {}[], db: AWS.DynamoDB) => {
  const requestItems = getDeleteRequestItemsForDBUpdate(positions)
  if (requestItems.length === 0) { return 200; } 
  const params = {
    RequestItems: {
      'TP_stonks_positions': requestItems
    }
  };
  const responseCode = await db.batchWriteItem(params)
    .promise()
      .then((res) => {
        if (res.$response) return res.$response.httpResponse.statusCode;
      });
  return responseCode
}

// create put request items for positions that need to be updates in DB
const getPutRequestItemsForDBUpdate = (positions: {}[]) => {
  const requestItems: {}[] = [];
  positions.forEach((position) => {
    requestItems.push({
      PutRequest: {
        Item: AWS.DynamoDB.Converter.marshall(position)
      }
    });
  });
  return requestItems;
}

// batch write position updates to DB
export const updateDBWithNewPositions = async (positions: {}[], db: AWS.DynamoDB) => {
  const requestItems = getPutRequestItemsForDBUpdate(positions);
  if (requestItems.length === 0) { return 200; } 
  const params = {
    RequestItems: {
      'TP_stonks_positions': requestItems
    }
  };
  const responseCode = await db.batchWriteItem(params)
    .promise()
      .then((res) => {
        if (res.$response) return res.$response.httpResponse.statusCode;
      });
  return responseCode
}

const getTickerSymbolFromEquityPosition = (position: {}) => {
  return position['POSITION'];
}

// get all ticker symbols from all positions
export const getTickerSymbolsFromPositions = (positions: any[]) => {
  const tickerSymbols: Set<string> = new Set();
  positions.forEach((position) => {
    if (position['asset_type'] === 'Equity') {
      const tickerSymbol = getTickerSymbolFromEquityPosition(position);
      tickerSymbols.add(tickerSymbol);
    }
  });
  return tickerSymbols.keys();
}