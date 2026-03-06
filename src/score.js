export class Session {
  constructor(totalSeconds, totalNotes) {
    this.totalSeconds = totalSeconds;
    this.remaining = totalSeconds;

    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.multiplier = 1;

    this.totalNotes = totalNotes;

    this.perfect = 0;
    this.great = 0;
    this.ok = 0;
    this.miss = 0;
  }
}

export function hit(session, judgement) {
  session.combo++;
  if (session.combo > session.maxCombo) session.maxCombo = session.combo;
  if (session.combo % 10 === 0) session.multiplier++;

  let base = 100;
  if (judgement === "PERFECT") base = 150;
  if (judgement === "GREAT") base = 120;
  if (judgement === "OK") base = 80;

  session.score += session.multiplier * base;

  if (judgement === "PERFECT") session.perfect++;
  else if (judgement === "GREAT") session.great++;
  else if (judgement === "OK") session.ok++;
}

export function miss(session) {
  session.combo = 0;
  session.multiplier = 1;
  session.score = Math.max(0, session.score - 50);
  session.miss++;
}

export function getJudgement(deltaMs) {
  const d = Math.abs(deltaMs);
  if (d <= 25) return "PERFECT";
  if (d <= 50) return "GREAT";
  if (d <= 85) return "OK";
  return "MISS";
}

export function computeAccuracy(session) {
  const totalHit = session.perfect + session.great + session.ok + session.miss;
  if (totalHit === 0) return 0;

  const weightPerfect = 1.0;
  const weightGreat = 0.9;
  const weightOk = 0.7;
  const weightMiss = 0.0;

  const num =
    session.perfect * weightPerfect +
    session.great * weightGreat +
    session.ok * weightOk +
    session.miss * weightMiss;

  return (num / totalHit) * 100;
}
