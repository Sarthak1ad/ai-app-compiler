const fs = require('fs');
const path = require('path');
const Pipeline = require('../pipeline');
const ExecutionValidator = require('../runtime/execution-validator');
const { getCostReport, resetCostTracking } = require('../utils/cost-tracker');

class Evaluator {
  static async runEvaluation(prompts) {
    const results = [];
    const summary = {
      total: prompts.length,
      successes: 0,
      failures: 0,
      avgRetries: 0,
      totalCostUSD: 0,
      avgLatencyMs: 0
    };

    let totalRetries = 0;
    let totalLatency = 0;

    for (const item of prompts) {
      console.log(`\nEvaluating [${item.id}]: ${item.prompt.substring(0, 50)}...`);
      
      resetCostTracking(); // Track cost per prompt
      
      // Silence pipeline logs for clean eval output
      const pipeline = new Pipeline(() => {});
      
      try {
        const result = await pipeline.compile(item.prompt);
        const execReport = ExecutionValidator.validate(result.schemas);
        const costs = getCostReport();

        const success = result.success && execReport.passed;
        
        if (success) summary.successes++;
        else summary.failures++;

        totalRetries += result.diagnostics.repairReport.retries;
        totalLatency += result.diagnostics.metrics.totalTime;
        summary.totalCostUSD += costs.totalEstimatedCostUSD;

        results.push({
          id: item.id,
          type: item.type || 'standard',
          success,
          retries: result.diagnostics.repairReport.retries,
          latencyMs: result.diagnostics.metrics.totalTime,
          costUSD: costs.totalEstimatedCostUSD,
          failureReason: success ? null : (!result.success ? 'Compilation Failed' : 'Execution Failed'),
          unresolvedSchemaErrors: result.diagnostics.repairReport.unresolvedErrors.length
        });

        console.log(`-> ${success ? '✅ PASS' : '❌ FAIL'} | Retries: ${result.diagnostics.repairReport.retries} | Cost: $${costs.totalEstimatedCostUSD.toFixed(4)}`);

      } catch (error) {
        summary.failures++;
        const costs = getCostReport();
        summary.totalCostUSD += costs.totalEstimatedCostUSD;
        
        results.push({
          id: item.id,
          type: item.type || 'standard',
          success: false,
          retries: 0,
          latencyMs: 0,
          costUSD: costs.totalEstimatedCostUSD,
          failureReason: `Exception: ${error.message}`,
          unresolvedSchemaErrors: -1
        });
        
        console.log(`-> ❌ EXCEPTION: ${error.message}`);
      }
    }

    summary.avgRetries = (totalRetries / prompts.length).toFixed(2);
    summary.avgLatencyMs = (totalLatency / prompts.length).toFixed(0);
    summary.totalCostUSD = Number(summary.totalCostUSD.toFixed(4));

    return { summary, results };
  }
}

module.exports = Evaluator;
