import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const EXPORT_WIDTH = 900;

const InkCanvas = forwardRef(function InkCanvas({ drawingEnabled, sinking, onInkChange }, ref) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const hasInkRef = useRef(false);

  useImperativeHandle(ref, () => ({
    clear() {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      hasInkRef.current = false;
      onInkChange?.(false);
    },
    hasInk() {
      return hasInkRef.current;
    },
    exportImage() {
      const canvas = canvasRef.current;
      if (!canvas || !hasInkRef.current) {
        return null;
      }

      const width = EXPORT_WIDTH;
      const height = Math.max(1, Math.round((canvas.height / canvas.width) * width));
      const output = document.createElement('canvas');
      output.width = width;
      output.height = height;

      const context = output.getContext('2d');
      const parchment = context.createLinearGradient(0, 0, width, height);
      parchment.addColorStop(0, '#ead399');
      parchment.addColorStop(0.55, '#f4dfaa');
      parchment.addColorStop(1, '#c89c62');
      context.fillStyle = parchment;
      context.fillRect(0, 0, width, height);
      context.drawImage(canvas, 0, 0, width, height);

      const dataUrl = output.toDataURL('image/png');
      return {
        dataUrl,
        mimeType: 'image/png',
        data: dataUrl.split(',')[1]
      };
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const snapshot = document.createElement('canvas');
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      snapshot.getContext('2d').drawImage(canvas, 0, 0);

      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));

      const context = canvas.getContext('2d');
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.drawImage(snapshot, 0, 0, snapshot.width / ratio, snapshot.height / ratio);
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      pressure: event.pressure || 0.5
    };
  };

  const drawTo = (point) => {
    const canvas = canvasRef.current;
    const previous = lastPointRef.current;
    if (!canvas || !previous) {
      return;
    }

    const context = canvas.getContext('2d');
    context.strokeStyle = 'rgba(24, 7, 4, 0.86)';
    context.shadowColor = 'rgba(38, 0, 0, 0.26)';
    context.shadowBlur = 4;
    context.lineWidth = 2.4 + point.pressure * 3.2;
    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.quadraticCurveTo(previous.x, previous.y, point.x, point.y);
    context.stroke();
    markInk();
    lastPointRef.current = point;
  };

  const drawDot = (point) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(24, 7, 4, 0.86)';
    context.shadowColor = 'rgba(38, 0, 0, 0.26)';
    context.shadowBlur = 4;
    context.beginPath();
    context.arc(point.x, point.y, 2.6 + point.pressure * 2.4, 0, Math.PI * 2);
    context.fill();
    markInk();
  };

  const markInk = () => {
    if (!hasInkRef.current) {
      hasInkRef.current = true;
      onInkChange?.(true);
    }
  };

  const handlePointerDown = (event) => {
    if (!drawingEnabled) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPoint(event);
    drawDot(lastPointRef.current);
  };

  const handlePointerMove = (event) => {
    if (!drawingEnabled || !drawingRef.current) {
      return;
    }
    event.preventDefault();
    drawTo(getPoint(event));
  };

  const endStroke = (event) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      className={`ink-canvas ${drawingEnabled ? 'is-drawing' : ''} ${sinking ? 'is-sinking' : ''}`}
      aria-label="Magical ink drawing layer"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endStroke}
      onPointerCancel={endStroke}
      onPointerLeave={endStroke}
    />
  );
});

export default InkCanvas;
