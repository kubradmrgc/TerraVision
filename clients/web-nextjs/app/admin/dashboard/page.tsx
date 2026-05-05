export default function DashboardPage() {
  return (
    <section style={{ height: 'calc(100vh - 120px)' }}>
      <iframe
        src="/dashboard-stitch.html"
        title="TerraVision Dashboard"
        style={{
          width: '100%',
          height: '100%',
          border: '1px solid #e4e4e7',
          borderRadius: 12,
          background: '#fff'
        }}
      />
    </section>
  );
}
