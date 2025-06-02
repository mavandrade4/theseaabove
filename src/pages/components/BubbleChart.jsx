import React, { useState, useMemo, useRef, useEffect, useContext } from "react";
import * as d3 from "d3";
import { dataContext } from "../../context/dataContext";
import "../Groups.css";

const countryCodeMap = new Map();
try {
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  for (let code = 65; code <= 90; code++) {
    for (let code2 = 65; code2 <= 90; code2++) {
      const cc = String.fromCharCode(code) + String.fromCharCode(code2);
      const name = regionNames.of(cc);
      if (name && name !== cc) {
        countryCodeMap.set(name.toLowerCase(), cc);
      }
    }
  }
} catch (e) {
  console.warn("Intl.DisplayNames not supported in this environment.");
}

const BubbleChart = () => {
  const rawData = useContext(dataContext);

  // FILTER STATE
  const filterButtonRef = useRef(null);

  const [filters, setFilters] = useState({
    type: [],
    subtype: [],
    year: [],
    name: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);

  // GROUPING STATE
  const [groupBy, setGroupBy] = useState("type");
  const [showGroupControls, setShowGroupControls] = useState(true);

  // Handle outside click to close filter panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilters]);

  // Unique filter values
  const uniqueValues = useMemo(
    () => ({
      type: [...new Set(rawData.map((d) => d.type || "unknown"))],
      subtype: [...new Set(rawData.map((d) => d.subtype || "unknown"))],
      year: [...new Set(rawData.map((d) => d.year || "unknown"))],
    }),
    [rawData]
  );

  // Filter handlers
  const handleMultiSelect = (filterKey, value) => {
    setFilters((prev) => {
      const alreadySelected = prev[filterKey].includes(value);
      const updatedList = alreadySelected
        ? prev[filterKey].filter((v) => v !== value)
        : [...prev[filterKey], value];
      return { ...prev, [filterKey]: updatedList };
    });
  };

  const handleNameChange = (e) => {
    setFilters((prev) => ({ ...prev, name: e.target.value }));
  };

  // Filter data based on filters
  const filteredData = useMemo(() => {
    return rawData.filter((d) => {
      const matchType =
        filters.type.length === 0 || filters.type.includes(d.type || "unknown");
      const matchSubtype =
        filters.subtype.length === 0 ||
        filters.subtype.includes(d.subtype || "unknown");
      const matchYear =
        filters.year.length === 0 || filters.year.includes(d.year || "unknown");
      const matchName =
        filters.name === "" ||
        (d.name && d.name.toLowerCase().includes(filters.name.toLowerCase()));
      return matchType && matchSubtype && matchYear && matchName;
    });
  }, [filters, rawData]);

  // D3 bubble chart & grouping logic below
  const svgRef = useRef();
  const containerRef = useRef();

  const buildHierarchy = (data, groupBy) => {
    const groupings = {
      type: ["type", "subtype", "country"],
      subtype: ["subtype", "type", "country"],
      country: ["country", "type", "subtype"],
    };

    const keys = groupings[groupBy];
    const root = { name: "root", children: [] };

    data.forEach((item) => {
      let current = root;
      keys.forEach((key) => {
        const keyValue = item[key] || "unknown";
        let child = current.children.find((c) => c.name === keyValue);
        if (!child) {
          child = { name: keyValue, children: [] };
          current.children.push(child);
        }
        current = child;
      });
      current.children.push({
        ...item,
        name: item.name || "Unnamed",
        value: 1,
      });
    });

    return root;
  };

  useEffect(() => {
    if (!filteredData || filteredData.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);
    svg.style("background-color", "#020022");

    const color = d3.scaleSequential(d3.interpolateGreys);

    const rootData = buildHierarchy(filteredData, groupBy);
    const root = d3.hierarchy(rootData).sum((d) => d.value || 0);
    const pack = d3
      .pack()
      .size([width - 100, height - 100])
      .padding(10);

    pack(root);

    let focus = root;
    let view;

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const visibleNodes = root.descendants().filter((d) => d.depth > 0);

    const circle = g
      .selectAll("circle")
      .data(visibleNodes)
      .join("circle")
      .attr("r", (d) => d.r)
      .attr("fill", (d) => (d.children ? color(d.depth) : "#f0f0f0"))
      .attr("stroke", "#aaa")
      .attr("stroke-width", 1)
      .style("cursor", (d) => (d.children ? "pointer" : "default"))
      .style("display", (d) =>
        d.parent === root || d === root ? "inline" : "none"
      )
      .on("click", (event, d) => {
        if (focus !== d && d.children) {
          zoom(d);
          event.stopPropagation();
        }
      });

    const text = g
      .selectAll("text")
      .data(visibleNodes)
      .join("text")
      .attr("text-anchor", "middle")
      .style("fill-opacity", (d) => (d.parent === root ? 1 : 0))
      .style("display", (d) =>
        d.parent === root || d === root ? "inline" : "none"
      )
      .style("font-size", "12px")
      .style("fill", "#f0f0f0")
      .text((d) => {
        if (
          groupBy === "country" ||
          d.ancestors().some((a) => a.data.name === "country")
        ) {
          const fullName = d.data.name;
          // Show full name initially
          return fullName;
        }
        return d.data.name;
      })
      .each(function (d) {
        const textEl = d3.select(this);
        const fullName = d.data.name;
        const code = countryCodeMap.get(fullName.toLowerCase());
        const radius = d.r;

        // Check if full name fits
        let textLength = this.getComputedTextLength();
        if (textLength > radius * 2) {
          // Full name too long, try country code
          if (code) {
            textEl.text(code);
            textLength = this.getComputedTextLength();
            if (textLength > radius * 2) {
              // Code too long, hide text
              textEl.style("display", "none");
            }
          } else {
            // No code, hide text
            textEl.style("display", "none");
          }
        }
      });

    const zoomTo = (v, scaleFactor = 1) => {
      const k = (width / v[2]) * scaleFactor;
      view = v;

      circle
        .attr(
          "transform",
          (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
        )
        .attr("r", (d) => d.r * k);

      text.attr(
        "transform",
        (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
      );
    };

    const addComparisonCircle = (focusNode) => {
      d3.select("#comparison-group").remove();

      if (!focusNode || focusNode === root) return;

      const currentValue = focusNode.value;
      const totalValue = root.value;
      const remainingValue = totalValue - currentValue;

      if (remainingValue <= 0) return;

      const radiusScale = d3.scaleSqrt().domain([0, totalValue]).range([0, 80]);

      const comparisonGroup = svg
        .append("g")
        .attr("id", "comparison-group")
        .attr("transform", `translate(${width - 100}, 100)`);

      comparisonGroup
        .append("circle")
        .attr("id", "comparison-circle")
        .attr("r", radiusScale(remainingValue))
        .attr("fill", "#ccc")
        .attr("opacity", 0.5);

      comparisonGroup
        .append("text")
        .attr("id", "comparison-label")
        .attr("y", 5)
        .attr("text-anchor", "middle")
        .attr("fill", "#555")
        .style("font-size", "12px")
        .text("Comparison");
    };

    const zoom = (d) => {
      focus = d;

      addComparisonCircle(d);

      const dataRatio = focus.value / root.value;
      const scaleFactor = Math.sqrt(dataRatio);

      const newRadius = focus.r * 2;
      const transition = svg
        .transition()
        .duration(750)
        .tween("zoom", () => {
          const i = d3.interpolateZoom(view, [focus.x, focus.y, newRadius]);
          return (t) => zoomTo(i(t), scaleFactor);
        });

      circle
        .transition(transition)
        .style("display", (node) =>
          node.parent === focus || node === focus ? "inline" : "none"
        );

      text
        .transition(transition)
        .style("fill-opacity", (node) => (node.parent === focus ? 1 : 0))
        .style("display", (node) =>
          node.parent === focus || node === focus ? "inline" : "none"
        );
    };

    zoomTo([root.x, root.y, root.r * 2.4], 0.95);

    svg.on("click", () => {
      if (focus.parent) {
        zoom(focus.parent);
      } else {
        d3.select("#comparison-group").remove();
      }
    });

    return () => {
      svg.on("click", null);
    };
  }, [filteredData, groupBy]);

  return (
    <div ref={containerRef} className="groups-container">
      <div className="filter-ui">
        <button
          ref={filterButtonRef}
          onClick={() => setShowFilters((prev) => !prev)}
          className={`buttons ${showFilters ? "active" : ""}`}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>

        {showFilters && (
          <div className="filter-bar" ref={filterRef}>
            <input
              type="text"
              placeholder="Search by name..."
              value={filters.name}
              onChange={handleNameChange}
            />

            {["type", "subtype", "year"].map((key) => (
              <div key={key}>
                <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>
                <div>
                  {uniqueValues[key].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleMultiSelect(key, value)}
                      className={`buttons ${
                        filters[key].includes(value) ? "selected" : ""
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grouping UI */}
      <div className="groupings-ui">
        <button
          onClick={() => setShowGroupControls((prev) => !prev)}
          className="buttons"
        >
          {showGroupControls ? "Hide Groupings" : "Show Groupings"}
        </button>

        {showGroupControls && (
          <div className="buttons">
            {["type", "subtype", "country"].map((key) => (
              <button
                key={key}
                className={`buttons ${groupBy === key ? "selected" : ""}`}
                onClick={() => setGroupBy(key)}
              >
                Group by {key}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* D3 SVG */}
      <div className="groups">
        <svg ref={svgRef} className="groupings-svg" />
      </div>
    </div>
  );
};

export default BubbleChart;
