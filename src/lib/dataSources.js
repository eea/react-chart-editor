import nestedProperty from 'plotly.js/src/lib/nested_property';
import {maybeTransposeData} from 'lib';

export function getAttrsPath(container, allowedAttributes) {
  const srcAttributes = {};

  function recursiveSearch(container, path = '') {
    if (!container || typeof container !== 'object') {
      return;
    }

    if (Array.isArray(container)) {
      container.forEach((value, index) => {
        recursiveSearch(value, `${path}[${index}]`);
      });
      return;
    }

    Object.entries(container).forEach(([key, value]) => {
      const newPath = path ? `${path}.${key}` : key;

      if (allowedAttributes.includes(newPath.replace(/\[\d+\]/g, '[]')) && Array.isArray(value)) {
        srcAttributes[newPath] = value;
      }

      recursiveSearch(value, newPath);
    });
  }

  recursiveSearch(container);
  return srcAttributes;
}

export function getSrcAttr(container, attr, srcConverters) {
  const key = attr + 'src';
  const srcProperty = nestedProperty(container, key).get();
  const value = srcConverters ? srcConverters.toSrc(srcProperty, container?.type) : srcProperty;

  return {
    key,
    value,
    originalValue: value,
    attr,
  };
}

export function getAdjustedSrcAttr(srcAttr) {
  return Array.isArray(srcAttr.value) && srcAttr.value.length === 1
    ? {...srcAttr, value: srcAttr.value[0]}
    : srcAttr;
}

export function getData(trace, srcAttr, dataSources) {
  let data;
  const srcAttrValue =
    Array.isArray(srcAttr.value) &&
    srcAttr.value.length === 1 &&
    (srcAttr.attr === 'x' || srcAttr.attr === 'y')
      ? srcAttr.value[0]
      : srcAttr.value;

  if (Array.isArray(srcAttrValue)) {
    data = srcAttrValue.filter((v) => Array.isArray(dataSources[v])).map((v) => dataSources[v]);
  } else {
    data = dataSources[srcAttrValue] || null;
  }
  return maybeTransposeData(data, srcAttr.key, trace.type);
}

export function inSrcAttr(srcAttr, value) {
  if (Array.isArray(srcAttr.value) && srcAttr.value.indexOf(value) > -1) {
    return true;
  }
  if (typeof srcAttr.value === 'string' && srcAttr.value === value) {
    return true;
  }
  return false;
}
