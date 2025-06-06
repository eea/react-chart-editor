import React, {Component} from 'react';
import {hot} from 'react-hot-loader/root';
import plotly from 'plotly.js/dist/plotly-with-meta';
import '../src/styles/main.scss';
import AceEditor from 'react-ace';
import Select from 'react-select';
import PlotlyEditor, {DefaultEditor, Panel} from '../src';
import Inspector from 'react-inspector';
// import dataSources from './dataSources';

// https://github.com/plotly/react-chart-editor#mapbox-access-tokens
import ACCESS_TOKENS from '../accessTokens';

// import {customConfigTest} from './customConfigTest';

const config = {mapboxAccessToken: ACCESS_TOKENS.MAPBOX, editable: true};

// eslint-disable-next-line no-unused-vars
const traceTypesConfig = {
  traces: (_) => [
    {
      value: 'scatter',
      icon: 'scatter',
      label: _('Scatter'),
    },
    {
      value: 'line',
      label: _('Line'),
    },
    {
      value: 'area',
      label: _('Area'),
    },
    {
      value: 'bar',
      label: _('Bar'),
    },
    {
      value: 'histogram',
      label: _('Histogram'),
    },
    {
      value: 'table',
      label: _('Table'),
    },
    {
      value: 'pie',
      label: _('Pie'),
    },
    {
      value: 'box',
      label: _('Box'),
    },
    {
      value: 'histogram2d',
      label: _('Histogram 2D'),
    },
  ],
  complex: true,
};

// eslint-disable-next-line no-unused-vars
const chartHelp = {
  scatter: {helpDoc: 'https://plotly.com/javascript/line-and-scatter/', feedQuery: true},
  bar: {
    helpDoc: 'https://plotly.com/javascript/bar-charts/',
    feedQuery: true,
  },
  line: {
    helpDoc: 'https://plotly.com/javascript/line-charts/',
    feedQuery: true,
  },
  area: {
    helpDoc: 'https://plotly.com/javascript/filled-area-plots/',
    feedQuery: true,
  },
  heatmap: {helpDoc: 'https://plotly.com/javascript/heatmaps/', feedQuery: true},
  table: {helpDoc: 'https://plotly.com/javascript/table/', feedQuery: true},
  contour: {helpDoc: 'https://plotly.com/javascript/contour-plots/', feedQuery: true},
  pie: {helpDoc: 'https://plotly.com/javascript/pie-charts/', feedQuery: true},
  box: {helpDoc: 'https://plotly.com/javascript/box-plots/', feedQuery: true},
  histogram: {helpDoc: 'https://plotly.com/javascript/histograms/', feedQuery: true},
  histogram2d: {helpDoc: 'https://plotly.com/javascript/2D-Histogram/', feedQuery: true},
  histogram2dcontour: {
    helpDoc: 'https://plotly.com/javascript/2d-histogram-contour/',
    feedQuery: true,
  },
  scatter3d: {helpDoc: 'https://plotly.com/javascript/3d-scatter-plots/', feedQuery: true},
  line3d: {helpDoc: 'https://plotly.com/javascript/3d-line-plots/', feedQuery: true},
  surface: {helpDoc: 'https://plotly.com/javascript/3d-surface-plots/', feedQuery: true},
  mesh3d: {helpDoc: 'https://plotly.com/javascript/3d-mesh/', feedQuery: true},
  cone: {helpDoc: 'https://plotly.com/javascript/cone-plot/', feedQuery: true},
  streamtube: {helpDoc: 'https://plotly.com/javascript/streamtube-plot/', feedQuery: true},
  scattermapbox: {
    helpDoc: 'https://plotly.com/javascript/scatter-tile-maps/',
    feedQuery: true,
  },
  scattergeo: {
    helpDoc: 'https://plotly.com/javascript/scatter-plots-on-maps/',
    feedQuery: true,
  },
  choroplethmapbox: {
    helpDoc: 'https://plotly.com/javascript/tile-county-choropleth/',
    feedQuery: true,
  },
  choropleth: {helpDoc: 'https://plotly.com/javascript/choropleth-maps/', feedQuery: true},
  densitymapbox: {
    helpDoc: 'https://plotly.com/javascript/tile-density-heatmaps/',
    feedQuery: true,
  },
  candlestick: {helpDoc: 'https://plotly.com/javascript/candlestick-charts/', feedQuery: true},
  ohlc: {helpDoc: 'https://plotly.com/javascript/ohlc-charts/', feedQuery: true},
  waterfall: {helpDoc: 'https://plotly.com/javascript/waterfall-charts/', feedQuery: true},
  funnel: {helpDoc: 'https://plotly.com/javascript/funnel-charts/', feedQuery: true},
  funnelarea: {
    helpDoc: 'https://plotly.com/javascript/funnel-charts/#funnelarea-plot',
    feedQuery: true,
  },
  scatterpolar: {helpDoc: 'https://plotly.com/javascript/polar-chart/', feedQuery: true},
  barpolar: {helpDoc: '', feedQuery: true},
  scatterternary: {helpDoc: 'https://plotly.com/javascript/ternary-plots/', feedQuery: true},
  sunburst: {helpDoc: 'https://plotly.com/javascript/sunburst-charts/', feedQuery: true},
  treemap: {helpDoc: 'https://plotly.com/javascript/treemaps/', feedQuery: true},
  sankey: {helpDoc: 'https://plotly.com/javascript/sankey-diagram/', feedQuery: true},
};

class App extends Component {
  constructor() {
    super();

    this.state = {
      forceRender: {},
      data: [],
      layout: {
        margin: {
          t: 0,
          b: 0,
          l: 0,
          r: 0,
        },
        xaxis: {
          automargin: true,
        },
        yaxis: {
          automargin: true,
        },
        // template: {
        //   data: {
        //     bar: [
        //       {
        //         marker: {
        //           color: '#FF0000',
        //         },
        //       },
        //       {
        //         marker: {
        //           color: 'rgb(0,255,0)',
        //         },
        //       },
        //     ],
        //   },
        //   layout: {
        //     margin: {
        //       t: 0,
        //     },
        //     font: {
        //       size: 16,
        //       color: 'rgb(255,0,0)',
        //     },
        //     annotationdefaults: {
        //       showarrow: false,
        //     },
        //     imagedefaults: {
        //       layer: 'below',
        //     },
        //     colorscale: {
        //       sequential: [
        //         [0, '#c8fff8'],
        //         [0.17, '#a0e5dc'],
        //         [0.33, '#78cac0'],
        //         [0.5, '#50b0a4'],
        //         [0.67, '#289588'],
        //         [0.83, '#007b6c'],
        //         [1, '#005248'],
        //       ],
        //     },
        //     yaxis: {
        //       automargin: true,
        //     },
        //   },
        // },
      },
      frames: [],
      dataSources: {
        Day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        'Time of day': ['Morning', 'Afternoon', 'Evening'],
        'Monday tasks': ['22', '12', '10'],
        'Tuesday tasks': ['22', '32', '4'],
        'Wednesday tasks': ['3', '44', '12'],
        'Thursday tasks': ['3', '43', '22'],
        'Friday tasks': ['13', '14', '3'],
      },
      currentMockIndex: -1,
      mocks: [],
    };

    this.loadMock = this.loadMock.bind(this);
    this.loadJSON = this.loadJSON.bind(this);
    this.updateState = this.updateState.bind(this);
    this.editor = React.createRef();
  }

  UNSAFE_componentWillMount() {
    // curl https://api.github.com/repos/plotly/plotly.js/contents/test/image/mocks \
    // | jq '[.[] | .name ]' > mocks.json
    fetch('/mocks.json')
      .then((response) => response.json())
      .then((mocks) => this.setState({mocks}));
  }

  loadMock(mockIndex) {
    const mockName = this.state.mocks[mockIndex];
    const prefix =
      mockName[0] === '/'
        ? ''
        : 'https://api.github.com/repos/plotly/plotly.js/contents/test/image/mocks/';
    fetch(prefix + mockName, {
      headers: new Headers({Accept: 'application/vnd.github.v3.raw'}),
    })
      .then((response) => response.json())
      .then((figure) => {
        const {data, layout, frames} = figure;
        this.updateState(data, layout, frames, mockIndex);
      });
  }

  updateState(data, layout, frames, currentMockIndex) {
    this.setState({
      data,
      layout,
      frames,
      currentMockIndex,
      full: 'hit refresh',
      json_error: false,
      json_string: JSON.stringify({data, layout, frames}, null, 2),
    });
  }

  loadJSON() {
    try {
      const {data, layout, frames} = JSON.parse(this.state.json_string);
      this.updateState(data, layout, frames);
    } catch (e) {
      this.setState({json_error: true});
    }
  }

  render() {
    const dataSourceOptions = Object.keys(this.state.dataSources).map((name) => ({
      value: name,
      label: name,
    }));

    return (
      <div className="app">
        <PlotlyEditor
          ref={this.editor}
          data={this.state.data}
          layout={this.state.layout}
          frames={this.state.frames}
          config={config}
          dataSources={this.state.dataSources}
          dataSourceOptions={dataSourceOptions}
          plotly={plotly}
          onUpdate={this.updateState}
          onUpdateDataSources={(dataSources) => this.setState({dataSources})}
          forceRender={() => this.setState({forceRender: {}})}
          divId="gd"
          useResizeHandler
          debug
          advancedTraceTypeSelector
          showFieldTooltips
          makeDefaultTrace={() => ({type: 'bar', orientation: 'v'})}
          // glByDefault
          // traceTypesConfig={traceTypesConfig}
          // makeDefaultTrace={() => ({type: 'scattergl', mode: 'markers'})}
          // fontOptions={[{label:'Arial', value: 'arial'}]}
          chartHelp={chartHelp}
          // customConfig={customConfigTest}
        >
          <DefaultEditor
          // menuPanelOrder={[
          //   {group: 'Dev', name: 'JSON'},
          //   {group: 'Dev', name: 'Inspector'},
          //   {group: 'Structure', name: 'Create'},
          //   {group: 'Structure', name: 'Subplots'},
          //   {group: 'Structure', name: 'Transforms'},
          //   {group: 'Test', name: 'Testing'},
          //   {group: 'Style', name: 'General'},
          //   {group: 'Style', name: 'Traces'},
          //   {group: 'Style', name: 'Axes'},
          //   {group: 'Style', name: 'Legend'},
          //   {group: 'Style', name: 'Color Bars'},
          //   {group: 'Style', name: 'Annotation'},
          //   {group: 'Style', name: 'Shapes'},
          //   {group: 'Style', name: 'Images'},
          //   {group: 'Style', name: 'Sliders'},
          //   {group: 'Style', name: 'Menus'},
          // ]}
          >
            <Panel group="Dev" name="JSON">
              <div className="mocks">
                <Select
                  clearable={false}
                  value={this.state.currentMockIndex}
                  name="mock-dropdown"
                  options={this.state.mocks.map((item, i) => ({
                    label: item,
                    value: i,
                  }))}
                  searchable={true}
                  searchPromptText="Search for a mock"
                  onChange={(option) => this.loadMock(option.value)}
                  noResultsText={'No Results'}
                  placeholder={'Search for a mock'}
                />
              </div>
              <button
                className="devbtn"
                onClick={this.loadJSON}
                style={{background: this.state.json_error ? 'pink' : 'white'}}
              >
                Save
              </button>
              <AceEditor
                mode="json"
                theme="textmate"
                onChange={(json_string) => this.setState({json_string})}
                value={this.state.json_string}
                name="UNIQUE_ID_OF_DIV"
                style={{height: '80vh'}}
                setOptions={{
                  showLineNumbers: false,
                  tabSize: 2,
                }}
                commands={[
                  {
                    name: 'save',
                    bindKey: {win: 'Ctrl-s', mac: 'Command-s'},
                    exec: this.loadJSON,
                  },
                ]}
                editorProps={{$blockScrolling: true}}
              />
            </Panel>
            <Panel group="Dev" name="Inspector">
              <button
                className="devbtn"
                onClick={() => {
                  const gd = document.getElementById('gd') || {};
                  this.setState({
                    full: {
                      _fullData: gd._fullData || [],
                      _fullLayout: gd._fullLayout || {},
                    },
                  });
                }}
              >
                Refresh
              </button>
              <div style={{height: '80vh'}}>
                <Inspector data={{_full: this.state.full}} expandLevel={2} sortObjectKeys={true} />
              </div>
            </Panel>
          </DefaultEditor>
        </PlotlyEditor>
      </div>
    );
  }
}

export default hot(App);
