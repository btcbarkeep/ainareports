import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ainareports.com";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AinaReports - powered by Aina Protocol",
    template: "%s | AinaReports",
  },
  description: "AinaReports delivers reliable, comprehensive condo reports for Hawaii. Access AOAO documents, building histories, unit details, and property insights across Maui and the Hawaiian Islands. Powered by Aina Protocol.",
  keywords: [
    "Hawaii condo reports",
    "building reports",
    "unit reports",
    "AOAO documents",
    "condo information",
    "Hawaii real estate",
    "building maintenance records",
    "condo association documents",
    "Aina Protocol",
  ],
  authors: [{ name: "AinaReports" }],
  creator: "AinaReports",
  publisher: "AinaReports",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/aina-logo-dark.png", type: "image/png", sizes: "32x32" },
      { url: "/aina-logo-dark.png", type: "image/png", sizes: "16x16" },
      { url: "/aina-logo-dark.png", type: "image/png", sizes: "192x192" },
      { url: "/aina-logo-dark.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "AinaReports",
    title: "AinaReports - powered by Aina Protocol",
    description: "AinaReports delivers reliable, comprehensive condo reports for Hawaii. Access AOAO documents, building histories, unit details, and property insights across Maui and the Hawaiian Islands. Powered by Aina Protocol.",
    images: [
      {
        url: "/aina-logo-dark.png",
        width: 1200,
        height: 630,
        alt: "AinaReports Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AinaReports - powered by Aina Protocol",
    description: "AinaReports delivers reliable, comprehensive condo reports for Hawaii. Access AOAO documents, building histories, unit details, and property insights across Maui and the Hawaiian Islands. Powered by Aina Protocol.",
    images: ["/aina-logo-dark.png"],
    creator: "@ainareports",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" type="image/png" sizes="32x32" href="/aina-logo-dark.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/aina-logo-dark.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "AinaReports",
              description: "AinaReports delivers reliable, comprehensive condo reports for Hawaii. Access AOAO documents, building histories, unit details, and property insights across Maui and the Hawaiian Islands. Powered by Aina Protocol.",
              url: siteUrl,
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${siteUrl}/search?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
              publisher: {
                "@type": "Organization",
                name: "AinaReports",
                logo: {
                  "@type": "ImageObject",
                  url: `${siteUrl}/aina-logo-dark.png`,
                },
              },
            }),
          }}
        />
      </head>
      <body className="bg-white text-black antialiased">
        {children}
      </body>
    </html>
  );
}
