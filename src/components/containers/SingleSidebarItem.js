import PropTypes from 'prop-types';
import React, {Component} from 'react';
import cx from 'classnames';

export default class SingleSidebarItem extends Component {
  render() {
    return this.props.children ? (
      <div className={cx('sidebar__item--single', this.props.className)}>{this.props.children}</div>
    ) : null;
  }
}

SingleSidebarItem.plotly_editor_traits = {sidebar_element: true};

SingleSidebarItem.propTypes = {
  children: PropTypes.any,
  className: PropTypes.string,
};
