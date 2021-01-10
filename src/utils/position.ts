import { calculatePercentChange } from './math'

export interface CashPosition {
  POSITION: { S: string },
  mkt_value: { N: number },
  asset_type: { S: 'Cash' },
}

export interface EquityPosition{
  POSITION: string ,
  mkt_value: number,
  asset_type: 'Equity' ,
  price:number ,
  average_cost_per_unit: number ,
  day_gain_total: number ,
  day_gain_percent: number ,
  total_gain_total: number ,
  total_gain_percent: number ,
  quantity: number 
}

export const getTotalNonCashPositions = (positions: {}[]) => {
  let total = 0;
  positions.forEach((position) => {
    if (!position['asset_type'] ) { }
    else if (position['asset_type'] !== 'Cash') {
      total += 1;
    }
  });
  return total;
}

export const getNonCashPositionTickers = (positions: {}[]) => {
  const tickers = new Set();
  positions.forEach((position) => {
    if (!position['asset_type'] ) { }
    else if (position['asset_type'] !== 'Cash') {
      tickers.add(position['POSITION']);
    }
  });
  return tickers;
}

export const getTotalCashPosition = (positions: {}[]) => {
  let total = 0;
  positions.forEach((position) => {
    if (!position['asset_type'] ) { }
    else if (position['asset_type'] === 'Cash') {
      total += parseFloat(position['mkt_value']);
    }
  });
  return total;
}

export const removeCash = (positions: {}[], cashToRemove: number) => {
  positions.forEach((position) => {
    if (!position['asset_type']) { }
    else if (position['asset_type'] === 'Cash') {
      position['mkt_value'] = parseFloat((position['mkt_value'] - cashToRemove).toFixed(2));
    }
  });
}

export const removeEquityPositionsWithZeroQuantity = (positions: {}[]) => {
  let indexesToRemove: number[] = [];
  let i;
  for (i = 0; i < positions.length; i += 1) {
    let position = positions[i];
    if (!position['asset_type'] || !position['asset_type']) { }
    else if (position['asset_type'] === 'Equity') {
      if (position['quantity'] === 0) {
        indexesToRemove.push(i)
      }
    }
  }
  indexesToRemove.forEach((index) => {
    positions.splice(index, 1)
  });
}

export const alreadyHasEquityPosition = (ticker: string, positions: {}[]) => {
  let result = false;
  positions.forEach((position) => {
    if (position['POSITION'] === ticker) { result = true; }
  });
  return result;
} 

// update equity positions based on most recent quote data
// need to update price, mkt_value, day_gain_total/percent, total_gain_total/percent
export const updateEquityPositions = (positions: {}[], quoteData: {}) => {
  positions.forEach((position: any) => {
    if (!position['asset_type']) { }
    else if (position['asset_type'] === 'Equity') {
      const ticker = position['POSITION'];
      if (quoteData[ticker]) {
        position['price'] = quoteData[ticker]['mark'];
        const price = position['price'];
        const quantity = position['quantity'];
        position['mkt_value'] = parseFloat((price * quantity).toFixed(2));
        const mktValue = position['mkt_value'];
        const avgCost: number = position['average_cost_per_unit'];
        position['day_gain_total'] = quoteData[ticker]['markChangeInDouble'];
        position['day_gain_percent'] = quoteData[ticker]['markPercentChangeInDouble'];
        position['total_gain_total'] = parseFloat((mktValue - (avgCost * quantity)).toFixed(2));
        position['total_gain_percent'] = calculatePercentChange(mktValue, avgCost * quantity);
      }
    }
  });
}