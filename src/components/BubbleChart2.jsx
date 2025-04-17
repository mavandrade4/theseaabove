import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const BubbleChart2 = ({ data }) => {
  const svgRef = useRef();
  const [groupBy, setGroupBy] = useState("type");

  useEffect(() => {
    if (!data || data.length === 0) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const nodes = data.map((d, i) => ({
      ...d,
      id: i,
      r: 5 + Math.random() * 4, // radius with small variation
    }));

    const groups = Array.from(new Set(nodes.map(d => d[groupBy] || "unknown")));
    const groupCenters = {};
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    groups.forEach((group, i) => {
      const angle = (i / groups.length) * 2 * Math.PI;
      groupCenters[group] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    nodes.forEach((node) => {
      const group = node[groupBy] || "unknown";
      const center = groupCenters[group];
      node.groupX = center?.x || centerX;
      node.groupY = center?.y || centerY;
    });

    const color = d3.scaleOrdinal()
      .domain(groups)
      .range(d3.schemeCategory10);

    const tooltip = d3.select("#tooltip");
    if (tooltip.empty()) {
      d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .attr("class", "tooltip")
        .style("display", "none");
    }

    const nodeSelection = svg
      .selectAll("circle")
      .data(nodes, d => d.id)
      .join("circle")
      .attr("r", d => d.r)
      .attr("fill", d => color(d[groupBy] || "unknown"))
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke-width", 2);
        d3.select("#tooltip")
          .style("display", "block")
          .html(`<strong>${d.name || "Unnamed"}</strong><br/>${groupBy}: ${d[groupBy]}`);
      })
      .on("mousemove", (event) => {
        d3.select("#tooltip")
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke-width", 0.5);
        d3.select("#tooltip").style("display", "none");
      });

    const simulation = d3.forceSimulation(nodes)
      .force("x", d3.forceX(d => d.groupX).strength(0.1))
      .force("y", d3.forceY(d => d.groupY).strength(0.1))
      .force("collide", d3.forceCollide(d => d.r + 1.5))
      .alphaDecay(0.03)
      .on("tick", () => {
        nodeSelection
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);
      });

    return () => simulation.stop();
  }, [data, groupBy]);

  return (
    <div>
      <div className="explore-buttons">
        {["type", "subtype", "country"].map((key) => (
          <button
            key={key}
            className={`explore-button ${groupBy === key ? "selected" : ""}`}
            onClick={() => setGroupBy(key)}
          >
            Group by {key}
          </button>
        ))}
      </div>
      <svg ref={svgRef} />
    </div>
  );
};

export default BubbleChart2;
