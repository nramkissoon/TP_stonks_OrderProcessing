import { UserOrderData } from './../utils/orders';
import { isBuyOrder, isSellOrder, getQuantity } from './../utils/orders';
import { calculateAvgCostPerUnit } from './../utils/math'
import {
  getTotalNonCashPositions,
  getNonCashPositionTickers,
  getTotalCashPosition,
  alreadyHasEquityPosition, 
  EquityPosition,
  removeCash
} from '../utils/position'
import { InvalidOrderReasons } from '../utils/consts';


const POSITION_LIMIT = 10;

interface OrderValidationInfo {
  isValid: boolean,
  invalidReason?: string
}

export interface OrderExecutionInfo {
  userOrderData: UserOrderData,
  processedTimestamp: number,
  orderValidationInfo: OrderValidationInfo,
  executed: boolean,
}

// get ticker from order string
const getTickerSymbolFromOrder = (order: string) => {
  const orderComponents: string[] = order.split(" ");
  return orderComponents[1];
}

// get all ticker symbols in user order data list
export const getTickerSymbolsFromOrders = (userOrders: UserOrderData[]) => {
  const tickerSymbols: Set<string> = new Set();
  userOrders.forEach((userOrderData) => {
    const order = userOrderData.order;
    tickerSymbols.add(getTickerSymbolFromOrder(order));
  });
  return tickerSymbols.keys();
}

// returns if buy order is valid and reason for invalid order if any
const validateBuyOrder = (positions: {}[], userOrder: UserOrderData, quoteData) => {
  const totalNonCashPositions: number = getTotalNonCashPositions(positions);
  const ticker = getTickerSymbolFromOrder(userOrder.order);
  const nonCashPositionsTickers = getNonCashPositionTickers(positions);
  const price: number = quoteData[ticker].mark;
  const totalCashNeededToBuy = price * getQuantity(userOrder);
  const result: OrderValidationInfo = {
    isValid: true,
  }
  if (totalNonCashPositions === POSITION_LIMIT && !nonCashPositionsTickers.has(ticker)) {
    result.isValid = false;
    result.invalidReason = InvalidOrderReasons.PositionLimitMet;
  } 
  else if (totalCashNeededToBuy > getTotalCashPosition(positions)) {
    result.isValid = false;
    result.invalidReason = InvalidOrderReasons.InsufficientBuyingPower;
  } 
  return result;
}

const validateSellOrder = (positions: {}[], userOrder: UserOrderData) => {
  const nonCashPositionsTickers = getNonCashPositionTickers(positions);
  const ticker = getTickerSymbolFromOrder(userOrder.order);
  const sellQuantity = getQuantity(userOrder);
  const result: OrderValidationInfo = {
    isValid: true,
  }
  let validQuantity = false;
  positions.forEach((position) => {
    if (position['POSITION'] === ticker) {
      validQuantity = sellQuantity <= position['quantity'];
    }
  });
  result.isValid = nonCashPositionsTickers.has(ticker) && validQuantity;
  if (!result.isValid) {
    result.invalidReason = InvalidOrderReasons.SellQuantityGreaterThanOwned
  }
  return result; // return if that position is present and valid quantity
}

export const isOrderValid = (positions: {}[], userOrder: UserOrderData, quoteData) => {
  const ticker = getTickerSymbolFromOrder(userOrder.order);
  const quantity = getQuantity(userOrder);
  const result: OrderValidationInfo = {
    isValid: true,
  }
  if (!quoteData[ticker]) { 
    result.isValid = false;
    result.invalidReason = InvalidOrderReasons.NoQuoteData;
  } 
  else if (Number(quantity) === quantity && quantity % 1 !== 0) {
    result.isValid = false;
    result.invalidReason = InvalidOrderReasons.NoFractionalShares;
  }
  else if (isBuyOrder(userOrder)) {
    return validateBuyOrder(positions, userOrder, quoteData);
  } else if (isSellOrder(userOrder)) {
    return validateSellOrder(positions, userOrder);
  }
  return result;
}


export const executeSellEquityOrder = (positions: {}[], userOrder: UserOrderData, qouteData) => {
  const ticker = getTickerSymbolFromOrder(userOrder.order);
  const quantity = getQuantity(userOrder);
  const marketPrice = qouteData[ticker]['mark'];
  const cashAdded = parseFloat((quantity * marketPrice).toFixed(2));
  positions.forEach((position: any) => {
    if (position['asset_type'] === 'Cash') {
      position['mkt_value'] = parseFloat((position['mkt_value'] + cashAdded).toFixed(2));
    } else if (position['POSITION'] === ticker) {
      position['quantity'] -= quantity;
    }
  });
}

export const executeAddToPositionBuyEquityOrder = (positions: {}[], userOrder: UserOrderData, quoteData) => {
  const quantityToAdd = getQuantity(userOrder);
  const ticker = getTickerSymbolFromOrder(userOrder.order);
  const marketPrice = quoteData[ticker]['mark'];
  positions.forEach((position) => {
    if (position['POSITION'] === ticker) {
      const currentQuantity = position['quantity'];
      const currentAvgCost = position['average_cost_per_unit'];
      const newAvgCost = calculateAvgCostPerUnit(currentAvgCost, quantityToAdd, currentQuantity, marketPrice);
      position['average_cost_per_unit'] = newAvgCost;
      position['quantity'] += quantityToAdd;
    }
  });
  removeCash(positions, marketPrice * quantityToAdd);
}

export const executeAddNewPositionBuyEquityOrder = (positions: {}[], userOrder: UserOrderData, quoteData) => {
  const quantity = getQuantity(userOrder);
  const ticker = getTickerSymbolFromOrder(userOrder.order);
  const marketPrice = quoteData[ticker]['mark'];
  const position: EquityPosition = {
    POSITION: ticker,
    mkt_value:quantity * marketPrice,
    asset_type:'Equity',
    price:marketPrice ,
    average_cost_per_unit: calculateAvgCostPerUnit(0, quantity, 0, marketPrice),
    day_gain_total:  quoteData[ticker]['markChangeInDouble'],
    day_gain_percent: quoteData[ticker]['markPercentChangeInDouble'],
    total_gain_total: 0 ,
    total_gain_percent: 0,
    quantity: quantity 
  };
  positions.push(position);
  removeCash(positions, marketPrice * quantity);
}

export const executeBuyEquityOrder = (positions: {}[], userOrder: UserOrderData, quoteData) => {
  const ticker = getTickerSymbolFromOrder(userOrder.order);
  if (alreadyHasEquityPosition(ticker, positions)) {
    executeAddToPositionBuyEquityOrder(positions, userOrder, quoteData);
  } else {
    executeAddNewPositionBuyEquityOrder(positions, userOrder, quoteData)
  }
}

export const executeOrders = (positions: {}[], userOrders: UserOrderData[], quoteData) => {
  const orderExecutionResults: OrderExecutionInfo[] = []
  userOrders.forEach((order) => {
    const orderValidationInfo: OrderValidationInfo = isOrderValid(positions, order, quoteData);
    const orderExecutionInfo: OrderExecutionInfo = {
      userOrderData: order,
      processedTimestamp: (orderValidationInfo.isValid ? 0 : new Date().getTime()),
      orderValidationInfo: orderValidationInfo,
      executed: false,
    }
    if (orderValidationInfo.isValid) {
      if (isSellOrder(order)) {
        executeSellEquityOrder(positions, order, quoteData);
      } else if (isBuyOrder(order)) {
        executeBuyEquityOrder(positions, order, quoteData);
      }
      orderExecutionInfo.processedTimestamp = new Date().getTime();
      orderExecutionInfo.executed = true;
    }
    orderExecutionResults.push(orderExecutionInfo);
  });
  return orderExecutionResults;
}