const TOOLS = [
  { id: "rect",    label: "Rect",    icon: "▭", hint: "Draw rectangle" },
  { id: "ellipse", label: "Ellipse", icon: "◯", hint: "Draw ellipse" },
  { id: "arrow",   label: "Arrow",   icon: "→", hint: "Draw arrow" },
  { id: "polygon", label: "Polygon", icon: "⬡", hint: "Draw polygon (dbl-click to close)" },
];

const COLORS = [
  "#FF3B5C", "#FF9F0A", "#30D158", "#0A84FF", "#BF5AF2",
  "#FF6B6B", "#FFE66D", "#4ECDC4", "#45B7D1", "#F7DC6F",
];

export default function Toolbar({ tool, setTool, color, setColor, label, setLabel }) {
  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <span className="toolbar-label">TOOLS</span>
        <div className="tool-buttons">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              className={`tool-btn ${tool === t.id ? "active" : ""}`}
              onClick={() => setTool(t.id)}
              title={t.hint}
            >
              <span className="tool-icon">{t.icon}</span>
              <span className="tool-name">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <span className="toolbar-label">COLOR</span>
        <div className="color-grid">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`color-swatch ${color === c ? "active" : ""}`}
              style={{ "--swatch-color": c }}
              onClick={() => setColor(c)}
              title={c}
            />
          ))}
        </div>
        <div className="color-custom">
          <label className="toolbar-label">CUSTOM</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="color-picker"
          />
          <span className="color-value">{color.toUpperCase()}</span>
        </div>
      </div>

      <div className="toolbar-section">
        <span className="toolbar-label">LABEL</span>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Add label..."
          className="label-input"
        />
      </div>

      <div className="toolbar-section tips">
        <span className="toolbar-label">SHORTCUTS</span>
        <div className="tip-list">
          <span>Click shape — select &amp; drag</span>
          <span>Del — delete selected</span>
          <span>Esc — deselect</span>
          <span>Dbl-click — close polygon</span>
        </div>
      </div>
    </div>
  );
}
