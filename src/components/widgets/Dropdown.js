import PropTypes from 'prop-types';
import React, { Component } from 'react';
import SelectBasic from 'react-select';
import SelectCreatable from 'react-select/creatable';
import classnames from 'classnames';
import isNil from 'lodash/isNil';

class Dropdown extends Component {
  constructor(props) {
    super(props);

    this.onChange = this.onChange.bind(this);
    this.onCreate = this.onCreate.bind(this);
  }

  onChange(selection) {
    const { multi, onChange, valueKey } = this.props;

    if (!selection) {
      return onChange(null);
    }

    return multi ? onChange(selection.map((s) => s[valueKey])) : onChange(selection[valueKey]);
  }

  onCreate(value) {
    const { onCreate } = this.props;

    if (!value) {
      return onCreate(null);
    }

    return onCreate(value);
  }

  render() {
    const {
      minWidth,
      placeholder,
      clearable,
      creatable,
      value,
      options,
      searchable,
      multi,
      noResultsText,
      valueKey,
      disabled,
      className,
      width,
    } = this.props;

    const { localize: _ } = this.context;

    const dropdownStyle = { minWidth };
    if (width) {
      dropdownStyle.width = width;
    }

    const opts = options.map((opt) =>
      typeof opt === 'string' ? { label: opt, [valueKey]: opt } : opt
    );

    const dropdownContainerClass = classnames('dropdown-container', {
      'dropdown--dark': this.props.backgroundDark,
      [className]: className,
    });

    const getOption = (value) => {
      if (isNil(value)) {
        return null;
      }

      return opts.find((o) => o[valueKey] === value) || { label: value, [valueKey]: value };
    };

    const Select = creatable ? SelectCreatable : SelectBasic;

    return (
      <div className={dropdownContainerClass} style={dropdownStyle}>
        <Select
          placeholder={placeholder || _('Select an Option')}
          isClearable={clearable}
          value={
            Array.isArray(value)
              ? value.reduce((acc, v) => {
                acc.push(getOption(v));
                return acc;
              }, [])
              : getOption(value)
          }
          options={opts}
          isSearchable={searchable}
          onChange={this.onChange}
          onCreateOption={this.onCreate}
          isMulti={multi}
          noOptionsMessage={() => noResultsText || _('No Results')}
          getOptionValue={(o) => o[valueKey]}
          getOptionLabel={(o) => o.label}
          isDisabled={disabled}
          className={dropdownContainerClass}
          classNamePrefix="Select"
          components={this.props.components}
        />
      </div>
    );
  }
}

Dropdown.defaultProps = {
  clearable: true,
  creatable: false,
  multi: false,
  searchable: false,
  minWidth: '120px',
  valueKey: 'value',
  disabled: false,
};

Dropdown.propTypes = {
  backgroundDark: PropTypes.bool,
  clearable: PropTypes.bool,
  creatable: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onCreate: PropTypes.func,
  options: PropTypes.array.isRequired,
  placeholder: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  searchable: PropTypes.bool,
  minWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  valueKey: PropTypes.string,
  value: PropTypes.any,
  multi: PropTypes.bool,
  components: PropTypes.object,
  noResultsText: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

Dropdown.contextTypes = {
  localize: PropTypes.func,
};

export default Dropdown;
