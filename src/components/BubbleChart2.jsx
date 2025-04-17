import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const BubbleChart2 = ({ data, groupBy }) => {
  const svgRef = useRef();
  const [isDataLoaded, setIsDataLoaded] = useState(false); // Track data loading

  useEffect(() => {
    // Don't run the code if the data is not available
    if (!data || data.length === 0) return;

    // Function to start simulation once the browser is idle
    const startSimulation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const margin = { top: 50, right: 50, bottom: 50, left: 50 };

      const svg = d3
        .select(svgRef.current)
        .attr("width", width)
        .attr("height", height);

      svg.selectAll("*").remove();

      // Grouping data by the selected "groupBy"
      const dataByGroup = d3.group(data, (d) => d[groupBy] || "unknown");

      const groups = Array.from(dataByGroup.keys());

      const colorScale = d3
        .scaleOrdinal()
        .domain(groups)
        .range(d3.schemeCategory10);

      const nodes = [];

      // Create nodes for each group
      groups.forEach((group, i) => {
        const items = dataByGroup.get(group);
        const y = height / (groups.length + 1) * (i + 1); // Distribute vertically

        items.forEach((item, j) => {
          const x = width / 2 + Math.random() * 200 - 100; // Randomize X positions
          const r = 5 + Math.random() * 5; // Randomize radius size
          nodes.push({
            ...item,
            x,
            y,
            r,
            group,
            color: colorScale(group),
          });
        });
      });

      // Tooltip
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

      // Render circles
      svg
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", (d) => d.r)
        .attr("fill", (d) => d.color)
        .attr("opacity", 0.8)
        .on("mouseover", function (event, d) {
          d3.select(this).attr("stroke", "blue");
          tooltip
            .style("display", "block")
            .html(
              `<strong>${d.name || "Unknown"}</strong><br/>${d[groupBy]}`
            );
        })
        .on("mousemove", (event) => {
          tooltip
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY + "px");
        })
        .on("mouseout", function () {
          d3.select(this).attr("stroke", "none");
          tooltip.style("display", "none");
        })
        .transition()
        .duration(1500)
        .attr("r", (d) => d.r)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);

      // Once animation is finished
      setIsDataLoaded(true); // Update state once data is loaded
    };

    // Using requestIdleCallback to start simulation when the browser is idle
    const handle = window.requestIdleCallback(() => {
      startSimulation(); // Run the simulation once idle
    });

    return () => window.cancelIdleCallback(handle); // Cleanup on component unmount
  }, [data, groupBy]);

  // Show a loading message or spinner if data isn't loaded yet
  if (!isDataLoaded) {
    return <div>Loading...</div>;
  }

  return <svg ref={svgRef}></svg>;
};

export default BubbleChart2;
