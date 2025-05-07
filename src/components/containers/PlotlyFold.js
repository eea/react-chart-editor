import FoldEmpty from './FoldEmpty';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import classnames from 'classnames';
import {CloseIcon, AngleDownIcon, RefreshIcon} from 'plotly-icons';
import {unpackPlotProps, containerConnectedContextTypes, striptags} from 'lib';

export class Fold extends Component {
  constructor() {
    super();
    this.foldVisible = true;
    this.resetEl = React.createRef();
    this.getResettableAttrs = this.getResettableAttrs.bind(this);
  }

  getChildContext() {
    return {
      resettable: this.props.resettable,
      foldInfo: this.props.foldInfo ? this.props.foldInfo : null,
    };
  }

  getResettableAttrs(children) {
    let attrs = {};
    if (!children) {
      return attrs;
    }
    React.Children.forEach(children, (child) => {
      if (!child) {
        return;
      }
      const {container_section, visibility_select} = child.type?.plotly_editor_traits || {};
      if ((container_section || visibility_select) && child.props.resettable !== true) {
        return;
      }
      if (!container_section && child.props.resettable !== false && child.props.attr) {
        attrs[child.props.attr] = null;
      }
      if (
        child.type?.plotly_editor_traits?.container_section ||
        child.type?.plotly_editor_traits?.visibility_select
      ) {
        attrs = {
          ...attrs,
          ...this.getResettableAttrs(child.props.children),
        };
      }
    });
    return attrs;
  }

  render() {
    if (!this.foldVisible && !this.props.messageIfEmpty) {
      return null;
    }
    const {
      canFold = true,
      canReorder = true,
      canDelete,
      children,
      className,
      foldInfo,
      toggleFold,
      hideHeader,
      icon: Icon,
      messageIfEmpty,
      name,
      canMoveUp,
      canMoveDown,
    } = this.props;
    const moveContainer = this.props.moveContainer || this.context.moveContainer;
    const deleteContainer = this.props.deleteContainer || this.context.deleteContainer;

    const folded = canFold ? this.props.folded : false;

    const contentClass = classnames('fold__content', {
      'fold__content--noheader': hideHeader,
    });

    const headerClass = classnames('fold__top', {
      'fold__top--open': !folded,
    });

    const arrowClass = classnames('fold__top__arrow', {
      'fold__top__arrow--open': !folded,
    });

    const arrowDownIcon = (
      <div className={arrowClass}>
        <div className="fold__top__arrow__wrapper">
          <AngleDownIcon />
        </div>
      </div>
    );

    const icon = Icon ? <Icon className="fold__top__icon" /> : null;

    const deleteButton =
      canDelete && typeof deleteContainer === 'function' ? (
        <div
          className="fold__top__delete js-fold__delete"
          onClick={(e) => {
            e.stopPropagation();
            deleteContainer(foldInfo);
          }}
        >
          <CloseIcon />
        </div>
      ) : null;

    const movingControls = (canMoveDown || canMoveUp) && (
      <div className="fold__top__moving-controls">
        <span
          className={`fold__top__moving-controls--up${canMoveUp ? '' : '--disabled'}`}
          onClick={(e) => {
            e.stopPropagation();

            if (canMoveUp) {
              if (!moveContainer || typeof moveContainer !== 'function') {
                throw new Error('moveContainer must be a function');
              }
              moveContainer('up');
            }
          }}
        >
          <AngleDownIcon />
        </span>
        <span
          className={`fold__top__moving-controls--down${canMoveDown ? '' : '--disabled'}`}
          onClick={(e) => {
            e.stopPropagation();
            if (canMoveDown) {
              if (!moveContainer || typeof moveContainer !== 'function') {
                throw new Error('moveContainer must be a function');
              }
              moveContainer('down');
            }
          }}
        >
          <AngleDownIcon />
        </span>
      </div>
    );

    const resetControls = this.props.resettable && (
      <div
        className="fold__top__reset js-fold__reset"
        aria-label={'Reset settings'}
        data-microtip-position="top-left"
        data-microtip-size="max-content"
        role="tooltip"
        onClick={(e) => {
          e.stopPropagation();
          const el = this.resetEl.current;

          if (el) {
            el.style.transition = 'rotate 0.5s ease-in-out';
            el.style.rotate = '360deg';

            setTimeout(() => {
              el.style.transition = 'none';
              el.style.rotate = '0deg';
            }, 510); // eslint-disable-line no-magic-numbers
          }
          const resettableAttrs = this.getResettableAttrs(this.props.children);

          this.context.updateContainer(resettableAttrs);
        }}
      >
        <div ref={this.resetEl}>
          <RefreshIcon />
        </div>
      </div>
    );

    const foldHeader = !hideHeader && (
      <div className={headerClass} onClick={toggleFold}>
        <div className="fold__top__arrow-title">
          {canFold && arrowDownIcon}
          {icon}
          <div className="fold__top__title">{striptags(name)}</div>
        </div>
        {canReorder && movingControls}
        {resetControls}
        {deleteButton}
      </div>
    );

    let foldContent = null;
    if (!folded) {
      if (this.foldVisible) {
        foldContent = <div className={contentClass}>{children}</div>;
      } else {
        foldContent = (
          <div className={contentClass}>
            <FoldEmpty icon={Icon} messagePrimary={messageIfEmpty} />
          </div>
        );
      }
    }

    const classes = className ? ' ' + className : '';

    return (
      <div className={`fold${classes}`}>
        {foldHeader}
        {foldContent}
      </div>
    );
  }
}

Fold.plotly_editor_traits = {foldable: true};

Fold.propTypes = {
  canDelete: PropTypes.bool,
  canFold: PropTypes.bool,
  canReorder: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
  folded: PropTypes.bool,
  foldInfo: PropTypes.object,
  toggleFold: PropTypes.func,
  moveContainer: PropTypes.func,
  deleteContainer: PropTypes.func,
  hideHeader: PropTypes.bool,
  icon: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  messageIfEmpty: PropTypes.string,
  name: PropTypes.string,
  canMoveUp: PropTypes.bool,
  canMoveDown: PropTypes.bool,
  resettable: PropTypes.bool,
};

Fold.contextTypes = {
  updateContainer: PropTypes.func,
  deleteContainer: PropTypes.func,
};

Fold.childContextTypes = {
  resettable: PropTypes.bool,
  foldInfo: PropTypes.object,
};

class PlotlyFold extends Fold {
  constructor(props, context) {
    super(props, context);

    this.foldVisible = false;
    this.determineVisibility(props, context);
  }

  UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
    this.determineVisibility(nextProps, nextContext);
  }

  determineVisibility(nextProps, nextContext) {
    this.foldVisible = false;

    React.Children.forEach(nextProps.children, (child) => {
      if (!child || this.foldVisible) {
        return;
      }

      if (child.props.attr) {
        // attr components force fold open if they are visible
        const plotProps = unpackPlotProps(child.props, nextContext);
        if (child.type.modifyPlotProps) {
          child.type.modifyPlotProps(child.props, nextContext, plotProps);
        }

        this.foldVisible = this.foldVisible || plotProps.isVisible;
        return;
      }

      if (!(child.type.plotly_editor_traits || {}).no_visibility_forcing) {
        // non-attr components force visibility (unless they don't via traits)
        this.foldVisible = true;
        return;
      }
    });
  }
}

PlotlyFold.plotly_editor_traits = {
  container_fold: true,
  foldable: true,
};

PlotlyFold.contextTypes = Object.assign(
  {
    deleteContainer: PropTypes.func,
    moveContainer: PropTypes.func,
  },
  containerConnectedContextTypes
);

export default PlotlyFold;
