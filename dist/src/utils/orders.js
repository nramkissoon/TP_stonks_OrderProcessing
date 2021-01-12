"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuantity = exports.isSellOrder = exports.isBuyOrder = void 0;
const isBuyOrder = (userOrderData) => {
    const orderComponents = userOrderData.order.split(" ");
    const orderAction = orderComponents[0].substring(1, orderComponents[0].length);
    return orderAction === "BUY";
};
exports.isBuyOrder = isBuyOrder;
const isSellOrder = (userOrderData) => {
    const orderComponents = userOrderData.order.split(" ");
    const orderAction = orderComponents[0].substring(1, orderComponents[0].length);
    return orderAction === "SELL";
};
exports.isSellOrder = isSellOrder;
const getQuantity = (userOrderData) => {
    const orderComponents = userOrderData.order.split(" ");
    const quantity = Number.parseFloat(orderComponents[2]);
    return quantity;
};
exports.getQuantity = getQuantity;
//# sourceMappingURL=orders.js.map