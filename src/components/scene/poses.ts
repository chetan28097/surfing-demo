import { CatmullRomCurve3, MathUtils, Vector3 } from "three";

/** Where the hero board hovers: right of the headline on wide screens, centred on tall ones. */
/** Hover height: higher on tall screens so it clears the headline. */
export function heroBoardY(aspect: number) {
  return aspect < 0.9 ? 2.0 : 1.05;
}

export function heroBoardX(aspect: number) {
  return aspect > 1.15 ? MathUtils.clamp((aspect - 1) * 1.1, 0.55, 1.35) : 0;
}

type Key = { at: number; pos: [number, number, number]; look: [number, number, number] };

/** Keyframed camera path. `at` is scroll progress; the path between keys is Catmull-Rom. */
export class CameraPath {
  private pos: CatmullRomCurve3;
  private look: CatmullRomCurve3;
  private times: number[];

  constructor(keys: Key[]) {
    this.times = keys.map((k) => k.at);
    this.pos = new CatmullRomCurve3(keys.map((k) => new Vector3(...k.pos)), false, "centripetal");
    this.look = new CatmullRomCurve3(keys.map((k) => new Vector3(...k.look)), false, "centripetal");
  }

  /** Map progress → curve parameter so each key lands exactly at its `at`. */
  private param(p: number) {
    const t = this.times;
    if (p <= t[0]) return 0;
    if (p >= t[t.length - 1]) return 1;
    let i = 0;
    while (i < t.length - 2 && p > t[i + 1]) i++;
    const local = (p - t[i]) / (t[i + 1] - t[i]);
    // ease within each segment so the camera settles on every beat
    const eased = local * local * (3 - 2 * local);
    const blended = MathUtils.lerp(local, eased, 0.45);
    return (i + blended) / (t.length - 1);
  }

  sample(p: number, outPos: Vector3, outLook: Vector3) {
    const u = this.param(p);
    this.pos.getPoint(u, outPos);
    this.look.getPoint(u, outLook);
  }
}

/** Hero → dive: hover shot, board lands, camera breaks the surface, sinks and looks up. */
export function divePath(aspect: number) {
  const bx = heroBoardX(aspect);
  const tall = aspect < 0.9;
  const back = tall ? 8.2 : 6.4;
  return new CameraPath([
    { at: 0.0, pos: [0, 1.75, back], look: [bx * 0.55, tall ? 1.55 : 1.0, 0] },
    { at: 0.18, pos: [0.4, 1.35, back - 1.3], look: [bx * 0.3, 0.6, 0] },
    { at: 0.36, pos: [1.9, 0.7, 3.3], look: [0, 0.0, 0] },
    { at: 0.5, pos: [1.2, 0.08, 2.9], look: [0, -0.05, 0] },
    { at: 0.6, pos: [0.5, -0.9, 2.7], look: [0, -0.2, 0] },
    { at: 0.8, pos: [0.1, -3.1, 2.1], look: [0, 0.0, -0.2] },
    { at: 1.0, pos: [0, -6.2, 1.6], look: [0, -0.4, -0.6] },
  ]);
}

/** Finale: start below the board, rise through the surface into the sunset. */
export function risePath(aspect: number) {
  const tall = aspect < 0.9;
  return new CameraPath([
    { at: 0.0, pos: [0.2, -4.2, 2.6], look: [0, 0.0, -0.4] },
    { at: 0.3, pos: [0.4, -1.2, 3.3], look: [0, 0.1, -2.5] },
    { at: 0.42, pos: [0.45, 0.85, 4.2], look: [0, 0.5, -12] },
    { at: 1.0, pos: [0.35, tall ? 1.4 : 1.1, tall ? 6.4 : 5.2], look: [0, 0.75, -30] },
  ]);
}
