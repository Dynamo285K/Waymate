import { z } from "zod";

// Field-level validation shared by the API request schemas (in this package)
// and the web form schemas, so a rule is defined exactly once and the two
// layers cannot drift.
//
// This file imports zod (for the field-schema factories below) but nothing
// else — no schema graph, no z.globalRegistry side effects from index.ts — so
// the lightweight "@repo/shared/validation" subpath export stays cheap for the
// web, which already bundles zod for its form schemas anyway.

// Raw constants — used where a bare value is needed outside a zod schema:
// imperative length checks and i18n message interpolation.

/** License plate body after normalization (uppercased, alphanumeric only). */
export const PLATE_REGEX = /^[A-Z0-9]+$/;
export const PLATE_MIN_LENGTH = 2;
export const PLATE_MAX_LENGTH = 12;

/** First / last name: a single capitalized word. */
export const NAME_MAX_LENGTH = 20;
export const NAME_START_CAPITAL_REGEX = /^\p{Lu}/u;
export const NO_WHITESPACE_REGEX = /^\S+$/;

/** Free-text bio / "about me" field. */
export const BIO_MAX_LENGTH = 500;

/** Total seats in a car, including the driver. */
export const CAR_SEATS_MIN = 2;
export const CAR_SEATS_MAX = 9;

// Field-schema factories — return the validation *core* of a field. The caller
// supplies the error
// message — the API passes a developer string, the web passes an i18n key —
// so the rule chain itself is written exactly once and shared.

/**
 * E.164 phone number, e.g. +421901234567. Uses Zod's built-in `z.e164()`
 * format. Does not trim or normalize, so a caller taking raw user input should
 * `.trim()` / normalize and `.pipe()` the result into this.
 */
export const phoneField = (message?: string) => z.e164(message);
