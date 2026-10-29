import { useLayoutEffect } from "react";
import { Helmet } from "react-helmet-async";

interface RouteMetadataProps {
  title: string;
  description: string;
  canonicalPath?: string;
  articleHeadline?: string;
}

// Static tags remain the fallback for routes that do not set their own head.
export function RouteMetadata({ title, description, canonicalPath, articleHeadline }: RouteMetadataProps) {
  const url = canonicalPath ? `https://buildwithmoxiemo.com${canonicalPath}` : undefined;

  useLayoutEffect(() => {
    const previousTitle = document.title;
    const selectors = [
      'meta[name="description"]', 'meta[property="og:title"]',
      'meta[property="og:description"]', 'meta[name="twitter:title"]',
      'meta[name="twitter:description"]',
      ...(url ? ['meta[property="og:url"]', 'meta[property="og:type"]', 'link[rel="canonical"]'] : []),
    ];
    const fallbackTags = Array.from(document.head.querySelectorAll(selectors.join(",")))
      .filter((node) => !node.hasAttribute("data-rh"));
    fallbackTags.forEach((node) => node.remove());
    return () => {
      document.title = previousTitle;
      fallbackTags.forEach((node) => document.head.appendChild(node));
    };
  }, [url]);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {url && <link rel="canonical" href={url} />}
      {url && <meta property="og:url" content={url} />}
      {url && <meta property="og:type" content="article" />}
      {url && articleHeadline && <script type="application/ld+json" data-article-jsonld={canonicalPath}>{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: articleHeadline,
        description,
        mainEntityOfPage: url,
        author: { "@type": "Organization", name: "MOXIEMO" },
        publisher: { "@type": "Organization", name: "MOXIEMO" },
      })}</script>}
    </Helmet>
  );
}