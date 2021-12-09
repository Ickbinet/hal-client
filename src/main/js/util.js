export function isObject(obj) {
  return obj != null && obj.constructor.name === "Object";
}

export function isString(obj) {
  return Object.prototype.toString.call(obj) === "[object String]";
}

export function tryJSON(v) {
  if (isString(v) && v.trim().startsWith("{")) {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
}

export function toString(o) {
  return isObject(o) || Array.isArray(o) ? JSON.stringify(o) : "" + o;
}

export function deleteEmptyEntries(map) {
  Array.from(map.entries()).forEach(([k, v]) => {
    if (!v) map.delete(k);
  });

  return map;
}
