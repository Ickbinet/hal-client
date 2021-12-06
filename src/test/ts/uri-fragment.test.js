import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import * as UriFragment from "../../main/js/uri-fragment.js";

Deno.test("get variables from hash", () => {
  const params = UriFragment.getParameters("#a=1~b=2");
  assertEquals(params.a, "1");
  assertEquals(params.b, "2");
});
