import React, { useEffect, useRef, useContext, useState } from "react";
import { dataContext } from "../../context/dataContext";
import * as d3 from "d3";
import '../Timeline.css';
import { Link } from 'react-router-dom';


const TimelineVis = () => {
  const data = useContext(dataContext);
  const groupBy = "year";
  const svgRef = useRef();
  const [useColor, setUseColor] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);
  const nodesRef = useRef([]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const filteredData = data.filter(
      (d) => d.type === "satellite" || d.type === "debris"
    );

    const width = window.innerWidth;
    const height = window.innerHeight * 3;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
    svg.selectAll("*").remove();

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

    const countries = Array.from(
      new Set(filteredData.map((d) => d.country || "unknown"))
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
      .domain([0, filteredData.length])
      .range([0, width / 3]);
    let cumulativeSat = 0;
    let cumulativeDebris = 0;

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
        .attr("fill", "#020022")
        .attr("opacity", 0.6);

      svg
        .append("rect")
        .attr("x", width / 2)
        .attr("y", y - barHeight / 2)
        .attr("width", cumulativeDebrisWidth)
        .attr("height", barHeight)
        .attr("fill", "#020022")
        .attr("opacity", 0.6);

      svg
        .append("rect")
        .attr("x", width / 2 - cumulativeSatWidth)
        .attr("y", y - barHeight / 2)
        .attr("width", cumulativeSatWidth + cumulativeDebrisWidth)
        .attr("height", barHeight)
        .attr("fill", "transparent")
        .on("mouseover", (event) => {
          tooltip
            .style("display", "block")
            .html(
              `<strong>Up to ${group}</strong><br/>
               Total Satellites: ${cumulativeSat}<br/>
               Total Debris: ${cumulativeDebris}`
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

      const maxSpread = (width - margin.left - margin.right) / 2 - 40;

      const createPositions = (arr, direction = "center", offsetBase = 0) => {
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

      nodes.push(...createPositions(satellites, "left", cumulativeSatWidth));
      nodes.push(...createPositions(debris, "right", cumulativeDebrisWidth));
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

        const typeCounts = { satellite: 0, debris: 0 };
        groupData.forEach((item) => {
          const type = item.type;
          if (type === "satellite" || type === "debris") {
            typeCounts[type]++;
          }
        });

        tooltip
          .style("display", "block")
          .html(
            `<strong>${group}</strong><br/>Satellites: ${typeCounts.satellite}<br/>Debris: ${typeCounts.debris}`
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
      //.delay((d, i) => i * 5)
      .duration(1000)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .on("end", function () {
        completed++;
        if (completed === total) {
          setAnimationDone(true);
        }
      });
  }, [data]);

  useEffect(() => {
    if (!animationDone) return;
    d3.select(svgRef.current)
      .selectAll("circle")
      .transition()
      .duration(100)
      .attr("stroke", (d) => (useColor ? d.color : "#070707"));
  }, [useColor, animationDone]);

  return (
    <div>
      {animationDone && (
        <button
          className="buttons"
          onClick={() => setUseColor(!useColor)}
        >
          Toggle Color Separation
        </button>
      )}
      <div>
        <div>
          <h2>Satellite and Debris Timeline</h2>
          <p className="timeline-caption">
            This visualization shows the cumulative number of satellites (left)
            and debris (right) launched or created over time. Each dot
            represents individual objects that can be color-coded by country.
          </p>
        </div>
        <svg ref={svgRef}></svg>
      </div>
      <Link className="buttons" to="/groups">project GROUPS</Link>
    </div>
  );
};

export default TimelineVis;
