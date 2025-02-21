import React from "react";
import styles from "./styles.module.css";

type Param =
  | {
      type: "range";
      label: string;
      step: number;
      value: number;
      unit: string;
      onChange: React.ChangeEventHandler<HTMLInputElement>;
      onReset: () => unknown;
      onDisabledClick?: React.MouseEventHandler;
      range: [number, number];
      affects: {
        label: string;
        value: string | number;
      }[];
      disabled?: boolean;
    }
  | {
      type: "checkbox";
      label: string;
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
        const {
          value,
          unit,
          step,
          affects,
          onChange,
          onReset,
          onDisabledClick,
        } = param;
        const id = `${styles.slider}_${label}`;
        return (
          <div className={styles.row} key={id}>
            <div className={styles.col}>
              <div className={styles.slider_container}>
                <label htmlFor={id} className={styles.label}>
                  <p>{label}</p>
                  <span>
                    {value.toFixed(1)}
                    {unit}
                  </span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
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
                    onClick={onDisabledClick}
                  />
                )}
              </div>
            </div>
            <div className={styles.col}>
              {affects.map(({ label, value }) => (
                <div key={label}>
                  <label htmlFor={id} className={styles.label}>
                    <p>{label}</p>
                    <span>
                      {value}
                      {unit}
                    </span>
                  </label>
                </div>
              ))}
            </div>
            <div className={styles.col}>
              <button
                onClick={disabled ? onDisabledClick : onReset}
                className={styles.reset_button}
                data-disabled={disabled}
              >
                Reset to Default
              </button>
            </div>
          </div>
        );
      case "checkbox":
        const { checked, onToggle } = param;
        return (
          <div key={label} className={styles.checkbox_container}>
            <input
              type="checkbox"
              id={label}
              checked={checked}
              disabled={disabled}
              onChange={onToggle}
            />
            <label
              htmlFor={label}
              className={`${styles.label} ${styles.checkbox_label}`}
            >
              {label}
            </label>
          </div>
        );
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
