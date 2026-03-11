# backend/services/voice_service.py

from deepgram import DeepgramClient, PrerecordedOptions
import httpx

deepgram = DeepgramClient("78ff1ed1906fd9f2bc4f276032f4f5efe6962aa9")

async def speech_to_text(audio_bytes: bytes, language: str = "kn") -> str:
    """
    Converts audio recording to text.
    language = "kn" for Kannada, "en" for English
    """
    response = deepgram.listen.prerecorded.v("1").transcribe_file(
        {"buffer": audio_bytes, "mimetype": "audio/wav"},
        PrerecordedOptions(
            model="nova-3",          # Latest, fastest Deepgram model
            language=language,       # "kn" = Kannada
            smart_format=True,       # Auto punctuation
            punctuate=True,
            diarize=False            # No need to identify speakers
        )
    )

    # Extract transcript from response
    transcript = response.results.channels[0].alternatives[0].transcript
    return transcript


async def text_to_speech(text: str) -> bytes:
    """
    Converts text response to audio using ElevenLabs.
    Returns raw audio bytes to stream to browser.
    """
    VOICE_ID = "21m00Tcm4TlvDq8ikWAM"   # ElevenLabs "Rachel" voice

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
            headers={
                "xi-api-key": "sk_17cc3ade0931ccc655321574cf0e204ad9dced65fb3e6b6c",
                "Content-Type": "application/json"
            },
            json={
                "text": text,
                "model_id": "eleven_multilingual_v2",  # Supports Kannada
                "voice_settings": {
                    "stability": 0.5,          # How consistent the voice is
                    "similarity_boost": 0.75    # How close to original voice
                }
            },
            timeout=30.0
        )
        return response.content  # Raw MP3 bytes