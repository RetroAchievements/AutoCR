import { beforeEach, describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import { Achievement, AchievementSet, CodeNote, CodeNoteSet } from "./achievements";
import { Feedback, assess_achievement, assess_leaderboard } from "./feedback";
import { Logic } from "./logic";
import { current } from "./state";

const FIXTURE_ROOT = new URL("../test/fixtures/", import.meta.url);
const notesFixtureText = readFileSync(new URL("228-Notes.json", FIXTURE_ROOT), "utf8");
const userFixtureText = readFileSync(new URL("228-User.txt", FIXTURE_ROOT), "utf8");

const NAME_BY_FEEDBACK_TYPE = new Map(Object.entries(Feedback).map(([name, type]) => [type, name]));
const DELTA_FEEDBACK_TYPES = new Set(["MISSING_DELTA", "IMPROPER_DELTA"]);

function collectFeedbackNames(assessment) {
  return assessment.issues
    .flat()
    .map((issue) => NAME_BY_FEEDBACK_TYPE.get(issue.type))
    .sort();
}

function collectDeltaFeedbackNames(assessment) {
  return collectFeedbackNames(assessment).filter((name) => DELTA_FEEDBACK_TYPES.has(name));
}

function describeExpectation(names) {
  return names.length ? `flags ${names.join(", ")}` : "flags nothing";
}

// Same state teardown as reset_loaded() in overview.js.
function clearLoadedSet() {
  current.set = new AchievementSet();
  current.notes = new CodeNoteSet();
  current.rp = null;
}

// overview.js loads a code notes file first, then a local user file. We'll mirror that order here.
function loadFixtureSet() {
  for (const note of JSON.parse(notesFixtureText)) {
    if (note.Note) {
      current.notes.add(new CodeNote(note.Address, note.Note, note.User));
    }
  }
  current.set.addLocal(userFixtureText, current.notes);
  current.notes.sort((a, b) => a.addr - b.addr);
}

function findFixtureAchievement(id) {
  return current.set.getAchievements().find((achievement) => achievement.id === id);
}

function findFixtureLeaderboard(id) {
  return current.set.getLeaderboards().find((leaderboard) => leaderboard.id === id);
}

function makeAchievement({
  logic,
  name = "Find the Hidden Coin",
  summary = "Find the hidden coin in the first level",
}) {
  return Object.assign(new Achievement(), {
    desc: summary,
    logic: Logic.fromString(logic),
    title: name,
  });
}

beforeEach(() => {
  clearLoadedSet();
});

describe("Util: assess_achievement", () => {
  describe("given the 228 fixture set", () => {
    beforeEach(() => {
      loadFixtureSet();
    });

    // Every fixture title states the problem that its achievement should trip.
    // 111000009, 111000016, 111000027, and 111000040 are missing from the table:
    // AutoCR has no check for the problems those titles name yet.
    const fixtureCases = [
      { expected: ["MISSING_DELTA", "NO_EMOJI"], id: 111_000_002, title: "Emoji in Title" },
      { expected: ["MISSING_DELTA", "NO_EMOJI"], id: 111_000_003, title: "Emoji in Description" },
      { expected: ["FOREIGN_CHARS", "MISSING_DELTA"], id: 111_000_004, title: "タイトルの外国語" },
      {
        expected: ["FOREIGN_CHARS", "MISSING_DELTA"],
        id: 111_000_005,
        title: "Foreign Language in Description",
      },
      {
        expected: ["MISSING_DELTA", "SPECIAL_CHARS", "TITLE_CASE"],
        id: 111_000_006,
        title: "Uni©ode  in Ti±le",
      },
      {
        expected: ["MISSING_DELTA", "SPECIAL_CHARS"],
        id: 111_000_007,
        title: "Unicode in the Description",
      },
      {
        expected: ["MISSING_DELTA", "SPECIAL_CHARS", "SPECIAL_CHARS"],
        id: 111_000_008,
        title: "Smart Quotes in the Title and Description",
      },
      { expected: ["MISSING_NOTE", "MISSING_NOTE"], id: 111_000_010, title: "Missing Code Note" },
      { expected: ["BAD_CHAIN"], id: 111_000_011, title: "Bad Chain" },
      { expected: ["ONE_CONDITION"], id: 111_000_012, title: "One-Condition: Simple" },
      { expected: ["ONE_CONDITION"], id: 111_000_013, title: "One-Condition: Complex" },
      { expected: ["BAD_PRIOR"], id: 111_000_014, title: "Bad Prior #1" },
      { expected: ["BAD_PRIOR"], id: 111_000_015, title: "Bad Prior #2" },
      { expected: ["STALE_ADDADDRESS"], id: 111_000_017, title: "Stale AddAddress" },
      {
        expected: ["PAUSELOCK_NO_RESET", "TITLE_CASE"],
        id: 111_000_018,
        title: "PauseLock Without Reset",
      },
      { expected: [], id: 111_000_019, title: "[PASS] PauseLock Fixed #1 (RNI)" },
      { expected: [], id: 111_000_020, title: "[PASS] PauseLock Fixed #2 (ResetIf in Alt)" },
      { expected: ["HIT_NO_RESET", "TITLE_CASE"], id: 111_000_021, title: "Hits Without a Reset" },
      {
        expected: ["USELESS_ANDNEXT", "USELESS_ANDNEXT"],
        id: 111_000_022,
        title: "Useless AndNext",
      },
      { expected: ["UUO_RESET"], id: 111_000_023, title: "Useless Use of Reset" },
      { expected: [], id: 111_000_024, title: "[PASS] Valid Use of Reset #1 (Same Group)" },
      { expected: [], id: 111_000_025, title: "[PASS] Valid Use of Reset #2 (Reset in Core)" },
      { expected: [], id: 111_000_026, title: "[PASS] Valid Use of Reset #3 (Reset in Alt)" },
      { expected: ["UUO_RNI"], id: 111_000_028, title: "Useless Use of ResetNextIf #1" },
      {
        expected: ["HIT_NO_RESET", "UUO_RNI"],
        id: 111_000_029,
        title: "Useless Use of ResetNextIf #2",
      },
      {
        expected: ["USELESS_ANDNEXT", "UUO_RNI"],
        id: 111_000_030,
        title: "Useless Use of ResetNextIf #3",
      },
      { expected: [], id: 111_000_031, title: "[PASS] Valid Use of ResetNextIf #1 (Hitcounts)" },
      {
        expected: ["USELESS_ANDNEXT"],
        id: 111_000_032,
        title: "[PASS] Valid Use of ResetNextIf #2 (Pause Until)",
      },
      { expected: ["UUO_PAUSE"], id: 111_000_034, title: "Useless Use of Pause #1" },
      { expected: [], id: 111_000_035, title: "[PASS] Valid Use of Pause #1 (Hitcounts)" },
      {
        expected: ["PAUSING_MEASURED"],
        id: 111_000_036,
        title: "[PASS] Valid Use of Pause #2 (Pausing Measured)",
      },
      { expected: ["RESET_HITCOUNT_1"], id: 111_000_037, title: "ResetIf with Hitcount=1" },
      {
        expected: [
          "MISSING_DELTA",
          "TYPE_MISMATCH",
          "TYPE_MISMATCH",
          "TYPE_MISMATCH",
          "TYPE_MISMATCH",
        ],
        id: 111_000_038,
        title: "Type Mismatch",
      },
    ];

    for (const { expected, id, title } of fixtureCases) {
      it(`given fixture achievement ${id} (${title}), ${describeExpectation(expected)}`, () => {
        const target = findFixtureAchievement(id);

        const report = assess_achievement(target);

        expect(collectFeedbackNames(report)).toEqual(expected);
      });
    }

    for (const { id, title } of fixtureCases.filter((entry) => entry.title.startsWith("[PASS]"))) {
      it(`given fixture achievement ${id} (${title}), passes the assessment`, () => {
        const target = findFixtureAchievement(id);

        const report = assess_achievement(target);

        expect(report.pass()).toBe(true);
      });
    }
  });

  describe("given logic that uses Delta", () => {
    it("given logic with no Delta at all, flags MISSING_DELTA", () => {
      const target = makeAchievement({ logic: "0xH001234=1_0xH005678=2" });

      const report = assess_achievement(target);

      expect(collectDeltaFeedbackNames(report)).toEqual(["MISSING_DELTA"]);
    });

    it("given a Delta matched by a Mem on the same address, flags no Delta feedback", () => {
      const target = makeAchievement({ logic: "0xH001234=1_d0xH001234=0" });

      const report = assess_achievement(target);

      expect(collectDeltaFeedbackNames(report)).toEqual([]);
    });

    it("given a core-only group holding an unmatched Delta, flags IMPROPER_DELTA", () => {
      const target = makeAchievement({ logic: "d0xH001234=0_0xH005678=1" });

      const report = assess_achievement(target);

      expect(collectDeltaFeedbackNames(report)).toEqual(["IMPROPER_DELTA"]);
    });

    it("given a Delta that lives only inside a ResetIf, flags IMPROPER_DELTA", () => {
      const target = makeAchievement({ logic: "0xH001234=1_R:d0xH001234=0" });

      const report = assess_achievement(target);

      expect(collectDeltaFeedbackNames(report)).toEqual(["IMPROPER_DELTA"]);
    });

    it("given a Delta that lives only inside a PauseIf, flags IMPROPER_DELTA", () => {
      const target = makeAchievement({ logic: "0xH001234=1_P:d0xH001234=0" });

      const report = assess_achievement(target);

      expect(collectDeltaFeedbackNames(report)).toEqual(["IMPROPER_DELTA"]);
    });

    it("given a matched Delta present in every alt group, flags no Delta feedback", () => {
      const target = makeAchievement({
        logic: "0xH005678=1S0xH001234=1_d0xH001234=0S0xH001234=2_d0xH001234=1",
      });

      const report = assess_achievement(target);

      expect(collectDeltaFeedbackNames(report)).toEqual([]);
    });

    it("given a matched Delta present in only some alt groups, flags IMPROPER_DELTA", () => {
      const target = makeAchievement({
        logic: "0xH005678=1S0xH001234=1_d0xH001234=0S0xH001234=2",
      });

      const report = assess_achievement(target);

      expect(collectDeltaFeedbackNames(report)).toEqual(["IMPROPER_DELTA"]);
    });

    it("given a core Delta matched by a Mem in every alt group, flags no Delta feedback", () => {
      const target = makeAchievement({
        logic: "d0xH001234=0_0xH005678=1S0xH001234=1S0xH001234=2",
      });

      const report = assess_achievement(target);

      expect(collectDeltaFeedbackNames(report)).toEqual([]);
    });

    it("given a core Delta left unmatched by one alt group, flags IMPROPER_DELTA", () => {
      const target = makeAchievement({
        logic: "d0xH001234=0_0xH005678=1S0xH001234=1S0xH009999=2",
      });

      const report = assess_achievement(target);

      expect(collectDeltaFeedbackNames(report)).toEqual(["IMPROPER_DELTA"]);
    });

    it("given an alt group that can never be true, does not need its own Delta", () => {
      const target = makeAchievement({
        logic: "0xH005678=1S0xH001234=1_d0xH001234=0S0=1",
      });

      const report = assess_achievement(target);

      expect(collectDeltaFeedbackNames(report)).toEqual([]);
    });

    it("given a Delta and Mem reached through the same AddAddress pointer, flags no Delta feedback", () => {
      const target = makeAchievement({
        logic: "I:0xX001000_0xH000010=1_I:0xX001000_d0xH000010=0",
      });

      const report = assess_achievement(target);

      expect(collectDeltaFeedbackNames(report)).toEqual([]);
    });

    it("given an alt group whose Delta and Mem use different AddAddress pointers, flags IMPROPER_DELTA", () => {
      const target = makeAchievement({
        logic:
          "0xH005678=1SI:0xX001000_0xH000010=1_I:0xX002000_d0xH000010=0S0xH001234=2_d0xH001234=1",
      });

      const report = assess_achievement(target);

      expect(collectDeltaFeedbackNames(report)).toEqual(["IMPROPER_DELTA"]);
    });
  });
});

describe("Util: assess_leaderboard", () => {
  describe("given the 228 fixture set", () => {
    beforeEach(() => {
      loadFixtureSet();
    });

    // 111000039 is missing from the table -- AutoCR does not run the check its title names.
    it("given fixture leaderboard 111000001 (Press Buttons to Win), flags MISSING_DELTA, ONE_CONDITION", () => {
      const target = findFixtureLeaderboard(111_000_001);

      const report = assess_leaderboard(target);

      expect(collectFeedbackNames(report)).toEqual(["MISSING_DELTA", "ONE_CONDITION"]);
    });
  });
});

// Leaderboards 162754 (hidden) and 160302 (visible) from game 17896 (Mega Man Star Force 3: Red Joker).
const HIDDEN_LEADERBOARD_JSON = {
  ID: 162_754,
  Mem: "STA:A:34_A:d0xR0fcc9c_A:d0xS0fcc9c_A:d0xT0fcc9c_A:d0xN0fcc9d_A:d0xS0fcc9d_A:d0xT0fcc9d_A:d0xK0fcc9e_A:d0xK0fcc9f_A:d0xK0fcca0_A:d0xM0fcca1_A:d0xN0fcca1_A:d0xO0fcca1_B:0xR0fcc9c_B:0xS0fcc9c_B:0xT0fcc9c_B:0xN0fcc9d_B:0xS0fcc9d_B:0xT0fcc9d_B:0xK0fcc9e_B:0xK0fcc9f_B:0xK0fcca0_B:0xM0fcca1_B:0xN0fcca1_B:0xO0fcca1_B:0xP0fcca1_d0xP0fcca1<34_0xH0fca24=6::CAN:0=1::SUB:1=1::VAL:A:0xR0fcc9c_A:0xS0fcc9c_A:0xT0fcc9c_A:0xN0fcc9d_A:0xS0fcc9d_A:0xT0fcc9d_A:0xK0fcc9e_A:0xK0fcc9f_A:0xK0fcca0_A:0xM0fcca1_A:0xN0fcca1_A:0xO0fcca1_M:0xP0fcca1",
  Format: "VALUE",
  LowerIsBetter: false,
  Title: "DO NOT SAVE - Card Cipher Codes Entered",
  Description:
    "DO NOT SAVE - You are now ineligable to earn any more achievements. Please reset your game.",
  Hidden: true,
};
const VISIBLE_LEADERBOARD_JSON = {
  ID: 160_302,
  Mem: "STA:0xH0ffeb6=129_0xH0ffeb7=0_0xH0ea8b4=6Sd0xH0ea8b4=8Sd0xH0ea8b4=9::CAN:1=1S0xH0ea8b4=12_0xH1b473d=1S0xH0ea8b4=5::SUB:d0xH0ea8b4=6_0xH0ea8b4=10::VAL:A:0xX18f040*2_M:0",
  Format: "TIME",
  LowerIsBetter: true,
  Title: "SpadeMagnes Speed Deletion",
  Description: "Defeat SpadeMagnes as fast as possible",
  Hidden: false,
};

function makeSetJSON(leaderboards) {
  return {
    ID: 17_896,
    Title: "Mega Man Star Force 3: Red Joker",
    Sets: [{ Achievements: [], Leaderboards: leaderboards }],
  };
}

describe("Loader: AchievementSet.addJSON", () => {
  describe("given a set with a hidden leaderboard", () => {
    let set;
    beforeEach(() => {
      set = new AchievementSet().addJSON(
        makeSetJSON([HIDDEN_LEADERBOARD_JSON, VISIBLE_LEADERBOARD_JSON]),
      );
    });

    it("loads both the hidden and the visible leaderboard", () => {
      expect(set.getLeaderboards().map((lb) => lb.id)).toEqual([162_754, 160_302]);
    });

    it("marks only the hidden leaderboard as hidden", () => {
      expect(set.leaderboards.get(162_754).hidden).toBe(true);
      expect(set.leaderboards.get(160_302).hidden).toBe(false);
    });
  });
});
