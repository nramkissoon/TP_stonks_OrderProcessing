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
