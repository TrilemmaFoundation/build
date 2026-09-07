import {inject} from '@vercel/analytics';

export function redactAnalyticsUrl(url: string): string {
  try {
    const parsed = new URL(url, 'https://build.trilemma.foundation');
    parsed.search = '';
    return `${parsed.pathname}${parsed.hash}`;
  } catch {
    return url;
  }
}

inject({
  beforeSend(event) {
    if (!event.url) {
      return event;
    }
    return {...event, url: redactAnalyticsUrl(event.url)};
  },
});
