import { ProviderError, providerFetch, requireEnabled, secret } from "./config";
import type { UsageControls } from "./inference";

export async function transcribeAudio(audio: Blob, language: "en" | "hi", controls?: UsageControls) {
  requireEnabled("Sarvam", "SPEECH_ENABLED");
  if (!audio.size || audio.size > 8 * 1024 * 1024) throw new ProviderError("Sarvam", "Recording must be between 1 byte and 8 MB.", "INVALID_AUDIO");
  if (!controls) throw new ProviderError("Sarvam", "A durable speech budget reservation is required.", "BUDGET_REQUIRED");
  await controls.reserve("Sarvam", "transcription");
  const body = new FormData();
  body.set("file", audio, "recording.webm"); body.set("model", process.env.SARVAM_STT_MODEL?.trim() || "saaras:v4"); body.set("mode", "transcribe"); body.set("language_code", language === "hi" ? "hi-IN" : "en-IN");
  const response = await providerFetch("Sarvam", "https://api.sarvam.ai/speech-to-text", { method: "POST", headers: { "api-subscription-key": secret("Sarvam", "SARVAM_API_KEY") }, body });
  const data = await response.json();
  if (typeof data.transcript !== "string") throw new ProviderError("Sarvam", "No transcript was returned.", "INVALID_RESPONSE");
  return { transcript: data.transcript, requestId: data.request_id, language: data.language_code };
}

export async function synthesizeSpeech(text: string, language: "en" | "hi", controls?: UsageControls) {
  requireEnabled("Sarvam", "SPEECH_ENABLED");
  if (!text.trim() || text.length > 2500) throw new ProviderError("Sarvam", "Speech text must contain 1 to 2500 characters.", "INVALID_TEXT");
  if (!controls) throw new ProviderError("Sarvam", "A durable speech budget reservation is required.", "BUDGET_REQUIRED");
  await controls.reserve("Sarvam", "synthesis");
  const response = await providerFetch("Sarvam", "https://api.sarvam.ai/text-to-speech", { method: "POST", headers: { "Content-Type": "application/json", "api-subscription-key": secret("Sarvam", "SARVAM_API_KEY") }, body: JSON.stringify({ text, language_code: language === "hi" ? "hi-IN" : "en-IN", model: process.env.SARVAM_TTS_MODEL?.trim() || "bulbul:v4-flash", speaker: process.env.SARVAM_TTS_VOICE?.trim() || (language === "hi" ? "aparna_hi_customer" : "simran_en_customer"), speech_sample_rate: 22050 }) });
  const data = await response.json();
  if (!Array.isArray(data.audios) || typeof data.audios[0] !== "string") throw new ProviderError("Sarvam", "No audio was returned.", "INVALID_RESPONSE");
  return { audio: data.audios[0], mimeType: "audio/wav", requestId: data.request_id };
}
