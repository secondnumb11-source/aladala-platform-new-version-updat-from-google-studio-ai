/**
 * Utility to convert between camelCase (Frontend/Types) and snake_case (PostgreSQL/Supabase).
 */

export function toCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamel(v));
  } else if (obj !== null && obj !== undefined && obj.constructor === Object) {
    const excluded = ['last_sync_at', 'attachments_count', 'content_text'];
    return Object.keys(obj).reduce(
      (result, key) => {
        if (excluded.includes(key)) {
          return { ...result, [key]: toCamel(obj[key]) };
        }
        return {
          ...result,
          [key.replace(/(_\w)/g, (m) => m[1].toUpperCase())]: toCamel(obj[key]),
        };
      },
      {}
    );
  }
  return obj;
}

export function toSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => toSnake(v));
  } else if (obj !== null && obj !== undefined && obj.constructor === Object) {
    const omittedFields = [
      'last_sync_at', 'attachments_count', 'content_text', 'cases_count', 'tasks_count',
      'attachments', 'archivedDocuments', 'financialRecords', 'hearings', 'judgments', 
      'tasks', 'notes', 'relatedParties', 'powersOfAttorney', 'executionRequests', 
      'communicationHistory', 'communicationLog', 'timeline', 'history'
    ];
    return Object.keys(obj).reduce(
      (result, key) => {
        if (omittedFields.includes(key)) {
          return result;
        }
        return {
          ...result,
          [key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)]: toSnake(obj[key]),
        };
      },
      {}
    );
  }
  return obj;
}

/**
 * Specifically for entities with complex mappings if needed, 
 * but general converters above handle 90% of cases like clientId -> client_id.
 */
