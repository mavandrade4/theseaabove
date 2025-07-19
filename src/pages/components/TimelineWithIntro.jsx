import React, { useState, useRef, useEffect } from "react";
import TimelineVis from "./TimelineVis";

const TimelineWithIntro = () => {
  const [videoEnded, setVideoEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef(null);

  // When video metadata is loaded, stop loading spinner
  const handleLoadedData = () => {
    setIsLoading(false);
  };

  // Skip intro handler
  const skipIntro = () => {
    setVideoEnded(true);
    // Pause video if still playing
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Toggle mute/unmute
  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  return (
    <>
      {!videoEnded && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "black",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            zIndex: 1000,
          }}
        >
          {isLoading && (
            <div
              style={{
                color: "white",
                marginBottom: 10,
                fontSize: "1.2rem",
                fontWeight: "bold",
              }}
            >
              Loading video...
            </div>
          )}
          <video
            ref={videoRef}
            src={`${process.env.PUBLIC_URL}/video.mp4`}
            
            autoPlay
            controls={false}
            muted={isMuted}
            style={{
              maxWidth: "100vw",
              maxHeight: "100vh",
              objectFit: "contain",
              backgroundColor: "black",
            }}
            onEnded={() => setVideoEnded(true)}
            onLoadedData={handleLoadedData}
          />

          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: "1rem",
            }}
          >
            <button
              onClick={skipIntro}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              Skip Intro
            </button>

            <button
              onClick={toggleMute}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>
          </div>
        </div>
      )}

      {videoEnded && <TimelineVis />}
    </>
  );
};

export default TimelineWithIntro;
