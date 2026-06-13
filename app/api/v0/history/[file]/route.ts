/**
 * GET /api/v0/history/{protocol}.json — the per-protocol archive time
 * series: for every archived day, what every automated feed said, verbatim,
 * with the day's Merkle root. Grows by one entry per nightly run.
 */
import { siteData } from "@/lib/data-loader";
import { archiveBegins, protocolHistory } from "@/lib/history";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return siteData.protocols.map((p) => ({ file: `${p.slug}.json` }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const slug = file.replace(/\.json$/, "");
  const proto = siteData.protocols.find((p) => p.slug === slug);
  if (!proto)
    return Response.json({ error: "unknown protocol" }, { status: 404 });

  const days = protocolHistory(slug);
  const body = {
    version: "v0",
    unstable: true,
    protocol: slug,
    name: proto.name,
    generated_at: siteData.generated_at,
    license:
      "Code AGPL-3.0; compiled data outputs additionally CC0-1.0 to the extent of our rights; verbatim feed values remain attributable to their publishers (see README).",
    charter:
      "No composite scoring — feeds are never combined, including across time. https://github.com/FarseenSh/riskbeat/blob/main/CHARTER.md",
    archive_begins: archiveBegins(),
    archive_note:
      "The archive is append-only from its first day and grows by one entry per nightly run (03:17 UTC). Days before archive_begins are not reconstructable — that limitation is recorded, never backfilled.",
    day_count: days.length,
    days,
  };
  return Response.json(body);
}
