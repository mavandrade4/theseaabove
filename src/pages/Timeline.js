import React from "react";
import TimelineVis from "../components/TimelineVis";
import Data from "../components/Data";

const Timeline = () => {

  return (
    <div>
      <TimelineVis data={Data()}/>
    </div>
  );
};

export default Timeline;
