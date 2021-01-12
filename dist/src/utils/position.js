"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEquityPositions = exports.alreadyHasEquityPosition = exports.removeEquityPositionsWithZeroQuantity = exports.removeCash = exports.getTotalCashPosition = exports.getNonCashPositionTickers = exports.getTotalNonCashPositions = void 0;
const math_1 = require("./math");
const getTotalNonCashPositions = (positions) => {
    let total = 0;
    positions.forEach((position) => {
        if (!position['asset_type']) { }
        else if (position['asset_type'] !== 'Cash') {
            total += 1;
        }
    });
    return total;
};
exports.getTotalNonCashPositions = getTotalNonCashPositions;
const getNonCashPositionTickers = (positions) => {
    const tickers = new Set();
    positions.forEach((position) => {
        if (!position['asset_type']) { }
        else if (position['asset_type'] !== 'Cash') {
            tickers.add(position['POSITION']);
        }
    });
    return tickers;
};
exports.getNonCashPositionTickers = getNonCashPositionTickers;
const getTotalCashPosition = (positions) => {
    let total = 0;
    positions.forEach((position) => {
        if (!position['asset_type']) { }
        else if (position['asset_type'] === 'Cash') {
            total += parseFloat(position['mkt_value']);
        }
    });
    return total;
};
exports.getTotalCashPosition = getTotalCashPosition;
const removeCash = (positions, cashToRemove) => {
    positions.forEach((position) => {
        if (!position['asset_type']) { }
        else if (position['asset_type'] === 'Cash') {
            position['mkt_value'] = parseFloat((position['mkt_value'] - cashToRemove).toFixed(2));
        }
    });
};
exports.removeCash = removeCash;
const removeEquityPositionsWithZeroQuantity = (positions) => {
    let indexesToRemove = [];
    let i;
    for (i = 0; i < positions.length; i += 1) {
        let position = positions[i];
        if (!position['asset_type'] || !position['asset_type']) { }
        else if (position['asset_type'] === 'Equity') {
            if (position['quantity'] === 0) {
                indexesToRemove.push(i);
            }
        }
    }
    indexesToRemove.forEach((index) => {
        positions.splice(index, 1);
    });
};
exports.removeEquityPositionsWithZeroQuantity = removeEquityPositionsWithZeroQuantity;
const alreadyHasEquityPosition = (ticker, positions) => {
    let result = false;
    positions.forEach((position) => {
        if (position['POSITION'] === ticker) {
            result = true;
        }
    });
    return result;
};
exports.alreadyHasEquityPosition = alreadyHasEquityPosition;
// update equity positions based on most recent quote data
// need to update price, mkt_value, day_gain_total/percent, total_gain_total/percent
const updateEquityPositions = (positions, quoteData) => {
    positions.forEach((position) => {
        if (!position['asset_type']) { }
        else if (position['asset_type'] === 'Equity') {
            const ticker = position['POSITION'];
            if (quoteData[ticker]) {
                position['price'] = quoteData[ticker]['mark'];
                const price = position['price'];
                const quantity = position['quantity'];
                position['mkt_value'] = parseFloat((price * quantity).toFixed(2));
                const mktValue = position['mkt_value'];
                const avgCost = position['average_cost_per_unit'];
                position['day_gain_total'] = quoteData[ticker]['markChangeInDouble'];
                position['day_gain_percent'] = quoteData[ticker]['markPercentChangeInDouble'];
                position['total_gain_total'] = parseFloat((mktValue - (avgCost * quantity)).toFixed(2));
                position['total_gain_percent'] = math_1.calculatePercentChange(mktValue, avgCost * quantity);
            }
        }
    });
};
exports.updateEquityPositions = updateEquityPositions;
//# sourceMappingURL=position.js.map