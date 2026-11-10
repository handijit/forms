import { version } from "react";
import { version as domVersion } from "react-dom";
import { describe, expect, test } from "vitest";

describe("the React matrix", () => {
  test("should run each DOM project against its own React", () => {
    const major = version.split(".")[0];
    expect(["18", "19"]).toContain(major);
    expect(domVersion.split(".")[0]).toBe(major);
    expect(major).toBe(process.env.EXPECTED_REACT);
  });
});
