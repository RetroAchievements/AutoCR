// Word tables for titlecase.js, see https://titlecaseconverter.com/words-to-capitalize/

const words = (list) => new Set(list.trim().split(/\s+/));

// Articles, "and but for or nor", "as" and prepositions of four letters or fewer.
export const ALWAYS_LOWER = words(`
  a an the and but for or nor as
  at of to into onto unto from with amid upon qua sans atop vs vs. v v. via per 'n' n' 'n
`);

// Lowercase as prepositions, capitalized as adverbs ("Look Out!") or nouns ("the Off Season").
export const PARTICLES = words("up out off on in by over down");

export const ARTICLES = words("a an the");

export const NOUN_DETERMINERS = words("the my your his her its our their");

export const DETERMINERS = words(`
  the a an this that these those my your his her its our their whose some any every each no all both
  me him them us it you
`);

export const OBJECT_PRONOUNS = words("me him her them us it you this that em");

export const SUBJECT_PRONOUNS = words("i you we they he she it who");

export const AUXILIARIES = words(`
  do don't does doesn't did didn't will won't would wouldn't could couldn't should shouldn't can can't cannot
  may might must shall gonna gotta wanna am is are was were be been being isn't aren't wasn't weren't
`);

export const COORDINATORS = words("and or but nor yet");

export const SHORT_PREPOSITIONS = words("to with for from into onto of at upon");

// "Better Than I Thought"
export const THAN_CONJUNCTION_NEXT = words(`
  i you we they he she it is are was were has have had do does did can could will would should may might must
`);

// "Bend It like Beckham", "Smells like Steak"
export const LIKE_PREPOSITION_AFTER = words(`
  it him her them me us just more nothing run fight walk live ride shine built bright place
  is are was were am be been being it's that's smell smells smelled look looks looked taste tastes tasted
  feel feels felt eat ate
`);

// "Time Went By So Fast", "Better Off Without You"
export const NOT_AN_OBJECT = words(`
  so too very now then again anytime anywhere anymore soon fast quick quickly slowly later tonight today
  tomorrow yesterday forever never ever always already yet still away next first last early late once
  twice more most much well far near close ahead behind below above ago also even only just really maybe perhaps
  is are was were am isn't aren't wasn't weren't will won't would could
  should shall may might must can can't cannot when where while until till before after because though although
  as if unless whether since than like
  of to with for from into onto unto at upon about above across against along amid among around beneath beside besides
  between beyond despite during except inside outside past through throughout toward towards under underneath unlike
  versus via within without
`);

// Adverbs after any verb form ("Moving Up the Field").
export const ADVERB_BIASED = words("up out");

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
