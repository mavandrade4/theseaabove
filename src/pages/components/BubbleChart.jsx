import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
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

const BubbleChart = ({ data }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const [groupBy, setGroupBy] = useState("type");
  const [showControls, setShowControls] = useState(true);

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
    if (!data || data.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);
    svg.style("background-color", "#020022");

    const color = d3.scaleSequential(d3.interpolateGreys);

    const rootData = buildHierarchy(data, groupBy);
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
        if (groupBy === "country" || d.ancestors().some(a => a.data.name === "country")) {
          const fullName = d.data.name;
          const code = countryCodeMap.get(fullName.toLowerCase());
          return fullName;
        }
        return d.data.name;
      })
      .each(function (d) {
        const textEl = d3.select(this);
        const textLength = this.getComputedTextLength();
        if (textLength > d.r * 2) {
          if (groupBy === "country" || d.ancestors().some(a => a.data.name === "country")) {
            const fullName = d.data.name;
            const code = countryCodeMap.get(fullName.toLowerCase());
            if (code) {
              textEl.text(`${fullName}-${code}`);
              const newLength = this.getComputedTextLength();
              if (newLength > d.r * 2) {
                textEl.style("display", "none");
              }
            } else {
              textEl.style("display", "none");
            }
          } else {
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
  }, [data, groupBy]);

  return (
    <div ref={containerRef} className="groupings-container">
      <div className="groupings-ui">
        <button
          onClick={() => setShowControls((prev) => !prev)}
          className="buttons"
        >
          {showControls ? "Hide Groupings" : "Show Groupings"}
        </button>

        {showControls && (
          <div className="buttons">
            {["type", "subtype", "country"].map((key) => (
              <button
                key={key}
                className={`buttons ${
                  groupBy === key ? "selected" : ""
                }`}
                onClick={() => setGroupBy(key)}
              >
                Group by {key}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="groups">
        <svg ref={svgRef} className="groupings-svg" />
      </div>
    </div>
  );
};

export default BubbleChart;
