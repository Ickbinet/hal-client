export function parse(uri) {
  const _uri = uri;
  let _variableNames = [];
  let _requiredVariableNames = [];

  _variableNames = [...uri.matchAll(/{(.*?)}/g)]
    .map((m) => m[1])
    .map((m) => m.split(","))
    .flat()
    .map((m) => m.replace("?", "").replace("&", ""));

  _requiredVariableNames = [...uri.split("?")[0].matchAll(/{(.*?)}/g)]
    .map((m) => m[1])
    .map((m) => m.split(","))
    .flat();

  const t = {
    getVariableNames: function () {
      return _variableNames;
    },

    getRequiredVariableNames: function () {
      return _requiredVariableNames;
    },

    expand: function (variables) {
      return new UrlTemplate(_uri).expand(variables ?? {});
    },
  };

  return t;
}

// from https://raw.githubusercontent.com/wikibus/es6-url-template/master/url-template.js

function encodeReserved(str) {
  return str
    .split(/(%[0-9A-Fa-f]{2})/g)
    .map((part) => {
      if (!/%[0-9A-Fa-f]/.test(part)) {
        part = encodeURI(part).replace(/%5B/g, "[").replace(/%5D/g, "]");
      }
      return part;
    })
    .join("");
}

function encodeUnreserved(str) {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

function encodeValue(operator, value, key) {
  value = operator === "+" || operator === "#"
    ? encodeReserved(value)
    : encodeUnreserved(value);

  if (key) {
    return encodeUnreserved(key) + "=" + value;
  } else {
    return value;
  }
}

function isDefined(value) {
  return value !== undefined && value !== null;
}

function isKeyOperator(operator) {
  return operator === ";" || operator === "&" || operator === "?";
}

function getValues(context, operator, key, modifier) {
  let value = context[key];
  const result = [];

  if (isDefined(value) && value !== "") {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      value = value.toString();

      if (modifier && modifier !== "*") {
        value = value.substring(0, parseInt(modifier, 10));
      }

      result.push(
        encodeValue(operator, value, isKeyOperator(operator) ? key : null),
      );
    } else {
      if (modifier === "*") {
        if (Array.isArray(value)) {
          value.filter(isDefined).forEach((value) => {
            result.push(
              encodeValue(
                operator,
                value,
                isKeyOperator(operator) ? key : null,
              ),
            );
          });
        } else {
          Object.keys(value).forEach((k) => {
            if (isDefined(value[k])) {
              result.push(encodeValue(operator, value[k], k));
            }
          });
        }
      } else {
        const tmp = [];

        if (Array.isArray(value)) {
          value.filter(isDefined).forEach((value) => {
            tmp.push(encodeValue(operator, value));
          });
        } else {
          Object.keys(value).forEach((k) => {
            if (isDefined(value[k])) {
              tmp.push(encodeUnreserved(k));
              tmp.push(encodeValue(operator, value[k].toString()));
            }
          });
        }

        if (isKeyOperator(operator)) {
          result.push(encodeUnreserved(key) + "=" + tmp.join(","));
        } else if (tmp.length !== 0) {
          result.push(tmp.join(","));
        }
      }
    }
  } else {
    if (operator === ";") {
      if (isDefined(value)) {
        result.push(encodeUnreserved(key));
      }
    } else if (value === "" && (operator === "&" || operator === "?")) {
      result.push(encodeUnreserved(key) + "=");
    } else if (value === "") {
      result.push("");
    }
  }
  return result;
}

const operators = ["+", "#", ".", "/", ";", "?", "&"];

class UrlTemplate {
  constructor(template) {
    Object.defineProperty(this, "template", {
      get: () => template,
    });
  }

  expand(context) {
    return this.template.replace(
      /\{([^\{\}]+)\}|([^\{\}]+)/g,
      (_, expression, literal) => {
        if (expression) {
          let operator = null;
          const values = [];

          if (operators.indexOf(expression.charAt(0)) !== -1) {
            operator = expression.charAt(0);
            expression = expression.substr(1);
          }

          expression.split(/,/g).forEach((variable) => {
            const tmp = /([^:\*]*)(?::(\d+)|(\*))?/.exec(variable);
            values.push.apply(
              values,
              getValues(context, operator, tmp[1], tmp[2] || tmp[3]),
            );
          });

          if (operator && operator !== "+") {
            let separator = ",";

            if (operator === "?") {
              separator = "&";
            } else if (operator !== "#") {
              separator = operator;
            }
            return (
              (values.length !== 0 ? operator : "") + values.join(separator)
            );
          } else {
            return values.join(",");
          }
        } else {
          return encodeReserved(literal);
        }
      },
    );
  }
}
