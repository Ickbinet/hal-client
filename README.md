# HAL Client

HAL Client can be used to try out [HAL](https://stateless.group/hal_specification.html) and [HAL-FORMS](https://rwcbook.github.io/hal-forms/) APIs.

- Supported response content types are: application/prs.hal-forms+json,
  application/hal+json and application/json. All other types are displayed in a
  sandboxed iframe.

- HAL-FORMS are supported for content types application/json,
  application/x-www-form-urlencoded and multipart/form-data.

- The app is created with plain HTML/CSS/ES, no frameworks, no build.

- Manually tested (clicked through) against:
  <https://rwcbook08.herokuapp.com/task/> and
  <https://hypermedia-movies-demo.herokuapp.com/api>. Thanks to Mike Amundsen
  and Kai Tödter for providing these example apps.

## Configuration

- Done via the uri fragment (anything after the # in the URL).

- config parameters are separated by ~

- parameters
  - uri: the URI template of the HAL resource to inspect
  - headers: optional request headers like "authentication"
  - theme: dark or light

## Planned

- support _hsource, see:
  <https://rwcbook.github.io/hal-forms/#_the_hal_forms_query_string_registry>

- it und ui tests

## License

- THE BEER-WARE LICENSE: <https://spdx.org/licenses/Beerware.html>

## Contribute

- Bugs, feature requests etc - create an issue.

- Features, bugfixes etc. - create a pull request.

- Any code polishing is always welcome.

- Formatter: deno fmt for js, css/html: vscode built-in

- Test: deno test
