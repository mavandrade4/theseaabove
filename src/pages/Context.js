import React, { useEffect, useRef, useState } from "react";
import "../App.css";
import { gsap } from "gsap";
import { ScrollToPlugin, ScrollTrigger, Observer } from "gsap/all";
import LoadingScreen from "./components/LoadingScreen";
import Footer from "./components/Footer";
import { useInView } from "react-intersection-observer";

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger, Observer);

const TextFrame = ({ children }) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  return (
    <div 
      ref={ref}
      className={`text-frame ${inView ? "animate-in" : ""}`}
    >
      {children}
    </div>
  );
};

const Context = () => {
  const sectionsRef = useRef([]);
  const footerRef = useRef(null);
  const currentIndex = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const contentRef = useRef(null);
  const [titleImageLoaded, setTitleImageLoaded] = useState(false);

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
    <div className="App" ref={contentRef}>
      <div className="dot-nav">
        {[0, 1, 2, 3, 4].map((i) => (
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
              <span className="title-accent">CONTEXT:</span> <br />
              Why Space Pollution Matters
            </h1>
          </div>
          <p className="hero-subtitle">
            Understanding the growing threat of orbital debris and humanity's
            response
          </p>
        </div>
        <div className="scroll-prompt">
          <p>Scroll to explore</p>
          <div className="scroll-arrow"></div>
        </div>
      </section>

      <section
        className="frame content-section"
        ref={(el) => (sectionsRef.current[1] = el)}
        style={{
          background:
            "linear-gradient(135deg, --var(--bg-dark) 0%, #141414 100%)",
        }}
      >
        <div className="section-container">
          <div className="section-header">
            <h1>THE CURRENT SITUATION</h1>
            <div className="section-number">01</div>
          </div>
          <div className="text-container">
            <TextFrame>
              <p>
                Space has become an essential part of our daily lives. From{" "}
                <b className="highlight">GPS</b> and
                <b className="highlight"> internet</b> to{" "}
                <b className="highlight">climate monitoring</b> and{" "}
                <b className="highlight">disaster response</b>, satellites
                orbiting Earth help power the modern world.
              </p>

              <p>
                However, over the last decade, the amount of debris orbiting
                Earth has skyrocketed - as of September 2024, there were more
                than{" "}
                <b className="highlight">10,200 active satellites in space</b>,
                and over <b className="highlight">13,000 tonnes</b> of objects
                orbiting our planet.
              </p>
            </TextFrame>
            <TextFrame>
              <p>
                This growing cloud of clutter poses real risks. Fortunately, new
                technologies are being developed to clean up the mess, and
                international regulations are starting to catch up.
              </p>
            </TextFrame>
          </div>
        </div>
      </section>

      <section
        className="frame content-section"
        ref={(el) => (sectionsRef.current[2] = el)}
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #141414 100%)",
        }}
      >
        <div className="section-container">
          <div className="section-header">
            <h1>HOW WE GOT HERE</h1>
            <div className="section-number">02</div>
          </div>
          <div className="text-container">
            <TextFrame>
              <p>
                When the first satellite,{" "}
                <b className="highlight">Sputnik 1, launched in 1957</b>, it
                opened the door to the space age. Since then, we've sent
                thousands of satellites into orbit, but we haven't been great
                about cleaning up after ourselves.
              </p>
              <p>
                In 2010, NASA scientist{" "}
                <b className="highlight">Donald Kessler</b> warned of a
                dangerous chain reaction: as debris collides, it creates more
                debris, increasing the chance of even more collisions. This
                nightmare scenario known as the{" "}
                <b className="highlight">Kessler Syndrome</b> is no longer just
                a theory.
              </p>
            </TextFrame>

            <TextFrame>
              <p>
                By 2024, we had already seen more than 650 collisions,
                explosions, or abnormal events in orbit. Every new piece of junk
                puts important systems at risk{" "}
                <b className="highlight">
                  like communications, weather forecasts, and even emergency
                  services
                </b>
                .
              </p>
            </TextFrame>
          </div>
        </div>
      </section>

      <section
        className="frame content-section"
        ref={(el) => (sectionsRef.current[3] = el)}
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #141414 100%)",
        }}
      >
        <div className="section-container">
          <div className="section-header">
            <h1>CLEANING UP</h1>
            <div className="section-number">03</div>
          </div>
          <div className="text-container">
            <TextFrame>
              <p>
                Thankfully, we're not just standing by. Around the world,
                several creative and high-tech solutions are being developed to
                fight space debris.
              </p>
              <p>
                One method involves{" "}
                <b className="highlight">controlled re-entry</b> which ensures
                large debris is safely directed back into Earth's atmosphere to
                disintegrate. Missions like RemoveDEBRIS use{" "}
                <b className="highlight">
                  physical tools, like nets and harpoons,
                </b>
                and these technologies have already started undergoing testing
                to intercept space junk in orbit.
              </p>
            </TextFrame>

            <TextFrame>
              <p>
                More recently, engineers have explored the use of{" "}
                <b className="highlight">magnetic systems</b>, where satellites
                equipped with magnets can attach to old hardware and pull it out
                of orbit. These innovations show that
                <b className="highlight">
                  {" "}
                  cleaning up space is not only possible, it's already happening
                </b>
                . The next step is scaling these efforts to meet the growing
                challenge.
              </p>
            </TextFrame>
          </div>
        </div>
      </section>

      <section
        className="frame content-section"
        ref={(el) => (sectionsRef.current[4] = el)}
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #141414 100%)",
        }}
      >
        <div className="section-container">
          <div className="section-header">
            <h1>WHO'S RESPONSIBLE</h1>
            <div className="section-number">04</div>
          </div>
          <div className="text-container">
            <TextFrame>
              <p>
                Cleaning space isn't just about technology but also about
                <b className="highlight"> accountability</b>: legal frameworks
                and international agreements have started to address who is
                responsible for debris in orbit.
              </p>
              <p>
                As early as 1971, the United Nations established that{" "}
                <b className="highlight">
                  countries are responsible for any object they launch into
                  space
                </b>
                , including any damage it may cause.
              </p>
            </TextFrame>

            <TextFrame>
              <p>
                In 2017, the{" "}
                <b className="highlight">European Space Agency (ESA) </b>
                introduced a policy requiring satellites to be designed so they
                can either re-enter Earth's atmosphere safely or be moved to a
                distant "graveyard orbit" at the end of their life.
              </p>
              <p>
                In 2023, space agencies around the world agreed on
                new guidelines mandating that inactive{" "}
                <b className="highlight">
                  satellites must be removed from orbit within five years
                </b>
                . These policies mark real progress but there's still a long way
                to go in building a truly sustainable future in space.
              </p>
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

export default Context;