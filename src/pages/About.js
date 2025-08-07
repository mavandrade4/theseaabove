import React, { useEffect, useRef, useState } from "react";
import "../App.css";
import { gsap } from "gsap";
import { ScrollToPlugin, ScrollTrigger, Observer } from "gsap/all";
import LoadingScreen from "./components/LoadingScreen";
import Footer from "./components/Footer";
import { Link } from "react-router-dom";
import { useInView } from "react-intersection-observer";

const TextFrame = ({ children }) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <div ref={ref} className={`text-frame ${inView ? "animate-in" : ""}`}>
      {children}
    </div>
  );
};

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger, Observer);

const About = () => {
  const sectionsRef = useRef([]);
  const footerRef = useRef(null);
  const currentIndex = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const scrollToSection = (index) => {
    if (isScrolling) return;
    setIsScrolling(true);

    const target =
      index < sectionsRef.current.length
        ? sectionsRef.current[index]
        : footerRef.current;

    if (!target) return;

    if (isMobile) {
      window.scrollTo({
        top: target.offsetTop,
        behavior: "smooth",
      });
      currentIndex.current = index;
      setActiveIndex(index);
      setIsScrolling(false);
    } else {
      gsap.to(window, {
        scrollTo: { y: target, autoKill: false, offsetY: 0 },
        duration: 1.2,
        ease: "power3.out",
        onComplete: () => {
          currentIndex.current = index;
          setActiveIndex(index);
          setIsScrolling(false);
        },
      });
    }
  };

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVh();
    window.addEventListener("resize", setVh);

    const timer = setTimeout(() => setIsLoading(false), 1000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkIfMobile);
      window.removeEventListener("resize", setVh);
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isMobile) {
        const sections = sectionsRef.current;

        const observer = Observer.create({
          target: window,
          type: "wheel,touch",
          onDown: () => {
            const atFooter =
              window.innerHeight + window.scrollY >=
              document.body.offsetHeight - 100;
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
          ScrollTrigger.getAll().forEach((instance) => instance.kill());
        };
      } else {
        const handleScroll = () => {
          const scrollPosition = window.scrollY;
          let newActiveIndex = 0;

          sectionsRef.current.forEach((section, index) => {
            if (section) {
              const sectionTop = section.offsetTop;
              const sectionHeight = section.offsetHeight;
              if (
                scrollPosition >= sectionTop - window.innerHeight / 2 &&
                scrollPosition <
                  sectionTop + sectionHeight - window.innerHeight / 2
              ) {
                newActiveIndex = index;
              }
            }
          });

          setActiveIndex(newActiveIndex);
          currentIndex.current = newActiveIndex;
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
      }
    }
  }, [isLoading, isMobile]);

  useEffect(() => {
    return () => {
      gsap.killTweensOf(window);
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="App">
      <div className="dot-nav">
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            className={`dot ${activeIndex === i ? "active" : ""}`}
            onClick={() => scrollToSection(i)}
            aria-label={`Go to section ${i + 1}`}
          >
            <span className="dot-label"></span>
          </button>
        ))}
      </div>

      <section
        className="hero-section"
        ref={(el) => (sectionsRef.current[0] = el)}
      >
        <div className="hero-content">
          <div className="title-deco">
            <img
              src={process.env.PUBLIC_URL + "/title.svg"}
              className="title-img"
              alt="About Us"
            />
            <h1 className="hero-title">
              <span className="title-accent">ABOUT US:</span> <br />
              Making Space Make Sense
            </h1>
          </div>
          <p className="hero-subtitle">
            The team behind the project and our mission to understand space
            debris
          </p>
        </div>
        <div className="scroll-prompt" onClick={() => scrollToSection(1)}>
          <p>Scroll to explore</p>
          <div className="scroll-arrow"></div>
        </div>
      </section>
      <section
        className="content-section"
        ref={(el) => (sectionsRef.current[1] = el)}
      >
        <div className="section-container">
          <div className="section-header">
            <h1>NEURASPACE</h1>
            <div className="section-number">01</div>
          </div>
          <div className="text-container">
            <TextFrame>
              <p>
                Neuraspace is addressing one of the biggest challenges in modern
                space exploration:{" "}
                <b className="highlight">
                  avoiding collisions and reducing space debris
                </b>
                .
              </p>
              <p>
                By leveraging machine learning models to track and predict the
                movement of objects in low Earth orbit, Neuraspace allows
                satellite operators to make{" "}
                <b className="highlight">faster, smarter decisions</b> before
                accidents occur.
              </p>
            </TextFrame>

            <TextFrame>
              <p>
                Fewer false alarms and faster responses mean{" "}
                <b className="highlight">
                  fewer unnecessary alerts and quicker decision-making , saving
                  fuel, time, and money.
                </b>
              </p>
              <p>
                The <b className="highlight">AI Fights Space Debris</b> project
                supports this mission by integrating Neuraspace's tools into a
                powerful Space Traffic Management (STM) platform which helps
                extend the life of satellites and reduce operational costs.
              </p>
            </TextFrame>
            <img
              src={process.env.PUBLIC_URL + "/neura.png"}
              className="section-image"
              alt="Neuraspace Logo"
            />
          </div>
        </div>
      </section>

      <section
        className="content-section"
        ref={(el) => (sectionsRef.current[2] = el)}
      >
        <div className="section-container">
          <div className="section-header">
            <h1>CISUC/UC</h1>
            <div className="section-number">02</div>
          </div>
          <div className="text-container">
            <TextFrame>
              <p>
                The Centre for Informatics and Systems of the University of
                Coimbra (CISUC) is one of Portugal's leading research
                institutions in computer science and information technology.
                Founded in 1991, CISUC brings together a team of over 280
                researchers — including professors, postdocs, and PhD students —
                working on innovative projects in areas such as
                <b className="highlight">
                  {" "}
                  artificial intelligence, software engineering, and data
                  science
                </b>
                .
              </p>
            </TextFrame>
            <TextFrame>
              <p>CISUC's mission is to:</p>
              <ul>
                <li>Drive original research and development</li>
                <li>Train the next generation of tech talent</li>
                <li>
                  Collaborate on cutting-edge national and international
                  projects
                </li>
                <li>Bridge the gap between academia and industry</li>
              </ul>
            </TextFrame>

            <img
              src={process.env.PUBLIC_URL + "/cisuc.png"}
              className="section-image"
              alt="CISUC Logo"
              style={{
                maxWidth: "50vh",
                objectFit: "contain",
              }}
            />
          </div>
        </div>
      </section>

      <section
        className="content-section"
        ref={(el) => (sectionsRef.current[3] = el)}
      >
        <div className="section-container">
          <div className="section-header">
            <div className="section-number">03</div>
            <h1>ABOUT ME</h1>
          </div>
          <div className="text-container">
            <TextFrame>
              <p>
                Hi! I'm Mariana, I'm 26, and I have a background in <b className="highlight">Computer
                Engineering</b>. Right now, I'm working on my <b className="highlight">Master's in Design and
                Multimedia</b> at the University of Coimbra.
              </p>

              <p>
                This project brings together both sides of my experience -
                technology and creativity - to raise awareness about space
                sustainability and show how design can help solve real-world
                problems.
              </p>
              <Link className="buttons" to="/context">
                View Project
              </Link>
            </TextFrame>
            <img
              src={process.env.PUBLIC_URL + "/eu.png"}
              className="section-image"
              alt="Mariana"
            />
          </div>
        </div>
      </section>

      <div ref={footerRef}>
        <Footer />
      </div>
    </div>
  );
};

export default About;
