import { UserOrderData } from "../utils/orders";
import { getTickerSymbolsFromOrders, executeOrders, OrderExecutionInfo } from './executeOrders';
import { getTickerSymbolsFromPositions, getPositionsFromDB, deleteItemsFromDBWithZeroQuantity, updateDBWithNewPositions } from './positionsDB';
import { getMostRecentAccountValue, putNewAccountValueIntoDB } from './accountValueDB';
import { calculateAccountValue } from '../utils/accountValue';
import { TdApiGetQuotes } from './tdAPI';
import { updateEquityPositions, removeEquityPositionsWithZeroQuantity } from '../utils/position';
import { lockKey, lock } from '../app';
import { putNewProcessedOrdersIntoDB } from './processedOrderDB'

//Returns set of ticker symbols to query from market data API
const getNeededTickerSymbolsForQuoteAPICall = (userOrders: UserOrderData[], positionsData: {}[]) => {
  return Array.from(new Set([...getTickerSymbolsFromOrders(userOrders), ...getTickerSymbolsFromPositions(positionsData)]));
}

// update positions cycle:
// gets current positions
// updates positions using most recent quotes
// executes any existing orders
// writes updates to DB
export const runUpdate = async (userOrders: UserOrderData[], db: AWS.DynamoDB) => {
  lock.acquire(lockKey, async (done) => { // locking required to avoid concurrent writes to DB
    const positions = await getPositionsFromDB(db);
    const previousAccountValue = await getMostRecentAccountValue(db);
    if (positions === null) { return; } //abort update if we couldn't get positions
    const tickerSymbols = getNeededTickerSymbolsForQuoteAPICall(userOrders, positions);
    const quoteData = await TdApiGetQuotes(tickerSymbols, db);
    updateEquityPositions(positions, quoteData);
    let processedOrders: OrderExecutionInfo[] = [];
    if (userOrders.length > 0) {
      processedOrders = executeOrders(positions, userOrders, quoteData);
      updateEquityPositions(positions, quoteData);
    }
    
    const deleteResponseCode = await deleteItemsFromDBWithZeroQuantity(positions, db);
    removeEquityPositionsWithZeroQuantity(positions);
    if (previousAccountValue !== null) {
      const currentAccountValue = calculateAccountValue(positions, previousAccountValue);
      const putAccountValueResponseCode = await putNewAccountValueIntoDB(db, currentAccountValue);
    }
    if (deleteResponseCode === 200) { // if we could not delete the correct positions, we have inconsistent data, abort the update by not putting new data
      const putResponseCode = await updateDBWithNewPositions(positions, db);
    }
    if (processedOrders.length > 0) { await putNewProcessedOrdersIntoDB(db, processedOrders); }
    done();
  }).catch((err) => console.log(err));
}