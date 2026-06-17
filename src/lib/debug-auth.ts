export function logDiagnosticData(context: string, data: any) {
  console.info(`[Auth Diagnostic - ${context}]:`, data);
  try {
    const diagnosticLog = {
      timestamp: new Date().toISOString(),
      context,
      data,
      url: window.location.href,
      origin: window.location.origin
    };
    
    const existingLogsJson = localStorage.getItem('auth_diagnostic_logs');
    let logs: any[] = [];
    if (existingLogsJson) {
      try {
        logs = JSON.parse(existingLogsJson);
      } catch (e) {}
    }
    
    logs.push(diagnosticLog);
    if (logs.length > 20) logs = logs.slice(-20);
    
    localStorage.setItem('auth_diagnostic_logs', JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to write diagnostic to localStorage:', err);
  }
}

export function logAuthError(context: string, error: any) {
  console.error(`[Auth Error - ${context}]:`, error);
  try {
    const errorLog = {
      timestamp: new Date().toISOString(),
      context,
      message: error?.message || 'Unknown error',
      code: error?.code,
      details: error,
      url: window.location.href,
    };
    
    // Read existing logs
    const existingLogsJson = localStorage.getItem('auth_error_logs');
    let logs: any[] = [];
    if (existingLogsJson) {
      try {
        logs = JSON.parse(existingLogsJson);
      } catch (e) {
        // ignore
      }
    }
    
    // Add new log and keep last 20
    logs.push(errorLog);
    if (logs.length > 20) {
      logs = logs.slice(-20);
    }
    
    localStorage.setItem('auth_error_logs', JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to write auth error to localStorage:', err);
  }
}
