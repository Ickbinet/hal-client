import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import * as Util from "../../main/js/util.js";

Deno.test("is object", () => {
  assertEquals(Util.isObject({}), true);
  assertEquals(Util.isObject(1), false);
  assertEquals(Util.isObject(null), false);
  assertEquals(Util.isObject(undefined), false);
  assertEquals(Util.isObject("1"), false);
});

Deno.test("is string", () => {
  assertEquals(Util.isString("1"), true);
  assertEquals(Util.isString(1), false);
  assertEquals(Util.isString(null), false);
  assertEquals(Util.isString(undefined), false);
  assertEquals(Util.isString({}), false);
});

Deno.test("to string", () => {
  assertEquals(Util.toString(1), "1");
  assertEquals(Util.toString([1]), "[1]");
  assertEquals(Util.toString({ a: 1 }), '{"a":1}');
});

Deno.test("try json", () => {
  assertEquals(Util.tryJSON(1), 1);
  assertEquals(Util.tryJSON("1"), "1");
  assertEquals(Util.tryJSON('{"a":1}'), { a: 1 });
});

Deno.test("delete empty entries", () => {
  const map1 = new Map();
  map1.set("a", "");
  map1.set("b", 0);
  map1.set("c", 1);

  const map2 = new Map();
  map2.set("c", 1);

  assertEquals(Util.deleteEmptyEntries(map1), map2);
});
