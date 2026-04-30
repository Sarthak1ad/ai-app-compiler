const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

/**
 * Validator — The core reliability engine of the AI App Compiler.
 * 
 * Performs two layers of validation:
 * 1. Structural Validation: Ensures each schema layer conforms to its JSON Schema definition.
 * 2. Cross-Layer Consistency: Ensures referential integrity across UI, API, DB, and Auth layers.
 * 
 * Design Decision: We use Ajv (JSON Schema validator) for structural checks because it gives
 * deterministic, machine-readable error reports that our repair engine can act on.
 * Cross-layer checks are custom logic because no standard schema language can express
 * inter-document relationships.
 */
class Validator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    
    const loadSchema = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, `../schemas/${name}-schema.json`), 'utf8'));
    
    this.uiValidator = this.ajv.compile(loadSchema('ui'));
    this.apiValidator = this.ajv.compile(loadSchema('api'));
    this.dbValidator = this.ajv.compile(loadSchema('db'));
    this.authValidator = this.ajv.compile(loadSchema('auth'));
  }

  static validate(schemas) {
    const validator = new Validator();
    const errors = [];

    // Guard: ensure all four schema layers exist
    if (!schemas.ui) errors.push({ type: 'missing_layer', layer: 'ui', message: 'UI schema is missing entirely' });
    if (!schemas.api) errors.push({ type: 'missing_layer', layer: 'api', message: 'API schema is missing entirely' });
    if (!schemas.db) errors.push({ type: 'missing_layer', layer: 'db', message: 'DB schema is missing entirely' });
    if (!schemas.auth) errors.push({ type: 'missing_layer', layer: 'auth', message: 'Auth schema is missing entirely' });

    if (errors.length > 0) return { valid: false, errors };

    // 1. Structural Validation (JSON Schema)
    if (!validator.uiValidator(schemas.ui)) {
      errors.push(...validator.uiValidator.errors.map(e => ({ type: 'structural', layer: 'ui', detail: e })));
    }
    if (!validator.apiValidator(schemas.api)) {
      errors.push(...validator.apiValidator.errors.map(e => ({ type: 'structural', layer: 'api', detail: e })));
    }
    if (!validator.dbValidator(schemas.db)) {
      errors.push(...validator.dbValidator.errors.map(e => ({ type: 'structural', layer: 'db', detail: e })));
    }
    if (!validator.authValidator(schemas.auth)) {
      errors.push(...validator.authValidator.errors.map(e => ({ type: 'structural', layer: 'auth', detail: e })));
    }

    // 2. Cross-Layer Consistency Validation
    const crossErrors = validator.checkConsistency(schemas);
    errors.push(...crossErrors);

    return {
      valid: errors.length === 0,
      errors,
      summary: {
        structuralErrors: errors.filter(e => e.type === 'structural').length,
        consistencyErrors: errors.filter(e => e.type === 'consistency').length,
        missingLayers: errors.filter(e => e.type === 'missing_layer').length
      }
    };
  }

  checkConsistency(schemas) {
    const errors = [];
    
    const tables = schemas.db.tables || [];
    const tableNames = tables.map(t => t.name);
    const endpoints = schemas.api.endpoints || [];
    const guards = schemas.auth.guards || [];
    const roles = (schemas.auth.roles || []).map(r => r.name);
    const pages = schemas.ui.pages || [];

    // ── API → DB: Every endpoint entity must have a matching DB table ──
    endpoints.forEach(ep => {
      if (ep.entity && !tableNames.includes(ep.entity)) {
        errors.push({ 
          type: 'consistency', layer: 'api-db', 
          message: `API endpoint "${ep.id}" references entity "${ep.entity}" but no DB table exists with that name.`,
          fix: 'programmatic', action: 'add_table', entity: ep.entity
        });
      }
    });

    // ── DB → DB: Relation targets must be valid table names ──
    tables.forEach(table => {
      (table.relations || []).forEach(rel => {
        if (!tableNames.includes(rel.target)) {
          errors.push({ 
            type: 'consistency', layer: 'db', 
            message: `Table "${table.name}" relation references unknown target: "${rel.target}"`,
            fix: 'programmatic', action: 'remove_relation', table: table.name, target: rel.target
          });
        }
      });
      // Column foreign key references
      (table.columns || []).forEach(col => {
        if (col.references && !tableNames.includes(col.references.table)) {
          errors.push({ 
            type: 'consistency', layer: 'db', 
            message: `Column "${table.name}.${col.name}" references unknown table: "${col.references.table}"`,
            fix: 'programmatic', action: 'remove_reference', table: table.name, column: col.name
          });
        }
      });
    });

    // ── Auth → Roles: Guards must reference defined roles ──
    guards.forEach(guard => {
      (guard.roles || []).forEach(role => {
        if (!roles.includes(role)) {
          errors.push({ 
            type: 'consistency', layer: 'auth', 
            message: `Guard for "${guard.path}" references undefined role: "${role}"`,
            fix: 'programmatic', action: 'add_role', role: role
          });
        }
      });
    });

    // ── UI → Auth: Protected pages should have matching auth guards ──
    pages.forEach(page => {
      if (page.authRequired) {
        const hasGuard = guards.some(g => g.path === page.path);
        if (!hasGuard) {
          errors.push({ 
            type: 'consistency', layer: 'ui-auth', 
            message: `Page "${page.name}" (${page.path}) requires auth but has no matching auth guard.`,
            fix: 'programmatic', action: 'add_guard', path: page.path, roles: page.roles || ['user']
          });
        }
      }
    });

    // ── Auth → UI: Every guard path should correspond to a real page ──
    const pagePaths = pages.map(p => p.path);
    guards.forEach(guard => {
      if (!pagePaths.includes(guard.path) && !endpoints.some(ep => guard.path.includes(ep.path))) {
        errors.push({ 
          type: 'consistency', layer: 'auth-ui', 
          message: `Auth guard for path "${guard.path}" doesn't match any UI page or API endpoint.`
        });
      }
    });

    return errors;
  }
}

module.exports = Validator;
