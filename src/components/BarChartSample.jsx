import React from "react";
import { useEffect, useRef } from "react";
import * as d3 from "d3";

const BarChartSpaceDecay = ({ data }) => {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Clear previous render
    d3.select(ref.current).selectAll("*").remove();

    const margin = { top: 30, right: 30, bottom: 70, left: 60 },
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

    const svg = d3
      .select(ref.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const countsByYearAndType = d3.rollups(
      data,
      (v) => {
        const countByType = { satellite: 0, debris: 0, unknown: 0 };
        v.forEach((d) => {
          //console.log(d.OBJECT_TYPE);
          const type = d.OBJECT_TYPE || "unknown";
          if (type === "PAYLOAD" || type === "ROCKET BODY" ) countByType.satellite++;
          else if (type === "DEBRIS") countByType.debris++;
          else countByType.unknown++;
        });
        return countByType;
      },
      (d) => (d.LAUNCH_DATE)
    );

    const chartData = [];

    countsByYearAndType.forEach(([year, typeCounts]) => {
      if (year && year >= 1957 && year <= 2024) {
        chartData.push({ year, type: "satellite", count: typeCounts.satellite });
        chartData.push({ year, type: "debris", count: typeCounts.debris });
        chartData.push({ year, type: "unknown", count: typeCounts.unknown });
      }
    });

    const allYears = [...new Set(chartData.map((d) => d.year))].sort((a, b) => a - b);
    const objectTypes = ["satellite", "debris", "unknown"];
    const color = d3.scaleOrdinal().domain(objectTypes).range(["#5f0f40", "#9a031e", "#0f4c5c"]);

    // X scale for years
    const x0 = d3.scaleBand().domain(allYears).range([0, width]).padding(0.2);

    // X scale for object type within each year
    const x1 = d3.scaleBand().domain(objectTypes).range([0, x0.bandwidth()]).padding(0.05);

    const yMax = d3.max(chartData, (d) => d.count);
    const y = d3.scaleLinear().domain([0, yMax]).range([height, 0]);

    // Add axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0).tickValues(x0.domain().filter((d, i) => i % 5 === 0))) // Fewer ticks
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append("g").call(d3.axisLeft(y));

    // Draw bars
    svg
      .selectAll("g.bar-group")
      .data(allYears)
      .enter()
      .append("g")
      .attr("class", "bar-group")
      .attr("transform", (d) => `translate(${x0(d)},0)`)
      .selectAll("rect")
      .data((year) =>
        objectTypes.map((type) => {
          const item = chartData.find((d) => d.year === year && d.type === type);
          return {
            type,
            year,
            count: item ? item.count : 0,
          };
        })
      )
      .enter()
      .append("rect")
      .attr("x", (d) => x1(d.type))
      .attr("y", (d) => y(d.count))
      .attr("width", x1.bandwidth())
      .attr("height", (d) => height - y(d.count))
      .attr("fill", (d) => color(d.type));

    // Legend
    const legend = svg
      .selectAll(".legend")
      .data(objectTypes)
      .enter()
      .append("g")
      .attr("transform", (_, i) => `translate(${i * 120},-20)`);

    legend
      .append("rect")
      .attr("x", 0)
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", (d) => color(d));

    legend
      .append("text")
      .attr("x", 20)
      .attr("y", 10)
      .text((d) => d)
      .style("font-size", "12px")
      .attr("alignment-baseline", "middle");
  }, [data]);

  return <div ref={ref}></div>;
};

export default BarChartSpaceDecay;