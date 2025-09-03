import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { gsap } from "gsap";
import { ScrollToPlugin, ScrollTrigger, Observer } from "gsap/all";
import { Link, useNavigate } from "react-router-dom";
import LoadingScreen from "./pages/components/LoadingScreen";
import Footer from "./pages/components/Footer";

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger, Observer);

const App = () => {
  const sectionsRef = useRef([]);
  const footerRef = useRef(null);
  const currentIndex = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const quoteTextRef = useRef(null);
  const quoteAuthorRef = useRef(null);

  const quoteText =
    "Imagine how dangerous sailing the high seas would be if all the ships ever lost in history were still drifting on top of the water";
  const quoteAuthor = "ESA Director General Jan Wörner, 2019";

  const wordTypeWriter = (text, elementRef, callback) => {
    if (isMobile) {
      elementRef.current.textContent = text;
      elementRef.current.style.opacity = 1;
      if (callback) callback();
      return;
    }

    const words = text.split(" ");
    elementRef.current.innerHTML = words
      .map((word) => `<span style="opacity:0;">${word}</span>`)
      .join(" ");

    const wordSpans = elementRef.current.querySelectorAll("span");
    let currentIndex = 0;

    const animateNextWord = () => {
      if (currentIndex >= wordSpans.length) {
        if (callback) callback();
        return;
      }

      gsap.to(wordSpans[currentIndex], {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
        onComplete: animateNextWord,
      });

      currentIndex++;
    };

    animateNextWord();
  };

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
        scrollTo: {
          y: target,
          autoKill: false,
          offsetY: 0,
        },
        duration: 0.9,
        ease: "power3.out",
        onComplete: () => {
          currentIndex.current = index;
          setActiveIndex(index);
          setIsScrolling(false);
        },
        overwrite: "auto",
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
      // Initialize animations only if not mobile
      if (!isMobile) {
        gsap.set(quoteAuthorRef.current, { opacity: 0 });
        wordTypeWriter(quoteText, quoteTextRef, () => {
          gsap.to(quoteAuthorRef.current, {
            opacity: 1,
            duration: 1,
            ease: "power2.out",
          });
        });

        gsap.set(sectionsRef.current, { opacity: 0, y: 50 });
        gsap.set(".dot-nav", { opacity: 0 });

        gsap.to(".dot-nav", {
          opacity: 1,
          duration: 0.5,
          delay: 0.1,
        });

        gsap.to(sectionsRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.2,
          stagger: 0.1,
          delay: 0.1,
          ease: "power2.out",
        });

        // Set up ScrollTriggers for each section
        sectionsRef.current.forEach((section, i) => {
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

        // Set up Observer for wheel/touch events
        const observer = Observer.create({
          target: window,
          type: "wheel,touch",
          onDown: () => {
            const atFooter =
              window.innerHeight + window.scrollY >=
              document.body.offsetHeight - 100;
            if (
              !atFooter &&
              currentIndex.current < sectionsRef.current.length
            ) {
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

        return () => {
          observer.kill();
          ScrollTrigger.getAll().forEach((instance) => instance.kill());
        };
      } else {
        // Mobile-specific initialization
        quoteTextRef.current.textContent = quoteText;
        quoteTextRef.current.style.opacity = 1;
        quoteAuthorRef.current.textContent = quoteAuthor;
        quoteAuthorRef.current.style.opacity = 1;

        // Simple scroll event listener for mobile
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
      {!isMobile && (
        <div className="dot-nav">
          {[0, 1, 2].map((i) => (
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
      )}

      <section
        className="quote-section"
        ref={(el) => (sectionsRef.current[0] = el)}
      >
        <div className="quote-background">
          <video
            src={process.env.PUBLIC_URL + "/hero.mp4"}
            alt="Sputnik 1"
            autoPlay
            muted
            loop
            playsInline
            onClick={() => { navigate("/timeline"); }}
            cursor="pointer"
          />
        </div>
        <div className="quote-container">
          <div className="quote-content">
            <p className="quote-text" ref={quoteTextRef}></p>
            <p className="quote-author" ref={quoteAuthorRef}>
              {quoteAuthor}
            </p>
          </div>
        </div>
        <div className="scroll-prompt" onClick={() => scrollToSection(1)}>
          <p>Scroll to explore</p>
          <div className="scroll-arrow"></div>
        </div>
      </section>

      <section
        className="cards-section"
        ref={(el) => (sectionsRef.current[1] = el)}
      >
        <div className="section-header">
          <h1>EXPLORE</h1>
        </div>
        <div className="cards-container">
          <div className="card">
            <div className="card-content">
              <h3>CONTEXT</h3>
              <p>
                Learn about the growing challenge of space debris and why it
                matters for our satellite-dependent world.
              </p>
              <Link className="buttons" to="/context">
                Learn More
              </Link>
            </div>
          </div>
          <div className="card">
            <div className="card-content">
              <h3>VISUALIZATION</h3>
              <p>
                Explore interactive data visualizations that reveal what's
                really orbiting our planet.
              </p>
              <div className="card-buttons">
                <Link className="buttons" to="/timeline">
                  Timeline
                </Link>
                <Link className="buttons" to="/groups">
                  Space Hunt
                </Link>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-content">
              <h3>ABOUT</h3>
              <p>
                Discover how this project combines AI, space science, and design
                to tackle orbital congestion.
              </p>
              <Link className="buttons" to="/about">
                Our Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        className="info-section"
        ref={(el) => (sectionsRef.current[2] = el)}
      >
        <div className="section-header">
          <h1>EXPLORE THE DATA</h1>
        </div>
        <div className="section-content">
          <p>
            Curious about what's orbiting Earth? Check out our interactive
            tools:
            <br />
            The <b className="highlight">Timeline</b> shows how space debris has
            grown over time, while <b className="highlight">Space Hunt</b> turns
            orbital data into a game where you can filter the bubbles to find
            more about objects in space. You can also peek under the hood to see
            where this <b className="highlight">data</b> comes from and how we bring it to life.
          </p>
          <div
            className="buttons-container"
            style={{ justifyContent: "center" }}
          >
            <Link className="buttons" to="/timeline">
              Start »
            </Link>
          </div>
        </div>
      </section>

      <div ref={footerRef}>
        <Footer />
      </div>
    </div>
  );
};

export default App;
