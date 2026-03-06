import { Note } from "./note.js";
import { Session } from "./score.js";

export async function loadSong(name) {

  // 1. Check if beatmap was imported (from menu.js)
  if (window.opener && window.opener.importedBeatmaps && window.opener.importedBeatmaps[name]) {
    console.log("Loaded imported beatmap:", name);
    const data = window.opener.importedBeatmaps[name];

    const notes = data.notes
      .map(n => new Note(n.x, n.y, n.timeMs))
      .sort((a, b) => a.timeMs - b.timeMs);

    const last = notes.length ? notes[notes.length - 1].timeMs : 0;
    const totalSeconds = (last + 3000) / 1000;

    return {
      title: data.title,
      audio: data.audio,
      offsetMs: data.offsetMs ?? 0,
      notes,
      session: new Session(totalSeconds, notes.length)
    };
  }

  // 2. Otherwise load from server normally
  const res = await fetch(`/beatmaps/${name}.beatmap`);
  const data = await res.json();

  const notes = data.notes
    .map(n => new Note(n.x, n.y, n.timeMs))
    .sort((a, b) => a.timeMs - b.timeMs);

  const last = notes.length ? notes[notes.length - 1].timeMs : 0;
  const totalSeconds = (last + 3000) / 1000;

  return {
    title: data.title,
    audio: data.audio,
    offsetMs: data.offsetMs ?? 0,
    notes,
    session: new Session(totalSeconds, notes.length)
  };
}
