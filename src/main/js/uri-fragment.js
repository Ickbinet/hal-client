import { toString, tryJSON } from "./util.js";

const SEPARATOR = "~";

export function getParameters(fragment) {
  fragment = (fragment ?? location.hash).substring(1);
  const params = {};
  fragment.split(SEPARATOR).map((p) => {
    const pos = p.indexOf("=");
    params[p.substring(0, pos)] = tryJSON(
      decodeURIComponent(p.substring(pos + 1)),
    );
  });

  return params;
}

export function updateHash(params) {
  location.hash = updatedHash(params);
}

export function updatedHash(params) {
  params = Object.assign(getParameters(), params);
  const h = Object.entries(params)
    .map(([k, v]) => [k, toString(v)])
    .map(([k, v]) => k + "=" + v.replaceAll('"', "%22"))
    .join(SEPARATOR);
  return h;
}
