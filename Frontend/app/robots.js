const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kashvin.in';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep private / transactional routes out of search results.
      disallow: ['/admin', '/checkout', '/account', '/cart', '/order/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
