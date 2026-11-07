// CineShelf showcase: renders every frame of the video (fictional demo build only).
// Scenes are sized in beats (96 BPM) to fit each voice clip; RUN picks which scenes this call renders.
async (page) => {
  const RUN = [6];
  const HOST = "http://127.0.0.1:18830";
  const APP = HOST + "/cineshelf-showcase/app/";
  const OUT = "video/work/frames/"; // relative to the repo root
  const BEAT = 0.625, FPS = 30;
  // [kind/route, beats, chapter, caption, scroll keys [sec, y], actions]
  // actions: {at, click: text|css, css?} or {at, move: [x, y]} (real mouse move, cursor drawn)
  const SCENES = [
    ["title:intro", 8],
    ["#/", 11, "TV shows", "Your folders, turned into a library that feels like a streaming service.", [[0, 0], [2.6, 0], [5.6, 640]]],
    ["#/series/hollow-meridian", 11, "Every series", "Artwork, seasons and cast, and it remembers exactly where you stopped.", [[0, 0], [2.8, 0], [5.8, 560]]],
    ["#/movies", 8, "Movies", "Movies get their own home, with shelves you arrange yourself.", [[0, 0], [1.6, 0], [4.4, 620]]],
    ["#/anime/blade-of-the-ninth-lantern", 11, "Anime", "Canon or filler, marked on every episode. Go straight to the story.", [[0, 0], [3.8, 0], [6.2, 380]], [{ at: 2.4, click: "Canon" }]],
    ["#/browse", 6, "Browse", "Everything, all at once.", [[0, 0], [1.0, 0], [3.4, 420]]],
    ["#/player-overlay", 17, "The player", "A real VLC player under CineShelf's own controls. Tracks, subtitles, next episode.", [[0, 0]], [{ at: 1.2, move: [720, 760] }, { at: 6.0, move: [1420, 420] }]],
    ["#/settings", 11, "Offline", "Runs entirely on your own files. No account. No subscription.", [[0, 0], [3.0, 0], [6.0, 300]]],
    ["title:outro", 8],
  ];
  let b = 0;
  const starts = SCENES.map((s) => { const v = b; b += s[1]; return v; });
  const frameAt = (beat) => Math.round(beat * BEAT * FPS);
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const clamp = (x) => Math.min(1, Math.max(0, x));

  const ctx = await page.context().browser().newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 4 / 3 });
  const p = await ctx.newPage();
  const done = [];
  for (const i of RUN) {
    const [route, beats, chapter, line, keys = [[0, 0]], actions = []] = SCENES[i];
    const len = beats * BEAT, f0 = frameAt(starts[i]), f1 = frameAt(starts[i] + beats);
    const shot = (f) => p.screenshot({ path: OUT + "f" + String(f).padStart(4, "0") + ".jpg", type: "jpeg", quality: 92 });

    if (route.startsWith("title:")) {
      await p.goto(`${HOST}/work/title.html?mode=${route.slice(6)}&len=${len}`);
      await p.waitForLoadState("networkidle");
      await p.waitForTimeout(600);
      for (let f = f0; f < f1; f++) { await p.evaluate((t) => window.render(t), (f - f0) / FPS); await shot(f); }
      done.push(`${i}:${route} ${f0}-${f1 - 1}`);
      continue;
    }

    await p.goto("about:blank");
    await p.goto(APP + route);
    await p.waitForTimeout(3000);
    await p.mouse.move(700, 300);
    await p.evaluate(({ chapter, line }) => {
      const css = document.createElement("style");
      css.textContent = `html{scrollbar-width:none}::-webkit-scrollbar{display:none}
        #bx-cap{position:fixed;left:50%;bottom:30px;transform:translateX(-50%);z-index:99999;max-width:1300px;white-space:nowrap;padding:14px 26px;border-radius:14px;background:rgba(12,12,14,.86);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.08);color:#f4f4f6;font:600 25px/1.3 "Segoe UI",system-ui,sans-serif;letter-spacing:-.01em;box-shadow:0 18px 44px rgba(0,0,0,.5);text-align:center}
        #bx-cap small{display:block;font:700 13px/1.4 "Segoe UI",system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#ff5a63;margin-bottom:3px}
        #bx-fade{position:fixed;inset:0;z-index:100000;background:#000;pointer-events:none}
        #bx-cur{position:fixed;left:0;top:0;width:30px;height:30px;z-index:99998;pointer-events:none;filter:drop-shadow(0 3px 4px rgba(0,0,0,.5));display:none}
        #bx-rip{position:fixed;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:50%;border:3px solid #ff5a63;z-index:99997;pointer-events:none;display:none}`;
      document.head.appendChild(css);
      const cap = document.createElement("div"); cap.id = "bx-cap"; cap.innerHTML = `<small>${chapter}</small>${line}`;
      const fade = document.createElement("div"); fade.id = "bx-fade";
      const cur = document.createElementNS("http://www.w3.org/2000/svg", "svg"); cur.id = "bx-cur"; cur.setAttribute("viewBox", "0 0 24 24");
      cur.innerHTML = '<path d="M4 2l15 11-6.5 1.2 3.8 7.3-2.6 1.3-3.8-7.3L5 20z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/>';
      const rip = document.createElement("div"); rip.id = "bx-rip";
      document.body.append(cap, fade, cur, rip);
    }, { chapter, line });
    if (route === "#/player-overlay") await p.evaluate(() => { const c = document.getElementById("bx-cap"); c.style.bottom = "auto"; c.style.top = "70px"; c.style.left = "550px"; });

    // Scroll target: the app's main scroller if the window itself doesn't scroll.
    const scrollTo = (y) => p.evaluate((y) => {
      const el = document.scrollingElement.scrollHeight > innerHeight + 5 ? document.scrollingElement
        : [...document.querySelectorAll("main, div")].find((e) => e.scrollHeight > e.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(e).overflowY));
      if (el) el.scrollTop = y;
    }, y);
    const scrollAt = (t) => {
      if (t <= keys[0][0]) return keys[0][1];
      for (let k = 1; k < keys.length; k++) if (t <= keys[k][0]) return keys[k - 1][1] + (keys[k][1] - keys[k - 1][1]) * ease((t - keys[k - 1][0]) / (keys[k][0] - keys[k - 1][0]));
      return keys[keys.length - 1][1];
    };

    // Resolve click targets to points; moves are given as points.
    const acts = [];
    for (const a of actions) {
      if (a.move) { acts.push({ ...a, x: a.move[0], y: a.move[1] }); continue; }
      const loc = a.css ? p.locator(a.click).first() : p.getByText(a.click, { exact: true }).first();
      const box = await loc.boundingBox();
      if (box) acts.push({ ...a, loc, x: box.x + box.width / 2, y: box.y + box.height / 2 });
    }
    let from = { x: 1300, y: 760 };
    const path = acts.map((a) => { const seg = { from, a }; from = { x: a.x, y: a.y }; return seg; });
    const fired = new Set();
    for (let f = f0; f < f1; f++) {
      const t = (f - f0) / FPS;
      for (const [n, a] of acts.entries()) {
        if (!fired.has(n) && t >= a.at) {
          fired.add(n);
          if (a.loc) { await a.loc.click(); await p.waitForTimeout(500); }
          else { await p.mouse.move(a.x, a.y, { steps: 6 }); await p.waitForTimeout(400); }
        }
      }
      // The app's hover timers run in real time while each frame takes far longer to shoot,
      // so keep nudging the real mouse at the last move target to hold hover state open.
      const held = [...acts.entries()].filter(([n, a]) => a.move && fired.has(n)).pop();
      if (held) await p.mouse.move(held[1].x + (f % 2), held[1].y);
      // Cursor: glides toward each action over the second before it, then rests there.
      let cur = null, rip = null;
      for (const { from, a } of path) {
        if (t >= a.at - 1.2) {
          const k = ease(clamp((t - (a.at - 1.0)) / 0.9));
          cur = { x: from.x + (a.x - from.x) * k, y: from.y + (a.y - from.y) * k };
          if (a.loc && t - a.at >= 0 && t - a.at < 0.5) rip = { x: a.x, y: a.y, k: (t - a.at) / 0.5 };
        }
      }
      const curO = acts.length ? clamp((t - (acts[0].at - 1.3)) / 0.3) * clamp((len - 0.3 - t) / 0.5) : 0;
      await scrollTo(scrollAt(t));
      const fade = clamp(t / 0.3) * clamp((len - t) / 0.25);
      const capK = clamp((t - 0.35) / 0.45);
      await p.evaluate(({ fade, capK, cur, curO, rip }) => {
        document.getElementById("bx-fade").style.opacity = String(1 - fade);
        const cap = document.getElementById("bx-cap");
        cap.style.opacity = String(capK * fade);
        cap.style.transform = `translateX(-50%) translateY(${(1 - capK) * 14}px)`;
        const c = document.getElementById("bx-cur");
        if (cur && curO > 0) { c.style.display = "block"; c.style.opacity = String(curO); c.style.transform = `translate(${cur.x - 6}px, ${cur.y - 3}px)`; } else c.style.display = "none";
        const r = document.getElementById("bx-rip");
        if (rip) { r.style.display = "block"; r.style.left = rip.x + "px"; r.style.top = rip.y + "px"; r.style.opacity = String(1 - rip.k); r.style.transform = `scale(${0.3 + 1.1 * rip.k})`; } else r.style.display = "none";
      }, { fade, capK, cur, curO, rip });
      await shot(f);
    }
    done.push(`${i}:${route} ${f0}-${f1 - 1}`);
  }
  await ctx.close();
  return { done, totalBeats: b, starts };
}
