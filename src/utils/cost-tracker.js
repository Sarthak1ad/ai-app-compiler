const state = {
  totalTokens: {
    'llama-3.1-8b-instant': { prompt: 0, completion: 0 }
  },
  costEstimates: {
    'llama-3.1-8b-instant': { prompt: 0, completion: 0 } // Very low cost or free
  }
};

function trackCost(model, usage) {
  if (!usage) return;
  if (!state.totalTokens[model]) {
    state.totalTokens[model] = { prompt: 0, completion: 0 };
  }
  state.totalTokens[model].prompt += usage.prompt || 0;
  state.totalTokens[model].completion += usage.completion || 0;
}

function getCostReport() {
  let totalCost = 0;
  const breakdown = {};

  for (const [model, tokens] of Object.entries(state.totalTokens)) {
    const rates = state.costEstimates[model] || { prompt: 0, completion: 0 };
    const modelCost = (tokens.prompt * rates.prompt) + (tokens.completion * rates.completion);
    breakdown[model] = { tokens, estimatedCostUSD: Number(modelCost.toFixed(6)) };
    totalCost += modelCost;
  }

  return {
    totalEstimatedCostUSD: Number(totalCost.toFixed(6)),
    breakdown
  };
}

function resetCostTracking() {
  for (const model of Object.keys(state.totalTokens)) {
    state.totalTokens[model] = { prompt: 0, completion: 0 };
  }
}

module.exports = { trackCost, getCostReport, resetCostTracking };
