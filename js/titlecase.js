// Chicago (CMOS) title case, as applied by titlecaseconverter.com. Function words are lowercased, everything else
// is capitalized; words that can be prepositions or adverbs (up, out, like, ...) are decided from context.
import {
  ABBREVIATIONS,
  ADVERB_BIASED,
  ALWAYS_LOWER,
  ARTICLES,
  AUXILIARIES,
  COORDINATORS,
  DETERMINERS,
  IRREGULAR_VERBS,
  LETTER_A_AFTER,
  LETTER_A_BEFORE,
  LIKE_PREPOSITION_AFTER,
  NOT_AN_OBJECT,
  NOUN_DETERMINERS,
  OBJECT_PRONOUNS,
  PARTICLES,
  PHRASAL_VERBS,
  SHORT_PREPOSITIONS,
  SUBJECT_PRONOUNS,
  THAN_CONJUNCTION_NEXT,
} from "./titlecase-words";

// A word: letters, digits and apostrophes ("Don't", "'Til", "2nd"), plus inner periods ("L.A", "U.S.A").
// A trailing period is left in the joint, so "." and "..." can be told apart.
const WORD_RE = /[\p{L}\p{N}'’]+(?:\.(?=[\p{L}\p{N}])[\p{L}\p{N}'’]+)*/gu;

// Joint before a word that starts a new clause (subtitle or sentence): it contains one of ! ? : ; ) ] } / |,
// Examples: "Climb Up! And Get…", "Act 1: The Start", "(Bonus) The Trials" , 'Say "Hello"'
// Commas, dashes and ellipses don't start a clause: "Powered Up - the Battery Farm", "Bridge... of Doom".
const CLAUSE_START_RE = /[!?:;)\]}/|]|(?<![.])\.(?![.])|["“‘']$/;
// Joint after a word that ends a clause; same idea, mirrored: "Level Up!", "Pick It Up (Bonus)", '"Up" Is Down'.
const CLAUSE_END_RE = /[!?:;()[\]{}/|]|(?<![.])\.(?![.])|^["”’']/;
// Joint ending in a dash: "Done! - the End" does not start a new clause even though it contains "!".
const TRAILING_DASH_RE = /[-‐‑‒–—―]\s*$/;
// Joint before the first word ending in an ellipsis: "...of Doom" continues an earlier title, not capitalized.
const LEADING_ELLIPSIS_RE = /(?:\.\.\.|…)\s*$/;
// Joint that is a single hyphen, joining a compound: "One-on-One". A spaced " - " is a dash, not a hyphen.
const HYPHEN_RE = /^[-‐‑]$/;
// Joint that is only whitespace: the words are directly next to each other ("Turn Off", not "Turn, Off").
const WHITESPACE_RE = /^\s+$/;
// Joint of whitespace and opening quotes: 'Sit on "It"'.
const OPENING_QUOTE_RE = /^\s+["“‘([]+$/;

// A letter from a non-Latin script (Cyrillic, Greek, Japanese, ...): "Привет", "ゼルダ".
const NON_LATIN_RE = /[\p{L}&&[^\p{Script=Latin}]]/v;
// Single letters separated by periods: "L.A", "U.S", "J". Used to keep the final period with the word ("L.A.").
const INITIALISM_RE = /^(?:\p{L}\.)*\p{L}$/u;
// Clipped words that are always lowercased:
const CLIPPED_OF_RE = /^o['’]$/i; // o' ("Child o' Mine")
const CLIPPED_AND_RE = /^(?:['’]n['’]?|n['’])$/i; // 'n', 'n, n' ("Rock 'n' Roll", "Rap n' Roll")
const CLIPPED_ABOUT_RE = /^['’]bout$/i; // 'bout ("How 'bout Another")
// Previous word looks like a verb form: "Moving Up", "Moved Up".
const VERB_FORM_RE = /(?:ing|in'|ed)$/;

// Every rule returns a decision: { cap, reason }.
//   cap:    true = capitalize, false = lowercase, null = leave the word as written
//   reason: completes a sentence about the word, shown in the feedback: "On" → "on": seems to be used as a preposition
const capital = (reason) => ({ cap: true, reason });
const lower = (reason) => ({ cap: false, reason });
const keep = (reason) => ({ cap: null, reason });

const AS_PREPOSITION = "seems to be used as a preposition";
const AS_LETTER = "is used as a letter (noun)";
const AS_NOUN_OR_ADJECTIVE = "is used as a noun or adjective";

// A title is split into words and "joints" (the text between two words) which are used for most regexes.
// "Sit On It!" → tokens [{joint: "", word: "Sit"}, {joint: " ", word: "On"}, {joint: " ", word: "It"}], lastJoint "!"
function tokenize(phrase) {
  const tokens = [];
  let last = 0;
  for (const match of phrase.matchAll(WORD_RE)) {
    let word = match[0];
    let end = match.index + word.length;
    // "vs." / "Mr.": the period belongs to the word
    const abbreviation = ABBREVIATIONS.has(word.toLowerCase()) || INITIALISM_RE.test(word);
    if (phrase[end] === "." && phrase[end + 1] !== "." && abbreviation) {
      word += ".";
      end++;
    }
    tokens.push({ joint: phrase.slice(last, match.index), word });
    last = end;
  }
  return { tokens, lastJoint: phrase.slice(last) };
}

// Normalized form used to look a word up in the word tables: "'Til" → "til", "Vs." → "vs", "Don’t" → "don't"
function lookup_key(word) {
  const lowered = word.toLowerCase();
  return (
    lowered
      .replaceAll("’", "'")
      .replace(/\.$/, "")
      .replaceAll(/^'+|'+$/g, "") || lowered
  );
}

// "'til" → "'Til", "hELLO" → "Hello"
function capitalize(word) {
  const i = word.search(/\p{L}/u);
  return i < 0 ? word : word.slice(0, i) + word[i].toUpperCase() + word.slice(i + 1).toLowerCase();
}

// "NES", "CLASSIC" (single letters like "A" don't count)
function is_all_caps(word) {
  const letters = word.replaceAll(/[^\p{L}]/gu, "");
  return letters.length >= 2 && letters === letters.toUpperCase();
}

// "iPhone", "McDonald", "PlayStation"
function has_inner_capital(word) {
  const i = word.search(/\p{L}/u);
  return i >= 0 && /\p{Lu}/u.test(word.slice(i + 1).replaceAll(/[^\p{L}]/gu, ""));
}

// Possible base forms of a verb, to look it up in PHRASAL_VERBS. Guesses all candidates rather than being exact:
// "stopped" → stop, "carries" → carry, "running" → run, "took" → take, "movin'" → move
function verb_stems(word) {
  const w = word.toLowerCase().replaceAll("’", "'");
  const stems = new Set([w]);
  const add = (stem) => {
    if (stem.length >= 2) {
      stems.add(stem);
    }
  };
  // doubled consonant before the suffix: "stopped", "running"
  const doubled = (suffix) =>
    w.length > suffix.length + 2 && w.at(-suffix.length - 1) === w.at(-suffix.length - 2);

  if (IRREGULAR_VERBS.has(w)) {
    stems.add(IRREGULAR_VERBS.get(w));
  }
  if (w.endsWith("ies") || w.endsWith("ied")) {
    add(w.slice(0, -3) + "y");
  }
  if (w.endsWith("es")) {
    add(w.slice(0, -2));
  }
  if (w.endsWith("s")) {
    add(w.slice(0, -1));
  }
  if (w.endsWith("ed")) {
    add(w.slice(0, -2));
    add(w.slice(0, -1));
    if (doubled("ed")) {
      add(w.slice(0, -3));
    }
  }
  if (w.endsWith("ing")) {
    add(w.slice(0, -3));
    add(w.slice(0, -3) + "e");
    if (doubled("ing")) {
      add(w.slice(0, -4));
    }
  }
  if (w.endsWith("in'")) {
    add(w.slice(0, -3));
    add(w.slice(0, -3) + "e");
  }
  return stems;
}

// A tokenized title with questions about word i's surroundings. Word i is preceded by joint i (see tokenize).
class Title {
  constructor(phrase) {
    const { tokens, lastJoint } = tokenize(phrase);
    this.tokens = tokens;
    this.lastJoint = lastJoint;
    this.keys = tokens.map((token) => lookup_key(token.word));
  }

  get length() {
    return this.tokens.length;
  }

  word(i) {
    return this.tokens[i].word;
  }

  jointBefore(i) {
    return i < this.length ? this.tokens[i].joint : this.lastJoint;
  }

  startsClause(i) {
    const joint = this.tokens[i].joint;
    if (i === 0) {
      return !LEADING_ELLIPSIS_RE.test(joint);
    }
    return !TRAILING_DASH_RE.test(joint) && CLAUSE_START_RE.test(joint);
  }

  endsClause(i) {
    return i === this.length - 1 || CLAUSE_END_RE.test(this.tokens[i + 1].joint);
  }

  // previous/next word within the same clause, or null
  prevKey(i) {
    return i > 0 && !this.startsClause(i) ? this.keys[i - 1] : null;
  }

  nextKey(i) {
    return i + 1 < this.length && !this.startsClause(i + 1) ? this.keys[i + 1] : null;
  }

  plainBefore(i) {
    return i > 0 && WHITESPACE_RE.test(this.tokens[i].joint);
  }

  plainAfter(i) {
    return i + 1 < this.length && WHITESPACE_RE.test(this.tokens[i + 1].joint);
  }

  hyphenBefore(i) {
    return HYPHEN_RE.test(this.tokens[i].joint);
  }

  hyphenAfter(i) {
    return i + 1 < this.length && HYPHEN_RE.test(this.tokens[i + 1].joint);
  }

  quoteAfter(i) {
    return i + 1 < this.length && OPENING_QUOTE_RE.test(this.tokens[i + 1].joint);
  }

  // Does an object follow word i? Then a particle is a preposition ("Sit on It") rather than an adverb
  // ("Time Went By So Fast", "Better Off Without You").
  followedByObject(i) {
    const next = this.nextKey(i);
    if (next === null) {
      return this.quoteAfter(i);
    }
    if (!this.plainAfter(i)) {
      return false;
    }
    if (COORDINATORS.has(next) || SHORT_PREPOSITIONS.has(next) || NOT_AN_OBJECT.has(next)) {
      return false;
    }
    return !(PARTICLES.has(next) && ADVERB_BIASED.has(this.keys[i]));
  }

  // Is particle i part of a phrasal verb, directly or after a pronoun? "Turn Off the Lights", "Pick It Up"
  precededByPhrasalVerb(i) {
    const particle = this.keys[i];
    const verbs = PHRASAL_VERBS.get(particle);
    if (!verbs) {
      return false;
    }
    let verb = i - 1;
    if (
      particle !== "down" &&
      verb >= 0 &&
      !this.startsClause(i) &&
      OBJECT_PRONOUNS.has(this.keys[verb])
    ) {
      verb--;
    }
    if (verb < 0 || this.startsClause(verb + 1) || !this.plainBefore(verb + 1)) {
      return false;
    }
    return verb_stems(this.word(verb))
      .values()
      .some((stem) => verbs.has(stem));
  }
}

// up, out, off, on, in, by, over, down: a preposition (lowercase) takes an object, an adverb (capitalized) doesn't.
// "Sit on It", "Turn Off the Lights", "Come out of the Shadows", "Moving Up in the World"
function decide_particle(title, i) {
  const particle = title.keys[i];
  const prev = title.prevKey(i);
  const next = title.nextKey(i);
  const plainBefore = title.plainBefore(i);

  if (title.precededByPhrasalVerb(i)) {
    return capital("seems to be used as an adverb (phrasal verb)");
  }
  if (next === "of" && title.plainAfter(i)) {
    return lower('is part of a compound preposition ("out of")');
  }
  if (particle === "by" && ["now", "then", "far"].includes(next)) {
    return lower('is part of a compound preposition ("by now")');
  }
  if (ADVERB_BIASED.has(particle) && prev !== null && plainBefore && VERB_FORM_RE.test(prev)) {
    return capital("seems to be used as an adverb (after a verb form)");
  }
  if (!title.followedByObject(i)) {
    return capital("seems to be used as an adverb (no object follows)");
  }
  return lower(AS_PREPOSITION);
}

// past, plus: a preposition before an object ("Snuck past the Star", "Two plus Two"),
// a noun or adjective after a determiner ("Ghosts of the Past"), an adverb before a clause boundary ("Rush Past: Bonus").
function decide_past_or_plus(title, i, prev, next) {
  if (prev !== null && title.plainBefore(i) && NOUN_DETERMINERS.has(prev)) {
    return capital(AS_NOUN_OR_ADJECTIVE);
  }
  if (next === null && !title.quoteAfter(i)) {
    return capital("is used as an adverb or noun");
  }
  return lower("is probably used as a preposition");
}

// near, mid: a preposition before a determiner ("Bonus Hole near the Worm Holes", "mid the Chaos"),
// a noun or adjective after one ("In the Near Future"), otherwise an adjective or adverb ("Near Miss").
function decide_near_or_mid(title, i, prev, next) {
  const personal = ["me", "him", "them", "us", "it", "you"];
  if (DETERMINERS.has(prev) && !personal.includes(prev)) {
    return capital(AS_NOUN_OR_ADJECTIVE);
  }
  if (DETERMINERS.has(next)) {
    return lower("is used as a preposition");
  }
  return capital("is used as a noun, adjective or adverb");
}

// till, til, thru (short for "until" / "through"): a conjunction when a clause follows ("Hop 'Til You Drop",
// "Wait Till I Come"), otherwise a preposition ("Party till Dawn").
function decide_till_or_thru(title, i, prev, next) {
  if (SUBJECT_PRONOUNS.has(next) || AUXILIARIES.has(next)) {
    return capital("is used as a conjunction");
  }
  return lower("is used as a preposition");
}

// Words whose function depends on context, with a rule each: (title, i, prev, next) → decision.
// prev and next are the neighboring words' lookup keys, or null at a clause boundary.
const SPECIAL_RULES = new Map(
  Object.entries({
    // the article ("a Rotten Egg") or the letter ("Plan A", "Sonata in A Major", "Q&A")
    a(title, i, prev, next) {
      if (title.jointBefore(i).includes("&") || title.jointBefore(i + 1).includes("&")) {
        return capital(AS_LETTER);
      }
      const hyphenBefore = title.hyphenBefore(i);
      const hyphenAfter = title.hyphenAfter(i);
      if (hyphenBefore && hyphenAfter) {
        return lower("is an article inside a hyphenated compound");
      }
      if (hyphenAfter || next === null || !title.plainAfter(i)) {
        return capital(AS_LETTER);
      }
      if (prev !== null && (LETTER_A_BEFORE.has(prev) || ARTICLES.has(prev))) {
        return capital(AS_LETTER);
      }
      if (prev === "in" && LETTER_A_AFTER.has(next)) {
        return capital(AS_LETTER);
      }
      return lower("is an article");
    },
    // always lowercase, only listed for its more precise reason ("Born to Run", "Back to School")
    to: () => lower("is a preposition or part of an infinitive"),
    // a conjunction before a clause ("Faster Than They Appear"), otherwise a preposition ("Stranger than Fiction")
    than(title, i, prev, next) {
      if (THAN_CONJUNCTION_NEXT.has(next) || (prev === "said" && next === "done")) {
        return capital("is used as a conjunction");
      }
      return lower("is used as a preposition");
    },
    // a preposition after "it", "smells", ... or before an article ("Bend It like Jordan", "Fly like a Bird"),
    // otherwise a verb, adjective or conjunction ("I Like Trains", "Party Like It's 2025")
    like(title, i, prev, next) {
      if (prev !== null && title.plainBefore(i) && LIKE_PREPOSITION_AFTER.has(prev)) {
        return lower(AS_PREPOSITION);
      }
      if (next !== null && title.plainAfter(i) && ARTICLES.has(next)) {
        return lower(AS_PREPOSITION);
      }
      return capital("is probably used as a verb, an adjective or a conjunction");
    },
    past: decide_past_or_plus,
    plus: decide_past_or_plus,
    near: decide_near_or_mid,
    mid: decide_near_or_mid,
    thru: decide_till_or_thru,
    til: decide_till_or_thru,
    till: decide_till_or_thru,
  }),
);

// Decides how word i should be cased and why, returning { cap, reason } (see capital/lower/keep above).
// The checks run in order and the first match wins: words to leave alone, then first/last word, then the
// context-dependent words, and finally the fixed Chicago lists.
function decide(title, i) {
  const word = title.word(i);
  const key = title.keys[i];
  const hyphenBefore = title.hyphenBefore(i);

  if (!/\p{L}/u.test(word)) {
    return keep("contains no letters");
  }
  if (NON_LATIN_RE.test(word)) {
    return keep("is not a Latin-script word");
  }
  if (is_all_caps(word)) {
    return keep("is written in all caps, assumed intentional");
  }
  if (has_inner_capital(word)) {
    return keep("has internal capitals (brand or name), left unchanged");
  }
  if (/\p{N}/u.test(word)) {
    return keep("contains digits, left unchanged");
  }
  if (CLIPPED_OF_RE.test(word)) {
    return lower('is a diminished form of "of"');
  }
  // "w/Manager"
  if (key === "w" && i + 1 < title.length && title.jointBefore(i + 1).startsWith("/")) {
    return lower('is an abbreviation of "with"');
  }
  if (CLIPPED_AND_RE.test(word) || CLIPPED_ABOUT_RE.test(word)) {
    return lower('is a clipped form of "and" / "about"');
  }
  if (word === "V") {
    return keep("is a single capital V (roman numeral or initial), left unchanged");
  }
  if (title.startsClause(i) && !hyphenBefore) {
    return capital(
      i === 0 ? "is the first word of the title" : "is the first word of a subtitle or sentence",
    );
  }
  if (title.endsClause(i) && !title.hyphenAfter(i)) {
    return capital("is the last word of the title or subtitle");
  }
  // inside a compound: "One-on-One", "Face-to-Face"; at its end: "Follow-Up", "Burning 1-Up"
  if (hyphenBefore && (PARTICLES.has(key) || key === "to" || key === "for")) {
    if (title.hyphenAfter(i) || key === "to" || key === "for") {
      return lower("is a preposition inside a hyphenated compound");
    }
    return capital("is an adverbial particle ending a hyphenated compound");
  }
  if (SPECIAL_RULES.has(key)) {
    return SPECIAL_RULES.get(key)(title, i, title.prevKey(i), title.nextKey(i));
  }
  if (PARTICLES.has(key)) {
    return decide_particle(title, i);
  }
  if (ARTICLES.has(key)) {
    return lower("is an article");
  }
  if (["and", "but", "or", "nor"].includes(key)) {
    return lower("is a coordinating conjunction");
  }
  if (key === "as") {
    return lower('is "as", which Chicago style always lowercases');
  }
  if (ALWAYS_LOWER.has(key)) {
    return lower("is a preposition of four letters or fewer");
  }
  return capital(
    "is neither an article, a coordinating conjunction nor a preposition of four letters or fewer",
  );
}

export function analyze_title_case(phrase) {
  const title = new Title(phrase);
  const words = title.tokens.map(({ word }, i) => {
    const { cap, reason } = decide(title, i);
    let cased = word;
    if (cap === true) {
      cased = capitalize(word);
    } else if (cap === false) {
      cased = word.toLowerCase();
    }
    return { word, cased, changed: cased !== word, reason };
  });
  return {
    ok: words.every((w) => !w.changed),
    suggestion: words.map((w, i) => title.jointBefore(i) + w.cased).join("") + title.lastJoint,
    words,
  };
}
