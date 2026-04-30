const Groq = require('groq-sdk');
const { trackCost } = require('../utils/cost-tracker');

class Repairer {
  static programmaticRepair(schemas, errors) {
    const repaired = JSON.parse(JSON.stringify(schemas));
    const fixed = [];
    const remaining = [];

    for (const error of errors) {
      if (error.fix === 'programmatic') {
        try {
          switch (error.action) {
            case 'add_role':
              if (!repaired.auth.roles.find(r => r.name === error.role)) {
                repaired.auth.roles.push({ name: error.role, description: `Auto-generated role` });
                fixed.push(error);
              }
              break;
            case 'add_guard':
              repaired.auth.guards.push({ path: error.path, roles: error.roles || ['user'], redirect: '/login' });
              fixed.push(error);
              break;
            case 'remove_relation':
              const table = repaired.db.tables.find(t => t.name === error.table);
              if (table) { table.relations = (table.relations || []).filter(r => r.target !== error.target); fixed.push(error); }
              break;
            case 'remove_reference':
              const tbl = repaired.db.tables.find(t => t.name === error.table);
              if (tbl) { const col = tbl.columns.find(c => c.name === error.column); if (col) { delete col.references; fixed.push(error); } }
              break;
            default: remaining.push(error);
          }
        } catch (e) { remaining.push(error); }
      } else if (error.type === 'structural' && error.detail && error.detail.keyword === 'required') {
        const prop = error.detail.params?.missingProperty;
        const layer = error.layer;
        if (layer === 'ui' && prop === 'theme') { repaired.ui.theme = { primaryColor: '#3b82f6', mode: 'light' }; fixed.push(error); }
        else if (layer === 'ui' && prop === 'navigation') { repaired.ui.navigation = { type: 'sidebar', items: [] }; fixed.push(error); }
        else if (layer === 'api' && prop === 'baseUrl') { repaired.api.baseUrl = '/api/v1'; fixed.push(error); }
        else if (layer === 'api' && prop === 'version') { repaired.api.version = '1.0.0'; fixed.push(error); }
        else if (layer === 'auth' && prop === 'guards') { repaired.auth.guards = []; fixed.push(error); }
        else if (layer === 'auth' && prop === 'permissions') { repaired.auth.permissions = []; fixed.push(error); }
        else remaining.push(error);
      } else {
        remaining.push(error);
      }
    }
    return { repairedSchemas: repaired, fixed, remaining };
  }

  static async repair(schemas, errors, intentIR) {
    const { repairedSchemas: afterProgrammatic, fixed: programmaticFixes, remaining } = 
      Repairer.programmaticRepair(schemas, errors);
    console.log(`  [Repair] Programmatic: fixed ${programmaticFixes.length}, remaining ${remaining.length}`);

    if (remaining.length === 0) {
      return { repairedSchemas: afterProgrammatic, successfulRepairs: programmaticFixes, failedRepairs: [], repairMethod: 'programmatic' };
    }

    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      
      const prompt = `You are the Repair Engine for an AI App Compiler. Fix THESE SPECIFIC ERRORS:\n${JSON.stringify(remaining, null, 2)}\n\nOriginal Intent:\n${JSON.stringify(intentIR)}\n\nReturn ONLY valid JSON with repaired schemas: { "ui": {...}, "api": {...}, "db": {...}, "auth": {...} }\n\nSchemas to repair:\n${JSON.stringify(afterProgrammatic)}`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "user", content: prompt }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const responseText = chatCompletion.choices[0]?.message?.content || "{}";
      const usage = chatCompletion.usage || { prompt_tokens: 0, completion_tokens: 0 };
      trackCost('llama-3.1-8b-instant', { prompt: usage.prompt_tokens, completion: usage.completion_tokens });
      
      const repairedSchemas = JSON.parse(responseText);
      
      return { repairedSchemas, successfulRepairs: [...programmaticFixes, ...remaining], failedRepairs: [], repairMethod: 'hybrid' };
    } catch (e) {
      console.error('  [Repair] LLM repair failed:', e.message);
      return { repairedSchemas: afterProgrammatic, successfulRepairs: programmaticFixes, failedRepairs: remaining, repairMethod: 'programmatic_only' };
    }
  }
}

module.exports = Repairer;
