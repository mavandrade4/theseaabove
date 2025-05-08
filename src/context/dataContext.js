import React, { createContext } from "react";
export const dataContext = createContext();

const DataContextProvider = ({ data, children }) => {
  //console.log("DataContextProvider", data);
  return <dataContext.Provider value={data}>{children}</dataContext.Provider>;
};


export default DataContextProvider;
