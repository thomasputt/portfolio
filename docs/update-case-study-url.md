# How to update a case study URL

When a real Figma deck link is ready, follow these steps to encrypt it and slot it in.
Do this entirely in your browser — no code editor needed until the final paste step.

---

## Steps

**1. Open your browser console**

Press `F12` → Console tab on any page.

**2. Run the encrypt snippet**

Paste this into the console, using your password and the new Figma URL:

```js
async function encrypt(password, url) {
  var salt = crypto.getRandomValues(new Uint8Array(16));
  var iv   = crypto.getRandomValues(new Uint8Array(12));
  var key  = await crypto.subtle.deriveKey(
    { name:'PBKDF2', salt, iterations:100000, hash:'SHA-256' },
    await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']),
    { name:'AES-GCM', length:256 }, false, ['encrypt']
  );
  var ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, new TextEncoder().encode(url));
  var joined = new Uint8Array(salt.length + iv.length + ct.byteLength);
  joined.set(salt, 0); joined.set(iv, 16); joined.set(new Uint8Array(ct), 28);
  return btoa(String.fromCharCode(...joined));
}
encrypt('yourpassword', 'https://figma.com/deck/YOUR_NEW_URL')
  .then(console.log);
```

**3. Copy the output string** from the console.

**4. Paste it into `index.html`**

Replace the matching placeholder in the `CASE_STUDY_URLS` object:

```js
var CASE_STUDY_URLS = {
  'btn-instagram': 'PASTE_NEW_CIPHERTEXT_HERE',  // ← replace this line
  'btn-movember':  'BASE64_CIPHERTEXT_HERE',
  'btn-rolld':     'BASE64_CIPHERTEXT_HERE',
  'btn-samwood':   'BASE64_CIPHERTEXT_HERE',
  'btn-vintage':   'BASE64_CIPHERTEXT_HERE'
};
```

**5. Commit and push** as normal.

---

## Notes

- Each run of the snippet produces a **different ciphertext** (random salt + IV each time) — this is expected and correct.
- The password itself is never stored anywhere. Keep it somewhere safe (password manager).
- If you ever change the password, you must re-encrypt **all** URLs with the new password and update all five entries.
