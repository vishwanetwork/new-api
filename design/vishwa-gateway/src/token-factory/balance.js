// Landing animation adapted from vishwanetwork/TOKEN-FACTORY PR #1.
// Source commit: 4bcfc6ac34c784ce6c32f4791d44c6f4965a5312.
import * as React from "react";
const incoming = ["M0 60H22C48 60 45 90 69 90H100", "M0 120H22C48 120 45 90 69 90H100"];
const outgoing = [
  "M0 90H18C48 90 42 30 70 30H100",
  "M0 90H100",
  "M0 90H18C48 90 42 150 70 150H100",
];

function links(h, paths, side) {
  return h(
    "svg",
    {
      className: "balance-links",
      viewBox: "0 0 100 180",
      preserveAspectRatio: "none",
      fill: "none",
      "aria-hidden": true,
    },
    paths.map((d, i) =>
      h("path", { d, key: "rail" + i, className: "balance-rail", pathLength: 1 }),
    ),
    paths.map((d, i) =>
      h("path", {
        d,
        key: "pulse" + i,
        className: "balance-signal",
        pathLength: 1,
        style: { "--signal-delay": (side === "in" ? -i * 1.8 : 1 + i * 1.5) + "s" },
      }),
    ),
    (side === "in" ? [90] : [30, 90, 150]).map((y) =>
      h("path", {
        key: y,
        className: "balance-arrow",
        d: "M90 " + (y - 3.3) + " L96 " + y + " L90 " + (y + 3.3),
      }),
    ),
  );
}
function creditMark(h) {
  // Three cut-metal credit plates. Their bevels pick up the light from above left.
  return h(
    "svg",
    { className: "balance-mark", viewBox: "0 0 72 60", fill: "none", "aria-hidden": true },
    h(
      "defs",
      null,
      h(
        "linearGradient",
        { id: "plate-silver", x1: ".08", y1: ".1", x2: ".78", y2: ".95" },
        h("stop", { stopColor: "#e2edf0" }),
        h("stop", { offset: ".55", stopColor: "#9aadb7" }),
        h("stop", { offset: "1", stopColor: "#63757f" }),
      ),
    ),
    [14, 7, 0].map((y, i) =>
      h(
        "g",
        { key: y, transform: "translate(0 " + y + ")" },
        h("path", {
          d: "M4 19.5 38 4 68 15 34.5 31Z",
          fill: i === 2 ? "url(#plate-silver)" : "#83939c",
          stroke: "#d8e4e9",
          strokeWidth: ".8",
        }),
        h("path", {
          d: "M4 19.5 34.5 31V36L4 24.4Z",
          fill: "#394952",
          stroke: "#8799a2",
          strokeWidth: ".75",
        }),
        h("path", {
          d: "M34.5 31 68 15V20L34.5 36Z",
          fill: "#27343d",
          stroke: "#74858e",
          strokeWidth: ".75",
        }),
      ),
    ),
    h("path", { d: "m28 18 10-4.6 7.8 3-10.2 4.6z", stroke: "#42535e", strokeWidth: "1.2" }),
  );
}
export function TokenFactoryBalance({ icons }) {
  const h = React.createElement,
    scene = React.useRef(null);
  React.useEffect(() => {
    const el = scene.current;
    const io = new IntersectionObserver(([entry]) =>
      el.toggleAttribute("data-in-view", entry.isIntersecting),
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const node = (name, Icon) =>
    h(
      "div",
      { className: "balance-node", key: name },
      h(Icon, { size: 21, strokeWidth: 1.55, "aria-hidden": true }),
      h("span", null, name),
    );
  return h(
    "section",
    {
      className: "lp-credit-section balance-scene",
      "aria-labelledby": "lp-credit-title",
      ref: scene,
    },
    h("span", { className: "credit-galaxy", "aria-hidden": true }),
    h(
      "div",
      { className: "lp-container balance-layout" },
      h(
        "div",
        { className: "balance-copy" },
        h(
          "h2",
          { id: "lp-credit-title" },
          "Your models.",
          h("br"),
          h("span", null, "One balance."),
        ),
        h("p", null, "Track the input and output tokens for every request."),
      ),
      h(
        "figure",
        {
          className: "balance-map",
          role: "img",
          "aria-label":
            "Fiat and crypto fund one workspace balance. One API key connects that balance to OpenAI, Anthropic and Gemini.",
        },
        h(
          "div",
          { className: "balance-stack balance-funding" },
          node("Fiat", icons.Fiat),
          node("Crypto", icons.Crypto),
        ),
        links(h, incoming, "in"),
        h(
          "div",
          { className: "balance-core" },
          h("div", { className: "balance-credit" }, creditMark(h), h("strong", null, "Credit")),
          h(
            "div",
            { className: "balance-key" },
            h(icons.Key, { size: 16, "aria-hidden": true }),
            "API key",
          ),
        ),
        links(h, outgoing, "out"),
        h(
          "div",
          { className: "balance-stack balance-providers" },
          node("OpenAI", icons.OpenAI),
          node("Anthropic", icons.Anthropic),
          node("Gemini", icons.Gemini),
        ),
      ),
    ),
  );
}
