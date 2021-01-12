"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAvgCostPerUnit = exports.calculatePercentChange = void 0;
const calculatePercentChange = (currentValue, previousValue) => {
    return parseFloat((((currentValue - previousValue) / previousValue) * 100).toFixed(2));
};
exports.calculatePercentChange = calculatePercentChange;
const calculateAvgCostPerUnit = (currentAvg, quantityAdded, currentQuantity, price) => {
    const currentTotal = currentAvg * currentQuantity;
    return parseFloat(((currentTotal + (quantityAdded * price)) / (quantityAdded + currentQuantity)).toFixed(2));
};
exports.calculateAvgCostPerUnit = calculateAvgCostPerUnit;
//# sourceMappingURL=math.js.map