export default function BrowserUpgradeBanner({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="browser-upgrade-banner" suppressHydrationWarning>
      <div>
        <strong>{title}</strong>
      </div>
      <div style={{ marginTop: '4px' }}>
        {description}
      </div>
    </div>
  );
}
