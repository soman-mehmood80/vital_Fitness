import React from "react";

export default function BackgroundVideo() {
    return (
        <div style={{
            position: "fixed",
            inset: 0,
            zIndex: -1,
            overflow: "hidden",
            background: "var(--bg-main)"
        }}>
            <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.25,
                    filter: "grayscale(30%) contrast(110%)"
                }}
            >
                <source src="/gym-bg.mp4" type="video/mp4" />
            </video>
            <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(135deg, rgba(10,10,10,0.92) 0%, rgba(127,29,29,0.55) 100%)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)"
            }} />
        </div>
    );
}