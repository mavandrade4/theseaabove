import React, { useState, useRef, useEffect } from "react";
import TimelineVis from "./TimelineVis";

const TimelineWithIntro = () => {
  const [videoEnded, setVideoEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef(null);

  const handleLoadedData = () => {
    setIsLoading(false);
  };

  const skipIntro = () => {
    setVideoEnded(true);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

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
            backgroundColor: "--var(--bg-dark)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            zIndex: 1000,
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          {isLoading && (
            <div
              style={{
                color: "--var(--text-light)",
                marginBottom: 10,
                fontSize: "1.2rem",
                fontWeight: "bold",
              }}
            >
              Loading video...
            </div>
          )}
          
          <div style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            overflow: "hidden"
          }}>
            <video
              ref={videoRef}
              src={`${process.env.PUBLIC_URL}/video.mp4`}
              autoPlay
              controls={false}
              muted={isMuted}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                backgroundColor: "--var(--bg-dark)",
              }}
              onEnded={() => setVideoEnded(true)}
              onLoadedData={handleLoadedData}
            />
          </div>

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "1rem",
              position: "absolute",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1001,
            }}
          >
            <button
              onClick={skipIntro}
              className="buttons"
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
              className="buttons"
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