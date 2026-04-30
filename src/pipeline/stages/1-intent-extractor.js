const { callGroqWithRetry } = require('../../utils/groq-client');

class IntentExtractor {
  static async extract(prompt) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const systemPrompt = `You are the Intent Extraction stage of an AI App Compiler.
Your job is to parse open-ended user requirements into a structured Intermediate Representation (IR).

CRITICAL RULES:
1. Extract: app type, features, user roles, data entities, business rules.
2. If the prompt is VAGUE (e.g. "make an app"), make reasonable assumptions and list ALL of them in the "assumptions" array.
3. If the prompt has CONFLICTING requirements (e.g. "no auth" + "role-based access"), document the conflict in "conflicts" and resolve it sensibly.
4. If the prompt is NOT about building software (e.g. "how to bake a cake"), set "isSoftwareRequest" to false and provide a minimal valid structure anyway.
5. ALWAYS produce valid output no matter what the input is.

Return ONLY valid JSON matching this structure:
{
  "appName": "string - a concise name for the app",
  "appType": "string - e.g. crm, ecommerce, lms, saas_tool, social_network, etc.",
  "isSoftwareRequest": true,
  "features": ["string"],
  "roles": ["string - at minimum include 'user'"],
  "entities": ["string - core data objects"],
  "businessRules": ["string - explicit rules from the prompt"],
  "assumptions": ["string - things NOT stated but assumed by you"],
  "conflicts": ["string - any contradictions detected in the prompt"]
}`;

    const responseText = await callGroqWithRetry([
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ], "llama-3.1-8b-instant");
    
    try {
      const parsed = JSON.parse(responseText);
      // Ensure minimum viable structure
      if (!parsed.roles || parsed.roles.length === 0) parsed.roles = ['user'];
      if (!parsed.entities || parsed.entities.length === 0) parsed.entities = ['user'];
      if (!parsed.features || parsed.features.length === 0) parsed.features = ['dashboard'];
      if (!parsed.assumptions) parsed.assumptions = [];
      if (!parsed.conflicts) parsed.conflicts = [];
      return parsed;
    } catch (e) {
      throw new Error('Failed to parse Intent Extraction output as JSON');
    }
  }
}

module.exports = IntentExtractor;
