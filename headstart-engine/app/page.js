export default function Home() {
  return (
    <main
      style={{
        fontFamily: 'Arial, sans-serif',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        background: '#0f0f10',
        color: '#f4f3f0',
      }}
    >
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
        Astute Headstart
      </h1>
      <p style={{ color: '#a5a5a5', maxWidth: 420 }}>
        Foundation deploy. The live application, hotspot map and Directory
        are not built yet — this page confirms the hosting pipeline works.
      </p>
    </main>
  );
}
