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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTickerSymbolsFromPositions = exports.updateDBWithNewPositions = exports.deleteItemsFromDBWithZeroQuantity = exports.getPositionsFromDB = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const logger_1 = require("./../utils/logger");
// get ALL positions from DynamoDB Table
const getPositionsFromDB = (db) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: process.env.DYNAMO_DB_POSITIONS_TABLE_NAME,
        ConsistentRead: true
    };
    const positions = yield db.scan(params)
        .promise()
        .catch((err) => logger_1.log('Unknown error getting positions from DB.'))
        .then((res) => {
        if (res && res.Items) {
            const result = [];
            res.Items.forEach((item) => {
                result.push(aws_sdk_1.default.DynamoDB.Converter.unmarshall(item));
            });
            return result;
        }
        else {
            logger_1.log(`Potential AWS Error when getting positions from DB: ${res}`);
            return null;
        }
    });
    return positions;
});
exports.getPositionsFromDB = getPositionsFromDB;
// create the request objects for positions that need to be deleted because quantity is 0
const getDeleteRequestItemsForDBUpdate = (positions) => {
    const deleteRequests = [];
    positions.forEach((position) => {
        if (position['quantity'] <= 0) {
            const deleteRequest = {
                DeleteRequest: {
                    Key: {
                        'POSITION': { S: position['POSITION'] }
                    }
                }
            };
            deleteRequests.push(deleteRequest);
        }
    });
    return deleteRequests;
};
// batch delete positions with 0 quantity from DB
const deleteItemsFromDBWithZeroQuantity = (positions, db) => __awaiter(void 0, void 0, void 0, function* () {
    const requestItems = getDeleteRequestItemsForDBUpdate(positions);
    if (requestItems.length === 0) {
        return 200;
    }
    const params = {
        RequestItems: {
            'TP_stonks_positions': requestItems
        }
    };
    const responseCode = yield db.batchWriteItem(params)
        .promise()
        .then((res) => {
        if (res.$response)
            return res.$response.httpResponse.statusCode;
    });
    return responseCode;
});
exports.deleteItemsFromDBWithZeroQuantity = deleteItemsFromDBWithZeroQuantity;
// create put request items for positions that need to be updates in DB
const getPutRequestItemsForDBUpdate = (positions) => {
    const requestItems = [];
    positions.forEach((position) => {
        requestItems.push({
            PutRequest: {
                Item: aws_sdk_1.default.DynamoDB.Converter.marshall(position)
            }
        });
    });
    return requestItems;
};
// batch write position updates to DB
const updateDBWithNewPositions = (positions, db) => __awaiter(void 0, void 0, void 0, function* () {
    const requestItems = getPutRequestItemsForDBUpdate(positions);
    if (requestItems.length === 0) {
        return 200;
    }
    const params = {
        RequestItems: {
            'TP_stonks_positions': requestItems
        }
    };
    const responseCode = yield db.batchWriteItem(params)
        .promise()
        .then((res) => {
        if (res.$response)
            return res.$response.httpResponse.statusCode;
    });
    return responseCode;
});
exports.updateDBWithNewPositions = updateDBWithNewPositions;
const getTickerSymbolFromEquityPosition = (position) => {
    return position['POSITION'];
};
// get all ticker symbols from all positions
const getTickerSymbolsFromPositions = (positions) => {
    const tickerSymbols = new Set();
    positions.forEach((position) => {
        if (position['asset_type'] === 'Equity') {
            const tickerSymbol = getTickerSymbolFromEquityPosition(position);
            tickerSymbols.add(tickerSymbol);
        }
    });
    return tickerSymbols.keys();
};
exports.getTickerSymbolsFromPositions = getTickerSymbolsFromPositions;
//# sourceMappingURL=positionsDB.js.map