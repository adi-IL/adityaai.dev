import { Helmet } from 'react-helmet-async';

export interface Breadcrumb {
  name: string;
  url: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  twitterHandle?: string;
  author?: string;
  publishDate?: string;
  modifiedDate?: string;
  /**
   * When ogType is 'article', which concrete Schema.org type to emit.
   * BlogPosting for editorial/blog pieces, ScholarlyArticle for research papers,
   * Article for general articles. Ignored when ogType is not 'article'.
   */
  articleType?: 'Article' | 'BlogPosting' | 'ScholarlyArticle';
  breadcrumbs?: Breadcrumb[];
  /** Reading time in whole minutes; emitted as ISO 8601 `timeRequired`. */
  readingTimeMinutes?: number;
  /** Article body word count; emitted as `wordCount` on the article schema. */
  wordCount?: number;
  /** When true, emit noindex,nofollow (404 and other non-canonical shells). */
  noIndex?: boolean;
  jsonLd?: Record<string, unknown>;
}

const SITE_URL = 'https://www.adityaai.dev';
const SOCIAL_LINKS = [
  'https://x.com/adityaaidev',
  'https://www.linkedin.com/in/adityaai/',
  'https://github.com/adi-IL',
];

export default function SEO({
  title = 'Aditya Gaurav | AI Researcher & Systems Architect',
  description = 'Building the layer between research and production. Infrequent, high-signal Research on AI architecture and systems design.',
  canonicalUrl = SITE_URL,
  ogType = 'website',
  ogImage = 'https://res.cloudinary.com/df95kzdir/image/upload/v1768829921/Frame_11_2_i0mo2o.png',
  twitterHandle = '@adityaaidev',
  author = 'Aditya Gaurav',
  publishDate,
  modifiedDate,
  articleType = 'Article',
  breadcrumbs,
  readingTimeMinutes,
  wordCount,
  noIndex = false,
  jsonLd,
}: SEOProps) {
  const authorObject = {
    '@type': 'Person',
    name: author,
    url: SITE_URL,
    sameAs: SOCIAL_LINKS,
  };

  const schemaType = ogType === 'article' ? articleType : 'WebSite';

  const baseJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: title,
    headline: title,
    description,
    url: canonicalUrl,
    author: authorObject,
    publisher: {
      '@type': 'Person',
      name: 'Aditya Gaurav',
      url: SITE_URL,
    },
    ...(publishDate && { datePublished: publishDate }),
    ...(modifiedDate && { dateModified: modifiedDate }),
    ...(ogImage && { image: ogImage }),
    ...(ogType === 'article' && typeof wordCount === 'number' && { wordCount }),
    ...(ogType === 'article' && typeof readingTimeMinutes === 'number' && {
      timeRequired: `PT${readingTimeMinutes}M`,
    }),
    ...(ogType === 'article' && canonicalUrl && {
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
    }),
  };

  const finalJsonLd = jsonLd || baseJsonLd;

  const breadcrumbJsonLd = breadcrumbs && breadcrumbs.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: b.name,
          item: b.url,
        })),
      }
    : null;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="adityaai.dev" />
      {ogType === 'article' && publishDate && (
        <meta property="article:published_time" content={publishDate} />
      )}
      {ogType === 'article' && modifiedDate && (
        <meta property="article:modified_time" content={modifiedDate} />
      )}
      {ogType === 'article' && author && (
        <meta property="article:author" content={author} />
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:creator" content={twitterHandle} />
      <meta name="twitter:site" content={twitterHandle} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalJsonLd)}
      </script>
      {breadcrumbJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbJsonLd)}
        </script>
      )}
    </Helmet>
  );
}
