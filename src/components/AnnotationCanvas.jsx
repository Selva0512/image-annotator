import { useState, useRef, useEffect, useCallback } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Circle,
  Arrow,
  Text,
  Transformer,
  Group,
  Line,
} from "react-konva";
import useImage from "../hooks/useImage";

// ─── Single annotation shape + label wrapped in a draggable Group ──────────
function AnnotationShape({ annotation, isSelected, onSelect, onChange }) {
  const groupRef = useRef();
  const trRef    = useRef();

  // Attach transformer to group when selected
  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const strokeColor = annotation.color || "#FF3B5C";
  const fillColor   = strokeColor + "22";

  // ── Compute label position inside the group coordinate space ──────────
  const getLabelPos = () => {
    if (annotation.type === "polygon") {
      const pts = annotation.points || [];
      if (pts.length < 2) return { x: annotation.x, y: annotation.y - 18 };
      let sumX = 0, sumY = 0, count = 0;
      for (let i = 0; i < pts.length; i += 2) { sumX += pts[i]; sumY += pts[i + 1]; count++; }
      return { x: sumX / count, y: sumY / count - 18 };
    }
    if (annotation.type === "arrow") {
      return { x: annotation.x, y: annotation.y - 18 };
    }
    // rect / ellipse: top-left corner
    return { x: annotation.x, y: annotation.y - 18 };
  };

  const labelPos = getLabelPos();

  // ── Drag end: update all stored coords by the delta ──────────────────
  const handleDragEnd = (e) => {
    const node = groupRef.current;
    const dx = node.x();
    const dy = node.y();
    // Reset group to origin so next drag starts clean
    node.position({ x: 0, y: 0 });

    if (annotation.type === "arrow") {
      onChange(annotation.id, {
        x:  annotation.x  + dx,
        y:  annotation.y  + dy,
        x2: annotation.x2 + dx,
        y2: annotation.y2 + dy,
      });
    } else if (annotation.type === "polygon") {
      const newPts = [];
      for (let i = 0; i < annotation.points.length; i += 2) {
        newPts.push(annotation.points[i] + dx, annotation.points[i + 1] + dy);
      }
      onChange(annotation.id, {
        x: annotation.x + dx,
        y: annotation.y + dy,
        points: newPts,
      });
    } else {
      onChange(annotation.id, {
        x: annotation.x + dx,
        y: annotation.y + dy,
      });
    }
  };

  // ── Transform end (resize handles) ───────────────────────────────────
  const handleTransformEnd = () => {
    const node = groupRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const dx = node.x();
    const dy = node.y();
    node.scaleX(1);
    node.scaleY(1);
    node.position({ x: 0, y: 0 });
    onChange(annotation.id, {
      x:      annotation.x + dx,
      y:      annotation.y + dy,
      width:  Math.max(5, (annotation.width  || 0) * scaleX),
      height: Math.max(5, (annotation.height || 0) * scaleY),
    });
  };

  const selectProps = {
    onClick: (e) => { e.cancelBubble = true; onSelect(annotation.id); },
    onTap:   (e) => { e.cancelBubble = true; onSelect(annotation.id); },
  };

  return (
    <>
      <Group
        ref={groupRef}
        draggable
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        {...selectProps}
      >
        {/* ── Rect ── */}
        {annotation.type === "rect" && (
          <Rect
            x={annotation.x}
            y={annotation.y}
            width={annotation.width}
            height={annotation.height}
            stroke={strokeColor}
            strokeWidth={isSelected ? 2.5 : 2}
            fill={fillColor}
            cornerRadius={3}
            {...selectProps}
          />
        )}

        {/* ── Ellipse ── */}
        {annotation.type === "ellipse" && (
          <Circle
            x={annotation.x + (annotation.width  || 0) / 2}
            y={annotation.y + (annotation.height || 0) / 2}
            radiusX={(annotation.width  || 60) / 2}
            radiusY={(annotation.height || 40) / 2}
            stroke={strokeColor}
            strokeWidth={isSelected ? 2.5 : 2}
            fill={fillColor}
            {...selectProps}
          />
        )}

        {/* ── Arrow ── */}
        {annotation.type === "arrow" && (
          <Arrow
            points={[annotation.x, annotation.y, annotation.x2, annotation.y2]}
            stroke={strokeColor}
            strokeWidth={isSelected ? 3 : 2}
            fill={strokeColor}
            pointerLength={10}
            pointerWidth={8}
            {...selectProps}
          />
        )}

        {/* ── Polygon ── */}
        {annotation.type === "polygon" &&
          annotation.points &&
          annotation.points.length >= 4 && (
            <Line
              points={annotation.points}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2.5 : 2}
              fill={fillColor}
              closed={annotation.closed}
              {...selectProps}
            />
          )}

        {/* ── Label — lives inside group, moves for free ── */}
        {annotation.label && (
          <Text
            x={labelPos.x}
            y={labelPos.y}
            text={annotation.label}
            fontSize={12}
            fontFamily="'DM Mono', monospace"
            fill={strokeColor}
            padding={4}
            {...selectProps}
          />
        )}
      </Group>

      {/* Transformer stays outside the group so it can attach to it */}
      {isSelected &&
        annotation.type !== "arrow" &&
        annotation.type !== "polygon" && (
          <Transformer
            ref={trRef}
            rotateEnabled={false}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 10 || newBox.height < 10) return oldBox;
              return newBox;
            }}
          />
        )}
    </>
  );
}

// ─── Main canvas ───────────────────────────────────────────────────────────
export default function AnnotationCanvas({
  imageSrc,
  tool,
  color,
  label,
  annotations,
  selectedId,
  setSelectedId,
  onAddAnnotation,
  onUpdateAnnotation,
  editingLabel,
  setEditingLabel,
  onLabelSave,
}) {
  const containerRef = useRef();
  const stageRef     = useRef();
  const [stageSize, setStageSize]         = useState({ width: 800, height: 600 });
  const [drawing, setDrawing]             = useState(false);
  const [currentShape, setCurrentShape]   = useState(null);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [img]                             = useImage(imageSrc);
  const [imageScale, setImageScale]       = useState({ x: 1, y: 1 });
  const [imageOffset, setImageOffset]     = useState({ x: 0, y: 0 });

  // Responsive stage size
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setStageSize({
          width:  containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Fit image inside stage
  useEffect(() => {
    if (img && stageSize.width && stageSize.height) {
      const scale = Math.min(stageSize.width / img.width, stageSize.height / img.height, 1);
      setImageScale({ x: scale, y: scale });
      setImageOffset({
        x: (stageSize.width  - img.width  * scale) / 2,
        y: (stageSize.height - img.height * scale) / 2,
      });
    }
  }, [img, stageSize]);

  // Convert stage pointer position → image coordinate space
  const getRelativePos = useCallback((stage) => {
    const pos = stage.getPointerPosition();
    return {
      x: (pos.x - imageOffset.x) / imageScale.x,
      y: (pos.y - imageOffset.y) / imageScale.y,
    };
  }, [imageOffset, imageScale]);

  // ── Mouse down: only act on empty canvas clicks ──────────────────────
  const handleMouseDown = useCallback((e) => {
    const clickedEmpty =
      e.target === e.target.getStage() ||
      e.target.getClassName() === "Image";

    // Always deselect when clicking empty space
    if (clickedEmpty) setSelectedId(null);

    if (!clickedEmpty) return; // click on a shape — let the Group handle selection

    const stage = stageRef.current;
    const pos   = getRelativePos(stage);

    if (tool === "polygon") {
      setPolygonPoints((prev) => [...prev, pos.x, pos.y]);
      return;
    }

    if (tool === "rect" || tool === "ellipse" || tool === "arrow") {
      setDrawing(true);
      setCurrentShape({
        id: `ann_${Date.now()}`,
        type: tool,
        x: pos.x, y: pos.y,
        x2: pos.x, y2: pos.y,
        width: 0, height: 0,
        color, label,
      });
    }
  }, [tool, color, label, getRelativePos, setSelectedId]);

  const handleMouseMove = useCallback((e) => {
    if (!drawing || !currentShape) return;
    const pos = getRelativePos(stageRef.current);
    setCurrentShape((prev) => ({
      ...prev,
      x2: pos.x, y2: pos.y,
      width:  pos.x - prev.x,
      height: pos.y - prev.y,
    }));
  }, [drawing, currentShape, getRelativePos]);

  const handleMouseUp = useCallback(() => {
    if (!drawing || !currentShape) return;
    setDrawing(false);
    const { width, height } = currentShape;
    if (Math.abs(width) < 5 && Math.abs(height) < 5 && currentShape.type !== "arrow") return;

    let finalShape = { ...currentShape };
    if (currentShape.type === "rect" || currentShape.type === "ellipse") {
      finalShape = {
        ...finalShape,
        x: width  < 0 ? currentShape.x + width  : currentShape.x,
        y: height < 0 ? currentShape.y + height : currentShape.y,
        width:  Math.abs(width),
        height: Math.abs(height),
      };
    }
    onAddAnnotation(finalShape);
    setCurrentShape(null);
  }, [drawing, currentShape, onAddAnnotation]);

  const handleDblClick = useCallback(() => {
    if (tool !== "polygon") return;
    if (polygonPoints.length >= 4) {
      onAddAnnotation({
        id:     `ann_${Date.now()}`,
        type:   "polygon",
        points: polygonPoints,
        x:      polygonPoints[0],
        y:      polygonPoints[1],
        color, label,
        closed: true,
      });
    }
    setPolygonPoints([]);
  }, [tool, polygonPoints, color, label, onAddAnnotation]);

  const stageTransform = {
    x:      imageOffset.x,
    y:      imageOffset.y,
    scaleX: imageScale.x,
    scaleY: imageScale.y,
  };

  const cursor = (tool === "rect" || tool === "ellipse" || tool === "arrow" || tool === "polygon")
    ? "crosshair"
    : "default";

  return (
    <div ref={containerRef} className="canvas-container">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDblClick={handleDblClick}
        style={{ cursor }}
      >
        <Layer {...stageTransform}>
          {img && (
            <KonvaImage image={img} width={img.width} height={img.height} />
          )}

          {annotations.map((ann) => (
            <AnnotationShape
              key={ann.id}
              annotation={ann}
              isSelected={selectedId === ann.id}
              onSelect={setSelectedId}
              onChange={onUpdateAnnotation}
            />
          ))}

          {/* Live drawing preview */}
          {drawing && currentShape && (
            <>
              {currentShape.type === "rect" && (
                <Rect
                  x={currentShape.width  < 0 ? currentShape.x + currentShape.width  : currentShape.x}
                  y={currentShape.height < 0 ? currentShape.y + currentShape.height : currentShape.y}
                  width={Math.abs(currentShape.width)}
                  height={Math.abs(currentShape.height)}
                  stroke={currentShape.color}
                  strokeWidth={2}
                  fill={currentShape.color + "22"}
                  dash={[6, 3]}
                  cornerRadius={3}
                />
              )}
              {currentShape.type === "ellipse" && (
                <Circle
                  x={currentShape.x + currentShape.width  / 2}
                  y={currentShape.y + currentShape.height / 2}
                  radiusX={Math.abs(currentShape.width)  / 2}
                  radiusY={Math.abs(currentShape.height) / 2}
                  stroke={currentShape.color}
                  strokeWidth={2}
                  fill={currentShape.color + "22"}
                  dash={[6, 3]}
                />
              )}
              {currentShape.type === "arrow" && (
                <Arrow
                  points={[currentShape.x, currentShape.y, currentShape.x2, currentShape.y2]}
                  stroke={currentShape.color}
                  strokeWidth={2}
                  fill={currentShape.color}
                  pointerLength={10}
                  pointerWidth={8}
                />
              )}
            </>
          )}

          {/* Polygon points in progress */}
          {tool === "polygon" && polygonPoints.length >= 2 && (
            <Line points={polygonPoints} stroke={color} strokeWidth={2} dash={[6, 3]} />
          )}
          {polygonPoints.map((_, i) => {
            if (i % 2 !== 0) return null;
            return (
              <Circle
                key={i}
                x={polygonPoints[i]}
                y={polygonPoints[i + 1]}
                radius={4}
                fill={color}
              />
            );
          })}
        </Layer>
      </Stage>

      {/* Label editing overlay */}
      {editingLabel && (() => {
        const ann = annotations.find((a) => a.id === editingLabel);
        if (!ann) return null;
        return (
          <div
            className="label-editor"
            style={{
              left: imageOffset.x + ann.x * imageScale.x,
              top:  imageOffset.y + ann.y * imageScale.y - 50,
            }}
          >
            <input
              autoFocus
              defaultValue={ann.label || ""}
              onKeyDown={(e) => {
                if (e.key === "Enter")  onLabelSave(editingLabel, e.target.value);
                if (e.key === "Escape") setEditingLabel(null);
              }}
              onBlur={(e) => onLabelSave(editingLabel, e.target.value)}
              placeholder="Enter label..."
            />
          </div>
        );
      })()}
    </div>
  );
}
