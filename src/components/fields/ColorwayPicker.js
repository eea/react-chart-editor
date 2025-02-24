import ColorscalePicker from '../widgets/ColorscalePicker';
import Field from './Field';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connectToContainer} from 'lib';

class UnconnectedColorwayPicker extends Component {
  render() {
    return (
      <Field {...this.props}>
        <ColorscalePicker
          selected={this.props.fullValue}
          onColorscaleChange={this.props.updatePlot}
          initialCategory={this.props.initialCategory || 'categorical'}
          disableCategorySwitch={this.props.disableCategorySwitch}
          attr={this.props.attr}
          editable={this.props.editable}
        />
      </Field>
    );
  }
}

UnconnectedColorwayPicker.propTypes = {
  fullValue: PropTypes.any,
  updatePlot: PropTypes.func,
  ...Field.propTypes,
};

UnconnectedColorwayPicker.displayName = 'UnconnectedColorwayPicker';

export default connectToContainer(UnconnectedColorwayPicker);
