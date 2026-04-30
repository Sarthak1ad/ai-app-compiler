require('dotenv').config();
const fs = require('fs');
const path = require('path');
const testPrompts = require('./test-prompts');
const Evaluator = require('./evaluator');

async function run() {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your-key')) {
    console.error("❌ GEMINI_API_KEY is not set or invalid in .env");
    console.error("Get a free key from https://aistudio.google.com/app/apikey");
    process.exit(1);
  }

  console.log("=========================================");
  console.log("🚀 Starting AI App Compiler Evaluation Suite");
  console.log("=========================================\n");

  const allPrompts = [...testPrompts.standard, ...testPrompts.edgeCases];
  
  console.log(`Running against ${allPrompts.length} test cases...`);
  
  const startTime = Date.now();
  const evaluationReport = await Evaluator.runEvaluation(allPrompts);
  const totalTime = Date.now() - startTime;

  console.log("\n=========================================");
  console.log("📊 EVALUATION SUMMARY");
  console.log("=========================================");
  console.log(`Total Tests : ${evaluationReport.summary.total}`);
  console.log(`Successes   : ${evaluationReport.summary.successes} (${((evaluationReport.summary.successes/evaluationReport.summary.total)*100).toFixed(1)}%)`);
  console.log(`Failures    : ${evaluationReport.summary.failures}`);
  console.log(`Avg Retries : ${evaluationReport.summary.avgRetries}`);
  console.log(`Avg Latency : ${(evaluationReport.summary.avgLatencyMs / 1000).toFixed(2)}s`);
  console.log(`Total Cost  : $${evaluationReport.summary.totalCostUSD}`);
  console.log(`Total Eval Time: ${(totalTime / 1000 / 60).toFixed(2)} mins`);
  console.log("=========================================");

  // Save report to disk
  const dir = path.join(__dirname, '../../evaluation-results');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  
  const filename = `eval-run-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(evaluationReport, null, 2));
  
  console.log(`\nDetailed report saved to evaluation-results/${filename}`);
  process.exit(0);
}

run();
