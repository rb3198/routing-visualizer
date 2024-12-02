import React from "react";
import styles from "./styles.module.css";

type DestinationSelectorProps = {
  connectionOptions: string[];
  onSelect: (conn: string) => unknown;
};

export const DestinationSelector: React.FC<DestinationSelectorProps> = (
  props
) => {
  const { connectionOptions, onSelect } = props;
  return (
    <div id={styles.container}>
      <h3>Possible Destinations</h3>
      {connectionOptions.length ? (
        <ul>
          {connectionOptions.map((conn) => (
            <Destination key={conn} connection={conn} onSelect={onSelect} />
          ))}
        </ul>
      ) : (
        <p id={styles.no_connection}>No Interface Found</p>
      )}
    </div>
  );
};

const Destination = (props: {
  connection: string;
  onSelect: (conn: string) => unknown;
}) => {
  const { connection, onSelect } = props;
  const onClick = () => {
    onSelect(connection);
  };
  return <li onClick={onClick}>{connection}</li>;
};
