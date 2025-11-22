import "./globals.css";

export const metadata = {
  title: "AinaReports",
  description: "Reliable Condo Reports for Hawaii",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white text-black antialiased">
        {children}
      </body>
    </html>
  );
}
