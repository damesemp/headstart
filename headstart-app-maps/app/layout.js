export const metadata = {
  title: "Headstart Application Maps",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f0f0f0" }}>{children}</body>
    </html>
  );
}
