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
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const snsMessaging_1 = require("./../utils/snsMessaging");
const runUpdate_1 = require("./../runUpdate/runUpdate");
const app_1 = require("./../app");
const logger_1 = require("./../utils/logger");
// create the route for receiving stock orders from SNS Topic
const router = express_1.default();
exports.router = router;
router.post('/orders', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = JSON.parse(req.body);
    const headers = req.headers;
    // if endpoint is unsubscribed, subscribe to it and confirm
    if (headers['x-amz-sns-message-type'] === 'SubscriptionConfirmation') {
        logger_1.log("Received subscription confirmation request...");
        if (body['TopicArn'] === process.env.ORDER_TOPIC_ARN) { // ACCEPT FROM ONLY SPECIFIC TOPIC ARN
            const confirmSubParams = {
                Token: body['Token'],
                TopicArn: body['TopicArn'],
                AuthenticateOnUnsubscribe: 'true'
            };
            new aws_sdk_1.default.SNS().confirmSubscription(confirmSubParams, (err, data) => {
                if (err)
                    logger_1.log(`Error confirming subscription to Topic Arn: ${err.name} - ${err.message}`);
                else
                    logger_1.log(data.SubscriptionArn);
            });
        }
        return;
    }
    // if SNS message is a stock order
    else if (headers['x-amz-sns-message-type'] === 'Notification') {
        const message = body['Message'];
        const orders = snsMessaging_1.getOrdersFromSNSMessage(message);
        runUpdate_1.runUpdate(orders, app_1.dynamodb);
        res.status(200); // sent back to AWS to confirm message received
        return;
    }
}));
//# sourceMappingURL=sns.js.map