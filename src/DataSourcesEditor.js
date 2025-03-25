import React, {Component} from 'react';
import PropTypes from 'prop-types';
import isNil from 'lodash/isNil';
import isEqual from 'lodash/isEqual';
import {HyperFormula} from 'hyperformula';
import Handsontable from 'handsontable/base';
import {getAdjustedSrcAttr, getAttrsPath, getData, getSrcAttr, inSrcAttr} from 'lib';
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
  ManualColumnResize,
  UndoRedo,
} from 'handsontable/plugins';
import {
  EDITOR_ACTIONS,
  TRACE_SRC_ATTRIBUTES,
  LAYOUT_SRC_ATTRIBUTES,
  MIN_GRID_HEIGHT,
} from './lib/constants';
import {getColumnNames} from 'lib/dereference';

// Register plugins
registerPlugin(AutoColumnSize);
registerPlugin(Autofill);
registerPlugin(BindRowsWithHeaders);
registerPlugin(CopyPaste);
registerPlugin(ContextMenu);
registerPlugin(DragToScroll);
registerPlugin(DropdownMenu);
registerPlugin(Formulas);
registerPlugin(ManualColumnResize);
registerPlugin(UndoRedo);

const MIN_ROWS = 20;
const MIN_COLS = 26;

function getContextMenuItemTrigger(hot, name, trigger) {
  return hot.getPlugin('ContextMenu').itemsFactory.predefinedItems[name]?.[trigger]?.bind(hot);
}

class DataSourcesEditor extends Component {
  constructor() {
    super();
    this.hot = null;
    this.colHeaders = null;
    this.update = {};
    this.tableEl = React.createRef();
    this.previewEl = React.createRef();
    this.deserialize = this.deserialize.bind(this);
    this.serialize = this.serialize.bind(this);
    this.loadDataSources = this.loadDataSources.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
    this.isSingleColumnSelected = this.isSingleColumnSelected.bind(this);
    this.renameColumn = this.renameColumn.bind(this);
  }

  componentDidMount() {
    this.colHeaders = Object.keys(this.props.dataSources || {});
    const self = this;
    const data = this.deserialize(this.props.dataSources);

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

    this.hot = new Handsontable(this.tableEl.current, {
      data,
      width: '100%',
      height: 320,
      rowHeaders: true,
      colHeaders: this.colHeaders,
      minRows: MIN_ROWS,
      minCols: Math.max(MIN_COLS, this.colHeaders.length),
      autoWrapRow: true,
      autoWrapCol: true,
      contextMenu,
      fillHandle: 'vertical',
      licenseKey: 'non-commercial-and-evaluation',
      // Plugins
      autoColumnSize: {
        useHeaders: true,
      },
      bindRowsWithHeaders: true,
      copyPaste: true,
      manualColumnMove: true,
      manualColumnResize: true,
      formulas: {
        engine: HyperFormula,
      },
      // Hooks
      beforeChange(changes, source) {
        if (!['edit'].includes(source)) {
          return;
        }
        changes.forEach((change) => {
          const newVal = change[3];
          // Convert numeric strings into real numbers
          if (!isNaN(newVal) && newVal !== '' && typeof newVal === 'string') {
            if (/^0\d+/.test(newVal) && !/^0\.\d+$/.test(newVal)) {
              return;
            }
            change[3] = parseFloat(newVal);
          }
        });
      },
      afterChange(changes, source) {
        if (changes) {
          changes.forEach((change) => {
            if (change[3] !== null) {
              this.setCellMeta(change[0], change[1], 'className', 'highlight-cell');
            } else {
              this.setCellMeta(change[0], change[1], 'className', '');
            }
          });
        } else {
          this.getData().forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
              if (cell !== null) {
                this.setCellMeta(rowIndex, colIndex, 'className', 'highlight-cell');
              } else {
                this.setCellMeta(rowIndex, colIndex, 'className', '');
              }
            });
          });
        }
        if (source === 'updateData') {
          self.onUpdate({
            editedColumns: self.colHeaders,
          });
          return;
        }
        if (changes?.length) {
          self.onUpdate({
            editedColumns: [...new Set(changes.map((change) => self.colHeaders[change[1]]))],
          });
        }
        this.render();
      },
      afterUpdateSettings(settings) {
        const colHeadersChanged = !isEqual(settings.colHeaders, self.colHeaders);
        if (!settings.colHeaders) {
          return;
        }
        if (settings.colHeaders.length === self.colHeaders.length && colHeadersChanged) {
          self.onUpdate({
            renamedColumns: self.colHeaders.reduce((acc, header, index) => {
              if (header !== settings.colHeaders[index]) {
                acc.push(index);
              }
              return acc;
            }, []),
          });
        }
        if (settings.colHeaders.length !== self.colHeaders.length) {
          self.onUpdate({
            removedColumns: self.colHeaders.reduce((acc, header) => {
              if (!settings.colHeaders.includes(header)) {
                acc.push(header);
              }
              return acc;
            }, []),
          });
        }
      },
      // afterCreateCol(index, amount) {
      //   self.onUpdate({createdColumns: Array.from({length: amount}, (_, i) => index + i)});
      // },
      // afterCreateRow(index, amount) {
      //   self.onUpdate({createdRows: Array.from({length: amount}, (_, i) => index + i)});
      // },
      afterRemoveCol(index, amount) {
        const columns = Array.from({length: amount}, (_, i) => index + i);
        self.onUpdate({
          removedColumns: columns.map((index) => self.colHeaders[index]),
        });
      },
      afterRemoveRow() {
        self.onUpdate({
          editedColumns: self.colHeaders,
        });
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
      init() {
        window.dispatchEvent(new Event('resize'));
      },
    });
  }

  componentWillUnmount() {
    this.hot?.destroy();
  }

  deserialize(dataSources) {
    let col = 0;
    return Object.entries(dataSources || {}).reduce(
      (acc, [_, value]) => {
        value.forEach((_, i) => {
          if (!acc[i]) {
            acc[i] = [];
          }
          acc[i][col] = value[i];
        });
        ++col;
        return acc;
      },
      [[]]
    );
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

  loadDataSources(dataSources, update) {
    const data = this.deserialize(dataSources);
    this.colHeaders = Object.keys(dataSources);
    this.hot.updateData(data);
    this.hot.updateSettings({
      colHeaders: this.colHeaders,
    });
    if (update) {
      this.update = update;
    }
  }

  onUpdate(changes) {
    requestAnimationFrame(() => {
      const update = {
        layout: {...(this.update?.layout || {})},
        traces: [...(this.update?.traces || [])],
      };
      const prevColHeaders = this.colHeaders;
      const dataSources = this.serialize();
      const dataSourceOptions = Object.keys(dataSources).map((name) => ({
        value: name,
        label: name,
      }));

      const {editedColumns = [], renamedColumns = [], removedColumns = []} = changes;

      const attrs = [
        ...this.props.data.reduce((acc, trace, index) => {
          Object.entries(getAttrsPath(trace, TRACE_SRC_ATTRIBUTES)).forEach(([attr]) => {
            acc.push({
              attr,
              index,
              trace: true,
            });
          });
          return acc;
        }, []),
        ...Object.entries(getAttrsPath(this.props.layout, LAYOUT_SRC_ATTRIBUTES)).reduce(
          (acc, [attr]) => {
            acc.push({
              attr,
              layout: true,
            });
            return acc;
          },
          []
        ),
      ];

      attrs.forEach(({attr, trace, layout, index}) => {
        function updateAttr(attr, value) {
          if (layout && attr.includes('meta.columnNames')) {
            return;
          }
          if (trace && !update.traces[index]) {
            update.traces[index] = {};
          }
          if (trace) {
            update.traces[index][attr] = update.traces[index][attr] || value;
          }
          if (layout) {
            update.layout[attr] = update.layout[attr] || value;
          }
        }

        const container = trace ? this.props.data[index] : this.props.layout;

        const srcAttr = getSrcAttr(container, attr, this.props.srcConverters);

        // Handle edited columns
        editedColumns.forEach((col) => {
          if (!inSrcAttr(srcAttr, col)) {
            return;
          }
          if (Array.isArray(srcAttr.value)) {
            srcAttr.value = srcAttr.value.reduce((acc, value) => {
              if (getData(container, {...srcAttr, value}, dataSources)) {
                acc.push(value);
              }
              return acc;
            }, []);
          }
          const data = getData(container, srcAttr, dataSources);
          if (!data) {
            srcAttr.value = null;
          } else {
            srcAttr.value = getAdjustedSrcAttr(srcAttr).value;
          }
          updateAttr(attr, data);
          if (!isEqual(srcAttr.value, srcAttr.originalValue)) {
            updateAttr(srcAttr.key, srcAttr.value);
            updateAttr(
              `meta.columnNames.${attr}`,
              srcAttr.value
                ? getColumnNames(
                    typeof srcAttr.value === 'string' ? [srcAttr.value] : srcAttr.value,
                    dataSourceOptions
                  )
                : null
            );
          }
        });

        // Handle renamed columns
        renamedColumns.forEach((colIndex) => {
          const oldCol = prevColHeaders[colIndex];
          const newCol = this.colHeaders[colIndex];
          if (!inSrcAttr(srcAttr, oldCol)) {
            return;
          }
          if (Array.isArray(srcAttr.value)) {
            srcAttr.value = srcAttr.value.reduce((acc, value) => {
              if (value === oldCol) {
                acc.push(newCol);
              } else {
                acc.push(value);
              }
              return acc;
            }, []);
            updateAttr(srcAttr.key, srcAttr.value);
            updateAttr(
              `meta.columnNames.${attr}`,
              getColumnNames(srcAttr.value, dataSourceOptions)
            );
          }
          if (typeof srcAttr.value === 'string' && srcAttr.value === oldCol) {
            srcAttr.value = newCol;
            updateAttr(srcAttr.key, newCol);
            updateAttr(
              `meta.columnNames.${attr}`,
              getColumnNames([srcAttr.value], dataSourceOptions)
            );
          }
        });

        // Handle removed columns
        removedColumns.forEach((col) => {
          if (!inSrcAttr(srcAttr, col)) {
            return;
          }
          let data;
          if (Array.isArray(srcAttr.value)) {
            srcAttr.value = srcAttr.value.filter((value) => value !== col);
            data = getData(container, srcAttr, dataSources);
          }
          if (typeof srcAttr.value === 'string' && srcAttr.value === col) {
            srcAttr.value = null;
            data = null;
          }
          updateAttr(srcAttr.key, srcAttr.value);
          updateAttr(attr, data);
        });
      });

      // console.log(
      //   '[DEBUG]',
      //   update,
      //   'props.dataSources == dataSources',
      //   isEqual(this.props.dataSources, dataSources)
      // );

      update.traces.forEach((update, i) => {
        if (!Object.keys(update).length) {
          return;
        }
        this.props.onUpdate({
          type: EDITOR_ACTIONS.UPDATE_TRACES,
          payload: {
            update,
            traceIndexes: [i],
          },
        });
      });

      if (Object.keys(update.layout).length) {
        this.props.onUpdate({
          type: EDITOR_ACTIONS.UPDATE_LAYOUT,
          payload: {
            update: update.layout,
          },
        });
      }

      if (!isEqual(this.props.dataSources, dataSources)) {
        this.props.onUpdate({
          type: EDITOR_ACTIONS.UPDATE_DATA_SOURCES,
          payload: {
            dataSources,
          },
        });
      }

      this.update = {};
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
        <div className="grid_panel">
          <div className="ht-table-wrapper ht-theme-main">
            <div className="border border-top" />
            <div className="border border-bottom" />
            <div className="border border-left" />
            <div className="border border-right" />
            <div ref={this.tableEl} />
          </div>
        </div>
        <div
          className="grid_panel__resize-bar"
          onMouseDown={(e) => {
            e.preventDefault();
            const startY = e.clientY;
            const startHeight = this.hot.getSettings().height;
            let height = startHeight;

            const handleMouseMove = (e) => {
              e.preventDefault();
              const deltaY = e.clientY - startY;
              this.previewEl.current.style.top = deltaY + 'px';
              height = Math.max(MIN_GRID_HEIGHT, startHeight + deltaY);
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
              this.previewEl.current.style.top = '0px';
              this.hot.updateSettings({
                height,
              });
              requestAnimationFrame(() => {
                this.props.onPlotResize();
              });
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        >
          <div className="grid_panel__resize-divider" />
          <div className="grid_panel__resize-preview" ref={this.previewEl} />
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
  onPlotResize: PropTypes.func,
};

export default DataSourcesEditor;
