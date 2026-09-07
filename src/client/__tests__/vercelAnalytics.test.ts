import {inject} from '@vercel/analytics';
import {redactAnalyticsUrl} from '../vercelAnalytics';

jest.mock('@vercel/analytics', () => ({
  inject: jest.fn(),
}));

describe('Vercel analytics redaction', () => {
  it('strips search strings before they leave the browser', () => {
    expect(redactAnalyticsUrl('/search?q=secret#section')).toBe('/search#section');
    expect(redactAnalyticsUrl('/docs/contribute')).toBe('/docs/contribute');
    expect(redactAnalyticsUrl('http://[')).toBe('http://[');
  });

  it('registers a beforeSend hook that redacts or passes through events', () => {
    const mockedInject = inject as jest.MockedFunction<typeof inject>;
    expect(mockedInject).toHaveBeenCalled();
    const beforeSend = mockedInject.mock.calls[0]?.[0]?.beforeSend;
    expect(beforeSend).toEqual(expect.any(Function));
    expect(beforeSend?.({ type: "pageview", url: "/search?q=secret" })).toEqual({
      type: "pageview",
      url: "/search",
    });
    expect(beforeSend?.({ type: "event" } as never)).toEqual({ type: "event" });
  });
});
