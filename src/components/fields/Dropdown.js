import DropdownWidget from '../widgets/Dropdown';
import Field from './Field';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connectToContainer } from 'lib';

export class UnconnectedDropdown extends Component {
  render() {
    let placeholder;
    if (this.props.multiValued) {
      placeholder = this.props.fullValue;
    }

    return (
      <Field {...this.props}>
        <DropdownWidget
          backgroundDark={this.props.backgroundDark}
          options={this.props.options}
          value={this.props.fullValue}
          onChange={this.props.updatePlot}
          onCreate={this.props.updatePlot}
          clearable={this.props.clearable}
          placeholder={placeholder}
          disabled={this.props.disabled}
          components={this.props.components}
          creatable={this.props.creatable}
          searchable={this.props.searchable}
        />
      </Field>
    );
  }
}

UnconnectedDropdown.propTypes = {
  backgroundDark: PropTypes.bool,
  components: PropTypes.object,
  clearable: PropTypes.bool,
  creatable: PropTypes.bool,
  searchable: PropTypes.bool,
  fullValue: PropTypes.any,
  options: PropTypes.array.isRequired,
  updatePlot: PropTypes.func,
  disabled: PropTypes.bool,
  ...Field.propTypes,
};

UnconnectedDropdown.displayName = 'UnconnectedDropdown';

export default connectToContainer(UnconnectedDropdown);
