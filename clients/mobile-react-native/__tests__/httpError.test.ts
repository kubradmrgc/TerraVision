import { toStatusMessage } from '../src/ui/httpError';

describe('toStatusMessage', () => {
  it('maps known http status to custom message', () => {
    const error = {
      isAxiosError: true,
      response: { status: 413 }
    } as unknown as Error;

    const message = toStatusMessage(error, 'fallback', { 413: 'Dosya cok buyuk.' });
    expect(message).toBe('Dosya cok buyuk.');
  });

  it('returns fallback for unknown errors', () => {
    const message = toStatusMessage(new Error('boom'), 'fallback', { 400: 'bad request' });
    expect(message).toBe('fallback');
  });
});
