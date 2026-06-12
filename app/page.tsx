export default function Home() {
  return (
    <div>
      <h1>COVERAGE MATRIX</h1>
      <p className="page-intro">
        What every major DeFi risk feed says about every major Ethereum
        protocol — side by side, verbatim, with no score of its own. The data
        layer is landing commit by commit; the matrix renders here once the
        first feed snapshot is archived.
      </p>
      <div className="panel" style={{ padding: 16 }}>
        <span className="lbl">status</span>
        <p style={{ marginTop: 6 }} className="muted">
          Scaffold online. Feed registry, protocol registry and the six
          automated fetchers arrive in the next commits — see the repository
          history for the build trail.
        </p>
      </div>
    </div>
  );
}
