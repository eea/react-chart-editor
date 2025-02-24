import ColorPicker from '../widgets/ColorPicker';
import Field from './Field';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connectToContainer} from 'lib';

export class UnconnectedColorPicker extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      colorComponentVisibility: false,
    };
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  handleVisibilityChange(isVisible) {
    const newColorComponentVisibility = isVisible;
    this.setState({
      colorComponentVisibility: newColorComponentVisibility,
    });
  }

  render() {
    const {localize: _} = this.context;
    const empty = !this.props.fullValue && this.props.handleEmpty;

    if (empty) {
      return (
        <Field {...this.props}>
          <div className="js-test-info">
            {_('This color is computed from other parts of the figure but you can')}{' '}
            <a
              onClick={() => {
                this.props.updatePlot(this.props.defaultColor);
              }}
            >
              {_('override it')}
            </a>
            .
          </div>
        </Field>
      );
    }

    return (
      <Field {...this.props}>
        {this.props.handleEmpty && (
          <div className="js-test-info" style={{marginBottom: '0.5rem'}}>
            This color can be computed from other parts of the figure by{' '}
            <a
              onClick={() => {
                this.props.updatePlot(null);
              }}
            >
              clearing it
            </a>
            .
          </div>
        )}
        <ColorPicker
          selectedColor={this.props.fullValue}
          onColorChange={this.props.updatePlot}
          onVisibilityChange={(isVisible) =>
            this.handleVisibilityChange(isVisible)
          }
        />
      </Field>
    );
  }
}

UnconnectedColorPicker.propTypes = {
  fullValue: PropTypes.any,
  updatePlot: PropTypes.func,
  handleEmpty: PropTypes.bool,
  defaultColor: PropTypes.string,
  ...Field.propTypes,
};

UnconnectedColorPicker.contextTypes = {
  localize: PropTypes.func,
};

UnconnectedColorPicker.displayName = 'UnconnectedColorPicker';

export default connectToContainer(UnconnectedColorPicker);
