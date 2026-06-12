/**
 * no-cross-feed-render — CHARTER.md §2.2 enforcement layer 3.
 *
 * Fails the build when a single expression reads rating values belonging to
 * two or more different feeds (the shape every composite/average/blend takes),
 * or when an identifier is named like a composite score.
 *
 * Layer 1 is the type system (no shared rating field across FeedDatum
 * variants); layer 2 is the CI grep gate over data/; layer 4 is the charter.
 */

/** Rating-bearing property names, mapped to the feed whose vocabulary they belong to. */
const RATING_FIELD_FEED = new Map([
  ["stage", "defiscan"],
  ["risks", "defiscan"],
  ["consensus_grade", "defipunkd"],
  ["consensus_strength", "defipunkd"],
  ["total_score", "philidor"],
  ["risk_tier", "philidor"],
  ["overall_grade", "pharos"],
  ["dews_band", "pharos"],
  ["dews_score", "pharos"],
  ["collateral_risk_score", "defisphere"],
  ["liquidity_risk_score", "defisphere"],
  ["amount_usd", "defillama-hacks"],
  ["raw_value", "curated"],
]);

const COMPOSITE_NAME =
  /^(composite|aggregated?|blended|combined|weighted|unified|overall)[_]?(score|rating|risk|grade)/i;

const ARITHMETIC_OPS = new Set(["+", "-", "*", "/", "%", "**"]);
const COMBINING_CALLEES = new Set(["min", "max", "pow", "hypot", "reduce"]);

function collectRatingFeeds(node, feeds, depth = 0) {
  if (!node || typeof node !== "object" || depth > 24) return;
  if (Array.isArray(node)) {
    for (const child of node) collectRatingFeeds(child, feeds, depth + 1);
    return;
  }
  if (node.type === "MemberExpression" && !node.computed && node.property?.name) {
    const feed = RATING_FIELD_FEED.get(node.property.name);
    if (feed) feeds.add(feed);
  }
  for (const key of Object.keys(node)) {
    if (key === "parent" || key === "loc" || key === "range") continue;
    const value = node[key];
    if (value && typeof value === "object") collectRatingFeeds(value, feeds, depth + 1);
  }
}

const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow reading two or more feeds' rating values in one expression (no composite scoring — CHARTER.md §2)",
    },
    schema: [],
    messages: {
      crossFeed:
        "Expression reads rating values from multiple feeds ({{feeds}}). Cross-feed arithmetic/comparison is prohibited by CHARTER.md §2.2 — render each feed verbatim instead.",
      compositeName:
        '"{{name}}" is named like a composite score. OpenRisk produces no score of its own (CHARTER.md §2.2).',
    },
  },
  create(context) {
    function checkCombiningNode(node) {
      const feeds = new Set();
      collectRatingFeeds(node, feeds);
      if (feeds.size >= 2) {
        context.report({
          node,
          messageId: "crossFeed",
          data: { feeds: [...feeds].join(" + ") },
        });
      }
    }
    return {
      BinaryExpression(node) {
        if (ARITHMETIC_OPS.has(node.operator)) checkCombiningNode(node);
      },
      CallExpression(node) {
        const callee = node.callee;
        const name =
          callee?.type === "MemberExpression" && !callee.computed
            ? callee.property?.name
            : callee?.name;
        if (name && COMBINING_CALLEES.has(name)) checkCombiningNode(node);
      },
      VariableDeclarator(node) {
        if (node.id?.type === "Identifier" && COMPOSITE_NAME.test(node.id.name)) {
          context.report({
            node: node.id,
            messageId: "compositeName",
            data: { name: node.id.name },
          });
        }
      },
      FunctionDeclaration(node) {
        if (node.id && COMPOSITE_NAME.test(node.id.name)) {
          context.report({
            node: node.id,
            messageId: "compositeName",
            data: { name: node.id.name },
          });
        }
      },
    };
  },
};

const plugin = {
  meta: { name: "openrisk", version: "1.0.0" },
  rules: { "no-cross-feed-render": rule },
};

export default plugin;
