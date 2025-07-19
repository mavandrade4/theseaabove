import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger, Observer } from "gsap/all";
import "../App.css";
import { Link } from "react-router-dom";
import LoadingScreen from './components/LoadingScreen';

const Project = () => {
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
        {[0, 1, 2, 3, 4, 5].map((i) => (
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
            THE SEA ABOVE: <br />
            The Project
          </h1>
        </div>
      </div>

      <div className="frame" ref={(el) => (sectionsRef.current[1] = el)}>
        <h1>Where Our Information Comes From</h1>
        <div className="text-frame">
          <p>
            To create the visualizations on this page, we brought together and
            cleaned up data from two main sources. These datasets provide
            information about satellites and space debris currently orbiting
            Earth.
          </p>
        </div>
      </div>

      <div className="frame2" ref={(el) => (sectionsRef.current[2] = el)}>
        <h1>Space Decay Dataset</h1>
        <div className="text-frame">
          <p>
            This dataset comes from space-track.org, a trusted source for
            tracking objects in space. It includes data on active satellites,
            inactive ones, and space debris. The Space Decay dataset was
            collected by KANDHAL KHANDEKA using the public API provided by
            space-track.org. It contains a broad range of information about
            objects currently in orbit, including their names, types, and launch
            years. Originally, the dataset was designed for exploratory data
            analysis (EDA), making it well-suited for identifying patterns and
            trends in orbital activity.
          </p>
        </div>
      </div>
      <div className="frame" ref={(el) => (sectionsRef.current[3] = el)}>
        <h1>Neuraspace's Space Objects</h1>
        <div className="text-frame">
          <p>
            This is an internal dataset from Neuraspace, a company focused on
            satellite collision prevention. It provides detailed, structured
            information about space objects, including their purpose,
            operational status, and technical specs. The dataset from Neuraspace
            offers detailed and structured information about each space object.
            It includes official names and unique identifiers, along with
            classifications by type and subtype. Additionally, it records the
            country of origin and indicates whether each object is still active.
            This data is designed for long-term use in space traffic management,
            helping to monitor and coordinate objects in orbit more effectively.
          </p>
        </div>
      </div>

      <div className="frame2" ref={(el) => (sectionsRef.current[4] = el)}>
        <h1>How We Processed the Data</h1>
        <div className="text-frame">
          <p>
            To make the information easier to work with and visualize, both
            datasets were carefully merged into a single, unified structure.
            During this process, duplicate entries were identified and removed
            by cross-referencing the two sources. The data was then cleaned and
            standardized by organizing it into seven core categories: name,
            launch year, type (such as satellite or debris), subtype (like
            payload or rocket body), country of origin, an identifier (using the
            COSPAR ID), and finally, the source of the data — whether it came
            from Space Decay or Neuraspace.
          </p>
        </div>
      </div>

      <div className="frame" ref={(el) => (sectionsRef.current[5] = el)}>
        <h1>Why It Matters</h1>
        <div className="text-frame">
          <p>
            Combining and cleaning these datasets helps paint a more complete
            and accurate picture of what's happening in Earth's orbit. The
            better we understand what's up there, the better we can protect
            satellites, avoid collisions, and keep space safe.
          </p>
          <Link className="buttons" Link to="/timeline">See Visualization</Link>
        </div>
      </div>
    </div>
  );
};

export default Project;
