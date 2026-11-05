import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
function key() {
  const value = process.env.DEVELOPER_ENCRYPTION_KEY;
  if (!value || !/^[a-f0-9]{64}$/i.test(value))
    throw new Error("encryption_not_configured");
  return Buffer.from(value, "hex");
}
export function encrypt(value: string) {
  const nonce = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(), nonce);
  const body = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [
    "v1",
    nonce.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    body.toString("base64"),
  ].join(".");
}
export function decrypt(value: string) {
  const [version, nonce, tag, body] = value.split(".");
  if (version !== "v1" || !nonce || !tag || !body)
    throw new Error("invalid_credential");
  const cipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(nonce, "base64"),
  );
  cipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    cipher.update(Buffer.from(body, "base64")),
    cipher.final(),
  ]).toString("utf8");
}
