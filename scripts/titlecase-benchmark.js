/* eslint-disable no-console -- CLI script, prints the report */
// Accuracy of analyze_title_case against titlecaseconverter.com (CMOS, keep all caps) on a random sample of
// achievement titles. Fixture entries are [title, reference], with the reference's punctuation mapped back onto
// the title so only letter case differs.
//
//   bun run benchmark:titlecase            # summary
//   bun run benchmark:titlecase --verbose  # also list every disagreement

import process from "node:process";

import { analyze_title_case } from "../js/titlecase.js";
import samples from "../test/fixtures/titlecase-reference.json";

const verbose = process.argv.includes("--verbose");
const normalize = (s) => s.replaceAll(/\s+/g, " ").trim();
const percent = (n, total) => `${((100 * n) / total).toFixed(2)}%`;

let match = 0;
let falsePositive = 0;
let miss = 0;
let wrongFix = 0;
let correctTitles = 0;
for (const [title, reference] of samples) {
  const expected = normalize(reference);
  const actual = normalize(analyze_title_case(title).suggestion);
  const referenceChanged = expected !== normalize(title);
  if (!referenceChanged) {
    correctTitles++;
  }
  if (actual === expected) {
    match++;
    continue;
  }
  if (!referenceChanged) {
    falsePositive++;
  } else if (actual === normalize(title)) {
    miss++;
  } else {
    wrongFix++;
  }
  if (verbose) {
    console.log(`${title}\n  reference: ${expected}\n  checker:   ${actual}`);
  }
}

const changedTitles = samples.length - correctTitles;
console.log(`Samples:         ${samples.length}`);
console.log(`Accuracy:        ${percent(match, samples.length)} (${match})`);
console.log(
  `False positives: ${falsePositive} (${percent(falsePositive, correctTitles)} of correct titles)`,
);
console.log(
  `Misses:          ${miss} (${percent(miss, changedTitles)} of titles the reference changes)`,
);
console.log(`Wrong fixes:     ${wrongFix}`);
