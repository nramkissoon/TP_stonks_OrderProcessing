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
exports.TdApiGetQuotes = exports.getTdApiAccessTokenFromDynamoDB = void 0;
const request_1 = __importDefault(require("request"));
const logger_1 = require("./../utils/logger");
// get the access token needed to make authorized requests for real time data
const getTdApiAccessTokenFromDynamoDB = (db) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: process.env.DYNAMO_DB_API_CREDENTIALS_TABLE_NAME,
        ConsistentRead: true,
        AttributesToGet: [
            "value"
        ],
        Key: {
            'key': {
                S: 'access_token'
            }
        }
    };
    const accessToken = yield db.getItem(params)
        .promise()
        .then((res) => {
        if (res.Item)
            return res['Item']['value']['S'];
        logger_1.log('Possible AWS Error getting TD API Access Token');
        return null;
    });
    return accessToken;
});
exports.getTdApiAccessTokenFromDynamoDB = getTdApiAccessTokenFromDynamoDB;
const TdApiGetQuotes = (tickers, db) => __awaiter(void 0, void 0, void 0, function* () {
    const apiKey = process.env.TD_API_KEY;
    const tdAccessToken = yield exports.getTdApiAccessTokenFromDynamoDB(db);
    if (!tdAccessToken)
        return {}; // return empty object because we could not retrieve access token
    const authorization = 'Bearer ' + tdAccessToken;
    const apiURI = 'https://api.tdameritrade.com/v1/marketdata/quotes';
    const tickersQS = tickers.join(",");
    const options = {
        headers: {
            Authorization: authorization
        },
        qs: {
            apiKey: apiKey,
            symbol: tickersQS
        }
    };
    let apiResponseBody = new Promise((resolve, reject) => {
        request_1.default.get(apiURI, options, (err, response, body) => {
            if (err)
                resolve({});
            if (!response || response.statusCode !== 200) {
                logger_1.log(`TD API not available, bad error code or null response: ${response}`);
                // TODO add logic for API status notif
                resolve({});
            }
            try {
                const res = JSON.parse(body);
                resolve(res);
            }
            catch (e) {
                logger_1.log(`Error converting TD GetQuotesAPI Response to JSON: ${e}`);
                resolve({});
            }
        });
    });
    return apiResponseBody;
});
exports.TdApiGetQuotes = TdApiGetQuotes;
//# sourceMappingURL=tdAPI.js.map