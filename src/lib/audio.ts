import { createHash } from "crypto";

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1/text-to-speech";

/**
 * Cache key for a synthesised page. Same text + voice + model → same hash,
 * so identical pages (e.g. a remixed prologue) reuse a single MP3.
 */
export function audioHash(
  text: string,
  voiceId: string,
  modelId: string,
): string {
  const normalised = text.trim().replace(/\s+/g, " ").toLowerCase();
  return createHash("sha256")
    .update(`${voiceId}|${modelId}|${normalised}`)
    .digest("hex");
}

// Guard against hung upstream requests exhausting the serverless function's
// execution budget.
const SYNTHESIZE_TIMEOUT_MS = 30_000;

export async function synthesize(
  text: string,
  voiceId: string,
  modelId: string,
  apiKey: string,
): Promise<Buffer> {
  const url = `${ELEVENLABS_BASE}/${voiceId}?output_format=mp3_44100_128`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SYNTHESIZE_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `ElevenLabs request timed out after ${SYNTHESIZE_TIMEOUT_MS}ms`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(`ElevenLabs ${res.status}: ${body}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
