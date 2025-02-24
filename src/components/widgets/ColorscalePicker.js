import ColorscalePicker, {Colorscale, COLOR_PICKER_CONSTANTS} from 'react-colorscales';
import Dropdown from './Dropdown';
import ColorPicker from './ColorPicker';
import Button from './Button';
import Info from '../fields/Info';
import PropTypes from 'prop-types';
import React, {Component} from 'react';

import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd';

import {CloseIcon, EditIcon, PlusIcon, RotateLeftIcon, TrashIcon} from 'plotly-icons';

// CAREFUL: needs to be the same value as $colorscalepicker-width in _colorscalepicker.scss
const colorscalepickerContainerWidth = 240;

class Scale extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      selectedColorscaleType: props.initialCategory || 'sequential',
      showColorscalePicker: false,
      showCustomizeColor: false,
      draggingColorIndex: null,
      colorComponentVisibility: new Array(props.selected.length).fill(false),
    };

    this.onChange = this.onChange.bind(this);
    this.onClick = this.onClick.bind(this);
    this.handleColorChange = this.handleColorChange.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleDeleteColor = this.handleDeleteColor.bind(this);
    this.handleAddColor = this.handleAddColor.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
  }

  onClick() {
    this.setState((prevState) => ({
      showColorscalePicker: !prevState.showColorscalePicker,
    }));
  }

  onChange(selectedColorscaleType) {
    this.setState({selectedColorscaleType});
  }

  handleColorChange(color, index) {
    var newColorscale = [...(this.props.selected || [])];
    newColorscale[index] = color;

    this.props.onColorscaleChange(newColorscale, this.state.selectedColorscaleType);
  }

  handleVisibilityChange(index, isVisible) {
    this.setState((prevState) => {
      const newColorComponentVisibility = [...prevState.colorComponentVisibility];
      newColorComponentVisibility[index] = isVisible;
      return {colorComponentVisibility: newColorComponentVisibility};
    });
  }

  handleDeleteColor(index) {
    var newColorscale = [
      ...this.props.selected.slice(0, index),
      ...this.props.selected.slice(index + 1),
    ];

    this.props.onColorscaleChange(newColorscale, this.state.selectedColorscaleType);
  }

  handleAddColor() {
    var newColorscale = [...this.props.selected, 'black'];

    this.props.onColorscaleChange(newColorscale, this.state.selectedColorscaleType);
  }

  onDragStart(result) {
    this.setState({draggingColorIndex: result.source.index});
  }

  onDragEnd(result) {
    this.setState({draggingColorIndex: null});

    if (!result.destination) {
      return;
    }

    const newColorscale = Array.from(this.props.selected);
    const [movedColor] = newColorscale.splice(result.source.index, 1);
    newColorscale.splice(result.destination.index, 0, movedColor);

    this.props.onColorscaleChange(newColorscale, this.state.selectedColorscaleType);
  }

  render() {
    const {onColorscaleChange, selected, disableCategorySwitch} = this.props;
    const {
      selectedColorscaleType,
      showColorscalePicker,
      showCustomizeColor,
      colorComponentVisibility,
    } = this.state;
    const description = COLOR_PICKER_CONSTANTS.COLORSCALE_DESCRIPTIONS[selectedColorscaleType];
    const colorscaleOptions = COLOR_PICKER_CONSTANTS.COLORSCALE_TYPES.filter(
      (type) => type !== 'custom'
    ).map((type) => ({
      label: type + ' scales',
      value: type,
    }));
    const _ = this.context.localize;

    const Icon = showCustomizeColor ? CloseIcon : EditIcon;

    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <div className="customPickerContainer">
          <div
            className="customPickerContainer__clickable"
            style={{display: 'flex', alignItems: 'flex-start'}}
          >
            <Colorscale colorscale={selected} onClick={this.onClick} />
            {this.props.editable && (
              <>
                <Icon
                  size="20px"
                  onClick={() =>
                    this.setState((prevState) => ({
                      showCustomizeColor: !prevState.showCustomizeColor,
                    }))
                  }
                  color="var(--color-accent)"
                  style={{cursor: 'pointer', marginLeft: '0.5rem'}}
                />
                <RotateLeftIcon
                  size="20px"
                  onClick={() => {
                    this.props.onColorscaleChange(
                      selected.reverse(),
                      this.state.selectedColorscaleType
                    );
                  }}
                  color="var(--color-accent)"
                  style={{cursor: 'pointer', marginLeft: '0.5rem'}}
                />
              </>
            )}
          </div>
          {this.props.editable && showCustomizeColor && (
            <React.Fragment>
              <Droppable droppableId="colorList">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {selected?.length > 0 &&
                      selected.map((item, index) => (
                        <Draggable
                          key={index}
                          draggableId={`color-${index}`}
                          index={index}
                          isDragDisabled={colorComponentVisibility.includes(true)}
                        >
                          {(provided, snapshot) => {
                            if (snapshot.isDragging) {
                              const offset = {x: 20, y: 120};
                              const x = provided.draggableProps.style.left - offset.x;
                              const y = provided.draggableProps.style.top - offset.y;
                              provided.draggableProps.style.left = x;
                              provided.draggableProps.style.top = y;
                            }
                            return (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  position: 'relative',
                                  margin: '5px 0',
                                  ...provided.draggableProps.style,
                                }}
                              >
                                <ColorPicker
                                  selectedColor={item}
                                  onColorChange={(color, isVisible) =>
                                    this.handleColorChange(color, index, isVisible)
                                  }
                                  onVisibilityChange={(isVisible) =>
                                    this.handleVisibilityChange(index, isVisible)
                                  }
                                />
                                {selected.length > 2 && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      right: 0,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <TrashIcon
                                      onClick={() => {
                                        this.handleDeleteColor(index);
                                        colorComponentVisibility[index] = false;
                                      }}
                                      size="18px"
                                      color="var(--color-sienna)"
                                      style={{cursor: 'pointer', marginLeft: '0.5rem'}}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              <div className="color-buttons-container">
                <Button
                  icon={<PlusIcon size="18px" />}
                  variant="primary"
                  title="Add new color"
                  onClick={() => this.handleAddColor()}
                  style={{width: '100%'}}
                >
                  Add
                </Button>
              </div>
            </React.Fragment>
          )}
          {showColorscalePicker ? (
            <div className="customPickerContainer__expanded-content">
              {disableCategorySwitch ? null : (
                <Dropdown
                  options={colorscaleOptions}
                  value={selectedColorscaleType}
                  onChange={this.onChange}
                  clearable={false}
                  searchable={false}
                  placeholder={_('Select a Colorscale Type')}
                  className="customPickerContainer__category-dropdown"
                />
              )}
              {description ? (
                <div className="customPickerContainer__palettes">
                  <ColorscalePicker
                    onChange={onColorscaleChange}
                    colorscale={selected}
                    width={colorscalepickerContainerWidth}
                    colorscaleType={this.state.selectedColorscaleType}
                    onColorscaleTypeChange={this.onColorscaleTypeChange}
                    customColors={this.context.customColors}
                    scaleLength={7}
                    disableSwatchControls
                  />
                  <Info className="customPickerContainer__info">{description}</Info>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </DragDropContext>
    );
  }
}

Scale.propTypes = {
  onColorscaleChange: PropTypes.func,
  selected: PropTypes.array,
  label: PropTypes.string,
  initialCategory: PropTypes.string,
  disableCategorySwitch: PropTypes.bool,
  editable: PropTypes.bool,
};

Scale.contextTypes = {
  localize: PropTypes.func,
  customColors: PropTypes.array,
};

export default Scale;
