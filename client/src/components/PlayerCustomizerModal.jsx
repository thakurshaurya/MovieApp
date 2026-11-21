import { useState, useId } from "react";
import { X, Sliders, RotateCcw, Copy, Check, ExternalLink, Sparkles } from "lucide-react";
import {
  COLOR_PRESETS,
  DEFAULT_VIDORA_SETTINGS,
  buildVidoraUrl,
  sanitizeHex
} from "../utils/vidora";

export default function PlayerCustomizerModal({
  isOpen,
  onClose,
  currentSettings,
  onSave,
  type,
  id,
  season,
  episode
}) {
  const [settings, setSettings] = useState({ ...currentSettings });
  const [copied, setCopied] = useState(false);
  const colorId = useId();

  if (!isOpen) return null;

  const previewUrl = buildVidoraUrl({
    type,
    id,
    season,
    episode,
    customSettings: settings
  });

  function handleColorChange(field, hex) {
    setSettings((prev) => ({
      ...prev,
      [field]: sanitizeHex(hex)
    }));
  }

  function handleToggle(field) {
    setSettings((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  }

  function applyPreset(preset) {
    setSettings((prev) => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      iconColor: preset.icon
    }));
  }

  function resetDefaults() {
    setSettings({ ...DEFAULT_VIDORA_SETTINGS });
  }

  function handleCopy() {
    navigator.clipboard?.writeText(previewUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleSave() {
    onSave(settings);
    onClose();
  }

  return (
    <div className="customizer-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="customizer-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="customizer-modal-header">
          <div className="customizer-header-title">
            <Sliders size={20} className="text-gold" />
            <div>
              <h3>Vidora Player Customizer</h3>
              <p className="customizer-subtitle">
                Configure embeds via the{" "}
                <a
                  href="https://vidora.ac/#customize"
                  target="_blank"
                  rel="noreferrer"
                  className="text-gold underline"
                >
                  Vidora API
                </a>
              </p>
            </div>
          </div>
          <button className="customizer-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="customizer-modal-body">
          {/* Presets */}
          <section className="customizer-section">
            <label className="customizer-section-label">
              <Sparkles size={14} /> Color Themes
            </label>
            <div className="customizer-presets-grid">
              {COLOR_PRESETS.map((p) => {
                const isActive =
                  sanitizeHex(settings.primaryColor).toLowerCase() === p.primary.toLowerCase();
                return (
                  <button
                    key={p.name}
                    type="button"
                    className={`customizer-preset-btn ${isActive ? "active" : ""}`}
                    onClick={() => applyPreset(p)}
                  >
                    <span
                      className="preset-swatch"
                      style={{ backgroundColor: `#${p.primary}` }}
                    />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Color pickers */}
          <section className="customizer-section">
            <label className="customizer-section-label">Custom Hex Codes</label>
            <div className="customizer-color-row">
              <div className="customizer-input-field">
                <span className="field-hint">Primary Color (Sliders & Progress)</span>
                <div className="color-input-wrapper">
                  <input
                    id={`${colorId}-primary`}
                    type="color"
                    value={`#${sanitizeHex(settings.primaryColor) || "00e5ff"}`}
                    onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                  />
                  <span className="hash-prefix">#</span>
                  <input
                    type="text"
                    maxLength={6}
                    value={sanitizeHex(settings.primaryColor)}
                    onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                    placeholder="00e5ff"
                  />
                </div>
              </div>

              <div className="customizer-input-field">
                <span className="field-hint">Secondary Color (Track Backing)</span>
                <div className="color-input-wrapper">
                  <input
                    id={`${colorId}-secondary`}
                    type="color"
                    value={`#${sanitizeHex(settings.secondaryColor) || "101116"}`}
                    onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                  />
                  <span className="hash-prefix">#</span>
                  <input
                    type="text"
                    maxLength={6}
                    value={sanitizeHex(settings.secondaryColor)}
                    onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                    placeholder="101116"
                  />
                </div>
              </div>

              <div className="customizer-input-field">
                <span className="field-hint">Icon Color</span>
                <div className="color-input-wrapper">
                  <input
                    id={`${colorId}-icon`}
                    type="color"
                    value={`#${sanitizeHex(settings.iconColor) || "f4f4f6"}`}
                    onChange={(e) => handleColorChange("iconColor", e.target.value)}
                  />
                  <span className="hash-prefix">#</span>
                  <input
                    type="text"
                    maxLength={6}
                    value={sanitizeHex(settings.iconColor)}
                    onChange={(e) => handleColorChange("iconColor", e.target.value)}
                    placeholder="f4f4f6"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Feature toggles */}
          <section className="customizer-section">
            <label className="customizer-section-label">Player Options</label>
            <div className="customizer-toggles-grid">
              <label className="customizer-toggle-item">
                <input
                  type="checkbox"
                  checked={Boolean(settings.title)}
                  onChange={() => handleToggle("title")}
                />
                <div>
                  <strong>Show Media Title</strong>
                  <p>Display the title overlay at the top of the video player</p>
                </div>
              </label>

              <label className="customizer-toggle-item">
                <input
                  type="checkbox"
                  checked={Boolean(settings.poster)}
                  onChange={() => handleToggle("poster")}
                />
                <div>
                  <strong>Show Poster Image</strong>
                  <p>Render high-resolution backdrop before playback begins</p>
                </div>
              </label>

              <label className="customizer-toggle-item">
                <input
                  type="checkbox"
                  checked={Boolean(settings.autoplay)}
                  onChange={() => handleToggle("autoplay")}
                />
                <div>
                  <strong>Autoplay Video</strong>
                  <p>Begin streaming immediately upon page load</p>
                </div>
              </label>

              <label className="customizer-toggle-item">
                <input
                  type="checkbox"
                  checked={Boolean(settings.nextbutton)}
                  onChange={() => handleToggle("nextbutton")}
                />
                <div>
                  <strong>Next Episode Button</strong>
                  <p>Shows next episode button automatically once 90% is watched</p>
                </div>
              </label>
            </div>
          </section>

          {/* Subtitles & Fallback */}
          <section className="customizer-section">
            <label className="customizer-section-label">External Subtitle & Fallback</label>
            <div className="customizer-fields-grid">
              <div className="customizer-input-field">
                <span className="field-hint">External Subtitle Track (.vtt URL)</span>
                <input
                  type="url"
                  placeholder="https://example.com/subtitles.vtt"
                  value={settings.sub_file || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, sub_file: e.target.value }))
                  }
                  className="customizer-text-input"
                />
              </div>

              <div className="customizer-input-field">
                <span className="field-hint">Subtitle Label</span>
                <input
                  type="text"
                  placeholder="English"
                  value={settings.sub_label || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, sub_label: e.target.value }))
                  }
                  className="customizer-text-input"
                />
              </div>

              <div className="customizer-input-field full-width">
                <span className="field-hint">Fallback Redirect URL (on stream failure)</span>
                <input
                  type="url"
                  placeholder="https://example.com/fallback"
                  value={settings.fallback_url || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, fallback_url: e.target.value }))
                  }
                  className="customizer-text-input"
                />
              </div>
            </div>
          </section>

          {/* Generated URL & Live Preview */}
          <section className="customizer-section generated-url-section">
            <label className="customizer-section-label">Generated Vidora URL</label>
            <div className="generated-url-box">
              <code>{previewUrl}</code>
              <div className="url-box-actions">
                <button
                  type="button"
                  className="url-copy-btn"
                  onClick={handleCopy}
                  title="Copy generated URL"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="url-open-btn"
                  title="Open player in new tab"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </section>
        </div>

        <div className="customizer-modal-footer">
          <button type="button" className="customizer-reset-btn" onClick={resetDefaults}>
            <RotateCcw size={14} /> Reset Defaults
          </button>
          <div className="customizer-footer-actions">
            <button type="button" className="customizer-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="customizer-apply-btn" onClick={handleSave}>
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
