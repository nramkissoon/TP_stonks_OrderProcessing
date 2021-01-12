"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeOrders = exports.executeBuyEquityOrder = exports.executeAddNewPositionBuyEquityOrder = exports.executeAddToPositionBuyEquityOrder = exports.executeSellEquityOrder = exports.isOrderValid = exports.getTickerSymbolsFromOrders = void 0;
const orders_1 = require("./../utils/orders");
const math_1 = require("./../utils/math");
const position_1 = require("../utils/position");
const consts_1 = require("../utils/consts");
const POSITION_LIMIT = 10;
// get ticker from order string
const getTickerSymbolFromOrder = (order) => {
    const orderComponents = order.split(" ");
    return orderComponents[1];
};
// get all ticker symbols in user order data list
const getTickerSymbolsFromOrders = (userOrders) => {
    const tickerSymbols = new Set();
    userOrders.forEach((userOrderData) => {
        const order = userOrderData.order;
        tickerSymbols.add(getTickerSymbolFromOrder(order));
    });
    return tickerSymbols.keys();
};
exports.getTickerSymbolsFromOrders = getTickerSymbolsFromOrders;
// returns if buy order is valid and reason for invalid order if any
const validateBuyOrder = (positions, userOrder, quoteData) => {
    const totalNonCashPositions = position_1.getTotalNonCashPositions(positions);
    const ticker = getTickerSymbolFromOrder(userOrder.order);
    const nonCashPositionsTickers = position_1.getNonCashPositionTickers(positions);
    const price = quoteData[ticker].mark;
    const totalCashNeededToBuy = price * orders_1.getQuantity(userOrder);
    const result = {
        isValid: true,
    };
    if (totalNonCashPositions === POSITION_LIMIT && !nonCashPositionsTickers.has(ticker)) {
        result.isValid = false;
        result.invalidReason = consts_1.InvalidOrderReasons.PositionLimitMet;
    }
    else if (totalCashNeededToBuy > position_1.getTotalCashPosition(positions)) {
        result.isValid = false;
        result.invalidReason = consts_1.InvalidOrderReasons.InsufficientBuyingPower;
    }
    return result;
};
const validateSellOrder = (positions, userOrder) => {
    const nonCashPositionsTickers = position_1.getNonCashPositionTickers(positions);
    const ticker = getTickerSymbolFromOrder(userOrder.order);
    const sellQuantity = orders_1.getQuantity(userOrder);
    const result = {
        isValid: true,
    };
    let validQuantity = false;
    positions.forEach((position) => {
        if (position['POSITION'] === ticker) {
            validQuantity = sellQuantity <= position['quantity'];
        }
    });
    result.isValid = nonCashPositionsTickers.has(ticker) && validQuantity;
    if (!result.isValid) {
        result.invalidReason = consts_1.InvalidOrderReasons.SellQuantityGreaterThanOwned;
    }
    return result; // return if that position is present and valid quantity
};
const isOrderValid = (positions, userOrder, quoteData) => {
    const ticker = getTickerSymbolFromOrder(userOrder.order);
    const quantity = orders_1.getQuantity(userOrder);
    const result = {
        isValid: true,
    };
    if (!quoteData[ticker]) {
        result.isValid = false;
        result.invalidReason = consts_1.InvalidOrderReasons.NoQuoteData;
    }
    if (Number(quantity) === quantity && quantity % 1 !== 0) {
        result.isValid = false;
        result.invalidReason = consts_1.InvalidOrderReasons.NoFractionalShares;
    }
    if (orders_1.isBuyOrder(userOrder)) {
        return validateBuyOrder(positions, userOrder, quoteData);
    }
    else if (orders_1.isSellOrder(userOrder)) {
        return validateSellOrder(positions, userOrder);
    }
    return result;
};
exports.isOrderValid = isOrderValid;
const executeSellEquityOrder = (positions, userOrder, qouteData) => {
    const ticker = getTickerSymbolFromOrder(userOrder.order);
    const quantity = orders_1.getQuantity(userOrder);
    const marketPrice = qouteData[ticker]['mark'];
    const cashAdded = parseFloat((quantity * marketPrice).toFixed(2));
    positions.forEach((position) => {
        if (position['asset_type'] === 'Cash') {
            position['mkt_value'] = parseFloat((position['mkt_value'] + cashAdded).toFixed(2));
        }
        else if (position['POSITION'] === ticker) {
            position['quantity'] -= quantity;
        }
    });
};
exports.executeSellEquityOrder = executeSellEquityOrder;
const executeAddToPositionBuyEquityOrder = (positions, userOrder, quoteData) => {
    const quantityToAdd = orders_1.getQuantity(userOrder);
    const ticker = getTickerSymbolFromOrder(userOrder.order);
    const marketPrice = quoteData[ticker]['mark'];
    positions.forEach((position) => {
        if (position['POSITION'] === ticker) {
            const currentQuantity = position['quantity'];
            const currentAvgCost = position['average_cost_per_unit'];
            const newAvgCost = math_1.calculateAvgCostPerUnit(currentAvgCost, quantityToAdd, currentQuantity, marketPrice);
            position['average_cost_per_unit'] = newAvgCost;
            position['quantity'] += quantityToAdd;
        }
    });
    position_1.removeCash(positions, marketPrice * quantityToAdd);
};
exports.executeAddToPositionBuyEquityOrder = executeAddToPositionBuyEquityOrder;
const executeAddNewPositionBuyEquityOrder = (positions, userOrder, quoteData) => {
    const quantity = orders_1.getQuantity(userOrder);
    const ticker = getTickerSymbolFromOrder(userOrder.order);
    const marketPrice = quoteData[ticker]['mark'];
    const position = {
        POSITION: ticker,
        mkt_value: quantity * marketPrice,
        asset_type: 'Equity',
        price: marketPrice,
        average_cost_per_unit: math_1.calculateAvgCostPerUnit(0, quantity, 0, marketPrice),
        day_gain_total: quoteData[ticker]['markChangeInDouble'],
        day_gain_percent: quoteData[ticker]['markPercentChangeInDouble'],
        total_gain_total: 0,
        total_gain_percent: 0,
        quantity: quantity
    };
    positions.push(position);
    position_1.removeCash(positions, marketPrice * quantity);
};
exports.executeAddNewPositionBuyEquityOrder = executeAddNewPositionBuyEquityOrder;
const executeBuyEquityOrder = (positions, userOrder, quoteData) => {
    const ticker = getTickerSymbolFromOrder(userOrder.order);
    if (position_1.alreadyHasEquityPosition(ticker, positions)) {
        exports.executeAddToPositionBuyEquityOrder(positions, userOrder, quoteData);
    }
    else {
        exports.executeAddNewPositionBuyEquityOrder(positions, userOrder, quoteData);
    }
};
exports.executeBuyEquityOrder = executeBuyEquityOrder;
const executeOrders = (positions, userOrders, quoteData) => {
    const orderExecutionResults = [];
    userOrders.forEach((order) => {
        const orderValidationInfo = exports.isOrderValid(positions, order, quoteData);
        const orderExecutionInfo = {
            userOrderData: order,
            processedTimestamp: (orderValidationInfo.isValid ? 0 : new Date().getTime()),
            orderValidationInfo: orderValidationInfo,
            executed: false,
        };
        if (orderValidationInfo.isValid) {
            if (orders_1.isSellOrder(order)) {
                exports.executeSellEquityOrder(positions, order, quoteData);
            }
            else if (orders_1.isBuyOrder(order)) {
                exports.executeBuyEquityOrder(positions, order, quoteData);
            }
            orderExecutionInfo.processedTimestamp = new Date().getTime();
            orderExecutionInfo.executed = true;
        }
        orderExecutionResults.push(orderExecutionInfo);
    });
    return orderExecutionResults;
};
exports.executeOrders = executeOrders;
//# sourceMappingURL=executeOrders.js.map