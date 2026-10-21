type SaveFile = (name: string, text: string, mime: string) => Promise<void>;
let saveFile: SaveFile | undefined;
export function configureFiles(adapter: SaveFile) { saveFile = adapter; }
export async function saveTextFile(name: string, text: string, mime: string) {
  if (saveFile) return saveFile(name, text, mime);
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  try { const a = document.createElement('a'); a.href = url; a.download = name; a.style.display = 'none'; document.body.appendChild(a); try { a.click(); } finally { a.remove(); } }
  finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
export function downloadTextFile(name: string, text: string, mime: string) {
  void saveTextFile(name, text, mime).catch(() => {
    window.dispatchEvent(new CustomEvent('file-save-error'));
  });
}
