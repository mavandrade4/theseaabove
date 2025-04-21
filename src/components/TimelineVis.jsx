import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const TimelineVis = ({ data }) => {
  const groupBy = "year";
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
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
      .range([height - margin.bottom, margin.top]);

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

      const createPositions = (arr, direction = "center") => {
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
          const yJittered = y + jitterY;

          return {
            ...item,
            x: Math.max(margin.left, Math.min(width - margin.right, x)),
            y: yJittered,
            r: 3,
            color: colorScale(item.country || "unknown"),
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
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("padding", "4px 8px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("font-size", "12px")
        .style("z-index", "1000")
        .style("display", "none");
    }

    svg
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", (d) => d.r)
      .attr("fill", "blue")
      .attr("stroke", "none")
      .attr("opacity", 0.8)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke", "blue");
        tooltip
          .style("display", "block")
          .html(
            `<strong>${d.name || "Unknown"}, ${d.year || "n.d."}</strong><br/>${d.country}`
          );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke", "red");
        tooltip.style("display", "none");
      })
      .transition()
      .duration(1500)
      .delay((_, i) => i * 2)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 1.5);

    const axis = d3.axisLeft(yScale).ticks(sortedGroups.length).tickFormat((d, i) => sortedGroups[i]);
    const axisGroup = svg
      .append("g")
      .attr("transform", `translate(${width / 2},0)`)
      .call(axis);

    axisGroup
      .selectAll(".tick text")
      .style("cursor", "pointer")
      .on("mouseover", (event, groupText) => {
        const group = groupText;
        const groupData = dataByGroup.get(group) || [];

        const typeCounts = {
          satellite: 0,
          debris: 0,
          unknown: 0,
        };

        groupData.forEach((d) => {
          const type = d.type || "unknown";
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
          );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY + "px");
      })
      .on("mouseout", () => {
        tooltip.style("display", "none");
      });
  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default TimelineVis;