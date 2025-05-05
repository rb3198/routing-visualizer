export const underlineBold = (text: string) => (
  <u>
    <b>{text}</b>
  </u>
);

export const italicBold = (text: string) => (
  <i>
    <b>{text}</b>
  </i>
);

export const italicBoldString = (str: string) => `<b><i>${str}</i></b>`;
