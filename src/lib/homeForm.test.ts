import { expect, it } from "vitest";
import { isBrandCount } from "./homeForm";

it.each(["1", "2", "3", "4 or more"])("accepts brand count %s", value => expect(isBrandCount(value)).toBe(true));
it("requires a brand count", () => expect(isBrandCount("")).toBe(false));
it.each(["0", "4", "5", "many"])("rejects unspecified choice %s", value => expect(isBrandCount(value)).toBe(false));