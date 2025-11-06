export const ADMIN_USERNAME = process.env.ADMIN_USERNAME! || 'admin';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD! || 'admin825419';

export function verifyCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}
