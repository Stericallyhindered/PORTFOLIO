"use client";

import { useState, useRef, useEffect } from "react";

interface DraggableRectProps {
  id: string;
  label: string;
  initialPosition: { left: number; top: number; width: number; height: number };
  color: string;
  onPositionChange: (id: string, position: { left: number; top: number; width: number; height: number }) => void;
  isVisible: boolean;
  onClick?: () => void;
  isActive?: boolean;
}

export default function DraggableRect({
  id,
  label,
  initialPosition,
  color,
  onPositionChange,
  isVisible,
  onClick,
  isActive = false,
}: DraggableRectProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const rectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  const handleMouseDown = (e: React.MouseEvent, action: "drag" | "resize") => {
    e.preventDefault();
    e.stopPropagation();
    
    if (action === "drag") {
      setIsDragging(true);
    } else {
      setIsResizing(true);
    }
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;

      const container = document.querySelector(".configurator-container");
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStart.x) / containerRect.width) * 100;
      const deltaY = ((e.clientY - dragStart.y) / containerRect.height) * 100;

      if (isDragging) {
        setPosition((prev) => ({
          ...prev,
          left: Math.max(0, Math.min(100 - prev.width, prev.left + deltaX)),
          top: Math.max(0, Math.min(100 - prev.height, prev.top + deltaY)),
        }));
      } else if (isResizing) {
        setPosition((prev) => ({
          ...prev,
          width: Math.max(5, prev.width + deltaX),
          height: Math.max(5, prev.height + deltaY),
        }));
      }

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        onPositionChange(id, position);
      }
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, position, id, onPositionChange]);

  if (!isVisible) {
    return (
      <div
        ref={rectRef}
        className="draggable-rect hidden-zone"
        style={{
          left: `${position.left}%`,
          top: `${position.top}%`,
          width: `${position.width}%`,
          height: `${position.height}%`,
        }}
        onClick={onClick}
      />
    );
  }

  return (
    <div
      ref={rectRef}
      className={`draggable-rect ${isActive ? "active" : ""}`}
      style={{
        left: `${position.left}%`,
        top: `${position.top}%`,
        width: `${position.width}%`,
        height: `${position.height}%`,
        borderColor: color,
        backgroundColor: `${color}22`,
      }}
      onMouseDown={(e) => handleMouseDown(e, "drag")}
      onClick={onClick}
    >
      <div className="rect-label" style={{ backgroundColor: color }}>
        {label}
      </div>
      <div className="rect-coords">
        L:{position.left.toFixed(1)}% T:{position.top.toFixed(1)}%
        <br />
        W:{position.width.toFixed(1)}% H:{position.height.toFixed(1)}%
      </div>
      <div
        className="resize-handle"
        style={{ backgroundColor: color }}
        onMouseDown={(e) => handleMouseDown(e, "resize")}
      />
    </div>
  );
}
