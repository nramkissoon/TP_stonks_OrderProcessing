import { lockKey, lock } from './../app';
import Router, { Request } from 'express';
import { dynamodb } from './../app';
import { getPositionsFromDB } from '../runUpdate/positionsDB';
import { getMostRecentAccountValue } from '../runUpdate/accountValueDB';
import { getMostRecentProcessedOrders } from '../runUpdate/processedOrderDB';
import { log } from './../utils/logger';


const accountRouter = Router();

const accountDataAPILog = (req: Request, positions: any, accountValue: any, processedOrders: any) => {
  log('\nNEW ACCOUNT DATA API CALL')
  log(req.baseUrl)
  if (!positions) log('NULL POSITIONS')
  if (!accountValue) log('NULL ACCOUNT_VALUE')
  if (!processedOrders) log('NULL PROCESSED_ORDERS')
}

// API route that returns most recent data from positions, account, processed orders databases
accountRouter.get('/account', async (req, res) => {
  lock.acquire(lockKey, async(done) => {
    const positions = await getPositionsFromDB(dynamodb);
    const accountValue = await getMostRecentAccountValue(dynamodb);
    const processedOrders = await getMostRecentProcessedOrders(dynamodb);
    accountDataAPILog(req, positions, accountValue, processedOrders)
    res.header("Access-Control-Allow-Origin", "*");
    res.json({
      positions,
      accountValue,
      processedOrders,
      timestamp: new Date().getTime()
    });
    done();
  }).catch(() => log('An error occurred during API call.')).then(() => log('API call completed'))
});

export { accountRouter };
