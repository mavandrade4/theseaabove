import React, { useEffect, useRef, useContext, useState } from "react";
import { dataContext } from "../../context/dataContext";
import * as d3 from "d3";
import "../../App.css";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollToPlugin from "gsap/ScrollToPlugin";
import { AnimationContext } from "../../context/AnimationContext";
import { useOutletContext } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
const InteractiveCircles = ({ width, height }) => {
  const ref = useRef(null);
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    const initialNodes = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      r: 4 + Math.random() * 3,
      vx: Math.random() * 0.3 - 0.15,
      vy: Math.random() * 0.3 - 0.15,
      color: Math.random() > 0.5 ? "var(--primary)" : "#4e79a7", // Primary or US color
      isDragging: false,
      opacity: 0.9,
    }));
    setNodes(initialNodes);

    let animationId;
    const animate = () => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.isDragging) return node;

          let x = node.x + node.vx;
          let y = node.y + node.vy;
          let vx = node.vx;
          let vy = node.vy;

          if (x < node.r || x > width - node.r) vx *= -1;
          if (y < node.r || y > height - node.r) vy *= -1;

          x = Math.max(node.r, Math.min(width - node.r, x));
          y = Math.max(node.r, Math.min(height - node.r, y));

          return { ...node, x, y, vx, vy };
        })
      );
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [width, height]);

  const handleDragStart = (id) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === id ? { ...node, isDragging: true } : node
      )
    );
  };

  const handleDrag = (id, [dx, dy]) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id !== id) return node;

        const x = Math.max(node.r, Math.min(width - node.r, node.x + dx));
        const y = Math.max(node.r, Math.min(height - node.r, node.y + dy));

        return { ...node, x, y };
      })
    );
  };

  const handleDragEnd = (id) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === id ? { ...node, isDragging: false } : node
      )
    );
  };

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      style={{
        display: "block",
        background: "transparent",
        overflow: "visible",
      }}
    >
      {nodes.map((node) => (
        <circle
          key={node.id}
          cx={node.x}
          cy={node.y}
          r={node.r}
          fill="transparent"
          stroke={node.color}
          strokeWidth={1.5}
          opacity={node.opacity}
          onPointerDown={() => handleDragStart(node.id)}
          onPointerMove={(e) => {
            if (node.isDragging && e.buttons === 1) {
              const svg = ref.current;
              const pt = svg.createSVGPoint();
              pt.x = e.clientX;
              pt.y = e.clientY;
              const { x, y } = pt.matrixTransform(svg.getScreenCTM().inverse());
              handleDrag(node.id, [x - node.x, y - node.y]);
            }
          }}
          onPointerUp={() => handleDragEnd(node.id)}
          onPointerLeave={() => handleDragEnd(node.id)}
          style={{
            cursor: "pointer",
            touchAction: "none",
            transition: "stroke 0.3s ease", // Smooth color transition if changed
          }}
        />
      ))}
    </svg>
  );
};

const TimelineVis = () => {
  const groupBy = "year";
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [useColor, setUseColor] = useState(false);
  const [useWhiteBars, setUseWhiteBars] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(false);

  const svgRef = useRef();
  const scrollTargetRef = useRef();
  const resumeRef = useRef(null);
  const scrollTweenRef = useRef(null);

  const data = useContext(dataContext);
  const { animationDone, setAnimationDone } = useContext(AnimationContext);

  const allYears = Array.from({ length: 2023 - 1956 + 1 }, (_, i) => 1957 + i);

  const annotations = [
    {
      year: "Start",
      title: "Space Objects Timeline",
      message:
        "Each circle represents an object in Earth's orbit. Satellites will appear on the left side, while space debris will appear on the right.",
      interactive: true,
    },
    {
    "year": "1957",
    "title": "Launch of Sputnik 1",
    "message": "The Soviet Union launches the first artificial satellite, marking the dawn of the Space Age. While Sputnik itself burned up re-entering the atmosphere in 1958, its launch represented the first human-made object placed into orbit, fundamentally altering the celestial environment and setting the stage for the future debris problem."
  },
  {
    "year": "1961",
    "title": "First Human in Space",
    "message": "Yuri Gagarin's historic flight aboard Vostok 1 turns space into a domain for human activity. This milestone accelerated the space race, leading to a rapid increase in launches and, consequently, the number of objects left in orbit, from spent rocket bodies to decommissioned satellites."
  },
  {
    "year": "1965",
    "title": "First Documented Satellite Fragmentation Event",
    "message": "The upper stage of the US's Transit 4A satellite (a nuclear-powered navigational satellite) exploded after its mission ended, creating hundreds of trackable debris pieces. This was the first of many such 'break-up events,' proving that orbital debris could be generated unintentionally and would persist for years."
  },
  {
    "year": "1978",
    "title": "First Comprehensive Space Debris Tracking Program",
    "message": "The U.S. Air Force and NASA formally establish a cooperative effort to systematically track and catalog orbital debris. This was driven by the growing recognition that debris posed a collision risk to operational spacecraft. The program leveraged the powerful Space Surveillance Network (SSN) of radars and optical sensors."
  },
  {
    "year": "1996",
    "title": "First Confirmed On-Orbit Collision with Debris",
    "message": "The French microsatellite Cerise is struck by a debris fragment from a previous Ariane rocket explosion. This event, which sheared off a portion of Cerise's stabilization boom, was a watershed moment. It provided irrefutable proof that the debris environment was not just a theoretical risk but an actual operational hazard, forcing the industry to take the issue more seriously."
  },
  {
    "year": "2007",
    "title": "Anti-Satellite Test Creates Catastrophic Debris Field",
    "message": "China intentionally destroys its defunct Fengyun-1C weather satellite in an anti-satellite (ASAT) weapon test. The event created over 3,500 trackable fragments and an estimated 150,000 debris particles larger than 1 cm—instantly doubling the amount of trackable debris in Low Earth Orbit and drawing intense international condemnation for its recklessness."
  },
  {
    "year": "2009",
    "title": "First Major Satellite-to-Satellite Collision",
    "message": "The operational U.S. Iridium 33 communications satellite and the defunct Russian Kosmos-2251 satellite collide over Siberia. This unprecedented accident generated one of the largest debris clouds in history, with over 1,800 trackable pieces, highlighting the critical need for better space traffic management and collision avoidance systems."
  },
  {
    "year": "2013",
    "title": "Launch of SpaceX's Starlink Program Begins",
    "message": "The first batch of operational Starlink satellites is launched, heralding a new era of massive commercial constellations. While promising global internet coverage, the sheer scale of these proposals (tens of thousands of satellites) triggers urgent debates about orbital congestion, collision risks, light pollution for astronomy, and the long-term sustainability of the space environment."
  },
  {
    "year": "2023",
    "title": "Regulatory Discussions Intensify Globally",
    "message": "Efforts to regulate space traffic and mitigate debris move to the forefront of international diplomacy. Key initiatives include the FCC's new 5-year deorbit rule for US-licensed satellites, the UN's Open-Ended Working Group on space sustainability, and the EU's proposal for a Space Law, as nations and companies grapple with the practical and legal challenges of a crowded orbital commons."
  }
  ];

  const handleResume = () => {
    setCurrentAnnotation(null);
    setIsPaused(false);
    if (resumeRef.current) resumeRef.current();
  };

  useEffect(() => {
    if (!animationDone) {
      document.body.classList.add("scroll-locked");
    } else {
      document.body.classList.remove("scroll-locked");
      gsap.set(window, { scrollTo: { autoKill: false } });
      document.documentElement.style.overflow = "auto";
      document.body.style.overflow = "auto";
    }
  }, [animationDone]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    let canceled = false;
    const filteredData = data.filter(
      (d) => d.type === "satellite" || d.type === "debris"
    );
    const width = window.innerWidth;
    const height = window.innerHeight * 3;
    const margin = { top: 50, right: 50, bottom: 50, left: 80 };

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
    svg.selectAll("*").remove();

    const tooltip = d3.select("#tooltip");
    const showTooltip = (content, event) => {
      tooltip
        .html(content)
        .style("opacity", 1)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`);
    };
    const hideTooltip = () => tooltip.style("opacity", 0);

    gsap.set(window, { scrollTo: { y: height - window.innerHeight - 1500 } });

    const dataByGroup = d3.group(filteredData, (d) => d[groupBy] || "unknown");
    const sortedGroups = allYears;

    const yScale = d3
      .scaleLinear()
      .domain([0, sortedGroups.length - 1])
      .range([height - margin.bottom, margin.top]);

    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat((d) =>
        sortedGroups[Math.floor(d)] === "unknown"
          ? "Unknown"
          : sortedGroups[Math.floor(d)]
      )
      .ticks(sortedGroups.length);

    svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(yAxis)
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "var(--primary)")
      .attr("class", "year-label");

    // Custom color palette matching your theme
    const countryColors = {
      "United States": "#4e79a7",
      Russia: "#e15759",
      China: "#76b7b2",
      Japan: "#59a14f",
      France: "#edc948",
      India: "#b07aa1",
      "United Kingdom": "#ff9da7",
      Germany: "#9c755f",
      Canada: "#bab0ac",
      unknown: "#8c8c8c",
    };

    const countries = Array.from(
      new Set(filteredData.map((d) => d.country || "unknown"))
    );
    const colorScale = (country) =>
      countryColors[country] || countryColors["unknown"];

    const maxCount =
      d3.max(Array.from(dataByGroup.values(), (v) => v.length)) || 1;
    const circleScale = d3
      .scaleSqrt()
      .domain([0, filteredData.length])
      .range([5, 100]);

    let cumulativeTotal = 0;
    const nodes = [];
    const cumulativeRadii = {};

    // Add center line
    svg
      .append("line")
      .attr("x1", width / 2)
      .attr("y1", margin.top - 20)
      .attr("x2", width / 2)
      .attr("y2", height - margin.bottom + 20)
      .attr("stroke", "var(--text-secondary)")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4 4");

    sortedGroups.forEach((group, i) => {
      const items = dataByGroup.get(group) || [];
      const y = yScale(i);

      cumulativeTotal += items.length;
      const currentRadius = circleScale(cumulativeTotal);
      cumulativeRadii[group] = currentRadius;

      // Create cumulative circle in the center
      svg
        .append("circle")
        .attr("class", "cumulative-circle")
        .attr("cx", width / 2)
        .attr("cy", y)
        .attr("r", currentRadius)
        .attr("fill", "transparent")
        .attr("stroke", useWhiteBars ? "var(--text)" : "var(--bg-dark)")
        .attr("stroke-width", 1)
        .on("mouseover", (event) =>
          showTooltip(`Total objects by ${group}: ${cumulativeTotal}`, event)
        )
        .on("mouseout", hideTooltip);

      const createPositions = (arr, direction = "center") => {
        return arr.map((item, idx) => {
          const baseDistance = currentRadius + 5;
          const angle = Math.random() * Math.PI * 2;

          let x, yJittered;
          const jitterY = (Math.random() - 0.5) * 30;

          if (direction === "left") {
            x = width / 2 - baseDistance - Math.random() * 90;
            yJittered = y + jitterY;
          } else if (direction === "right") {
            x = width / 2 + baseDistance + Math.random() * 90;
            yJittered = y + jitterY;
          } else {
            x = width / 2 + (Math.random() - 0.5) * 300;
            yJittered = y + jitterY;
          }

          return {
            ...item,
            year: group,
            id: item.id || `${group}-${item.name || "unknown"}-${idx}`,
            x: Math.max(margin.left, Math.min(width - margin.right, x)),
            y: yJittered,
            r: 2,
            color: colorScale(item.country || "unknown"),
            opacity: 0.8,
          };
        });
      };

      nodes.push(
        ...createPositions(
          items.filter((d) => d.type === "satellite"),
          "left"
        )
      );
      nodes.push(
        ...createPositions(
          items.filter((d) => d.type === "debris"),
          "right"
        )
      );
    });

    const scrollTween = gsap.to(window, {
      scrollTo: { y: 0 },
      duration: 0.5,
      ease: "power2.out",
      paused: true,
    });
    scrollTweenRef.current = scrollTween;

    const animateNodes = async () => {
      const svgEl = d3.select(svgRef.current);

      svgEl
        .selectAll(".year-label")
        .style("fill", "var(--secondary)")
        .style("font-weight", "normal");

      if (skipAnimation || canceled) {
        nodes.forEach((node) => {
          svgEl
            .append("circle")
            .attr("class", "data-circle")
            .datum(node) // Properly bind data
            .attr("cx", node.x)
            .attr("cy", node.y)
            .attr("r", node.r)
            .attr("fill", "none")
            .attr("stroke", useColor ? node.color : "var(--primary)")
            .attr("stroke-width", 1)
            .attr("opacity", node.opacity)
            .on("mouseover", (event) =>
              showTooltip(
                `Name: ${node.name || "Unknown"}<br>Type: ${
                  node.type
                }<br>Country: ${node.country || "Unknown"}<br>Year: ${
                  node.year
                }`,
                event
              )
            )
            .on("mouseout", hideTooltip);
        });
        setAnimationDone(true);
        setIsPaused(false);
        document.body.classList.remove("scroll-locked");
        gsap.set(window, { scrollTo: { autoKill: false } });
        document.documentElement.style.overflow = "auto";
        document.body.style.overflow = "auto";
        return;
      }

      const annotationMap = new Map(annotations.map((ann) => [ann.year, ann]));

      if (annotationMap.has("Start")) {
        setCurrentAnnotation(annotationMap.get("Start"));
        setIsPaused(true);
        await new Promise((resolve) => {
          resumeRef.current = () => resolve();
        });
      }

      for (const year of sortedGroups) {
        if (canceled || skipAnimation) return;

        if (annotationMap.has(String(year))) {
          setCurrentAnnotation(annotationMap.get(String(year)));
          setIsPaused(true);
          await new Promise((resolve) => {
            resumeRef.current = () => resolve();
          });
        }

        const items = dataByGroup.get(year) || [];
        const yearIndex = sortedGroups.indexOf(year);
        const y = yScale(yearIndex);

        svgEl
          .selectAll(".year-label")
          .style("fill", "var(--secondary)")
          .style("font-weight", "normal");
        svgEl
          .selectAll(".year-label")
          .filter((_, i) => i === yearIndex)
          .style("fill", "var(--primary)")
          .style("font-weight", "bold");

        await new Promise((resolve) => {
          scrollTween.vars.scrollTo = { y: y - window.innerHeight / 2 };
          scrollTween.invalidate();
          scrollTween.restart();
          setTimeout(resolve, 100);
        });

        items.forEach((item) => {
          const node = nodes.find(
            (n) => n.id === (item.id || `${year}-${item.name || "unknown"}`)
          );
          if (!node) return;

          svgEl
            .append("circle")
            .attr("class", "data-circle")
            .datum(node) // Properly bind data
            .attr("cx", width / 2)
            .attr("cy", height)
            .attr("r", node.r)
            .attr("fill", "none")
            .attr("stroke", useColor ? node.color : "var(--primary)")
            .attr("stroke-width", 1.5)
            .attr("opacity", 0)
            .on("mouseover", (event) =>
              showTooltip(
                `Name: ${node.name || "Unknown"}<br>Type: ${
                  node.type
                }<br>Country: ${node.country || "Unknown"}<br>Year: ${
                  node.year
                }`,
                event
              )
            )
            .on("mouseout", hideTooltip)
            .transition()
            .delay(50)
            .duration(800)
            .attr("cx", node.x)
            .attr("cy", node.y)
            .attr("opacity", node.opacity)
            .ease(d3.easeCubicOut);
        });
      }

      setAnimationDone(true);
      document.body.classList.remove("scroll-locked");
      gsap.set(window, { scrollTo: { autoKill: false } });
      document.documentElement.style.overflow = "auto";
      document.body.style.overflow = "auto";
    };

    animateNodes();

    return () => {
      canceled = true;
      ScrollTrigger.getAll().forEach((st) => st.kill());
      if (scrollTweenRef.current) {
        scrollTweenRef.current.kill();
      }
      gsap.set(window, { scrollTo: { autoKill: false } });
      document.documentElement.style.overflow = "auto";
      document.body.style.overflow = "auto";
    };
  }, [data, skipAnimation]);

  useEffect(() => {
    if (!animationDone) return;

    const svg = d3.select(svgRef.current);
    svg
      .selectAll(".data-circle")
      .transition()
      .duration(300)
      .attr("stroke", function () {
        // Get the bound data or use default color
        const d = d3.select(this).datum();
        return d && d.color && useColor ? d.color : "var(--primary)";
      });
  }, [useColor, animationDone]);

  useEffect(() => {
    if (!animationDone) return;
    d3.select(svgRef.current)
      .selectAll(".cumulative-circle")
      .transition()
      .duration(10)
      .attr("fill", "transparent")
      .attr("stroke", useWhiteBars ? "var(--primary)" : "var(--bg-dark)");
  }, [useWhiteBars, animationDone]);

  return (
    <div className="narrative">
      {!animationDone && (
        <>
          <div className="satellite-label">Satellites</div>
          <div className="debris-label">Debris</div>
        </>
      )}

      <div className="timeline-controls">
        {!animationDone && (
          <>
            <button
              className="nav-button"
              onClick={() => setSkipAnimation(true)}
            >
              Skip
            </button>{" "}
          </>
        )}
        <button
          className="nav-button"
          onClick={() => setUseColor(!useColor)}
          disabled={!animationDone}
        >
          {useColor ? "Single Color" : "Color by Country"}
        </button>
        <button
          className="nav-button"
          onClick={() => setUseWhiteBars(!useWhiteBars)}
        >
          {useWhiteBars ? "Hide cumulative values" : "Show cumulative values"}
        </button>
        <Link to="/groups" className="buttons">
          Space Hunt »
        </Link>
      </div>

      {currentAnnotation && (
        <div className="annotation-box" data-year={currentAnnotation.year}>
          {currentAnnotation.interactive ? (
            <div className="interactive-demo">
              <InteractiveCircles width={350} height={200} />
              <p className="demo-instructions">
                These circles represent objects in orbit.
              </p>
            </div>
          ) : currentAnnotation.image ? (
            <div className="annotation-image">
              <img
                src={currentAnnotation.image}
                alt="Timeline visualization explanation"
              />
            </div>
          ) : null}
          <div className="annotation-content">
            <div className="annotation-header">
              <span className="annotation-year">{currentAnnotation.year}</span>
              <h3 className="annotation-title">{currentAnnotation.title}</h3>
            </div>
            <p className="annotation-message">{currentAnnotation.message}</p>
            <button className="nav-button" onClick={handleResume}>
              Next
            </button>
          </div>
        </div>
      )}

      <div id="tooltip" className="tooltip"></div>
      <svg ref={svgRef}></svg>
      <div ref={scrollTargetRef} style={{ height: "1px" }} />
    </div>
  );
};

export default TimelineVis;
