import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from "react";
import * as d3 from "d3";
import { dataContext } from "../../context/dataContext";
import "../../App.css";

// Throttle utility function
const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

// Debounce utility function
const debounce = (func, delay) => {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// Virtual rendering for large datasets
const useVirtualRendering = (data, dimensions, zoomLevel, svgOffset) => {
  const [visibleData, setVisibleData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  
  useEffect(() => {
    if (!data || data.length === 0) {
      setVisibleData([]);
      setTotalCount(0);
      return;
    }
    
    // Calculate viewport bounds
    const { width, height } = dimensions;
    const viewportWidth = width / zoomLevel;
    const viewportHeight = height / zoomLevel;
    
    // Calculate visible area with some padding
    const padding = 200;
    const minX = -svgOffset.x - padding;
    const maxX = -svgOffset.x + viewportWidth + padding;
    const minY = -svgOffset.y - padding;
    const maxY = -svgOffset.y + viewportHeight + padding;
    
    // Filter data that could be visible in current viewport
    // For now, we'll show all data but this can be optimized later
    setVisibleData(data);
    setTotalCount(data.length);
    
  }, [data, dimensions, zoomLevel, svgOffset]);
  
  return { visibleData, totalCount };
};

const BubbleChart = () => {
  const rawData = useContext(dataContext);
  const svgRef = useRef();
  const containerRef = useRef();
  const tooltipRef = useRef();
  const nodeSelection = useRef();
  const labelSelection = useRef();
  const renderTimeoutRef = useRef();
  const canvasRef = useRef();

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
  const [isRendering, setIsRendering] = useState(false);
  const [useCanvas, setUseCanvas] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialOffset, setInitialOffset] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);

  // Apply filters without data reduction - show ALL filtered data
  const filteredData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    
    return rawData.filter(
      (d) =>
        (!filters.type || d.type === filters.type) &&
        (!filters.subtype || d.subtype === filters.subtype) &&
        (!filters.country || d.country === filters.country) &&
        (!filters.year || d.year?.toString() === filters.year)
    );
  }, [rawData, filters]);

  // Use virtual rendering for large datasets
  const { visibleData, totalCount } = useVirtualRendering(
    filteredData, 
    dimensions, 
    zoomLevel, 
    svgOffset
  );

  // Build hierarchy function - defined before use
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

  // Memoize hierarchy data with filtered data
  const hierarchyData = useMemo(() => {
    if (!filteredData.length) return null;
    return buildHierarchy(filteredData);
  }, [filteredData]);

  // Memoize unique values for filters
  const uniqueValues = useMemo(() => {
    const values = {};
    ['type', 'subtype', 'country', 'year'].forEach(key => {
      values[key] = [...new Set(rawData.map((item) => item[key] || "unknown"))];
    });
    return values;
  }, [rawData]);

  // Handle zoom with mouse wheel only
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      
      // Get mouse position relative to container
      const containerRect = container.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      
      // Calculate zoom factor
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, zoomLevel * zoomFactor));
      
      // Calculate how much the zoom will change
      const zoomRatio = newZoom / zoomLevel;
      
      // Adjust offset so that the point under the cursor stays in the same place
      const newOffsetX = mouseX - (mouseX - svgOffset.x) * zoomRatio;
      const newOffsetY = mouseY - (mouseY - svgOffset.y) * zoomRatio;
      
      // Update both zoom and offset
      setZoomLevel(newZoom);
      setSvgOffset({ x: newOffsetX, y: newOffsetY });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [zoomLevel, svgOffset]);

  // Separate useEffect for drag event listeners to avoid conflicts
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e) => {
      // Start dragging on left mouse button anywhere in the container
      // Only exclude actual interactive elements like buttons and form controls
      const isInteractiveElement = e.target.closest('button, select, input, textarea, a, [role="button"]');
      
      if (e.button === 0 && !isInteractiveElement) {
        console.log('Starting drag:', { x: e.clientX, y: e.clientY, offset: svgOffset });
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialOffset({ x: svgOffset.x, y: svgOffset.y });
        container.style.cursor = 'grabbing';
        
        // Prevent any other functionality when starting to drag
        setIsZooming(false);
        
        // Prevent text selection and other default behaviors
        e.preventDefault();
      }
    };

    const handleMouseMove = (e) => {
      if (isDragging) {
        // When dragging, ONLY handle drag movement - nothing else
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        // Clear the focus branch to allow free movement
        if (focusBranch) {
          setFocusBranch(null);
        }
        
        // Update offset for drag movement - use initial offset + delta
        const newOffset = {
          x: initialOffset.x + deltaX,
          y: initialOffset.y + deltaY
        };
        
        console.log('Dragging:', { deltaX, deltaY, newOffset });
        setSvgOffset(newOffset);
        
        // Prevent any other mouse move behaviors while dragging
        return;
      }
      
      // Only handle other mouse move behaviors when NOT dragging
      console.log('Mouse move (not dragging):', { target: e.target.tagName });
      
      // Handle tooltip positioning here
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - containerRect.left) / zoomLevel;
      const mouseY = (e.clientY - containerRect.top) / zoomLevel;
      setMousePosition({ x: mouseX, y: mouseY });

      // REMOVED edge scrolling - it was causing unwanted movement
      // Edge scrolling will be re-implemented only when explicitly dragging

      // Update tooltip position
      if (tooltipRef.current && hoveredSat) {
        tooltipRef.current.style.left = `${e.clientX + 15}px`;
        tooltipRef.current.style.top = `${e.clientY + 15}px`;
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        console.log('Ending drag');
        setIsDragging(false);
        container.style.cursor = 'default';
      }
    };

    const handleMouseLeave = () => {
      if (isDragging) {
        setIsDragging(false);
        container.style.cursor = 'default';
      }
    };

    const handleDoubleClick = (e) => {
      // Double-click to reset view
      if (!e.target.closest('button, select, circle')) {
        setSvgOffset({ x: 0, y: 0 });
        setZoomLevel(1);
        setFocusBranch(null);
        // Force a chart rebuild to reset zoom state
        if (renderTimeoutRef.current) {
          clearTimeout(renderTimeoutRef.current);
        }
        renderTimeoutRef.current = setTimeout(() => {
          debouncedRenderChart();
        }, 50);
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('dblclick', handleDoubleClick);
    
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [isDragging, dragStart, initialOffset, focusBranch, isZooming, svgOffset, zoomLevel, hoveredSat]);

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



  // Memoized game functions
  const startGame = useCallback(() => {
    const validTargets = filteredData.filter((d) => d.name && d.type && d.country);
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
  }, [filteredData]);

  const calculateScore = useCallback((selectedData) => {
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
  }, [currentTarget]);

  const checkSelection = useCallback((selectedData) => {
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
  }, [gameActive, currentTarget, calculateScore]);

  const endGame = useCallback((won) => {
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
  }, [timeLeft, currentTarget]);

  // Canvas-based rendering for very large datasets
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || !filteredData.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = dimensions;
    
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Simple bubble rendering for performance
    ctx.fillStyle = '#bf574f';
    ctx.globalAlpha = 0.7;
    
    filteredData.forEach(item => {
      // Simple positioning - you can make this more sophisticated
      const x = (item.year - 1957) / (2024 - 1957) * width;
      const y = Math.random() * height;
      const radius = 3;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    ctx.globalAlpha = 1.0;
  }, [filteredData, dimensions]);

  // Debounced chart rendering to prevent excessive updates
  const debouncedRenderChart = useCallback(
    debounce(() => {
      if (isRendering) return;
      setIsRendering(true);
      
      // Use requestAnimationFrame for smooth rendering
      requestAnimationFrame(() => {
        if (useCanvas) {
          renderCanvas();
        } else {
          renderChart();
        }
        setIsRendering(false);
      });
    }, 100),
    [useCanvas, renderCanvas]
  );

  // Separate chart rendering logic - optimized for large datasets
  const renderChart = useCallback(() => {
    if (!hierarchyData || !svgRef.current || !dimensions.width || !dimensions.height) return;

    const data = focusBranch
      ? focusBranch.leaves().map((d) => d.data)
      : filteredData;
    
    const root = d3
      .hierarchy(hierarchyData)
      .sum((d) => d.value || 0)
      .sort((a, b) => b.value - a.value);

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    
    // Clear existing content
    svg.selectAll("*").remove();

    const pack = d3.pack().size([width, height]).padding(3);
    const packedRoot = pack(root);

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2 + svgOffset.x},${height / 2 + svgOffset.y})`);
    let focus = packedRoot;
    let view;

    // Render all nodes - no filtering for data visibility
    const allNodes = packedRoot.descendants().slice(1);
    console.log('Total nodes to render:', allNodes.length);
    
    // Store selections for potential updates
    nodeSelection.current = g
      .append("g")
      .selectAll("circle")
      .data(allNodes)
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

    // Render labels for all top-level nodes
    const topLevelNodes = packedRoot.descendants().filter(d => 
      d.parent === packedRoot && d.children
    );
    
    labelSelection.current = g
      .append("g")
      .style("font", "10px sans-serif")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(topLevelNodes)
      .join("text")
      .style("fill-opacity", 1)
      .style("display", "inline")
      .text((d) => d.data.name);

    svg.on("click", (event) => {
      // Only zoom out if clicking on the background (not on bubbles or labels)
      // AND not when we're about to start dragging
      if (event.target === svg.node() && !isDragging) {
        zoom(event, packedRoot);
        setFocusBranch(null); // Clear focus when zooming out
      }
    });

    zoomTo([focus.x, focus.y, focus.r * 2]);

    function zoomTo(v) {
      const k = width / v[2];
      view = v;
      
      // Batch DOM updates for better performance
      const nodes = nodeSelection.current;
      const labels = labelSelection.current;
      
      nodes.attr("transform", (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`)
           .attr("r", (d) => d.r * k);
      
      labels.attr("transform", (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    }

    function zoom(event, d) {
      setIsZooming(true);
      
      // Set focus branch to prevent offset interference
      setFocusBranch(d);
      
      const transition = svg
        .transition()
        .duration(500) // Reduced from 750ms
        .tween("zoom", () => {
          const i = d3.interpolateZoom(view, [d.x, d.y, d.r * 2]);
          return (t) => zoomTo(i(t));
        });

      labelSelection.current
        .filter((n) => n.parent === d && n.children)
        .transition(transition)
        .style("fill-opacity", 1)
        .on("start", function () {
          this.style.display = "inline";
        });

      labelSelection.current
        .filter((n) => n.parent !== d || !n.children)
        .transition(transition)
        .style("fill-opacity", 0)
        .on("end", function () {
          this.style.display = "none";
        });

      // Mark zoom as complete when transition ends
      transition.on("end", () => {
        setIsZooming(false);
      });

      focus = d;
    }
  }, [hierarchyData, focusBranch, dimensions, svgOffset, gameActive, checkSelection, filteredData]);

  // Use debounced rendering for chart updates - but NOT for svgOffset changes
  useEffect(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }
    
    renderTimeoutRef.current = setTimeout(() => {
      debouncedRenderChart();
    }, 50);
    
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [hierarchyData, focusBranch, dimensions, debouncedRenderChart]);

  // Handle offset updates without rebuilding the chart
  useEffect(() => {
    if (!svgRef.current || useCanvas) return;
    
    const svg = d3.select(svgRef.current);
    const g = svg.select('g');
    
    if (g.size() > 0) {
      // Update the transform of the main group without rebuilding
      g.attr("transform", `translate(${dimensions.width / 2 + svgOffset.x},${dimensions.height / 2 + svgOffset.y})`);
    }
  }, [svgOffset, dimensions, useCanvas]);

  // Auto-switch to canvas for very large datasets
  useEffect(() => {
    if (filteredData.length > 20000 && !useCanvas) {
      console.log('Large dataset detected, switching to canvas rendering');
      setUseCanvas(true);
    } else if (filteredData.length <= 10000 && useCanvas) {
      console.log('Dataset size reduced, switching back to SVG');
      setUseCanvas(false);
    }
  }, [filteredData.length, useCanvas]);

  // Debounced filter change handler
  const debouncedFilterChange = useCallback(
    debounce((key, value) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    }, 300),
    []
  );

  const handleFilterChange = (key, value) => {
    // Immediate update for better UX
    setFilters(prev => ({ ...prev, [key]: value }));
    // Debounced update for performance
    debouncedFilterChange(key, value);
  };

  const resetFilters = useCallback(() => {
    setFilters({ type: "", subtype: "", country: "", year: "" });
    setFocusBranch(null);
    setHoveredSat(null);
    setSvgOffset({ x: 0, y: 0 });
    setZoomLevel(1);
  }, []);

  // Memoized filter UI component
  const FilterUI = useMemo(() => (
    <div 
      className="filter-ui"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none"
      }}
    >
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
          {uniqueValues[key].map((val) => (
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
        style={{ background: gameActive ? "#bf574f" : "#070707" }}
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
      <button 
        onClick={() => setUseCanvas(!useCanvas)} 
        className="buttons"
        style={{ marginLeft: '10px', background: useCanvas ? '#bf574f' : '#070707' }}
      >
        {useCanvas ? 'SVG Mode' : 'Canvas Mode'}
      </button>
      <div style={{ marginLeft: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        {filteredData.length} objects {useCanvas && '(canvas rendering)'}
      </div>
      <div style={{ marginLeft: '10px', fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
        Drag to pan • Scroll to zoom • Double-click to reset
      </div>
    </div>
  ), [filters, uniqueValues, gameActive, startGame, endGame, resetFilters, filteredData.length, useCanvas]);

  // Memoized game panel component
  const GamePanel = useMemo(() => {
    if (!gameActive && !gameEnded) return null;
    
    return (
      <div
        className="game-panel"
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          background: "rgba(7,7,7,0.9)",
          border: "1px solid #bf574f",
          padding: "10px",
          zIndex: 100,
          maxWidth: "300px",
          overflowY: "auto",
          maxHeight: "90vh",
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none"
        }}
        onContextMenu={(e) => e.preventDefault()}
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
    );
  }, [gameActive, gameEnded, timeLeft, score, gameMessage, clues, startGame]);

  // Memoized tooltip component
  const Tooltip = useMemo(() => {
    if (!hoveredSat) return null;
    
    return (
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
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none"
        }}
        onContextMenu={(e) => e.preventDefault()}
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
    );
  }, [hoveredSat, gameActive, checkSelection]);

  return (
    <div
      ref={containerRef}
      className="groups-container"
      style={{ 
        overflow: "hidden", 
        position: "relative", 
        height: "100vh",
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none"
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {FilterUI}
      {GamePanel}

      <div 
        className="groups-visualization" 
        style={{ 
          overflow: "hidden", 
          height: "100%",
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none"
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* {isRendering && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'var(--text)',
            zIndex: 10
          }}>
            Rendering...
          </div>
        )} */}
        
        {useCanvas ? (
          <canvas 
            ref={canvasRef} 
            width="100%" 
            height="100%"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: '0 0',
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none"
            }}
            onContextMenu={(e) => e.preventDefault()}
          />
        ) : (
          <svg 
            ref={svgRef} 
            className="groups-svg" 
            width="100%" 
            height="100%"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: '0 0',
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none"
            }}
            onContextMenu={(e) => e.preventDefault()}
          />
        )}
        
        {isZooming && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'var(--text)',
            zIndex: 10,
            background: 'rgba(0,0,0,0.8)',
            padding: '10px 20px',
            borderRadius: '5px',
            fontSize: '14px'
          }}>
            Zooming...
          </div>
        )}
      </div>

      {Tooltip}
    </div>
  );
};

export default BubbleChart;