/**
 * Utility for generating secure, professional credentials for client access.
 */

export const generateUsername = (name: string, nationalId: string): string => {
  // Use first name and last 4 digits of national ID
  const firstName = name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const idSuffix = nationalId.slice(-4);
  return `${firstName}${idSuffix}`;
};

export const generatePassword = (): string => {
  // Generate a professional-looking random password (e.g., ADAL-1234-CORE)
  const prefix = "ADAL";
  const num = Math.floor(1000 + Math.random() * 9000);
  const suffix = "CORE";
  return `${prefix}-${num}-${suffix}`;
};
