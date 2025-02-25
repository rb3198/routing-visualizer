import React, { useCallback, useRef, useState } from "react";
import styles from "./styles.module.css";
import { AiOutlineQuestionCircle } from "react-icons/ai";
import { Tooltip } from "src/components/tooltip";

type Param =
  | {
      type: "range";
      label: string;
      description: string;
      step: number;
      value: number;
      unit: string;
      onChange: React.ChangeEventHandler<HTMLInputElement>;
      onReset: () => unknown;
      onDisabledClick?: (propName: string) => unknown;
      range: [number, number];
      affects: {
        description?: string;
        label: string;
        value: number;
      }[];
      disabled?: boolean;
    }
  | {
      type: "checkbox";
      label: string;
      description: string;
      checked: boolean;
      disabled?: boolean;
      onToggle: React.ChangeEventHandler<HTMLInputElement>;
    };

export type ConfigOptionProps = {
  section: string;
  params: Param[];
};

export const ConfigOption: React.FC<ConfigOptionProps> = (props) => {
  const { section, params } = props;

  const renderControl = (param: Param) => {
    const { type, label, disabled } = param;
    switch (type) {
      case "range":
        const { unit, affects, onReset, onDisabledClick } = param;
        const id = `${styles.slider}_${label}`;
        const onDisabledMouseDown = () =>
          onDisabledClick && onDisabledClick(label);
        return (
          <div className={styles.row} key={id}>
            <Slider
              {...param}
              id={id}
              onDisabledMouseDown={onDisabledMouseDown}
            />
            <div className={styles.col}>
              {affects.map(({ label, value }) => (
                <div key={label}>
                  <label htmlFor={id} className={styles.label}>
                    <p>{label}:</p>
                    <span>
                      {value.toFixed(1)}
                      {unit}
                    </span>
                  </label>
                </div>
              ))}
            </div>
            <div className={styles.col}>
              <button
                onClick={disabled ? onDisabledMouseDown : onReset}
                className={styles.reset_button}
                data-disabled={disabled}
              >
                Reset to Default
              </button>
            </div>
          </div>
        );
      case "checkbox":
        return <Checkbox key={label} {...param} id={label} />;
      default:
        return <></>;
    }
  };
  return (
    <div>
      <h4>{section}</h4>
      {params.map((param) => renderControl(param))}
    </div>
  );
};

const Checkbox: React.FC<
  Param & { type: "checkbox"; id: string; onDisabledMouseDown?: () => unknown }
> = (props) => {
  const { label, checked, disabled, description, onToggle } = props;
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const questionRef = useRef<HTMLDivElement>(null);

  const showTooltip = useCallback(() => {
    setTooltipVisible(true);
  }, []);
  const hideTooltip = useCallback(() => {
    setTooltipVisible(false);
  }, []);
  return (
    <>
      <div className={styles.checkbox_container}>
        <input
          type="checkbox"
          id={label}
          checked={checked}
          disabled={disabled}
          onChange={onToggle}
          className={styles.checkbox}
        />
        <label
          htmlFor={label}
          className={`${styles.label} ${styles.checkbox_label}`}
        >
          {label}
        </label>
        <div
          className={styles.question}
          ref={questionRef}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          <AiOutlineQuestionCircle />
        </div>
      </div>
      <Tooltip
        visible={tooltipVisible}
        element={questionRef}
        position="top"
        classes={styles.tooltip}
        message={description}
      />
    </>
  );
};

const Slider: React.FC<
  Param & { type: "range"; id: string; onDisabledMouseDown: () => unknown }
> = (props) => {
  const {
    label,
    description,
    value,
    unit,
    range,
    step,
    onChange,
    disabled,
    id,
    onDisabledMouseDown,
  } = props;
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const questionRef = useRef<HTMLDivElement>(null);

  const showTooltip = useCallback(() => {
    setTooltipVisible(true);
  }, []);
  const hideTooltip = useCallback(() => {
    setTooltipVisible(false);
  }, []);
  return (
    <div className={styles.col}>
      <div className={styles.slider_container}>
        <label htmlFor={id} className={styles.label}>
          <p>{label}:</p>
          <div
            className={styles.question}
            ref={questionRef}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
          >
            <AiOutlineQuestionCircle />
          </div>
          <span>
            {value.toFixed(1)}
            {unit}
          </span>
        </label>
        <input
          type="range"
          min={range[0]}
          max={range[1]}
          step={step}
          value={value}
          className={styles.slider}
          id={id}
          onChange={onChange}
          disabled={disabled}
        />
        {disabled && (
          <div
            className={styles.disabled_slider_overlay}
            onClick={onDisabledMouseDown}
          />
        )}
      </div>
      <Tooltip
        visible={tooltipVisible}
        element={questionRef}
        position="top"
        classes={styles.tooltip}
        message={description}
      />
    </div>
  );
};
