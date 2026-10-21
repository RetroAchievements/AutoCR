// Word tables for titlecase.js, see https://titlecaseconverter.com/words-to-capitalize/
// Each word group is listed once below; the sets titlecase.js asks about are built from them further down.

const words = (list) => new Set(list.trim().split(/\s+/));
const union = (...groups) => new Set(groups.flatMap((group) => [...group]));
const without = (group, ...excluded) => new Set([...group].filter((w) => !excluded.includes(w)));

// --- Word groups ---

export const ARTICLES = words("a an the");

// Chicago lowercases these; "yet" and "so" are capitalized.
export const COORDINATING_CONJUNCTIONS = words("and but for or nor");

// Prepositions of four letters or fewer, always lowercased. Short prepositions that can also be other parts of
// speech (up, like, past, near, till, ...) are decided from context instead.
export const SHORT_PREPOSITIONS = words(`
  at of to for into onto unto from with amid upon qua sans atop vs v via per
`);

// Capitalized like any other word, but they still never start an object.
const LONG_PREPOSITIONS = words(`
  about above across against along among around beneath beside besides between beyond despite during except
  inside outside past through throughout toward towards under underneath unlike versus within without
`);

// Lowercase as prepositions, capitalized as adverbs ("Look Out!") or nouns ("the Off Season").
export const PARTICLES = words("up out off on in by over down");

// Adverbs after any verb form ("Moving Up the Field").
export const ADVERB_BIASED = words("up out");

const SUBORDINATORS = words(`
  when where while until till before after because though although as if unless whether since than like
`);

const SUBJECT_PRONOUNS = words("i you we they he she it");

export const OBJECT_PRONOUNS = words("me him her them us it you 'em");

const DEMONSTRATIVES = words("this that these those");

const POSSESSIVES = words("my your his her its our their whose");

const QUANTIFIERS = words("some any every each no all both");

const BE = words("am is are was were be been being isn't aren't wasn't weren't");

const AUXILIARIES = union(
  BE,
  words(`
    do don't does doesn't did didn't has have had
    will won't would wouldn't could couldn't should shouldn't can can't cannot may might must shall
    gonna gotta wanna
  `),
);

const ADVERBS = words(`
  so too very now then again anytime anywhere anymore soon fast quick quickly slowly later tonight today
  tomorrow yesterday forever never ever always already yet still away next first last early late once
  twice more most much well far near close ahead behind below above ago also even only just really maybe perhaps
`);

// --- Sets built from the groups ---

// Words that start a noun phrase: "near the Worm Holes", "In the Near Future".
export const DETERMINERS = union(ARTICLES, DEMONSTRATIVES, POSSESSIVES, QUANTIFIERS);

// Words that start a clause, making the word before them a conjunction: "Better Than I Thought",
// "Wait Till I Come", and a verb after them: "I Like Trains", "Don't Like Mondays".
export const CLAUSE_STARTERS = union(SUBJECT_PRONOUNS, AUXILIARIES, ["who"]);

// Words that can't start an object, so a particle before them is an adverb: "Time Went By So Fast",
// "Better Off Without You".
export const NOT_AN_OBJECT = union(
  ADVERBS,
  AUXILIARIES,
  COORDINATING_CONJUNCTIONS,
  SUBORDINATORS,
  SHORT_PREPOSITIONS,
  LONG_PREPOSITIONS,
);

// Pronouns that can sit between a phrasal verb and its particle: "Pick It Up", "Turn That Off".
export const PHRASAL_VERB_OBJECTS = union(OBJECT_PRONOUNS, DEMONSTRATIVES);

// Words after which "like" is a preposition: "Bend It like Beckham", "Smells like Steak", "It Was like a Dream".
export const LIKE_PREPOSITION_AFTER = union(
  without(OBJECT_PRONOUNS, "you"),
  BE,
  words(`
    it's that's just more nothing run fight walk live ride shine built bright place
    smell smells smelled look looks looked taste tastes tasted feel feels felt eat ate
  `),
);

// --- Other tables ---

export const ABBREVIATIONS = words(
  "vs v etc mr mrs ms dr st jr sr no vol ft mt inc ltd co feat ep op pt ch",
);

// Separable phrasal verbs keep the particle an adverb before an object ("Turn Off the Lights"). Intransitive ones
// are left out on purpose ("Stay in School").
export const PHRASAL_VERBS = new Map([
  [
    "up",
    words(`
      level power wake give brighten bang bust send end step bump set pick hurry speed clean catch light line load
      lock mix pump round shut sign stock suit team warm wind wrap back blow break build burn cheer cook cough crank
      dig dress drink eat fill fire fix free gear hang heat hold hook keep look make open pair pay pile rack rev save
      scale screw shake shape size split stack start stir tear throw tidy turn use wash whip beef boot bottle bring
      buck buckle bulk bundle butter buy call charge chalk chop clam clear clog close conjure cover crack cuddle curl
      cut dial divide double draw drum dry ease finish fluff fold follow gas gobble gun hush jack juice kick knock
      lace lap lift link liven mark measure mess mop muck muster own patch perk pin plug polish prop pull push put
      rake ramp read rig ring roll rustle scoop scrape scrounge seal serve sew shore shoot shrivel slice smarten snap
      soak soup spark spice spruce square stick straighten strike suck sum swallow sweep swell take talk tally tank
      tee thaw think tie tighten toss total touch toughen trade trump tune vamp wall wear weigh wipe work write zip
      show
    `),
  ],
  [
    "out",
    words(`
      take check figure find point pull rat rule sort try turn wipe work max run hang lock pick play roll shoot sit
      space spread stretch wear act carry cut keep leave blow clean clear cross deal dish dole drag draw drown dry
      eke fan farm fill fish flesh flush get grind hammer hand hash help hide iron kick knock lay let make map mete
      phase plan pour print push put rent ride root rub scope seek sell send set shell ship shout single smoke
      smooth snuff sound spell spit stamp stick stress strike sweat sweep talk tap test thin throw thrash trot tune
      vote wait wash weed wring write block bring buy call cast chuck churn count crank cry dig dust edit flag flat
      flip freeze give hold hunt ink jut kill laugh live lure miss move opt pace pass pay pipe plot press punch
      reach read rip rough scratch screen scream scrub search seal shake share shut sketch sleep slip snap sniff spin
      spot squeeze stake stare storm straighten string strip suss swap tease thrust tire toss trace trick whip win
      yank zone zoom
    `),
  ],
  [
    "off",
    words(`
      turn take show back blast brush call cool cut fend fight finish give hold kick knock lay lift log pay pull put
      rip see sell set shake shave shrug sign sound square start switch tell throw tip top ward wear write auction
      bite blow cap cast check clear cross dust ease fire fob hit keep lead leave make mark pair peel pick polish
      power rattle reel round rub scare scrape seal send shoot shut siphon skim sleep slack sod spin split spark
      stave strike tail tick toss touch trigger wave wipe work bugger buzz fuck piss dash head hop kill laugh live
      nod pass ride sail scrub sweat wash
    `),
  ],
  [
    "on",
    words(`
      carry keep put turn switch bring cheer lead pass power spur urge try add drag press ramble rattle read strap
      tack tag
    `),
  ],
  [
    "in",
    words(`
      tune cash plug give kick pull rake reel sign take throw tuck usher zero break bring call fill lock log send
    `),
  ],
  [
    "over",
    words(`
      take turn knock look pass push win think talk mull hand fork gloss paint paper plaster read sign smooth start
      do make carry chew check kick pick tip flip bowl bring change hold run sleep switch voice work
    `),
  ],
  [
    "down",
    words(`
      calm break burn chow cut hunt knock lay let lock mow nail pin power pull put run shoot shut slow take tear
      throw tone track turn wear wind write back boil bring chase dumb hand load mark pass play ram scale water wolf
      bog bolt chop clamp close crack drink face gun hammer hose kick narrow pare peg ring rub sand scrub send set
      shake shout slam slap smack snap strip sweep talk tamp thin tie wash weigh wipe count double hold keep live
      cool quiet strike bear buckle head simmer bed bow bunk call cast crash dress flag flop plunk stamp buy die jot
      melt phase pipe press push rain roll settle stare step stomp tramp trickle wave
    `),
  ],
]);

export const IRREGULAR_VERBS = new Map(
  [
    ...words(`
  took:take taken:take gave:give given:give got:get gotten:get went:go gone:go came:come broke:break broken:break
  blew:blow blown:blow grew:grow grown:grow held:hold hung:hang kept:keep knew:know known:know lit:light made:make
  paid:pay ran:run rose:rise risen:rise shook:shake shaken:shake shot:shoot sold:sell spoke:speak spoken:speak
  stood:stand stuck:stick struck:strike swept:sweep threw:throw thrown:throw told:tell tore:tear torn:tear
  woke:wake woken:wake wore:wear worn:wear wrote:write written:write won:win wound:wind drew:draw drawn:draw
  ate:eat eaten:eat fell:fall fallen:fall fought:fight found:find flew:fly flown:fly froze:freeze frozen:freeze
  led:lead lay:lie lain:lie left:leave lost:lose met:meet rode:ride ridden:ride rang:ring rung:ring sat:sit
  saw:see seen:see sent:send sang:sing sung:sing slept:sleep spent:spend sprang:spring stole:steal stolen:steal
  swam:swim swum:swim brought:bring bought:buy caught:catch did:do done:do dug:dig fed:feed hid:hide hidden:hide
  lent:lend built:build bound:bind bent:bend bled:bleed bred:breed burnt:burn dealt:deal dreamt:dream fled:flee
  knelt:kneel laid:lay meant:mean said:say sought:seek slid:slide sped:speed sank:sink sunk:sink swung:swing
  taught:teach thought:think understood:understand wept:weep beat:beat beaten:beat became:become began:begin
  begun:begin bit:bite bitten:bite chose:choose chosen:choose drank:drink drunk:drink drove:drive driven:drive
  forgot:forget forgotten:forget shrank:shrink shrunk:shrink spun:spin stank:stink swore:swear sworn:swear
  clung:cling crept:creep slung:sling spat:spit strung:string stung:sting stunk:stink swelled:swell swollen:swell
  trod:tread leapt:leap shone:shine sewn:sew mown:mow sawn:saw hewn:hew shorn:shear slain:slay slew:slay
  wrung:wring overcame:overcome undid:undo undone:undo withdrew:withdraw
`),
  ].map((pair) => pair.split(":")),
);
