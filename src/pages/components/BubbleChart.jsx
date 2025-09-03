import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useMemo,
  useCallback,
} from "react";
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
      setBubbles((prevBubbles) =>
        prevBubbles.map((bubble) => {
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

      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.isDragging) return node;

          const parentBubble = newBubbles.find((b) => b.id === node.parentId);
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
            x =
              parentBubble.x + Math.cos(angle) * (parentBubble.r - node.r - 1);
            y =
              parentBubble.y + Math.sin(angle) * (parentBubble.r - node.r - 1);

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
    setBubbles((prevBubbles) =>
      prevBubbles.map((bubble) =>
        bubble.id === id ? { ...bubble, isDragging: true } : bubble
      )
    );
  };

  const handleBubbleDrag = (id, [dx, dy]) => {
    setBubbles((prevBubbles) =>
      prevBubbles.map((bubble) => {
        if (bubble.id !== id) return bubble;

        const x = Math.max(bubble.r, Math.min(width - bubble.r, bubble.x + dx));
        const y = Math.max(
          bubble.r,
          Math.min(height - bubble.r, bubble.y + dy)
        );

        return { ...bubble, x, y };
      })
    );
  };

  const handleBubbleDragEnd = (id) => {
    setBubbles((prevBubbles) =>
      prevBubbles.map((bubble) =>
        bubble.id === id ? { ...bubble, isDragging: false } : bubble
      )
    );
  };

  const handleNodeDragStart = (id) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === id ? { ...node, isDragging: true } : node
      )
    );
  };

  const handleNodeDrag = (id, [dx, dy]) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id !== id) return node;

        const x = Math.max(node.r, Math.min(width - node.r, node.x + dx));
        const y = Math.max(node.r, Math.min(height - node.r, node.y + dy));

        return { ...node, x, y };
      })
    );
  };

  const handleNodeDragEnd = (id) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
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
      {bubbles.map((bubble) => (
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
      {nodes.map((node) => (
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

// Throttle utility function
const throttle = (func, limit) => {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Debounce utility function
const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
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
  const [isRendering, setIsRendering] = useState(false);
  const [useCanvas, setUseCanvas] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialOffset, setInitialOffset] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const [justFinishedDragging, setJustFinishedDragging] = useState(false);

  // Track if D3 zoom is currently active
  const [d3ZoomActive, setD3ZoomActive] = useState(false);

  // Track D3 zoom state to prevent loss during re-renders
  const [d3ZoomState, setD3ZoomState] = useState(null);

  // Track if we're in the middle of switching from D3 to manual control
  const [switchingToManual, setSwitchingToManual] = useState(false);

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
    ["type", "subtype", "country", "year"].forEach((key) => {
      const uniqueVals = [...new Set(rawData.map((item) => item[key] || "unknown"))];
      
      // Sort each filter type appropriately
      if (key === "year") {
        // Sort years in descending order (newest first)
        values[key] = uniqueVals.sort((a, b) => {
          if (a === "unknown") return 1;
          if (b === "unknown") return -1;
          return parseInt(b) - parseInt(a);
        });
      } else if (key === "country") {
        // Sort countries alphabetically, with "unknown" at the end
        values[key] = uniqueVals.sort((a, b) => {
          if (a === "unknown") return 1;
          if (b === "unknown") return -1;
          return a.localeCompare(b);
        });
      } else {
        // Sort type and subtype alphabetically, with "unknown" at the end
        values[key] = uniqueVals.sort((a, b) => {
          if (a === "unknown") return 1;
          if (b === "unknown") return -1;
          return a.localeCompare(b);
        });
      }
    });
    return values;
  }, [rawData]);

  // Handle zoom with mouse wheel only
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e) => {
      e.preventDefault();

      // If D3 zoom is active, switch to manual control
      if (d3ZoomActive) {
        console.log(
          "Starting wheel zoom with D3 zoom active - switching to manual control"
        );
        setD3ZoomActive(false);
        setSwitchingToManual(true);

        // Calculate the current offset based on where D3 positioned everything
        // We need to preserve the current view position when switching to manual control
        if (focusBranch) {
          // D3 zoom has positioned the focusBranch at the center of the viewport
          // In our manual system, we want the bubble to stay exactly where it is
          // The bubble is currently at (width/2, height/2) in screen coordinates
          // We need to calculate what offset keeps it there

          // The bubble's position in the packed layout
          const bubbleCenterX = focusBranch.x;
          const bubbleCenterY = focusBranch.y;

          // To keep the bubble centered, we need:
          // The bubble is currently at (bubbleCenterX, bubbleCenterY) in the packed layout
          // We want it to stay at (width/2, height/2) in screen coordinates
          // Since the packed layout is already centered, we just need to offset by the bubble's position

          // The correct calculation is:
          // offset.x = width/2 - bubbleCenterX
          // offset.y = height/2 - bubbleCenterY

          const targetOffsetX = dimensions.width / 2 - bubbleCenterX;
          const targetOffsetY = dimensions.height / 2 - bubbleCenterY;

          setSvgOffset({ x: targetOffsetX, y: targetOffsetY });
          console.log("Switched to manual control with preserved position:", {
            targetOffsetX,
            targetOffsetY,
            zoomLevel,
            bubbleCenterX,
            bubbleCenterY,
            width: dimensions.width,
            height: dimensions.height,
          });

          // Return early to prevent immediate zoom calculation
          // The user needs to scroll again to actually zoom
          return;
        }
      }

      // If we're switching to manual control, don't apply zoom yet
      if (switchingToManual) {
        console.log("Switching to manual control - skipping zoom calculation");
        setSwitchingToManual(false);
        return;
      }

      // Get mouse position relative to container
      const containerRect = container.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      // Calculate zoom factor
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, zoomLevel * zoomFactor));

      // Calculate the center of the viewport
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;

      // Calculate the current mouse position in the data coordinate system
      const dataX = (mouseX - centerX - svgOffset.x) / zoomLevel;
      const dataY = (mouseY - centerY - svgOffset.y) / zoomLevel;

      // Calculate new offset to keep the mouse over the same data point
      const newOffsetX = mouseX - centerX - dataX * newZoom;
      const newOffsetY = mouseY - centerY - dataY * newZoom;

      // Update both zoom and offset
      setZoomLevel(newZoom);
      setSvgOffset({ x: newOffsetX, y: newOffsetY });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [
    zoomLevel,
    svgOffset,
    dimensions,
    d3ZoomActive,
    focusBranch,
    switchingToManual,
  ]);

  // Separate useEffect for drag event listeners to avoid conflicts
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e) => {
      // Start dragging on left mouse button anywhere in the container
      // Only exclude actual interactive elements like buttons and form controls
      const isInteractiveElement = e.target.closest(
        'button, select, input, textarea, a, [role="button"]'
      );

      if (e.button === 0 && !isInteractiveElement) {
        // console.log('Starting drag:', { x: e.clientX, y: e.clientY, offset: svgOffset });
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialOffset({ x: svgOffset.x, y: svgOffset.y });
        container.style.cursor = "grabbing";

        // Prevent any other functionality when starting to drag
        setIsZooming(false);

        // If D3 zoom is active, switch to manual control but preserve zoom level
        if (d3ZoomActive) {
          console.log(
            "Starting drag with D3 zoom active - switching to manual control"
          );
          setD3ZoomActive(false);

          // Don't change the offset when switching to manual control during drag
          // The user will reposition the view by dragging, so we don't need to calculate
          // a new offset that might cause jumping
          console.log(
            "Switched to manual control - offset will be handled by drag"
          );
        }

        // Prevent text selection and other default behaviors
        e.preventDefault();
      }
    };

    const handleMouseMove = (e) => {
      if (isDragging) {
        // When dragging, ONLY handle drag movement - nothing else
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        // Don't clear the focus branch during dragging - it can cause position resets
        // The focus branch should persist until explicitly changed by user interaction

        // Update offset for drag movement - use initial offset + delta
        const newOffset = {
          x: initialOffset.x + deltaX,
          y: initialOffset.y + deltaY,
        };

        // console.log('Dragging:', { deltaX, deltaY, newOffset, d3ZoomActive });
        setSvgOffset(newOffset);

        // Prevent any other mouse move behaviors while dragging
        return;
      }

      // Only handle other mouse move behaviors when NOT dragging
      // console.log('Mouse move (not dragging):', { target: e.target.tagName });

      // Handle tooltip positioning here
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      // Account for zoom and offset when calculating mouse position
      const mouseX =
        (e.clientX - containerRect.left - svgOffset.x - dimensions.width / 2) /
        zoomLevel;
      const mouseY =
        (e.clientY - containerRect.top - svgOffset.y - dimensions.height / 2) /
        zoomLevel;
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
        // console.log('Ending drag');
        setIsDragging(false);
        setJustFinishedDragging(true);
        container.style.cursor = "default";

        // Clear the flag after a short delay to prevent accidental clicks
        setTimeout(() => {
          setJustFinishedDragging(false);
        }, 150); // 150ms delay should be enough to prevent accidental clicks
      }
    };

    const handleMouseLeave = () => {
      if (isDragging) {
        setIsDragging(false);
        container.style.cursor = "default";
      }
    };

    const handleDoubleClick = (e) => {
      // Double-click to reset view
      if (!e.target.closest("button, select, circle")) {
        // Reset both manual zoom and D3 zoom
        setSvgOffset({ x: 0, y: 0 });
        setZoomLevel(1);
        setFocusBranch(null);
        setD3ZoomActive(false);

        // Force a chart rebuild to reset zoom state
        if (renderTimeoutRef.current) {
          clearTimeout(renderTimeoutRef.current);
        }
        renderTimeoutRef.current = setTimeout(() => {
          debouncedRenderChart();
        }, 50);
      }
    };

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("dblclick", handleDoubleClick);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("dblclick", handleDoubleClick);
    };
  }, [
    isDragging,
    dragStart,
    initialOffset,
    focusBranch,
    isZooming,
    hoveredSat,
    justFinishedDragging,
    d3ZoomActive,
    dimensions,
  ]);

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
    const validTargets = filteredData.filter(
      (d) => d.name && d.type && d.country
    );
    if (validTargets.length === 0) return;

    const target =
      validTargets[Math.floor(Math.random() * validTargets.length)];
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

  const calculateScore = useCallback(
    (selectedData) => {
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
    },
    [currentTarget]
  );

  const checkSelection = useCallback(
    (selectedData) => {
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
    },
    [gameActive, currentTarget, calculateScore]
  );

  const endGame = useCallback(
    (won) => {
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
    },
    [timeLeft, currentTarget]
  );

  // Canvas-based rendering for very large datasets
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || !filteredData.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { width, height } = dimensions;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Apply zoom and pan transformations
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(
      (width / 2 + svgOffset.x) / zoomLevel,
      (height / 2 + svgOffset.y) / zoomLevel
    );

    // Simple bubble rendering for performance
    ctx.fillStyle = "#bf574f";
    ctx.globalAlpha = 0.7;

    filteredData.forEach((item) => {
      // Simple positioning - you can make this more sophisticated
      const x = ((item.year - 1957) / (2024 - 1957)) * width - width / 2;
      const y = Math.random() * height - height / 2;
      const radius = 3;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    });

    ctx.restore();
    ctx.globalAlpha = 1.0;
  }, [filteredData, dimensions, svgOffset, zoomLevel]);

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
    console.log("renderChart called, d3ZoomActive:", d3ZoomActive);

    // Don't render if D3 zoom is active - this prevents resetting D3 zoom state
    if (d3ZoomActive) {
      console.log("Skipping chart render - D3 zoom is active");
      return;
    }

    if (
      !hierarchyData ||
      !svgRef.current ||
      !dimensions.width ||
      !dimensions.height
    ) {
      console.log("renderChart early return:", {
        hasHierarchyData: !!hierarchyData,
        hasSvgRef: !!svgRef.current,
        dimensions,
      });
      return;
    }

    const data = focusBranch
      ? focusBranch.leaves().map((d) => d.data)
      : filteredData;

    const root = d3
      .hierarchy(hierarchyData)
      .sum((d) => d.value || 0)
      .sort((a, b) => b.value - a.value);

    const { width, height } = dimensions;
    if (width === 0 || height === 0) {
      return; // Skip rendering until ResizeObserver has set real dimensions
    }
    const svg = d3.select(svgRef.current);

    // Clear existing content
    console.log("Clearing SVG content before re-rendering");
    svg.selectAll("*").remove();

    const pack = d3.pack().size([width, height]).padding(3);
    const packedRoot = pack(root);

    const g = svg
      .append("g")
      .attr(
        "transform",
        `scale(${zoomLevel}) translate(${
          (width / 2 + svgOffset.x) / zoomLevel
        },${(height / 2 + svgOffset.y) / zoomLevel})`
      );
    let focus = packedRoot;
    let view;

    // If D3 zoom is active, restore the previous state
    if (d3ZoomActive && d3ZoomState) {
      focus = d3ZoomState.focus;
      view = d3ZoomState.view;
      // Don't restore zoom level - let manual control handle it
      // setZoomLevel(d3ZoomState.zoomLevel);
    } else if (d3ZoomActive && focusBranch) {
      focus = focusBranch;
      // Calculate the view based on the focus branch
      view = [focus.x, focus.y, focus.r * 2];
    }

    // Render all nodes - no filtering for data visibility
    const allNodes = packedRoot.descendants().slice(1);
    // console.log('Total nodes to render:', allNodes.length);

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
        // Prevent zooming if we just finished dragging
        if (justFinishedDragging) {
          event.stopPropagation();
          return;
        }

        if (focus !== d && d.children) {
          zoom(event, d);
          event.stopPropagation();
        } else if (!d.children && gameActive) {
          checkSelection(d.data);
        }
      });

    // Render labels for all top-level nodes
    const topLevelNodes = packedRoot
      .descendants()
      .filter((d) => d.parent === packedRoot && d.children);

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
      // AND not when we just finished dragging
      if (event.target === svg.node() && !isDragging && !justFinishedDragging) {
        // Don't reset manual zoom state - let D3 handle the zoom out
        zoom(event, packedRoot);
        setFocusBranch(null); // Clear focus when zooming out
      }
    });

    //console.log("focus", focus);
    //console.log("zoom args", [focus.x, focus.y, focus.r * 2]);

    // Only call zoomTo if D3 zoom is not active
    // This prevents resetting the view when D3 zoom has positioned everything
    if (!d3ZoomActive) {
      zoomTo([focus.x, focus.y, focus.r * 2]);
    }

    function zoomTo(v) {
      if (width === 0 || height === 0) return;
      //console.log("zoomTo input", v);
      const k = width / v[2];
      //console.log("k", k);
      view = v;

      // Batch DOM updates for better performance
      const nodes = nodeSelection.current;
      const labels = labelSelection.current;

      nodes
        .attr(
          "transform",
          (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
        )
        .attr("r", (d) => d.r * k);

      labels.attr(
        "transform",
        (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
      );
    }

    function zoom(event, d) {
      // setIsZooming(true);
      setD3ZoomActive(true); // D3 zoom is now active
      console.log("d3ZoomActive", d3ZoomActive);
      // Set focus branch to prevent offset interference
      setFocusBranch(d);

      const transition = svg
        .transition()
        .duration(500) // Reduced from 750ms
        .tween("zoom", () => {
          // Reset D3 zoom state to match our current manual transform
          // This ensures D3 zoom starts from the right position
          if (
            !d3ZoomActive &&
            (zoomLevel !== 1 || svgOffset.x !== 0 || svgOffset.y !== 0)
          ) {
            // Calculate what the current view should be based on manual transform
            const centerX = dimensions.width / 2;
            const centerY = dimensions.height / 2;
            const scale = zoomLevel;
            const offsetX = svgOffset.x;
            const offsetY = svgOffset.y;

            // Update the D3 view state to match our manual transform
            view = [
              centerX - offsetX / scale,
              centerY - offsetY / scale,
              dimensions.width / scale,
            ];
          }

          // Now zoom to the bubble's position
          const targetView = [d.x, d.y, d.r * 2];

          const i = d3.interpolateZoom(view, targetView);
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

        // Save the D3 zoom state to prevent loss during re-renders
        // Don't update zoom level here - let manual control handle it
        const finalView = [d.x, d.y, d.r * 2];
        setD3ZoomState({
          view: finalView,
          focus: d,
          zoomLevel: zoomLevel, // Keep the current zoom level
        });

        // Keep D3 zoom active - don't switch to manual control
        // The user must explicitly use wheel or drag to take manual control
        // This prevents the two systems from fighting each other

        // Don't change svgOffset - let D3 keep its positioning
        // setD3ZoomActive(false); // Keep D3 zoom active
      });

      // Update the focus branch state to persist across re-renders
      setFocusBranch(d);
      focus = d;
    }
  }, [
    hierarchyData,
    focusBranch,
    dimensions,
    gameActive,
    checkSelection,
    filteredData,
  ]);

  // Use debounced rendering for chart updates - but NOT for svgOffset changes
  // AND NOT when D3 zoom is active (to prevent resetting D3 zoom state)
  useEffect(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    // Don't re-render the chart if D3 zoom is active
    // This prevents resetting the D3 zoom positioning
    if (d3ZoomActive) {
      return;
    }

    renderTimeoutRef.current = setTimeout(() => {
      debouncedRenderChart();
    }, 50);

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [
    hierarchyData,
    focusBranch,
    dimensions,
    debouncedRenderChart,
    d3ZoomActive,
  ]);

  // Handle offset and zoom updates without rebuilding the chart
  useEffect(() => {
    if (!svgRef.current || useCanvas) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select("g");

    if (g.size() > 0) {
      // Only apply manual transform if D3 zoom is not active
      // This ensures the two systems don't fight each other
      if (!d3ZoomActive) {
        const transform = `scale(${zoomLevel}) translate(${
          (dimensions.width / 2 + svgOffset.x) / zoomLevel
        },${(dimensions.height / 2 + svgOffset.y) / zoomLevel})`;
        // console.log('Manual transform update:', { zoomLevel, svgOffset, transform });
        g.attr("transform", transform);
      } else {
        // If D3 zoom is active, DON'T change the transform at all
        // Let D3 zoom handle all positioning
        // Also, don't let any manual state changes interfere
        console.log(
          "D3 zoom active - preventing manual transform interference"
        );
      }
    }
  }, [svgOffset, zoomLevel, dimensions, useCanvas, d3ZoomActive]);

  // Handle canvas re-rendering when zoom or offset changes
  useEffect(() => {
    if (useCanvas && !d3ZoomActive) {
      renderCanvas();
    }
    // If D3 zoom is active, don't let canvas re-rendering interfere
  }, [useCanvas, svgOffset, zoomLevel, renderCanvas, d3ZoomActive]);

  // Auto-switch to canvas for very large datasets
  useEffect(() => {
    if (filteredData.length > 20000 && !useCanvas) {
      // console.log('Large dataset detected, switching to canvas rendering');
      setUseCanvas(true);
    } else if (filteredData.length <= 10000 && useCanvas) {
      // console.log('Dataset size reduced, switching back to SVG');
      setUseCanvas(false);
    }
  }, [filteredData.length, useCanvas]);

  // Debounced filter change handler
  const debouncedFilterChange = useCallback(
    debounce((key, value) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }, 300),
    []
  );

  const handleFilterChange = (key, value) => {
    // Immediate update for better UX
    setFilters((prev) => ({ ...prev, [key]: value }));
    // Debounced update for performance
    debouncedFilterChange(key, value);
  };

  const resetFilters = useCallback(() => {
    setFilters({ type: "", subtype: "", country: "", year: "" });
    setFocusBranch(null);
    setHoveredSat(null);

    // Only reset manual zoom state if D3 zoom is not active
    if (!d3ZoomActive) {
      setSvgOffset({ x: 0, y: 0 });
      setZoomLevel(1);
    }
  }, [d3ZoomActive]);

  const StartMessage = useMemo(
    () =>
      showStartMessage &&
      showStartMessage && (
        <div className="start-message-overlay">
          <div className="start-message-content">
            <div className="start-message-image">
              <div className="interactive-demo">
                <InteractiveCircles width={300} height={200} />
                <p className="demo-instructions">
                  Each small circle represents an object in Earth's orbit.
                  Bigger circles are groups of related objects.
                </p>
              </div>
            </div>
            <div className="start-message-text">
              <div className="annotation-header">
                <span className="annotation-year">Start</span>
                <h3 className="annotation-title">Space Hunt</h3>
              </div>
              <p>
                Explore Earth's orbital environment through this interactive
                visualization. Each of the smaller circles represents an object
                in space - satellites, debris and others.
              </p>
              <div className="start-message-controls">
                <p>
                  Scroll to zoom in and out<br></br>
                  Click and drag to pan around<br></br>
                  Click on bubbles to explore data<br></br>
                  Hover over objects to see details<br></br>
                  Use the filters to narrow down the data<br></br>
                  Try the Space Hunt game
                </p>
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
      ),
    [showStartMessage]
  );

  // Memoized filter UI component
  const FilterUI = useMemo(
    () => (
      <div
        className="filter-ui"
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
      >
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
              {uniqueValues[key].map((val) => (
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
          <button
            onClick={() => setZoomLevel(1)}
            className="nav-button"
            style={{ marginLeft: "10px" }}
          >
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
            {gameActive ? "End Game" : "Play"}
          </button>
        </div>

        {/*<button 
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
      </div>*/}
      </div>
    ),
    [
      filters,
      uniqueValues,
      gameActive,
      startGame,
      endGame,
      resetFilters,
      filteredData.length,
      useCanvas,
    ]
  );

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
          msUserSelect: "none",
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
          msUserSelect: "none",
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
        msUserSelect: "none",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {StartMessage}
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
          msUserSelect: "none",
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
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
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
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
            }}
            onContextMenu={(e) => e.preventDefault()}
          />
        )}

        {/*isZooming && (
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
        )}*/}
      </div>

      {Tooltip}
    </div>
  );
};

export default BubbleChart;
