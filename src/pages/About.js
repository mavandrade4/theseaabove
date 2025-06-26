import React, { useEffect, useRef, useState } from "react";
import "../App.css";
import { gsap } from "gsap";
import { ScrollToPlugin, ScrollTrigger, Observer } from "gsap/all";

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger, Observer);

const About = () => {
  const sectionsRef = useRef([]);
  const currentIndex = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToSection = (index) => {
    const section = sectionsRef.current[index];
    if (!section) return;

    gsap.to(window, {
      scrollTo: { y: section, autoKill: false },
      duration: 1.2,
      ease: "power3.out",
      onComplete: () => {
        currentIndex.current = index;
        setActiveIndex(index);

        if (index === 0) {
          document.body.classList.remove("show-nav");
        } else {
          document.body.classList.add("show-nav");
        }
      },
    });
  };

  useEffect(() => {
    const sections = sectionsRef.current;

    Observer.create({
      target: window,
      type: "wheel,touch",
      onDown: () => {
        if (currentIndex.current < sections.length - 1) {
          scrollToSection(currentIndex.current + 1);
        }
      },
      onUp: () => {
        if (currentIndex.current > 0) {
          scrollToSection(currentIndex.current - 1);
        }
      },
      wheelSpeed: 1,
      tolerance: 15,
      preventDefault: true,
    });

    sections.forEach((section, i) => {
      ScrollTrigger.create({
        trigger: section,
        start: "top center",
        end: "bottom center",
        onEnter: () => {
          setActiveIndex(i);
          currentIndex.current = i;
        },
        onEnterBack: () => {
          setActiveIndex(i);
          currentIndex.current = i;
        },
      });
    });

    requestAnimationFrame(() => {
      scrollToSection(0);
      document.body.classList.remove("show-nav");
    });

  }, []);

  return (
    <div className="App">
      <div className="dot-nav">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`dot ${activeIndex === i ? "active" : ""}`}
            onClick={() => scrollToSection(i)}
          />
        ))}
      </div>

      <div className="title-frame" ref={(el) => (sectionsRef.current[0] = el)}>
        <div className="title-deco">
          <h1>
            ABOUT US:<br />
            Making Space Make Sense
          </h1>
        </div>
      </div>

      <div className="frame2" ref={(el) => (sectionsRef.current[1] = el)}>
        <h1>NEURASPACE</h1>
        <div className="text-frame">
          <p>
            Neuraspace is tackling one of the biggest challenges in modern space
            exploration: avoiding collisions and reducing space debris. Their
            secret weapon? Artificial intelligence. By using machine learning
            models to track and predict the movement of objects in low Earth
            orbit, Neuraspace helps satellite operators make faster, smarter
            decisions—before accidents happen. How Neuraspace is leading the
            way: AI-powered predictions Spotting potential collisions early and
            calculating risks in real time. Smarter fleet management Automating
            routine tasks and simplifying operations for satellite teams. Fewer
            false alarms, faster responses Reducing unnecessary alerts and
            speeding up decisions—saving fuel, time, and money. The AI Fights
            Space Debris project is part of this mission. It integrates
            Neuraspace's tools into a powerful Space Traffic Management (STM)
            platform, helping extend the life of satellites and cut operational
            costs. In short: less junk, fewer crashes, smarter space.
          </p>
        </div>
      </div>

      <div className="frame" ref={(el) => (sectionsRef.current[2] = el)}>
        <h1>CISUC/UC</h1>
        <div className="text-frame">
          <p>
            The Centre for Informatics and Systems of the University of Coimbra
            (CISUC) is one of Portugal's leading research institutions in
            computer science and information technology. Founded in 1991, CISUC
            brings together a team of over 280 researchers, from professors to
            PhD students, all working on innovative projects in fields like AI,
            software engineering, and data science. CISUC's mission: Drive
            original research and development Train the next generation of tech
            talent Collaborate on cutting-edge national and international
            projects Bridge the gap between academia and industry Recognized as
            "Excellent" by the Portuguese National Science Foundation, CISUC is
            also a founding member of LASI, Portugal's key laboratory for
            Artificial Intelligence and Data Science.
          </p>
        </div>
      </div>

      <div className="container">
        <img src="me.jpg" className="frame-image"></img>
        <div className="frame2" ref={(el) => (sectionsRef.current[3] = el)}>
          <h1>ABOUT ME</h1>
          <div className="text-frame">
            <p>
              Hi! I'm Mariana, I'm 26, and I have a background in Computer
              Engineering. Right now, I'm working on my Master's in Design and
              Multimedia at the University of Coimbra. This project brings
              together both sides of my experience - technology and creativity -
              to raise awareness about space sustainability and show how design
              can help solve real-world problems.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
