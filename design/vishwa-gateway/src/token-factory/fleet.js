// Landing animation adapted from vishwanetwork/TOKEN-FACTORY PR #1.
// Source commit: 4bcfc6ac34c784ce6c32f4791d44c6f4965a5312.
import { gateRotors } from "./rotors.js";
// Projected opening in the armored gate, shared by arrivals, the exit wave and scroll collapse.
const aperture = { x: 0.50557, y: 0.49058 };

// Sprites are rendered looking along their hull axis. Correct for the angle
// already baked into each image when banking onto the curve.
const hulls = [
  { file: "fleet-lance", width: 10.8, axis: -11 },
  { file: "fleet-outrigger", width: 8.2, axis: -11 },
  { file: "fleet-hauler", width: 11.0, axis: -11 },
  { file: "fleet-surveyor", width: 9.4, axis: -11 },
  { file: "transit-courier", width: 10.2, axis: -25 },
  { file: "fleet-tug", width: 8.8, axis: -11 },
];
// Independent arrival spacing, journey time and hull order, not a formation.
const gaps = [2000, 1870, 2090, 1850, 2140, 1930, 1820, 2160, 1880];
const journeys = [6900, 7790, 8560, 7500, 8710, 8320, 9240, 7920, 8440, 8930, 8110, 8620];
// Upper/lower corridor, entry and intermediate heights, approach tangents.
const routes = [
  [1, 0.77, 0.22, -0.07, 0.28, 0.84],
  [0, 0.48, 0.82, -0.07, 0.14, 0.53],
  [1, 0.13, 0.87, 0.18, 0.08, 0.36],
  [0, 0.12, 0.25, 0.08, 0.36, 1.1],
  [1, 0.91, 0.58, -0.15, 0.39, 0.6],
  [0, 0.87, 0.12, -0.18, 0.14, 0.24],
  [1, 0.38, 0.78, -0.1, 0.18, 1.05],
  [0, 0.26, 0.65, 0.12, 0.28, 0.81],
  [1, 0.06, 0.28, 0.07, 0.35, 0.44],
  [0, 0.75, 0.79, -0.08, 0.12, 1.05],
  [1, 0.68, 0.1, 0.03, 0.46, 0.91],
  [0, 0.19, 0.91, 0.02, 0.2, 0.42],
];
// Six extra passes across the two lines of the headline, interspersed
// with the twelve high and low routes. Coordinates interpolate between
// the measured text baselines, so the path tracks responsive typography.
const titleRoutes = [
  [0, 0.03, 0.07],
  [0.94, 1, -0.05],
  [0.82, 0.12, -0.16],
  [0.12, 0.88, 0.14],
  [1, 0.84, -0.04],
  [0.04, 0.18, 0.03],
];
const order = [12, 0, 1, 13, 2, 3, 14, 4, 5, 15, 6, 7, 16, 8, 9, 17, 10, 11];
const chargeLead = 720,
  pulseLength = 1600;
const rotorLead = 900,
  rotorCoast = 800;
const innerStroke = (135 * Math.PI) / 180,
  outerStroke = (-75 * Math.PI) / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Radiance rises through approach, holds briefly at contact and then decays.
function fieldEnergy(age) {
  if (age < 0) {
    const t = clamp(1 + age / chargeLead, 0, 1);
    return t * t * (3 - 2 * t) * (0.68 + 0.32 * t * t);
  }
  const release = clamp((age - 84) / (pulseLength - chargeLead - 84), 0, 1);
  return Math.exp(-3.4 * release) * (1 - release * release);
}

// Piecewise cubic Hermite curves with matched tangents. X always advances;
// the first segment clears the text, the second banks toward the aperture.
function sample(x, a, b) {
  const span = b.x - a.x,
    t = clamp((x - a.x) / span, 0, 1),
    t2 = t * t,
    t3 = t2 * t;
  const y =
    (2 * t3 - 3 * t2 + 1) * a.y +
    (t3 - 2 * t2 + t) * span * a.m +
    (-2 * t3 + 3 * t2) * b.y +
    (t3 - t2) * span * b.m;
  const m =
    ((6 * t2 - 6 * t) * (a.y - b.y)) / span + (3 * t2 - 4 * t + 1) * a.m + (3 * t2 - 2 * t) * b.m;
  return [y, (Math.atan(m) * 180) / Math.PI];
}
function bezier([a, b, c, d], t) {
  const q = 1 - t,
    point = (k) =>
      q * q * q * a[k] + 3 * q * q * t * b[k] + 3 * q * t * t * c[k] + t * t * t * d[k];
  const tangent = (k) => q * q * (b[k] - a[k]) + 2 * q * t * (c[k] - b[k]) + t * t * (d[k] - c[k]);
  return [point(0), point(1), (Math.atan2(tangent(1), tangent(0)) * 180) / Math.PI];
}
function attach(gate) {
  const hero = gate.closest(".space-hero"),
    scene = gate.parentElement;
  const ring = gate.querySelector(".gate-surface"),
    copy = hero.querySelector(".space-copy");
  const ships = Array.from(gate.querySelectorAll(".fleet-ship"));
  const images = ships.map((ship) => ship.firstElementChild);
  const rotors = gateRotors.attach(gate);
  const statorLight = gate.querySelector(".gate-stator-emission");
  const fieldGlare = gate.querySelector(".gate-field-glare");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const headline = copy.querySelector("h1");
  const textLines = [headline.firstChild, headline.querySelector("span")].map((node) => {
    const r = document.createRange();
    r.selectNodeContents(node);
    return r;
  });
  let epoch = 0,
    sequence = 0,
    nextArrival = 0,
    events = [],
    frame = 0,
    inView = false,
    running = false,
    layout;
  let currentPulse = null;
  let rotorBase = 0,
    rotorPosition = 0,
    energy = 0;
  hero.style.setProperty("--impact-delay", chargeLead + "ms");

  function measure() {
    const viewport = hero.getBoundingClientRect();
    if (!viewport.width || !viewport.height) return;
    const h = {
      left: 0,
      top: 0,
      width: hero.offsetWidth,
      right: hero.offsetWidth,
      bottom: hero.offsetHeight,
    };
    // Restore local CSS pixels after the scroll lens and camera recoil.
    const unitsX = h.width / viewport.width,
      unitsY = h.bottom / viewport.height;
    function localBounds(element) {
      const rect = element.getBoundingClientRect();
      return {
        left: (rect.left - viewport.left) * unitsX,
        right: (rect.right - viewport.left) * unitsX,
        top: (rect.top - viewport.top) * unitsY,
        bottom: (rect.bottom - viewport.top) * unitsY,
        width: rect.width * unitsX,
        height: rect.height * unitsY,
      };
    }
    const g = localBounds(gate),
      s = localBounds(scene),
      c = localBounds(copy);
    const gx = g.left + aperture.x * g.width,
      gy = g.top + aperture.y * g.height;
    const stacked = matchMedia("(max-width:760px)").matches;
    const top = stacked ? s.top : h.top,
      bottom = stacked ? s.bottom : h.bottom;
    const topLo = top + 16,
      topHi = stacked ? lerp(top, gy, 0.76) : Math.max(topLo + 10, Math.min(gy - 24, c.top - 23));
    const botHi = bottom - 19,
      botLo = stacked
        ? lerp(gy, bottom, 0.29)
        : Math.min(botHi - 10, Math.max(c.bottom + 23, lerp(gy, bottom, 0.34)));
    const mid = stacked
      ? lerp(h.left, gx, 0.43)
      : clamp(c.right + 40, lerp(h.left, gx, 0.43), lerp(h.left, gx, 0.7));
    const centers = textLines.map((range) => {
      const r = localBounds(range);
      return r.top + r.height * 0.55;
    });
    layout = {
      size: g.width,
      gx,
      gy,
      left: h.left,
      width: h.width,
      mid,
      topLo,
      topHi,
      botLo,
      botHi,
      centers,
      stacked,
    };
    gate.style.setProperty("--exit-x", Math.ceil(h.right - gx + g.width * 0.28) + "px");
    if (events.length) events.forEach(makePath);
  }
  function makePath(e) {
    const l = layout,
      x0 = l.left - l.gx - l.size * 0.065 - 3,
      xm = l.mid - l.gx;
    if (e.route >= routes.length) {
      const [start, bend, grade] = titleRoutes[e.route - routes.length];
      const line = (f) => lerp(l.centers[0], l.centers[1], f) - l.gy;
      const y0 = line(start),
        ym = line(bend);
      if (l.stacked) {
        // In the stacked layout, cross the letters sideways first,
        // then arc down from the right into the lower, centered gate.
        const bendX = l.left + l.width * (0.75 + 0.05 * (e.route % 3)) - l.gx;
        const j = [bendX, ym * 0.92],
          pre = [bendX - l.width * 0.14, ym];
        const post = [j[0] + (j[0] - pre[0]) * 0.8, j[1] + (j[1] - pre[1]) * 0.8];
        e.arc = [
          [[x0, y0], [lerp(x0, bendX, 0.34), y0 + grade * 13], pre, j],
          [j, post, [l.width * 0.18, ym * 0.19], [0, 0]],
        ];
      } else {
        e.arc = null;
        e.path = [
          { x: x0, y: y0, m: grade },
          { x: xm, y: ym, m: grade * 0.5 },
          { x: 0, y: 0, m: clamp(-ym / -xm, -1, 1) * 0.8 },
        ];
      }
      return;
    }
    const [lower, start, bend, m0, mm, m1] = routes[e.route];
    const lo = lower ? l.botLo : l.topLo,
      hi = lower ? l.botHi : l.topHi,
      sign = lower ? -1 : 1;
    const y0 = lerp(lo, hi, start) - l.gy,
      ym = lerp(lo, hi, bend) - l.gy;
    const slope = clamp(-ym / -xm, -1.6, 1.6);
    e.path = [
      { x: x0, y: y0, m: m0 },
      { x: xm, y: ym, m: sign * mm },
      { x: 0, y: 0, m: slope * m1 },
    ];
  }
  function plan(t) {
    while (nextArrival <= t + 9400) {
      const i = sequence++,
        at = nextArrival,
        kind = i % hulls.length;
      const route = order[(i + Math.floor(i / order.length)) % order.length];
      const duration = Math.min(journeys[i % journeys.length], at - 450);
      const e = { kind, route, at, start: at - duration, duration, done: false };
      makePath(e);
      events.push(e);
      nextArrival += gaps[i % gaps.length];
    }
  }
  function renderShip(e, t) {
    const el = ships[e.kind],
      hull = hulls[e.kind],
      p = clamp((t - e.start) / e.duration, 0, 1);
    const eased = p + 0.07 * Math.sin(Math.PI * p);
    let x, y, heading;
    if (e.arc) {
      [x, y, heading] =
        eased < 0.58 ? bezier(e.arc[0], eased / 0.58) : bezier(e.arc[1], (eased - 0.58) / 0.42);
    } else {
      const [a, b, c] = e.path;
      x = lerp(a.x, 0, eased);
      [y, heading] = x < b.x ? sample(x, a, b) : sample(x, b, c);
    }
    const fade = clamp((t - e.at) / 50, 0, 1),
      scale = (0.38 + 0.62 * (1 - eased)) * (1 - 0.5 * fade);
    const light = clamp(1 - (e.at - t) / 220, 0, 1);
    el.style.opacity = (1 - fade).toFixed(3);
    el.style.transform =
      "translate3d(" +
      x.toFixed(2) +
      "px," +
      y.toFixed(2) +
      "px,0) translate(-50%,-50%) rotate(" +
      (heading - hull.axis).toFixed(2) +
      "deg) scale(" +
      scale.toFixed(4) +
      ")";
    if (light > 0)
      el.style.filter =
        "brightness(" + (1 + 2.8 * light).toFixed(2) + ") drop-shadow(0 0 2px #bde6ff)";
    else if (el.style.filter) el.style.removeProperty("filter");
  }
  function tick(now) {
    if (!running) return;
    const t = now - epoch;
    plan(t);
    let pulse = null;
    // Retired arrivals have each contributed one stroke. Sum active strokes
    // by timestamp so dropped frames and overlapping arrivals stay in phase.
    let strokes = rotorBase + (sequence - events.length);
    for (const e of events) {
      if (t >= e.start && !e.done) {
        if (t < e.at + 50) renderShip(e, t);
        else {
          ships[e.kind].style.opacity = "0";
          e.done = true;
        }
      }
      if (t >= e.at - chargeLead && t < e.at - chargeLead + pulseLength) pulse = e;
      const progress = clamp((t - e.at + rotorLead) / (rotorLead + rotorCoast), 0, 1);
      strokes += progress * progress * (3 - 2 * progress);
    }
    const nextEnergy = pulse ? fieldEnergy(t - pulse.at) : 0;
    if (strokes !== rotorPosition || nextEnergy !== energy) {
      rotorPosition = strokes;
      rotors?.draw(strokes * innerStroke, strokes * outerStroke, nextEnergy);
    }
    if (nextEnergy !== energy) {
      energy = nextEnergy;
      statorLight.style.opacity = energy.toFixed(3);
      fieldGlare.style.opacity = (energy * energy).toFixed(3);
    }
    if (pulse !== currentPulse) {
      currentPulse = pulse;
      if (pulse) gate.dataset.pulse = "charging";
      else delete gate.dataset.pulse;
    }
    while (events.length && events[0].done && t - events[0].at > pulseLength) events.shift();
    frame = requestAnimationFrame(tick);
  }
  function reset() {
    cancelAnimationFrame(frame);
    currentPulse = null;
    delete gate.dataset.pulse;
    if (energy) {
      energy = 0;
      statorLight.style.opacity = "0";
      fieldGlare.style.opacity = "0";
      rotors?.draw(rotorPosition * innerStroke, rotorPosition * outerStroke, 0);
    }
    rotorBase = rotorPosition;
    events = [];
    sequence = 0;
    nextArrival = 7350;
    ships.forEach((s) => {
      s.style.opacity = "0";
      s.style.removeProperty("filter");
    });
  }
  function sync() {
    const active =
      inView &&
      hero.dataset.folded !== "true" &&
      !document.hidden &&
      !reduced.matches &&
      ring.naturalWidth > 0 &&
      images.every((img) => img.complete && img.naturalWidth > 0);
    if (active === running) return;
    running = active;
    gate.dataset.active = String(active);
    reset();
    if (running) {
      measure();
      epoch = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  const resize = new ResizeObserver(measure);
  [gate, hero, copy].forEach((e) => resize.observe(e));
  const io = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  });
  io.observe(hero);
  [ring, ...images].forEach((i) => i.addEventListener("load", sync));
  hero.addEventListener("vishwa:fold", sync);
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  return () => {
    running = false;
    reset();
    io.disconnect();
    resize.disconnect();
    rotors?.destroy();
    [ring, ...images].forEach((i) => i.removeEventListener("load", sync));
    hero.removeEventListener("vishwa:fold", sync);
    document.removeEventListener("visibilitychange", sync);
    reduced.removeEventListener("change", sync);
  };
}
export const traffic = { hulls, attach, aperture };
