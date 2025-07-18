import React, { useEffect, useRef, useContext, useState } from "react";
import { dataContext } from "../../context/dataContext";
import * as d3 from "d3";
import "../Timeline.css";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollToPlugin from "gsap/ScrollToPlugin";
import { AnimationContext } from "../../context/AnimationContext";
import { useOutletContext } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const TimelineVis = () => {
  const data = useContext(dataContext);
  const groupBy = "year";
  const svgRef = useRef();
  const scrollTargetRef = useRef();
  const [useColor, setUseColor] = useState(false);
  const [useWhiteBars, setUseWhiteBars] = useState(false);
  const { animationDone, setAnimationDone } = useContext(AnimationContext);
  const [annotation, setAnnotation] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(false);
  const resumeRef = useRef(null);
  const scrollTweenRef = useRef(null);
  const { setHideFooter } = useOutletContext();

  const handleResume = () => {
    setAnnotation("");
    setIsPaused(false);
    if (resumeRef.current) resumeRef.current();
  };

  const annotations = [
    { index: 1, message: "(1957) Launch of Sputnik 1: The first artificial satellite by the Soviet Union marks the start of the Space Age. Initiates the era of satellites orbiting Earth, leading to rapid growth in space traffic." },
    { index: 86, message: "(1961) First human in space (Yuri Gagarin): Space becomes a domain for human activity, intensifying interest in satellite technology and space missions." },
    { index: 1267, message: "(1965) First documented space debris incident: The US's Transit 4A satellite's upper stage exploded, creating debris. Early indication of future space debris issues." },
    { index: 11289, message: "(1978) First comprehensive space debris tracking program: The US begins systematic tracking of orbital debris after recognizing increasing collision risks." },
    { index: 12801, message: "(1981) Start of the Space Shuttle program: Expected to increase launch frequency and reduce costs, but in practice, it limited commercial satellite deployments due to payload constraints and mission focus." },
    { index: 13123, message: "(1983-1996) Relative slowdown in satellite launches: Space Shuttle payload capacity and scheduling constraints limited launch frequency; 1986 Challenger disaster grounded the Shuttle fleet for nearly three years, causing a major disruption in US launches; Economic and political pressures during the Cold War, especially on the USSR's space program, reduced Soviet launches; Post-Cold War geopolitical shifts led to reduced military satellite investment and a transitional phase in space priorities globally; Commercial satellite market was still developing and limited by costs and technology; Overall, fewer satellites were launched, slowing the growth of space traffic during this period." },
    { index: 13503, message: "(1990) Launch of Hubble Space Telescope: An important satellite that, while operational, contributes to growing numbers of large, expensive assets in orbit." },
    { index: 15386, message: "(1996) First collision between catalogued space objects predicted: Highlights growing congestion in certain orbital zones." },
    { index: 19831, message: "(2007) Chinese anti-satellite missile test: China destroys its Fengyun-1C weather satellite, creating over 3,000 pieces of trackable debris — the largest debris-creating event to date, drastically worsening space pollution." },
    { index: 20226, message: "(2009) Iridium 33 and Cosmos 2251 collision: The first accidental collision between two intact satellites creates hundreds of debris pieces, showing real collision risks." },
    { index: 20386, message: "(2010) Rapid growth of mega-constellations planned (e.g., SpaceX Starlink, OneWeb): Thousands of new satellites planned to provide global internet, dramatically increasing space traffic and debris risk." },
    { index: 21187, message: "(2013) Launch of SpaceX's Starlink program begins (2019 for first batch): Commercial space traffic surges with large constellations, sparking debate about orbital crowding." },
    { index: 21411, message: "(2014) International guidelines for debris mitigation adopted: Spacefaring nations agree on voluntary best practices to limit debris generation and improve satellite end-of-life disposal." },
    { index: 23178, message: "(2019) Increase in satellite launches due to mega-constellations: Space traffic grows exponentially, leading to concerns about collision risk and long-term sustainability." },
    { index: 24841, message: "(2021) First active debris removal missions proposed and tested: Projects like ClearSpace-1 planned to address the growing problem of large debris pieces." },
    { index: 26439, message: "(2023) Regulatory discussions intensify globally: Efforts to regulate satellite launches, debris mitigation, and traffic management increase due to risks posed by congestion, especially in low Earth orbit (LEO)." },
  ];

  const annotationIndices = new Set(annotations.map((a) => a.index));

  useEffect(() => {
    if (!animationDone) {
      document.body.classList.add("scroll-locked");
      setHideFooter(true);
    } else {
      document.body.classList.remove("scroll-locked");
      setHideFooter(false);
    }
  }, [animationDone, setHideFooter]);

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

    function showTooltip(content, event) {
      tooltip
        .html(content)
        .style("opacity", 1)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`);
    }

    function hideTooltip() {
      tooltip.style("opacity", 0);
    }

    const initialScrollOffset = 1500;
    gsap.set(window, {
      scrollTo: { y: height - window.innerHeight - initialScrollOffset },
    });

    const dataByGroup = d3.group(filteredData, (d) => d[groupBy] || "unknown");
    const keys = Array.from(dataByGroup.keys());
    const numericYears = keys
      .filter((d) => !isNaN(+d))
      .map(Number)
      .sort((a, b) => a - b);
    const hasUnknown = keys.includes("unknown");
    const sortedGroups = hasUnknown
      ? [...numericYears, "unknown"]
      : numericYears;

    const yScale = d3
      .scaleLinear()
      .domain([0, sortedGroups.length - 1])
      .range([height - margin.bottom, margin.top]);

    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat((d) => {
        const label = sortedGroups[Math.floor(d)];
        return label === "unknown" ? "Unknown" : label;
      })
      .ticks(sortedGroups.length);

    svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(yAxis)
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#333");

    svg
      .select(".y-axis")
      .selectAll("text")
      .on("mouseover", function (event, d) {
        showTooltip(`Year: ${sortedGroups[d] ?? d}`, event);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mouseout", hideTooltip);

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
        .on("mousemove", (event) => {
          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
        })
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
        .on("mousemove", (event) => {
          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
        })
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
        const count = arr.length;
        const spacing = maxSpread / maxCount;

        return arr.map((item) => {
          let offsetX = 0;
          if (direction === "left") {
            offsetX =
              -1 * (Math.random() * count * spacing + cumulativeSatWidth + 50);
          } else if (direction === "right") {
            offsetX =
              Math.random() * count * spacing + cumulativeDebrisWidth + 50;
          } else {
            offsetX = (Math.random() - 0.5) * 300;
          }

          const jitterY = (Math.random() - 0.5) * 30;
          const x = width / 2 + offsetX;
          const yJittered = y + jitterY + barHeight;

          return {
            ...item,
            year: group,
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
  const batchSize = 10;
  const svgEl = d3.select(svgRef.current);

  if (skipAnimation || canceled) {
    // Skip animation logic (unchanged)
    nodes.forEach((d) => {
      svgEl
        .append("circle")
        .datum(d)
        .attr("cx", d.x)
        .attr("cy", d.y)
        .attr("r", d.r)
        .attr("fill", "none")
        .attr("stroke", useColor ? d.color : "#5F1E1E")
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
        .on("mousemove", (event) => {
          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", hideTooltip);
    });
    setAnimationDone(true);
    setIsPaused(false);
    document.body.classList.remove("scroll-locked");
    return;
  }

  let lastYear = null;
  let lastProcessedIndex = -1;
  let shouldContinue = true;

  // Process nodes in batches
  for (let i = 0; i < nodes.length && shouldContinue; i += batchSize) {
    if (canceled || skipAnimation) return;

    const batch = nodes.slice(i, i + batchSize);
    
    // Check for annotations in this range
    const annotationsInRange = annotations.filter(a => 
      a.index >= i && a.index < i + batchSize && a.index > lastProcessedIndex
    );

    // Process annotations first
    for (const annotation of annotationsInRange) {
      setAnnotation(annotation.message);
      setIsPaused(true);
      await new Promise((resolve) => {
        resumeRef.current = () => {
          resolve();
          setAnnotation("");
          setIsPaused(false);
        };
      });
      lastProcessedIndex = annotation.index;
    }

    // Animate the current batch
    batch.forEach((d) => {
      svgEl
        .append("circle")
        .datum(d)
        .attr("cx", width / 2)
        .attr("cy", height)
        .attr("r", d.r)
        .attr("fill", "none")
        .attr("stroke", "#5F1E1E")
        .attr("stroke-width", 1.5)
        .attr("opacity", d.opacity)
        .on("mouseover", (event, d) =>
          showTooltip(
            `Name: ${d.name || "Unknown"}<br>Type: ${d.type}<br>Country: ${
              d.country || "Unknown"
            }<br>Year: ${d.year}`,
            event
          )
        )
        .on("mousemove", (event) => {
          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", hideTooltip)
        .transition()
        .duration(50)
        .attr("cx", d.x)
        .attr("cy", d.y);
    });

    // Handle year-based scrolling
    const currentYear = batch[0].year;
    if (currentYear !== lastYear) {
      lastYear = currentYear;
      const yearIndex = sortedGroups.indexOf(currentYear);
      const targetY = yScale(yearIndex);
      scrollTween.vars.scrollTo = { y: targetY - window.innerHeight / 2 };
      scrollTween.invalidate();
      scrollTween.restart();
    }

    if (!isPaused) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  setAnimationDone(true);
  document.body.classList.remove("scroll-locked");
};

    animateNodes();

    return () => {
      canceled = true;
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [data, skipAnimation]);

  useEffect(() => {
    if (!animationDone) return;

    d3.select(svgRef.current)
      .selectAll("circle")
      .transition()
      .duration(100)
      .attr("stroke", (d) => (useColor ? d.color : "#5F1E1E"));
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
      {!animationDone && !skipAnimation && (
        <button
          className="buttons"
          onClick={() => setSkipAnimation(true)}
          style={{
            position: "fixed",
            bottom: "15vh",
            right: "5vh",
            zIndex: 10,
          }}
        >
          Skip
        </button>
      )}
      {animationDone && (
        <>
          <button
            className="buttons"
            onClick={() => setUseColor(!useColor)}
            style={{ marginTop: "5.5rem" }}
          >
            Toggle Color Separation
          </button>
          <button
            className="buttons"
            onClick={() => setUseWhiteBars(!useWhiteBars)}
            style={{ marginTop: "5.5rem" }}
          >
            Toggle Bar Color
          </button>
          <Link className="buttons" to="/groups">
            Explore
          </Link>
        </>
      )}
      {annotation && (
        <div className="annotation-box">
          <p>{annotation}</p>
          <button className="buttons" onClick={handleResume}>
            Continue
          </button>
        </div>
      )}
      {!animationDone && !skipAnimation && (
        <>
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "25%",
              transform: "translate(-50%, -50%)",
              fontSize: "24px",
              fontWeight: "bold",
              color: "#666",
              userSelect: "none",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            Satellites
          </div>
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "75%",
              transform: "translate(-50%, -50%)",
              fontSize: "24px",
              fontWeight: "bold",
              color: "#666",
              userSelect: "none",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            Debris
          </div>
        </>
      )}
      <div id="tooltip" className="tooltip"></div>
      <svg ref={svgRef}></svg>
      <div ref={scrollTargetRef} style={{ height: "1px" }} />
    </div>
  );
};

export default TimelineVis;