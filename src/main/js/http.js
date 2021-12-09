export const MEDIA_TYPE = Object.freeze({
  HAL_FORMS: "application/prs.hal-forms+json",
  HAL: "application/hal+json",
  JSON: "application/json",
  ANY_JSON: "application/*+json",
  ANY: "*/*",
});

export async function sendRequest({
  method = "GET",
  url,
  contentType = MEDIA_TYPE.JSON,
  accept = [
    MEDIA_TYPE.HAL_FORMS,
    MEDIA_TYPE.HAL,
    MEDIA_TYPE.JSON,
    MEDIA_TYPE.ANY_JSON,
    MEDIA_TYPE.ANY,
  ].join(","),
  headers = {},
  body,
}) {
  headers = Object.assign(Object.assign({}, headers) || {}, {
    Accept: accept,
    "Content-Type": contentType,
  });

  globalThis.dispatchEvent(new Event("beforeFetch"));

  let response;
  try {
    response = await fetch(url, {
      method: method.toUpperCase(),
      mode: "cors",
      cache: "no-cache",
      headers: headers,
      redirect: "follow",
      body: body,
    });
  } catch (e) {
    console.error(e);
    //status must be 200-599, so use 418 I am a teapot...
    response = new Response(e, { status: 418, statusText: e.message });
  }

  globalThis.dispatchEvent(new Event("afterFetch"));

  return response;
}

export async function getErrorMessage(res) {
  let msg;
  if (res.status > 399) {
    if ((res.headers.get("Content-Type") ?? "").indexOf("json") > -1) {
      msg = await res.json();
    } else {
      msg = {
        status: res.status,
        message: res.statusText,
        timestamp: new Date(),
        path: res.url,
      };
    }
    if (msg && msg.status == 405) {
      msg.allow = res.headers.get("allow");
    }
  }

  return msg;
}
