import { expect, it } from "vitest";
import { validCtaVariant } from "../../supabase/functions/join-waitlist/cta-variant";

it.each(["seat", "early"])("allows submitted version %s", value => expect(validCtaVariant(value)).toBe(true));
it.each([null, undefined])("preserves legacy submissions %s", value => expect(validCtaVariant(value)).toBe(true));
it.each(["other", "", 1, {}, []])("rejects unsupported version %j", value => expect(validCtaVariant(value)).toBe(false));