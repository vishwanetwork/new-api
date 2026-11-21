// Landing animation adapted from vishwanetwork/TOKEN-FACTORY PR #1.
// Source commit: 4bcfc6ac34c784ce6c32f4791d44c6f4965a5312.
import { traffic } from "./fleet.js";
const clamp = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
export function attachCollapse(track) {
  const stage = track.querySelector(".universe-stage"),
    lens = track.querySelector(".universe-lens");
  const hero = lens.firstElementChild,
    point = stage.querySelector(".universe-kernel");
  const gate = hero.querySelector(".gate-anchor"),
    scene = gate.parentElement;
  const providers = track.nextElementSibling;
  const spacer = track.querySelector(".universe-travel"),
    header = track.closest(".lp-landing").querySelector(".space-header");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0,
    height = 0,
    focusX = 0,
    focusY = 0,
    pin = 0,
    travel = 1,
    frame = 0,
    last = -1,
    folded = false;
  function draw() {
    frame = 0;
    const progress = reduce.matches ? 0 : clamp((pin - track.getBoundingClientRect().top) / travel);
    if (last === progress) return;
    last = progress;
    // Inset the long axis while scaling both axes equally: text, ships and
    // gate retain their proportions as the viewport becomes a round world.
    const radius = Math.min(width, height) / 2;
    if (!radius) return;
    const round = smooth(progress / 0.65),
      shrink = smooth(progress / 0.91);
    const scale = 1 - shrink * (1 - 3 / radius);
    const rise = -Math.min(62, height * 0.09) * round;
    const padX = (width / 2 - radius) * round,
      padY = (height / 2 - radius) * round;
    const alpha = 1 - smooth((progress - 0.914) / 0.086);
    const center = smooth(progress / 0.57);
    lens.style.setProperty("--fold-x", (focusX * center).toFixed(2) + "px");
    lens.style.setProperty("--fold-y", (focusY * center).toFixed(2) + "px");
    lens.style.setProperty("--copy-opacity", String(1 - smooth((progress - 0.015) / 0.21)));
    if (providers)
      providers.style.setProperty(
        "--marks-opacity",
        String(reduce.matches ? 1 : smooth((progress - 0.26) / 0.46)),
      );
    track.toggleAttribute("data-moving", progress > 0 && progress < 1);
    track.toggleAttribute("data-closed", progress >= 1);
    lens.style.clipPath =
      progress > 0
        ? `inset(${padY.toFixed(3)}px ${padX.toFixed(3)}px round ${(radius * round).toFixed(3)}px)`
        : "none";
    lens.style.transform =
      progress > 0 ? `translateY(${rise.toFixed(3)}px) scale(${scale.toFixed(6)})` : "none";
    lens.style.opacity = String(alpha);
    point.style.transform = `translate(-50%,calc(-50% + ${rise.toFixed(3)}px)) scale(${(1 - 0.6 * (1 - alpha)).toFixed(3)})`;
    point.style.opacity = String(smooth((progress - 0.85) / 0.06) * alpha);
    lens.inert = progress > 0.19;
    const stop = progress >= 0.96;
    if (stop !== folded) {
      folded = stop;
      hero.dataset.folded = String(stop);
      hero.dispatchEvent(new Event("vishwa:fold"));
    }
  }
  function request() {
    if (!frame) frame = requestAnimationFrame(draw);
  }
  function resize() {
    const nav = header.offsetHeight;
    track.style.setProperty("--nav-size", nav + "px");
    width = stage.clientWidth;
    height = stage.offsetHeight;
    focusX =
      width / 2 - (scene.offsetLeft + gate.offsetLeft + gate.offsetWidth * traffic.aperture.x);
    focusY =
      height / 2 - (scene.offsetTop + gate.offsetTop + gate.offsetHeight * traffic.aperture.y);
    // On short screens allow the full hero to scroll into view before pinning.
    pin = Math.min(nav, window.innerHeight - height);
    track.style.setProperty("--pin-top", pin + "px");
    travel = Math.max(1, spacer.getBoundingClientRect().height);
    last = -1;
    request();
  }
  const ro = new ResizeObserver(resize);
  [stage, header, spacer].forEach((e) => ro.observe(e));
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pageshow", resize);
  reduce.addEventListener("change", resize);
  resize();
  return () => {
    cancelAnimationFrame(frame);
    ro.disconnect();
    window.removeEventListener("scroll", request);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pageshow", resize);
    reduce.removeEventListener("change", resize);
  };
}
