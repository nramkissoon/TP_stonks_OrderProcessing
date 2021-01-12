"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrdersFromSNSMessage = void 0;
// converts an SNS order message to a JSON object that is easier to work with in code.
const getOrdersFromSNSMessage = (message) => {
    const orders = [];
    const orderDataStrings = JSON.parse(message);
    orderDataStrings.forEach((orderString) => {
        let userOrderData = JSON.parse(orderString);
        orders.push(userOrderData);
    });
    return orders;
};
exports.getOrdersFromSNSMessage = getOrdersFromSNSMessage;
//# sourceMappingURL=snsMessaging.js.map