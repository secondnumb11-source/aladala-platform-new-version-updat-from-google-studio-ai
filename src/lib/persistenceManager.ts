/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ValidationResult {
  isValid: boolean;
  field?: string;
  message?: string;
}

/**
 * Validates a table payload before performing any DB write
 * Checks for common schema violations (null, undefined, or empty strings for required fields)
 */
export function validatePayload(table: 'cases' | 'clients' | 'tasks', data: any, isUpdate = false): ValidationResult {
  if (!data) {
    return { isValid: false, field: 'payload', message: 'Payload is empty or null' };
  }

  if (table === 'cases') {
    // Required fields: caseNumber, caseName, clientName, courtName
    const required = ['caseNumber', 'caseName', 'clientName', 'courtName'];
    for (const field of required) {
      if (isUpdate && data[field] === undefined) continue; // Partial updates can skip omitted fields
      if (data[field] === undefined || data[field] === null || String(data[field]).trim() === '') {
        return {
          isValid: false,
          field,
          message: `الحقل ${field} مطلوب للقضية ولا يمكن أن يكون فارغاً (Schema Violation)`
        };
      }
    }
  } else if (table === 'clients') {
    // Required fields: name, nationalId, phone
    const required = ['name', 'nationalId', 'phone'];
    for (const field of required) {
      if (isUpdate && data[field] === undefined) continue; // Partial updates can skip omitted fields
      if (data[field] === undefined || data[field] === null || String(data[field]).trim() === '') {
        return {
          isValid: false,
          field,
          message: `الحقل ${field} مطلوب للعميل ولا يمكن أن يكون فارغاً (Schema Violation)`
        };
      }
    }
  } else if (table === 'tasks') {
    // Required fields: title, dueDate
    const required = ['title', 'dueDate'];
    for (const field of required) {
      if (isUpdate && data[field] === undefined) continue; // Partial updates can skip omitted fields
      if (data[field] === undefined || data[field] === null || String(data[field]).trim() === '') {
        return {
          isValid: false,
          field,
          message: `الحقل ${field} مطلوب للمهمة ولا يمكن أن يكون فارغاً (Schema Violation)`
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Core retry mechanism helper
 * Runs a database operation with exponential backoff on retries
 */
export async function runWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 500
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      if (attempt > maxRetries || !navigator.onLine) {
        throw error;
      }
      console.warn(`[Persistence Retry] Attempt ${attempt} failed. Retrying in ${delayMs * attempt}ms...`, error);
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
}
