import React from "react";
import "./ExploreView.css"; // Make sure to create and include this CSS file

const ExploreView = ({ onGroupChange, selectedGroup }) => {
  const groupOptions = ["year", "country", "type", "subtype"];

  return (
    <div className="explore-container">
      <div className="button-group">
        {groupOptions.map((group) => (
          <button
            key={group}
            onClick={() => onGroupChange(group)}
            className={`explore-button ${selectedGroup === group ? "selected" : ""}`}
          >
            {group.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="legend">
        {/* Add legends dynamically if needed */}
        {selectedGroup && <p>Grouping by: <strong>{selectedGroup}</strong></p>}
      </div>
    </div>
  );
};

export default ExploreView;
