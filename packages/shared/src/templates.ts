import type { MessageKey } from "./i18n/index.js";

export type TemplateFieldInput = "text" | "date";

export type CredentialTemplateField = {
  key: string;
  labelKey: MessageKey;
  required: boolean;
  input: TemplateFieldInput;
};

export type CredentialTemplate = {
  id: string;
  type: string;
  labelKey: MessageKey;
  fields: CredentialTemplateField[];
};

/** Built-in issue templates (ALF-060). Not persisted — extend here. */
export const CREDENTIAL_TEMPLATES: readonly CredentialTemplate[] = [
  {
    id: "alfred",
    type: "AlfredCredential",
    labelKey: "vault.tpl.alfred",
    fields: [
      {
        key: "subject",
        labelKey: "vault.tpl.field.subject",
        required: true,
        input: "text",
      },
      {
        key: "note",
        labelKey: "vault.tpl.field.note",
        required: false,
        input: "text",
      },
      {
        key: "documentHash",
        labelKey: "vault.tpl.field.documentHash",
        required: false,
        input: "text",
      },
    ],
  },
  {
    id: "employment",
    type: "EmploymentCredential",
    labelKey: "vault.tpl.employment",
    fields: [
      {
        key: "employer",
        labelKey: "vault.tpl.field.employer",
        required: true,
        input: "text",
      },
      {
        key: "role",
        labelKey: "vault.tpl.field.role",
        required: true,
        input: "text",
      },
      {
        key: "startDate",
        labelKey: "vault.tpl.field.startDate",
        required: false,
        input: "date",
      },
    ],
  },
  {
    id: "education",
    type: "EducationCredential",
    labelKey: "vault.tpl.education",
    fields: [
      {
        key: "institution",
        labelKey: "vault.tpl.field.institution",
        required: true,
        input: "text",
      },
      {
        key: "program",
        labelKey: "vault.tpl.field.program",
        required: true,
        input: "text",
      },
      {
        key: "graduatedAt",
        labelKey: "vault.tpl.field.graduatedAt",
        required: false,
        input: "date",
      },
    ],
  },
] as const;

export function getTemplateById(
  id: string | undefined | null,
): CredentialTemplate | undefined {
  if (!id) return undefined;
  return CREDENTIAL_TEMPLATES.find((t) => t.id === id);
}

export function getDefaultTemplate(): CredentialTemplate {
  return CREDENTIAL_TEMPLATES[0]!;
}

/**
 * Filter raw claims to template keys; enforce required non-empty strings.
 * Returns cleaned claims or an error code.
 */
export function applyTemplateClaims(
  template: CredentialTemplate,
  raw: Record<string, unknown> | undefined | null,
):
  | { ok: true; claims: Record<string, string> }
  | { ok: false; code: "MISSING_CLAIM" | "INVALID_CLAIM"; field?: string } {
  const source = raw && typeof raw === "object" ? raw : {};
  const claims: Record<string, string> = {};

  for (const field of template.fields) {
    const value = source[field.key];
    if (value == null || String(value).trim() === "") {
      if (field.required) {
        return { ok: false, code: "MISSING_CLAIM", field: field.key };
      }
      continue;
    }
    if (typeof value !== "string" && typeof value !== "number") {
      return { ok: false, code: "INVALID_CLAIM", field: field.key };
    }
    claims[field.key] = String(value).trim().slice(0, 512);
  }

  return { ok: true, claims };
}
