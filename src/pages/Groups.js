import React from "react";
import BubbleChart2 from "../components/BubbleChart2";
import Data from "../components/Data";

const Groups = () => {

  return (
    <div>
        <BubbleChart2 data={Data()} />
    </div>
  );
};

export default Groups;
