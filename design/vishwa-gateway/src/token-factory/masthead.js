// Landing animation adapted from vishwanetwork/TOKEN-FACTORY PR #1.
// Source commit: 4bcfc6ac34c784ce6c32f4791d44c6f4965a5312.
import * as React from "react";
import { traffic } from "./fleet.js";
import { attachCollapse } from "./collapse.js";
import { TokenFactoryStarfield } from "./starfield.js";
const sections = [
  ["Platform", "lp-product-title"],
  ["Billing", "lp-credit-title"],
  ["FAQ", "lp-faq-title"],
];

export function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.tabIndex = -1;
  target.focus({ preventScroll: true });
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const frame = id === "lp-credit-title" ? target.closest("section") : target;
  frame.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
}

function icon(h, name) {
  const lines = {
    diagonal: "M4 12 12 4M4.5 4H12v7.5",
    down: "M8 2.5v10M3.5 8l4.5 4.5L12.5 8",
    menu: "M2 5h12M2 11h12",
    close: "M3 3l10 10M13 3 3 13",
  };
  return h(
    "svg",
    { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", "aria-hidden": true },
    h("path", {
      d: lines[name],
      stroke: "currentColor",
      strokeWidth: 1.45,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    }),
  );
}

export function TokenFactoryHeader({ Brand, onSignIn }) {
  const h = React.createElement;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuButton = React.useRef(null);
  const header = React.useRef(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    const onOutside = (event) => {
      if (!header.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("focusin", onOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("focusin", onOutside);
    };
  }, [menuOpen]);

  return h(
    "header",
    { className: "space-header", ref: header },
    h(
      "div",
      { className: "space-header-inner" },
      h(
        "a",
        {
          className: "space-brand",
          href: "#/",
          "aria-label": "Vishwa Gateway home",
          onClick: () => {
            setMenuOpen(false);
            window.scrollTo({ top: 0, behavior: "instant" });
          },
        },
        h(Brand),
      ),
      h(
        "nav",
        {
          id: "space-nav",
          className: "space-nav",
          "data-open": menuOpen,
          "aria-label": "Main navigation",
        },
        sections.map(([label, id]) =>
          h(
            "a",
            {
              key: id,
              href: "#" + id,
              onClick: (event) => {
                event.preventDefault();
                setMenuOpen(false);
                scrollToSection(id);
              },
            },
            label,
          ),
        ),
      ),
      h(
        "div",
        { className: "space-header-actions" },
        h(
          "button",
          { type: "button", className: "space-signin", onClick: onSignIn },
          "Sign in",
          icon(h, "diagonal"),
        ),
        h(
          "button",
          {
            type: "button",
            className: "space-menu",
            ref: menuButton,
            "aria-expanded": menuOpen,
            "aria-controls": "space-nav",
            "aria-label": menuOpen ? "Close menu" : "Open menu",
            onClick: () => setMenuOpen(!menuOpen),
          },
          icon(h, menuOpen ? "close" : "menu"),
        ),
      ),
    ),
  );
}

function ExitWave() {
  const h = React.createElement;
  return h(
    "div",
    { className: "transit-exit" },
    h(
      "div",
      { className: "gate-wave-plane bore-field" },
      h("div", { className: "transit-flash" }),
      h("div", { className: "transit-ripple" }),
    ),
    h("div", { className: "transit-wake" }),
    h(
      "div",
      { className: "wave-track" },
      h(
        "div",
        { className: "gate-wave-plane wave-packet" },
        h("div", { className: "wave-compression" }),
      ),
      h("div", { className: "wave-tip" }),
    ),
  );
}

function OrbitalGate() {
  const h = React.createElement;
  const anchor = React.useRef(null);
  React.useEffect(() => traffic.attach(anchor.current), []);

  return h(
    "div",
    { className: "space-scene", "aria-hidden": true },
    h(
      "div",
      {
        className: "gate-anchor",
        ref: anchor,
        style: {
          "--aperture-x": traffic.aperture.x * 100 + "%",
          "--aperture-y": traffic.aperture.y * 100 + "%",
        },
      },
      h(
        "div",
        { className: "gate-float" },
        h(ExitWave),
        ...traffic.hulls.map(({ file, width }) =>
          h(
            "div",
            { className: "fleet-ship", key: file, style: { "--hull-width": width + "%" } },
            h("img", {
              src: "./token-factory-landing/assets/" + file + ".webp",
              decoding: "async",
              alt: "",
            }),
          ),
        ),
        h(
          "div",
          { className: "gate-object" },
          h("img", {
            className: "gate-surface",
            src: "./token-factory-landing/assets/armored-gateway.webp",
            width: 1254,
            height: 1254,
            alt: "",
            fetchPriority: "high",
            decoding: "async",
          }),
          h("div", { className: "gate-stator-emission" }),
          h("canvas", { className: "gate-rotors", "aria-hidden": true }),
          h("canvas", { className: "gate-rotor-glare", "aria-hidden": true }),
        ),
        h("div", { className: "gate-field-glare" }),
      ),
    ),
  );
}

export function TokenFactoryHero({ onSignIn, onExplore }) {
  const h = React.createElement;
  const track = React.useRef(null);
  React.useLayoutEffect(() => attachCollapse(track.current), []);
  const universe = h(
    "section",
    { className: "space-hero", "aria-labelledby": "lp-hero-title" },
    h(TokenFactoryStarfield),
    h(OrbitalGate),
    h(
      "div",
      { className: "lp-container space-hero-inner" },
      h(
        "div",
        { className: "space-copy" },
        h("h1", { id: "lp-hero-title" }, "Intelligence.", h("span", null, "On your terms.")),
        h("p", null, "One API for leading AI models.", h("br"), "One balance, billed by usage."),
        h(
          "div",
          { className: "space-hero-actions" },
          h(
            "button",
            { type: "button", className: "lp-button lp-primary", onClick: onSignIn },
            "Start building",
            icon(h, "diagonal"),
          ),
          h(
            "button",
            { type: "button", className: "lp-button lp-secondary", onClick: onExplore },
            "Explore the platform",
            icon(h, "down"),
          ),
        ),
      ),
    ),
  );
  return h(
    "div",
    { className: "universe-scroll", ref: track },
    h(
      "div",
      { className: "universe-stage" },
      h("div", { className: "universe-lens" }, universe),
      h("i", { className: "universe-kernel", "aria-hidden": true }),
    ),
    h("div", { className: "universe-travel", "aria-hidden": true }),
  );
}
