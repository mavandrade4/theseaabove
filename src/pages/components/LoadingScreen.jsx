import React from 'react';
import "../../App.css";

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <img 
        src={process.env.PUBLIC_URL + "/anim8-fade.gif"} 
        alt="Loading..." 
        className="loading-image"
      />
    </div>
  );
};

export default LoadingScreen;