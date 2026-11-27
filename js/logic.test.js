import { describe, expect, it } from "bun:test";
import { CodeNote, CodeNoteSet } from "./achievements";
import { LogicExplainer } from "./explainer";
import { ConditionFormatter, Logic, MemSize } from "./logic";

const array =
  "[4x16 bytes] Items\n|0x00: [8-bit] State\n0 = Idle\n1 = Ready\n|0x04: [8-bit] Flags\nBit0 = Active\n|0x08: [Float] Ratio\n0.5 = Half";
function notesForArrays() {
  const notes = new CodeNoteSet();
  notes.add(new CodeNote(0x1000, array));
  notes.add(
    new CodeNote(0x2000, `[32-bit pointer] Root\n+0x20: ${array.replaceAll("\n|", "\n+|")}`),
  );
  notes.add(
    new CodeNote(
      0x3000,
      "[4x8 bytes] Inventory\n|0x00: [32-bit pointer] Item\n|+0x08: [8-bit] State\n0 = Idle\n1 = Ready",
    ),
  );
  return notes;
}
const alias = (logic, notes) => {
  const group = Logic.fromString(logic).groups[0];
  return ConditionFormatter.resolveAlias(
    group.at(-1).lhs.value,
    group,
    group.length - 1,
    notes,
    [],
  );
};
const explain = (logic, notes) =>
  LogicExplainer.explainAsset(null, Logic.fromString(logic).groups, notes, [], true).mainText;

describe("array note explanations", () => {
  for (const [label, address, prefix, chain] of [
    ["direct", 0x1030, "", []],
    ["indirect", 0x50, "I:0xX002000_", [{ type: "base", value: 0x2000 }]],
  ]) {
    it(`uses ${label} array fields for aliases, enums, bit labels and floats`, () => {
      const notes = notesForArrays();
      const code = `${prefix}0xH${address.toString(16)}=1`;
      expect(alias(code, notes)).toBe("State");
      expect(ConditionFormatter.resolveEnum(1, address, MemSize.BYTE, notes, chain)).toBe("Ready");
      expect(ConditionFormatter.resolveEnum(1, address + 4, MemSize.BIT0, notes, chain)).toBe(
        "Active",
      );
      expect(ConditionFormatter.resolveEnum(0, address + 4, MemSize.BIT0, notes, chain)).toBe(
        "false",
      );
      expect(ConditionFormatter.resolveEnum(0.5, address + 8, MemSize.FLOAT, notes, chain)).toBe(
        "Half",
      );
      expect(explain(code, notes)).toContain("Ready");
      expect(explain(`${prefix}0xM${(address + 4).toString(16)}=1`, notes)).toContain("[Active]");
    });
  }

  it("follows a pointer stored in the last root-array element", () => {
    const notes = notesForArrays();
    const chain = [{ type: "base", value: 0x3018 }];
    expect(alias("I:0xX003018_0xH000008=1", notes)).toBe("State");
    expect(ConditionFormatter.resolveEnum(1, 8, MemSize.BYTE, notes, chain)).toBe("Ready");
  });

  it("does not borrow labels from padding or out-of-bounds elements", () => {
    const notes = notesForArrays();
    for (const [address, prefix, chain] of [
      [0x1032, "", []],
      [0x1040, "", []],
      [0x60, "I:0xX002000_", [{ type: "base", value: 0x2000 }]],
    ]) {
      expect(alias(`${prefix}0xH${address.toString(16)}=1`, notes)).toBe("");
      expect(ConditionFormatter.resolveEnum(1, address, MemSize.BYTE, notes, chain)).toBeNull();
    }
  });

  it("preserves relative element positions through a note redirect", () => {
    const notes = notesForArrays();
    notes.add(new CodeNote(0x4000, "[64 bytes] Reference\nrefer to $0x1000"));
    expect(alias("0xH004030=1", notes)).toBe("State");
    expect(ConditionFormatter.resolveEnum(1, 0x4030, MemSize.BYTE, notes)).toBe("Ready");
  });

  it("recognizes an ASCII field in a later array record", () => {
    const notes = new CodeNoteSet();
    notes.add(new CodeNote(0x1000, "[2x8 bytes] Profiles\n|0x00: [ASCII, 4 bytes] Serial"));
    const text = explain("0xX001008=1414743380", notes);
    expect(text).toContain("Serial");
    expect(text).toContain("TEST");
  });

  for (const [header, size] of [
    ["double", MemSize.DBL32],
    ["MBF40", MemSize.MBF32],
  ]) {
    for (const indirect of [false, true]) {
      it(`preserves ${header} value labels for ${indirect ? "pointer fields" : "direct notes"}`, () => {
        const notes = new CodeNoteSet();
        const field = `[${header}] Value\n1 = Enabled\n1.5 = Half`;
        notes.add(
          new CodeNote(0x1000, indirect ? `[32-bit pointer] Root\n+0x08: ${field}` : field),
        );
        const address = indirect ? 8 : 0x1000;
        const chain = indirect ? [{ type: "base", value: 0x1000 }] : [];
        expect(ConditionFormatter.resolveEnum(1, address, size, notes, chain)).toBe("Enabled");
        expect(ConditionFormatter.resolveEnum(1.5, address, size, notes, chain)).toBe("Half");
      });
    }
  }

  it("preserves ordinary scalar and pointer aliases and enums", () => {
    const notes = new CodeNoteSet();
    notes.add(new CodeNote(0x5000, "[8-bit] Mode\n0 = Off\n1 = On"));
    notes.add(new CodeNote(0x6000, "[32-bit pointer] Actor\n+0x08: [8-bit] Mode\n0 = Off\n1 = On"));
    expect(alias("0xH005000=1", notes)).toBe("Mode");
    expect(alias("I:0xX006000_0xH000008=1", notes)).toBe("Mode");
    expect(ConditionFormatter.resolveEnum(1, 0x5000, MemSize.BYTE, notes)).toBe("On");
    const cache = [{ start: 0x7000, end: 0x7001, node: notes[0].noteNodes[0] }];
    expect(ConditionFormatter.resolveAlias(0x7000, null, 0, notes, cache)).toBe("Mode");
  });
});
