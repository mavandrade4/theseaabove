import React, { useEffect, useRef, useState } from "react";
import "../App.css";
import { gsap } from "gsap";
import { ScrollToPlugin, ScrollTrigger, Observer } from "gsap/all";
import LoadingScreen from './components/LoadingScreen';
import Footer from "./components/Footer";

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger, Observer);

const About = () => {
  const sectionsRef = useRef([]);
  const footerRef = useRef(null);
  const currentIndex = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const scrollToSection = (index) => {
    let target;
    
    if (index < sectionsRef.current.length) {
      target = sectionsRef.current[index];
    } else {
      target = footerRef.current;
    }

    if (!target) return;

    gsap.to(window, {
      scrollTo: { y: target, autoKill: false },
      duration: 1.2,
      ease: "power3.out",
      onComplete: () => {
        currentIndex.current = index;
        setActiveIndex(index);
      },
    });
  };

  useEffect(() => {
    const minLoadingTime = 1000;
    const timer = setTimeout(() => setIsLoading(false), minLoadingTime);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const sections = sectionsRef.current;

      const observer = Observer.create({
        target: window,
        type: "wheel,touch",
        onDown: () => {
          const atFooter = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
          if (!atFooter && currentIndex.current < sections.length) {
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

      // Add ScrollTrigger for footer
      ScrollTrigger.create({
        trigger: footerRef.current,
        start: "top bottom-=100",
        onEnter: () => {
          setActiveIndex(sections.length);
          currentIndex.current = sections.length;
        },
        onEnterBack: () => {
          setActiveIndex(sections.length - 1);
          currentIndex.current = sections.length - 1;
        },
      });

      return () => {
        observer.kill();
        ScrollTrigger.getAll().forEach(instance => instance.kill());
      };
    }
  }, [isLoading]);

  if (isLoading) return <LoadingScreen />;

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
            src={process.env.PUBLIC_URL + "/title.svg"} 
            className="title-img"
          ></img>
          <h1>
            ABOUT US:
            <br />
            Making Space Make Sense
          </h1>
        </div>
      </div>

      <div
        style={{ backgroundColor: "rgba(2,0,34, 0.5)", marginTop: "2rem" }}
        className="container"
      >
        <img
          src={process.env.PUBLIC_URL + "/neura.png"}
          className="frame-image"
          alt="Neuraspace Logo"
          style={{ height: "50vh", opacity: "0.8", margin: "20vh" }}
        ></img>
        <div
          className="frame2"
          style={{ backgroundColor: "transparent" }}
          ref={(el) => (sectionsRef.current[1] = el)}
        >
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
      <div
        className="container"
        style={{ backgroundColor: "rgba(2,0,34, 0.5)", marginTop: "2rem" }}
      >
        <div
          className="frame"
          style={{ backgroundColor: "transparent" }}
          ref={(el) => (sectionsRef.current[2] = el)}
        >
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
          src={process.env.PUBLIC_URL + "/cisuc.png"}
          className="frame-image"
          alt="CISUC Logo"
          style={{
            height: "auto",
            width: "40vw",
            objectFit: "contain",
            display: "block",
            marginRight: "10vw",
            opacity: 0.8,
          }}
        ></img>
      </div>
      <div
        className="container"
        style={{ backgroundColor: "rgba(2,0,34, 0.5)", marginTop: "2rem" }}
      >
        <img
          src={process.env.PUBLIC_URL + "/me.jpg"}
          className="frame-image"
          alt="Mariana"
          style={{ height: "50vh", margin: "20vh" }}
        ></img>
        <div
          className="frame2"
          style={{ backgroundColor: "transparent" }}
          ref={(el) => (sectionsRef.current[3] = el)}
        >
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
      <div ref={footerRef}>
        <Footer />
      </div>
    </div>
  );
};

export default About;
