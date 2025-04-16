import React from 'react';
import * as d3 from "d3";
import { useEffect, useRef } from "react";

const BubbleChart = ({ data }) => {
  const ref = useRef();

  useEffect(() => {
    if (data.length === 0) return;

    const margin = { top: 50, right: 30, bottom: 50, left: 60 },
          width = window.innerWidth - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

    d3.select(ref.current).select("svg").remove();
    
    const svg = d3.select(ref.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

      const parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%S%Z");
      data.forEach(d => {
        if (d.launch && d.launch.Date) {
          d.date = parseDate(d.launch.Date);
        } else {
          d.date = "unknown";
        }
      });

    const validDates = data.map(d => d.date).filter(d => d !== null);
    const x = d3.scaleTime()
    .domain(d3.extent(validDates))
    .range([0, width]);
    
    const color = d3.scaleOrdinal()
      .domain(["satellite", "debris", "unknown"])
      .range(["red", "blue", "gray"]);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y")));

    const tooltip = d3.select("body").append("div")
      .style("position", "absolute")
      .style("background", "white")
      .style("padding", "5px")
      .style("border", "1px solid black")
      .style("border-radius", "5px")
      .style("visibility", "hidden");

    const circles = svg.append("g")
      .selectAll("circle")
      .data(data)
      .enter().append("circle")
      .attr("cx", d => x(d.date)) // LAUNCH - DATE
      .attr("cy", height)
      .attr("r", 0)
      .attr("fill", d => color(d.object_type)) // OBJECT TYPE
      .attr("opacity", 0.8)
      .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible")
          .text(d.operators.Name);
      })
      .on("mousemove", (event) => {
        tooltip.style("top", `${event.pageY - 10}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", () => tooltip.style("visibility", "hidden"));

    circles.transition()
      .delay((d, i) => i * 50)
      .duration(1000)
      .attr("r", 5);
  }, [data]);

  return <div style={{ width: "100%", overflowX: "auto" }} ref={ref}></div>;
};

export default BubbleChart;
