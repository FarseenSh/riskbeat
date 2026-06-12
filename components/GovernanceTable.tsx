import type { GovernanceInfo, SafeStatus } from "@/lib/types";
import { ProvenanceTag } from "@/components/ProvenanceTag";

const MODEL_LABELS: Record<GovernanceInfo["model"], string> = {
  "governor-timelock": "On-chain Governor + Timelock",
  "safe-multisig": "Safe multisig",
  "aragon-dao": "Aragon DAO",
  "token-dao": "Token DAO",
  immutable: "Immutable (no admin keys)",
  registry: "Upgrade registry",
  hybrid: "Hybrid (token + multisig)",
};

export function GovernanceTable({
  governance,
  liveSafes,
  safeFallbackNote,
}: {
  governance: GovernanceInfo;
  liveSafes: Record<string, SafeStatus>;
  safeFallbackNote: string | null;
}) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="lbl">governance &amp; control</span>
        {safeFallbackNote && (
          <span className="badge-stale">{safeFallbackNote}</span>
        )}
      </div>
      <table className="data-table">
        <tbody>
          <tr>
            <td className="muted" style={{ width: 180 }}>
              Type
            </td>
            <td>
              {MODEL_LABELS[governance.model]}{" "}
              <ProvenanceTag tag="curated" />
            </td>
          </tr>
          {governance.governance_contract && (
            <tr>
              <td className="muted">{governance.governance_contract.label}</td>
              <td>
                <a
                  href={`https://etherscan.io/address/${governance.governance_contract.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {governance.governance_contract.address}
                </a>{" "}
                <ProvenanceTag tag="onchain" />
              </td>
            </tr>
          )}
          {governance.safes.map((s) => {
            const live = liveSafes[s.address];
            const threshold = live?.threshold ?? s.threshold;
            const owners = live?.owners?.length ?? s.owners;
            return (
              <tr key={s.address}>
                <td className="muted">{s.label}</td>
                <td>
                  {threshold !== null && owners !== null && (
                    <b>
                      {threshold}/{owners}
                    </b>
                  )}{" "}
                  <a
                    href={`https://etherscan.io/address/${s.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.address.slice(0, 10)}…{s.address.slice(-6)}
                  </a>{" "}
                  <span className="faint">{s.role}</span>{" "}
                  <ProvenanceTag tag={live && !live.is_stale ? "onchain" : "curated"} />
                </td>
              </tr>
            );
          })}
          <tr>
            <td className="muted">Timelock</td>
            <td>
              {governance.timelock ?? <span className="faint">none recorded</span>}{" "}
              <ProvenanceTag tag="curated" />
            </td>
          </tr>
          <tr>
            <td className="muted">Note</td>
            <td className="muted" style={{ maxWidth: 720 }}>
              {governance.note}
            </td>
          </tr>
          {governance.forum_url && (
            <tr>
              <td className="muted">Forum</td>
              <td>
                <a href={governance.forum_url} target="_blank" rel="noopener noreferrer">
                  {governance.forum_url}
                </a>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
