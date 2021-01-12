import { lockKey, lock } from './../app';
import Router from 'express';
import { dynamodb } from './../app';
import { getPositionsFromDB } from '../runUpdate/positionsDB';
import { getMostRecentAccountValue } from '../runUpdate/accountValueDB';
import { getMostRecentProcessedOrders } from '../runUpdate/processedOrderDB'


const accountRouter = Router();

// API route that returns most recent data from positions, account, processed orders databases
accountRouter.get('/account', async (req, res) => {
  lock.acquire(lockKey, async (done) => {
    const positions = await getPositionsFromDB(dynamodb);
    const accountValue = await getMostRecentAccountValue(dynamodb);
    const processedOrders = await getMostRecentProcessedOrders(dynamodb);
    res.json({
      positions,
      accountValue,
      processedOrders,
      timestamp: new Date().getTime()
    });
    done();
  })
});

export { accountRouter };
