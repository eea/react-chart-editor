import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  AxesRange,
  TickMode,
  DTicks,
  DTicksInterval,
  NTicks,
  TickArrayDataSelector,
  ColorPicker,
  Dropdown,
  FontSelector,
  Numeric,
  NumericFraction,
  Radio,
  TextEditor,
  PlotlySection,
  LayoutPanel,
  AxesFold,
  AxisSide,
  RangesliderVisible,
  RangeSelectorAccordion,
  VisibilitySelect,
  DropdownCustom,
  TickFormat,
  SpikeColor,
} from '../components';

class StyleAxesPanel extends Component {
  render() {
    const {localize: _} = this.context;
    return (
      <LayoutPanel {...this.props}>
        <AxesFold
          name={_('Titles')}
          axisFilter={(axis) => !(axis._name.includes('angular') || axis._subplot.includes('geo'))}
        >
          <TextEditor attr="title.text" />
          <Numeric label={_('Standoff')} attr="title.standoff" units="px" />
          <FontSelector label={_('Typeface')} attr="title.font.family" />
          <Numeric label={_('Font Size')} attr="title.font.size" units="px" />
          <ColorPicker label={_('Font Color')} attr="title.font.color" />
          <Radio
            label={_('Position')}
            attr="title.position"
            options={[
              {label: _('Vertical'), value: 'vertical'},
              {label: _('Horizontal'), value: 'horizontal'},
            ]}
          />
        </AxesFold>

        <AxesFold name={_('Range')}>
          <PlotlySection name={_('Range')} attr="autorange">
            <Dropdown
              attr="type"
              label={_('Type')}
              clearable={false}
              options={[
                {label: _('Linear'), value: 'linear'},
                {label: _('Log'), value: 'log'},
                {label: _('Date'), value: 'date'},
                {label: _('Categorical'), value: 'category'},
                {label: _('Multicategorical'), value: 'multicategory'},
              ]}
            />
            <Radio
              attr="autorange"
              label={_('Range')}
              options={[
                {label: _('Auto'), value: true},
                {label: _('Custom'), value: false},
              ]}
            />
            <AxesRange label={_('Min')} attr="range[0]" />
            <AxesRange label={_('Max')} attr="range[1]" />
            <Numeric label={_('Min')} attr="min" />
            <Dropdown
              attr="rangemode"
              label={_('Range Mode')}
              clearable={false}
              options={[
                {label: _('Normal'), value: 'normal'},
                {label: _('To Zero'), value: 'tozero'},
                {label: _('Non-Negative'), value: 'nonnegative'},
              ]}
            />
          </PlotlySection>
          <PlotlySection name={_('Zoom Interactivity')} attr="fixedrange">
            <Radio
              attr="fixedrange"
              options={[
                {label: _('Enable'), value: false},
                {label: _('Disable'), value: true},
              ]}
            />
          </PlotlySection>
          <Dropdown
            label={_('Direction')}
            attr="direction"
            options={[
              {label: _('Clockwise'), value: 'clockwise'},
              {label: _('Counter Clockwise'), value: 'counterclockwise'},
            ]}
            clearable={false}
          />
        </AxesFold>

        <AxesFold name={_('Lines')}>
          <PlotlySection name={_('Axis Line')} attr="showline">
            <VisibilitySelect
              attr="showline"
              options={[
                {label: _('Show'), value: true},
                {label: _('Hide'), value: false},
              ]}
              showOn={true}
              defaultOpt={true}
            >
              <Numeric label={_('Thickness')} attr="linewidth" units="px" />
              <ColorPicker label={_('Color')} attr="linecolor" />

              <AxisSide label={_('Position')} attr="side" />
              <Radio
                label={_('Mirror Axis')}
                attr="mirror"
                options={[
                  {label: _('On'), value: 'ticks'},
                  {label: _('Off'), value: false},
                ]}
              />
            </VisibilitySelect>
          </PlotlySection>
          <PlotlySection name={_('Grid Lines')} attr="showgrid">
            <VisibilitySelect
              attr="showgrid"
              options={[
                {label: _('Show'), value: true},
                {label: _('Hide'), value: false},
              ]}
              showOn={true}
              defaultOpt={true}
            >
              <Numeric label={_('Thickness')} attr="gridwidth" units="px" />
              <ColorPicker label={_('Color')} attr="gridcolor" />

              <Radio
                label={_('Position On')}
                attr="tickson"
                options={[
                  {label: _('Labels'), value: 'labels'},
                  {label: _('Boundaries'), value: 'boundaries'},
                ]}
              />
            </VisibilitySelect>
          </PlotlySection>
          <PlotlySection name={_('Zero Line')} attr="zeroline">
            <Radio
              attr="zeroline"
              options={[
                {label: _('Show'), value: true},
                {label: _('Hide'), value: false},
              ]}
            />
            <Numeric label={_('Thickness')} attr="zerolinewidth" units="px" />
            <ColorPicker label={_('Color')} attr="zerolinecolor" />
          </PlotlySection>

          <PlotlySection name={_('Axis Background')} attr="showbackground">
            <Radio
              attr="showbackground"
              options={[
                {label: _('Show'), value: true},
                {label: _('Hide'), value: false},
              ]}
            />
            <ColorPicker label={_('Color')} attr="backgroundcolor" />
          </PlotlySection>
        </AxesFold>

        <AxesFold name={_('Tick Labels')} axisFilter={(axis) => !axis._subplot.includes('geo')}>
          <PlotlySection name={_('Tick Labels')} attr="showticklabels">
            <VisibilitySelect
              attr="showticklabels"
              options={[
                {label: _('Show'), value: true},
                {label: _('Hide'), value: false},
              ]}
              showOn={true}
              defaultOpt={true}
            >
              <AxisSide label={_('Position')} attr="side" />
              <Radio
                label={_('Auto margins')}
                attr="automargin"
                options={[
                  {label: _('True'), value: true},
                  {label: _('False'), value: false},
                ]}
              />
              <Radio
                label={_('Position on')}
                attr="tickson"
                options={[
                  {label: _('Labels'), value: 'labels'},
                  {label: _('Boundaries'), value: 'boundaries'},
                ]}
              />
              <FontSelector label={_('Typeface')} attr="tickfont.family" />
              <Numeric label={_('Font Size')} attr="tickfont.size" units="px" />
              <ColorPicker label={_('Font Color')} attr="tickfont.color" />
              <Dropdown
                label={_('Angle')}
                attr="tickangle"
                clearable={false}
                options={[
                  {label: _('Auto'), value: 'auto'},
                  {label: _('0'), value: 0},
                  {label: _('45'), value: 45},
                  {label: _('90'), value: 90},
                  {label: _('135'), value: 135},
                  {label: _('180'), value: 180},
                ]}
              />
              <Radio
                label={_('Separate thousands')}
                attr="separatethousands"
                options={[
                  {label: _('Yes'), value: true},
                  {label: _('No'), value: false},
                ]}
              />
              <TickFormat
                label={_('Label Format')}
                attr="tickformat"
                dafaultOpt=""
                clearable={false}
              />
              <TickFormat
                label={_('Hover Format')}
                attr="hoverformat"
                dafaultOpt=""
                clearable={false}
              />
              <Numeric label={_('Label Shift')} attr="ticklabelshift" units="px" />
              <Numeric label={_('Label Standoff')} attr="ticklabelstandoff" units="px" />
              <Dropdown
                label={_('Exponents')}
                attr="exponentformat"
                clearable={false}
                options={[
                  {label: _('None'), value: 'none'},
                  {label: _('e+6'), value: 'e'},
                  {label: _('E+6'), value: 'E'},
                  {label: _('x10^6'), value: 'power'},
                  {label: _('k/M/G'), value: 'SI'},
                  {label: _('k/M/B'), value: 'B'},
                ]}
              />
              <Dropdown
                label={_('Show Exponents')}
                attr="showexponent"
                clearable={false}
                options={[
                  {label: _('All'), value: 'all'},
                  {label: _('First'), value: 'first'},
                  {label: _('Last'), value: 'last'},
                  {label: _('None'), value: 'none'},
                ]}
              />

              <DropdownCustom
                label={_('Prefix')}
                attr="tickprefix"
                options={[
                  {label: _('None'), value: ''},
                  {label: _('x'), value: 'x'},
                  {label: _('$'), value: '$'},
                  {label: _('#'), value: '#'},
                  {label: _('@'), value: '@'},
                  {label: _('Custom'), value: 'custom'},
                ]}
                customOpt="custom"
                dafaultOpt=""
                clearable={false}
              />
              <Dropdown
                label={_('Show Prefix')}
                attr="showtickprefix"
                options={[
                  {label: _('Every label'), value: 'all'},
                  {label: _('First label'), value: 'first'},
                  {label: _('Last label'), value: 'last'},
                  {label: _('None'), value: 'none'},
                ]}
              />
              <DropdownCustom
                label={_('Suffix')}
                attr="ticksuffix"
                options={[
                  {label: _('None'), value: ''},
                  {label: _('C'), value: 'C'},
                  {label: _('%'), value: '%'},
                  {label: _('^'), value: '^'},
                  {label: _('Custom'), value: 'custom'},
                ]}
                customOpt="custom"
                dafaultOpt=""
                clearable={false}
              />
              <Dropdown
                label={_('Show Suffix')}
                attr="showticksuffix"
                options={[
                  {label: _('Every label'), value: 'all'},
                  {label: _('First label'), value: 'first'},
                  {label: _('Last label'), value: 'last'},
                  {label: _('None'), value: 'none'},
                ]}
              />

              <TickMode
                label={_('Tick Spacing')}
                attr="tickmode"
                options={[
                  {label: _('Auto'), value: 'auto'},
                  {label: _('Linear'), value: 'linear'},
                  {label: _('Array'), value: 'array'},
                ]}
              />

              <DTicks label={_('Step Offset')} attr="tick0" />
              <DTicksInterval label={_('Step Size')} attr="dtick" />
              <NTicks label={_('Max Number of Labels')} attr="nticks" />
              <TickArrayDataSelector label={_('Tick Values')} attr="tickvals" />
              <TickArrayDataSelector label={_('Tick Text')} attr="ticktext" />
            </VisibilitySelect>
          </PlotlySection>
        </AxesFold>
        <AxesFold name={_('Tick Markers')} axisFilter={(axis) => !axis._subplot.includes('geo')}>
          <PlotlySection name={_('Tick Markers')} attr="ticks">
            <VisibilitySelect
              attr="ticks"
              options={[
                {label: _('Inside'), value: 'inside'},
                {label: _('Outside'), value: 'outside'},
                {label: _('Hide'), value: ''},
              ]}
              showOn={['inside', 'outside']}
              defaultOpt={'Outside'}
            >
              <AxisSide label={_('Position')} attr="side" />
              <Radio
                label={_('Position on')}
                attr="tickson"
                options={[
                  {label: _('Labels'), value: 'labels'},
                  {label: _('Boundaries'), value: 'boundaries'},
                ]}
              />
              <Numeric label={_('Length')} attr="ticklen" units="px" />
              <Numeric label={_('Width')} attr="tickwidth" units="px" />
              <ColorPicker label={_('Color')} attr="tickcolor" />
            </VisibilitySelect>
          </PlotlySection>
          <PlotlySection name={_('Multicategory Dividers')} attr="showdividers">
            <VisibilitySelect
              attr="showdividers"
              options={[
                {label: _('Show'), value: true},
                {label: _('Hide'), value: false},
              ]}
              showOn={true}
            >
              <Numeric label={_('Width')} attr="dividerwidth" units="px" />
              <ColorPicker label={_('Color')} attr="dividercolor" />
            </VisibilitySelect>
          </PlotlySection>
        </AxesFold>

        <AxesFold name={_('Range Slider')} axisFilter={(axis) => axis._attr === 'xaxis'}>
          <RangesliderVisible
            attr="rangeslider.visible"
            options={[
              {label: _('Show'), value: true},
              {label: _('Hide'), value: false},
            ]}
          />
          <NumericFraction label={_('Height')} attr="rangeslider.thickness" />
          <ColorPicker label={_('Background Color')} attr="rangeslider.bgcolor" />
          <Numeric label={_('Border Width')} attr="rangeslider.borderwidth" units="px" />
          <ColorPicker label={_('Border Color')} attr="rangeslider.bordercolor" />
        </AxesFold>

        <AxesFold
          name={_('Timescale Buttons')}
          axisFilter={(axis) => axis._subplot.includes('xaxis') && axis.type === 'date'}
        >
          <Radio
            attr="rangeselector.visible"
            options={[
              {label: _('Show'), value: true},
              {label: _('Hide'), value: false},
            ]}
          />

          <RangeSelectorAccordion>
            <TextEditor attr="label" label={_('Label')} show />
            <Numeric label={_('Count')} attr="count" />
            <Dropdown
              label={_('Step')}
              attr="step"
              clearable={false}
              options={[
                {label: _('Year'), value: 'year'},
                {label: _('Month'), value: 'month'},
                {label: _('Day'), value: 'day'},
                {label: _('Hour'), value: 'hour'},
                {label: _('Minute'), value: 'minute'},
                {label: _('Second'), value: 'second'},
                {label: _('All'), value: 'all'},
              ]}
            />
            <Dropdown
              label={_('Stepmode')}
              attr="stepmode"
              clearable={false}
              options={[
                {label: _('To Date'), value: 'todate'},
                {label: _('Backward'), value: 'backward'},
              ]}
            />
          </RangeSelectorAccordion>
          <PlotlySection name={_('Text')}>
            <FontSelector label={_('Typeface')} attr="rangeselector.font.family" />
            <Numeric label={_('Font Size')} attr="rangeselector.font.size" units="px" />
            <ColorPicker label={_('Font Color')} attr="rangeselector.font.color" />
          </PlotlySection>
          <PlotlySection name={_('Style')}>
            <ColorPicker label={_('Background Color')} attr="rangeselector.bgcolor" />
            <ColorPicker label={_('Active Color')} attr="rangeselector.activecolor" />
            <Numeric label={_('Border Width')} attr="rangeselector.borderwidth" units="px" />
            <ColorPicker label={_('Border Color')} attr="rangeselector.bordercolor" />
          </PlotlySection>
          <PlotlySection name={_('Horizontal Positioning')}>
            <Dropdown
              label={_('Anchor Point')}
              clearable={false}
              attr="rangeselector.xanchor"
              options={[
                {label: _('Auto'), value: 'auto'},
                {label: _('Left'), value: 'left'},
                {label: _('Center'), value: 'center'},
                {label: _('Right'), value: 'right'},
              ]}
            />
            <Numeric label={_('Position')} step={0.02} attr="rangeselector.x" />
          </PlotlySection>
          <PlotlySection name={_('Vertical Positioning')}>
            <Dropdown
              label={_('Anchor Point')}
              clearable={false}
              attr="rangeselector.yanchor"
              options={[
                {label: _('Auto'), value: 'auto'},
                {label: _('Top'), value: 'top'},
                {label: _('Middle'), value: 'middle'},
                {label: _('Bottom'), value: 'bottom'},
              ]}
            />
            <Numeric label={_('Position')} step={0.02} attr="rangeselector.y" />
          </PlotlySection>
        </AxesFold>

        <AxesFold
          name={_('Spike Lines')}
          axisFilter={(axis) =>
            !(
              axis._subplot.includes('ternary') ||
              axis._subplot.includes('polar') ||
              axis._subplot.includes('geo')
            )
          }
        >
          <Radio
            attr="showspikes"
            options={[
              {label: _('Show'), value: true},
              {label: _('Hide'), value: false},
            ]}
          />
          <Dropdown
            attr="spikemode"
            label={_('Mode')}
            options={[
              {label: _('To Axis'), value: 'toaxis'},
              {label: _('To Marker'), value: 'marker'},
              {label: _('Across'), value: 'across'},
            ]}
          />
          <Dropdown
            attr="spikedash"
            label={_('Dash')}
            options={[
              {label: _('Dash'), value: 'dash'},
              {label: _('Solid'), value: 'solid'},
              {label: _('Dot'), value: 'dot'},
              {label: _('Long Dash'), value: 'longdash'},
              {label: _('Dash Dot'), value: 'dashdot'},
              {label: _('Long Dash Dot'), value: 'longdashdot'},
            ]}
          />
          <Dropdown
            attr="spikesnap"
            label={_('Snap')}
            options={[
              {label: _('Hovered data'), value: 'hovered data'},
              {label: _('Data'), value: 'data'},
              {label: _('Cursor'), value: 'cursor'},
            ]}
          />
          <Numeric label={_('Thickness')} attr="spikethickness" units="px" />
          <SpikeColor label={_('Color')} attr="spikecolor" defaultColor="808285" handleEmpty />
        </AxesFold>
      </LayoutPanel>
    );
  }
}

StyleAxesPanel.contextTypes = {
  fullLayout: PropTypes.object,
  localize: PropTypes.func,
};

export default StyleAxesPanel;
