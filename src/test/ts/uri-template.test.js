import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import * as UriTemplate from "../../main/js/uri-template.js";

Deno.test("expand path variable", () => {
  assertEquals(
    UriTemplate.parse("https://foo.bar/{a}?p=v{&x,y,z}").expand({ a: 1 }),
    "https://foo.bar/1?p=v",
  );
});
