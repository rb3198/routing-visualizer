export enum MouseButton {
  Left,
  Middle,
  Right,
}

/**
 * Handles mouse right button down / move / click
 * - Triggers `callback` only if the button pressed was right mouse button
 * @returns `false` if detected button is not the right mouse button, else `true`.
 */
export type MouseRightEventHandler = (
  e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  callback?: () => unknown
) => boolean;
