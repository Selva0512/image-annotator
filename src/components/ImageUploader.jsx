import { useState, useRef } from "react";

const SAMPLE_IMAGES = [
  { label: "Street", url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=900&q=80" },
  { label: "Office", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80" },
  { label: "Nature", url: "https://images.unsplash.com/photo-1446329813274-7c9036bd9a1f?w=900&q=80" },
];

export default function ImageUploader({ onImageLoad }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const loadFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => onImageLoad(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    loadFile(file);
  };

  return (
    <div className="uploader-wrap">
      <div
        className={`uploader ${dragging ? "dragging" : ""}`}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => loadFile(e.target.files[0])}
        />
        <div className="uploader-icon">◈</div>
        <h2 className="uploader-title">Drop image here</h2>
        <p className="uploader-sub">or click to browse — PNG, JPG, WebP</p>
      </div>

      <div className="sample-section">
        <span className="sample-label">or try a sample</span>
        <div className="sample-images">
          {SAMPLE_IMAGES.map((s) => (
            <button
              key={s.label}
              className="sample-btn"
              onClick={() => onImageLoad(s.url)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
