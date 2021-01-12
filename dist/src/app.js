"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.lockKey = exports.lock = exports.dynamodb = void 0;
const express_1 = __importDefault(require("express"));
const dotenv = __importStar(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const https_1 = __importDefault(require("https"));
const sns_1 = require("./routes/sns");
const account_1 = require("./routes/account");
const runUpdate_1 = require("./runUpdate/runUpdate");
const async_lock_1 = __importDefault(require("async-lock"));
const cors_1 = __importDefault(require("cors"));
dotenv.config();
console.log("if running locally, ensure ngrok is running, if not, ensure SNS order topic is subscribed to");
// configure aws and DynamoDB
aws_sdk_1.default.config.update({ region: 'us-east-1' });
exports.dynamodb = new aws_sdk_1.default.DynamoDB({
    apiVersion: '2012-08-10',
    httpOptions: {
        agent: new https_1.default.Agent({
            rejectUnauthorized: true,
            keepAlive: true
        })
    }
});
// set up lock for making sure writes to DB are not concurrent
exports.lock = new async_lock_1.default();
exports.lockKey = 'key';
const runUpdateWrapper = () => __awaiter(void 0, void 0, void 0, function* () {
    // only update from 9:00 to 16:30
    const startTime = 9 * 60;
    const endTime = 16 * 60 + 30;
    const date = new Date();
    const now = date.getHours() * 60 + date.getMinutes();
    if (startTime > now || now > endTime) {
        return;
    }
    runUpdate_1.runUpdate([], exports.dynamodb);
});
setInterval(runUpdateWrapper, 5000);
const app = express_1.default();
const port = 8080;
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.raw());
app.use(body_parser_1.default.text());
app.use(cors_1.default());
app.use('/sns', sns_1.router);
app.use('/data', account_1.accountRouter);
app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});
//# sourceMappingURL=app.js.map