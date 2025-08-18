import React, { Component } from 'react';
import PropTypes from 'prop-types';
import isNil from 'lodash/isNil';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import Handsontable from 'handsontable';
import {
  numericValidator,
  dateValidator,
  checkboxRenderer,
  dateRenderer,
  CheckboxEditor,
  DateEditor,
} from 'lib/handsontable';
import { getAdjustedSrcAttr, getAttrsPath, getData, getSrcAttr, inSrcAttr } from 'lib';
import { getColumnNames } from 'lib/dereference';
import {
  EDITOR_ACTIONS,
  TRACE_SRC_ATTRIBUTES,
  LAYOUT_SRC_ATTRIBUTES,
  MIN_GRID_HEIGHT,
} from 'lib/constants';

Handsontable.cellTypes.numeric.validator = numericValidator;
Handsontable.cellTypes.checkbox.renderer = checkboxRenderer;
Handsontable.cellTypes.checkbox.editor = CheckboxEditor;
Handsontable.cellTypes.date.validator = dateValidator;
Handsontable.cellTypes.date.renderer = dateRenderer;
Handsontable.cellTypes.date.editor = DateEditor;

const MIN_ROWS = 20;
const MIN_COLS = 26;
const TIMEOUT = 150;
const TIMEOUT_SCROLL = 40;

let isScrolling = false;

function getContextMenuItemTrigger(hot, name, trigger) {
  return hot.getPlugin('ContextMenu').itemsFactory.predefinedItems[name]?.[trigger]?.bind(hot);
}

function isSingleColumnSelected(hot) {
  const ranges = hot.getSelectedRange() || [];
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

class DataSourcesEditor extends Component {
  constructor() {
    super();
    this.hot = null;
    this.changes = [];
    this.update = {};
    this.scroll = {};
    this.tableEl = React.createRef();
    this.previewEl = React.createRef();
    this.getColumns = this.getColumns.bind(this);
    this.deserialize = this.deserialize.bind(this);
    this.serialize = this.serialize.bind(this);
    this.loadDataSources = this.loadDataSources.bind(this);
    this.beforeUpdate = debounce(this.beforeUpdate.bind(this), TIMEOUT);
    this.onUpdate = this.onUpdate.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.updateScrollBars = debounce(this.updateScrollBars.bind(this), TIMEOUT_SCROLL);
    this.handleVerticalDragStart = this.handleVerticalDragStart.bind(this);
    this.handleVerticalDrag = this.handleVerticalDrag.bind(this);
    this.handleVerticalDragEnd = this.handleVerticalDragEnd.bind(this);
    this.handleHorizontalDragStart = this.handleHorizontalDragStart.bind(this);
    this.handleHorizontalDrag = this.handleHorizontalDrag.bind(this);
    this.handleHorizontalDragEnd = this.handleHorizontalDragEnd.bind(this);
  }

  componentDidMount() {
    const self = this;
    const columns = self.getColumns(this.props.dataSources, this.props.columns);
    const data = self.deserialize(self.props.dataSources, columns);

    const contextMenu = {
      items: {
        row_above: {
          name: 'Insert row(s) above',
          hidden() {
            const range = this.getSelectedRangeLast();
            if (range.from.row === 0 || range.to.row === 0) {
              return true;
            }
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
          disabled() {
            const range = this.getSelectedRangeLast();

            if (
              !range ||
              this.selection.isSelectedByRowHeader() ||
              (range.isSingleHeader() && range.highlight.col < 0) ||
              this.countSourceCols() >= this.getSettings().maxCols
            ) {
              return true;
            }

            if (this.selection.isSelectedByCorner()) {
              // Enable "Insert column left" only when there is at least one column.
              return this.countCols() === 0;
            }

            return false;
          },
          hidden() {
            return getContextMenuItemTrigger(this, 'col_left', 'disabled')();
          },
          callback() {
            const length = Number(prompt('Enter number of columns:', 1)) || 1;
            const data = this.getData();
            const columns = cloneDeep(this.getSettings().columns);
            const latestSelection = this.getSelectedRangeLast().getTopLeftCorner();
            const alterAction = this.isRtl() ? 'insert_col_end' : 'insert_col_start';
            data.forEach((row) => {
              row.splice(
                latestSelection.col + (alterAction === 'insert_col_end' ? 1 : 0),
                0,
                ...Array.from({ length }, () => null)
              );
            });
            columns.splice(
              latestSelection.col + (alterAction === 'insert_col_end' ? 1 : 0),
              0,
              ...Array.from({ length }, () => ({}))
            );
            this.updateSettings({
              columns,
            });
            this.updateData(data);
            this.getPlugin('UndoRedo').clear();
          },
        },
        col_right: {
          name: 'Insert cols(s) to the right',
          disabled() {
            const range = this.getSelectedRangeLast();

            if (
              !range ||
              this.selection.isSelectedByRowHeader() ||
              (range.isSingleHeader() && range.highlight.col < 0) ||
              this.countSourceCols() >= this.getSettings().maxCols
            ) {
              return true;
            }

            return false;
          },
          hidden() {
            return getContextMenuItemTrigger(this, 'col_right', 'disabled')();
          },
          callback() {
            const length = Number(prompt('Enter number of columns:', 1)) || 1;
            const data = this.getData();
            const columns = cloneDeep(this.getSettings().columns);
            const latestSelection = this.getSelectedRangeLast().getTopLeftCorner();
            const alterAction = this.isRtl() ? 'insert_col_start' : 'insert_col_end';
            data.forEach((row) => {
              row.splice(
                latestSelection.col + (alterAction === 'insert_col_end' ? 1 : 0),
                0,
                ...Array.from({ length }, () => null)
              );
            });
            columns.splice(
              latestSelection.col + (alterAction === 'insert_col_end' ? 1 : 0),
              0,
              ...Array.from({ length }, () => ({}))
            );
            this.updateSettings({
              columns,
            });
            this.updateData(data);
            this.getPlugin('UndoRedo').clear();
          },
        },
        sp1: '---------',
        remove_row: {
          hidden() {
            return getContextMenuItemTrigger(this, 'remove_row', 'disabled')();
          },
        },
        remove_col: {
          disabled() {
            const range = this.getSelectedRangeLast();

            if (!range) {
              return true;
            }

            if (range.isSingleHeader() && range.highlight.col < 0) {
              return true;
            }

            const totalColumns = this.countCols();

            if (this.selection.isSelectedByCorner()) {
              // Enable "Remove column" only when there is at least one column.
              return totalColumns <= 1 || range.to.col - range.from.col === totalColumns;
            }

            return (
              this.selection.isSelectedByRowHeader() ||
              totalColumns <= 1 ||
              range.to.col - range.from.col + 1 === totalColumns
            );
          },
          hidden() {
            return getContextMenuItemTrigger(this, 'remove_col', 'disabled')();
          },
          callback(key, selection) {
            const data = this.getData();
            const columns = cloneDeep(this.getSettings().columns);
            const startColumn = selection[0].start.col;
            const endColumn = selection[0].end.col;
            const amount = Math.abs(endColumn - startColumn) + 1;
            const removedColumns = data[0].slice(startColumn, endColumn + 1);
            data.forEach((row) => {
              row.splice(startColumn, amount);
            });
            columns.splice(startColumn, amount);
            this.updateSettings({
              columns,
            });
            this.updateData(data);
            this.getPlugin('UndoRedo').clear();
            this.runHooks('_afterRemoveCol', removedColumns);
          },
        },
        clear_column: {
          hidden() {
            return (
              getContextMenuItemTrigger(this, 'clear_column', 'disabled')() ||
              !isSingleColumnSelected(this)
            );
          },
          callback(key, selection) {
            const startColumn = selection[0].start.col;
            const endColumn = selection[0].end.col;

            if (this.countRows()) {
              this.populateFromArray(
                1,
                startColumn,
                [[null]],
                Math.max(selection[0].start.row, selection[0].end.row),
                endColumn,
                'ContextMenu.clearColumn'
              );
            }
          },
        },
        sp2: '---------',
        type: {
          name: 'Type',
          disabled() {
            return false;
          },
          submenu: {
            items: [
              {
                key: 'type:text',
                name: 'Text',
                callback(key, selection) {
                  const startColumn = selection[0].start.col;
                  const endColumn = selection[0].end.col;
                  const columns = cloneDeep(this.getSettings().columns);
                  columns.forEach((col, i) => {
                    if (i >= startColumn && i <= endColumn) {
                      col.type = 'text';
                    }
                  });
                  this.updateSettings({
                    columns,
                  });
                  this.validateCells();
                  self.beforeUpdate();
                },
              },
              {
                key: 'type:number',
                name: 'Number',
                callback(key, selection) {
                  const startColumn = selection[0].start.col;
                  const endColumn = selection[0].end.col;
                  const columns = cloneDeep(this.getSettings().columns);
                  columns.forEach((col, i) => {
                    if (i >= startColumn && i <= endColumn) {
                      col.type = 'numeric';
                    }
                  });
                  this.updateSettings({
                    columns,
                  });
                  this.validateCells();
                  self.beforeUpdate();
                },
              },
              {
                key: 'type:date',
                name: 'Date',
                callback(key, selection) {
                  const startColumn = selection[0].start.col;
                  const endColumn = selection[0].end.col;
                  const columns = cloneDeep(this.getSettings().columns);
                  columns.forEach((col, i) => {
                    if (i >= startColumn && i <= endColumn) {
                      col.type = 'date';
                    }
                  });
                  this.updateSettings({
                    columns,
                  });
                  this.validateCells();
                  self.beforeUpdate();
                },
              },
            ],
          },
        },
        sp3: '---------',
        undo: 'undo',
        redo: 'redo',
      },
    };


    const previewEl = document.querySelector(".grid_panel__resize-bar")
    const plotEl = document.querySelector(".plot_panel")

    const height = window.innerHeight - (previewEl.clientHeight + plotEl.clientHeight) - 32 // eslint-disable-line

    self.hot = new Handsontable(self.tableEl.current, {
      data,
      contextMenu,
      columns,
      cells(row, col) {
        const cellProperties = {};
        // highlight-cell
        if (row > 0) {
          const value = this.instance.getDataAtCell(row, col);
          if (!isNil(value)) {
            cellProperties.className = 'highlight-cell';
          } else {
            cellProperties.className = '';
          }
        }
        return cellProperties;
      },
      width: '100%',
      height,
      rowHeaders: true,
      colHeaders: true,
      fixedRowsTop: 1,
      minRows: MIN_ROWS,
      autoWrapRow: true,
      autoWrapCol: true,
      fillHandle: 'vertical',
      licenseKey: 'non-commercial-and-evaluation',
      // Plugins
      autoColumnSize: true,
      bindRowsWithHeaders: true,
      copyPaste: true,
      manualColumnMove: true,
      manualColumnResize: true,
      // Hooks
      afterChange(changes, source) {
        if (['loadData', 'updateData'].includes(source)) {
          this.validateCells();
        }
        if (changes) {
          self.changes.push(...changes);
          self.beforeUpdate();
        }
        if (source === 'updateData') {
          const data = this.getData();
          self.onUpdate({
            editedColumns: new Set(data[0]),
          });
        }
      },
      afterCreateRow(row, amount, source) {
        if (source === 'auto') {
          return;
        }
        const data = this.getData();
        self.onUpdate({
          editedColumns: new Set(data[0]),
        });
      },
      afterRemoveRow() {
        const data = this.getData();
        self.onUpdate({
          editedColumns: new Set(data[0]),
        });
      },
      beforeColumnMove(column, finalIndex) {
        let min = Infinity,
          max = -Infinity;
        const data = this.getData();
        const columns = cloneDeep(this.getSettings().columns);
        const movedColumns = column.map((col) => columns[col]);
        column.forEach((col) => {
          if (col < min) {
            min = col;
          }
          if (col > max) {
            max = col;
          }
        });
        columns.splice(min, max - min + 1);
        columns.splice(finalIndex, 0, ...movedColumns);
        data.forEach((row) => {
          const movedCells = row.splice(min, max - min + 1);
          row.splice(finalIndex, 0, ...movedCells);
        });
        this.updateSettings({
          columns,
        });
        this.updateData(data);
        this.getPlugin('UndoRedo').clear();
        return false;
      },
      afterUndo() {
        this.render();
      },
      afterRedo() {
        this.render();
      },
      init() {
        window.requestAnimationFrame(() => {
          const dataSources = self.serialize();
          const columns = this.getSettings().columns.filter(
            (col) => Boolean(col.key) && col.key in dataSources
          );
          if (!isEqual(self.props.columns, columns)) {
            self.onUpdate({});
          }
        });
        window.dispatchEvent(new Event('resize'));
        const container = self.tableEl.current?.querySelector('.ht_master .wtHolder');
        if (container) {
          container.addEventListener('scroll', self.handleScroll);
          container.dispatchEvent(new Event('scroll', { bubbles: true }));
        }
        // Set up mouse events for vertical and horizontal thumbs
        const verticalThumb = self.tableEl.current?.querySelector('.scrollbar-v__thumb');
        const horizontalThumb = self.tableEl.current?.querySelector('.scrollbar-h__thumb');
        if (verticalThumb) {
          verticalThumb.addEventListener('mousedown', self.handleVerticalDragStart);
        }
        if (horizontalThumb) {
          horizontalThumb.addEventListener('mousedown', self.handleHorizontalDragStart);
        }
      },
    });
    self.hot.addHook('_afterRemoveCol', function (removedColumns) {
      self.onUpdate({
        removedColumns,
      });
    });
  }

  componentWillUnmount() {
    const container = this.tableEl.current?.querySelector('.ht_master .wtHolder');
    if (container) {
      container.removeEventListener('scroll', this.handleScroll);
      const verticalThumb = container.querySelector('.scrollbar-v__thumb');
      const horizontalThumb = container.querySelector('.scrollbar-h__thumb');

      if (verticalThumb) {
        verticalThumb.removeEventListener('mousedown', this.handleVerticalDragStart);
      }
      if (horizontalThumb) {
        horizontalThumb.removeEventListener('mousedown', this.handleHorizontalDragStart);
      }
      document.removeEventListener('mousemove', this.handleVerticalDrag);
      document.removeEventListener('mouseup', this.handleVerticalDragEnd);
      document.removeEventListener('mousemove', this.handleHorizontalDrag);
      document.removeEventListener('mouseup', this.handleHorizontalDragEnd);
      this.updateScrollBars.cancel();
    }
    this.hot?.destroy();
  }

  getColumns(dataSources, columns = []) {
    const keys = [...Object.keys(dataSources || {})];
    const colsInfo = columns
      .concat(
        Array.from(
          { length: Math.max(0, MIN_COLS - columns.length, keys.length - columns.length) },
          () => ({})
        )
      )
      .map((col, i) => {
        const colInfo = {
          ...col,
          ...(col.key ? {} : { key: keys[i] || null }),
        };
        if (!col.key) {
          delete keys[i];
        } else {
          const index = keys.indexOf(col.key);
          if (index !== -1) {
            delete keys[index];
          }
        }
        return colInfo;
      });
    keys.forEach((key) => {
      colsInfo.push({
        key,
      });
    });
    return colsInfo;
  }

  deserialize(dataSources, columns) {
    let col = 0;
    return columns.reduce(
      (acc, opts) => {
        if (!opts.key) {
          return acc;
        }
        const value = [opts.key, ...(dataSources[opts.key] || []).flat()];
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
    const columnsInfo = [];
    const data = this.hot?.getData() || [];
    data.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (!columnsInfo[j]) {
          columnsInfo[j] = {
            data: [],
            emptyIndex: 0,
            empty: 0,
            length: 0,
          };
        }
        if (i === 0) {
          columnsInfo[j].data.push(cell);
          return;
        }
        if (isNil(cell)) {
          columnsInfo[j].empty += 1;
        } else {
          columnsInfo[j].emptyIndex = i + 1;
        }
        columnsInfo[j].length += 1;
        columnsInfo[j].data.push(cell);
      });
    });
    columnsInfo.forEach((info) => {
      if (info.empty !== info.length && info.data[0]) {
        dataSources[info.data[0]] = info.data.slice(1, info.emptyIndex);
      }
    });

    return dataSources;
  }

  loadDataSources(dataSources, feedColumns = [], update) {
    const columns = this.getColumns(dataSources, feedColumns);
    const data = this.deserialize(dataSources, columns);
    this.hot.updateSettings({
      columns,
    });
    this.hot.updateData(data);
    if (update) {
      this.update = update;
    }
  }

  beforeUpdate() {
    requestAnimationFrame(() => {
      let updateColumns = false;
      const editedColumns = [];
      const renamedColumns = [];
      const data = this.hot.getData();
      const columns = cloneDeep(this.hot.getSettings().columns);
      this.changes.forEach((change) => {
        const [row, col, oldValue, newValue] = change;
        if (oldValue === newValue) {
          return;
        }
        if (row !== 0) {
          editedColumns.push(data[0][col]);
        } else {
          renamedColumns.push([oldValue, newValue]);
          columns[col].key = newValue;
          updateColumns = true;
        }
      });
      if (updateColumns) {
        this.hot.updateSettings({
          columns,
        });
        this.hot.render();
      }
      this.onUpdate({
        editedColumns: new Set(editedColumns),
        renamedColumns,
      });
      this.changes = [];
    });
  }

  onUpdate(changes) {
    requestAnimationFrame(() => {
      const update = {
        layout: { ...(this.update?.layout || {}) },
        traces: [...(this.update?.traces || [])],
      };
      const dataSources = this.serialize();
      const dataSourceOptions = Object.keys(dataSources).map((name) => ({
        value: name,
        label: name,
      }));
      const columns = this.hot
        .getSettings()
        .columns.filter((col) => Boolean(col.key) && col.key in dataSources);

      const { editedColumns = [], renamedColumns = [], removedColumns = [] } = changes;

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

      attrs.forEach(({ attr, trace, layout, index }) => {
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
          if (!col || !inSrcAttr(srcAttr, col)) {
            return;
          }
          if (Array.isArray(srcAttr.value)) {
            srcAttr.value = srcAttr.value.reduce((acc, value) => {
              if (getData(container, { ...srcAttr, value }, dataSources)) {
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
        renamedColumns.forEach((change) => {
          const [oldCol, newCol] = change;
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
          if (!col || !inSrcAttr(srcAttr, col)) {
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

      if (!isEqual(this.props.dataSources, dataSources) || !isEqual(this.props.columns, columns)) {
        this.props.onUpdate({
          type: EDITOR_ACTIONS.UPDATE_DATA_SOURCES,
          payload: {
            dataSources,
            columns,
          },
        });
      }

      this.update = {};
    });
  }

  handleScroll() {
    const verticalThumb = this.tableEl.current?.querySelector('.scrollbar-v__thumb');
    const horizontalThumb = this.tableEl.current?.querySelector('.scrollbar-h__thumb');

    if (!verticalThumb || !horizontalThumb) {
      return;
    }

    verticalThumb.classList.add('active');
    horizontalThumb.classList.add('active');

    clearTimeout(isScrolling);

    isScrolling = setTimeout(() => {
      verticalThumb.classList.remove('active');
      horizontalThumb.classList.remove('active');
    }, 200); // eslint-disable-line no-magic-numbers

    this.updateScrollBars();
  }

  updateScrollBars() {
    const wtHolder = this.tableEl.current?.querySelector('.ht_master .wtHolder');

    // Get custom scrollbar thumb elements from the container.
    const verticalThumb = this.tableEl.current?.querySelector('.scrollbar-v__thumb');
    const horizontalThumb = this.tableEl.current?.querySelector('.scrollbar-h__thumb');

    // Ensure all elements exist.
    if (!wtHolder || !verticalThumb || !horizontalThumb) {
      return;
    }

    // --- Update vertical scrollbar ---
    const containerHeight = wtHolder.clientHeight;
    const scrollHeight = wtHolder.scrollHeight;
    const scrollTop = wtHolder.scrollTop;

    // Calculate the thumb height (visible portion relative to total content height)
    const verticalThumbHeight = (containerHeight * containerHeight) / scrollHeight;
    verticalThumb.style.height = verticalThumbHeight + 'px';

    // Calculate the thumb position (proportional to scrollTop)
    const maxVerticalThumbTop = containerHeight - verticalThumbHeight;
    const verticalThumbTop = (scrollTop / (scrollHeight - containerHeight)) * maxVerticalThumbTop;
    verticalThumb.style.transform = `translateY(${verticalThumbTop}px)`;

    // --- Update horizontal scrollbar ---
    const containerWidth = wtHolder.clientWidth;
    const scrollWidth = wtHolder.scrollWidth;
    const scrollLeft = wtHolder.scrollLeft;

    // Calculate the thumb width (visible portion relative to total content width)
    const horizontalThumbWidth = (containerWidth * containerWidth) / scrollWidth;
    horizontalThumb.style.width = horizontalThumbWidth + 'px';

    // Calculate the thumb position (proportional to scrollLeft)
    const maxHorizontalThumbLeft = containerWidth - horizontalThumbWidth;
    const horizontalThumbLeft =
      (scrollLeft / (scrollWidth - containerWidth)) * maxHorizontalThumbLeft;
    horizontalThumb.style.transform = `translateX(${horizontalThumbLeft}px)`;
  }

  // Scroll event handlers

  handleVerticalDragStart(e) {
    e.preventDefault();
    const container = this.tableEl.current.querySelector('.ht_master .wtHolder');
    const verticalThumb = this.tableEl.current.querySelector('.scrollbar-v__thumb');
    // Save starting positions
    this.scroll.dragStartY = e.pageY;
    this.scroll.initialScrollTop = container.scrollTop;
    this.scroll.draggingVertical = true;
    verticalThumb.classList.add('active');
    document.addEventListener('mousemove', this.handleVerticalDrag);
    document.addEventListener('mouseup', this.handleVerticalDragEnd);
  }

  handleVerticalDrag(e) {
    if (!this.scroll.draggingVertical) {
      return;
    }
    const container = this.tableEl.current.querySelector('.ht_master .wtHolder');
    const containerHeight = container.clientHeight;
    const scrollHeight = container.scrollHeight;
    const verticalThumb = this.tableEl.current.querySelector('.scrollbar-v__thumb');
    const verticalThumbHeight = verticalThumb.offsetHeight;
    const maxScrollTop = scrollHeight - containerHeight;
    const maxVerticalThumbTop = containerHeight - verticalThumbHeight;

    // Calculate the drag difference (in pixels) and compute new scrollTop
    const deltaY = e.pageY - this.scroll.dragStartY;
    const thumbMovementRatio = deltaY / maxVerticalThumbTop;
    const newScrollTop = this.scroll.initialScrollTop + thumbMovementRatio * maxScrollTop;
    container.scrollTop = newScrollTop;
  }

  handleVerticalDragEnd() {
    const verticalThumb = this.tableEl.current.querySelector('.scrollbar-v__thumb');
    this.scroll.draggingHorizontal = false;
    verticalThumb.classList.remove('active');
    document.removeEventListener('mousemove', this.handleVerticalDrag);
    document.removeEventListener('mouseup', this.handleVerticalDragEnd);
  }

  handleHorizontalDragStart(e) {
    e.preventDefault();
    const container = this.tableEl.current.querySelector('.ht_master .wtHolder');
    const horizontalThumb = this.tableEl.current.querySelector('.scrollbar-h__thumb');
    // Save starting positions
    this.scroll.dragStartX = e.pageX;
    this.scroll.initialScrollLeft = container.scrollLeft;
    this.scroll.draggingHorizontal = true;
    horizontalThumb.classList.add('active');
    document.addEventListener('mousemove', this.handleHorizontalDrag);
    document.addEventListener('mouseup', this.handleHorizontalDragEnd);
  }

  handleHorizontalDrag(e) {
    if (!this.scroll.draggingHorizontal) {
      return;
    }
    const container = this.tableEl.current.querySelector('.ht_master .wtHolder');
    const containerWidth = container.clientWidth;
    const scrollWidth = container.scrollWidth;
    const horizontalThumb = this.tableEl.current.querySelector('.scrollbar-h__thumb');
    const horizontalThumbWidth = horizontalThumb.offsetWidth;
    const maxScrollLeft = scrollWidth - containerWidth;
    const maxHorizontalThumbLeft = containerWidth - horizontalThumbWidth;

    // Calculate the drag difference (in pixels) and compute new scrollLeft
    const deltaX = e.pageX - this.scroll.dragStartX;
    const thumbMovementRatio = deltaX / maxHorizontalThumbLeft;
    const newScrollLeft = this.scroll.initialScrollLeft + thumbMovementRatio * maxScrollLeft;
    container.scrollLeft = newScrollLeft;
  }

  handleHorizontalDragEnd() {
    const horizontalThumb = this.tableEl.current.querySelector('.scrollbar-h__thumb');
    this.scroll.draggingHorizontal = false;
    horizontalThumb.classList.remove('active');
    document.removeEventListener('mousemove', this.handleHorizontalDrag);
    document.removeEventListener('mouseup', this.handleHorizontalDragEnd);
  }

  render() {
    return (
      <>
        <div className="grid_panel">
          <div className="ht-theme-main" ref={this.tableEl}>
            <div className="scrollbar-v">
              <div className="scrollbar-v__thumb" />
            </div>
            <div className="scrollbar-h">
              <div className="scrollbar-h__thumb" />
            </div>
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
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      type: PropTypes.string,
    })
  ),
  srcConverters: PropTypes.shape({
    toSrc: PropTypes.func.isRequired,
    fromSrc: PropTypes.func.isRequired,
  }),
  onUpdate: PropTypes.func,
};

export default DataSourcesEditor;
