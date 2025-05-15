import React, { useState, useMemo, useContext, useRef, useEffect } from "react";
import BubbleChart from "./components/BubbleChart";
import { dataContext } from "../context/dataContext";
import './Groups.css'

const Groups = () => {
  const rawData = useContext(dataContext);
  const [filters, setFilters] = useState({
    type: [],
    subtype: [],
    year: [],
    name: "",
  });
  const [showControls, setShowControls] = useState(false);
  const filterRef = useRef(null); // Ref for filter overlay

  // Handle outside click to close filters
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowControls(false);
      }
    };

    if (showControls) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showControls]);

  const uniqueValues = {
    type: [...new Set(rawData.map(d => d.type || "unknown"))],
    subtype: [...new Set(rawData.map(d => d.subtype || "unknown"))],
    year: [...new Set(rawData.map(d => d.year || "unknown"))],
  };

  const handleMultiSelect = (filterKey, value) => {
    setFilters(prev => {
      const alreadySelected = prev[filterKey].includes(value);
      const updatedList = alreadySelected
        ? prev[filterKey].filter(v => v !== value)
        : [...prev[filterKey], value];
      return { ...prev, [filterKey]: updatedList };
    });
  };

  const handleNameChange = (e) => {
    setFilters(prev => ({ ...prev, name: e.target.value }));
  };

  const filteredData = useMemo(() => {
    return rawData.filter(d => {
      const matchType = filters.type.length === 0 || filters.type.includes(d.type || "unknown");
      const matchSubtype = filters.subtype.length === 0 || filters.subtype.includes(d.subtype || "unknown");
      const matchYear = filters.year.length === 0 || filters.year.includes(d.year || "unknown");
      const matchName = filters.name === "" || (d.name && d.name.toLowerCase().includes(filters.name.toLowerCase()));
      return matchType && matchSubtype && matchYear && matchName;
    });
  }, [filters, rawData]);

  return (
    <div className="container" style={{ padding: "1rem" }}>
      <button
        onClick={() => setShowControls((prev) => !prev)}
        className="explore-button"
      >
        {showControls ? "Hide Controls" : "Show Controls"}
      </button>

      {showControls && (
        <div className="filter-bar" ref={filterRef}>
          <input
            type="text"
            placeholder="Search by name..."
            value={filters.name}
            onChange={handleNameChange}
            style={{ padding: "0.5rem", marginRight: "1rem" }}
          />

          {["type", "subtype", "year"].map((key) => (
            <div key={key} style={{ display: "inline-block", marginRight: "1rem" }}>
              <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.25rem" }}>
                {uniqueValues[key].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleMultiSelect(key, value)}
                    className={`explore-button ${filters[key].includes(value) ? "selected" : ""}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <BubbleChart data={filteredData} />
    </div>
  );
};

export default Groups;
