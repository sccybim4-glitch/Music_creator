const generateBtn = document.getElementById("generateBtn");
const promptBox = document.getElementById("songPrompt");
const lyricsBox = document.getElementById("lyrics");
const statusBox = document.getElementById("status");
const songResult = document.getElementById("songResult");
const audioPlayer = document.getElementById("audioPlayer");

generateBtn.addEventListener("click", function () {
  const prompt = promptBox.value.trim();

  if (!prompt) {
    statusBox.textContent = "⚠️ Please describe your song first.";
    return;
  }

  const genre = document.getElementById("genre").value;
  const mood = document.getElementById("mood").value;
  const language = document.getElementById("language").value;
  const vocals = document.getElementById("vocals").value;
  const tempo = document.getElementById("tempo").value;
  const style = document.getElementById("style").value;

  statusBox.textContent = "✨ Creating your song idea...";

  setTimeout(function () {
    lyricsBox.value =
`[Verse 1]
${prompt}

[Pre-Chorus]
Feel the moment, let the music flow,
Every heartbeat has a story to show.

[Chorus]
This is our song, this is our time,
Turning every feeling into a rhyme.

[Verse 2]
${style || "Beautiful melodies and emotional sounds."}

[Chorus]
This is our song, this is our time,
Turning every feeling into a rhyme.`;

    songResult.innerHTML = `
      <strong>🎵 Song Ready</strong>
      <p>Genre: ${genre}</p>
      <p>Mood: ${mood}</p>
      <p>Language: ${language}</p>
      <p>Vocals: ${vocals}</p>
      <p>Tempo: ${tempo} BPM</p>
    `;

    statusBox.textContent =
      "✅ Song concept and lyrics created!";
  }, 1200);
});


document.getElementById("saveLyrics").addEventListener("click", function () {
  localStorage.setItem("musicCreatorLyrics", lyricsBox.value);
  statusBox.textContent = "💾 Lyrics saved on this device.";
});


document.getElementById("downloadLyrics").addEventListener("click", function () {
  const text = lyricsBox.value;

  if (!text.trim()) {
    statusBox.textContent = "⚠️ There are no lyrics to download.";
    return;
  }

  const file = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(file);

  const link = document.createElement("a");
  link.href = url;
  link.download = "my-song-lyrics.txt";
  link.click();

  URL.revokeObjectURL(url);
});
