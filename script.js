const recordButton = document.querySelector("#record-button");
const buttonLabel = document.querySelector("#button-label");
const result = document.querySelector("#result");

const sillyTranslations = [
  "Feed me, human!",
  "I require attention immediately.",
  "That sunbeam is mine.",
  "Open the door. No, the other door."
];

function friendlyMicrophoneError(error) {
  if (error.name === "NotAllowedError" || error.name === "SecurityError") {
    return "Microphone access was blocked. Allow it in your browser settings, then try again.";
  }
  if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
    return "We couldn’t find a microphone. Connect one and give it another try.";
  }
  return "We couldn’t use your microphone just now. Check that it’s connected and try again.";
}

function hasCatLikePitch(samples, sampleRate) {
  const mean = samples.reduce((sum, sample) => sum + sample, 0) / samples.length;
  const centered = samples.map((sample) => sample - mean);
  const rms = Math.sqrt(centered.reduce((sum, sample) => sum + sample * sample, 0) / centered.length);
  if (rms < 0.012) return false;

  const minLag = Math.floor(sampleRate / 1100);
  const maxLag = Math.min(Math.floor(sampleRate / 150), centered.length / 2);
  let bestLag = 0;
  let bestCorrelation = 0;

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    for (let index = 0; index < centered.length - lag; index += 1) {
      correlation += centered[index] * centered[index + lag];
    }
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  const normalizedCorrelation = bestCorrelation /
    (centered.length * rms * rms);
  const pitch = sampleRate / bestLag;
  return normalizedCorrelation > 0.55 && pitch >= 150 && pitch <= 1100;
}

recordButton.addEventListener("click", async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    result.textContent = "Microphone access isn’t available here. Try opening the app on localhost in a modern browser.";
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    result.textContent = "Your browser doesn’t support the local sound check. Try a modern browser.";
    return;
  }

  recordButton.disabled = true;
  recordButton.classList.add("is-listening");
  buttonLabel.textContent = "Listening…";
  result.textContent = "Listening for a meow…";

  let stream;
  let audioContext;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new AudioContextClass();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    const samples = new Float32Array(analyser.fftSize);
    let catLikeFrames = 0;
    const listenUntil = Date.now() + 1500;
    while (Date.now() < listenUntil) {
      analyser.getFloatTimeDomainData(samples);
      if (hasCatLikePitch(samples, audioContext.sampleRate)) {
        catLikeFrames += 1;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }

    if (catLikeFrames >= 3) {
      result.textContent = sillyTranslations[Math.floor(Math.random() * sillyTranslations.length)];
    } else {
      result.textContent = "I didn’t hear a cat-like meow. Try again with your cat closer to the microphone.";
    }
  } catch (error) {
    result.textContent = friendlyMicrophoneError(error);
  } finally {
    try {
      stream?.getTracks().forEach((track) => track.stop());
      if (audioContext && audioContext.state !== "closed") {
        try {
          await audioContext.close();
        } catch (error) {
          console.error("Could not close the audio context.", error);
          result.textContent = "The audio check ended, but your browser couldn’t close it cleanly. Please reload this page.";
        }
      }
    } finally {
      recordButton.disabled = false;
      recordButton.classList.remove("is-listening");
      buttonLabel.textContent = "Record a meow";
    }
  }
});
