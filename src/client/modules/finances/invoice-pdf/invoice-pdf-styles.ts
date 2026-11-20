import { StyleSheet } from "@react-pdf/renderer";

/** Greyscale with one accent (the amount due), like the app. Sizes are points on A4. */
const INK = "#1f2329";
const MUTED = "#6b7079";
const HAIRLINE = "#e3e5e8";
const ACCENT = "#2b5bd3";

const PAGE_MARGIN = 48;
const SMALL_CAPS = { fontSize: 7.5, letterSpacing: 0.6 } as const;
const UPPERCASE = "uppercase";
const ROW = "row";
const SPREAD = "space-between";
const CELL = { paddingHorizontal: 4 } as const;
const NUMBER_CELL = { ...CELL, textAlign: "right" } as const;

export const styles = StyleSheet.create({
  amountDue: { color: ACCENT, fontSize: 12, fontWeight: 600 },
  billTo: { marginTop: 28 },
  colAmount: { ...NUMBER_CELL, width: 86 },
  colDescription: { ...CELL, flexGrow: 1, flexShrink: 1 },
  colPrice: { ...NUMBER_CELL, width: 80 },
  colQty: { ...NUMBER_CELL, width: 74 },
  colVat: { ...NUMBER_CELL, width: 42 },
  footer: {
    borderTopColor: HAIRLINE,
    borderTopWidth: 0.5,
    bottom: 28,
    left: PAGE_MARGIN,
    paddingTop: 6,
    position: "absolute",
    right: PAGE_MARGIN,
  },
  /** Text styles go on the footer's Text: an absolute View with them doesn't draw. */
  footerText: { color: MUTED, fontSize: 8 },
  header: { flexDirection: ROW, justifyContent: SPREAD },
  issuer: { maxWidth: 260 },
  issuerName: { fontSize: 14, fontWeight: 600, marginBottom: 4 },
  label: {
    ...SMALL_CAPS,
    color: MUTED,
    marginBottom: 4,
    textTransform: UPPERCASE,
  },
  meta: { marginTop: 10 },
  metaLabel: { color: MUTED, width: 52 },
  metaRow: { flexDirection: ROW, marginBottom: 2 },
  muted: { color: MUTED },
  note: { marginTop: 22 },
  page: {
    color: INK,
    fontFamily: "Inter",
    fontSize: 9,
    lineHeight: 1.4,
    paddingBottom: 64,
    paddingHorizontal: PAGE_MARGIN,
    paddingTop: PAGE_MARGIN,
  },
  payment: { marginTop: 26 },
  plain: {},
  right: { alignItems: "flex-end" },
  row: {
    borderBottomColor: HAIRLINE,
    borderBottomWidth: 0.5,
    flexDirection: ROW,
    paddingVertical: 6,
  },
  strong: { fontWeight: 600 },
  table: { marginTop: 28 },
  tableHead: {
    ...SMALL_CAPS,
    borderBottomColor: INK,
    borderBottomWidth: 0.75,
    color: MUTED,
    flexDirection: ROW,
    paddingBottom: 5,
    textTransform: UPPERCASE,
  },
  title: { fontSize: 20, fontWeight: 600, letterSpacing: 1.5 },
  totalRow: {
    flexDirection: ROW,
    justifyContent: SPREAD,
    paddingVertical: 3,
  },
  totals: { alignSelf: "flex-end", marginTop: 10, width: 230 },
  totalsDue: {
    borderTopColor: INK,
    borderTopWidth: 0.75,
    marginTop: 4,
    paddingTop: 6,
  },
});
