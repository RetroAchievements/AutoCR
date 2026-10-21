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
    ["Fly Like a Bird", "Fly like a Bird"],
    ["I Like a Challenge", "I Like a Challenge"],
    ["Don't You Like a Bonus?", "Don't You Like a Bonus?"],
    ["Party Like It's 2025", "Party Like It's 2025"],
  ],
  "keeps a particle an adverb after a phrasal verb, also inflected or with a pronoun": [
    ["Zeroed in on the Gold", "Zeroed In on the Gold"],
    ["Taking out the Trash", "Taking Out the Trash"],
    ["Have You Tried Turning It off and on Again?", "Have You Tried Turning It Off and On Again?"],
    ["Moving up in the World", "Moving Up in the World"],
  ],
  "knows compound prepositions and the other function-dependent words": [
    ["Come Out Of The Shadows!", "Come out of the Shadows!"],
    ["Hope You're an Expert By Now", "Hope You're an Expert by Now"],
    [
      "Objects in Mirror Are Faster than They Appear",
      "Objects in Mirror Are Faster Than They Appear",
    ],
    ["Snuck Past the Star", "Snuck past the Star"],
    ["Bonus Hole Near the Worm Holes", "Bonus Hole near the Worm Holes"],
    ["Hop 'til you Drop", "Hop 'Til You Drop"],
    ["A Tail As Old As Me", "A Tail as Old as Me"],
    ['"P" is for "Perfect"', '"P" Is for "Perfect"'],
  ],
  "treats single quotes like double quotes, but keeps apostrophes with their words": [
    ["Say 'The End'", "Say 'The End'"],
    ["Say ‘The End’", "Say ‘The End’"],
    ["The C Stands For 'Crying'", "The C Stands for 'Crying'"],
    ["Players' Choice: Kick 'em Out", "Players' Choice: Kick 'Em Out"],
    ["Look Ma', No Hands", "Look Ma', No Hands"],
    ["Back to the '90s", "Back to the '90s"],
  ],
  "lowercases clipped forms and keeps abbreviation periods": [
    ["Sweet Child O' Mine (First Place)", "Sweet Child o' Mine (First Place)"],
    ["Rap N' Roll IV - Green Dance", "Rap n' Roll IV - Green Dance"],
    ["How 'Bout Another Ball?", "How 'bout Another Ball?"],
    ["Single W/Manager vs. W/Manager", "Single w/Manager vs. w/Manager"],
    ["Shmoe vs. The Volcano - Gate Relay", "Shmoe vs. the Volcano - Gate Relay"],
    ["Henry V of England", "Henry V of England"],
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
  "capitalizes the letter A where it cannot be the article": [
    ["Q&a Time", "Q&A Time"],
    ["Plan a", "Plan A"],
    ["Route a: Railway Industry", "Route A: Railway Industry"],
    ["Get an a-Rank", "Get an A-Rank"],
    ["Type-a Personality", "Type-A Personality"],
    ["Straight a+ Student", "Straight A+ Student"],
    ["Rank - a. Wesker", "Rank - A. Wesker"],
  ],
  "lowercases every other capital A as the article": [
    ["Stage A Comeback", "Stage a Comeback"],
    ["Class A Pirate", "Class a Pirate"],
    ["Sonata in A Major", "Sonata in a Major"],
    ["Still A Long Way to Go", "Still a Long Way to Go"],
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
