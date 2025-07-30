import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { gsap } from "gsap";
import { ScrollToPlugin, ScrollTrigger, Observer } from "gsap/all";
import { Link } from "react-router-dom";
import LoadingScreen from './pages/components/LoadingScreen';
import Footer from "./pages/components/Footer";

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger, Observer);

const App = () => {
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
      {<div className="dot-nav">
        {[0, 1].map((i) => (
          <div
            key={i}
            className={`dot ${activeIndex === i ? "active" : ""}`}
            onClick={() => scrollToSection(i)}
          />
        ))}
      </div>}
      <div className="container">
        <div
          className="frame"
          ref={(el) => (sectionsRef.current[0] = el)}
          style={{ height: "100vh", backgroundColor: "#070707" }}
        >
          <h1
            style={{
              width: "50vw",
              position: "relative",
              zIndex: "5",
              marginTop: "20vh",
            }}
          >
            THE SEA ABOVE
          </h1>
          <div
            className="text-frame"
            style={{ zIndex: "5", fontSize: "1.3rem" }}
          >
            <p className="fade-in-text">
              "Imagine how dangerous sailing the high seas would be if all the
              ships ever lost in history were still drifting on top of the
              water"
            </p>
            <p>ESA Director General Jan Wörner, 2019</p>
            <Link className="buttons" to="/timeline">
              START
            </Link>
          </div>
          <img
            src={process.env.PUBLIC_URL + "/anim1.gif"} 
            alt="Sputnik 1"
            className="image-frame"
            style={{ right: "0" }}
          />
        </div>
      </div>

      <div className="frame" ref={(el) => (sectionsRef.current[1] = el)}>
        <div className="title-deco-2">
          <img src={process.env.PUBLIC_URL + "/title-2.svg"} alt="Title decoration" />
          <h1>CONTEXT</h1>
        </div>
        <div className="text-frame">
          <p>
            Space has become an essential part of our daily lives. From GPS and
            internet to climate monitoring and disaster response, satellites
            orbiting Earth help power the modern world. But as orbit becomes
            increasingly crowded, new challenges emerge. This page explores how
            we got here—tracing the rapid growth of satellites and space
            debris—while looking at the risks they pose to current and future
            missions. It also highlights the technologies and policies already
            in place to clean up and manage this shared space more sustainably.
          </p>
        </div>
        <Link className="buttons" to="/context">
          KNOW MORE
        </Link>
      </div>

      {/*

      <div className="frame" ref={(el) => (sectionsRef.current[2] = el)}>
        <div className="title-deco-2" style={{margin:"10vh 0 0 -130px"}}>
          <img src={process.env.PUBLIC_URL + "/title-2.svg"} alt="Title decoration" style={{height:"90%", width: "calc(100% + 100px + 10px)"}} />
          <h1>VISUALIZATION</h1>
        </div>
        <div className="text-frame">
          <p>
            Behind every object in orbit lies a story told through data. This
            page transforms technical information into clear, interactive
            visuals that help make sense of what's really up there. Here, you'll
            discover what kinds of objects are circling the Earth, where they
            come from, and how long they've been in orbit. It also offers
            insight into how the datasets were collected, cleaned, and brought
            together to power the visual experience.
          </p>
        </div>
        <div className="buttons-container">
        <Link className="buttons" to="/timeline">
          SEE TIMELINE
        </Link>
        <Link className="buttons" to="/data">
          KNOW MORE
        </Link>
        </div>
      </div>

      <div className="frame" ref={(el) => (sectionsRef.current[3] = el)}>
        <div className="title-deco-2">
          <img src={process.env.PUBLIC_URL + "/title-2.svg"} alt="Title decoration" />
          <h1>ABOUT</h1>
        </div>
        <div className="text-frame">
          <p>
            This project combines artificial intelligence, space science, and
            visual design to shed light on the growing problem of orbital
            congestion. Here, you'll learn more about the role of Neuraspace in
            managing space traffic and how AI is being used to predict and
            prevent collisions. It also shares the story behind the development
            of this platform—how it came to be, who was involved, and why making
            this topic more accessible matters now more than ever.
          </p>
        </div>
        <Link className="buttons" to="/about">
          KNOW MORE
        </Link>
      </div> */}
      <div ref={footerRef}>
        <Footer />
      </div>
    </div>
  );
};

export default App;