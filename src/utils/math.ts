
export const calculatePercentChange = (currentValue: number, previousValue: number) => {
  return parseFloat((((currentValue - previousValue) / previousValue) * 100).toFixed(2));
}

export const calculateAvgCostPerUnit = (currentAvg: number, quantityAdded: number, currentQuantity: number, price: number) => {
  const currentTotal = currentAvg * currentQuantity;
  return parseFloat(((currentTotal + (quantityAdded * price)) / (quantityAdded + currentQuantity)).toFixed(2));
}