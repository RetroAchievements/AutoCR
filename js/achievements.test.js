import { describe, expect, it } from "bun:test";
import { CodeNote, CodeNoteSet } from "./achievements";
import { NoteKind } from "./note-kind";

// Parity cases from RAIntegration 1.5.0 ArrayMemoryNoteModel_Tests and PR #37's review.
const inventory = "[4x16 bytes] Inventory\n|0x00: [32-bit] Item Type\n|0x04: [16-bit] Quantity";
const field = (note, offsets) => note.resolve(offsets)?.node.description;

describe("array code notes", () => {
  for (const [tag, size, stride] of [
    ["4x16 bytes", 64, 16],
    ["4x32 bytes", 128, 32],
    ["10x8 bits", 10, 1],
    ["16-byte struct", 16, 16],
    ["16 bytes", 16, 16],
  ]) {
    it(`parses ${tag} without expanding elements`, () => {
      const note = new CodeNote(0x1000, `[${tag}] Items\n|0x04: [16-bit] Quantity`);
      expect(note.size).toBe(size);
      expect(note.noteNodes[0].stride).toBe(stride);
      expect(note.noteNodes).toHaveLength(2);
      expect(note.contains(0x1000 + size - 1)).toBe(true);
      expect(note.contains(0x1000 + size)).toBe(false);
    });
  }

  for (const [header, size, kind, stride] of [
    ["[double] Value", 8, NoteKind.VALUE, 0],
    ["[MBF40] Value", 5, NoteKind.VALUE, 0],
    ["[8 bytes] Record", 8, NoteKind.ARRAY, 8],
    ["[5 bytes] Record", 5, NoteKind.ARRAY, 5],
    ["[1x8 bytes] Records", 8, NoteKind.ARRAY, 8],
    ["[double, 1x8 bytes] Records", 8, NoteKind.ARRAY, 8],
    ["[8-byte struct] Record", 8, NoteKind.ARRAY, 8],
    ["[ASCII, 8 bytes] Text", 8, NoteKind.VALUE, 0],
    ["[4x8 bytes] Pointer records", 32, NoteKind.POINTER, 8],
  ]) {
    it(`classifies ${header} without relying solely on byte size`, () => {
      const note = new CodeNote(0x1000, header);
      expect(note.size).toBe(size);
      expect(note.noteNodes[0].kind).toBe(kind);
      expect(note.noteNodes[0].stride).toBe(stride);
    });
  }

  it("treats small structs and single-element arrays as arrays, not scalar enums", () => {
    for (const tag of ["4-byte struct", "1x4 bytes"]) {
      const note = new CodeNote(0, `[${tag}] Record\n|0x00: [8-bit] State\n0 = No\n1 = Yes`);
      expect(note.type).toBeNull();
      expect(note.isArray()).toBe(true);
      expect(note.enum).toBeNull();
      expect(field(note, [0])).toBe("[8-bit] State");
    }
  });

  it("resolves the same fields in every element, including the last", () => {
    const note = new CodeNote(0x1000, inventory);
    for (let index = 0; index < 4; index++) {
      expect(field(note, [index * 16])).toBe("[32-bit] Item Type");
      expect(field(note, [index * 16 + 4])).toBe("[16-bit] Quantity");
    }
    expect(note.resolve([-1])).toBeNull();
    expect(note.resolve([64])).toBeNull();
    expect(note.resolve([8])).toBeNull();
  });

  it("keeps large arrays bounded to a single record layout", () => {
    const note = new CodeNote(0, "[1000000x16 bytes] Items\n|0x04: [16-bit] Quantity");
    expect(note.noteNodes).toHaveLength(2);
    expect(field(note, [999_999 * 16 + 4])).toBe("[16-bit] Quantity");
  });

  it("supports nested inline arrays using ||", () => {
    const note = new CodeNote(
      0,
      "[2x16 bytes] Rows\n|0x00: [2x8 bytes] Columns\n||0x04: [32-bit] Value",
    );
    expect(field(note, [28])).toBe("[32-bit] Value");
    expect(note.resolve([32])).toBeNull();
  });

  it("supports arrays inside pointers using +| and decimal field offsets", () => {
    const note = new CodeNote(
      0,
      "[32-bit pointer] Root\n+0x08: [4x16 bytes] Items\n+|4: [16-bit] Quantity",
    );
    expect(field(note, [60])).toBe("[16-bit] Quantity");
    expect(note.resolve([72])).toBeNull();
  });

  it("crosses a pointer field only when the logic dereferences it", () => {
    const note = new CodeNote(
      0,
      "[4x8 bytes] Inventory\n|0x00: [32-bit pointer] Item\n|+0x08: [32-bit] Item Type\n|0x04: [16-bit] Quantity",
    );
    expect(field(note, [16, 8])).toBe("[32-bit] Item Type");
    expect(field(note, [20])).toBe("[16-bit] Quantity");
    expect(note.resolve([20, 8])).toBeNull();
  });

  it("resolves pointer chains starting within a root array", () => {
    const notes = new CodeNoteSet();
    notes.add(
      new CodeNote(
        0x1000,
        "[4x8 bytes] Inventory\n|0x00: [32-bit pointer] Item\n|+0x08: [8-bit] State\n|0x04: [16-bit] Quantity",
      ),
    );
    for (const base of [0x1000, 0x1018]) {
      expect(notes.get_text(8, [{ type: "base", value: base }])).toContain("State");
    }
    expect(notes.get_text(8, [{ type: "base", value: 0x1001 }])).toBeNull();
    expect(notes.get_text(8, [{ type: "base", value: 0x1004 }])).toBeNull();
    expect(notes.get_text(8, [{ type: "base", value: 0x1020 }])).toBeNull();
  });

  it("preserves ptr headers and signed pointer fields", () => {
    const note = new CodeNote(
      0x1000,
      "[32-bit] Player ptr\n-0x04: [8-bit] Before\n+0x04: [8-bit] After",
    );
    expect(note.isProbablePointer()).toBe(true);
    expect(new CodeNote(0x1000, "[32-bit] PlayerPtr").isProbablePointer()).toBe(true);
    expect(note.resolve([-4])?.node.description).toContain("Before");
    expect(note.resolve([4])?.node.description).toContain("After");
  });

  it("rejects shifted pointer dereferences inside nested arrays", () => {
    const note = new CodeNote(
      0x1000,
      "[32-bit pointer] Root\n+0x20: [4x16 bytes] Records\n+|0x00: [32-bit pointer] Object\n+|+0x08: [8-bit] State",
    );
    for (const offset of [0x20, 0x50]) {
      expect(note.resolve([offset, 8])?.node.description).toContain("State");
      expect(note.resolve([offset + 1, 8])).toBeNull();
    }
  });

  it("does not interpret an index legend as an enum of array values", () => {
    const note = new CodeNote(
      0,
      "[4x16 bytes] Items\n0 = First\n1 = Second\n|0x00: [8-bit] State\n0 = Incomplete\n1 = Complete",
    );
    expect(note.enum).toBeNull();
    expect(note.resolve([16]).node.content).toContain("1 = Complete");
  });

  for (const prefix of ["│", "├", "└", "| "]) {
    it(`does not treat ${JSON.stringify(prefix)} as an array field marker`, () => {
      const note = new CodeNote(0, `[4x16 bytes] Items\n${prefix}0x04: [16-bit] Quantity`);
      expect(note.noteNodes[0].children).toHaveLength(0);
    });
  }

  it("does not attach pipe fields to scalar enums or ASCII text", () => {
    for (const header of [
      "[8-bit] State",
      "[ASCII, 16 bytes] Name",
      "[double] Value",
      "[MBF40] Value",
    ]) {
      const note = new CodeNote(0, `${header}\n|0x00 = First\n|0x01 = Second`);
      expect(note.noteNodes[0].children).toHaveLength(0);
    }
  });

  it("rejects malformed offsets and fields below scalar values", () => {
    const note = new CodeNote(
      0,
      "[4x16 bytes] Items\n|0x04oops: Bad\n|0X08: Bad\n|0x00: [8-bit] State\n||0x00: Not a child",
    );
    expect(note.noteNodes[0].children).toHaveLength(1);
    expect(note.resolve([0]).node.children).toHaveLength(0);
    const text = new CodeNote(0, "[ASCII, 16 bytes] Name\n+0x00: Not a field");
    expect(text.noteNodes[0].children).toHaveLength(0);
    expect(new CodeNote(0, "").resolve([0])).toBeNull();
  });

  for (const eol of ["\n", "\r\n", "\r"]) {
    it(`accepts ${JSON.stringify(eol)} line endings`, () => {
      const note = new CodeNote(
        0,
        ["[4x8 bytes] Items", "|0x00: [32-bit pointer] Item", "|+0x08: [8-bit] State"].join(eol),
      );
      expect(field(note, [24, 8])).toBe("[8-bit] State");
    });
  }

  it("keeps explicit record arrays structured even when the header mentions ASCII", () => {
    const note = new CodeNote(0, "[ASCII, 4x16 bytes] Records\n|0x00: [8-bit] Character");
    expect(field(note, [48])).toBe("[8-bit] Character");
  });

  it("preserves legacy inferred pointers and plus-prefixed byte-block fields", () => {
    const pointer = new CodeNote(0, "Root\n+0x04: [16-bit] Value");
    const block = new CodeNote(0, "[63-byte] Text Log (R+B)\n+0: In Use\n+1: Separator");
    expect(field(pointer, [4])).toBe("[16-bit] Value");
    expect(pointer.isProbablePointer()).toBe(true);
    expect(field(block, [1])).toBe("Separator");
    expect(block.isProbablePointer()).toBe(false);
  });

  it("uses repeated fields for both direct and indirect missing-note lookups", () => {
    const notes = new CodeNoteSet();
    notes.add(new CodeNote(0x1000, inventory));
    notes.add(
      new CodeNote(
        0x2000,
        "[32-bit pointer] Stats\n+0xcc: [32-bit pointer] Missions\n++0x00: [18x32 bytes] Records\n++|0x08: [32-bit] Solo Par",
      ),
    );
    expect(notes.get_text(0x1034)).toContain("Quantity");
    expect(notes.get_text(0x1040)).toBeNull();
    const chain = [
      { type: "base", value: 0x2000 },
      { type: "offset", value: 0xcc },
    ];
    expect(notes.get_text(0x208, chain)).toContain("Solo Par");
    expect(notes.get_text(0x248, chain)).toBeNull();
  });
});
