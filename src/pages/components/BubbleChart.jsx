import React, { useState, useEffect, useRef, useContext } from "react";
import * as d3 from "d3";
import { dataContext } from "../../context/dataContext";
import "../../App.css";

const BubbleChart = () => {
  const rawData = useContext(dataContext);
  const svgRef = useRef();
  const containerRef = useRef();
  const tooltipRef = useRef();

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredSat, setHoveredSat] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [focusBranch, setFocusBranch] = useState(null);
  const [filters, setFilters] = useState({
    type: "",
    subtype: "",
    country: "",
    year: "",
  });
  const [gameActive, setGameActive] = useState(false);
  const [currentTarget, setCurrentTarget] = useState(null);
  const [clues, setClues] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameMessage, setGameMessage] = useState("");
  const [gameEnded, setGameEnded] = useState(false);
  const [svgOffset, setSvgOffset] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);

  // Handle zoom with mouse wheel
  useEffect(() => {
    const handleWheel = (e) => {
      if (!containerRef.current) return;
      e.preventDefault();
      
      // Adjust zoom level based on wheel direction
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, zoomLevel * zoomFactor));
      setZoomLevel(newZoom);
    };

    const container = containerRef.current;
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [zoomLevel]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    setScore(0);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    let timer;
    if (gameActive && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (gameActive && timeLeft === 0) {
      endGame(false);
    }
    return () => clearTimeout(timer);
  }, [gameActive, timeLeft]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - containerRect.left) / zoomLevel;
      const mouseY = (e.clientY - containerRect.top) / zoomLevel;
      setMousePosition({ x: mouseX, y: mouseY });

      const edgeThreshold = 100;
      const movementSpeed = 5;
      let newOffsetX = svgOffset.x;
      let newOffsetY = svgOffset.y;

      if (mouseX < edgeThreshold) {
        newOffsetX += movementSpeed;
      }
      else if (mouseX > containerRect.width - edgeThreshold) {
        newOffsetX -= movementSpeed;
      }

      if (mouseY < edgeThreshold) {
        newOffsetY += movementSpeed;
      }
      else if (mouseY > containerRect.height - edgeThreshold) {
        newOffsetY -= movementSpeed;
      }

      const maxOffset = 500;
      newOffsetX = Math.max(-maxOffset, Math.min(maxOffset, newOffsetX));
      newOffsetY = Math.max(-maxOffset, Math.min(maxOffset, newOffsetY));

      setSvgOffset({ x: newOffsetX, y: newOffsetY });

      if (tooltipRef.current && hoveredSat) {
        tooltipRef.current.style.left = `${e.clientX + 15}px`;
        tooltipRef.current.style.top = `${e.clientY + 15}px`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [hoveredSat, svgOffset, zoomLevel]);

  const startGame = () => {
    const validTargets = rawData.filter((d) => d.name && d.type && d.country);
    if (validTargets.length === 0) return;
    
    const target = validTargets[Math.floor(Math.random() * validTargets.length)];
    setCurrentTarget(target);
    
    const generatedClues = [
      `Find an object launched by ${target.country}`,
      `Find a ${target.type} type object`,
      target.subtype
        ? `Find a ${target.subtype} subtype object`
        : "Subtype information is classified",
      `Find an object launched around ${target.year || "an unknown year"}`,
    ];
    
    setClues(generatedClues);
    setTimeLeft(90);
    setGameActive(true);
    setGameEnded(false);
    setGameMessage(`Find: ${target.name}`);
  };

  const calculateScore = (selectedData) => {
    if (!currentTarget) return 0;
    
    let score = 0;
    const maxPossible = 100;
    
    if (selectedData.name === currentTarget.name) {
      return maxPossible;
    }
    
    if (selectedData.country === currentTarget.country) score += 20;
    if (selectedData.type === currentTarget.type) score += 20;
    if (selectedData.subtype === currentTarget.subtype) score += 20;
    
    if (selectedData.year && currentTarget.year) {
      const yearDiff = Math.abs(selectedData.year - currentTarget.year);
      if (yearDiff <= 1) score += 20;
      else if (yearDiff <= 5) score += 10;
    }
    
    if (score === 0) score = 5;
    
    return Math.min(score, maxPossible - 10);
  };

  const checkSelection = (selectedData) => {
    if (!gameActive || !currentTarget) return;
    
    const pointsEarned = calculateScore(selectedData);
    const isCorrect = selectedData.name === currentTarget.name;
    
    if (isCorrect) {
      setScore(prev => prev + pointsEarned);
      endGame(true);
    } else {
      const hints = [];
      if (selectedData.country !== currentTarget.country) hints.push("Wrong country");
      if (selectedData.type !== currentTarget.type) hints.push("Wrong type");
      if (
        selectedData.year &&
        currentTarget.year &&
        Math.abs(selectedData.year - currentTarget.year) > 5
      ) {
        hints.push("Wrong launch period");
      }
      
      setScore(prev => Math.max(0, prev + pointsEarned));
      
      if (pointsEarned > 0) {
        setGameMessage(`Close! The target was ${currentTarget.name}. You earned ${pointsEarned} points for partial matches. ${hints.join(", ")}`);
      } else {
        setGameMessage(`Not quite! ${hints.join(", ")}. Try again!`);
      }
    }
  };

  const endGame = (won) => {
    setGameActive(false);
    setGameEnded(true);
    
    if (won) {
      const bonusPoints = Math.floor(timeLeft / 3);
      setScore(prev => prev + bonusPoints);
      setGameMessage(
        `Congratulations! You found ${currentTarget.name}! (+${bonusPoints} time bonus)`
      );
    } else {
      setGameMessage(`Time's up! Try again!`);
    }
  };

  const buildHierarchy = (data) => {
    const root = { name: "root", children: [] };
    data.forEach((item) => {
      const {
        type = "unknown",
        subtype = "unknown",
        country = "unknown",
        year = "unknown",
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
      let yearNode = countryNode.children.find((c) => c.name === year);
      if (!yearNode) {
        yearNode = { name: year, children: [] };
        countryNode.children.push(yearNode);
      }
      yearNode.children.push({ ...item, value: 1 });
    });
    return root;
  };

  useEffect(() => {
    const filteredData = rawData.filter(
      (d) =>
        (!filters.type || d.type === filters.type) &&
        (!filters.subtype || d.subtype === filters.subtype) &&
        (!filters.country || d.country === filters.country) &&
        (!filters.year || d.year?.toString() === filters.year)
    );

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

    const pack = d3.pack().size([width, height]).padding(3);
    const packedRoot = pack(root);

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2 + svgOffset.x},${height / 2 + svgOffset.y})`);
    let focus = packedRoot;
    let view;

    const node = g
      .append("g")
      .selectAll("circle")
      .data(packedRoot.descendants().slice(1))
      .join("circle")
      .attr("fill", (d) =>
        d.children
          ? d3.interpolateHcl("#070707", "#5F1E1E")(d.depth / 5)
          : "#5F1E1E"
      )
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
        } else if (!d.children && gameActive) {
          checkSelection(d.data);
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

    svg.on("click", (event) => zoom(event, packedRoot));

    zoomTo([focus.x, focus.y, focus.r * 2]);

    function zoomTo(v) {
      const k = width / v[2];
      view = v;
      label.attr(
        "transform",
        (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
      );
      node
        .attr(
          "transform",
          (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
        )
        .attr("r", (d) => d.r * k);
    }

    function zoom(event, d) {
      const transition = svg
        .transition()
        .duration(750)
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
  }, [rawData, focusBranch, filters, dimensions, gameActive, svgOffset]);

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const resetFilters = () => {
    setFilters({ type: "", subtype: "", country: "", year: "" });
    setFocusBranch(null);
    setHoveredSat(null);
    setSvgOffset({ x: 0, y: 0 });
    setZoomLevel(1);
  };

  const uniqueValues = (key) => [
    ...new Set(rawData.map((item) => item[key] || "unknown")),
  ];

  return (
    <div
      ref={containerRef}
      className="groups-container"
      style={{ overflow: "hidden", position: "relative", height: "100vh" }}
    >
      <div className="filter-ui">
        {["type", "subtype", "country", "year"].map((key) => (
          <select
            key={key}
            value={filters[key]}
            onChange={(e) => handleFilterChange(key, e.target.value)}
            className="buttons"
            style={{
              border: "1px solid var(--primary)",
              color: "var(--text)",
            }}
          >
            <option 
              value="" 
              style={{
                backgroundColor: "var(--secondary)",
                color: "var(--text-secondary)"
              }}
            >
              {key.toUpperCase()}
            </option>
            {uniqueValues(key).map((val) => (
              <option 
                key={val} 
                value={val}
                style={{
                  backgroundColor: "var(--bg-dark)",
                  color: "var(--text)"
                }}
              >
                {val}
              </option>
            ))}
          </select>
        ))}
        <button onClick={resetFilters} className="buttons">
          Reset
        </button>
        <button
          onClick={gameActive ? () => endGame(false) : startGame}
          className="buttons"
          style={{ background: gameActive ? "#5F1E1E" : "#070707" }}
        >
          {gameActive ? "End Game" : "Start Hunt"}
        </button>
        <button 
          onClick={() => setZoomLevel(1)} 
          className="buttons"
          style={{ marginLeft: '10px' }}
        >
          Reset Zoom
        </button>
      </div>

      {(gameActive || gameEnded) && (
        <div
          className="game-panel"
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: "rgba(7,7,7,0.9)",
            border: "1px solid #5F1E1E",
            padding: "10px",
            zIndex: 100,
            maxWidth: "300px",
            overflowY: "auto",
            maxHeight: "90vh",
          }}
        >
          <h3>Space Hunt</h3>
          <p>
            Time: {timeLeft}s | Score: {score}
          </p>
          <p>{gameMessage}</p>
          {gameEnded && (
            <button className="buttons" onClick={startGame}>
              Play Again
            </button>
          )}
          {gameActive && (
            <>
              <h4>Clues:</h4>
              <ul>
                {clues.map((clue, i) => (
                  <li key={i}>{clue}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="groups-visualization" style={{ overflow: "hidden", height: "100%" }}>
        <svg 
          ref={svgRef} 
          className="groups-svg" 
          width="100%" 
          height="100%"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: '0 0'
          }}
        />
      </div>

      {hoveredSat && (
        <div
          ref={tooltipRef}
          className="satellite-details"
          style={{
            position: "fixed",
            background: "#f0f0f0",
            border: "1px solid #5F1E1E",
            padding: "10px",
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
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
          {gameActive && (
            <button
              className="buttons"
              onClick={() => checkSelection(hoveredSat)}
              style={{ pointerEvents: "auto" }}
            >
              Select This Object
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BubbleChart;