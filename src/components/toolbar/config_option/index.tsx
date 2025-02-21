import React from "react";
import styles from "./styles.module.css";

export interface ConfigOptionProps {
  section: string;
  params: {
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
  }[];
}

export const ConfigOption: React.FC<ConfigOptionProps> = (props) => {
  const { section, params } = props;
  return (
    <div>
      <h4>{section}</h4>
      {params.map(
        ({
          label,
          value,
          unit,
          step,
          disabled,
          affects,
          onChange,
          onReset,
          onDisabledClick,
        }) => {
          const id = `${styles.slider}_${label}`;
          return (
            <div className={styles.row} key={`${label}`}>
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
        }
      )}
    </div>
  );
};
