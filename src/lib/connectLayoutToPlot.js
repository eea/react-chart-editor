import React, {Component} from 'react';
import PropTypes from 'prop-types';
import nestedProperty from 'plotly.js/src/lib/nested_property';
import {getDisplayName} from '../lib';
import {EDITOR_ACTIONS} from './constants';

export default function connectLayoutToPlot(WrappedComponent) {
  class LayoutConnectedComponent extends Component {
    getChildContext() {
      const {layout, fullLayout, dfltGraphDiv, plotly, onUpdate} = this.context;

      const updateContainer = (update) => {
        if (!onUpdate) {
          return;
        }
        onUpdate({
          type: EDITOR_ACTIONS.UPDATE_LAYOUT,
          payload: {
            update,
          },
        });
      };

      return {
        getDflt: (attr) => {
          return (
            nestedProperty(dfltGraphDiv._fullLayout._template || {}, attr).get() ??
            nestedProperty(dfltGraphDiv._fullLayout, attr).get()
          );
        },
        getValObject: (attr) =>
          !plotly
            ? null
            : plotly.PlotSchema.getLayoutValObject(fullLayout, nestedProperty({}, attr).parts),
        updateContainer,
        container: layout,
        fullContainer: fullLayout,
      };
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  }

  LayoutConnectedComponent.displayName = `LayoutConnected${getDisplayName(WrappedComponent)}`;

  LayoutConnectedComponent.contextTypes = {
    layout: PropTypes.object,
    fullLayout: PropTypes.object,
    plotly: PropTypes.object,
    onUpdate: PropTypes.func,
    dfltGraphDiv: PropTypes.any,
  };

  LayoutConnectedComponent.childContextTypes = {
    getDflt: PropTypes.func,
    getValObject: PropTypes.func,
    updateContainer: PropTypes.func,
    container: PropTypes.object,
    fullContainer: PropTypes.object,
  };

  const {plotly_editor_traits} = WrappedComponent;
  LayoutConnectedComponent.plotly_editor_traits = plotly_editor_traits;

  return LayoutConnectedComponent;
}
