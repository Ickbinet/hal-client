import { getErrorMessage, MEDIA_TYPE, sendRequest } from "./http.js";
import { deleteEmptyEntries, isObject } from "./util.js";
import { escapeHtml, objectToTable } from "./html.js";
import * as UriTemplate from "./uri-template.js";
import * as UriFragment from "./uri-fragment.js";

const uriForm = document.getElementById("uri-form");
const uriInput = document.getElementById("uri-input");
const headersInput = document.getElementById("headers-input");
const uriSend = document.getElementById("uri-send");

const params = UriFragment.getParameters();

setTheme(params.theme);

attachFetchListeners();
attachThemeActionListeners();
attachHashChangeListener();
attachUriFormListener();

let res = null;
const uriTemplateString = params.uri;

if (uriTemplateString) {
  uriChange(uriTemplateString);
}

function uriChange(uriTemplateString) {
  const params = UriFragment.getParameters();

  const template = UriTemplate.parse(uriTemplateString);

  createQueryFormInputs(template);

  //force https
  const uri = template.expand().replace("http://", "https://");

  uriInput.value = uriTemplateString;
  headersInput.value = params.headers
    ? JSON.stringify(params.headers, null, 2)
    : "";

  if (template.getRequiredVariableNames().length == 0) {
    fetchUri(uri, params.headers);
    uriSend.classList.remove("pulse");
  } else {
    uriSend.classList.add("pulse");
  }
}

async function fetchUri(uri, headers) {
  const r = await sendRequest({ url: uri, headers: headers });
  if (r.status < 400) {
    await handleUriResponse(r);
  } else {
    reportError(await getErrorMessage(r));
  }
}

async function handleUriResponse(r) {
  let contentType = r.headers.get("Content-Type") ?? "";
  contentType = contentType.split(";")[0];

  if (contentType === MEDIA_TYPE.HAL || contentType == MEDIA_TYPE.HAL_FORMS) {
    res = await r.json();
    if (res.alps) {
      //SDR AlpsController returns which ever content type is requested, so sniff this type here...
      res = objectToTable(res.alps, { collapsed: false });
      showTextResponse();
    } else {
      createLinks();
      createActions();
      if (res._embedded) {
        createEmbeddedTable();
      } else {
        delete res._links;
        delete res._templates;
        res = objectToTable(res);
        showTextResponse();
      }
    }
  } else if (contentType == MEDIA_TYPE.JSON) {
    res = await r.json();
    res = objectToTable(res);
    showTextResponse();
    //} else if (contentType.startsWith("text/")) {
    //  res = await r.text();
    //  showTextResponse();
  } else {
    res = await r.blob();
    showAnyResponse(contentType);
  }
}

function createQueryFormInputs(template) {
  const inputs = document.createElement("div");
  inputs.className = "generated keep";
  inputs.innerHTML = template
    .getVariableNames()
    .map((name) => {
      return { name: name };
    })
    .map((p) => createInput(p))
    .join("");
  document.getElementById("uri-variables").appendChild(inputs);
}

function attachUriFormListener() {
  uriForm.addEventListener("submit", (e) => {
    e.preventDefault();
    uriSend.classList.remove("pulse");

    const params = new URLSearchParams(new FormData(uriForm));

    UriFragment.updateHash({
      uri: params.get("uri"),
      theme: document.body.className,
      headers: params.get("headers"),
    });

    const uriTemplate = UriTemplate.parse(params.get("uri"));
    params.delete("uri");
    params.delete("headers");
    deleteEmptyEntries(params);

    const uri = uriTemplate.expand(Object.fromEntries(params));

    removeGeneratedChildren(document);

    fetchUri(uri, JSON.parse(headersInput.value || "{}"));

    return false;
  });
}

function removeGeneratedChildren(parent) {
  parent.querySelectorAll(".generated:not(.generated.keep)")
  .forEach((e) => e.remove());
}

function createLinks() {
  const parent = document.getElementById("links");

  const linkToHtml = (name, link) => {
    const rel = link.name ?? name;
    const href = link.href;

    let html = `<a href="#${withFragment(href)}" title="${href}">${
      escapeHtml(link.title ?? rel)
    }</a>`;

    if (rel.startsWith("http://") || rel.startsWith("https://")) {
      // Support the "Suggested Process Flow for HAL-FORMS Documents":
      // https://rwcbook.github.io/hal-forms/#_suggested_process_flow_for_hal_forms_documents
      const url = new URL(rel);
      url.searchParams.set("_htarget", href);
      const relLink = url.toString();
      html += `<a href="#${
        withFragment(relLink)
      }" title="follow relation: ${relLink}" class="icon follow-rel"></a>`;
    }

    return `<li>${html}</li>`;
  };

  const html = Object.keys(res._links)
    .map((name) => [name, res._links[name]])
    .map(([name, o]) => {
      if (Array.isArray(o)) {
        return "<ul>" + o.map((link) => linkToHtml(name, link)).join("") +
          "</ul>";
      } else {
        return linkToHtml(name, o);
      }
    })
    .join("");

  const container = document.createElement("div");
  container.className = "generated";
  container.innerHTML = "<ul>" + html + "</ul>";
  removeGeneratedChildren(parent);
  parent.appendChild(container);
}

function createActions() {
  const parent = document.getElementById("templates");

  for (const form in res._templates) {
    const halForm = res._templates[form];
    const container = document.createElement("div");
    container.className = "generated";
    container.innerHTML = createForm(halForm, form);
    removeGeneratedChildren(parent);
    parent.appendChild(container);
  }

  attachActionFormListeners(parent);
}

function createForm(f, title) {
  const params = new URL(UriFragment.getParameters().uri).searchParams;
  const targetURL = f.target ?? params.get("_htarget") ?? res._links.self.href;
  //TODO support _hsource
  return `
    <details class="template-form">
        <summary>${f.title ?? title}</summary>
        <form action="${targetURL}" 
          class="rui-form"
          data-method="${f.method ?? params.get("_hmethod") ?? "GET"}" 
          data-contenttype="${f.contentType ?? MEDIA_TYPE.JSON}" 
          enctype="${f.contentType ?? MEDIA_TYPE.JSON}">
          ${f.properties.map((p) => createInput(p)).join("")}
          <button class="btn btn-primary">Send</button>
        </form>
        </details>
    `;
}

function createInput(p) {
  return `
    <div class="labeled">
        <label class="label-text">${escapeHtml(p.prompt ?? p.name)}</label>
        <input class="input" type="${p.type ?? "text"}" name="${p.name}" ${
    p.required ? "required" : ""
  } />
    </div>
    `;
}

function attachActionFormListeners(parent) {
  Array.from(parent.querySelectorAll("form")).forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const contentType = form.dataset.contenttype ?? form.enctype;

      let body = new FormData(form);
      if (contentType.indexOf("json") > -1) {
        body = JSON.stringify(Object.fromEntries(deleteEmptyEntries(body)));
      } else if (contentType === "application/x-www-form-urlencoded") {
        body = new URLSearchParams(body);
      } else if (contentType === "multipart/form-data") {
        //already form-data
      } else {
        reportError(
          "The Content-Type '" +
            contentType +
            "' is not supported by HAL-Client.",
        );
        return;
      }
      const res = await sendRequest({
        method: form.dataset.method,
        url: form.action,
        contentType: contentType,
        headers: getCustomRequestHeaders(),
        body: body,
      });

      let msg = "OK";
      if (!res.ok) {
        msg = await getErrorMessage(res);
      }
      reportError(msg);

      return false;
    });
  });
}

function createEmbeddedTable() {
  for (const embedded in res._embedded) {
    const data = res._embedded[embedded];

    if (data.length > 0) {
      let propertyNames = new Set();
      data.forEach((elem) =>
        Object.keys(elem).filter((name) => !name.startsWith("_")).forEach(
          (name) => propertyNames.add(name),
        )
      );

      propertyNames = [...propertyNames];

      const header = "<th>details</th>" +
        propertyNames.map((name) => `<th>${escapeHtml(name)}</th>`).join("");

      const body = data
        .map(
          (elem) =>
            "<tr>" +
            `<td><a href="#${
              withFragment(
                elem._links?.self.href,
              )
            }" class="icon link"></a></td>` +
            propertyNames
              .map((name) => [name, elem[name]])
              .map(([name, v]) =>
                isObject(v) || Array.isArray(v)
                  ? [name, objectToTable(v, { collapsed: true })]
                  : [name, escapeHtml(v ?? "")]
              )
              .map(
                ([name, v]) => `
              <td>
                <span class="mobile">${escapeHtml(name)}</span>
                <span class="mobile-col">${v}</span>
              </td>`,
              )
              .join("") +
            "</tr>",
        )
        .join("");

      let pageHtml = "";
      if (res.page) {
        pageHtml = `${res.page.number * res.page.size + 1} 
        - ${
          Math.min(
            res.page.totalElements,
            (res.page.number + 1) * res.page.size,
          )
        } 
        / ${res.page.totalElements}`;
      }

      const foot = `
        <a href="#${
        withFragment(
          res._links.first?.href,
        )
      }" class="icon first"></a>
        <a href="#${withFragment(res._links.prev?.href)}" class="icon prev"></a>
        <span>
        ${pageHtml}
        &nbsp;
        </span>
        <a href="#${withFragment(res._links.next?.href)}" class="icon next"></a>
        <a href="#${withFragment(res._links.last?.href)}" class="icon last"></a>
        `;

      const container = document.createElement("div");
      container.className = "generated";
      container.innerHTML = `
          <table>
            <thead>
                <tr>${header}</tr>
            </thead>
            <tbody>
                ${body}
            </tbody>
            <tfoot>
                <tr><td colspan="${
        propertyNames.length +
        1
      }" class="paging-toolbar">${foot}</td></tr>
            </tfoot>
        </table>`;

      const parent = document.getElementById("data");
      removeGeneratedChildren(parent);
      parent.appendChild(container);
    }
  }
}

function showTextResponse() {
  const container = document.createElement("div");
  container.className = "generated";
  container.innerHTML = res;

  const parent = document.getElementById("data");
  removeGeneratedChildren(parent);
  parent.appendChild(container);
}

function showAnyResponse(contentType) {
  const container = document.createElement("iframe");
  container.setAttribute("sandbox", "");
  container.className = "any-response generated";
  const dataURI = URL.createObjectURL(new Blob([res], { type: contentType }));
  container.src = dataURI;

  const parent = document.getElementById("data");
  removeGeneratedChildren(parent);
  parent.appendChild(container);
}

function getCustomRequestHeaders() {
  let headers = headersInput.value;
  if (headers) {
    headers = JSON.parse(headers);
  }
  return headers ?? {};
}

function reportError(msg) {
  const container = document.createElement("div");
  container.className = "generated";
  container.innerHTML = isObject(msg) ? objectToTable(msg) : msg;

  const parent = document.getElementById("error");
  removeGeneratedChildren(parent);
  parent.appendChild(container);
}

function withFragment(uri) {
  return UriFragment.updatedHash({ uri: uri });
}

function attachFetchListeners() {
  const progress = document.getElementById("fetch-progress");
  let progressDelay = 0;
  globalThis.addEventListener("beforeFetch", () => {
    clearTimeout(progressDelay);
    progressDelay = setTimeout(
      () => progress.classList.remove("invisible"),
      500,
    );
  });
  globalThis.addEventListener("afterFetch", () => {
    clearTimeout(progressDelay);
    progress.classList.add("invisible");
  });
}

function attachThemeActionListeners() {
  const light = document.querySelector(".light-theme");
  light.onclick = () => setTheme("light");
  light.href = "#" + UriFragment.updatedHash({ theme: "light" });

  const dark = document.querySelector(".dark-theme");
  dark.href = "#" + UriFragment.updatedHash({ theme: "dark" });
  dark.onclick = () => setTheme("dark");
}

function attachHashChangeListener() {
  globalThis.addEventListener("hashchange", () => {
    document.querySelectorAll(".generated").forEach((e) => e.remove());
    uriChange(UriFragment.getParameters().uri);
  });
}

function setTheme(theme) {
  document.body.className = theme ?? "light";
}
