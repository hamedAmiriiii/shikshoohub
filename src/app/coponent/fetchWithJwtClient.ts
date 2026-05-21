'use client';

import { notifyShopAccessIfExpired } from '@/app/lib/shopAccess';
import tokenCode from './tokenCode';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'https://api.webinoplus.ir';

function resolveToken(session: unknown): string | null {
  if (typeof session === 'string' && session.trim() !== '') {
    return session;
  }
  return tokenCode();
}

function resolveBody(
  method: string,
  session: unknown,
  options: RequestInit,
): { body?: BodyInit; options: RequestInit } {
  const nextOptions = { ...options };

  if (method === 'GET' || method === 'DELETE') {
    return { options: nextOptions };
  }

  if (nextOptions.body !== undefined) {
    return { options: nextOptions };
  }

  // سازگاری با فراخوانی‌های قدیمی: آرگومان سوم به‌جای توکن، بدنهٔ JSON بوده
  if (session !== null && typeof session === 'object' && !Array.isArray(session)) {
    return {
      body: JSON.stringify(session),
      options: nextOptions,
    };
  }

  return { options: nextOptions };
}

export async function FetchWithJwtClient(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  session: string | Record<string, unknown> | null = null,
  params: Record<string, string | number | boolean> = {},
  options: RequestInit = {},
): Promise<any> {
  try {
    const token = resolveToken(session);
    const { body, options: resolvedOptions } = resolveBody(method, session, options);

    const headers = new Headers(resolvedOptions.headers || {});

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }
    if (body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const urlObj = new URL(url.startsWith('http') ? url : `${baseURL}${url}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        urlObj.searchParams.append(key, String(value));
      }
    });

    const response = await fetch(urlObj.toString(), {
      ...resolvedOptions,
      method,
      headers,
      ...(body !== undefined ? { body } : {}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const parsed = JSON.parse(errorText) as Record<string, unknown>;
        const errorResult = {
          hasError: true,
          statusCode: response.status,
          errorText,
          message: parsed.message,
          error: parsed.error,
          ...parsed,
        };
        notifyShopAccessIfExpired(errorResult);
        return errorResult;
      } catch {
        const errorResult = {
          hasError: true,
          statusCode: response.status,
          errorText,
          message: errorText || `خطای ${response.status}`,
        };
        notifyShopAccessIfExpired(errorResult);
        return errorResult;
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      hasError: true,
      statusCode: 0,
      message: error instanceof Error ? error.message : 'خطا در اتصال به سرور',
    };
  }
}
