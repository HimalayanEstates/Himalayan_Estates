import { NextResponse } from 'next/server';

export function apiError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, details, timestamp: new Date().toISOString() } }, { status });
}

export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export function parseOptionalNonNegativeBigInt(value: string | null): { value?: bigint; error?: string } {
  if (value === null || value.trim() === '') return {};
  if (!/^\d+$/.test(value.trim())) return { error: 'must be a non-negative integer' };
  return { value: BigInt(value.trim()) };
}
