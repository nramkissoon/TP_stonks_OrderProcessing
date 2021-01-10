import Router from 'express';
import AWS from 'aws-sdk'
import { getOrdersFromSNSMessage } from './../utils/snsMessaging'
import { UserOrderData } from './../utils/orders';
import { runUpdate } from './../runUpdate/runUpdate';
import { dynamodb } from './../app'

// create the route for receiving stock orders from SNS Topic
const router = Router();

router.post('/orders', async (req, res) => {
  const body = JSON.parse(req.body);
  const headers = req.headers;

  // if endpoint is unsubscribed, subscribe to it and confirm
  if (headers['x-amz-sns-message-type'] === 'SubscriptionConfirmation') {
    console.log("Received subscription confirmation request...")
    if (body['TopicArn'] === process.env.ORDER_TOPIC_ARN) {
      const confirmSubParams = {
        Token: body['Token'],
        TopicArn: body['TopicArn'],
        AuthenticateOnUnsubscribe: 'true'
      }
      new AWS.SNS().confirmSubscription(confirmSubParams, (err, data) => {
        if (err) console.log(err, err.message);
        else console.log(data);
      })
    }
    return;
  }

  // if SNS message is a stock order
  else if (headers['x-amz-sns-message-type'] === 'Notification') {
    const message = body['Message'];
    const orders: UserOrderData[] = getOrdersFromSNSMessage(message) 
    runUpdate(orders, dynamodb);
    res.status(200); // sent back to AWS to confirm message received
    return;
  }
});

export { router };