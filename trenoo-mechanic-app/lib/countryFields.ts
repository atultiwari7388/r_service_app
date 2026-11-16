export const SUPPORTED_COUNTRIES = [
  "USA",
  "Canada",
  "Mexico",
  "UK",
  "Australia",
] as const;

export type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number];

export type CountryRegistrationFieldKey =
  | "dot"
  | "mc"
  | "nsc"
  | "cvor"
  | "nir"
  | "cbsa"
  | "rfc"
  | "ftp"
  | "voln"
  | "abn"
  | "hva";

export interface CountryFieldConfig {
  key: CountryRegistrationFieldKey;
  label: string;
  badgeLabel: string;
  placeholder: string;
  optional?: boolean;
}

export const COUNTRY_REGISTRATION_FIELDS: Record<
  SupportedCountry,
  CountryFieldConfig[]
> = {
  USA: [
    {
      key: "dot",
      label: "DOT Number",
      badgeLabel: "DOT",
      placeholder: "e.g. 1234567",
      optional: true,
    },
    {
      key: "mc",
      label: "MC Number",
      badgeLabel: "MC",
      placeholder: "e.g. 987654",
      optional: true,
    },
  ],
  Canada: [
    {
      key: "nsc",
      label: "NSC",
      badgeLabel: "NSC",
      placeholder: "e.g. 123456789",
      optional: true,
    },
    {
      key: "cvor",
      label: "CVOR",
      badgeLabel: "CVOR",
      placeholder: "e.g. 123-456-789",
      optional: true,
    },
    {
      key: "nir",
      label: "NIR",
      badgeLabel: "NIR",
      placeholder: "e.g. R-123456-7",
      optional: true,
    },
    {
      key: "cbsa",
      label: "CBSA",
      badgeLabel: "CBSA",
      placeholder: "e.g. 12345",
      optional: true,
    },
  ],
  Mexico: [
    {
      key: "rfc",
      label: "RFC",
      badgeLabel: "RFC",
      placeholder: "e.g. ABCD123456XYZ",
      optional: true,
    },
    {
      key: "ftp",
      label: "FTP",
      badgeLabel: "FTP",
      placeholder: "e.g. 123456",
      optional: true,
    },
  ],
  UK: [
    {
      key: "voln",
      label: "VOLN",
      badgeLabel: "VOLN",
      placeholder: "e.g. OD1234567",
      optional: true,
    },
  ],
  Australia: [
    {
      key: "abn",
      label: "ABN",
      badgeLabel: "ABN",
      placeholder: "e.g. 12 345 678 901",
      optional: true,
    },
    {
      key: "hva",
      label: "HVA",
      badgeLabel: "HVA",
      placeholder: "e.g. 123456",
      optional: true,
    },
  ],
};

export const ALL_COUNTRY_REGISTRATION_KEYS: CountryRegistrationFieldKey[] = [
  "dot",
  "mc",
  "nsc",
  "cvor",
  "nir",
  "cbsa",
  "rfc",
  "ftp",
  "voln",
  "abn",
  "hva",
];

export function normalizeCountry(
  rawCountry?: string | null
): SupportedCountry {
  if (!rawCountry) return "USA";
  const lower = rawCountry.trim().toLowerCase();
  if (lower === "usa" || lower === "us" || lower === "united states")
    return "USA";
  if (lower === "canada" || lower === "ca") return "Canada";
  if (lower === "mexico" || lower === "mx") return "Mexico";
  if (
    lower === "uk" ||
    lower === "england" ||
    lower === "united kingdom" ||
    lower === "great britain" ||
    lower === "gb"
  )
    return "UK";
  if (lower === "australia" || lower === "au") return "Australia";
  if ((SUPPORTED_COUNTRIES as readonly string[]).includes(rawCountry)) {
    return rawCountry as SupportedCountry;
  }
  return "USA";
}
