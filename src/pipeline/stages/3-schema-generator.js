const Groq = require('groq-sdk');
const { trackCost } = require('../../utils/cost-tracker');
const fs = require('fs');
const path = require('path');

class SchemaGenerator {
  static async generate(designIR) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    // Load JSON schemas for constraints
    const uiSchemaDef = fs.readFileSync(path.join(__dirname, '../../schemas/ui-schema.json'), 'utf8');
    const apiSchemaDef = fs.readFileSync(path.join(__dirname, '../../schemas/api-schema.json'), 'utf8');
    const dbSchemaDef = fs.readFileSync(path.join(__dirname, '../../schemas/db-schema.json'), 'utf8');
    const authSchemaDef = fs.readFileSync(path.join(__dirname, '../../schemas/auth-schema.json'), 'utf8');

    const systemPrompt = `You are the Schema Generation stage of an AI App Compiler.
Based on the provided System Design IR, generate four strict, consistent schemas: UI, API, DB, and Auth.
You MUST strictly adhere to the provided JSON Schema definitions for each.
Ensure cross-layer consistency:
- API fields must match DB columns
- UI fields must map to API endpoints
- Auth rules must cover all protected routes/endpoints

Return ONLY valid JSON containing all four schemas:
{
  "ui": <UI Schema object matching ui-schema.json>,
  "api": <API Schema object matching api-schema.json>,
  "db": <DB Schema object matching db-schema.json>,
  "auth": <Auth Schema object matching auth-schema.json>
}

JSON Schema constraints:
UI: ${uiSchemaDef}
API: ${apiSchemaDef}
DB: ${dbSchemaDef}
Auth: ${authSchemaDef}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `System Design IR:\n${JSON.stringify(designIR)}` }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "{}";
    const usage = chatCompletion.usage || { prompt_tokens: 0, completion_tokens: 0 };
    trackCost('llama-3.1-8b-instant', { prompt: usage.prompt_tokens, completion: usage.completion_tokens });
    
    try {
      return JSON.parse(responseText);
    } catch (e) {
      throw new Error('Failed to parse Schema Generation output as JSON');
    }
  }
}

module.exports = SchemaGenerator;
