import { Document, Font, Page, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

import interRegular from "./fonts/Inter-Regular.ttf?url";
import interSemiBold from "./fonts/Inter-SemiBold.ttf?url";
import type { InvoicePdfData, InvoicePdfLabels } from "./invoice-pdf-data";
import { invoicePdfFormat } from "./invoice-pdf-format";
import type { InvoicePdfFormat } from "./invoice-pdf-format";
import { styles } from "./invoice-pdf-styles";

Font.register({
  family: "Inter",
  fonts: [
    { fontWeight: 400, src: interRegular },
    { fontWeight: 600, src: interSemiBold },
  ],
});

// Keep words whole; invoices have short lines and hyphenated names read badly.
Font.registerHyphenationCallback((word) => [word]);

interface SectionProps {
  data: InvoicePdfData;
  labels: InvoicePdfLabels;
  format: InvoicePdfFormat;
}

const present = (part: string | null | undefined): part is string =>
  part !== null && part !== undefined && part.trim() !== "";

type Issuer = NonNullable<InvoicePdfData["issuer"]>;

/** A labelled value in the details grid. */
const Cell = ({
  children,
  label,
}: {
  children?: ReactNode;
  label?: string;
}) => (
  <View style={styles.cell}>
    {label !== undefined && <Text style={styles.label}>{label}</Text>}
    {children}
  </View>
);

/** Number, issue and due dates. */
const Details = ({ data, format, labels }: SectionProps) => (
  <View style={styles.grid}>
    <Cell label={labels.number}>
      <Text style={data.number === null ? styles.valueDraft : styles.value}>
        {data.number ?? labels.draft}
      </Text>
    </Cell>
    <Cell label={labels.issued}>
      <Text style={styles.value}>{format.date(data.issueDate)}</Text>
    </Cell>
    <Cell label={labels.due}>
      <Text style={styles.value}>{format.date(data.dueDate)}</Text>
    </Cell>
  </View>
);

/** Your name, address, IDs and contact details. */
const IssuerDetails = ({
  issuer,
  labels,
}: {
  issuer: Issuer;
  labels: InvoicePdfLabels;
}) => (
  <>
    <Text>{issuer.name}</Text>
    {present(issuer.address) && <Text>{issuer.address}</Text>}
    {present(issuer.taxId) && (
      <Text style={styles.partyMeta}>
        {labels.taxId} {issuer.taxId}
      </Text>
    )}
    {present(issuer.companyId) && (
      <Text style={styles.partyMeta}>
        {labels.companyId} {issuer.companyId}
      </Text>
    )}
    {present(issuer.email) && (
      <Text style={styles.partyMeta}>{issuer.email}</Text>
    )}
    {present(issuer.phone) && (
      <Text style={styles.partyMeta}>{issuer.phone}</Text>
    )}
  </>
);

/** Billed to, from, the purchase order, and the billed period when there is one. */
const Parties = ({ data, format, labels }: SectionProps) => {
  const { client, issuer } = data;

  return (
    <View style={styles.gridParties}>
      <Cell label={labels.billTo}>
        <Text>{client.name}</Text>
        {present(client.address) && <Text>{client.address}</Text>}
        {present(client.taxId) && (
          <Text style={styles.partyMeta}>
            {labels.taxId} {client.taxId}
          </Text>
        )}
        {present(client.email) && (
          <Text style={styles.partyMeta}>{client.email}</Text>
        )}
      </Cell>
      <Cell label={labels.from}>
        {issuer !== null && <IssuerDetails issuer={issuer} labels={labels} />}
      </Cell>
      <Cell label={labels.purchaseOrder}>
        {present(data.purchaseOrder) && <Text>{data.purchaseOrder}</Text>}
      </Cell>
      {data.periodStart !== null && (
        <Cell label={labels.period}>
          <Text>{format.period(data.periodStart, data.periodEnd)}</Text>
        </Cell>
      )}
    </View>
  );
};

/** The lines; the column header repeats on every page the table runs onto. */
const Lines = ({ data, format, labels }: SectionProps) => {
  const vat = data.issuer?.vatRegistered === true;

  return (
    <View>
      <View fixed style={styles.tableHead}>
        <Text style={[styles.colDescription, styles.headText]}>
          {labels.description}
        </Text>
        <Text style={[styles.colPrice, styles.headText]}>
          {labels.unitPrice}
        </Text>
        <Text style={[styles.colQty, styles.headText]}>{labels.quantity}</Text>
        {vat && (
          <Text style={[styles.colVat, styles.headText]}>{labels.vat}</Text>
        )}
        <Text style={[styles.colAmount, styles.headText]}>{labels.amount}</Text>
      </View>
      {data.lines.map((line) => (
        <View key={line.key} style={styles.row} wrap={false}>
          <Text style={styles.colDescription}>{line.description}</Text>
          <Text style={styles.colPrice}>
            {format.amount(line.unitPriceMinor)}
          </Text>
          <Text style={styles.colQty}>
            {format.quantity(line.quantityMilli, line.unit)}
          </Text>
          {vat && (
            <Text style={styles.colVat}>{format.rate(line.vatRateBp)}</Text>
          )}
          <Text style={styles.colAmount}>
            {format.amount(line.amountMinor)}
          </Text>
        </View>
      ))}
      <View style={styles.rule} />
    </View>
  );
};

const TotalRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.totalRow}>
    <Text style={styles.totalLabel}>{label}</Text>
    <Text style={styles.totalValue}>{value}</Text>
  </View>
);

/**
 * Subtotal, the tax rate and tax (one row per rate when lines mix rates; 0 % when you
 * aren't VAT registered), then the invoice total.
 */
const Totals = ({ data, format, labels }: SectionProps) => {
  const money = (minor: number) => format.money(minor, data.currency);

  const groups =
    data.issuer?.vatRegistered === true ? data.totals.vatByRate : [];

  const [single] = groups;

  return (
    <View wrap={false}>
      <View style={styles.totals}>
        <TotalRow
          label={labels.subtotal}
          value={money(data.totals.subtotalMinor)}
        />
        {groups.length > 1 ? (
          groups.map((group) => (
            <TotalRow
              key={group.rateBp}
              label={labels.vatAt(format.rate(group.rateBp))}
              value={money(group.vatMinor)}
            />
          ))
        ) : (
          <>
            <TotalRow
              label={labels.taxRate}
              value={format.rate(single?.rateBp ?? 0)}
            />
            <TotalRow label={labels.tax} value={money(single?.vatMinor ?? 0)} />
          </>
        )}
        <TotalRow
          label={labels.shipping}
          value={money(data.totals.shippingMinor)}
        />
      </View>
      <View style={styles.due}>
        <Text style={styles.dueLabel}>{labels.invoiceTotal}</Text>
        <Text style={styles.dueValue}>{money(data.totals.totalMinor)}</Text>
      </View>
    </View>
  );
};

/** "Label: value", the way bank details are usually written out. */
const Line = ({ label, value }: { label: string; value: string }) => (
  <Text>
    {label}: {value}
  </Text>
);

interface Row {
  label: string;
  value: string | null | undefined;
}

const presentRows = (rows: Row[]) =>
  rows.flatMap(({ label, value }) =>
    present(value) ? [{ label, value }] : []
  );

/** One line: "Street 1, 1000 Skopje". */
const oneLine = (address: string | undefined): string | undefined =>
  address
    ?.split("\n")
    .map((part) => part.trim())
    .filter(present)
    .join(", ");

/** Who is paid, then where: the bank details; then the note. */
const PaymentAndNote = ({ data, labels }: Omit<SectionProps, "format">) => {
  const { issuer } = data;

  const owner = presentRows([
    { label: labels.accountOwner, value: issuer?.name },
    { label: labels.ownerAddress, value: oneLine(issuer?.address) },
  ]);

  const bank = presentRows([
    { label: labels.iban, value: issuer?.iban },
    { label: labels.bank, value: issuer?.bankName },
    { label: labels.bankAddress, value: issuer?.bankAddress },
    { label: labels.country, value: issuer?.bankCountry },
    { label: labels.swift, value: issuer?.swift },
  ]);

  const hasBank = present(issuer?.iban) || present(issuer?.bankName);

  return (
    <>
      {hasBank && (
        <View style={styles.details} wrap={false}>
          <Text style={styles.sectionLabel}>{labels.payment}</Text>
          {owner.map((row) => (
            <Line key={row.label} label={row.label} value={row.value} />
          ))}
          <View style={styles.gap} />
          {bank.map((row) => (
            <Line key={row.label} label={row.label} value={row.value} />
          ))}
        </View>
      )}
      {present(data.note) && (
        <View style={styles.noteBlock} wrap={false}>
          <Text style={styles.sectionLabel}>{labels.note}</Text>
          <Text>{data.note}</Text>
        </View>
      )}
    </>
  );
};

/** Your footer note (e.g. "Not a VAT payer") on every page, when you set one. */
const Footer = ({ note }: { note: string | null | undefined }) =>
  present(note) ? (
    <View fixed style={styles.footer}>
      <Text style={styles.footerText}>{note}</Text>
    </View>
  ) : null;

/** The invoice as printed (A4). Used for the live preview and for the PDF that is sent. */
export const InvoicePdfDocument = ({
  data,
  labels,
}: {
  data: InvoicePdfData;
  labels: InvoicePdfLabels;
}) => {
  const format = invoicePdfFormat(data.language);

  return (
    <Document
      author={data.issuer?.name}
      language={data.language}
      title={`${labels.invoice} ${data.number ?? labels.draft}`}
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{labels.invoice}</Text>
        <Details data={data} format={format} labels={labels} />
        <Parties data={data} format={format} labels={labels} />
        <View style={styles.band}>
          <Lines data={data} format={format} labels={labels} />
          <Totals data={data} format={format} labels={labels} />
        </View>
        <PaymentAndNote data={data} labels={labels} />
        <Footer note={data.issuer?.footerNote} />
      </Page>
    </Document>
  );
};
