import { Badges } from 'tmi.js'

export interface UserOrderData {
  order: string,
  username?: string,
  "tmi-sent-ts"?: string,
  id?: string,
  subscriber?: boolean,
  color?: string,
  "user-id"?: string,
  badges?: Badges,
  "display-name"?: string;
}

export const isBuyOrder = (userOrderData: UserOrderData) => {
  const orderComponents = userOrderData.order.split(" ");
  const orderAction = orderComponents[0].substring(1, orderComponents[0].length);
  return orderAction === "BUY";
}

export const isSellOrder = (userOrderData: UserOrderData) => {
  const orderComponents = userOrderData.order.split(" ");
  const orderAction = orderComponents[0].substring(1, orderComponents[0].length);
  return orderAction === "SELL";
}

export const getQuantity = (userOrderData: UserOrderData) => {
  const orderComponents = userOrderData.order.split(" ");
  const quantity = Number.parseFloat(orderComponents[2])
  return quantity;
}