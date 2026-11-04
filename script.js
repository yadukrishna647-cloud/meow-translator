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

recordButton.addEventListener("click", async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    result.textContent = "Microphone access isn’t available here. Try opening the app on localhost in a modern browser.";
    return;
  }

  recordButton.disabled = true;
  recordButton.classList.add("is-listening");
  buttonLabel.textContent = "Listening…";
  result.textContent = "Listening for a meow…";

  let stream;
  try {
    // The audio is never read or stored; opening the stream is only for the listening demo.
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    await new Promise((resolve) => window.setTimeout(resolve, 1500));
    result.textContent = sillyTranslations[Math.floor(Math.random() * sillyTranslations.length)];
  } catch (error) {
    result.textContent = friendlyMicrophoneError(error);
  } finally {
    // Always release the microphone, including if permission or recording fails.
    stream?.getTracks().forEach((track) => track.stop());
    recordButton.disabled = false;
    recordButton.classList.remove("is-listening");
    buttonLabel.textContent = "Record a meow";
  }
});
