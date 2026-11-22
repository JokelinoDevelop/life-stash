import { StyleSheet } from "@react-pdf/renderer";

/**
 * A calm, monochrome slate invoice: a large title, a three-column grid of details, one
 * full-width tinted band with the lines and totals, then the bank details as plain lines.
 * Sizes are points on A4 (595 × 842).
 */
const INK = "#1b2229";
const SLATE = "#5b6b78";
const MUTED = "#7b8794";
const RULE = "#5b6b78";
const HAIRLINE = "#d5dbe1";
const BAND = "#eef1f4";

const PAGE_MARGIN = 56;
const GRID_COLUMN = 120;

const CAPS = {
  color: SLATE,
  fontSize: 6.75,
  fontWeight: 600,
  letterSpacing: 0.4,
  textTransform: "uppercase",
} as const;

const ROW = "row";
const SPREAD = "space-between";
const NUMBER_CELL = { textAlign: "right" } as const;

export const styles = StyleSheet.create({
  title: {
    color: SLATE,
    fontSize: 24,
    fontWeight: 600,
    lineHeight: 1.15,
  },

  // The details grid: number and dates; then billed to, from and the period.
  grid: { flexDirection: ROW, marginTop: 34 },
  gridParties: { flexDirection: ROW, marginTop: 24 },
  cell: { paddingRight: 14, width: GRID_COLUMN },
  label: { ...CAPS, marginBottom: 7 },
  value: {},
  valueDraft: { color: MUTED },
  partyMeta: { color: MUTED },

  // One band from edge to edge: lines, totals and the invoice total.
  band: {
    backgroundColor: BAND,
    marginHorizontal: -PAGE_MARGIN,
    marginTop: 44,
    paddingBottom: 12,
    paddingHorizontal: PAGE_MARGIN,
    paddingTop: 24,
  },
  tableHead: { flexDirection: ROW, paddingBottom: 14 },
  headText: { color: SLATE, fontWeight: 600 },
  row: { flexDirection: ROW },
  colDescription: { flexGrow: 1, flexShrink: 1, paddingRight: 8 },
  colPrice: { ...NUMBER_CELL, width: 72 },
  colQty: { ...NUMBER_CELL, width: 80 },
  colVat: { ...NUMBER_CELL, width: 48 },
  colAmount: { ...NUMBER_CELL, width: 84 },
  rule: {
    borderBottomColor: RULE,
    borderBottomWidth: 0.75,
    marginTop: 14,
  },

  totals: { alignSelf: "flex-end", marginTop: 22, width: 156 },
  totalRow: {
    flexDirection: ROW,
    justifyContent: SPREAD,
    paddingVertical: 2.5,
  },
  totalLabel: { ...CAPS, fontSize: 7.5, letterSpacing: 0.2 },
  totalValue: { color: INK },
  due: { alignItems: "flex-end", marginTop: 52 },
  dueLabel: { ...CAPS, fontSize: 7.5, letterSpacing: 0.2, marginBottom: 4 },
  dueValue: { color: INK, fontSize: 11, fontWeight: 600 },

  // How to pay, and the note.
  details: { marginTop: 18 },
  sectionLabel: { ...CAPS, fontSize: 8, marginBottom: 6 },
  gap: { height: 10 },
  noteBlock: { marginTop: 18 },

  // Your footer note (e.g. "Not a VAT payer"), on every page.
  footer: {
    borderTopColor: HAIRLINE,
    borderTopWidth: 0.5,
    bottom: 26,
    left: PAGE_MARGIN,
    paddingTop: 7,
    position: "absolute",
    right: PAGE_MARGIN,
  },
  /** Text styles go on the footer's Text: an absolute View with them doesn't draw. */
  footerText: { color: MUTED, fontSize: 7.5 },

  page: {
    color: INK,
    fontFamily: "Inter",
    fontSize: 8.5,
    lineHeight: 1.4,
    paddingBottom: 60,
    paddingHorizontal: PAGE_MARGIN,
    paddingTop: 30,
  },
});
