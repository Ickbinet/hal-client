import { isObject, tryJSON } from "./util.js";

const matchHtmlRegExp = /["'&<>]/;

export function objectToTable(o, options = {}) {
  delete o._links;
  delete o._templates;

  const rows = Object.entries(o)
    .map(([k, v]) => [k, tryJSON(v)])
    .map(([k, v]) => [
      k,
      isObject(v) || Array.isArray(v)
        ? objectToTable(v, { collapsed: options.collapsed ?? true })
        : escapeHtml(v),
    ])
    .map(([k, v]) => [isNaN(k) ? k + ":" : "", v])
    .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${v}</td></tr>`)
    .join("");

  if (rows.length === 0) return "";

  if (options.collapsed) {
    return `<details><summary></summary><table>${rows}</table></details>`;
  } else {
    return `<table>${rows}</table>`;
  }
}

// from https://github.com/component/escape-html
export function escapeHtml(string) {
  const str = "" + string;
  const match = matchHtmlRegExp.exec(str);

  if (!match) {
    return str;
  }

  let escape;
  let html = "";
  let index = 0;
  let lastIndex = 0;

  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34: // "
        escape = "&quot;";
        break;
      case 38: // &
        escape = "&amp;";
        break;
      case 39: // '
        escape = "&#39;";
        break;
      case 60: // <
        escape = "&lt;";
        break;
      case 62: // >
        escape = "&gt;";
        break;
      default:
        continue;
    }

    if (lastIndex !== index) {
      html += str.substring(lastIndex, index);
    }

    lastIndex = index + 1;
    html += escape;
  }

  return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
}
