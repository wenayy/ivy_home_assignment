import "./globals.css";

export const metadata = {
  title: { default: "Ivy Lens by Vinay Joshi", template: "%s · Ivy Lens" },
  description: "Vinay Joshi’s audited Bangalore property browser for the Ivy Homes engineering assignment.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
