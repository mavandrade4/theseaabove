import React, { useEffect, useRef, useState } from "react";
import "../App.css";
import { gsap } from "gsap";
import { ScrollToPlugin, ScrollTrigger, Observer } from "gsap/all";
import LoadingScreen from './components/LoadingScreen';

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger, Observer);

const Context = () => {
  const sectionsRef = useRef([]);
  const currentIndex = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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
    const minLoadingTime = 1000; // Shorter for subsequent pages
    const loadingStartTime = performance.now();

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, minLoadingTime);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const sections = sectionsRef.current;

      Observer.create({
        target: window,
        type: "wheel,touch",
        onDown: () => currentIndex.current < sections.length - 1 && scrollToSection(currentIndex.current + 1),
        onUp: () => currentIndex.current > 0 && scrollToSection(currentIndex.current - 1),
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

      requestAnimationFrame(() => scrollToSection(0));
    }
  }, [isLoading]);

  if (isLoading) return <LoadingScreen />;


  return (
    <div className="App">
      <div className="dot-nav">
        {[0, 1, 2, 3, 4].map((i) => (
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
          alt="Title Decoration"
          ></img>
          <h1>
            CONTEXT: <br />
            Why Space Polution Matters
          </h1>
        </div>
      </div>

      <div className="frame" ref={(el) => (sectionsRef.current[1] = el)}>
        <h1>CONTEXT</h1>
        <div className="text-frame">
          <p>
            Space has become an essential part of our daily lives. From GPS and
            internet to climate monitoring and disaster response, satellites
            orbiting Earth help power the modern world.
            <br></br>
            <br></br>
            But there's a growing problem we can't ignore: space pollution. Over
            the last decade, the amount of debris orbiting Earth has skyrocketed
            - as of September 2024, there were more than 10,200 active
            satellites in space, and over 13,000 tonnes of objects orbiting our
            planet.
            <br></br>
            <br></br>
            This growing cloud of clutter poses real risks. Fortunately, new
            technologies are being developed to clean up the mess, and
            international regulations are starting to catch up.
          </p>
        </div>
      </div>

      <div className="frame2" ref={(el) => (sectionsRef.current[2] = el)}>
        <h1>HOW WE GOT HERE</h1>
        <div className="text-frame">
          <p>
            When the first satellite, Sputnik 1, launched in 1957, it opened the
            door to the space age. Since then, we've sent thousands of
            satellites into orbit—but we haven't been great about cleaning up
            after ourselves.
            <br></br>
            <br></br>
            In 2010, NASA scientist Donald Kessler warned of a dangerous chain
            reaction: as debris collides, it creates more debris, increasing the
            chance of even more collisions. This nightmare scenario — known as
            the Kessler Syndrome — is no longer just a theory.
            <br></br>
            <br></br>
            By 2024, we had already seen more than 650 collisions, explosions,
            or abnormal events in orbit. Every new piece of junk puts important
            systems at risk — like communications, weather forecasts, and even
            emergency services.
          </p>
        </div>
      </div>

      <div className="frame" ref={(el) => (sectionsRef.current[3] = el)}>
        <h1>CLEANING UP</h1>
        <div className="text-frame">
          <p>
            Thankfully, we're not just standing by. Around the world, several
            creative and high-tech solutions are being developed to tackle space
            debris head-on.
            <br></br>
            <br></br>
            One method involves controlled re-entry, where large debris is
            safely guided back into Earth's atmosphere to burn up. Another
            approach uses physical tools like nets and harpoons—missions such as
            RemoveDEBRIS have already begun testing these systems to catch
            orbiting junk.
            <br></br>
            <br></br>
            More recently, engineers have explored the use of magnetic systems,
            where satellites equipped with magnets can attach to old hardware
            and pull it out of orbit. These innovations show that cleaning up
            space is not only possible—it's already happening. The next step is
            scaling these efforts to meet the growing challenge.
          </p>
        </div>
      </div>

      <div className="frame2" ref={(el) => (sectionsRef.current[4] = el)}>
        <h1>WHO'S RESPONSIBLE</h1>
        <div className="text-frame">
          <p>
            Cleaning space isn't just about technology — it's also about
            accountability. Legal frameworks and international agreements have
            started to address who is responsible for debris in orbit.
            <br></br>
            <br></br>
            As early as 1971, the United Nations established that countries are
            responsible for any object they launch into space, including any
            damage it may cause. In 2017, the European Space Agency (ESA)
            introduced a policy requiring satellites to be designed so they can
            either re-enter Earth's atmosphere safely or be moved to a distant
            “graveyard orbit” at the end of their life. Two years later, ESA
            funded the ADRIOS mission, led by ClearSpace, to actively retrieve a
            piece of satellite equipment left in space. And in 2023, space
            agencies around the world agreed on new guidelines mandating that
            inactive satellites must be removed from orbit within five years.
            These policies mark real progress—but there's still a long way to go
            in building a truly sustainable future in space.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Context;
