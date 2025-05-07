/* eslint-disable no-console */

import _isEqual from 'lodash/isEqual';
import isNil from 'lodash/isNil';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import nestedProperty from 'plotly.js/src/lib/nested_property';
import isNumeric from 'fast-isnumeric';
import tinycolor from 'tinycolor2';
import {MULTI_VALUED, MULTI_VALUED_PLACEHOLDER} from './constants';

const hasFullValue = (fullValue) => fullValue !== void 0 && fullValue !== null;

function isEqual(a, b) {
  if (isString(a) && isString(b)) {
    const c1 = tinycolor(a);
    const c2 = tinycolor(b);
    if (c1.isValid() && c2.isValid()) {
      return tinycolor.equals(c1, c2);
    }
  }
  if (isArray(a) && isArray(b)) {
    return a.length === b.length && a.every((v, i) => isEqual(v, b[i]));
  }
  return _isEqual(a, b);
}

export function hasValidCustomConfigVisibilityRules(customConfig) {
  if (
    customConfig &&
    customConfig === Object(customConfig) &&
    Object.keys(customConfig).length &&
    customConfig.visibility_rules
  ) {
    if (customConfig.visibility_rules.blacklist && customConfig.visibility_rules.whitelist) {
      console.error(
        'customConfig.visibility_rules can have a blacklist OR whitelist key, both are present in your config.'
      );
      return false;
    }

    if (
      !Object.keys(customConfig.visibility_rules).some((key) =>
        ['blacklist', 'whitelist'].includes(key)
      )
    ) {
      console.error(
        'customConfig.visibility_rules must have at least a blacklist or whitelist key.'
      );
      return false;
    }

    const isValidRule = (rule) => {
      if (rule.exceptions) {
        return rule.exceptions.every(isValidRule);
      }
      return rule.type && ['attrName', 'controlType'].includes(rule.type) && rule.regex_match;
    };

    const errorMessage =
      "All rules and exceptions must have a type (one of: 'attrName' or 'controlType') and regex_match key.";

    if (
      customConfig.visibility_rules.blacklist &&
      !customConfig.visibility_rules.blacklist.every(isValidRule)
    ) {
      console.error(errorMessage);
      return false;
    }

    if (
      customConfig.visibility_rules.whitelist &&
      !customConfig.visibility_rules.whitelist.every(isValidRule)
    ) {
      console.error(errorMessage);
      return false;
    }

    return true;
  }
  return false;
}

export function computeCustomConfigVisibility(props, customConfig, wrappedComponentDisplayName) {
  let isVisible;

  const isRegexMatch = (rule) => {
    const stringToTest = rule.type === 'attrName' ? props.attr : wrappedComponentDisplayName;
    return RegExp(rule.regex_match).test(stringToTest);
  };

  const passesTest = (rule) => {
    const hasException = (rule) => {
      if (rule.exceptions) {
        return rule.exceptions.some((exception) => passesTest(exception));
      }
      return false;
    };
    return isRegexMatch(rule) && !hasException(rule);
  };

  if (customConfig.visibility_rules.blacklist) {
    isVisible = !customConfig.visibility_rules.blacklist.some(passesTest);
  }

  if (customConfig.visibility_rules.whitelist) {
    isVisible = customConfig.visibility_rules.whitelist.some(passesTest);
  }

  return isVisible;
}

export function isVisibleGivenCustomConfig(initial, nextProps, nextContext, componentDisplayName) {
  let show = initial;
  if (show && nextContext.hasValidCustomConfigVisibilityRules) {
    show = computeCustomConfigVisibility(nextProps, nextContext.customConfig, componentDisplayName);
  }
  return show;
}

export default function unpackPlotProps(props, context) {
  const {container, getDflt, getValObject, defaultContainer, updateContainer} = context;

  if (!props.attr) {
    return {};
  }

  let attrMeta;
  if (getValObject) {
    attrMeta = context.getValObject(props.attr) || {};
  }

  const fullContainer = context.fullContainer;

  const fullProperty = nestedProperty(fullContainer, props.attr);
  let fullValue = fullProperty.get();
  let multiValued = false;

  // MULTI_VALUED consists of a control sequence that cannot be confused with
  // user data. We must transform it into something that can be displayed as
  // the screen.
  if (fullValue === MULTI_VALUED) {
    fullValue = MULTI_VALUED_PLACEHOLDER;
    multiValued = true;
  }

  const isVisible = Boolean(hasFullValue(fullValue) || props.show);

  let defaultValue = props.defaultValue;
  if (defaultValue === void 0 && defaultContainer) {
    defaultValue = nestedProperty(defaultContainer, props.attr).get();
  }

  let min, max, description;
  if (attrMeta) {
    if (isNumeric(attrMeta.max)) {
      max = attrMeta.max;
    }
    if (isNumeric(attrMeta.min)) {
      min = attrMeta.min;
    }

    description = attrMeta.description;
  }

  const updatePlot = (v, _update = {}) => {
    if (!props.attr || !updateContainer) {
      return;
    }
    const update = {..._update};
    if ((props.resettable || (context.resettable && props.resettable !== false)) && !isNil(v)) {
      const dflt = getDflt(props.attr);
      const equal = isEqual(v, dflt);
      if (equal && update.autocolorscale === false) {
        update.autocolorscale = true;
      }
      update[props.attr] = equal ? null : v;
      console.log(`[DEBUG] ${props.attr}`, v, '=', dflt, '=>', equal);
    } else {
      update[props.attr] = v;
    }
    if (updateContainer) {
      updateContainer(update);
    }
  };

  return {
    attrMeta,
    container,
    defaultValue,
    fullContainer,
    fullValue,
    getValObject,
    isVisible,
    max,
    min,
    description,
    multiValued,
    updateContainer,
    updatePlot,
  };
}
