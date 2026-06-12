import type { ProvenanceTag as Tag } from "@/lib/types";

const TITLES: Record<Tag, string> = {
  onchain: "Read directly from chain / the Safe Transaction Service",
  feed: "Fetched from an automated external risk feed",
  curated: "Added or verified by a contributor via PR (sourced + dated)",
  "self-reported": "Provided by the protocol team, not independently verified",
};

export function ProvenanceTag({ tag }: { tag: Tag }) {
  return (
    <span className={`tag tag-${tag}`} title={TITLES[tag]}>
      [{tag}]
    </span>
  );
}
