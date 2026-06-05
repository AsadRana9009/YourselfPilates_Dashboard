export function parseJwt(token: string) {
  try {
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
}

export function getTokenExpiration(token: string): number | null {
  try {
    const decoded = parseJwt(token);
    return decoded?.exp || null;
  } catch {
    return null;
  }
}
