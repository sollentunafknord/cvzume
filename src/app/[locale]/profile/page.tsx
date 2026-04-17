export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div style={{ margin: 0, padding: 0, width: "100vw", height: "100vh", overflow: "hidden" }}>
      <iframe src={`/profile.html?locale=${locale}`} style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
    </div>
  );
}
