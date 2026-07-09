export const metadata = {
  title: "Headstart Application Maps",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0e0e0e" }}>{children}</body>
    </html>
  );
}
