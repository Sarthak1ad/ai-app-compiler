const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Pipeline = require('./pipeline');
const AppGenerator = require('./runtime/app-generator');
const ExecutionValidator = require('./runtime/execution-validator');
const { getCostReport, resetCostTracking } = require('./utils/cost-tracker');
const { trackCost } = require('./utils/cost-tracker');
const { callGroqWithRetry } = require('./utils/groq-client');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

const generatedApps = new Map();
const compilationHistory = new Map(); // Store last compilation for mid-way modification

// Main compile endpoint
app.post('/api/compile', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  const pipeline = new Pipeline((update) => {
    console.log(`[Pipeline] ${update.stage} - ${update.status}: ${update.message || ''}`);
  });

  try {
    const result = await pipeline.compile(prompt);
    const execReport = ExecutionValidator.validate(result.schemas);
    result.diagnostics.executionReport = execReport;
    result.diagnostics.costs = getCostReport();

    if (result.success && execReport.passed) {
      const html = AppGenerator.generateHTML(result.schemas);
      const appId = require('crypto').randomUUID();
      generatedApps.set(appId, html);
      result.appPreviewUrl = `/api/preview/${appId}`;
    }

    // Store for mid-way modifications
    const sessionId = require('crypto').randomUUID();
    compilationHistory.set(sessionId, { prompt, schemas: result.schemas, ir: result.ir });
    result.sessionId = sessionId;

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Compilation failed', details: error.message, costs: getCostReport() });
  }
});

// ──────────────────────────────────────────────────────────
// MID-WAY MODIFICATION ENDPOINT
// Allows evaluators to modify requirements after initial generation
// without regenerating from scratch. This is a targeted update.
// ──────────────────────────────────────────────────────────
app.post('/api/refine', async (req, res) => {
  const { sessionId, modification } = req.body;
  if (!modification) return res.status(400).json({ error: 'Modification instruction is required' });

  const session = sessionId ? compilationHistory.get(sessionId) : null;
  if (!session) {
    return res.status(400).json({ error: 'No previous compilation found. Please compile first.' });
  }

  try {
    const systemPrompt = `You are the Schema Modification Engine for an AI App Compiler.
The user previously generated schemas for an app. Now they want to MODIFY the requirements.

Original prompt: "${session.prompt}"

Current schemas:
${JSON.stringify(session.schemas, null, 2)}

User's modification request: "${modification}"

Apply ONLY the requested changes to the existing schemas. Do NOT rebuild from scratch.
Keep everything that wasn't mentioned in the modification unchanged.
Return the FULL updated schemas as valid JSON:
{ "ui": {...}, "api": {...}, "db": {...}, "auth": {...} }`;

    const responseText = await callGroqWithRetry([
      { role: "user", content: systemPrompt }
    ], "llama-3.1-8b-instant");

    const updatedSchemas = JSON.parse(responseText);

    // Validate the updated schemas
    const Validator = require('./validation/validator');
    const validationResult = Validator.validate(updatedSchemas);

    // If invalid, try programmatic repair
    if (!validationResult.valid) {
      const Repairer = require('./validation/repairer');
      const repairResult = await Repairer.repair(updatedSchemas, validationResult.errors, session.ir?.intent || {});
      Object.assign(updatedSchemas, repairResult.repairedSchemas);
    }

    const execReport = ExecutionValidator.validate(updatedSchemas);
    
    // Generate new preview
    let appPreviewUrl = null;
    if (execReport.passed) {
      const html = AppGenerator.generateHTML(updatedSchemas);
      const appId = require('crypto').randomUUID();
      generatedApps.set(appId, html);
      appPreviewUrl = `/api/preview/${appId}`;
    }

    // Update session
    session.schemas = updatedSchemas;
    session.prompt = `${session.prompt}\n[MODIFICATION]: ${modification}`;

    res.json({
      success: true,
      schemas: updatedSchemas,
      appPreviewUrl,
      diagnostics: { costs: getCostReport(), executionReport: execReport, modification }
    });
  } catch (error) {
    res.status(500).json({ error: 'Refinement failed', details: error.message });
  }
});

// SSE endpoint for real-time progress
app.get('/api/compile/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const prompt = req.query.prompt;
  if (!prompt) {
    res.write(`data: ${JSON.stringify({ error: 'Prompt required' })}\n\n`);
    return res.end();
  }

  const pipeline = new Pipeline((update) => {
    res.write(`data: ${JSON.stringify(update)}\n\n`);
  });

  pipeline.compile(prompt).then(result => {
    const execReport = ExecutionValidator.validate(result.schemas);
    result.diagnostics.executionReport = execReport;
    result.diagnostics.costs = getCostReport();

    if (result.success && execReport.passed) {
      const html = AppGenerator.generateHTML(result.schemas);
      const appId = require('crypto').randomUUID();
      generatedApps.set(appId, html);
      result.appPreviewUrl = `/api/preview/${appId}`;
    }

    // Store session
    const sessionId = require('crypto').randomUUID();
    compilationHistory.set(sessionId, { prompt, schemas: result.schemas, ir: result.ir });
    result.sessionId = sessionId;
    
    res.write(`data: ${JSON.stringify({ type: 'final', result })}\n\n`);
    res.end();
  }).catch(error => {
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  });
});

app.get('/api/preview/:id', (req, res) => {
  const html = generatedApps.get(req.params.id);
  if (!html) return res.status(404).send('App preview not found or expired.');
  res.send(html);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGroqKey: !!process.env.GROQ_API_KEY });
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 AI App Compiler running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless deployment
module.exports = app;
