import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import * as Html from "../../main/js/html.js";

Deno.test("escape html", () => {
  assertEquals(Html.escapeHtml("\"&'<>"), "&quot;&amp;&#39;&lt;&gt;");
});

Deno.test("object to table not collapsed", () => {
  assertEquals(Html.objectToTable({a:1, b:{c:2}}, {collapsed: false}), "<table><tr><td>a:</td><td>1</td></tr><tr><td>b:</td><td><table><tr><td>c:</td><td>2</td></tr></table></td></tr></table>");
});

Deno.test("object to table collapsed", () => {
  assertEquals(Html.objectToTable({a:1, b:{c:2}}), "<table><tr><td>a:</td><td>1</td></tr><tr><td>b:</td><td><details><summary></summary><table><tr><td>c:</td><td>2</td></tr></table></details></td></tr></table>");
});

Deno.test("object to table with empty cells", () => {
  assertEquals(Html.objectToTable({a:null, b:undefined}), "<table><tr><td>a:</td><td></td></tr><tr><td>b:</td><td></td></tr></table>");
});