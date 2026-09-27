import { TTSPreset } from "../types/tts";

export const TTS_PRESETS: TTSPreset[] = [
  {
    id: "cinematic-trailer",
    title: "Epic Sci-Fi Prologue",
    category: "Cinematic",
    mode: "single",
    description: "Deep, gravelly cinematic narration with suspenseful breathing and atmospheric presence.",
    voiceName: "Charon",
    text: "Before the stars went quiet, <breath> they whispered a final coordinates sequence across the void. If you are hearing this broadcast, <gasp> the perimeter has already fallen. Tread lightly into the dark.",
    style: "Deep, resonant, suspenseful cinematic movie trailer voice, speaking with gravitas and slow theatrical timing.",
  },
  {
    id: "podcast-cohosts",
    title: "AI Pioneers Podcast Chat",
    category: "Podcast",
    mode: "dialogue",
    description: "Multi-speaker banter with natural backchanneling (|yeah|, |mhm|) and spontaneous laughter.",
    dialogueSpeakers: [
      { speaker: "Alex", voiceName: "Puck", style: "Enthusiastic, energetic podcast host" },
      { speaker: "Sam", voiceName: "Kore", style: "Curious, thoughtful tech co-host" },
    ],
    dialogueParts: [
      {
        speaker: "Alex",
        text: "Welcome back everyone! <breath> Today we are diving headfirst into real-time audio and voice design.",
        style: "Bright, punchy, welcoming",
      },
      {
        speaker: "Sam",
        text: "Oh man, |yeah| it has honestly been one of the wilder weeks in AI history. <laugh> I still cannot believe how expressive these models sound now.",
        style: "Impressed, conversational, warm",
      },
      {
        speaker: "Alex",
        text: "Right? |mhm| Just listen to the cadence and breathing pauses. It feels like we're in the exact same studio together.",
        style: "Engaged, agreeing enthusiastically",
      },
      {
        speaker: "Sam",
        text: "Totally. <breath> Let's break down how creators can actually prompt this fidelity themselves.",
        style: "Smooth transition, curious",
      },
    ],
  },
  {
    id: "calm-meditation",
    title: "Mindfulness Breathing Guide",
    category: "Meditation",
    mode: "single",
    description: "Hypnotic, warm, gentle guidance designed to help the listener unwind and breathe deeply.",
    voiceName: "Kore",
    text: "Allow your shoulders to soften. <breath> Gently close your eyes, and notice the rise and fall of your breath. <sigh> There is nowhere else you need to be right now. Simply be here.",
    style: "Extremely gentle, soothing, soft-spoken meditation instructor with warm, tranquil cadence.",
  },
  {
    id: "rpg-mercenary",
    title: "Cyberpunk Fixer's Warning",
    category: "Gaming",
    mode: "single",
    description: "Gritty, sharp warning from an underground fixer in a neon-drenched dystopia.",
    voiceName: "Fenrir",
    text: "Listen closely, rookie. <breath> The corps don't forgive a second breach. You get in, pull the encrypted shards, and vanish into the neon rain. <laugh> Hesitate for even one heartbeat, and you're static.",
    style: "Gritty, intense, cynical sci-fi mercenary speaking in a hushed, dangerous whisper.",
  },
  {
    id: "keynote-reveal",
    title: "Next-Gen Hardware Reveal",
    category: "Commercial",
    mode: "single",
    description: "Sleek, polished keynote delivery introducing a breakthrough technological breakthrough.",
    voiceName: "Zephyr",
    text: "Every decade or so, a device comes along that fundamentally changes how humanity creates. <breath> Today, we are proud to introduce VoxCore One. It doesn't just listen; <gasp> it understands.",
    style: "Polished, visionary keynote presenter, charismatic and deliberate with building excitement.",
  },
  {
    id: "detective-interrogation",
    title: "Midnight Police Interrogation",
    category: "Storytelling",
    mode: "dialogue",
    description: "Tense noir duel between a cynical detective and a defiant suspect under flickering neon light.",
    dialogueSpeakers: [
      { speaker: "Detective Miller", voiceName: "Charon", style: "Gruff, world-weary homicide detective" },
      { speaker: "Elena", voiceName: "Puck", style: "Defiant, sharp, guarded suspect" },
    ],
    dialogueParts: [
      {
        speaker: "Detective Miller",
        text: "The surveillance cameras outside the warehouse cut out at 2:14 AM. <breath> Care to tell me where your car was parked, Elena?",
        style: "Accusatory, slow, low register",
      },
      {
        speaker: "Elena",
        text: "You can keep trying that tired routine, Miller. <laugh> I was thirty miles north eating cherry pie in a diner. Check the receipt.",
        style: "Sharp, sarcastic smirk",
      },
      {
        speaker: "Detective Miller",
        text: "Funny thing about cherry pie... |yeah| it doesn't leave gunpowder residue on your sleeves. <sigh>",
        style: "Grim satisfaction, deliberate pause",
      },
      {
        speaker: "Elena",
        text: "<gasp> That's not mine! You set this up!",
        style: "Shocked realization turning to panicked fury",
      },
    ],
  },
];
