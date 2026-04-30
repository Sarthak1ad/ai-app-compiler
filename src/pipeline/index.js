const IntentExtractor = require('./stages/1-intent-extractor');
const SystemDesigner = require('./stages/2-system-designer');
const SchemaGenerator = require('./stages/3-schema-generator');
const Refiner = require('./stages/4-refiner');
const { trackCost } = require('../utils/cost-tracker');

class Pipeline {
  constructor(updateCallback = () => {}) {
    this.updateCallback = updateCallback;
    this.metrics = {
      startTime: 0,
      endTime: 0,
      stageTimings: {},
      retries: 0
    };
  }

  async compile(prompt) {
    this.metrics.startTime = Date.now();
    this.updateCallback({ stage: 'start', message: 'Starting compilation pipeline...' });

    try {
      // Stage 1: Intent Extraction
      this.updateCallback({ stage: 'intent', status: 'running', message: 'Extracting intent from prompt...' });
      const stage1Start = Date.now();
      const intentIR = await IntentExtractor.extract(prompt);
      this.metrics.stageTimings.intent = Date.now() - stage1Start;
      this.updateCallback({ stage: 'intent', status: 'done', data: intentIR });

      // Stage 2: System Design
      this.updateCallback({ stage: 'design', status: 'running', message: 'Designing system architecture...' });
      const stage2Start = Date.now();
      const designIR = await SystemDesigner.design(intentIR);
      this.metrics.stageTimings.design = Date.now() - stage2Start;
      this.updateCallback({ stage: 'design', status: 'done', data: designIR });

      // Stage 3: Schema Generation
      this.updateCallback({ stage: 'schema', status: 'running', message: 'Generating core schemas...' });
      const stage3Start = Date.now();
      const rawSchemas = await SchemaGenerator.generate(designIR);
      this.metrics.stageTimings.schema = Date.now() - stage3Start;
      this.updateCallback({ stage: 'schema', status: 'done', data: rawSchemas });

      // Stage 4: Refinement and Validation
      this.updateCallback({ stage: 'refine', status: 'running', message: 'Refining and cross-validating schemas...' });
      const stage4Start = Date.now();
      const { schemas: finalSchemas, repairReport } = await Refiner.refine(rawSchemas, intentIR);
      this.metrics.stageTimings.refine = Date.now() - stage4Start;
      this.metrics.retries = repairReport.retries;
      this.updateCallback({ stage: 'refine', status: 'done', data: { schemas: finalSchemas, report: repairReport } });

      this.metrics.endTime = Date.now();
      const totalTime = this.metrics.endTime - this.metrics.startTime;
      
      const result = {
        success: true,
        schemas: finalSchemas,
        ir: { intent: intentIR, design: designIR },
        diagnostics: {
          metrics: { ...this.metrics, totalTime },
          repairReport
        }
      };

      this.updateCallback({ stage: 'complete', status: 'done', data: result });
      return result;

    } catch (error) {
      this.metrics.endTime = Date.now();
      console.error('Pipeline failed:', error);
      const errorResult = {
        success: false,
        error: error.message,
        stage: error.stage || 'unknown',
        diagnostics: { metrics: this.metrics }
      };
      this.updateCallback({ stage: 'error', status: 'failed', data: errorResult });
      throw error;
    }
  }
}

module.exports = Pipeline;
