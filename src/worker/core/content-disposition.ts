/**
 * `inline; filename*=UTF-8''…` with the name percent-encoded per RFC 5987. `encodeURIComponent`
 * alone leaves `( ) ' *` bare, which strict storage (B2) rejects as non-token characters.
 */
export const inlineContentDisposition = (fileName: string): string => {
  const encoded = encodeURIComponent(fileName).replaceAll(
    /[()'*]/gu,
    (char) => `%${(char.codePointAt(0) ?? 0).toString(16).toUpperCase()}`
  );

  return `inline; filename*=UTF-8''${encoded}`;
};
