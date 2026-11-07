# CineShelf showcase

The public tour and playable browser demo of [CineShelf](https://github.com/akash-verma-au16/CineShelf), a local media library for TV, movies and anime with a streaming-service feel.

- **Site:** https://akash-verma-au16.github.io/cineshelf-showcase/
- **Demo:** https://akash-verma-au16.github.io/cineshelf-showcase/app/

Everything in the demo is fictional: 12 series, 16 films and 8 anime with invented titles, and original artwork generated in code. The demo is a browser build of CineShelf's real React UI. A stand-in for its Electron bridge serves the fictional library and simulates a VLC session, so nothing leaves the browser. Changes you make last until you close the tab.

## What's here

| Path | What it is |
|---|---|
| `site/` | The published site, served from the `gh-pages` branch |
| `site/app/` | The demo build, from `npm run build:demo` on CineShelf's `demo-build` branch |
| `video/` | Voiceover clips, narration script, final MP4 and captions |
| `video/work/` | Tools that made the video (see below) |

## How the video is made

1. **Voice:** `video/narration.txt`, one line per scene, voiced locally with Kokoro TTS. Each clip's length sets its scene's length.
2. **Frames:** `video/work/serve.mjs` serves the site. A Playwright script drives the demo frame by frame at 30 fps, 1920×1080, adding captions and a cursor. The intro and outro come from `video/work/title.html`, a poster wall built from the demo's artwork.
3. **Music:** `video/work/music.mjs` synthesizes a 96 BPM bed with a cut on every scene change.
4. **Mix:** ffmpeg ducks the music under the voice, normalizes to −14 LUFS and encodes H.264. Captions come from Whisper run on the final video.

Every step runs locally with free tools.
