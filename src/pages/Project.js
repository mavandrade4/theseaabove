import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger, Observer } from "gsap/all";
import "../App.css";
import { Link } from "react-router-dom";
import LoadingScreen from "./components/LoadingScreen";
import Footer from "./components/Footer";
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

const Project = () => {
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
      // Simple scroll for mobile
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
    // Check if mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    // Set proper viewport height for mobile
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVh();
    window.addEventListener("resize", setVh);

    // Loading timeout
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
        // Desktop setup with GSAP
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
        // Mobile setup - simple scroll listener
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
        {[0, 1, 2, 3, 4, 5].map((i) => (
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
              alt="The Sea Above Project"
            />
            <h1 className="hero-title">
              <span className="title-accent">THE SEA ABOVE:</span> <br />
              The Data
            </h1>
          </div>
          <p className="hero-subtitle">
            Visualizations powered by cleaned data from two sources on
            Earth-orbiting satellites and space debris
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
            <h1>Neuraspace's Space Objects</h1>
            <div className="section-number">03</div>
          </div>
          <div className="text-container">
            <TextFrame>
              <p>
                This is an internal dataset from Neuraspace,{" "}
                <b className="highlight">
                  a company focused on satellite collision prevention
                </b>
                . It provides detailed, structured information about space
                objects, including their purpose, operational status, and
                technical specs.
              </p>
            </TextFrame>
            <TextFrame>
              <p>
                The dataset from Neuraspace offers detailed and structured
                information about each space object. It includes{" "}
                <b className="highlight">
                  official names and unique identifiers, along with
                  classifications by type and subtype
                </b>
                . Additionally, it records the country of origin and indicates
                whether each object is still active.
              </p>
            </TextFrame>
          </div>
        </div>
      </section>
      <section
        className="content-section"
        ref={(el) => (sectionsRef.current[2] = el)}
      >
        <div className="section-container">
          <div className="section-header">
            <h1>Space Decay Dataset</h1>
            <div className="section-number">02</div>
          </div>
          <div className="text-container">
            <TextFrame>
              <p>
                This dataset comes from{" "}
                <b className="highlight"> space-track.org</b>, a trusted source
                for tracking objects in space. It includes data on active
                satellites, inactive ones, and space debris.
              </p>
              <p>
                The Space Decay dataset was collected by{" "}
                <b className="highlight">KANDHAL KHANDEKA</b> using the public
                API provided by space-track.org.
              </p>
            </TextFrame>

            <TextFrame>
              <p>
                It contains a broad range of information about objects currently
                in orbit, including their{" "}
                <b className="highlight">names, types, and launch years</b>.
              </p>
              <p>
                Originally, the dataset was designed for exploratory data
                analysis, making it well-suited for identifying patterns and
                trends in orbital activity.
              </p>
            </TextFrame>
          </div>
        </div>
      </section>

      <section
        className="content-section"
        ref={(el) => (sectionsRef.current[3] = el)}
      >
        <div className="section-container">
          <div className="section-header">
            <h1>How We Processed the Data</h1>
            <div className="section-number">04</div>
          </div>
          <div className="text-container">
            <TextFrame>
              <p>
                To make the information easier to work with and visualize, both
                datasets were <b className="highlight">carefully merged</b> into
                a single, unified structure. During this process, duplicate
                entries were identified and removed by cross-referencing the two
                sources.
              </p>
            </TextFrame>
            <TextFrame>
              <p>
                The data was then cleaned and standardized by organizing it into
                seven core categories:
                <b className="highlight"> name</b>,
                <b className="highlight"> launch year</b>,{" "}
                <b className="highlight">type </b>(such as satellite or debris),{" "}
                <b className="highlight">subtype</b> (like payload or rocket
                body),
                <b className="highlight">country of origin</b>,
                <b className="highlight"> an identifier</b> (using the COSPAR
                ID), and finally, the source of the data — whether it came from
                Space Decay or Neuraspace.
              </p>
            </TextFrame>
          </div>
        </div>
      </section>
      <section
        className="content-section"
        ref={(el) => (sectionsRef.current[4] = el)}
      >
        <div className="section-container">
          <div className="section-header">
            <h1>Why It Matters</h1>
            <div className="section-number">05</div>
          </div>
          <div className="text-container">
            <TextFrame>
              <p>
                Combining and cleaning these datasets helped paint a more
                complete and accurate picture of what's happening in Earth's
                orbit.{" "}
              </p>

              <p>
                <b className="highlight">
                  The better we understand what's up there, the better we can
                  protect satellites, avoid collisions, and keep space safe.
                </b>
              </p>
              <div className="buttons-container">
                <Link className="buttons" to="/timeline">
                  Timeline
                </Link>
                <Link className="buttons" to="/timeline">
                  Space Hunt
                </Link>
              </div>
            </TextFrame>
          </div>
        </div>
      </section>

      <div ref={footerRef}>
        <Footer />
      </div>
    </div>
  );
};

export default Project;
