"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runUpdate = void 0;
const executeOrders_1 = require("./executeOrders");
const positionsDB_1 = require("./positionsDB");
const accountValueDB_1 = require("./accountValueDB");
const accountValue_1 = require("../utils/accountValue");
const tdAPI_1 = require("./tdAPI");
const position_1 = require("../utils/position");
const app_1 = require("../app");
const processedOrderDB_1 = require("./processedOrderDB");
//Returns set of ticker symbols to query from market data API
const getNeededTickerSymbolsForQuoteAPICall = (userOrders, positionsData) => {
    return Array.from(new Set([...executeOrders_1.getTickerSymbolsFromOrders(userOrders), ...positionsDB_1.getTickerSymbolsFromPositions(positionsData)]));
};
// update positions cycle:
// gets current positions
// updates positions using most recent quotes
// executes any existing orders
// writes updates to DB
const runUpdate = (userOrders, db) => __awaiter(void 0, void 0, void 0, function* () {
    app_1.lock.acquire(app_1.lockKey, (done) => __awaiter(void 0, void 0, void 0, function* () {
        const positions = yield positionsDB_1.getPositionsFromDB(db);
        const previousAccountValue = yield accountValueDB_1.getMostRecentAccountValue(db);
        if (positions === null) {
            return;
        } //abort update if we couldn't get positions
        const tickerSymbols = getNeededTickerSymbolsForQuoteAPICall(userOrders, positions);
        const quoteData = yield tdAPI_1.TdApiGetQuotes(tickerSymbols, db);
        position_1.updateEquityPositions(positions, quoteData);
        let processedOrders = [];
        if (userOrders.length > 0) {
            processedOrders = executeOrders_1.executeOrders(positions, userOrders, quoteData);
            position_1.updateEquityPositions(positions, quoteData);
        }
        const deleteResponseCode = yield positionsDB_1.deleteItemsFromDBWithZeroQuantity(positions, db);
        position_1.removeEquityPositionsWithZeroQuantity(positions);
        if (previousAccountValue !== null) {
            const currentAccountValue = accountValue_1.calculateAccountValue(positions, previousAccountValue);
            const putAccountValueResponseCode = yield accountValueDB_1.putNewAccountValueIntoDB(db, currentAccountValue);
        }
        if (deleteResponseCode === 200) { // if we could not delete the correct positions, we have inconsistent data, abort the update by not putting new data
            const putResponseCode = yield positionsDB_1.updateDBWithNewPositions(positions, db);
        }
        if (processedOrders.length > 0) {
            yield processedOrderDB_1.putNewProcessedOrdersIntoDB(db, processedOrders);
        }
        done();
    })).catch((err) => console.log(err));
});
exports.runUpdate = runUpdate;
//# sourceMappingURL=runUpdate.js.map