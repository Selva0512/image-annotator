import { useState, useRef, useCallback, useEffect } from "react";
import AnnotationCanvas from "./components/AnnotationCanvas";
import Toolbar from "./components/Toolbar";
import AnnotationList from "./components/AnnotationList";
import ImageUploader from "./components/ImageUploader";
import "./App.css";

export default function App() {
  const [image, setImage] = useState(null);
  const [tool, setTool] = useState("rect"); // default to rect; no separate select tool
  const [annotations, setAnnotations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [color, setColor] = useState("#FF3B5C");
  const [label, setLabel] = useState("");
  const [editingLabel, setEditingLabel] = useState(null);

  const handleImageLoad = useCallback((src) => {
    setImage(src);
    setAnnotations([]);
    setSelectedId(null);
  }, []);

  const handleAddAnnotation = useCallback((annotation) => {
    setAnnotations((prev) => [...prev, annotation]);
    setSelectedId(annotation.id);
  }, []);

  const handleUpdateAnnotation = useCallback((id, updates) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  }, []);

  const handleDeleteAnnotation = useCallback((id) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedId) handleDeleteAnnotation(selectedId);
  }, [selectedId, handleDeleteAnnotation]);

  const handleLabelSave = useCallback(
    (id, newLabel) => {
      handleUpdateAnnotation(id, { label: newLabel });
      setEditingLabel(null);
    },
    [handleUpdateAnnotation]
  );

  const handleExport = useCallback(() => {
    const data = JSON.stringify({ annotations }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "annotations.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [annotations]);

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && !editingLabel) {
        if (selectedId) handleDeleteSelected();
      }
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedId, editingLabel, handleDeleteSelected]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">ANNOTATE</span>
          <span className="logo-sub">STUDIO</span>
        </div>
        <div className="header-actions">
          {image && (
            <>
              <span className="annotation-count">{annotations.length} annotation{annotations.length !== 1 ? "s" : ""}</span>
              <button className="btn-secondary" onClick={() => { setImage(null); setAnnotations([]); }}>
                New Image
              </button>
              {annotations.length > 0 && (
                <button className="btn-export" onClick={handleExport}>
                  Export JSON
                </button>
              )}
            </>
          )}
        </div>
      </header>

      <div className="app-body">
        {image && (
          <aside className="sidebar-left">
            <Toolbar
              tool={tool}
              setTool={setTool}
              color={color}
              setColor={setColor}
              label={label}
              setLabel={setLabel}
            />
          </aside>
        )}

        <main className="canvas-area">
          {!image ? (
            <ImageUploader onImageLoad={handleImageLoad} />
          ) : (
            <AnnotationCanvas
              imageSrc={image}
              tool={tool}
              color={color}
              label={label}
              annotations={annotations}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              onAddAnnotation={handleAddAnnotation}
              onUpdateAnnotation={handleUpdateAnnotation}
              editingLabel={editingLabel}
              setEditingLabel={setEditingLabel}
              onLabelSave={handleLabelSave}
            />
          )}
        </main>

        {image && annotations.length > 0 && (
          <aside className="sidebar-right">
            <AnnotationList
              annotations={annotations}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              onDelete={handleDeleteAnnotation}
              onLabelEdit={setEditingLabel}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
