class ExecutionValidator {
  static validate(schemas) {
    const report = {
      passed: true,
      checks: []
    };

    // 1. Check if at least one UI page exists
    if (!schemas.ui || !schemas.ui.pages || schemas.ui.pages.length === 0) {
      report.passed = false;
      report.checks.push({ status: 'failed', feature: 'ui', message: 'No pages generated for UI.' });
    } else {
      report.checks.push({ status: 'passed', feature: 'ui', message: `${schemas.ui.pages.length} pages ready to render.` });
    }

    // 2. Check if DB has tables to support API
    if (schemas.api && schemas.api.endpoints) {
      const endpointsWithEntities = schemas.api.endpoints.filter(ep => ep.entity);
      if (endpointsWithEntities.length > 0) {
        if (!schemas.db || !schemas.db.tables || schemas.db.tables.length === 0) {
          report.passed = false;
          report.checks.push({ status: 'failed', feature: 'db', message: 'API expects entities but no DB tables exist.' });
        } else {
          report.checks.push({ status: 'passed', feature: 'db', message: `DB tables exist to support API entities.` });
        }
      }
    }

    // 3. Simulated rendering pass
    try {
      const AppGenerator = require('./app-generator');
      const html = AppGenerator.generateHTML(schemas);
      if (html && html.includes('<!DOCTYPE html>')) {
        report.checks.push({ status: 'passed', feature: 'render', message: 'HTML generation successful.' });
      } else {
        throw new Error("HTML generation produced invalid output.");
      }
    } catch (e) {
      report.passed = false;
      report.checks.push({ status: 'failed', feature: 'render', message: `Execution failed during rendering: ${e.message}` });
    }

    return report;
  }
}

module.exports = ExecutionValidator;
