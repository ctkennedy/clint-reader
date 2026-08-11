import "./helpOverlay.css";

const SHORTCUTS: [string, string][] = [
  ["j / n", "Next item"],
  ["k / p", "Previous item"],
  ["o / Enter", "Open / expand selected item"],
  ["s", "Star selected item"],
  ["Shift+S", "Share selected item"],
  ["m", "Toggle read / unread"],
  ["Shift+A", "Mark all as read"],
  ["r", "Refresh current feed"],
  ["g then a", "Go to All items"],
  ["g then s", "Go to Starred items"],
  ["u", "Toggle sidebar"],
  ["?", "Show / hide this help"],
  ["Esc", "Close dialogs"],
];

export function HelpOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal help-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Keyboard shortcuts</h2>
        <table>
          <tbody>
            {SHORTCUTS.map(([key, desc]) => (
              <tr key={key}>
                <td className="key">{key}</td>
                <td>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="modal-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
