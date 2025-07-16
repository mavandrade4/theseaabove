import React, { createContext, useState } from "react";

export const AnimationContext = createContext();

export default function AnimationContextProvider({ children }) {
  const [animationDone, setAnimationDone] = useState(false);

  return (
    <AnimationContext.Provider value={{ animationDone, setAnimationDone }}>
      {children}
    </AnimationContext.Provider>
  );
}
