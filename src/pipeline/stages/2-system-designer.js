const Groq = require('groq-sdk');
const { trackCost } = require('../../utils/cost-tracker');

class SystemDesigner {
  static async design(intentIR) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
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

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Intent IR:\n${JSON.stringify(intentIR)}` }
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
      throw new Error('Failed to parse System Design output as JSON');
    }
  }
}

module.exports = SystemDesigner;
