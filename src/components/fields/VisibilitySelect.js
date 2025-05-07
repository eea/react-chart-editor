import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connectToContainer} from 'lib';
import {MULTI_VALUED_PLACEHOLDER} from 'lib/constants';
import Field from './Field';
import Radio from './Radio';
import Dropdown from './Dropdown';

export class UnconnectedVisibilitySelect extends Component {
  constructor(props, context) {
    super(props, context);

    this.setMode = this.setMode.bind(this);
    this.setLocals = this.setLocals.bind(this);

    this.setLocals(props);
  }

  UNSAFE_componentWillReceiveProps(props) {
    this.setLocals(props);
  }

  getChildContext() {
    return {
      visibilityMode: this.mode,
      resettable: this.props.resettable ?? this.context.resettable,
    };
  }

  setLocals(props) {
    this.mode =
      props.fullValue === undefined || props.fullValue === MULTI_VALUED_PLACEHOLDER
        ? this.props.defaultOpt
        : props.fullValue;
  }

  setMode(mode) {
    const update = {};
    const {showOn} = this.props;
    const resettable = this.props.resettable ?? this.context.resettable;
    if (resettable && !((Array.isArray(showOn) && showOn.includes(mode)) || mode === showOn)) {
      React.Children.map(this.props.children, (child) => {
        update[child.props.attr] = null;
      });
    }
    this.props.updatePlot(mode, update);
  }

  render() {
    const {dropdown, clearable, options, showOn, attr, label} = this.props;

    return (
      <>
        {dropdown ? (
          <Dropdown
            attr={attr}
            label={label}
            options={options}
            fullValue={this.mode}
            updatePlot={this.setMode}
            clearable={clearable}
          />
        ) : (
          <Radio
            attr={attr}
            label={label}
            options={options}
            fullValue={this.mode}
            updatePlot={this.setMode}
          />
        )}
        {(Array.isArray(showOn) && showOn.includes(this.mode)) || this.mode === showOn
          ? this.props.children
          : null}
      </>
    );
  }
}

UnconnectedVisibilitySelect.propTypes = {
  fullValue: PropTypes.any,
  updatePlot: PropTypes.func,
  onChange: PropTypes.func,
  dropdown: PropTypes.bool,
  clearable: PropTypes.bool,
  showOn: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.bool,
    PropTypes.string,
    PropTypes.array,
  ]),
  resettable: PropTypes.bool,
  defaultOpt: PropTypes.oneOfType([PropTypes.number, PropTypes.bool, PropTypes.string]),
  label: PropTypes.string,
  attr: PropTypes.string,
  ...Field.propTypes,
};

UnconnectedVisibilitySelect.contextTypes = {
  updateContainer: PropTypes.func,
  fullContainer: PropTypes.object,
  resettable: PropTypes.bool,
};

UnconnectedVisibilitySelect.childContextTypes = {
  visibilityMode: PropTypes.any,
  resettable: PropTypes.bool,
};

UnconnectedVisibilitySelect.displayName = 'UnconnectedVisibilitySelect';

UnconnectedVisibilitySelect.plotly_editor_traits = {
  visibility_select: true,
};

export default connectToContainer(UnconnectedVisibilitySelect);
