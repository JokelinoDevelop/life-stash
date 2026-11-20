import { Document, Font, Page, Text, View } from "@react-pdf/renderer";

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

const joined = (parts: readonly (string | null)[]): string =>
  parts
    .flatMap((part) => (part === null || part === "" ? [] : [part]))
    .join(" · ");

const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.metaRow}>
    <Text style={styles.metaLabel}>{label}</Text>
    <Text>{value}</Text>
  </View>
);

const TotalRow = ({
  due = false,
  label,
  value,
}: {
  due?: boolean;
  label: string;
  value: string;
}) => (
  <View style={due ? [styles.totalRow, styles.totalsDue] : styles.totalRow}>
    <Text style={due ? styles.strong : styles.muted}>{label}</Text>
    <Text style={due ? styles.amountDue : styles.plain}>{value}</Text>
  </View>
);

/** Your name, address and IDs (top left); "INVOICE" and its number and dates (top right). */
const Header = ({ data, format, labels }: SectionProps) => {
  const { issuer } = data;

  return (
    <View style={styles.header}>
      <View style={styles.issuer}>
        {issuer !== null && (
          <>
            <Text style={styles.issuerName}>{issuer.name}</Text>
            {issuer.address !== "" && <Text>{issuer.address}</Text>}
            <Text style={styles.muted}>
              {joined([
                issuer.taxId === null
                  ? null
                  : `${labels.taxId} ${issuer.taxId}`,
                issuer.companyId === null
                  ? null
                  : `${labels.companyId} ${issuer.companyId}`,
              ])}
            </Text>
            <Text style={styles.muted}>
              {joined([issuer.email, issuer.phone])}
            </Text>
          </>
        )}
      </View>
      <View style={styles.right}>
        <Text style={styles.title}>{labels.invoice.toUpperCase()}</Text>
        <View style={styles.meta}>
          <MetaRow label={labels.number} value={data.number ?? labels.draft} />
          <MetaRow label={labels.issued} value={format.date(data.issueDate)} />
          <MetaRow label={labels.due} value={format.date(data.dueDate)} />
          {data.periodStart !== null && (
            <MetaRow
              label={labels.period}
              value={format.period(data.periodStart, data.periodEnd)}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const BillTo = ({ data, labels }: Omit<SectionProps, "format">) => (
  <View style={styles.billTo}>
    <Text style={styles.label}>{labels.billTo}</Text>
    <Text style={styles.strong}>{data.client.name}</Text>
    {data.client.address !== null && <Text>{data.client.address}</Text>}
    {data.client.taxId !== null && (
      <Text style={styles.muted}>
        {labels.taxId} {data.client.taxId}
      </Text>
    )}
  </View>
);

/** The lines; the column header repeats on every page the table runs onto. */
const Lines = ({ data, format, labels }: SectionProps) => {
  const vat = data.issuer?.vatRegistered === true;
  const money = (minor: number) => format.money(minor, data.currency);

  return (
    <View style={styles.table}>
      <View fixed style={styles.tableHead}>
        <Text style={styles.colDescription}>{labels.description}</Text>
        <Text style={styles.colQty}>{labels.quantity}</Text>
        <Text style={styles.colPrice}>{labels.unitPrice}</Text>
        {vat && <Text style={styles.colVat}>{labels.vat}</Text>}
        <Text style={styles.colAmount}>{labels.amount}</Text>
      </View>
      {data.lines.map((line) => (
        <View key={line.key} style={styles.row} wrap={false}>
          <Text style={styles.colDescription}>{line.description}</Text>
          <Text style={styles.colQty}>
            {format.quantity(line.quantityMilli, line.unit)}
          </Text>
          <Text style={styles.colPrice}>{money(line.unitPriceMinor)}</Text>
          {vat && (
            <Text style={styles.colVat}>{format.rate(line.vatRateBp)}</Text>
          )}
          <Text style={styles.colAmount}>{money(line.amountMinor)}</Text>
        </View>
      ))}
    </View>
  );
};

/** Subtotal and VAT per rate (VAT registered only), then the amount due in the accent. */
const Totals = ({ data, format, labels }: SectionProps) => {
  const vat = data.issuer?.vatRegistered === true;
  const money = (minor: number) => format.money(minor, data.currency);

  return (
    <View style={styles.totals} wrap={false}>
      {vat && (
        <TotalRow
          label={labels.subtotal}
          value={money(data.totals.subtotalMinor)}
        />
      )}
      {vat &&
        data.totals.vatByRate.map((group) => (
          <TotalRow
            key={group.rateBp}
            label={labels.vatAt(format.rate(group.rateBp))}
            value={money(group.vatMinor)}
          />
        ))}
      <TotalRow
        due
        label={labels.amountDue}
        value={money(data.totals.totalMinor)}
      />
    </View>
  );
};

/** How to pay: the reference (the number) and your bank details. */
const Payment = ({ data, labels }: Omit<SectionProps, "format">) => {
  const { issuer } = data;

  if (issuer === null) {
    return null;
  }

  const rows = [
    data.number === null ? null : labels.reference(data.number),
    issuer.bankName === null ? null : `${labels.bank} ${issuer.bankName}`,
    issuer.iban === null ? null : `${labels.iban} ${issuer.iban}`,
    issuer.swift === null ? null : `${labels.swift} ${issuer.swift}`,
  ].flatMap((row) => (row === null ? [] : [row]));

  return (
    <View style={styles.payment} wrap={false}>
      <Text style={styles.label}>{labels.payment}</Text>
      {rows.map((row) => (
        <Text key={row}>{row}</Text>
      ))}
    </View>
  );
};

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
        <Header data={data} format={format} labels={labels} />
        <BillTo data={data} labels={labels} />
        <Lines data={data} format={format} labels={labels} />
        <Totals data={data} format={format} labels={labels} />
        <Payment data={data} labels={labels} />
        {data.note !== null && (
          <View style={styles.note} wrap={false}>
            <Text>{data.note}</Text>
          </View>
        )}
        {data.issuer?.footerNote !== null &&
          data.issuer?.footerNote !== undefined && (
            <View fixed style={styles.footer}>
              <Text style={styles.footerText}>{data.issuer.footerNote}</Text>
            </View>
          )}
      </Page>
    </Document>
  );
};
