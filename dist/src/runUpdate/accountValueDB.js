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
exports.putNewAccountValueIntoDB = exports.getMostRecentAccountValue = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const getMostRecentAccountValue = (db) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: process.env.DYNAMO_DB_ACCOUNT_VALUE_TABLE_NAME,
        ConsistentRead: true,
        ScanIndexForward: false,
        Limit: 1,
        ExpressionAttributeValues: {
            ':s': { S: 'account_value' }
        },
        ExpressionAttributeNames: {
            "#k": "key",
            "#t": "timestamp"
        },
        KeyConditionExpression: '#k = :s',
        ProjectionExpression: '#k, #t, day_gain_percent, day_gain_total, mkt_value, total_gain_total, total_gain_percent, previous_day_mkt_value',
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
        const accountValue = {
            key: dbResponse['key'],
            timestamp: dbResponse['timestamp'],
            mkt_value: dbResponse['mkt_value'],
            day_gain_total: dbResponse['day_gain_total'],
            day_gain_percent: dbResponse['day_gain_percent'],
            total_gain_total: dbResponse['total_gain_total'],
            total_gain_percent: dbResponse['total_gain_percent'],
            previous_day_mkt_value: dbResponse['previous_day_mkt_value'],
        };
        return accountValue;
    }
    return null;
});
exports.getMostRecentAccountValue = getMostRecentAccountValue;
// put new account value data into DB
const putNewAccountValueIntoDB = (db, accountValue) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: process.env.DYNAMO_DB_ACCOUNT_VALUE_TABLE_NAME,
        Item: aws_sdk_1.default.DynamoDB.Converter.marshall(accountValue)
    };
    const responseCode = yield db.putItem(params)
        .promise()
        .then((res) => {
        if (res.$response)
            return res.$response.httpResponse.statusCode;
    });
    return responseCode;
});
exports.putNewAccountValueIntoDB = putNewAccountValueIntoDB;
//# sourceMappingURL=accountValueDB.js.map