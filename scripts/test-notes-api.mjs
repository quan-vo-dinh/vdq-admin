import assert from "node:assert/strict";
const base = process.env.NOTES_TEST_URL ?? "http://localhost:3000";
const created = [];
async function request(method, body, headers = {}) {
  const response = await fetch(`${base}/api/notes`, { method, headers: { "Content-Type": "application/json", ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json() };
}
try {
  const before = await request("GET");
  assert.equal(before.status, 200);
  const title = `QA API ${Date.now()}`;
  const content = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Rich text retained", marks: [{ type: "bold" }, { type: "italic" }] }] }] };
  const added = await request("POST", { title, color: "chart-2", datef: "2026-10-19T21:45:00+07:00", content });
  assert.equal(added.status, 200);
  const note = added.body.data.find(n => n.title === title);
  created.push(note.id);
  assert.equal(note.datef, "2026-10-19T14:45:00.000Z");
  assert.equal(note.createdAt, note.updatedAt);
  assert.equal(note.content.content[0].content[0].marks[0].type, "bold");
  const changed = await request("PUT", { id: note.id, title: `${title} edited`, datef: "2026-10-18T20:30:00+07:00" });
  assert.equal(changed.status, 200);
  const refreshed = await request("GET", undefined, { browserrefreshed: "true" });
  const saved = refreshed.body.data.find(n => n.id === note.id);
  assert.equal(saved.title, `${title} edited`);
  assert.equal(saved.datef, "2026-10-18T13:30:00.000Z");
  assert.equal(saved.createdAt, note.createdAt);
  assert.deepEqual(saved.content, note.content);
  assert.equal((await request("PUT", { id: note.id, datef: "bad" })).status, 400);
  assert.equal((await request("PUT", { id: -999, title: "Missing" })).status, 404);
  await request("DELETE", { id: note.id });
  const second = await request("POST", { title: `${title} second`, color: "primary" });
  const secondNote = second.body.data.find(n => n.title === `${title} second`);
  created.push(secondNote.id);
  assert.ok(secondNote.id > note.id);
  assert.ok(secondNote.content);
  console.log("Notes API: create, edit, refresh persistence, rich text, validation, delete and unique IDs passed.");
} finally {
  for (const id of created) await request("DELETE", { id });
}
