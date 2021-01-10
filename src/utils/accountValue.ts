import { calculatePercentChange } from './math'

export interface AccountValue {
  key: 'account_value',
  timestamp: number,
  mkt_value: number,
  day_gain_total: number,
  day_gain_percent: number,
  total_gain_total: number,
  total_gain_percent: number,
  previous_day_mkt_value: number,
}

const sameDay = (timestamp1: number, timestamp2: number) => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

export const calculateAccountValue = (positions: {}[], previousAccountValue: AccountValue) => {
  const timestamp = new Date().getTime();
  const accountValue: AccountValue = {
    key: 'account_value',
    timestamp: timestamp,
    mkt_value: 0,
    day_gain_total: 0,
    day_gain_percent: 0,
    total_gain_total: 0,
    total_gain_percent: 0,
    previous_day_mkt_value: 0,
  }
  if (!sameDay(timestamp, previousAccountValue.timestamp)) { // not the same day i.e. one is a prior day's account value
    accountValue.previous_day_mkt_value = previousAccountValue.mkt_value;
  } else {
    accountValue.previous_day_mkt_value = previousAccountValue.previous_day_mkt_value;
  }
  let totalMktValue = 0;
  positions.forEach((position) => {
    totalMktValue += position['mkt_value'];
  });
  accountValue.mkt_value = parseFloat(totalMktValue.toFixed(2));
  accountValue.day_gain_total = parseFloat((totalMktValue - accountValue.previous_day_mkt_value).toFixed(2));
  accountValue.total_gain_total = parseFloat((totalMktValue - previousAccountValue.mkt_value + previousAccountValue.total_gain_total).toFixed(2));
  accountValue.day_gain_percent = calculatePercentChange(totalMktValue, accountValue.previous_day_mkt_value);
  accountValue.total_gain_percent = calculatePercentChange(totalMktValue, totalMktValue - accountValue.total_gain_total);
  return accountValue;
}