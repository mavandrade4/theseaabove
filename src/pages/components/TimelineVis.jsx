import React, { useEffect, useRef, useContext } from "react";
import { dataContext } from "../../context/dataContext";
import * as d3 from "d3";
import '../Timeline.css';

const TimelineVis = () => {
  const data = useContext(dataContext);
  const groupBy = "year";
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const width = window.innerWidth;
    const height = window.innerHeight * 2;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    const dataByGroup = d3.group(data, (d) => d[groupBy] || "unknown");
    const sortedGroups = Array.from(dataByGroup.keys()).sort();

    const yScale = d3
      .scaleLinear()
      .domain([0, sortedGroups.length - 1])
      .range([height - margin.bottom, margin.top - 500]);

    const countries = Array.from(new Set(data.map((d) => d.country || "unknown")));
    const colorScale = d3
      .scaleOrdinal()
      .domain(countries)
      .range(d3.schemeCategory10);

    const maxCount = d3.max(Array.from(dataByGroup.values(), (v) => v.length)) || 1;

    const nodes = [];

    sortedGroups.forEach((group, i) => {
      const items = dataByGroup.get(group);
      const y = yScale(i);

      const satellites = items.filter((d) => d.type === "satellite");
      const debris = items.filter((d) => d.type === "debris");
      const unknown = items.filter(
        (d) => d.type !== "satellite" && d.type !== "debris"
      );

      const maxSpread = (width - margin.left - margin.right) / 2;

      const createPositions = (arr, direction = "center", yearOffset = 0) => {
        const count = arr.length;
        const spacing = maxSpread / maxCount;

        return arr.map((item, i) => {
          let offsetX = 0;

          if (direction === "left") {
            offsetX = -1 * (Math.random() * count * spacing);
          } else if (direction === "right") {
            offsetX = Math.random() * count * spacing;
          } else {
            offsetX = (Math.random() - 0.5) * 20;
          }

          const jitterY = (Math.random() - 0.5) * 10;
          const x = width / 2 + offsetX;
          const yJittered = y + jitterY + yearOffset;

          return {
            ...item,
            x: Math.max(margin.left, Math.min(width - margin.right, x)),
            y: yJittered,
            r: yearOffset === 0 ? 3 : 2,
            color: colorScale(item.country || "unknown"),
            opacity: yearOffset === 0 ? 0.8 : 0.2,
          };
        });
      };

      nodes.push(...createPositions(satellites, "left"));
      nodes.push(...createPositions(debris, "right"));
      nodes.push(...createPositions(unknown, "center"));
    });

    let tooltip = d3.select("#tooltip");
    if (tooltip.empty()) {
      tooltip = d3
        .select("body")
        .append("div")
        .attr("id", "tooltip");
    }

    // Axis with corrected data binding
    const axis = d3.axisLeft(yScale)
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

        const typeCounts = {
          satellite: 0,
          debris: 0,
          unknown: 0,
        };

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
            `<strong>${group}</strong><br/>
            Satellites: ${typeCounts.satellite}<br/>
            Debris: ${typeCounts.debris}<br/>
            Unknown: ${typeCounts.unknown}`
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY + 10 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("display", "none");
      });

    axisGroup
      .selectAll(".domain")
      .style("stroke", "#f0f0f0");

    axisGroup
      .selectAll(".tick line")
      .style("stroke", "#f0f0f0");

    // Draw circles
    svg
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
      .attr("opacity", 0.8)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke", "#020022");
        tooltip
          .style("display", "block")
          .html(
            `<strong>${d.name || "Unknown"}, ${d.year || "n.d."}</strong><br/>${d.country}`
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
        d3.select(this).attr("stroke", "#5F1E1E");
        tooltip.style("display", "none");
      })
      .transition()
      .duration(1500)
      .delay((_, i) => i * 2)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("fill", "none")
      .attr("stroke", "#5F1E1E")
      .attr("stroke-width", 1.5);

  }, [data]);

  return (
    <div style={{ overflow: 'auto', height: '100vh' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default TimelineVis;
