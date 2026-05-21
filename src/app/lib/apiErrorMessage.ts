export function getApiErrorMessage(res: any, fallback: string): string {
  if (!res) return fallback;
  if (typeof res.message === 'string') return res.message;
  if (typeof res.error === 'string') return res.error;
  if (typeof res.errorText === 'string') {
    try {
      const parsed = JSON.parse(res.errorText);
      if (typeof parsed.message === 'string') return parsed.message;
      if (typeof parsed.error === 'string') return parsed.error;
    } catch {
      if (res.errorText && res.errorText !== 'fetch failed') return res.errorText;
    }
  }
  return fallback;
}
