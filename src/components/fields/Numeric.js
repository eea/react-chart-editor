import isNumber from 'lodash/isNumber';
import isString from 'lodash/isString';
import isBoolean from 'lodash/isBoolean';
import Field from './Field';
import NumericInput from '../widgets/NumericInput';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connectToContainer} from 'lib';
import {RadioBlocks} from '../widgets';

const types = {
  number: isNumber,
  string: isString,
  boolean: isBoolean,
};

function getDefaultMode(props) {
  if (!props.visibilityOptions?.length) {
    return false;
  }
  const fullValue = props.fullValue;
  const defaultOpt = props.visibilityOptions.find((option) => {
    if (option.type) {
      return option.value === fullValue || types[option.type](fullValue);
    }
    return option.value === fullValue;
  });
  return defaultOpt.value;
}

export class UnconnectedNumeric extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      mode: getDefaultMode(props),
    };
  }

  render() {
    let fullValue = this.props.fullValue;
    let placeholder;
    if (this.props.multiValued) {
      placeholder = fullValue;
      fullValue = '';
    }

    return (
      <Field {...this.props}>
        {this.props.visibilityOptions?.length > 0 && (
          <div
            className="numeric__visibility"
            style={{width: '100%', marginBottom: 'var(--spacing-quarter-unit)'}}
          >
            <RadioBlocks
              options={this.props.visibilityOptions}
              activeOption={this.state.mode}
              onOptionChange={(value) => {
                this.props.updatePlot(value);
                this.setState({mode: value});
              }}
            />
          </div>
        )}
        {(!this.props.visibilityOptions?.length || this.state.mode === this.props.showOn) && (
          <NumericInput
            attr={this.props.attr}
            value={fullValue}
            defaultValue={this.props.defaultValue}
            placeholder={placeholder}
            step={this.props.step}
            stepmode={this.props.stepmode}
            min={this.props.min}
            max={this.props.max}
            onChange={this.props.updatePlot}
            onUpdate={this.props.updatePlot}
            showArrows={!this.props.hideArrows}
            showSlider={this.props.showSlider}
          />
        )}
      </Field>
    );
  }
}

UnconnectedNumeric.propTypes = {
  defaultValue: PropTypes.any,
  fullValue: PropTypes.any,
  min: PropTypes.number,
  max: PropTypes.number,
  multiValued: PropTypes.bool,
  hideArrows: PropTypes.bool,
  showSlider: PropTypes.bool,
  step: PropTypes.number,
  stepmode: PropTypes.string,
  updatePlot: PropTypes.func,
  visibilityOptions: PropTypes.array,
  showOn: PropTypes.any,
  ...Field.propTypes,
};

UnconnectedNumeric.displayName = 'UnconnectedNumeric';

export default connectToContainer(UnconnectedNumeric);
