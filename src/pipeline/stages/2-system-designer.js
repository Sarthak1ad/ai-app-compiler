const { callGroqWithRetry } = require('../../utils/groq-client');

class SystemDesigner {
  static async design(intentIR) {
    const systemPrompt = `You are the System Design stage of an AI App Compiler.
Convert the provided Intent Intermediate Representation (IR) into a detailed Application Architecture Design.
Define entity relationships, primary pages/flows, and map roles to general capabilities.

Return ONLY valid JSON matching this structure:
{
  "architecture": {
    "dataModel": [
      {
        "entity": "string",
        "fields": ["string"],
        "relationships": [{"type": "hasMany|belongsTo|etc", "target": "string"}]
      }
    ],
    "pages": [
      {
        "name": "string",
        "purpose": "string",
        "accessibleByRoles": ["string"]
      }
    ],
    "workflows": [
      {
        "name": "string",
        "steps": ["string"]
      }
    ]
  }
}`;

    const responseText = await callGroqWithRetry([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Intent IR:\n${JSON.stringify(intentIR)}` }
    ], "llama-3.1-8b-instant");
    
    try {
      return JSON.parse(responseText);
    } catch (e) {
      throw new Error('Failed to parse System Design output as JSON');
    }
  }
}

module.exports = SystemDesigner;
