import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const SITE_URL = "https://albaenterprise.in";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

const SEO = ({
  title,
  description,
  path = "/",
  image,
  type = "website",
  jsonLd,
}: SEOProps) => {
  const url = `${SITE_URL}${path}`;
  const ogImage = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      {/* Basic SEO */}
      <title>{title}</title>

      <meta name="description" content={description} />

      <meta
        name="keywords"
        content="manpower consultancy, staffing agency, international recruitment agency, overseas jobs, Europe jobs, manpower services, Alba Enterprise"
      />

      <meta name="robots" content="index,follow" />

      <meta name="author" content="Alba Enterprise" />

      <link rel="canonical" href={url} />

      {/* Open Graph */}

      <meta property="og:title" content={title} />

      <meta property="og:description" content={description} />

      <meta property="og:type" content={type} />

      <meta property="og:url" content={url} />

      <meta property="og:image" content={ogImage} />

      <meta property="og:site_name" content="Alba Enterprise" />

      {/* Twitter */}

      <meta name="twitter:card" content="summary_large_image" />

      <meta name="twitter:title" content={title} />

      <meta name="twitter:description" content={description} />

      <meta name="twitter:image" content={ogImage} />

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;