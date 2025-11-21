import "./globals.css";

export const metadata = {
  title: "AinaReports",
  description: "Reliable Property Reports for Hawaii"
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
