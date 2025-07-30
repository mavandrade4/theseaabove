import React, { useEffect, useRef, useContext, useState } from "react";
import { dataContext } from "../../context/dataContext";
import * as d3 from "d3";
import "./Timeline.css";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollToPlugin from "gsap/ScrollToPlugin";
import { AnimationContext } from "../../context/AnimationContext";
import { useOutletContext } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

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

  // Generate all years from 1957 to 2023
  const allYears = Array.from({ length: 2023 - 1956 + 1 }, (_, i) => 1957 + i);
  allYears.push("unknown");

  const annotations = [
    {
      year: "Start",
      title: "Space Objects Timeline",
      message:
        "Each circle represents an object in Earth's orbit. Satellites appear on the left side, while space debris appears on the right. The visualization shows the accumulation of objects over time, from 1957 to present. You can also see the cumulative number of objects or color them by country of origin.",
    },
    {
      year: "1957",
      title: "Launch of Sputnik 1",
      message:
        "The first artificial satellite by the Soviet Union marks the start of the Space Age.",
    },
    {
      year: "1961",
      title: "First human in space (Yuri Gagarin)",
      message: "Space becomes a domain for human activity.",
    },
    {
      year: "1965",
      title: "First documented space debris incident",
      message:
        "The US's Transit 4A satellite's upper stage exploded, creating debris.",
    },
    {
      year: "1978",
      title: "First comprehensive space debris tracking program",
      message: "The US begins systematic tracking of orbital debris.",
    },
    {
      year: "1981",
      title: "Start of the Space Shuttle program",
      message: "Expected to increase launch frequency and reduce costs.",
    },
    {
      year: "1983",
      title: "Relative slowdown in satellite launches",
      message: "Various factors led to reduced launch frequency.",
    },
    /*{
      year: "1990",
      title: "Launch of Hubble Space Telescope",
      message: "An important satellite contributing to growing orbital assets.",
    },
    {
      year: "1996",
      title: "First collision between catalogued space objects predicted",
      message: "Highlights growing congestion.",
    },
    {
      year: "2007",
      title: "Chinese anti-satellite missile test",
      message: "Created over 3,000 pieces of trackable debris.",
    },*/
    {
      year: "2009",
      title: "Iridium 33 and Cosmos 2251 collision",
      message: "First accidental collision between two intact satellites.",
    },
    /*{
      year: "2010",
      title: "Rapid growth of mega-constellations planned",
      message: "Thousands of new satellites planned.",
    },*/
    {
      year: "2013",
      title: "Launch of SpaceX's Starlink program begins",
      message: "Commercial space traffic surges.",
    },
    {
      year: "2014",
      title: "International guidelines for debris mitigation adopted",
      message: "Voluntary best practices established.",
    },
    /*{
      year: "2019",
      title: "Increase in satellite launches due to mega-constellations",
      message: "Space traffic grows exponentially.",
    },
    {
      year: "2021",
      title: "First active debris removal missions proposed",
      message: "Addressing the growing debris problem.",
    },*/
    {
      year: "2023",
      title: "Regulatory discussions intensify globally",
      message: "Efforts to regulate space traffic increase.",
    },
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
      // Ensure scroll is fully released
      gsap.set(window, { scrollTo: { autoKill: false } });
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
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
      .style("fill", "#5F1E1E")
      .attr("class", "year-label");

    const countries = Array.from(
      new Set(filteredData.map((d) => d.country || "unknown"))
    );
    const colorScale = d3
      .scaleOrdinal()
      .domain(countries)
      .range(d3.schemeCategory10);

    const maxCount =
      d3.max(Array.from(dataByGroup.values(), (v) => v.length)) || 1;
    const scaleWidth = d3
      .scaleLinear()
      .domain([0, filteredData.length])
      .range([0, width / 3]);

    let cumulativeSat = 0;
    let cumulativeDebris = 0;
    const nodes = [];

    sortedGroups.forEach((group, i) => {
      const items = dataByGroup.get(group) || [];
      const y = yScale(i);

      const satellites = items.filter((d) => d.type === "satellite");
      const debris = items.filter((d) => d.type === "debris");

      cumulativeSat += satellites.length;
      cumulativeDebris += debris.length;

      const barHeight = 5;
      const cumulativeSatWidth = scaleWidth(cumulativeSat);
      const cumulativeDebrisWidth = scaleWidth(cumulativeDebris);

      svg
        .append("rect")
        .attr("x", width / 2 - cumulativeSatWidth)
        .attr("y", y - barHeight / 2)
        .attr("width", cumulativeSatWidth)
        .attr("height", barHeight)
        .attr("fill", useWhiteBars ? "#FFFFFF" : "#070707")
        .attr("opacity", 0.6)
        .on("mouseover", (event) =>
          showTooltip(
            `Cumulative satellites by ${group}: ${cumulativeSat}`,
            event
          )
        )
        .on("mouseout", hideTooltip);

      svg
        .append("rect")
        .attr("x", width / 2)
        .attr("y", y - barHeight / 2)
        .attr("width", cumulativeDebrisWidth)
        .attr("height", barHeight)
        .attr("fill", useWhiteBars ? "#FFFFFF" : "#070707")
        .attr("opacity", 0.6)
        .on("mouseover", (event) =>
          showTooltip(
            `Cumulative debris by ${group}: ${cumulativeDebris}`,
            event
          )
        )
        .on("mouseout", hideTooltip);

      if (i === 0) {
        svg
          .append("line")
          .attr("x1", width / 2)
          .attr("y1", margin.top - 20)
          .attr("x2", width / 2)
          .attr("y2", height - margin.bottom + 20)
          .attr("stroke", "#999")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4 4");
      }

      const maxSpread = (width - margin.left - margin.right) / 2 - 40;

      const createPositions = (arr, direction = "center") => {
        const spacing = maxSpread / maxCount;
        return arr.map((item, idx) => {
          let offsetX = 0;
          if (direction === "left") {
            offsetX =
              -1 *
              (Math.random() * arr.length * spacing + cumulativeSatWidth + 50);
          } else if (direction === "right") {
            offsetX =
              Math.random() * arr.length * spacing + cumulativeDebrisWidth + 50;
          } else {
            offsetX = (Math.random() - 0.5) * 300;
          }

          const jitterY = (Math.random() - 0.5) * 30;
          const x = width / 2 + offsetX;
          const yJittered = y + jitterY + barHeight;

          return {
            ...item,
            year: group,
            id: item.id || `${group}-${item.name || "unknown"}-${idx}`, // ensure unique ID
            x: Math.max(margin.left, Math.min(width - margin.right, x)),
            y: yJittered,
            r: 2,
            color: colorScale(item.country || "unknown"),
            opacity: 0.8,
          };
        });
      };

      nodes.push(...createPositions(satellites, "left"));
      nodes.push(...createPositions(debris, "right"));
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
        .style("fill", "#333")
        .style("font-weight", "normal");

      if (skipAnimation || canceled) {
        nodes.forEach((d) => {
          svgEl
            .append("circle")
            .datum(d)
            .attr("cx", d.x)
            .attr("cy", d.y)
            .attr("r", d.r)
            .attr("fill", "none")
            .attr("stroke", function (d) {
              if (!d) return "#5F1E1E";
              return useColor ? d?.color ?? "#5F1E1E" : "#5F1E1E";
            })
            .attr("stroke-width", 1)
            .attr("opacity", d.opacity)
            .on("mouseover", (event, d) =>
              showTooltip(
                `Name: ${d.name || "Unknown"}<br>Type: ${d.type}<br>Country: ${
                  d.country || "Unknown"
                }<br>Year: ${d.year}`,
                event
              )
            )
            .on("mouseout", hideTooltip);
        });
        setAnimationDone(true);
        setIsPaused(false);
        document.body.classList.remove("scroll-locked");
        // Reset scroll behavior when skipping
        gsap.set(window, { scrollTo: { autoKill: false } });
        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'auto';
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
          .style("fill", "#333")
          .style("font-weight", "normal");
        svgEl
          .selectAll(".year-label")
          .filter((_, i) => i === yearIndex)
          .style("fill", "#5F1E1E")
          .style("font-weight", "bold");

        await new Promise((resolve) => {
          scrollTween.vars.scrollTo = { y: y - window.innerHeight / 2 };
          scrollTween.invalidate();
          scrollTween.restart();
          setTimeout(resolve, 100);
        });

        items.forEach((d) => {
          const node = nodes.find(
            (n) => n.id === (d.id || `${year}-${d.name || "unknown"}`)
          );
          if (!node) return;

          svgEl
            .append("circle")
            .attr("class", `circle-${year}`)
            .attr("cx", width / 2)
            .attr("cy", height)
            .attr("r", node.r)
            .attr("fill", "none")
            .attr("stroke", "#5F1E1E")
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
      // Reset scroll behavior when animation completes
      gsap.set(window, { scrollTo: { autoKill: false } });
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    };

    animateNodes();

    return () => {
      canceled = true;
      ScrollTrigger.getAll().forEach((st) => st.kill());
      if (scrollTweenRef.current) {
        scrollTweenRef.current.kill();
      }
      gsap.set(window, { scrollTo: { autoKill: false } });
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    };
  }, [data, skipAnimation]);

  useEffect(() => {
    if (!animationDone) return;
    d3.select(svgRef.current)
      .selectAll("circle")
      .transition()
      .duration(100)
      .attr("stroke", function (d) {
              if (!d) return "#5F1E1E";
              return useColor ? d?.color ?? "#5F1E1E" : "#5F1E1E";
            });
  }, [useColor, animationDone]);

  useEffect(() => {
    if (!animationDone) return;
    d3.select(svgRef.current)
      .selectAll("rect")
      .transition()
      .duration(10)
      .attr("fill", useWhiteBars ? "#FFFFFF" : "#070707");
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
              className="control-button"
              onClick={() => setSkipAnimation(true)}
            >
              Skip
            </button>{" "}
          </>
        )}
        <button
          className="control-button"
          onClick={() => setUseColor(!useColor)}
        >
          Color by Country
        </button>
        <button
          className="control-button"
          onClick={() => setUseWhiteBars(!useWhiteBars)}
        >
          Show Cumulative Values
        </button>
        <Link to="/groups" className="control-button">
          Explore
        </Link>
      </div>

      {currentAnnotation && (
        <div className="annotation-box">
          <div className="annotation-header">
            <span className="annotation-year">{currentAnnotation.year}</span>
            <h3 className="annotation-title">{currentAnnotation.title}</h3>
          </div>
          <p className="annotation-message">{currentAnnotation.message}</p>
          <button className="nav-button" onClick={handleResume}>
            Next
          </button>
        </div>
      )}

      <div id="tooltip" className="tooltip"></div>
      <svg ref={svgRef}></svg>
      <div ref={scrollTargetRef} style={{ height: "1px" }} />
    </div>
  );
};

export default TimelineVis;