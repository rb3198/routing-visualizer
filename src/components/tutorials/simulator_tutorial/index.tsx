import React, { useState } from "react";
import { Modal } from "src/components/modals";
import { tutorialSteps } from "./data";
import { SetScreenCallback, TutorialScreen } from "src/types/tutorials/screen";
import styles from "./styles.module.css";

const totalScreens = tutorialSteps.length;

export type SimulatorTutorialProps = {
  setScreen: SetScreenCallback;
};
export const SimulatorTutorial: React.FC<SimulatorTutorialProps> = ({
  setScreen,
}) => {
  const [activeSubScreen, setActiveSubScreen] = useState(0);
  const isLastScreen = activeSubScreen === totalScreens - 1;
  const { title, bullets, description, footer, videoSrc } =
    tutorialSteps[activeSubScreen];

  const closeTutorial = () => {
    setScreen(TutorialScreen.Complete, 0, true);
  };

  const onPrevClick = () => setActiveSubScreen((prev) => Math.max(0, prev - 1));
  const onNextClick = () => {
    if (isLastScreen) {
      closeTutorial();
      return;
    }
    setActiveSubScreen((prev) => prev + 1);
  };
  return (
    <Modal visible close={closeTutorial} title={title} classes={styles.modal}>
      <p id={styles.screen_indicator}>
        Screen {activeSubScreen + 1} / {totalScreens}
      </p>
      <p dangerouslySetInnerHTML={{ __html: description }} />
      {(bullets.length && (
        <ul id={styles.list}>
          {bullets.map((bullet) => (
            <li key={bullet} dangerouslySetInnerHTML={{ __html: bullet }} />
          ))}
        </ul>
      )) || <></>}
      {footer && <p dangerouslySetInnerHTML={{ __html: footer }} />}
      <div id={styles.video_and_nav}>
        <div id={styles.video_container}>
          {videoSrc && (
            <video
              src={videoSrc}
              loop
              id={styles.video}
              autoPlay
              muted
              title={title}
            />
          )}
        </div>
        <div id={styles.nav}>
          <button
            className={styles.button}
            data-skip="true"
            onClick={closeTutorial}
          >
            Skip Tutorial
          </button>
          <div>
            {activeSubScreen > 0 && (
              <button onClick={onPrevClick} className={styles.button}>
                Previous
              </button>
            )}
            {
              <button onClick={onNextClick} className={styles.button} data-next>
                {isLastScreen ? "Go to the Visualizer!" : "Next"}
              </button>
            }
          </div>
        </div>
      </div>
    </Modal>
  );
};
