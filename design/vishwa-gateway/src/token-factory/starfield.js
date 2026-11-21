// Landing animation adapted from vishwanetwork/TOKEN-FACTORY PR #1.
// Source commit: 4bcfc6ac34c784ce6c32f4791d44c6f4965a5312.
import * as React from "react";

const layerStyle = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  pointerEvents: "none",
};

function randomSequence(initial) {
  let seed = initial;
  return function random() {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

const overscan = 48;
const starPlaneStyle = {
  ...layerStyle,
  inset: -overscan,
  width: "calc(100% + 96px)",
  height: "calc(100% + 96px)",
};

function noise(x, y) {
  const value = (i, j) => {
    let n = Math.imul(i, 1597334677) ^ Math.imul(j, 3812015801);
    n = Math.imul(n ^ (n >>> 16), 2246822519);
    return ((n ^ (n >>> 13)) >>> 0) / 4294967295;
  };
  const i = Math.floor(x);
  const j = Math.floor(y);
  let u = x - i;
  let v = y - j;
  u = u * u * (3 - 2 * u);
  v = v * v * (3 - 2 * v);
  const top = value(i, j) * (1 - u) + value(i + 1, j) * u;
  const bottom = value(i, j + 1) * (1 - u) + value(i + 1, j + 1) * u;
  return top * (1 - v) + bottom * v;
}

// A translucent dust lane absorbs the distant field. Its irregular edge and
// the stars in its vicinity move together as the camera drifts.
function paintDust(ctx, width, height) {
  const dust = document.createElement("canvas");
  dust.width = Math.max(1, Math.min(280, Math.round(width / 3)));
  dust.height = Math.max(1, Math.min(320, Math.round((dust.width * height) / width)));
  const context = dust.getContext("2d");
  if (!context) return;
  const pixels = context.createImageData(dust.width, dust.height);
  for (let y = 0; y < dust.height; y++) {
    for (let x = 0; x < dust.width; x++) {
      const u = x / dust.width;
      const v = y / dust.height;
      const broad = noise(u * 6.3 + 3, v * 4.9 + 1);
      const fine = noise(u * 20 + broad * 1.2, v * 16);
      const grain = noise(u * 66, v * 45);
      const center = 1.18 - 0.96 * u + 0.13 * (broad - 0.5) + 0.05 * Math.sin(u * 11.5);
      const distance = (v - center) / (0.07 + 0.06 * broad);
      const body = Math.exp(-distance * distance);
      const density = (0.12 + 0.66 * broad + 0.19 * fine + 0.03 * grain) * body;
      const i = (y * dust.width + x) * 4;
      pixels.data[i] = 3;
      pixels.data[i + 1] = 8;
      pixels.data[i + 2] = 15;
      pixels.data[i + 3] = Math.round(210 * density);
    }
  }
  context.putImageData(pixels, 0, 0);
  ctx.drawImage(dust, -overscan, -overscan, width + overscan * 2, height + overscan * 2);
}

function paintLensStar(ctx, x, y, size, focus, blue, spikes) {
  const rgb = blue ? "184,213,240" : "231,226,214";
  const radius = size * (focus < 0.7 ? 12 : 10);
  const halo = ctx.createRadialGradient(x, y, 0, x, y, radius);
  halo.addColorStop(0, "rgba(248,251,255," + (0.7 + focus * 0.27) + ")");
  halo.addColorStop(0.055, "rgba(" + rgb + "," + (0.51 + 0.37 * focus) + ")");
  halo.addColorStop(0.16, "rgba(" + rgb + ",.34)");
  halo.addColorStop(0.38, "rgba(" + rgb + ",.10)");
  halo.addColorStop(0.74, "rgba(" + rgb + ",.024)");
  halo.addColorStop(1, "rgba(" + rgb + ",0)");
  ctx.fillStyle = halo;
  ctx.fillRect(x - radius, y - radius, 2 * radius, 2 * radius);
  if (!spikes) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.19);
  for (const length of [size * 7.6, size * 4.7]) {
    const ray = ctx.createLinearGradient(-length, 0, length, 0);
    ray.addColorStop(0, "rgba(" + rgb + ",0)");
    ray.addColorStop(0.5, "rgba(236,247,255,.72)");
    ray.addColorStop(1, "rgba(" + rgb + ",0)");
    ctx.fillStyle = ray;
    ctx.fillRect(-length, -0.33, 2 * length, 0.66);
    ctx.rotate(Math.PI * 0.5);
  }
  ctx.restore();
}

function makeTwinkle(x, y, size, focus, blue, spikes, near, index, ratio) {
  const random = randomSequence((near ? 73091 : 29641) + index * 6673);
  const radius = Math.ceil(size * 12 + 2);
  const stamp = document.createElement("canvas");
  stamp.width = stamp.height = Math.ceil(2 * radius * ratio);
  const ink = stamp.getContext("2d");
  const scale = stamp.width / (2 * radius);
  ink.scale(scale, scale);
  paintLensStar(ink, radius, radius, size, focus, blue, spikes);
  return {
    x,
    y,
    near,
    radius,
    stamp,
    phase: random() * 2 * Math.PI,
    overtone: random() * 2 * Math.PI,
    speed: (2 * Math.PI) / ((near ? 3 : 5) + random() * 3.5),
  };
}

function paintMiddle(ctx, width, height, twinkles, ratio) {
  paintDust(ctx, width, height);
  const next = randomSequence(426897);
  const compact = width < 760;
  const clusters = compact
    ? [
        [0.22, 0.8],
        [0.87, 0.39],
        [0.61, 0.93],
      ]
    : [
        [0.17, 0.12],
        [0.52, 0.89],
        [0.89, 0.25],
        [0.94, 0.73],
        [0.65, 0.53],
      ];
  const count = Math.min(235, Math.ceil((width * height) / 2800));
  for (let i = 0; i < count; i++) {
    const cluster = clusters[i % clusters.length];
    const clustered = i % 4 !== 0;
    const ux = clustered ? cluster[0] + (next() + next() + next() - 1.5) * 0.17 : next();
    const uy = clustered ? cluster[1] + (next() + next() + next() - 1.5) * 0.115 : next();
    const x = ux * width;
    const y = uy * height;
    const bright = Math.pow(next(), 3.5);
    const radius = 0.39 + bright * 0.76;
    const exposure = (0.32 + bright * 0.62) * (ux < 0.4 && uy > 0.2 && uy < 0.72 ? 0.73 : 1);
    if (bright > 0.55 && i % 3 === 0) {
      twinkles.push(makeTwinkle(x, y, radius * 0.64, 0.88, true, false, false, i, ratio));
      continue;
    }
    ctx.fillStyle = "rgba(215,231,245," + exposure + ")";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    if (bright > 0.84) paintLensStar(ctx, x, y, 0.45, 0.83, true, false);
  }
}

// The two brightest sources have small diffraction spikes; the others are
// slightly out of focus. Coordinates keep the brighter features off the copy.
const brightStars = [
  [0.1, 0.14, 1.52, 0.91, true, false],
  [0.4, 0.79, 1.75, 0.96, true, true],
  [0.61, 0.075, 1.17, 0.74, false, false],
  [0.93, 0.29, 2.35, 1, true, true],
  [0.88, 0.86, 1.28, 0.63, false, false],
  [0.3, 0.94, 0.91, 0.55, true, false],
  [0.48, 0.19, 0.72, 0.87, true, false],
  [0.13, 0.73, 0.78, 0.74, false, false],
  [0.66, 0.91, 0.71, 0.91, true, false],
  [0.94, 0.59, 0.82, 0.66, true, false],
];
const compactStars = [
  [0.78, 0.1, 1.3, 0.81, true, false],
  [0.12, 0.54, 1.56, 0.91, true, true],
  [0.89, 0.74, 1.9, 0.99, true, true],
  [0.25, 0.94, 1.1, 0.58, false, false],
];

function paintForeground(ctx, width, height, twinkles, ratio) {
  const stars = width < 760 ? compactStars : brightStars;
  stars.forEach(([u, v, size, focus, blue, spikes], i) => {
    if (i % 4 === 3) paintLensStar(ctx, u * width, v * height, size, focus, blue, spikes);
    else
      twinkles.push(makeTwinkle(u * width, v * height, size, focus, blue, spikes, true, i, ratio));
  });
}

function hull(ctx, fill, points) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.closePath();
  ctx.fill();
}

function drawShip(ctx, x, y, size, rotation, opacity, direction, dirty) {
  dirty.push([x - 26 * size, y - 12 * size, 52 * size, 24 * size]);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(size * direction, size);
  ctx.globalAlpha = opacity;
  // The paired engines and faceted hull read as a vessel without a contrail.
  const exhaust = ctx.createLinearGradient(-24, 0, -7, 0);
  exhaust.addColorStop(0, "rgba(146,188,206,0)");
  exhaust.addColorStop(1, "rgba(172,217,234,.62)");
  hull(ctx, exhaust, [-23, -1.6, -8.5, -2.2, -8.5, -0.85]);
  hull(ctx, exhaust, [-20, 2.1, -7, 1.15, -7, 2.7]);
  hull(ctx, "#586166", [-10, -2.6, 1.6, -1.9, 13, 0.1, -5, 1.8, -11, 0.4]);
  hull(ctx, "#a6adb0", [-7, -2.8, -3.5, -4.4, 0.2, -3.9, 2, -2.05, -4.5, -1.7]);
  hull(ctx, "#bec6c9", [-9.3, -2.3, 2, -1.9, 12.8, 0.1, 3.5, -0.6, -8.5, -1.2]);
  hull(ctx, "#454c51", [-4.8, 0.6, 2.4, 0.5, -4.3, 4.3, -9.4, 4.3, -7.4, 2.7]);
  hull(ctx, "#8a9499", [-8.6, 3.1, -1.2, 0.9, -4.3, 3.6, -9.4, 4.3]);
  ctx.fillStyle = "#d6edf3";
  ctx.fillRect(-9.3, -1.95, 1.5, 0.85);
  ctx.fillRect(-8.4, 1.9, 1.5, 0.8);
  ctx.restore();
}

const flights = [
  { time: 2.4, x: 0.68, y: 0.075, dx: -0.19, dy: 0.29 },
  { time: 12.7, x: 0.98, y: 0.36, dx: -0.15, dy: 0.22 },
  { time: 25.3, x: 0.48, y: 0.76, dx: -0.13, dy: 0.18 },
  { time: 39.1, x: 0.65, y: 0.2, dx: -0.19, dy: 0.27 },
  { time: 53.6, x: 0.37, y: 0.05, dx: -0.12, dy: 0.24 },
];

function drawTravel(ctx, width, height, seconds, dirty) {
  const compact = width < 760;
  const phase = seconds % 62;
  const scale = compact ? 0.88 : Math.min(1.8, width / 940);
  if (phase < 19) {
    const x = width * (compact ? 0.83 : 0.51) + phase * (compact ? 4 : 8);
    const y = height * 0.175 - phase * 1.25;
    drawShip(ctx, x, y, scale, -0.14, 0.74 * Math.min(1, (19 - phase) / 3), 1, dirty);
  }
  if (phase > 28 && phase < 51) {
    const age = phase - 28;
    drawShip(
      ctx,
      width * 0.98 - age * (compact ? 6 : 14),
      height * 0.82 + age * 0.7,
      scale * 0.7,
      -0.045,
      0.58 * Math.min(1, age / 3, (23 - age) / 4),
      -1,
      dirty,
    );
  }

  for (const flight of flights) {
    const progress = (phase - flight.time) / 0.92;
    if (progress <= 0 || progress >= 1) continue;
    const x = (flight.x + flight.dx * progress) * width;
    const y = (flight.y + flight.dy * progress) * height;
    const tail = Math.min(0.32, progress);
    const tx = x - flight.dx * tail * width;
    const ty = y - flight.dy * tail * height;
    dirty.push([
      Math.min(x, tx) - 3,
      Math.min(y, ty) - 3,
      Math.abs(x - tx) + 6,
      Math.abs(y - ty) + 6,
    ]);
    const opacity = Math.sin(progress * Math.PI) * 0.86;
    const line = ctx.createLinearGradient(tx, ty, x, y);
    line.addColorStop(0, "rgba(162,188,205,0)");
    line.addColorStop(0.75, "rgba(193,214,228," + opacity * 0.48 + ")");
    line.addColorStop(1, "rgba(239,246,249," + opacity + ")");
    ctx.lineWidth = 1.15;
    ctx.strokeStyle = line;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.fillStyle = "rgba(246,249,249," + opacity + ")";
    ctx.beginPath();
    ctx.arc(x, y, 1.12, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function TokenFactoryStarfield() {
  const middlePlane = React.useRef(null);
  const foregroundPlane = React.useRef(null);
  const traffic = React.useRef(null);

  React.useEffect(() => {
    const middle = middlePlane.current;
    const foreground = foregroundPlane.current;
    const overlay = traffic.current;
    const frame = overlay.parentElement;
    const hero = frame.parentElement;
    const middleCtx = middle.getContext("2d");
    const foregroundCtx = foreground.getContext("2d");
    const movingCtx = overlay.getContext("2d");
    if (!middleCtx || !foregroundCtx || !movingCtx) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0,
      height = 0,
      pixelRatio = 0,
      elapsed = 0,
      lastTime = 0,
      timer = 0;
    let targetX = 0,
      targetY = 0,
      pointerX = 0,
      pointerY = 0;
    let nearX = 0,
      nearY = 0;
    let onScreen = true;
    const dirty = [];
    const twinkles = [];

    function draw() {
      for (const bounds of dirty) movingCtx.clearRect(...bounds);
      dirty.length = 0;
      // Render only the selected star sprites; their offsets follow their original depth planes.
      for (const star of twinkles) {
        const t = elapsed * star.speed;
        const level =
          0.5 + 0.34 * Math.sin(t + star.phase) + 0.16 * Math.sin(1.73 * t + star.overtone);
        const radius = star.radius * (star.near ? 0.86 + 0.31 * level : 1);
        const x = star.x + nearX * (star.near ? 1 : 0.34) - radius;
        const y = star.y + nearY * (star.near ? 1 : 0.35) - radius;
        movingCtx.globalAlpha = star.near ? 0.36 + 0.64 * level : 0.38 + 0.49 * level;
        movingCtx.drawImage(star.stamp, x, y, 2 * radius, 2 * radius);
        dirty.push([x - 2, y - 2, 2 * radius + 4, 2 * radius + 4]);
      }
      movingCtx.globalAlpha = 1;
      drawTravel(movingCtx, width, height, elapsed, dirty);
    }

    function positionPlanes() {
      const driftX = 0.7 * Math.sin(elapsed * 0.117) + 0.3 * Math.sin(elapsed * 0.061);
      const driftY = 0.68 * Math.sin(elapsed * 0.081) + 0.32 * Math.sin(elapsed * 0.133);
      const x = driftX * (width < 760 ? 20 : 29) + pointerX * 13;
      const y = driftY * 17 + pointerY * 10;
      nearX = x;
      nearY = y;
      middle.style.transform =
        "translate3d(" + (x * 0.34).toFixed(2) + "px," + (y * 0.35).toFixed(2) + "px,0)";
      foreground.style.transform = "translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) + "px,0)";
    }

    function tick() {
      const now = performance.now();
      const delta = Math.min(0.2, (now - lastTime) / 1000);
      elapsed += delta;
      lastTime = now;
      const ease = 1 - Math.exp(-delta * 4.5);
      pointerX += (targetX - pointerX) * ease;
      pointerY += (targetY - pointerY) * ease;
      positionPlanes();
      draw();
      timer = window.setTimeout(tick, 1000 / 24);
    }

    function sync() {
      window.clearTimeout(timer);
      if (!onScreen || document.hidden || hero.dataset.folded === "true") return;
      lastTime = performance.now();
      if (motion.matches) {
        elapsed = pointerX = pointerY = targetX = targetY = 0;
        positionPlanes();
        draw();
        return;
      }
      tick();
    }

    function resize() {
      const nextWidth = frame.clientWidth;
      const nextHeight = frame.clientHeight;
      if (nextWidth < 4 || nextHeight < 4) return;
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        1.6,
        Math.sqrt(2600000 / (nextWidth * nextHeight)),
      );
      if (nextWidth === width && nextHeight === height && pixelRatio === ratio) return;
      width = nextWidth;
      height = nextHeight;
      pixelRatio = ratio;
      for (const canvas of [middle, foreground]) {
        canvas.width = Math.round((width + 2 * overscan) * ratio);
        canvas.height = Math.round((height + 2 * overscan) * ratio);
      }
      overlay.width = Math.round(width * ratio);
      overlay.height = Math.round(height * ratio);
      for (const ctx of [middleCtx, foregroundCtx]) {
        ctx.setTransform(ratio, 0, 0, ratio, overscan * ratio, overscan * ratio);
      }
      movingCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
      twinkles.length = 0;
      paintMiddle(middleCtx, width, height, twinkles, ratio);
      paintForeground(foregroundCtx, width, height, twinkles, ratio);
      draw();
    }

    function aim(event) {
      if (
        motion.matches ||
        !onScreen ||
        hero.dataset.folded === "true" ||
        event.pointerType === "touch"
      )
        return;
      const bounds = frame.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      targetX = 1 - ((event.clientX - bounds.left) * 2) / bounds.width;
      targetY = 1 - ((event.clientY - bounds.top) * 2) / bounds.height;
    }
    function center() {
      targetX = targetY = 0;
    }

    const sizing = new ResizeObserver(resize);
    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    resize();
    sizing.observe(frame);
    visibility.observe(frame);
    document.addEventListener("visibilitychange", sync);
    hero.addEventListener("vishwa:fold", sync);
    motion.addEventListener("change", sync);
    hero.addEventListener("pointermove", aim, { passive: true });
    hero.addEventListener("pointerleave", center);
    sync();
    return () => {
      window.clearTimeout(timer);
      sizing.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", sync);
      hero.removeEventListener("vishwa:fold", sync);
      motion.removeEventListener("change", sync);
      hero.removeEventListener("pointermove", aim);
      hero.removeEventListener("pointerleave", center);
    };
  }, []);

  return React.createElement(
    "div",
    { className: "space-stars", style: layerStyle, "aria-hidden": true },
    React.createElement("canvas", {
      className: "star-clusters",
      ref: middlePlane,
      style: starPlaneStyle,
    }),
    React.createElement("canvas", {
      className: "near-stars",
      ref: foregroundPlane,
      style: starPlaneStyle,
    }),
    React.createElement("canvas", { ref: traffic, style: layerStyle }),
  );
}
