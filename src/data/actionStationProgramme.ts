import type { EventCategory, FestivalEvent } from "../domain/festival";

const event = (
  id: string,
  programmeDay: FestivalEvent["programmeDay"],
  title: string,
  startsAt: string,
  endsAt: string,
  category: EventCategory,
): FestivalEvent => ({
  id,
  title,
  programmeDay,
  venue: "Action Station",
  startsAt,
  endsAt,
  category,
  source: "wider-programme",
});

export const actionStationProgramme: readonly FestivalEvent[] = [
  event("thursday:action-station:banner-painting-with-ellen-green-new-deal-rising", "thursday", "Banner Painting with Ellen (Green New Deal Rising)", "2026-08-20T14:00:00+01:00", "2026-08-20T15:30:00+01:00", "workshop"),
  event("thursday:action-station:ethical-consumer-magazine-no-ethical-listening-under-capitalism-with-ruairidh-hamilton-harry-ruxton-and-oliver-boyle", "thursday", "Ethical Consumer Magazine: No ethical listening under capitalism? with Ruairidh Hamilton, Harry Ruxton and Oliver Boyle", "2026-08-20T15:45:00+01:00", "2026-08-20T16:45:00+01:00", "talk"),
  event("thursday:action-station:make-music-matter-present-we-are-still-here-collage-a-reflection-to-students-in-gaza-with-rebecca-webber-and-laura-otaqui", "thursday", "Make Music Matter present We Are Still Here: Collage A Reflection To Students In Gaza with Rebecca Webber and Laura Otaqui", "2026-08-20T17:00:00+01:00", "2026-08-20T18:35:00+01:00", "workshop"),
  event("thursday:action-station:make-music-matter-present-rawan-roshni-live", "thursday", "Make Music Matter present Rawan Roshni LIVE", "2026-08-20T18:50:00+01:00", "2026-08-20T19:20:00+01:00", "music"),

  event("friday:action-station:seeds-of-revolution-guerrilla-tactics-for-a-peoples-garden-with-ikaay-ebi", "friday", "Seeds of Revolution: Guerrilla Tactics for a People’s Garden with Ikaay Ebi", "2026-08-21T10:00:00+01:00", "2026-08-21T11:00:00+01:00", "workshop"),
  event("friday:action-station:make-music-matter-present-marwan-halabi-live", "friday", "Make Music Matter present Marwan Halabi LIVE", "2026-08-21T11:30:00+01:00", "2026-08-21T12:00:00+01:00", "music"),
  event("friday:action-station:fairtrade-foundation-and-adeche-atelier-present-fair-futures-mural-painting-workshop-with-adwoa-and-solomon", "friday", "Fairtrade Foundation and Adeche Atelier present ‘Fair Futures’: Mural Painting Workshop with Adwoa and Solomon", "2026-08-21T12:15:00+01:00", "2026-08-21T13:15:00+01:00", "workshop"),
  event("friday:action-station:conversations-with-the-far-right-with-adam-brichto-daniel-trilling-samira-ali-milly-blue-host", "friday", "Conversations with the Far Right with Adam Brichto, Daniel Trilling, Samira Ali, Milly Blue (host)", "2026-08-21T13:30:00+01:00", "2026-08-21T14:30:00+01:00", "talk"),
  event("friday:action-station:communitea-with-basimas-kitchen", "friday", "COMMUNITEA with Basima’s Kitchen", "2026-08-21T14:30:00+01:00", "2026-08-21T15:30:00+01:00", "other"),
  event("friday:action-station:lola-olufemi-and-carys-afoko-in-conversation", "friday", "Lola Olufemi and Carys Afoko in conversation", "2026-08-21T15:30:00+01:00", "2026-08-21T16:30:00+01:00", "talk"),
  event("friday:action-station:make-music-matter-present-the-radical-bookshelf-with-amy-abdelnoor-courttia-newland-and-nadia-quadami-chair", "friday", "Make Music Matter present ‘The Radical Bookshelf’ with Amy Abdelnoor, Courttia Newland and Nadia Quadami (chair)", "2026-08-21T16:45:00+01:00", "2026-08-21T17:45:00+01:00", "talk"),
  event("friday:action-station:the-nerve-present-radical-women-and-resistance-using-your-voice-to-urge-change-with-laetitia-sadier-stereolab-emma-dabiri-sarah-donaldson-editor-in-chief-the-nerve-imogen-carter-co-founder-the-nerve-and-chair", "friday", "The Nerve present ‘Radical Women and Resistance – Using your Voice to Urge Change.’ with Laetitia Sadier (Stereolab), Emma Dabiri, Sarah Donaldson (Editor in Chief @ The Nerve), Imogen Carter (Co-Founder of The Nerve and chair)", "2026-08-21T18:00:00+01:00", "2026-08-21T19:00:00+01:00", "talk"),

  event("saturday:action-station:kites4palestine-kite-making-and-flying-workshop-with-kites4palestine-and-amos-trust", "saturday", "Kites4Palestine Kite Making and Flying Workshop with Kites4Palestine & Amos Trust", "2026-08-22T10:00:00+01:00", "2026-08-22T11:00:00+01:00", "workshop"),
  event("saturday:action-station:gaza-biennale-with-jinnaah-uk", "saturday", "Gaza Biennale with Jinnaah UK", "2026-08-22T11:30:00+01:00", "2026-08-22T13:00:00+01:00", "other"),
  event("saturday:action-station:communitea-and-tawlah-workshop-with-neha-shah-chris-rose-samir-eskanda-nyah-clarke-host", "saturday", "COMMUNITEA & Tawlah Workshop with Neha Shah, Chris Rose, Samir Eskanda, Nyah Clarke (host)", "2026-08-22T13:30:00+01:00", "2026-08-22T14:30:00+01:00", "workshop"),
  event("saturday:action-station:behind-the-campaign-with-neha-shah-chris-rose-samir-eskanda-nyah-clarke-host", "saturday", "Behind the Campaign with Neha Shah, Chris Rose, Samir Eskanda, Nyah Clarke (host)", "2026-08-22T15:00:00+01:00", "2026-08-22T16:00:00+01:00", "talk"),
  event("saturday:action-station:the-future-of-a-free-palestine-with-samer-jaber", "saturday", "The Future of a Free Palestine with Samer Jaber", "2026-08-22T16:15:00+01:00", "2026-08-22T17:15:00+01:00", "talk"),

  event("sunday:action-station:protest-song-session-with-genevieve-dawson-zahra-fatehrani", "sunday", "Protest Song Session with Genevieve Dawson, Zahra Fatehrani", "2026-08-23T10:00:00+01:00", "2026-08-23T11:00:00+01:00", "music"),
  event("sunday:action-station:pacbi-workshop-w-samir-eskanda", "sunday", "PACBI Workshop w Samir Eskanda", "2026-08-23T11:00:00+01:00", "2026-08-23T12:00:00+01:00", "workshop"),
  event("sunday:action-station:resistance-is-a-right-and-a-duty-with-lex-korte", "sunday", "Resistance is a Right and a Duty with Lex Korte", "2026-08-23T12:15:00+01:00", "2026-08-23T13:15:00+01:00", "talk"),
  event("sunday:action-station:together-alliance-workshop-women-must-lead-the-fight-against-racism-with-samira-ali-chantelle-lund", "sunday", "Together Alliance Workshop – Women Must Lead the Fight Against Racism with Samira Ali, Chantelle Lund", "2026-08-23T13:30:00+01:00", "2026-08-23T14:30:00+01:00", "workshop"),
  event("sunday:action-station:communitea-feat-letter-writing-with-lex-doj-and-vanessa-brier-art4afreepalestine", "sunday", "COMMUNITEA feat. Letter Writing with Lex DOJ and Vanessa Brier (Art4aFreePalestine)", "2026-08-23T14:30:00+01:00", "2026-08-23T15:30:00+01:00", "workshop"),
  event("sunday:action-station:palestine-power-and-protest-why-are-we-being-attacked-with-chris-nineham-lex-doj-yousaama-and-vanessa-brier-art4afreepalestine", "sunday", "Palestine, power and protest: Why are we being attacked? with Chris Nineham, Lex DOJ, @yoUsaama and Vanessa Brier (@Art4aFreePalestine)", "2026-08-23T15:30:00+01:00", "2026-08-23T16:30:00+01:00", "talk"),
  event("sunday:action-station:make-music-matter-present-activism-on-the-front-line-with-sophie-cowen-gail-bradbrook-mari-and-juju-lili-roseveare", "sunday", "Make Music Matter present Activism on the Front Line with Sophie Cowen, Gail Bradbrook, Mari and JuJu, Lili Roseveare", "2026-08-23T16:45:00+01:00", "2026-08-23T17:45:00+01:00", "talk"),
  event("sunday:action-station:make-music-matter-present-censorship-navigating-the-british-cultural-sectors-silencing-of-support-for-palestine-with-jen-brister-chair-matthew-collings-mohamed-shalaby-tasnima-uddin-anna-ost-fedja-klikovac", "sunday", "Make Music Matter present Censorship: Navigating the British cultural sector’s silencing of support for Palestine with Jen Brister (chair), Matthew Collings, Mohamed Shalaby, Tasnima Uddin, Anna Ost, Fedja Klikovac", "2026-08-23T18:00:00+01:00", "2026-08-23T19:00:00+01:00", "talk"),
];
