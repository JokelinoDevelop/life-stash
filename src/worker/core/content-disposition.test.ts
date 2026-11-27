import { describe, expect, it } from "vitest";

import { inlineContentDisposition } from "./content-disposition";

describe(inlineContentDisposition, () => {
  it("percent-encodes characters encodeURIComponent leaves bare", () => {
    expect(
      inlineContentDisposition("Tischwerk (20th Oct -> 20th Nov).pdf")
    ).toBe(
      "inline; filename*=UTF-8''Tischwerk%20%2820th%20Oct%20-%3E%2020th%20Nov%29.pdf"
    );
    expect(inlineContentDisposition("it's*.pdf")).toBe(
      "inline; filename*=UTF-8''it%27s%2A.pdf"
    );
  });

  it("encodes non-ASCII names as UTF-8", () => {
    expect(inlineContentDisposition("Фактура.pdf")).toBe(
      "inline; filename*=UTF-8''%D0%A4%D0%B0%D0%BA%D1%82%D1%83%D1%80%D0%B0.pdf"
    );
  });
});
