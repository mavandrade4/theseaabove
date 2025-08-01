import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { gsap } from "gsap";
import { ScrollToPlugin, ScrollTrigger } from "gsap/all";
import { Link, useNavigate } from "react-router-dom";
import LoadingScreen from "./pages/components/LoadingScreen";
import Footer from "./pages/components/Footer";

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

const App = () => {
  const sectionsRef = useRef([]);
  const footerRef = useRef(null);
  const currentIndex = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const navigate = useNavigate();
  const quoteTextRef = useRef(null);
  const quoteAuthorRef = useRef(null);
  const touchStartY = useRef(0);

  const quoteText = "Imagine how dangerous sailing the high seas would be if all the ships ever lost in history were still drifting on top of the water";
  const quoteAuthor = "ESA Director General Jan Wörner, 2019";

  const wordTypeWriter = (text, elementRef, callback) => {
    const words = text.split(" ");
    elementRef.current.innerHTML = words.map(word => 
      `<span style="opacity:0;">${word}</span>`
    ).join(" ");
    
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
        onComplete: animateNextWord
      });

      currentIndex++;
    };

    animateNextWord();
  };

  const scrollToSection = (index) => {
    if (isScrolling) return;
    setIsScrolling(true);

    const target = index < sectionsRef.current.length 
      ? sectionsRef.current[index] 
      : footerRef.current;

    if (!target) return;

    gsap.to(window, {
      scrollTo: {
        y: target,
        autoKill: false
      },
      duration: 0.9,
      ease: "power3.out",
      onComplete: () => {
        currentIndex.current = index;
        setActiveIndex(index);
        setIsScrolling(false);
      },
      overwrite: "auto"
    });
  };

  useEffect(() => {
    // Set proper viewport height for mobile
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);

    // Loading timeout
    const timer = setTimeout(() => setIsLoading(false), 1000);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', setVh);
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // Disable native smooth scrolling
      document.documentElement.style.scrollBehavior = 'auto';

      // Initialize animations
      gsap.set(quoteAuthorRef.current, { opacity: 0 });
      wordTypeWriter(quoteText, quoteTextRef, () => {
        gsap.to(quoteAuthorRef.current, { 
          opacity: 1, 
          duration: 1,
          ease: "power2.out" 
        });
      });

      gsap.set(sectionsRef.current, { opacity: 0, y: 50 });
      gsap.set(".dot-nav", { opacity: 0 });

      gsap.to(".dot-nav", { 
        opacity: 1, 
        duration: 0.8, 
        delay: 0.5 
      });

      gsap.to(sectionsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.2,
        delay: 0.3,
        ease: "power2.out",
      });

      // Scroll handlers
      const handleWheel = (e) => {
        if (isScrolling || Math.abs(e.deltaY) < 5) return;

        const direction = e.deltaY > 0 ? 1 : -1;
        const newIndex = currentIndex.current + direction;
        
        if (newIndex >= 0 && newIndex <= sectionsRef.current.length) {
          scrollToSection(newIndex);
        }
      };

      const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
      };

      const handleTouchEnd = (e) => {
        if (isScrolling) return;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchEndY - touchStartY.current;
        
        if (Math.abs(deltaY) < 50) return;

        const direction = deltaY < 0 ? 1 : -1;
        const newIndex = currentIndex.current + direction;
        
        if (newIndex >= 0 && newIndex <= sectionsRef.current.length) {
          scrollToSection(newIndex);
        }
      };

      window.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('touchstart', handleTouchStart, { passive: false });
      window.addEventListener('touchend', handleTouchEnd, { passive: false });

      return () => {
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchend', handleTouchEnd);
        ScrollTrigger.getAll().forEach(instance => instance.kill());
        gsap.killTweensOf(window);
      };
    }
  }, [isLoading]);

  if (isLoading) return <LoadingScreen />;

  const handleClickImg = () => {
    navigate("/timeline");
  };

  return (
    <div className="App">
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

      {/* Hero Section with Quote */}
      <section
        className="quote-section"
        ref={(el) => (sectionsRef.current[0] = el)}
      >
        <div className="quote-background">
          <img
            src={process.env.PUBLIC_URL + "/anim1.gif"}
            alt="Sputnik 1"
            /*onClick={handleClickImg}*/
          />
        </div>
        <div className="quote-container">
          <div className="quote-content">
            <blockquote className="quote-text" ref={quoteTextRef}></blockquote>
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

      {/* Cards Section */}
      <section
        className="cards-section"
        ref={(el) => (sectionsRef.current[1] = el)}
      >
        <div className="section-header">
          <h1>EXPLORE</h1>
        </div>
        <div className="cards-container">
          <div className="card">
            <h3>CONTEXT</h3>
            <p>
              Learn about the growing challenge of space debris and why it
              matters for our satellite-dependent world.
            </p>
            <Link className="buttons" to="/context">
              LEARN MORE
            </Link>
          </div>

          <div className="card">
            <h3>VISUALIZATION</h3>
            <p>
              Explore interactive data visualizations that reveal what's really
              orbiting our planet.
            </p>
            <div className="card-buttons">
              <Link className="buttons" to="/timeline">
                TIMELINE
              </Link>
              <Link className="buttons" to="/data">
                DATA
              </Link>
            </div>
          </div>

          <div className="card">
            <h3>ABOUT</h3>
            <p>
              Discover how this project combines AI, space science, and design
              to tackle orbital congestion.
            </p>
            <Link className="buttons" to="/about">
              OUR STORY
            </Link>
          </div>
        </div>
      </section>

      {/* Info Sections */}
      <section
        className="info-section"
        ref={(el) => (sectionsRef.current[2] = el)}
      >
        <div className="section-header">
          <h1>CONTEXT</h1>
        </div>
        <div className="section-content">
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
          <Link className="buttons" to="/context">
            KNOW MORE
          </Link>
        </div>
      </section>

      <section
        className="info-section"
        ref={(el) => (sectionsRef.current[3] = el)}
      >
        <div className="section-header">
          <h1>VISUALIZATION</h1>
        </div>
        <div className="section-content">
          <p>
            Behind every object in orbit lies a story told through data. This
            page transforms technical information into clear, interactive
            visuals that help make sense of what's really up there. Here, you'll
            discover what kinds of objects are circling the Earth, where they
            come from, and how long they've been in orbit. It also offers
            insight into how the datasets were collected, cleaned, and brought
            together to power the visual experience.
          </p>
          <div className="buttons-container">
            <Link className="buttons" to="/timeline">
              SEE TIMELINE
            </Link>
            <Link className="buttons" to="/data">
              KNOW MORE
            </Link>
          </div>
        </div>
      </section>

      <section
        className="info-section"
        ref={(el) => (sectionsRef.current[4] = el)}
      >
        <div className="section-header">
          <h1>ABOUT</h1>
        </div>
        <div className="section-content">
          <p>
            This project combines artificial intelligence, space science, and
            visual design to shed light on the growing problem of orbital
            congestion. Here, you'll learn more about the role of Neuraspace in
            managing space traffic and how AI is being used to predict and
            prevent collisions. It also shares the story behind the development
            of this platform—how it came to be, who was involved, and why making
            this topic more accessible matters now more than ever.
          </p>
          <Link className="buttons" to="/about">
            KNOW MORE
          </Link>
        </div>
      </section>

      <div ref={footerRef}>
        <Footer />
      </div>
    </div>
  );
};

export default App;
