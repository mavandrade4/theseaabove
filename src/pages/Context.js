import React, { useEffect, useRef, useState } from "react";
import "../App.css";
import { gsap } from "gsap";
import { ScrollToPlugin, ScrollTrigger, Observer } from "gsap/all";
import LoadingScreen from "./components/LoadingScreen";
import Footer from "./components/Footer";

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger, Observer);

const Context = () => {
  const sectionsRef = useRef([]);
  const footerRef = useRef(null);
  const currentIndex = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const contentRef = useRef(null);
  const [titleImageLoaded, setTitleImageLoaded] = useState(false);

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
      gsap.set(sectionsRef.current, { opacity: 0, y: 50 });
      gsap.set(".dot-nav", { opacity: 0 });

      gsap.to(".dot-nav", { opacity: 1, duration: 1, delay: 0.5 });
      gsap.to(sectionsRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.2,
        delay: 0.3,
        ease: "power2.out",
      });

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
    }
  }, [isLoading]);

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
            <span className="dot-label">{i + 1}</span>
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
          background: "linear-gradient(135deg, #0a0a0a 0%, #141414 100%)",
        }}
      >
        <div className="section-container">
          <div className="section-header">
            <div className="section-number">01</div>
            <h1>THE CURRENT SITUATION</h1>
          </div>
          <div className="text-frame">
            <p>
              Space has become an essential part of our daily lives. From{" "}
              <b className="highlight">GPS</b> and 
              <b className="highlight"> internet</b> to{" "}
              <b className="highlight">climate monitoring</b> and{" "}
              <b className="highlight">disaster response</b>, satellites
              orbiting Earth help power the modern world.
            </p>
            <p>
              But there's a growing problem we can't ignore: space pollution.
              Over the last decade, the amount of debris orbiting Earth has
              skyrocketed - as of September 2024, there were more than{" "}
              <b className="highlight">10,200 active satellites in space</b>,
              and over <b className="highlight">13,000 tonnes</b> of objects
              orbiting our planet.
            </p>
            <p>
              This growing cloud of clutter poses real risks. Fortunately, new
              technologies are being developed to clean up the mess, and
              international regulations are starting to catch up.
            </p>
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
            <div className="section-number">02</div>
            <h1>HOW WE GOT HERE</h1>
          </div>
          <div className="text-frame">
            <p>
              When the first satellite, Sputnik 1, launched in 1957, it opened
              the door to the space age. Since then, we've sent thousands of
              satellites into orbit—but we haven't been great about cleaning up
              after ourselves.
            </p>
            <p>
              In 2010, NASA scientist Donald Kessler warned of a dangerous chain
              reaction: as debris collides, it creates more debris, increasing
              the chance of even more collisions. This nightmare scenario —
              known as the Kessler Syndrome — is no longer just a theory.
            </p>
            <p>
              By 2024, we had already seen more than 650 collisions, explosions,
              or abnormal events in orbit. Every new piece of junk puts
              important systems at risk — like communications, weather
              forecasts, and even emergency services.
            </p>
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
            <div className="section-number">03</div>
            <h1>CLEANING UP</h1>
          </div>
          <div className="text-frame">
            <p>
              Thankfully, we're not just standing by. Around the world, several
              creative and high-tech solutions are being developed to tackle
              space debris head-on.
            </p>
            <p>
              One method involves controlled re-entry, where large debris is
              safely guided back into Earth's atmosphere to burn up. Another
              approach uses physical tools like nets and harpoons—missions such
              as RemoveDEBRIS have already begun testing these systems to catch
              orbiting junk.
            </p>
            <p>
              More recently, engineers have explored the use of magnetic
              systems, where satellites equipped with magnets can attach to old
              hardware and pull it out of orbit. These innovations show that
              cleaning up space is not only possible—it's already happening. The
              next step is scaling these efforts to meet the growing challenge.
            </p>
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
            <div className="section-number">04</div>
            <h1>WHO'S RESPONSIBLE</h1>
          </div>
          <div className="text-frame">
            <p>
              Cleaning space isn't just about technology — it's also about
              accountability. Legal frameworks and international agreements have
              started to address who is responsible for debris in orbit.
            </p>
            <p>
              As early as 1971, the United Nations established that countries
              are responsible for any object they launch into space, including
              any damage it may cause. In 2017, the European Space Agency (ESA)
              introduced a policy requiring satellites to be designed so they
              can either re-enter Earth's atmosphere safely or be moved to a
              distant "graveyard orbit" at the end of their life.
            </p>
            <p>
              Two years later, ESA funded the ADRIOS mission, led by ClearSpace,
              to actively retrieve a piece of satellite equipment left in space.
              And in 2023, space agencies around the world agreed on new
              guidelines mandating that inactive satellites must be removed from
              orbit within five years. These policies mark real progress—but
              there's still a long way to go in building a truly sustainable
              future in space.
            </p>
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
