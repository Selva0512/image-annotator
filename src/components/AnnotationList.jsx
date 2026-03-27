const TYPE_ICONS = {
  rect: "▭",
  ellipse: "◯",
  arrow: "→",
  polygon: "⬡",
};

export default function AnnotationList({ annotations, selectedId, setSelectedId, onDelete, onLabelEdit }) {
  if (!annotations.length) return null;

  return (
    <div className="annotation-list">
      <span className="sidebar-heading">ANNOTATIONS</span>
      <div className="list-items">
        {annotations.map((ann, i) => (
          <div
            key={ann.id}
            className={`list-item ${selectedId === ann.id ? "active" : ""}`}
            onClick={() => setSelectedId(ann.id)}
          >
            <span className="list-icon" style={{ color: ann.color }}>
              {TYPE_ICONS[ann.type] || "◈"}
            </span>
            <div className="list-info">
              <span className="list-type">{ann.type.toUpperCase()}</span>
              <span className="list-label">{ann.label || <em>unlabeled</em>}</span>
            </div>
            <div className="list-actions">
              <button
                className="list-btn"
                onClick={(e) => { e.stopPropagation(); onLabelEdit(ann.id); }}
                title="Edit label"
              >
                ✎
              </button>
              <button
                className="list-btn danger"
                onClick={(e) => { e.stopPropagation(); onDelete(ann.id); }}
                title="Delete"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
