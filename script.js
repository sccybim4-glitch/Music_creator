const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let beatTimer = null;
let beatStep = 0;

const drums = [
  { name: "Kick", freq: 90, type: "kick" },
  { name: "Snare", freq: 180, type: "snare" },
  { name: "Hi-Hat", freq: 5000, type: "hat" }
];

const pattern = drums.map(() => Array(16).fill(false));
pattern[0][0] = pattern[0][4] = pattern[0][8] = pattern[0][12] = true;
pattern[1][4] = pattern[1][12] = true;
for (let i = 0; i < 16; i += 2) pattern[2][i] = true;

function getAudio() {
  if (!audioCtx) audioCtx = new AudioContextClass();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playDrum(type) {
  const ctx = getAudio();
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);

  if (type === "kick") {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + .15);
    gain.gain.setValueAtTime(.8, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + .18);
    osc.connect(gain); osc.start(now); osc.stop(now + .2);
  } else if (type === "snare") {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = 180;
    gain.gain.setValueAtTime(.25, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + .12);
    osc.connect(gain); osc.start(now); osc.stop(now + .13);
    const buffer = ctx.createBuffer(1, ctx.sampleRate * .12, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(.3, now);
    ng.gain.exponentialRampToValueAtTime(.001, now + .12);
    noise.connect(ng); ng.connect(ctx.destination);
    noise.start(now);
  } else {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = 7000;
    gain.gain.setValueAtTime(.08, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + .05);
    osc.connect(gain); osc.start(now); osc.stop(now + .06);
  }
}

function renderGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  const blank = document.createElement("div");
  grid.appendChild(blank);
  for (let s = 0; s < 16; s++) {
    const label = document.createElement("div");
    label.className = "step-label";
    label.textContent = s + 1;
    grid.appendChild(label);
  }
  drums.forEach((drum, r) => {
    const name = document.createElement("div");
    name.className = "drum-name";
    name.textContent = drum.name;
    grid.appendChild(name);
    for (let s = 0; s < 16; s++) {
      const cell = document.createElement("div");
      cell.className = "step" + (pattern[r][s] ? " active" : "");
      cell.dataset.row = r;
      cell.dataset.step = s;
      cell.onclick = () => {
        pattern[r][s] = !pattern[r][s];
        cell.classList.toggle("active");
        if (pattern[r][s]) playDrum(drum.type);
      };
      grid.appendChild(cell);
    }
  });
}
renderGrid();

function highlightStep(step) {
  document.querySelectorAll(".step").forEach(c => c.classList.remove("current"));
  document.querySelectorAll(`.step[data-step="${step}"]`)
    .forEach(c => c.classList.add("current"));
}

document.getElementById("playBeat").onclick = () => {
  if (beatTimer) {
    clearInterval(beatTimer);
    beatTimer = null;
    document.getElementById("playBeat").textContent = "▶ Play";
    document.querySelectorAll(".step").forEach(c => c.classList.remove("current"));
    return;
  }
  beatStep = 0;
  const tick = () => {
    highlightStep(beatStep);
    drums.forEach((drum, r) => {
      if (pattern[r][beatStep]) playDrum(drum.type);
    });
    beatStep = (beatStep + 1) % 16;
  };
  tick();
  const bpm = Math.max(60, Math.min(180, Number(document.getElementById("bpm").value) || 100));
  beatTimer = setInterval(tick, 60000 / bpm / 4);
  document.getElementById("playBeat").textContent = "■ Stop";
};

document.getElementById("clearBeat").onclick = () => {
  pattern.forEach(row => row.fill(false));
  renderGrid();
};

const notes = [
  ["C4",261.63],["D4",293.66],["E4",329.63],["F4",349.23],
  ["G4",392.00],["A4",440.00],["B4",493.88],["C5",523.25]
];
const piano = document.getElementById("piano");
notes.forEach(([name, freq]) => {
  const key = document.createElement("div");
  key.className = "key";
  key.textContent = name;
  const play = () => {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .8);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + .8);
    document.getElementById("noteName").textContent = `♪ ${name}`;
  };
  key.onclick = play;
  piano.appendChild(key);
});

const lyrics = document.getElementById("lyrics");
lyrics.value = localStorage.getItem("musicCreatorLyrics") || "";
document.getElementById("saveLyrics").onclick = () => {
  localStorage.setItem("musicCreatorLyrics", lyrics.value);
  alert("Lyrics saved on this device.");
};
document.getElementById("downloadLyrics").onclick = () => {
  const blob = new Blob([lyrics.value], {type: "text/plain"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "my-lyrics.txt";
  a.click();
  URL.revokeObjectURL(a.href);
};

let recorder, chunks = [];
document.getElementById("record").onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true});
    recorder = new MediaRecorder(stream);
    chunks = [];
    recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, {type: "audio/webm"});
      document.getElementById("audio").src = URL.createObjectURL(blob);
      stream.getTracks().forEach(t => t.stop());
    };
    recorder.start();
    document.getElementById("record").disabled = true;
    document.getElementById("stop").disabled = false;
    document.getElementById("recordStatus").textContent = "🔴 Recording...";
  } catch (err) {
    document.getElementById("recordStatus").textContent =
      "Microphone access was denied or is unavailable.";
  }
};
document.getElementById("stop").onclick = () => {
  if (recorder && recorder.state !== "inactive") recorder.stop();
  document.getElementById("record").disabled = false;
  document.getElementById("stop").disabled = true;
  document.getElementById("recordStatus").textContent = "Recording ready to play.";
};
