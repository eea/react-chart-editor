import React, {Component, createRef} from 'react';
import createPlotComponent from 'react-plotly.js/factory';
import PropTypes from 'prop-types';
import {DEFAULT_FONTS, MIN_PLOT_HEIGHT} from 'lib/constants';

import EditorControls from './EditorControls';
import DataSourcesEditor from './DataSourcesEditor';

class PlotlyEditor extends Component {
  constructor(props) {
    super();
    this.state = {graphDiv: {}};
    this.EditorControls = createRef();
    this.DataSourcesEditor = createRef();
    this.PlotComponent = createPlotComponent(props.plotly);
    this.handleRender = this.handleRender.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
    this.loadDataSources = this.loadDataSources.bind(this);
    this.onPlotResize = this.onPlotResize.bind(this);
    this.renderSlot = this.renderSlot.bind(this);
  }

  handleRender(fig, graphDiv) {
    this.setState({graphDiv});
    if (this.props.onRender) {
      this.props.onRender(graphDiv.data, graphDiv.layout, graphDiv._transitionData._frames);
    }
  }

  onUpdate({type, payload}) {
    const editor = this.EditorControls.current;
    return editor.handleUpdate({type, payload}).bind(editor);
  }

  loadDataSources(dataSources) {
    const editor = this.DataSourcesEditor.current;
    return editor.loadDataSources(dataSources).bind(editor);
  }

  onPlotResize() {
    const containerEl = document.querySelector('.grid_and_plot');
    const gridEl = containerEl.querySelector('.grid_panel');
    const previewEl = containerEl.querySelector('.grid_panel__resize-preview');
    const plotEl = containerEl.querySelector('.plot_panel');

    requestAnimationFrame(() => {
      plotEl.style.height =
        Math.max(
          MIN_PLOT_HEIGHT,
          containerEl.clientHeight - (gridEl.offsetHeight + previewEl.offsetHeight)
        ) + 'px';
      window.dispatchEvent(new Event('resize'));
    });
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
          <DataSourcesEditor
            ref={this.DataSourcesEditor}
            data={this.props.data}
            layout={this.props.layout}
            dataSources={this.props.dataSources}
            srcConverters={this.props.srcConverters}
            onUpdate={this.onUpdate}
            onPlotResize={this.onPlotResize}
          />
          <div className="plot_panel">
            <this.PlotComponent
              data={this.props.data}
              layout={this.props.layout}
              frames={this.props.frames}
              config={this.props.config}
              useResizeHandler={this.props.useResizeHandler}
              debug={this.props.debug}
              onInitialized={(...args) => {
                this.handleRender(...args);
                this.onPlotResize();
                if (this.props.onInitialized) {
                  this.props.onInitialized(...args);
                }
              }}
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
