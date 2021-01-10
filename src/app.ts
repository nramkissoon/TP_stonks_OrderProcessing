import express from "express";
import * as dotenv from 'dotenv';
import bodyparser from 'body-parser';
import AWS from 'aws-sdk';
import https from 'https';
import { router } from './routes/sns';
import { runUpdate } from './runUpdate/runUpdate'
import AsyncLock from 'async-lock';

dotenv.config();

console.log("if running locally, ensure ngrok is running, if not, ensure SNS order topic is subscribed to")

// configure aws and DynamoDB
AWS.config.update({ region: 'us-east-1' })
export const dynamodb = new AWS.DynamoDB({
  apiVersion: '2012-08-10',
    httpOptions: {
      agent: new https.Agent({
        rejectUnauthorized: true,
        keepAlive: true
      })
    }
})

// set up lock for making sure writes to DB are not concurrent
export const lock = new AsyncLock();
export const lockKey = 'key';

const runUpdateWrapper = async () => {
  // only update from 9:00 to 16:30
  const startTime = 9 * 60;
  const endTime = 16 * 60 + 30;
  const date = new Date()
  const now = date.getHours() * 60 + date.getMinutes();
  if (startTime > now || now > endTime) { return; }
  runUpdate([], dynamodb)
}


setInterval(runUpdateWrapper, 5000);

const app = express();
const port = 8080;


app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
app.use(bodyparser.raw());
app.use(bodyparser.text());

app.use('/sns', router);

app.listen(port, () => {
    console.log( `server started at http://localhost:${ port }` );
});