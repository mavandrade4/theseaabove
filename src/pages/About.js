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
          <img 
          src="title.svg" 
          className="title-img"
          alt="Title Decoration"
          ></img>
          <h1>
            ABOUT US:
            <br />
            Making Space Make Sense
          </h1>
        </div>
      </div>

      <div className="container">
        <img
          src="neura.png"
          className="frame-image"
          alt="Neuraspace Logo"
          style={{ height: "50vh", opacity: "0.8", margin: "20vh" }}
        ></img>
        <div className="frame2" ref={(el) => (sectionsRef.current[1] = el)}>
          <h1>NEURASPACE</h1>
          <div className="text-frame">
            <p>
              Neuraspace is addressing one of the biggest challenges in modern
              space exploration: avoiding collisions and reducing space debris.
              <br></br>
              <br></br>
              By leveraging machine learning models to track and predict the
              movement of objects in low Earth orbit, Neuraspace enables
              satellite operators to make faster, smarter decisions—before
              accidents occur.
              <br></br>
              <br></br>
              Fewer false alarms and faster responses mean fewer unnecessary
              alerts and quicker decision-making—saving fuel, time, and money.
              The AI Fights Space Debris project supports this mission by
              integrating Neuraspace's tools into a powerful Space Traffic
              Management (STM) platform.
              <br></br>
              <br></br>
              This helps extend the life of satellites and reduce operational
              costs. In short: less junk, fewer crashes, smarter space.
            </p>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="frame" ref={(el) => (sectionsRef.current[2] = el)}>
          <h1>CISUC/UC</h1>
          <div className="text-frame">
            <p>
              The Centre for Informatics and Systems of the University of
              Coimbra (CISUC) is one of Portugal's leading research institutions
              in computer science and information technology.
              <br></br>
              <br></br>
              Founded in 1991, CISUC brings together a team of over 280
              researchers—including professors, postdocs, and PhD
              students—working on innovative projects in areas such as
              artificial intelligence, software engineering, and data science.
              <br></br>
              <br></br>
              CISUC's mission is to:
              <ul>
                <li>Drive original research and development;</li>
                <li>Train the next generation of tech talent </li>
                <li>
                  Collaborate on cutting-edge national and international
                  projects
                </li>
                <li> Bridge the gap between academia and industry </li>
              </ul>
            </p>
          </div>
        </div>
        <img
          src="cisuc.png"
          className="frame-image"
          alt="CISUC Logo"
          style={{
            maxHeight: "60vh",
            maxWidth: "100%",
            width: "auto",
            height: "auto",
            objectFit: "contain",
            opacity: 0.8,
            margin: "20vh",
          }}
        ></img>
      </div>

      <div className="container">
        <img
          src="me.jpg"
          className="frame-image"
          alt="Mariana"
          style={{ height: "50vh", opacity: "0.8", margin: "20vh" }}
        ></img>
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
