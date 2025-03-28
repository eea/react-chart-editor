import React, {Component, createRef} from 'react';
import createPlotComponent from 'react-plotly.js/factory';
import PropTypes from 'prop-types';
import {DEFAULT_FONTS} from 'lib/constants';

import EditorControls from './EditorControls';
import DataSourcesEditor from './DataSourcesEditor';

class PlotlyEditor extends Component {
  constructor(props) {
    super();
    this.state = {graphDiv: {}};
    this.editor = createRef();
    this.PlotComponent = createPlotComponent(props.plotly);
    this.handleRender = this.handleRender.bind(this);
  }

  handleRender(fig, graphDiv) {
    this.setState({graphDiv});
    if (this.props.onRender) {
      this.props.onRender(graphDiv.data, graphDiv.layout, graphDiv._transitionData._frames);
    }
  }
  render() {
    return (
      <div className="plotly_editor plotly-editor--theme-provider">
        {!this.props.hideControls && (
          <EditorControls
            ref={this.editor}
            customColors={this.props.customColors}
            graphDiv={this.state.graphDiv}
            dataSources={this.props.dataSources}
            dataSourceOptions={this.props.dataSourceOptions}
            defaults={this.props.defaults}
            plotly={this.props.plotly}
            onUpdate={this.props.onUpdate}
            onUpdateDataSources={this.props.onUpdateDataSources}
            advancedTraceTypeSelector={this.props.advancedTraceTypeSelector}
            locale={this.props.locale}
            traceTypesConfig={this.props.traceTypesConfig}
            dictionaries={this.props.dictionaries}
            showFieldTooltips={this.props.showFieldTooltips}
            srcConverters={this.props.srcConverters}
            makeDefaultTrace={this.props.makeDefaultTrace}
            glByDefault={this.props.glByDefault}
            mapBoxAccess={Boolean(this.props.config && this.props.config.mapboxAccessToken)}
            fontOptions={this.props.fontOptions}
            chartHelp={this.props.chartHelp}
            customConfig={this.props.customConfig}
          >
            {this.props.children}
          </EditorControls>
        )}
        <div className="grid_and_plot">
          <DataSourcesEditor
            data={this.props.data}
            layout={this.props.layout}
            dataSources={this.props.dataSources}
            srcConverters={this.props.srcConverters}
            onUpdate={this.editor.current?.handleUpdate.bind(this.editor.current)}
          />
          <div className="plot_panel">
            <this.PlotComponent
              data={this.props.data}
              layout={this.props.layout}
              frames={this.props.frames}
              config={this.props.config}
              useResizeHandler={this.props.useResizeHandler}
              debug={this.props.debug}
              onInitialized={this.handleRender}
              onUpdate={this.handleRender}
              style={{width: '100%', height: '100%'}}
              divId={this.props.divId}
            />
          </div>
        </div>
      </div>
    );
  }
}

PlotlyEditor.propTypes = {
  children: PropTypes.any,
  layout: PropTypes.object,
  data: PropTypes.array,
  config: PropTypes.object,
  customColors: PropTypes.array,
  defaults: PropTypes.object,
  dataSourceOptions: PropTypes.array,
  dataSources: PropTypes.object,
  frames: PropTypes.array,
  onUpdate: PropTypes.func,
  onUpdateDataSources: PropTypes.func,
  onRender: PropTypes.func,
  plotly: PropTypes.object,
  useResizeHandler: PropTypes.bool,
  debug: PropTypes.bool,
  advancedTraceTypeSelector: PropTypes.bool,
  locale: PropTypes.string,
  traceTypesConfig: PropTypes.object,
  dictionaries: PropTypes.object,
  divId: PropTypes.string,
  hideControls: PropTypes.bool,
  showFieldTooltips: PropTypes.bool,
  srcConverters: PropTypes.shape({
    toSrc: PropTypes.func.isRequired,
    fromSrc: PropTypes.func.isRequired,
  }),
  makeDefaultTrace: PropTypes.func,
  glByDefault: PropTypes.bool,
  fontOptions: PropTypes.array,
  chartHelp: PropTypes.object,
  customConfig: PropTypes.object,
};

PlotlyEditor.defaultProps = {
  hideControls: false,
  showFieldTooltips: false,
  fontOptions: DEFAULT_FONTS,
};

export default PlotlyEditor;
