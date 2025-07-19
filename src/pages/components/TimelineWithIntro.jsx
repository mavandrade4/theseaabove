import React, { useState, useRef, useEffect } from "react";
import TimelineVis from "./TimelineVis";

const TimelineWithIntro = () => {
  const [videoEnded, setVideoEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
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

  // Toggle play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  // Sync volume with mute state
  useEffect(() => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = 0;
      } else {
        videoRef.current.volume = volume;
      }
    }
  }, [isMuted, volume]);

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
            <img src="anim8-fade.gif"></img>
            </div>
          )}
          <video
            ref={videoRef}
            src={`${process.env.PUBLIC_URL}/video.mp4`}
            type="video/mp4"
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
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
          />

          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            <button
              onClick={togglePlayPause}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              {isPlaying ? "Pause" : "Play"}
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

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              style={{
                width: "100px",
                cursor: "pointer",
              }}
            />

            <button
              onClick={skipIntro}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "1rem",
                cursor: "pointer",
                marginLeft: "auto",
              }}
            >
              Skip Intro
            </button>
          </div>
        </div>
      )}

      {videoEnded && <TimelineVis />}
    </>
  );
};

export default TimelineWithIntro;