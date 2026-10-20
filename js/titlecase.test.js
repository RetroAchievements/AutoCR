import { describe, expect, it } from "bun:test";

import { analyze_title_case } from "./titlecase";

// [title, expected suggestion], checked against titlecaseconverter.com (CMOS, keep all caps)
const CASES = {
  "capitalizes words Chicago never lowercases": [
    ["You Only Got One Shot", "You Only Got One Shot"],
    ["Simple Yet Never Boring", "Simple Yet Never Boring"],
    ["Not Available Until Tomorrow", "Not Available Until Tomorrow"],
    ["Better Off Without You", "Better Off Without You"],
    ["Slippery When Wet", "Slippery When Wet"],
  ],
  "lowercases articles, coordinating conjunctions and short prepositions": [
    ["the tortoise and the hare", "The Tortoise and the Hare"],
    ["Swift, But Careful", "Swift, but Careful"],
    ["Escape From the Castle", "Escape from the Castle"],
    ["Fight With Honor", "Fight with Honor"],
  ],
  "tells prepositions from adverbs by context": [
    ["Sit On It!", "Sit on It!"],
    ["Stay In School", "Stay in School"],
    ["Turn Off the Lights", "Turn Off the Lights"],
    ["Level Up!", "Level Up!"],
    ["Pick It Up", "Pick It Up"],
    ["Time Went By So Fast", "Time Went By So Fast"],
    ["Last one out is a rotten Egg!", "Last One Out Is a Rotten Egg!"],
    ["Stranger Than Fiction", "Stranger than Fiction"],
    ["Easier Said Than Done", "Easier Said Than Done"],
    ["Bend It Like Jordan", "Bend It like Jordan"],
    ["Party Like It's 2025", "Party Like It's 2025"],
  ],
  "applies the rules inside hyphenated compounds": [
    ["One-On-One", "One-on-One"],
    ["Burning 1-Up Mushroom", "Burning 1-Up Mushroom"],
    ["Follow-up", "Follow-Up"],
  ],
  "starts a subtitle after a colon or sentence end, not after a dash or ellipsis": [
    ["Climb Up! And Get The Last Chance!", "Climb Up! And Get the Last Chance!"],
    ["(bonus) The Three Trials", "(Bonus) The Three Trials"],
    ["Powered Up - The Battery Farm", "Powered Up - the Battery Farm"],
    ["Golden Gate Bridge... Of Doom", "Golden Gate Bridge... of Doom"],
  ],
  "leaves all caps, brands and digits alone": [
    ["PlayStation McDonald iPhone NES", "PlayStation McDonald iPhone NES"],
    ["NES CLASSIC - Armed To The Teeth", "NES CLASSIC - Armed to the Teeth"],
  ],
  "tells the letter A from the article": [
    ["Sonata in a Major", "Sonata in A Major"],
    ["Q&a Time", "Q&A Time"],
  ],
};

describe("Util: analyze_title_case", () => {
  for (const [behavior, cases] of Object.entries(CASES)) {
    describe(behavior, () => {
      it.each(cases)("given %p, suggests %p", (title, expected) => {
        const { ok, suggestion } = analyze_title_case(title);

        expect(suggestion).toBe(expected);
        expect(ok).toBe(title === expected);
      });
    });
  }

  it("given a title with a miscased word, explains each change", () => {
    const { words } = analyze_title_case("Sit On It!");

    expect(words.filter((w) => w.changed)).toEqual([
      { word: "On", cased: "on", changed: true, reason: "seems to be used as a preposition" },
    ]);
  });
});
