import React, { useEffect, useRef, useContext, useState } from "react";
import { dataContext } from "../../context/dataContext";
import * as d3 from "d3";
import "../Timeline.css";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollToPlugin from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const TimelineVis = () => {
  const data = useContext(dataContext);
  const groupBy = "year";
  const svgRef = useRef();
  const containerRef = useRef();
  const [useColor, setUseColor] = useState(false);
  const [useWhiteBars, setUseWhiteBars] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);
  const [annotation, setAnnotation] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(false);
  const resumeRef = useRef(null);
  const scrollTweenRef = useRef(null); // NEW: Track scroll tween

  const handleResume = () => {
    setAnnotation("");
    setIsPaused(false);
    if (resumeRef.current) resumeRef.current();
  };

  const annotations = [
    {
      index: 200,
      message:
        "Annotation 1 Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    },
    {
      index: 800,
      message:
        "Annotation 2 Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    },
    {
      index: 1500,
      message:
        "Annotation 3 Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    },
  ];

  useEffect(() => {
    if (!animationDone) {
      document.body.classList.add("scroll-locked");
    } else {
      document.body.classList.remove("scroll-locked");
    }
  }, [animationDone]);

  useEffect(() => {
    if (!data || data.length === 0) return;

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

    const initialScrollOffset = 2000;
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
      .tickFormat((d) => (d === "unknown" ? "Unknown" : sortedGroups[d] ?? d))
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

      const barHeight = 8;
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
        .on("mouseover", function (event) {
          showTooltip(`Cumulative ${group} count: ${items.length}`, event);
        })
        .on("mousemove", function (event) {
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
        .on("mouseover", function (event) {
          showTooltip(`Cumulative ${group} count: ${items.length}`, event);
        })
        .on("mousemove", function (event) {
          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", hideTooltip);

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

          const jitterY = (Math.random() - 0.5) * 100;
          const x = width / 2 + offsetX;
          const yJittered = y + jitterY + barHeight;

          return {
            ...item,
            x: Math.max(margin.left, Math.min(width - margin.right, x)),
            y: yJittered,
            r: 3,
            color: colorScale(item.country || "unknown"),
            opacity: 0.8,
          };
        });
      };

      nodes.push(...createPositions(satellites, "left"));
      nodes.push(...createPositions(debris, "right"));
    });

    const totalSteps = nodes.length;
    const scrollRange = height - window.innerHeight - initialScrollOffset;
    const scrollStep = scrollRange / totalSteps;

    const animateNodes = async () => {
      const batchSize = 10;

      if (skipAnimation) {
        nodes.forEach((d) => {
          d3.select(svgRef.current)
            .append("circle")
            .datum(d)
            .attr("cx", d.x)
            .attr("cy", d.y)
            .attr("r", d.r)
            .attr("fill", "none")
            .attr("stroke", useColor ? d.color : "#5F1E1E")
            .attr("stroke-width", 1.5)
            .attr("opacity", d.opacity);
        });

        d3.select(svgRef.current)
          .selectAll("circle")
          .on("mouseover", function (event, d) {
            showTooltip(
              `Type: ${d.type}<br/>Country: ${d.country || "Unknown"}`,
              event
            );
          })
          .on("mousemove", function (event) {
            tooltip
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 20}px`);
          })
          .on("mouseout", hideTooltip);

        setAnimationDone(true);
        document.body.classList.remove("scroll-locked");
        return;
      }

      let scrollTween = gsap.to(window, {
        scrollTo: { y: 0 },
        duration: 0.5,
        ease: "power2.out",
        paused: true,
      });
      scrollTweenRef.current = scrollTween;

      for (let i = 0; i < totalSteps; i += batchSize) {
        if (skipAnimation) break;

        const batch = nodes.slice(i, i + batchSize);
        batch.forEach((d) => {
          d3.select(svgRef.current)
            .append("circle")
            .datum(d)
            .attr("cx", width / 2)
            .attr("cy", height)
            .attr("r", d.r)
            .attr("fill", "none")
            .attr("stroke", "#5F1E1E")
            .attr("stroke-width", 1.5)
            .attr("opacity", d.opacity)
            .transition()
            .duration(50)
            .attr("cx", d.x)
            .attr("cy", d.y);
        });

        d3.select(svgRef.current)
          .selectAll("circle")
          .on("mouseover", function (event, d) {
            showTooltip(
              `Type: ${d.type}<br/>Country: ${d.country || "Unknown"}`,
              event
            );
          })
          .on("mousemove", function (event) {
            tooltip
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 20}px`);
          })
          .on("mouseout", hideTooltip);

        const batchCenterY =
          d3.mean(batch, (d) => d.y) || window.innerHeight / 2;

        const scrollTargetY = Math.max(
          0,
          batchCenterY - window.innerHeight / 2
        );

        scrollTween.vars.scrollTo.y = scrollTargetY;
        scrollTween.invalidate();
        scrollTween.restart();

        const annotationObj = annotations.find((a) => a.index === i);
        if (annotationObj) {
          setAnnotation(annotationObj.message);
          setIsPaused(true);
          if (skipAnimation) break;
          await new Promise((resolve) => {
            resumeRef.current = resolve;
          });
          setAnnotation("");
          setIsPaused(false);
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
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [data, skipAnimation]);

  useEffect(() => {
    if (skipAnimation && scrollTweenRef.current) {
      scrollTweenRef.current.kill();
      scrollTweenRef.current = null;
      setAnimationDone(true);
      document.body.classList.remove("scroll-locked");
    }
  }, [skipAnimation]);

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
      .duration(200)
      .attr("fill", useWhiteBars ? "#FFFFFF" : "#070707");
  }, [useWhiteBars, animationDone]);

  return (
    <div
      ref={containerRef}
      className="narrative"
      style={{ position: "relative" }}
    >
      {!animationDone && !skipAnimation && (
        <button
          className="buttons"
          onClick={() => setSkipAnimation(true)}
          style={{ position: "fixed", top: "15vh", right: "5vh" }}
        >
          Skip Animation
        </button>
      )}
      {animationDone && (
        <>
          <button
            className="buttons"
            onClick={() => setUseColor(!useColor)}
            style={{ marginTop: "50px" }}
          >
            Toggle Color Separation
          </button>
          <button
            className="buttons"
            onClick={() => setUseWhiteBars(!useWhiteBars)}
            style={{ marginTop: "50px" }}
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
      <div id="tooltip" className="tooltip"></div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default TimelineVis;
