import React, {Component} from 'react';
import PropTypes from 'prop-types';
import isNil from 'lodash/isNil';
import {HyperFormula} from 'hyperformula';
import Handsontable from 'handsontable/base';
import {getAttrsPath, getData, getSrcAttr, inSrcAttr} from 'lib';
import {
  registerPlugin,
  AutoColumnSize,
  Autofill,
  BindRowsWithHeaders,
  CopyPaste,
  ContextMenu,
  DragToScroll,
  DropdownMenu,
  Formulas,
  ManualColumnMove,
  ManualColumnResize,
  UndoRedo,
} from 'handsontable/plugins';
import {EDITOR_ACTIONS, TRACE_SRC_ATTRIBUTES, LAYOUT_SRC_ATTRIBUTES} from './lib/constants';

// Register plugins
registerPlugin(AutoColumnSize);
registerPlugin(Autofill);
registerPlugin(BindRowsWithHeaders);
registerPlugin(CopyPaste);
registerPlugin(ContextMenu);
registerPlugin(DragToScroll);
registerPlugin(DropdownMenu);
registerPlugin(Formulas);
registerPlugin(ManualColumnMove);
registerPlugin(ManualColumnResize);
registerPlugin(UndoRedo);

const MIN_ROWS = 10;
const MIN_COLS = 10;
const MIN_GRID_HEIGHT = 50;

function getContextMenuItemTrigger(hot, name, trigger) {
  return hot.getPlugin('ContextMenu').itemsFactory.predefinedItems[name]?.[trigger]?.bind(hot);
}

class DataSourcesEditor extends Component {
  constructor() {
    super();
    this.hot = null;
    this.colHeaders = null;
    this.gridPanelRef = React.createRef();
    this.deserialize = this.deserialize.bind(this);
    this.serialize = this.serialize.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
    this.isSingleColumnSelected = this.isSingleColumnSelected.bind(this);
    this.renameColumn = this.renameColumn.bind(this);
  }

  componentDidMount() {
    const self = this;
    const container = document.getElementById('hot-table');
    this.colHeaders = Object.keys(this.props.dataSources);

    const contextMenu = {
      items: {
        row_above: {
          name: 'Insert row(s) above',
          hidden() {
            return getContextMenuItemTrigger(this, 'row_above', 'disabled')();
          },
          callback() {
            const rows = Number(prompt('Enter number of rows:', 1)) || 1;
            const latestSelection = this.getSelectedRangeLast().getTopRightCorner();
            this.alter('insert_row_above', latestSelection.row, rows, 'ContextMenu.rowAbove');
          },
        },
        row_below: {
          name: 'Insert row(s) below',
          hidden() {
            return getContextMenuItemTrigger(this, 'row_below', 'disabled')();
          },
          callback() {
            const rows = Number(prompt('Enter number of rows:', 1)) || 1;
            const latestSelection = this.getSelectedRangeLast().getBottomRightCorner();
            this.alter('insert_row_below', latestSelection.row, rows, 'ContextMenu.rowBelow');
          },
        },
        col_left: {
          name: 'Insert cols(s) to the left',
          hidden() {
            return getContextMenuItemTrigger(this, 'col_left', 'disabled')();
          },
          callback() {
            const cols = Number(prompt('Enter number of columns:', 1)) || 1;
            const latestSelection = this.getSelectedRangeLast().getTopLeftCorner();
            const alterAction = this.isRtl() ? 'insert_col_end' : 'insert_col_start';
            this.alter(alterAction, latestSelection.col, cols, 'ContextMenu.columnLeft');
          },
        },
        col_right: {
          name: 'Insert cols(s) to the right',
          hidden() {
            return getContextMenuItemTrigger(this, 'col_right', 'disabled')();
          },
          callback() {
            const cols = Number(prompt('Enter number of columns:', 1)) || 1;
            const latestSelection = this.getSelectedRangeLast().getTopRightCorner();
            const alterAction = this.isRtl() ? 'insert_col_start' : 'insert_col_end';
            this.alter(alterAction, latestSelection.col, cols, 'ContextMenu.columnRight');
          },
        },
        sp1: '---------',
        rename_col: {
          name: 'Rename column',
          hidden() {
            return !self.isSingleColumnSelected(this);
          },
          disabled() {
            return !self.isSingleColumnSelected(this);
          },
          callback() {
            self.renameColumn(this.getSelectedLast()[1]);
          },
        },
        remove_row: {
          hidden() {
            return getContextMenuItemTrigger(this, 'remove_row', 'disabled')();
          },
        },
        remove_col: {
          hidden() {
            return getContextMenuItemTrigger(this, 'remove_col', 'disabled')();
          },
        },
        clear_column: {
          hidden() {
            return (
              getContextMenuItemTrigger(this, 'clear_column', 'disabled')() ||
              !self.isSingleColumnSelected(this)
            );
          },
        },
        sp2: '---------',
        undo: 'undo',
        redo: 'redo',
      },
    };

    this.hot = new Handsontable(container, {
      data: this.deserialize(),
      width: '100%',
      height: 320,
      rowHeaders: true,
      colHeaders: this.colHeaders,
      minRows: MIN_ROWS,
      minCols: Math.max(MIN_COLS, this.colHeaders.length),
      autoWrapRow: true,
      autoWrapCol: true,
      contextMenu,
      autoColumnSize: {
        useHeaders: true,
      },
      fillHandle: 'vertical',
      licenseKey: 'non-commercial-and-evaluation',
      // Plugins
      bindRowsWithHeaders: true,
      copyPaste: true,
      manualColumnMove: true,
      manualColumnResize: true,
      formulas: {
        engine: HyperFormula,
      },
      // Hooks
      afterChange(changes, source) {
        if (source === 'loadData') {
          return;
        }
        self.onUpdate(changes, 'edit');
      },
      afterUpdateSettings(settings) {
        if (settings.colHeaders && settings.colHeaders.length === self.colHeaders.length) {
          self.onUpdate(
            settings.colHeaders.reduce((acc, header, index) => {
              if (!acc.old || !acc.new) {
                acc.old = [];
                acc.new = [];
              }
              if (header !== self.colHeaders[index]) {
                acc.old.push(self.colHeaders[index]);
                acc.new.push(header);
              }
              return acc;
            }, {}),
            'edit-headers'
          );
        }
        if (settings.colHeaders && settings.colHeaders.length !== self.colHeaders.length) {
          self.onUpdate(settings.colHeaders, 'replace-headers');
        }
      },
      afterCreateCol(index, amount) {
        self.onUpdate({index, amount}, 'create-col');
      },
      afterCreateRow(index, amount) {
        self.onUpdate({index, amount}, 'create-row');
      },
      afterColumnMove(movedColumns, finalIndex, dropIndex, movePossible, orderChanged) {
        self.onUpdate(
          {movedColumns, finalIndex, dropIndex, movePossible, orderChanged},
          'move-col'
        );
      },
      afterOnCellMouseDown(e, coords) {
        const isButton = e.target?.nodeName === 'BUTTON';
        if (coords.row > -1 || coords.col === -1 || e.detail !== 2 || isButton) {
          return;
        }
        setTimeout(() => {
          self.renameColumn(coords.col);
        }, 100);
      },
    });
  }

  componentWillUnmount() {
    this.hot.destroy();
  }

  deserialize() {
    let col = 0;
    return Object.entries(this.props.dataSources).reduce((acc, [_, value]) => {
      value.forEach((_, i) => {
        if (!acc[i]) {
          acc[i] = [];
        }
        acc[i][col] = value[i];
      });
      ++col;
      return acc;
    }, []);
  }

  serialize() {
    const dataSources = {};
    const data = this.hot.getData();
    this.colHeaders = this.hot.getColHeader();

    this.colHeaders.forEach((header, i) => {
      const emptyRange = [-1, -1];
      const colData = data.map((row, j) => {
        if (isNil(row[i])) {
          emptyRange[1] = j + 1;
        } else {
          emptyRange[0] = j + 1;
          emptyRange[1] = j + 1;
        }
        return row[i];
      });
      if (emptyRange[0] === -1 || !colData.length) {
        return;
      }
      const emptyRows = emptyRange[1] - emptyRange[0];
      if (emptyRows > 0 && emptyRows === colData.length) {
        return;
      }
      if (emptyRows > 0 && emptyRange[1] === colData.length) {
        dataSources[header] = colData.slice(0, emptyRange[0]);
      } else {
        dataSources[header] = colData;
      }
    });

    return dataSources;
  }

  onUpdate(changes, source) {
    requestAnimationFrame(() => {
      const update = {};
      const dataSources = this.serialize();

      this.props.data.forEach((trace, i) => {
        const attrs = getAttrsPath(trace, TRACE_SRC_ATTRIBUTES);

        Object.entries(attrs).forEach(([attr]) => {
          const srcAttr = getSrcAttr(trace, attr, this.props.srcConverters);

          switch (source) {
            case 'edit': {
              const colHeader = this.hot.getColHeader(changes.map((change) => change[1]));
              if (inSrcAttr(srcAttr, colHeader)) {
                const data = getData(trace, srcAttr, dataSources);
                update[attr] = data;
              }
              break;
            }
            default:
              break;
          }
        });
        console.log(update);
        this.props.onUpdate({
          type: EDITOR_ACTIONS.UPDATE_TRACES,
          payload: {
            update,
            traceIndexes: [i],
          },
        });
      });

      this.props.onUpdate({
        type: EDITOR_ACTIONS.UPDATE_DATA_SOURCES,
        payload: {
          dataSources,
        },
      });
    });
  }

  isSingleColumnSelected() {
    const ranges = this.hot.getSelectedRange() || [];
    let start = Infinity;
    let end = -Infinity;

    ranges.forEach((cellRange) => {
      if (cellRange.from.col < start) {
        start = cellRange.from.col;
      }
      if (cellRange.to.col > end) {
        end = cellRange.to.col;
      }
    });

    return ranges.length && start - end === 0;
  }

  renameColumn(colIndex) {
    const colHeaders = this.hot.getColHeader();
    const newColHeader = prompt('Enter new column name:', colHeaders[colIndex]);
    if (!newColHeader) {
      return;
    }
    colHeaders[colIndex] = newColHeader;
    this.hot.updateSettings({
      colHeaders,
    });
  }

  render() {
    return (
      <>
        <div className="grid_panel" ref={this.gridPanelRef}>
          <div id="hot-table" className="ht-theme-main" />
        </div>
        <div
          className="grid_panel__resize-bar"
          onMouseDown={(e) => {
            e.preventDefault();
            const startY = e.clientY;
            const startHeight = this.hot.getSettings().height;

            const handleMouseMove = (e) => {
              e.preventDefault();
              const deltaY = e.clientY - startY;
              const newHeight = Math.max(MIN_GRID_HEIGHT, startHeight + deltaY);
              this.hot.updateSettings({
                height: newHeight,
              });
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        >
          <div className="grid_panel__resize-divider" />
        </div>
      </>
    );
  }
}

DataSourcesEditor.propTypes = {
  data: PropTypes.array,
  layout: PropTypes.object,
  dataSources: PropTypes.object,
  srcConverters: PropTypes.shape({
    toSrc: PropTypes.func.isRequired,
    fromSrc: PropTypes.func.isRequired,
  }),
  onUpdate: PropTypes.func,
};

export default DataSourcesEditor;
