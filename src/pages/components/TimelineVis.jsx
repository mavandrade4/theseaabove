import React, { useEffect, useRef, useContext, useState } from "react";
import { dataContext } from "../../context/dataContext";
import * as d3 from "d3";
import "../Timeline.css";

const TimelineVis = () => {
  const data = useContext(dataContext);
  const groupBy = "year";
  const svgRef = useRef();
  const [useColor, setUseColor] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);
  const nodesRef = useRef([]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const width = window.innerWidth;
    const height = window.innerHeight * 3;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
    svg.selectAll("*").remove();

    const dataByGroup = d3.group(data, (d) => d[groupBy] || "unknown");
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

    const countries = Array.from(
      new Set(data.map((d) => d.country || "unknown"))
    );
    const colorScale = d3
      .scaleOrdinal()
      .domain(countries)
      .range(d3.schemeCategory10);

    const maxCount =
      d3.max(Array.from(dataByGroup.values(), (v) => v.length)) || 1;

    const nodes = [];

    const scaleWidth = d3
      .scaleLinear()
      .domain([0, data.length])
      .range([0, width / 3]);
    let cumulativeSat = 0;
    let cumulativeDebris = 0;

    sortedGroups.forEach((group, i) => {
      const items = dataByGroup.get(group) || [];
      const y = yScale(i);

      const satellites = items.filter((d) => d.type === "satellite");
      const debris = items.filter((d) => d.type === "debris");
      const unknown = items.filter(
        (d) => d.type !== "satellite" && d.type !== "debris"
      );

      // Update cumulative totals
      cumulativeSat += satellites.length;
      //console.log("satelllites LENGTH: " + satellites.length);
      //console.log("satelllites: " + cumulativeSat);
      cumulativeDebris += debris.length;
      //console.log("debris LENGTH: " + debris.length);
      //console.log("debris: " + cumulativeDebris);

      // Draw cumulative bars
      const barHeight = 8;
      const cumulativeSatWidth = scaleWidth(cumulativeSat);
      const cumulativeDebrisWidth = scaleWidth(cumulativeDebris);

      svg
        .append("rect")
        .attr("x", width / 2 - cumulativeSatWidth)
        .attr("y", y - barHeight / 2)
        .attr("width", cumulativeSatWidth)
        .attr("height", barHeight)
        .attr("fill", "#f0f0f0")
        .attr("opacity", 0.6);

      svg
        .append("rect")
        .attr("x", width / 2)
        .attr("y", y - barHeight / 2)
        .attr("width", cumulativeDebrisWidth)
        .attr("height", barHeight)
        .attr("fill", "#F44336")
        .attr("opacity", 0.6);

      // Compute node positions
      const maxSpread = (width - margin.left - margin.right) / 2 - 40;

      const createPositions = (arr, direction = "center", offsetBase = 0) => {
        const count = arr.length;
        const spacing = maxSpread / maxCount;

        return arr.map((item) => {
          let offsetX = 0;
          if (direction === "left") {
            offsetX =
              -1 * (Math.random() * count * spacing + cumulativeSatWidth + 10);
          } else if (direction === "right") {
            offsetX =
              Math.random() * count * spacing + cumulativeDebrisWidth + 10;
          } else {
            offsetX = (Math.random() - 0.5) * 20;
          }

          const jitterY = (Math.random() - 0.5) * 10;
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

      nodes.push(...createPositions(satellites, "left", cumulativeSatWidth));
      nodes.push(...createPositions(debris, "right", cumulativeDebrisWidth));
      nodes.push(...createPositions(unknown, "center"));
    });

    nodesRef.current = nodes;

    let tooltip = d3.select("#tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select("body").append("div").attr("id", "tooltip");
    }

    const axis = d3
      .axisLeft(yScale)
      .tickValues(d3.range(sortedGroups.length))
      .tickFormat((d) => sortedGroups[d]);

    const axisGroup = svg
      .append("g")
      .attr("transform", `translate(${width / 2},0)`)
      .call(axis);

    axisGroup
      .selectAll(".tick text")
      .style("cursor", "pointer")
      .style("fill", "#f0f0f0")
      .on("mouseover", function (event, d) {
        const group = sortedGroups[d];
        const groupData = dataByGroup.get(group) || [];

        const typeCounts = { satellite: 0, debris: 0, unknown: 0 };
        groupData.forEach((item) => {
          const type = item.type || "unknown";
          if (typeCounts[type] !== undefined) {
            typeCounts[type]++;
          } else {
            typeCounts.unknown++;
          }
        });

        tooltip
          .style("display", "block")
          .html(
            `<strong>${group}</strong><br/>Satellites: ${typeCounts.satellite}<br/>Debris: ${typeCounts.debris}<br/>Unknown: ${typeCounts.unknown}`
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`);
      })
      .on("mouseout", () => {
        tooltip.style("display", "none");
      });

    axisGroup.selectAll(".domain").style("stroke", "#f0f0f0");
    axisGroup.selectAll(".tick line").style("stroke", "#f0f0f0");

    const circles = svg
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("cx", width / 2)
      .attr("cy", height)
      .attr("r", (d) => d.r)
      .attr("fill", "none")
      .attr("stroke", "#5F1E1E")
      .attr("stroke-width", 1.5)
      .attr("opacity", (d) => d.opacity)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke", "#020022");
        tooltip
          .style("display", "block")
          .html(
            `<strong>${d.name || "Unknown"}, ${d.year || "n.d."}</strong><br/>${
              d.country
            }`
          );
      })
      .on("mousemove", (event) => {
        const padding = 10;
        const xPos = event.pageX + padding;
        const yPos = event.pageY + padding;
        const maxX = window.innerWidth - tooltip.node().offsetWidth - padding;
        const maxY = window.innerHeight - tooltip.node().offsetHeight - padding;
        tooltip
          .style("left", Math.min(xPos, maxX) + "px")
          .style("top", Math.min(yPos, maxY) + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr(
          "stroke",
          useColor ? d3.select(this).datum().color : "#5F1E1E"
        );
        tooltip.style("display", "none");
      });

    let completed = 0;
    const total = nodes.length;

    circles
      .transition()
      .duration(100)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .on("end", () => {
        completed++;
        console.log(completed);
        if (completed === total) {
          setAnimationDone(true);
        }
      });
      //.delay((_, i) => i);
  }, [data]);

  useEffect(() => {
    if (!animationDone) return;
    d3.select(svgRef.current)
      .selectAll("circle")
      .transition()
      .duration(1000000)
      .attr("stroke", (d) => (useColor ? d.color : "#070707"));
  }, [useColor, animationDone]);

  return (
    <div style={{ overflowY: "auto", height: "100vh", position: "relative" }}>
      {animationDone && (
        <button
          onClick={() => setUseColor(!useColor)}
          style={{
            position: "fixed",
            top: 10,
            left: 10,
            zIndex: 1000,
            padding: "8px 12px",
            background: "#333",
            color: "#f0f0f0",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Toggle Color Separation
        </button>
      )}
      <div style={{ paddingTop: "60px" }}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default TimelineVis;
