import Handsontable from 'handsontable';
import {
  autocompleteRenderer,
  textRenderer,
  checkboxRenderer as baseCheckboxRenderer,
} from 'handsontable/renderers';
import {CHECKBOX_EDITOR, TextEditor, DateEditor as BaseDateEditor} from 'handsontable/editors';
import {
  dateValidator as baseDateValidator,
  numericValidator as baseNumericValidator,
} from 'handsontable/validators';

const isNumeric = Handsontable.helper.isNumeric;
const hasClass = Handsontable.dom.hasClass;

// Numeric

export function numericValidator(value, callback) {
  if (this.visualRow !== 0 && isNumeric(value) && typeof value === 'string') {
    this.instance.setDataAtCell(this.visualRow, this.visualCol, Number(value), 'numericValidator');
  }
  callback(true);
}
numericValidator.VALIDATOR_TYPE = baseNumericValidator.VALIDATOR_TYPE;

// Checkbox

export function checkboxRenderer(hotInstance, TD, row, col, prop, value, cellProperties) {
  if (row === 0) {
    return textRenderer.apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);
  }
  return baseCheckboxRenderer.apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);
}

export class CheckboxEditor extends TextEditor {
  static get EDITOR_TYPE() {
    return CHECKBOX_EDITOR;
  }

  beginEditing(initialValue, event) {
    if (this.cellProperties.visualRow === 0) {
      super.beginEditing(initialValue, event);
      return;
    }
    // Just some events connected with the checkbox editor are delegated here. Some `keydown` events like `enter` and
    // `space` key presses are handled inside `checkboxRenderer`. Some events come here from `editorManager`. The below
    // `if` statement was created by the author for the purpose of handling only the `doubleclick` event on the TD
    // element with a checkbox.
    if (event && event.type === 'mouseup' && event.target.nodeName === 'TD') {
      const checkbox = this.TD.querySelector('input[type="checkbox"]');
      if (!hasClass(checkbox, 'htBadValue')) {
        checkbox.click();
      }
    }
  }
}

// Date

export function dateValidator(value, callback) {
  if (this.visualRow !== 0) {
    baseDateValidator.apply(this, [value, () => {}]);
  }
  callback(true);
}
dateValidator.VALIDATOR_TYPE = baseDateValidator.VALIDATOR_TYPE;

export function dateRenderer(hotInstance, TD, row, col, prop, value, cellProperties) {
  if (row === 0) {
    return textRenderer.apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);
  }
  return autocompleteRenderer.apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);
}

export class DateEditor extends BaseDateEditor {
  showDatepicker(event) {
    if (this.cellProperties.visualRow !== 0) {
      super.showDatepicker(event);
    }
  }

  open(event = null) {
    super.open(event);
  }
}
