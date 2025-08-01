import React, { useState, useEffect, useRef, useContext } from "react";
import * as d3 from "d3";
import { dataContext } from "../../context/dataContext";
import "../../App.css";

const BubbleChart = () => {
  const rawData = useContext(dataContext);
  const svgRef = useRef();
  const containerRef = useRef();

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredSat, setHoveredSat] = useState(null);
  const [focusBranch, setFocusBranch] = useState(null);
  const [filters, setFilters] = useState({
    type: "",
    subtype: "",
    country: "",
  });

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const buildHierarchy = (data) => {
    const root = { name: "root", children: [] };
    data.forEach((item) => {
      const {
        type = "unknown",
        subtype = "unknown",
        country = "unknown",
      } = item;
      let typeNode = root.children.find((c) => c.name === type);
      if (!typeNode) {
        typeNode = { name: type, children: [] };
        root.children.push(typeNode);
      }

      let subtypeNode = typeNode.children.find((c) => c.name === subtype);
      if (!subtypeNode) {
        subtypeNode = { name: subtype, children: [] };
        typeNode.children.push(subtypeNode);
      }

      let countryNode = subtypeNode.children.find((c) => c.name === country);
      if (!countryNode) {
        countryNode = { name: country, children: [] };
        subtypeNode.children.push(countryNode);
      }

      countryNode.children.push({ ...item, value: 1 });
    });
    return root;
  };

  useEffect(() => {
    let filteredData = rawData;
    Object.entries(filters).forEach(([key, value]) => {
      if (value) filteredData = filteredData.filter((d) => d[key] === value);
    });

    const data = focusBranch
      ? focusBranch.leaves().map((d) => d.data)
      : filteredData;
    const hierarchyData = buildHierarchy(data);
    const root = d3
      .hierarchy(hierarchyData)
      .sum((d) => d.value || 0)
      .sort((a, b) => b.value - a.value);

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const color = d3
      .scaleLinear()
      .domain([0, 5])
      .range(["#070707", "#5F1E1E"])
      .interpolate(d3.interpolateHcl);

    const pack = d3
      .pack()
      .size([width, height - 60])
      .padding(3);
    const packedRoot = pack(root);

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2 + 30})`);
    let focus = packedRoot;
    let view;

    const node = g
      .append("g")
      .selectAll("circle")
      .data(packedRoot.descendants().slice(1))
      .join("circle")
      .attr("fill", (d) => (d.children ? color(d.depth) : "#5F1E1E"))
      .attr("pointer-events", (d) => (!d.children ? "auto" : null))
      .on("mouseover", function (event, d) {
        if (!d.children) {
          d3.select(this).attr("stroke", "#f0f0f0").attr("stroke-width", 2);
          setHoveredSat(d.data);
        }
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke", null);
        setHoveredSat(null);
      })
      .on("click", (event, d) => {
        if (focus !== d && d.children) {
          zoom(event, d);
          event.stopPropagation();
        }
      });

    const label = g
      .append("g")
      .style("font", "10px sans-serif")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(packedRoot.descendants())
      .join("text")
      .style("fill-opacity", (d) =>
        d.parent === packedRoot && d.children ? 1 : 0
      )
      .style("display", (d) =>
        d.parent === packedRoot && d.children ? "inline" : "none"
      )
      .text((d) => d.data.name);

    svg.on("click", (event) => {
      zoom(event, packedRoot);
    });

    zoomTo([focus.x, focus.y, focus.r * 3]);

    function zoomTo(v) {
      const k = width / v[2];
      view = v;

      label.attr(
        "transform",
        (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
      );
      node.attr(
        "transform",
        (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
      );
      node.attr("r", (d) => d.r * k);
    }

    function zoom(event, d) {
      const transition = svg
        .transition()
        .duration(event.altKey ? 7500 : 750)
        .tween("zoom", () => {
          const i = d3.interpolateZoom(view, [d.x, d.y, d.r * 2]);
          return (t) => zoomTo(i(t));
        });

      label
        .filter((n) => n.parent === d && n.children)
        .transition(transition)
        .style("fill-opacity", 1)
        .on("start", function () {
          this.style.display = "inline";
        });

      label
        .filter((n) => n.parent !== d || !n.children)
        .transition(transition)
        .style("fill-opacity", 0)
        .on("end", function () {
          this.style.display = "none";
        });

      focus = d;
    }
  }, [rawData, focusBranch, filters, dimensions]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ type: "", subtype: "", country: "" });
    setFocusBranch(null);
    setHoveredSat(null);
  };

  const uniqueValues = (key) => [
    ...new Set(rawData.map((item) => item[key] || "unknown")),
  ];

  return (
    <div ref={containerRef} className="groups-container">
      <div className="filter-ui">
        {["type", "subtype", "country"].map((key) => (
          <select
            key={key}
            value={filters[key]}
            onChange={(e) => handleFilterChange(key, e.target.value)}
            className="filter-toggle-btn"
          >
            <option value="">{key.toUpperCase()}</option>
            {uniqueValues(key).map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        ))}
        <button onClick={resetFilters} className="filter-toggle-btn">
          Reset
        </button>
      </div>

      <div className="groups-visualization">
        <svg ref={svgRef} className="groups-svg" />
      </div>
      {hoveredSat && (
        <div className="satellite-details">
          <h3>Object Details</h3>
          <ul>
            <li>
              <strong>Name:</strong> {hoveredSat.name}
            </li>
            <li>
              <strong>Year:</strong> {hoveredSat.year}
            </li>
            <li>
              <strong>Type:</strong> {hoveredSat.type}
            </li>
            <li>
              <strong>Subtype:</strong> {hoveredSat.subtype}
            </li>
            <li>
              <strong>Country:</strong> {hoveredSat.country}
            </li>
            <li>
              <strong>Source:</strong> {hoveredSat.source}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default BubbleChart;
