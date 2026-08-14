import { describe, it, expect } from 'vitest';
import { AxiosError } from 'axios';
import { getApiErrorMessage } from './api';

describe('getApiErrorMessage', () => {
  it('extracts message from API error envelope', () => {
    const error = new AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        data: { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: {} as never,
      }
    );
    expect(getApiErrorMessage(error)).toBe('Invalid credentials');
  });

  it('falls back to axios message', () => {
    const error = new AxiosError('Network Error');
    expect(getApiErrorMessage(error)).toBe('Network Error');
  });

  it('handles unknown errors', () => {
    expect(getApiErrorMessage(new Error('boom'))).toBe('An unexpected error occurred');
  });

  it('joins validation details when present', () => {
    const error = new AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        data: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: [
              { field: 'email', message: 'Invalid email' },
              { field: 'password', message: 'Too short' },
            ],
          },
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as never,
      }
    );
    expect(getApiErrorMessage(error)).toBe('Invalid email. Too short');
  });
});
