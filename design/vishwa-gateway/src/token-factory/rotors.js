// Landing animation adapted from vishwanetwork/TOKEN-FACTORY PR #1.
// Source commit: 4bcfc6ac34c784ce6c32f4791d44c6f4965a5312.
// The lookup covers only the two exposed races. Its coordinates follow the
// photographed tracks around the fixed housing, including the oblique bore.
async function loadImage(file) {
  const image = new Image();
  image.src = "./token-factory-landing/assets/" + file;
  await image.decode();
  return image;
}
function pixels(image) {
  const surface = document.createElement("canvas");
  surface.width = image.naturalWidth;
  surface.height = image.naturalHeight;
  const context = surface.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, surface.width, surface.height);
}
async function loadSurfaces() {
  const [map, strip, emission] = await Promise.all([
    loadImage("armored-rotor-map.png"),
    loadImage("armored-rotor-strip.webp"),
    loadImage("armored-rotor-emission.png"),
    loadImage("armored-stator-mask.png"),
  ]);
  const lookup = pixels(map);
  const tracks = [[], []];
  const width = strip.naturalWidth;
  const rowsPerRing = strip.naturalHeight / 2;
  for (let i = 0; i < lookup.data.length; i += 4) {
    const encoded = lookup.data[i + 1];
    const coverage = (encoded & 15) / 15;
    if (!coverage) continue;
    const turn = ((lookup.data[i] << 4) | (encoded >> 4)) / 4096;
    const row = lookup.data[i + 2];
    const ring = row >= rowsPerRing ? 1 : 0;
    // Grazing light stays anchored in the scene as the metal moves through it.
    const light = 0.72 + 0.2 * Math.cos(2 * Math.PI * (turn + 0.1));
    tracks[ring].push(i, turn * width, row * width, coverage, light);
  }
  return {
    tracks: tracks.map((values) => new Float32Array(values)),
    material: pixels(strip).data,
    emission: pixels(emission).data,
    width,
    mapWidth: lookup.width,
    mapHeight: lookup.height,
  };
}
let surfaces;
function attach(gate) {
  const canvas = gate.querySelector(".gate-rotors");
  const glare = gate.querySelector(".gate-rotor-glare");
  const housing = canvas.parentElement;
  const context = canvas.getContext("2d");
  const glareContext = glare?.getContext("2d");
  if (!context) return;
  let image,
    glowPixels,
    resources,
    destroyed = false,
    angles = [0, 0];
  let energy = 0,
    hadGlare = false;
  function paint() {
    const { tracks, width, material, emission } = resources;
    const output = image.data;
    const charging = energy > 0.002;
    const wrap = width - 1; // The unwrapped material is 2048 pixels per turn.
    for (let race = 0; race < tracks.length; race++) {
      const track = tracks[race];
      const offset = ((angles[race] / (2 * Math.PI)) % 1) * width;
      for (let j = 0; j < track.length; j += 5) {
        const out = track[j];
        const x = track[j + 1] - offset + width;
        const column = Math.floor(x);
        const a = (track[j + 2] + (column & wrap)) * 4;
        const b = (track[j + 2] + ((column + 1) & wrap)) * 4;
        const f = x - column;
        const g = 1 - f;
        const shade = track[j + 4];
        const alpha = (material[a + 3] * g + material[b + 3] * f) * track[j + 3];
        let core = 0,
          bounce = 0;
        if (charging) {
          // The RGB light map follows the exact material lookup. Its channels
          // encode the filament, spill onto that seat, and the lens response.
          core = (emission[a] * g + emission[b] * f) * energy;
          bounce = (emission[a + 1] * g + emission[b + 1] * f) * energy;
          if (glowPixels) {
            glowPixels.data[out + 3] =
              ((emission[a + 2] * g + emission[b + 2] * f) * energy * alpha) / 255;
          }
        }
        output[out] = (material[a] * g + material[b] * f) * shade + core * 1.36 + bounce * 0.73;
        output[out + 1] =
          (material[a + 1] * g + material[b + 1] * f) * shade + core * 2.05 + bounce * 1.13;
        output[out + 2] =
          (material[a + 2] * g + material[b + 2] * f) * shade + core * 2.52 + bounce * 1.65;
        output[out + 3] = alpha;
      }
    }
    context.putImageData(image, 0, 0);
    if (glowPixels) {
      if (charging) glareContext.putImageData(glowPixels, 0, 0);
      else if (hadGlare) glareContext.clearRect(0, 0, glare.width, glare.height);
    }
    hadGlare = charging;
  }
  if (!surfaces)
    surfaces = loadSurfaces().catch((error) => {
      surfaces = null;
      throw error;
    });
  surfaces
    .then((result) => {
      if (destroyed) return;
      resources = result;
      canvas.width = result.mapWidth;
      canvas.height = result.mapHeight;
      image = context.createImageData(canvas.width, canvas.height);
      if (glareContext) {
        glare.width = canvas.width;
        glare.height = canvas.height;
        glowPixels = glareContext.createImageData(glare.width, glare.height);
        for (let i = 0; i < glowPixels.data.length; i += 4) {
          glowPixels.data[i] = 205;
          glowPixels.data[i + 1] = 234;
          glowPixels.data[i + 2] = 255;
        }
      }
      paint();
      housing.setAttribute("data-rotors-ready", "");
    })
    .catch(() => {
      /* The complete photographed gate is the static fallback. */
    });
  return {
    draw(inner, outer, charge = 0) {
      angles[0] = inner;
      angles[1] = outer;
      energy = Math.min(1, Math.max(0, charge));
      if (resources) paint();
    },
    destroy() {
      destroyed = true;
      housing.removeAttribute("data-rotors-ready");
      resources = null;
      image = null;
      glowPixels = null;
    },
  };
}
export const gateRotors = { attach };
