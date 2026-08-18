export const metadata = {
  title: 'Astute Headstart',
  description: 'Astute Headstart Applications Engine',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
