export type ExpertiseCard = {
  title: string;
  buttonLabel: string;
  prefix: string;
  description: { text: string; checked?: boolean }[];
  onClick: () => unknown;
};
