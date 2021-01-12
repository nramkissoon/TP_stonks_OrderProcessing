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
exports.accountRouter = void 0;
const app_1 = require("./../app");
const express_1 = __importDefault(require("express"));
const app_2 = require("./../app");
const positionsDB_1 = require("../runUpdate/positionsDB");
const accountValueDB_1 = require("../runUpdate/accountValueDB");
const processedOrderDB_1 = require("../runUpdate/processedOrderDB");
const accountRouter = express_1.default();
exports.accountRouter = accountRouter;
// API route that returns most recent data from positions, account, processed orders databases
accountRouter.get('/account', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    app_1.lock.acquire(app_1.lockKey, (done) => __awaiter(void 0, void 0, void 0, function* () {
        const positions = yield positionsDB_1.getPositionsFromDB(app_2.dynamodb);
        const accountValue = yield accountValueDB_1.getMostRecentAccountValue(app_2.dynamodb);
        const processedOrders = yield processedOrderDB_1.getMostRecentProcessedOrders(app_2.dynamodb);
        res.json({
            positions,
            accountValue,
            processedOrders,
            timestamp: new Date().getTime()
        });
        done();
    }));
}));
//# sourceMappingURL=account.js.map