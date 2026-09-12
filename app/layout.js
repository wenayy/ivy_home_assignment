import "./globals.css";

export const metadata = {
  title: { default: "Ivy Lens", template: "%s · Ivy Lens" },
  description: "A cleaner view of Bangalore property inventory.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

