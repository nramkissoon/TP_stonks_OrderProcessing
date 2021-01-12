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
    });
    return accessToken;
});
exports.getTdApiAccessTokenFromDynamoDB = getTdApiAccessTokenFromDynamoDB;
const TdApiGetQuotes = (tickers, db) => __awaiter(void 0, void 0, void 0, function* () {
    const apiKey = process.env.TD_API_KEY;
    const tdAccessToken = yield exports.getTdApiAccessTokenFromDynamoDB(db);
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
                reject(err);
            if (response.statusCode !== 200) {
                // TODO add logic for API status notif
                resolve({});
            }
            try {
                const res = JSON.parse(body);
                resolve(res);
            }
            catch (e) {
                console.log(e);
                resolve({});
            }
        });
    });
    return apiResponseBody;
});
exports.TdApiGetQuotes = TdApiGetQuotes;
//# sourceMappingURL=tdAPI.js.map