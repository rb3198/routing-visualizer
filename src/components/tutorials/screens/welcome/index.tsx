import React, { useMemo } from "react";
import { TutorialScreen } from "src/types/tutorials/screen";
import styles from "./styles.module.css";
import { Emoji } from "src/constants/emojis";
import { getExpertiseCards, screenMap } from "src/constants/tutorials";
import { ExpertiseCard } from "src/types/tutorials/expertise_card";
import { BiChevronRight } from "react-icons/bi";
import { Modal } from "src/components/modals";
import { Link } from "react-router";
import { AppRoutes } from "src/constants/app_routes";

type Props = {
  setScreen: (screen: TutorialScreen, subScreenIdx?: number) => unknown;
};

export const WelcomeScreen: React.FC<Props> = (props) => {
  const { setScreen } = props;
  const Intro = useMemo(() => {
    return (
      <div id={styles.intro}>
        <p>
          <b>OSPF</b> (<b>O</b>pen <b>S</b>hortest <b>P</b>ath <b>F</b>irst)
          Protocol is a <i>network layer protocol</i> used to exchange routing
          information. This project aims to be an
          <b>
            <i> interactive tool</i>
          </b>{" "}
          to help you gain proficiency in the OSPF Routing Protocol.
        </p>
        <p>
          A basic understanding of computer networks helps, but carefully
          reading this section will give you the foundation to use the
          visualizer effectively.
          {Emoji.Smiling}
        </p>
        <p>
          <b>What you can do:</b>
        </p>
        <ul>
          <li>
            <b>Explore</b> various networking and OSPF concepts through
            interactive simulations.
          </li>
          <li>
            <b>Experiment</b> with several network configurations
          </li>
          <li>
            <b>Enhance</b> your understanding of routing dynamics!
          </li>
        </ul>
        <p>
          Before we begin, please tell us about your familiarity with computer
          networks. This will help tailor the learning experience to your skill
          level!{Emoji.Bullseye}
        </p>
      </div>
    );
  }, []);

  const close = () => setScreen(TutorialScreen.Complete);

  const cards = getExpertiseCards(setScreen);

  const renderCards = () => {
    return (
      <div id={styles.card_container}>
        {cards.map((props) => (
          <Card key={props.title} {...props} />
        ))}
      </div>
    );
  };
  return (
    <Modal
      title={screenMap[TutorialScreen.Welcome].title}
      close={close}
      visible
      classes={styles.modal}
    >
      <div id={styles.body}>
        {Intro}
        {renderCards()}
      </div>
    </Modal>
  );
};

const Card: React.FC<ExpertiseCard> = ({
  title,
  prefix,
  buttonLabel,
  description,
  screen,
  onClick,
}) => {
  return (
    <div className={styles.card}>
      <h4>{title}</h4>
      <ul className={styles.desc_list}>
        <p>{prefix}</p>
        {description.map(({ text, checked }) => (
          <li key={text} data-checked={checked} className={styles.list_bullet}>
            {text}
          </li>
        ))}
      </ul>
      <Link
        to={`${AppRoutes.Tutorials}/?screen=${screen}&subScreenIdx=0`}
        className={styles.navigator}
        onClick={onClick}
      >
        {buttonLabel}
        <BiChevronRight />
      </Link>
    </div>
  );
};
