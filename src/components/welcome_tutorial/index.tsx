import React, { useCallback } from "react";
import styles from "./styles.module.css";
import { Modal } from "../modals";
import { TutorialScreen } from "src/types/welcome_tutorial/screen";
import { screenMap } from "src/constants/welcome_tutorial";
import { WelcomeScreen } from "./welcome_screens";

type WelcomeScreenProps = {
  screen: TutorialScreen;
  subScreenIdx: number;
  writeToStorage?: boolean;
  setScreen: (
    screen: TutorialScreen,
    subScreenIdx: number,
    writeToStorage?: boolean
  ) => unknown;
};

const shouldShowControls = (
  screen: TutorialScreen,
  subScreens: any[],
  subScreenIdx: number
) => {
  if (screen === TutorialScreen.Complete - 1) {
    return subScreenIdx !== subScreens.length - 1;
  }
  return (
    screen !== TutorialScreen.Welcome && screen !== TutorialScreen.Complete
  );
};

const WelcomeTutorial: React.FC<WelcomeScreenProps> = (props) => {
  const { screen, subScreenIdx, writeToStorage, setScreen } = props;

  const { title, subScreens } = screenMap[screen];

  const onModalClose = useCallback(() => {
    setScreen(TutorialScreen.Complete, 0, writeToStorage);
  }, [writeToStorage, setScreen]);

  const visible = screen !== TutorialScreen.Complete;
  const showControls = shouldShowControls(screen, subScreens, subScreenIdx);

  const renderControls = () => {
    return <></>;
  };
  return (
    <Modal
      title={title}
      close={onModalClose}
      visible={visible}
      classes={styles.modal}
    >
      {screen === TutorialScreen.Welcome ? (
        <WelcomeScreen setScreen={setScreen} writeToStorage={writeToStorage} />
      ) : (
        subScreens[subScreenIdx]?.screen
      )}
      {showControls && renderControls()}
    </Modal>
  );
};

export default WelcomeTutorial;
