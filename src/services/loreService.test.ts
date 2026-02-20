import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateQuestLore } from './loreService';

describe('loreService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubEnv('VITE_GOOGLE_API_KEY', 'test-key-long-enough');
  });

  it('returns fallback if API key is missing', async () => {
    vi.stubEnv('VITE_GOOGLE_API_KEY', '');
    const result = await generateQuestLore('Test Quest', 'daily');
    expect(result).toContain('consistency');
  });

  it('returns generated lore on success', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{ text: 'Ancient scrolls tell of a hero.' }]
          }
        }]
      })
    };
    (vi.mocked(fetch) as any).mockResolvedValue(mockResponse);

    const result = await generateQuestLore('Test Quest', 'one-off');
    expect(result).toBe('Ancient scrolls tell of a hero.');
  });

  it('returns fallback on API error', async () => {
    (vi.mocked(fetch) as any).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error')
    });

    const result = await generateQuestLore('Test Quest', 'daily');
    expect(result).toContain('consistency');
  });
});
