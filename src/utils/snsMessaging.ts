import { UserOrderData } from './orders'
import AWS from 'aws-sdk'
import { OrderExecutionInfo } from './../runUpdate/executeOrders';

// converts an SNS order message to a JSON object that is easier to work with in code.
export const getOrdersFromSNSMessage = (message: string) => {
  const orders: UserOrderData[] = [];
  const orderDataStrings: string[] = JSON.parse(message);
  orderDataStrings.forEach((orderString) => {
    let userOrderData: UserOrderData = JSON.parse(orderString);
    orders.push(userOrderData);
  });
  return orders;
}

export const publishOrderExecutionInfoToSNS = async (orderExecutionInfos: OrderExecutionInfo[]) => {
  const message = JSON.stringify(orderExecutionInfos);
  const topicArn = process.env.ORDER_EXECUTION_INFO_TOPIC_ARN;
  const params = {
    Message: message,
    TopicArn: topicArn
  };
  new AWS.SNS().publish(params, (err: AWS.AWSError, data: AWS.SNS.PublishResponse) => {
    if (err) { console.log(err.message) }
    if (data) { } //TODO
  });
}