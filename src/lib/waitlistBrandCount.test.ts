import { expect, it } from "vitest";
import { validBrandCount } from "../../supabase/functions/join-waitlist/brand-count";

it.each(["1", "2", "3", "4 or more"])("persists approved home choice %s", count => expect(validBrandCount(count, "home_first100")).toBe(true));
it("requires home submissions to include the brand count", () => expect(validBrandCount(undefined, "home_first100")).toBe(false));
it("preserves other forms without brand count", () => expect(validBrandCount(undefined, undefined)).toBe(true));
it.each(["", "0", "4", 1, {}, []])("rejects invalid brand count %j", count => expect(validBrandCount(count, "home_first100")).toBe(false));