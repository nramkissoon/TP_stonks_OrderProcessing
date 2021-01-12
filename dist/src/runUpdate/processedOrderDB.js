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
exports.putNewProcessedOrdersIntoDB = exports.getMostRecentProcessedOrders = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const getMostRecentProcessedOrders = (db) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: process.env.DYNAMO_DB_PROCESSED_ORDERS_TABLE_NAME,
        ConsistentRead: true,
        ScanIndexForward: false,
        Limit: 1,
        ExpressionAttributeValues: {
            ':s': { S: 'processed_orders' }
        },
        ExpressionAttributeNames: {
            "#k": "key",
            "#t": "timestamp"
        },
        KeyConditionExpression: '#k = :s',
        ProjectionExpression: '#k, #t, processedOrders',
    };
    const dbResponse = yield db.query(params)
        .promise()
        .catch((err) => null)
        .then((res) => {
        if (res && res.Items) {
            return aws_sdk_1.default.DynamoDB.Converter.unmarshall(res.Items[0]);
        }
        else {
            return null;
        }
    });
    if (dbResponse) {
        const processOrders = {
            key: dbResponse['key'],
            timestamp: dbResponse['timestamp'],
            processedOrders: dbResponse['processedOrders'],
        };
        return processOrders;
    }
    return null;
});
exports.getMostRecentProcessedOrders = getMostRecentProcessedOrders;
// put new processed Order data into DB
const putNewProcessedOrdersIntoDB = (db, processedOrders) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: process.env.DYNAMO_DB_PROCESSED_ORDERS_TABLE_NAME,
        Item: aws_sdk_1.default.DynamoDB.Converter.marshall({
            key: 'processed_orders',
            timestamp: new Date().getTime(),
            processedOrders: processedOrders
        })
    };
    const responseCode = yield db.putItem(params)
        .promise()
        .then((res) => {
        if (res.$response)
            return res.$response.httpResponse.statusCode;
    });
    return responseCode;
});
exports.putNewProcessedOrdersIntoDB = putNewProcessedOrdersIntoDB;
//# sourceMappingURL=processedOrderDB.js.map