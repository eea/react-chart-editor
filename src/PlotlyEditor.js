import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import {
  DEFAULT_FONTS,
  DEFAULT_PLOT_HEIGHT,
} from 'lib/constants';
import createPlotComponent from 'lib/createPlotComponent';

import EditorControls from './EditorControls';
import DataSourcesEditor from './DataSourcesEditor';

class PlotlyEditor extends Component {
  constructor(props) {
    super();
    this.state = {
      graphDiv: {},
      dfltGraphDiv: {
        _fullData: [],
        _fullLayout: {},
      },
      dfltData: [],
      dfltLayout: {},
      initialized: false,
    };
    this.EditorControls = createRef();
    this.DataSourcesEditor = createRef();
    this.PlotComponent = createPlotComponent(props.plotly);
    this.handleRender = this.handleRender.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
    this.loadDataSources = this.loadDataSources.bind(this);
    this.renderSlot = this.renderSlot.bind(this);
  }

  handleRender(fig, graphDiv) {
    if (!this.props.forceRender) {
      this.setState({ graphDiv });
    }
    if (this.props.forceRender) {
      this.props.forceRender(fig, graphDiv);
    }
    if (this.props.onRender) {
      this.props.onRender(fig, graphDiv);
    }
  }

  onUpdate({ type, payload }) {
    const editor = this.EditorControls.current;
    return editor.handleUpdate.bind(editor)({ type, payload });
  }

  loadDataSources(dataSources, columns, update) {
    const editor = this.DataSourcesEditor.current;
    return editor.loadDataSources.bind(editor)(dataSources, columns, update);
  }

  renderSlot(slot) {
    return this.props.slots?.[slot] || null;
  }

  render() {
    return (
      <div className="plotly_editor plotly-editor--theme-provider">
        {!this.props.hideControls && (
          <EditorControls
            ref={this.EditorControls}
            customColors={this.props.customColors}
            graphDiv={this.state.graphDiv}
            dfltGraphDiv={this.state.dfltGraphDiv}
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
            ctx={this.props.ctx}
          >
            {this.props.children}
          </EditorControls>
        )}
        <div className="grid_and_plot">
          {this.renderSlot('grid-and-plot')}
          {this.state.initialized && (
            <DataSourcesEditor
              ref={this.DataSourcesEditor}
              data={this.props.data}
              layout={this.props.layout}
              dataSources={this.props.dataSourcesSubset || this.props.dataSources}
              columns={this.props.columns}
              srcConverters={this.props.srcConverters}
              onUpdate={this.onUpdate}
            />
          )}
          <div className="plot_panel" style={{
            '--svg-container-height': `${this.props.layout._height ||
              this.props.layout.height ||
              DEFAULT_PLOT_HEIGHT}px`,
          }}>
            <this.PlotComponent
              data={this.props.data}
              layout={this.props.layout}
              frames={this.props.frames}
              config={this.props.config}
              useResizeHandler={this.props.useResizeHandler}
              debug={this.props.debug}
              onInitialized={(fig, graphDiv) => {
                this.setState({ initialized: true, graphDiv }, () => {
                  const { data, layout, frames } = fig;

                  if (this.props.onInitialized) {
                    this.props.onInitialized(fig, graphDiv);
                  }

                  if (this.props.onUpdate) {
                    this.props.onUpdate(data, layout, frames);
                  }
                });
              }}
              onUpdate={(fig, graphDiv) =>
                this.state.initialized ? this.handleRender(fig, graphDiv) : null
              }
              style={{ width: '100%', height: '100%' }}
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
  dataSources: PropTypes.object,
  dataSourcesSubset: PropTypes.object,
  columns: PropTypes.array,
  dataSourceOptions: PropTypes.array,
  frames: PropTypes.array,
  onUpdate: PropTypes.func,
  onUpdateDataSources: PropTypes.func,
  onRender: PropTypes.func,
  forceRender: PropTypes.func,
  onInitialized: PropTypes.func,
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
  ctx: PropTypes.object,
  slots: PropTypes.objectOf(PropTypes.element),
};

PlotlyEditor.defaultProps = {
  hideControls: false,
  showFieldTooltips: false,
  fontOptions: DEFAULT_FONTS,
};

export default PlotlyEditor;
