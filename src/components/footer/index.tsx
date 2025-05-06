import React, { useMemo } from "react";
import styles from "./styles.module.css";
import { FaRegCopyright } from "react-icons/fa6";
import { BsEnvelope, BsGithub, BsLinkedin, BsMedium } from "react-icons/bs";
import { FiExternalLink } from "react-icons/fi";
import { CiGlobe } from "react-icons/ci";

export const Footer: React.FC = () => {
  const AboutMe = useMemo(() => {
    const links = [
      {
        Icon: BsGithub,
        href: "https://www.github.com/rb3198",
        alt: "GitHub",
      },
      {
        Icon: BsLinkedin,
        href: "https://www.linkedin.com/in/ronit-bhatia-4507a6190/",
        alt: "LinkedIn",
      },
      {
        Icon: BsMedium,
        href: "https://www.medium.com/@ronitbhatia98",
        alt: "Medium Blog",
      },
      {
        Icon: BsEnvelope,
        href: `mailto:${"ronitbhatia98@gmail.com"}`,
        alt: "Email",
      },
      {
        Icon: CiGlobe,
        href: "https://rb3198.github.io/rb3198_web",
        alt: "Website",
      },
    ];
    return (
      <div className={styles.about}>
        <h3 id={styles.name}>
          <FaRegCopyright id={styles.copyright} />
          Ronit Bhatia
          {links.map(({ Icon, href, alt }) => (
            <a href={href} target="__blank" key={href} title={alt}>
              <Icon className={styles.icon} />
            </a>
          ))}
        </h3>
      </div>
    );
  }, []);

  const AboutSite = useMemo(() => {
    return (
      <div className={styles.about}>
        <a
          href="https://www.github.com/rb3198/routing-visualizer"
          target="__blank"
        >
          <BsGithub style={{ marginRight: 8 }} />
          Open Sourced on GitHub <FiExternalLink />
        </a>
      </div>
    );
  }, []);
  return (
    <footer id={styles.container}>
      {AboutMe}
      {AboutSite}
    </footer>
  );
};
