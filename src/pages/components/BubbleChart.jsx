import React, { useState, useEffect, useRef, useContext } from "react";
import * as d3 from "d3";
import { dataContext } from "../../context/dataContext";
import "../../App.css";
const InteractiveCircles = ({ width, height }) => {
  const ref = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    // Create 5-7 larger bubbles
    const bubbleCount = 5 + Math.floor(Math.random() * 3);
    const newBubbles = Array.from({ length: bubbleCount }, (_, i) => {
      const radius = 30 + Math.random() * 40;
      return {
        id: `bubble-${i}`,
        x: radius + Math.random() * (width - radius * 2),
        y: radius + Math.random() * (height - radius * 2),
        r: radius,
        vx: Math.random() * 0.2 - 0.1,
        vy: Math.random() * 0.2 - 0.1,
        color: `#bf574f`,
        opacity: 0.5,
        isDragging: false,
      };
    });
    
    setBubbles(newBubbles);

    // Create smaller nodes (25 total)
    const initialNodes = Array.from({ length: 25 }, (_, i) => {
      // Assign each node to a bubble
      const parentBubble = newBubbles[i % newBubbles.length];
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * (parentBubble.r * 0.7); // Stay inside parent bubble
      
      return {
        id: i,
        parentId: parentBubble.id,
        x: parentBubble.x + Math.cos(angle) * distance,
        y: parentBubble.y + Math.sin(angle) * distance,
        r: 3 + Math.random() * 2,
        vx: Math.random() * 0.4 - 0.2,
        vy: Math.random() * 0.4 - 0.2,
        color: "var(--primary)",
        isDragging: false,
        opacity: 0.9,
      };
    });
    
    setNodes(initialNodes);

    let animationId;
    const animate = () => {
      setBubbles(prevBubbles => 
        prevBubbles.map(bubble => {
          if (bubble.isDragging) return bubble;

          let x = bubble.x + bubble.vx;
          let y = bubble.y + bubble.vy;
          let vx = bubble.vx;
          let vy = bubble.vy;

          if (x < bubble.r || x > width - bubble.r) vx *= -1;
          if (y < bubble.r || y > height - bubble.r) vy *= -1;

          x = Math.max(bubble.r, Math.min(width - bubble.r, x));
          y = Math.max(bubble.r, Math.min(height - bubble.r, y));

          return { ...bubble, x, y, vx, vy };
        })
      );
      
      setNodes(prevNodes => 
        prevNodes.map(node => {
          if (node.isDragging) return node;
          
          const parentBubble = newBubbles.find(b => b.id === node.parentId);
          if (!parentBubble) return node;
          
          // Calculate distance from parent center
          const dx = node.x - parentBubble.x;
          const dy = node.y - parentBubble.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          let x = node.x + node.vx;
          let y = node.y + node.vy;
          let vx = node.vx;
          let vy = node.vy;
          
          // Bounce off parent bubble boundary
          if (distance > parentBubble.r - node.r) {
            const angle = Math.atan2(dy, dx);
            x = parentBubble.x + Math.cos(angle) * (parentBubble.r - node.r - 1);
            y = parentBubble.y + Math.sin(angle) * (parentBubble.r - node.r - 1);
            
            // Reflect velocity
            const dotProduct = vx * Math.cos(angle) + vy * Math.sin(angle);
            vx -= 1.8 * dotProduct * Math.cos(angle);
            vy -= 1.8 * dotProduct * Math.sin(angle);
          }
          
          // Add some randomness to movement
          vx += (Math.random() - 0.5) * 0.05;
          vy += (Math.random() - 0.5) * 0.05;
          
          // Apply damping
          vx *= 0.99;
          vy *= 0.99;

          return { ...node, x, y, vx, vy };
        })
      );
      
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [width, height]);

  const handleBubbleDragStart = (id) => {
    setBubbles(prevBubbles =>
      prevBubbles.map(bubble =>
        bubble.id === id ? { ...bubble, isDragging: true } : bubble
      )
    );
  };

  const handleBubbleDrag = (id, [dx, dy]) => {
    setBubbles(prevBubbles =>
      prevBubbles.map(bubble => {
        if (bubble.id !== id) return bubble;

        const x = Math.max(bubble.r, Math.min(width - bubble.r, bubble.x + dx));
        const y = Math.max(bubble.r, Math.min(height - bubble.r, bubble.y + dy));

        return { ...bubble, x, y };
      })
    );
  };

  const handleBubbleDragEnd = (id) => {
    setBubbles(prevBubbles =>
      prevBubbles.map(bubble =>
        bubble.id === id ? { ...bubble, isDragging: false } : bubble
      )
    );
  };

  const handleNodeDragStart = (id) => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === id ? { ...node, isDragging: true } : node
      )
    );
  };

  const handleNodeDrag = (id, [dx, dy]) => {
    setNodes(prevNodes =>
      prevNodes.map(node => {
        if (node.id !== id) return node;

        const x = Math.max(node.r, Math.min(width - node.r, node.x + dx));
        const y = Math.max(node.r, Math.min(height - node.r, node.y + dy));

        return { ...node, x, y };
      })
    );
  };

  const handleNodeDragEnd = (id) => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === id ? { ...node, isDragging: false } : node
      )
    );
  };

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      style={{
        display: "block",
        background: "transparent",
        overflow: "visible",
      }}
    >
      {/* Render larger bubbles first */}
      {bubbles.map(bubble => (
        <circle
          key={bubble.id}
          cx={bubble.x}
          cy={bubble.y}
          r={bubble.r}
          fill={bubble.color}
          strokeWidth={1.5}
          opacity={bubble.opacity}
          onPointerDown={() => handleBubbleDragStart(bubble.id)}
          onPointerMove={(e) => {
            if (bubble.isDragging && e.buttons === 1) {
              const svg = ref.current;
              const pt = svg.createSVGPoint();
              pt.x = e.clientX;
              pt.y = e.clientY;
              const { x, y } = pt.matrixTransform(svg.getScreenCTM().inverse());
              handleBubbleDrag(bubble.id, [x - bubble.x, y - bubble.y]);
            }
          }}
          onPointerUp={() => handleBubbleDragEnd(bubble.id)}
          onPointerLeave={() => handleBubbleDragEnd(bubble.id)}
          style={{
            cursor: "pointer",
            touchAction: "none",
          }}
        />
      ))}
      
      {/* Render smaller nodes on top */}
      {nodes.map(node => (
        <circle
          key={node.id}
          cx={node.x}
          cy={node.y}
          r={node.r}
          fill={node.color}
          strokeWidth={1}
          opacity={node.opacity}
          onPointerDown={() => handleNodeDragStart(node.id)}
          onPointerMove={(e) => {
            if (node.isDragging && e.buttons === 1) {
              const svg = ref.current;
              const pt = svg.createSVGPoint();
              pt.x = e.clientX;
              pt.y = e.clientY;
              const { x, y } = pt.matrixTransform(svg.getScreenCTM().inverse());
              handleNodeDrag(node.id, [x - node.x, y - node.y]);
            }
          }}
          onPointerUp={() => handleNodeDragEnd(node.id)}
          onPointerLeave={() => handleNodeDragEnd(node.id)}
          style={{
            cursor: "pointer",
            touchAction: "none",
          }}
        />
      ))}
    </svg>
  );
};

const BubbleChart = () => {
  const rawData = useContext(dataContext);
  const svgRef = useRef();
  const containerRef = useRef();
  const tooltipRef = useRef();

  const [showStartMessage, setShowStartMessage] = useState(true);
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
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
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
      } else if (mouseX > containerRect.width - edgeThreshold) {
        newOffsetX -= movementSpeed;
      }

      if (mouseY < edgeThreshold) {
        newOffsetY += movementSpeed;
      } else if (mouseY > containerRect.height - edgeThreshold) {
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

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [hoveredSat, svgOffset, zoomLevel]);

  const startGame = () => {
    const validTargets = rawData.filter((d) => d.name && d.type && d.country);
    if (validTargets.length === 0) return;

    const target =
      validTargets[Math.floor(Math.random() * validTargets.length)];
    setCurrentTarget(target);

const generatedClues = [
      `It was launched by ${target.country}`,
      `It's a ${target.type} type`,
      target.subtype
        ? `It's a ${target.subtype} subtype object`
        : "Subtype information is classified",
      `It was launched in ${target.year || "an unknown year"}`,
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
      setScore((prev) => prev + pointsEarned);
      endGame(true);
    } else {
      const hints = [];
      if (selectedData.country !== currentTarget.country)
        hints.push("Wrong country");
      if (selectedData.type !== currentTarget.type) hints.push("Wrong type");
      if (
        selectedData.year &&
        currentTarget.year &&
        Math.abs(selectedData.year - currentTarget.year) > 5
      ) {
        hints.push("Wrong launch period");
      }

      setScore((prev) => Math.max(0, prev + pointsEarned));

      if (pointsEarned > 0) {
        setGameMessage(
          `Close! The target was ${
            currentTarget.name
          }. You earned ${pointsEarned} points for partial matches. ${hints.join(
            ", "
          )}`
        );
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
      setScore((prev) => prev + bonusPoints);
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
    if (width === 0 || height === 0) {
      return; // Skip rendering until ResizeObserver has set real dimensions
    }
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const pack = d3.pack().size([width, height]).padding(3);
    const packedRoot = pack(root);

    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${width / 2 + svgOffset.x},${height / 2 + svgOffset.y})`
      );
    let focus = packedRoot;
    let view;

    const node = g
      .append("g")
      .selectAll("circle")
      .data(packedRoot.descendants().slice(1))
      .join("circle")
      .attr("fill", (d) =>
        d.children
          ? d3.interpolateHcl("#070707", "#bf574f")(d.depth / 5)
          : "#bf574f"
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

    //console.log("focus", focus);
    //console.log("zoom args", [focus.x, focus.y, focus.r * 2]);
    zoomTo([focus.x, focus.y, focus.r * 2]);

    function zoomTo(v) {
      if (width === 0 || height === 0) return;
      //console.log("zoomTo input", v);
      const k = width / v[2];
      //console.log("k", k);
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
      {/* Start Message Overlay */}
      {showStartMessage && (
        <div className="start-message-overlay">
          <div className="start-message-content">
            <div className="start-message-image">
              <div className="interactive-demo">
                <InteractiveCircles width={300} height={200} />
                <p className="demo-instructions">
                  Each small circle represents an object in Earth's orbit. Bigger circles are groups of related objects.
                </p>
              </div>
            </div>
            
            <div className="start-message-text">
              <h2>Welcome to Space Hunt</h2>
              
              <p>
                Explore Earth's orbital environment through this interactive visualization. 
                Each of the smaller circles represents an object in space - satellites, debris and others.
              </p>
              
              <div className="start-message-controls">
                <h4>Controls:</h4>
                <ul>
                  <li>Scroll to zoom in and out</li>
                  <li>Click and drag to pan around the visualization</li>
                  <li>Click on bubbles to explore hierarchical data</li>
                  <li>Hover over objects to see details</li>
                  <li>Use the filters to narrow down the data</li>
                  <li>Try the Space Hunt game</li>
                </ul>
              </div>
              
              <button
                className="buttons"
                onClick={() => setShowStartMessage(false)}
              >
                Start Exploring
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="filter-ui">
        <div
          className="filter-left-group"
          style={{ display: "flex", gap: "0.5rem" }}
        >
          {["type", "subtype", "country", "year"].map((key) => (
            <select
              key={key}
              value={filters[key]}
              onChange={(e) => handleFilterChange(key, e.target.value)}
              className="nav-button"
              style={{
                border: "1px solid var(--primary)",
                color: "var(--text)",
              }}
            >
              <option
                value=""
                style={{
                  backgroundColor: "var(--secondary)",
                  color: "var(--text-secondary)",
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
                    color: "var(--text)",
                  }}
                >
                  {val}
                </option>
              ))}
            </select>
          ))}
          <button onClick={resetFilters} className="nav-button">
            Reset Filters
          </button>
          <button onClick={() => setZoomLevel(1)} className="nav-button">
            Reset Zoom
          </button>
        </div>

        <div className="filter-right-group">
          <button
            onClick={gameActive ? () => endGame(false) : startGame}
            className="nav-button"
            style={{
              borderLeft: "1px solid var(--text)",
              borderBottom: "1px solid var(--secondary)",
              background: gameActive ? "#bf574f" : "#070707",
            }}
          >
            {gameActive ? "End Game" : "Play Game"}
          </button>
        </div>
      </div>

      {(gameActive || gameEnded) && (
        <div
          className="game-panel"
          style={{
            position: "absolute",
            bottom: "5vh",
            left: "10px",
            background: "rgba(7,7,7,0.9)",
            border: "1px solid #bf574f",
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

      <div
        className="groups-visualization"
        style={{ overflow: "hidden", height: "100%" }}
      >
        <svg
          ref={svgRef}
          className="groups-svg"
          width="100%"
          height="100%"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: "0 0",
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
            border: "1px solid #bf574f",
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
