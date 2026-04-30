const Validator = require('../../validation/validator');
const Repairer = require('../../validation/repairer');

class Refiner {
  static async refine(rawSchemas, intentIR) {
    let currentSchemas = JSON.parse(JSON.stringify(rawSchemas)); // Deep copy
    const repairReport = {
      initialErrors: [],
      retries: 0,
      repairedErrors: [],
      unresolvedErrors: []
    };

    const maxRetries = 3;
    let isValid = false;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // Step 1: Validate current schemas
      const validationResult = Validator.validate(currentSchemas);
      
      if (attempt === 0) {
        repairReport.initialErrors = validationResult.errors;
      }

      if (validationResult.valid) {
        isValid = true;
        break;
      }

      // If we've reached max retries and it's still invalid, stop trying
      if (attempt === maxRetries) {
        repairReport.unresolvedErrors = validationResult.errors;
        break;
      }

      repairReport.retries++;
      
      // Step 2: Attempt repairs
      const repairResult = await Repairer.repair(currentSchemas, validationResult.errors, intentIR);
      currentSchemas = repairResult.repairedSchemas;
      
      repairReport.repairedErrors.push(...repairResult.successfulRepairs);
      
      // Some errors might be unrepairable without complete context restart
      if (repairResult.failedRepairs.length > 0) {
        repairReport.unresolvedErrors = repairResult.failedRepairs;
        // Depending on strictness, we might throw here. 
        // For now, we continue to see if subsequent repairs fix cascading issues.
      }
    }

    if (!isValid && repairReport.unresolvedErrors.length > 0) {
       console.warn("Compilation finished with unresolved schema errors.", repairReport.unresolvedErrors);
    }

    return {
      schemas: currentSchemas,
      repairReport
    };
  }
}

module.exports = Refiner;
