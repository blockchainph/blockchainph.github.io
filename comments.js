import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  where
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD9v3ZoT0v8s_uRf9Ux_UpjB0WxR-0CLzw",
  authDomain: "bpap-comments.firebaseapp.com",
  projectId: "bpap-comments",
  storageBucket: "bpap-comments.firebasestorage.app",
  messagingSenderId: "232092127412",
  appId: "1:232092127412:web:fede8514366cbaf7bac7e1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const commentsRoot = document.querySelector("[data-comments-root]");

if (commentsRoot) {
  const articleSlug = commentsRoot.dataset.articleSlug;
  const commentsList = commentsRoot.querySelector("[data-comments-list]");
  const form = commentsRoot.querySelector("[data-comment-form]");
  const statusNode = commentsRoot.querySelector("[data-comment-status]");

  const dateFormatter = new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  function setStatus(message, isError = false) {
    if (!statusNode) {
      return;
    }

    statusNode.textContent = message;
    statusNode.classList.toggle("is-error", isError);
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function renderComment(comment) {
    const createdAt = comment.createdAt?.toDate ? comment.createdAt.toDate() : new Date();
    const badge = comment.isMember
      ? '<span class="comment-badge">BPAP Member</span>'
      : "";

    return `
      <article class="comment-card">
        <div class="comment-head">
          <div class="comment-author-line">
            <strong class="comment-author">${escapeHtml(comment.name)}</strong>
            ${badge}
          </div>
          <time class="comment-time">${dateFormatter.format(createdAt)}</time>
        </div>
        <p class="comment-body">${escapeHtml(comment.commentBody)}</p>
      </article>
    `;
  }

  async function loadComments() {
    if (!commentsList || !articleSlug) {
      return;
    }

    const commentsQuery = query(
      collection(db, "comments"),
      where("articleSlug", "==", articleSlug)
    );

    const snapshot = await getDocs(commentsQuery);
    const comments = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeA - timeB;
      });

    if (comments.length === 0) {
      commentsList.innerHTML = "";
      return;
    }

    commentsList.innerHTML = comments.map(renderComment).join("");
  }

  if (form) {
    form.addEventListener("submit", async event => {
      event.preventDefault();

      const formData = new FormData(form);
      const name = (formData.get("name") || "").toString().trim();
      const email = (formData.get("email") || "").toString().trim();
      const commentBody = (formData.get("comment_body") || "").toString().trim();
      const acceptedGuidelines = formData.get("guidelines") === "on";

      if (!name || !email || !commentBody || !acceptedGuidelines) {
        setStatus("Please complete all required fields and agree to the commenting guidelines.", true);
        return;
      }

      if (/(https?:\/\/|www\.)/i.test(commentBody)) {
        setStatus("Links are not allowed in comments. Please remove them and try again.", true);
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Posting...";
      }

      setStatus("Posting your response...");

      try {
        await addDoc(collection(db, "comments"), {
          articleSlug,
          name,
          email,
          commentBody,
          isMember: false,
          isHidden: false,
          createdAt: serverTimestamp()
        });

        form.reset();
        setStatus("Your response has been posted.");
        await loadComments();
      } catch (error) {
        console.error(error);
        setStatus("Your response could not be posted right now. Please try again.", true);
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Post Response";
        }
      }
    });
  }

  loadComments().catch(error => {
    console.error(error);
    setStatus("Responses could not be loaded right now.", true);
  });
}
