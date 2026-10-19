(function () {
  "use strict";

  var ID_RE = /^[2-9A-HJKMNP-Z]{8}$/;

  var resultEl = document.getElementById("result");
  var lookupEl = document.getElementById("lookup");
  var fileEl = document.getElementById("filecheck");
  var form = document.getElementById("lookup-form");
  var codeInput = document.getElementById("code");
  var codeError = document.getElementById("code-error");
  var dropEl = document.getElementById("drop");
  var pdfInput = document.getElementById("pdf");
  var fileResult = document.getElementById("file-result");

  var record = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function showResult(kind, badge, title, sub, rec) {
    resultEl.className = "result is-" + kind;
    resultEl.textContent = "";
    resultEl.appendChild(el("span", "badge", badge));
    resultEl.appendChild(el("h2", null, title));
    if (sub) resultEl.appendChild(el("p", "sub", sub));
    if (rec) {
      var dl = el("dl", "fields");
      [
        ["Certificate number", rec.certificate_no],
        ["Program", rec.program],
        ["Cohort", rec.cohort],
        ["Date given", rec.date_given]
      ].forEach(function (pair) {
        var row = el("div");
        row.appendChild(el("dt", null, pair[0]));
        row.appendChild(el("dd", null, pair[1]));
        dl.appendChild(row);
      });
      resultEl.appendChild(dl);
      resultEl.appendChild(el("p", "issuer", "Issued by Blockchain Practitioners Association of the Philippines"));
    }
    resultEl.hidden = false;
    resultEl.focus({ preventScroll: true });
  }

  function showNotFound() {
    showResult("none", "Not found", "No certificate found for this code");
    lookupEl.hidden = false;
    fileEl.hidden = true;
  }

  function showRecord(rec) {
    record = rec;
    if (rec.status === "valid") {
      showResult("valid", "Valid certificate", rec.name, "This certificate is authentic and was issued to:", rec);
    } else if (rec.status === "revoked") {
      showResult("revoked", "Revoked", "This certificate has been revoked",
        "BPAP no longer recognizes this certificate. It was issued to " + rec.name + ".", rec);
    } else {
      showNotFound();
      return;
    }
    fileEl.hidden = false;
  }

  function lookup(id) {
    fetch("data/" + id + ".json", { cache: "no-store", credentials: "omit" })
      .then(function (r) {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(function (rec) {
        if (!rec || rec.id !== id || typeof rec.name !== "string" || typeof rec.sha256 !== "string") {
          throw new Error("bad record");
        }
        showRecord(rec);
      })
      .catch(showNotFound);
  }

  /* Code entry */
  codeInput.addEventListener("input", function () {
    codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  });

  form.addEventListener("submit", function (e) {
    var v = codeInput.value.trim().toUpperCase();
    codeInput.value = v;
    if (!ID_RE.test(v)) {
      e.preventDefault();
      codeError.textContent = "Enter the 8-character code exactly as printed on the certificate.";
      codeError.hidden = false;
      codeInput.setAttribute("aria-invalid", "true");
      codeInput.focus();
    }
  });

  /* PDF check */
  function hex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) {
      return ("0" + b.toString(16)).slice(-2);
    }).join("");
  }

  function showFileResult(kind, msg, name) {
    fileResult.className = "file-result is-" + kind;
    fileResult.textContent = msg;
    if (name) fileResult.appendChild(el("span", "name", name));
    fileResult.hidden = false;
  }

  function checkFile(file) {
    if (!file || !record) return;
    if (!window.crypto || !window.crypto.subtle) {
      showFileResult("mismatch", "This browser cannot check files. Try a current browser over HTTPS.");
      return;
    }
    fileResult.hidden = true;
    file.arrayBuffer()
      .then(function (buf) { return crypto.subtle.digest("SHA-256", buf); })
      .then(function (digest) {
        if (hex(digest) === record.sha256) {
          showFileResult("match", "This file matches the issued certificate.", file.name);
        } else {
          showFileResult("mismatch", "This file does not match the issued original.", file.name);
        }
      })
      .catch(function () {
        showFileResult("mismatch", "This file could not be read. Please try again.");
      });
  }

  pdfInput.addEventListener("change", function () { checkFile(pdfInput.files[0]); });

  ["dragenter", "dragover"].forEach(function (t) {
    dropEl.addEventListener(t, function (e) { e.preventDefault(); dropEl.classList.add("is-over"); });
  });
  ["dragleave", "drop"].forEach(function (t) {
    dropEl.addEventListener(t, function (e) { e.preventDefault(); dropEl.classList.remove("is-over"); });
  });
  dropEl.addEventListener("drop", function (e) {
    if (e.dataTransfer && e.dataTransfer.files.length) checkFile(e.dataTransfer.files[0]);
  });
  /* A file dropped outside the zone should not make the browser open it. */
  window.addEventListener("dragover", function (e) { e.preventDefault(); });
  window.addEventListener("drop", function (e) { e.preventDefault(); });

  /* Start */
  var params = new URLSearchParams(window.location.search);
  if (!params.has("id")) {
    lookupEl.hidden = false;
    return;
  }
  var id = (params.get("id") || "").trim().toUpperCase();
  if (!ID_RE.test(id)) {
    showNotFound();
    return;
  }
  codeInput.value = "";
  lookup(id);
})();
