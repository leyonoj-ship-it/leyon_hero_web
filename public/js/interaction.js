/**
 * =========================================================================
 *  LEON COMMUNITY INTERACTION CONTROLLER
 *  Citizen Feed, Drag & Drop Image Uploader, Nested Comments & Verified Badges
 * =========================================================================
 */

let currentUploadedImageBase64 = null;
let allPosts = [];

// 1. Fetch & Render Feed Posts
async function loadFeedPosts() {
  try {
    const res = await fetch('/api/posts');
    if (res.ok) {
      allPosts = await res.json();
      renderFeedStream(allPosts);
    }
  } catch (err) {
    console.error('Error fetching posts:', err);
  }
}

function renderFeedStream(posts) {
  const container = document.getElementById('feedStreamContainer');
  if (!container) return;

  container.innerHTML = '';
  posts.forEach(post => {
    container.appendChild(createPostCardElement(post));
  });
}

function createPostCardElement(post) {
  const card = document.createElement('div');
  const isLeon = post.role === 'admin' || post.isLeon;
  card.className = `feed-card ${isLeon ? 'card-leon' : ''}`;
  card.id = `post-card-${post.id}`;

  const verifiedBadge = isLeon
    ? `<span class="verified-badge-wings">🛡️✨ ARCH-SENTINEL (VERIFIED)</span>`
    : '';

  const imageHtml = post.image
    ? `<div class="feed-attached-img"><img src="${post.image}" alt="Attached field photo" loading="lazy"></div>`
    : '';

  const commentsCount = (post.comments && post.comments.length) || 0;

  card.innerHTML = `
    <div class="feed-card-header">
      <div class="feed-author-wrap">
        <div class="feed-avatar ${isLeon ? 'avatar-leon' : ''}">
          <img src="${post.avatar || '/assets/images/leon_portrait.jpg'}" alt="${post.author}">
        </div>
        <div>
          <div class="feed-author-name">
            ${post.author}
            ${verifiedBadge}
          </div>
          <div class="feed-author-handle">${post.handle || '@citizen'} · ${post.timestamp || 'Recent'}</div>
        </div>
      </div>
      <span class="feed-post-tag">${post.tag || 'Report'}</span>
    </div>

    <div class="feed-body">${escapeHtml(post.content)}</div>
    ${imageHtml}

    <div class="feed-actions">
      <button class="feed-action-btn ${post.userLiked ? 'liked' : ''}" onclick="toggleLikePost('${post.id}')">
        <span class="icon-heart">❤️</span>
        <span id="likes-count-${post.id}">${post.likes || 0}</span>
      </button>

      <button class="feed-action-btn" onclick="toggleCommentsVisibility('${post.id}')">
        <span>💬</span>
        <span id="comments-count-${post.id}">${commentsCount}</span> Comments
      </button>

      <button class="feed-action-btn" onclick="sharePost('${post.id}')">
        <span>🔗</span> Share
      </button>
    </div>

    <!-- Nested Comments Section -->
    <div class="comments-section" id="comments-section-${post.id}">
      <div class="comments-list" id="comments-list-${post.id}">
        ${renderCommentsHtml(post.comments || [])}
      </div>

      <div class="add-comment-box">
        <input type="text" class="comment-input-field" id="comment-input-${post.id}" placeholder="Write a response or question..." onkeydown="if(event.key==='Enter') submitComment('${post.id}')">
        <button class="btn btn-glass" style="padding:8px 16px; font-size:0.85rem;" onclick="submitComment('${post.id}')">Reply</button>
      </div>
    </div>
  `;

  return card;
}

function renderCommentsHtml(comments) {
  if (!comments || comments.length === 0) {
    return `<div style="font-size:0.8rem; color:var(--text-dim); padding:4px 0;">No comments yet. Join the conversation.</div>`;
  }

  return comments.map(c => {
    const isLeon = c.isLeon || c.role === 'admin';
    return `
      <div class="comment-item ${isLeon ? 'comment-leon' : ''}">
        <div class="comment-avatar" style="${isLeon ? 'border:1.5px solid var(--gold); box-shadow:0 0 10px var(--gold-glow);' : ''}">
          <img src="${c.avatar || '/assets/images/leon_portrait.jpg'}" alt="${c.author}">
        </div>
        <div class="comment-content-wrap">
          <div class="comment-author-bar">
            <span class="comment-author-name">
              ${c.author}
              ${isLeon ? '🛡️✨ <span style="font-size:0.65rem; color:var(--gold); font-family:\'JetBrains Mono\';">[HERO RESPONSE]</span>' : ''}
            </span>
            <span class="comment-time">${c.timestamp || 'Just now'}</span>
          </div>
          <div class="comment-text">${escapeHtml(c.content)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// 2. Image Upload Handling (Drag & Drop + File Picker)
function setupImageUploader() {
  const fileInput = document.getElementById('postImageInput');
  const previewBox = document.getElementById('imagePreviewContainer');
  const previewImg = document.getElementById('imagePreviewTarget');
  const removeBtn = document.getElementById('removeImageBtn');
  const dropZone = document.getElementById('createPostCard');

  if (!fileInput) return;

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleSelectedImage(file);
  });

  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      currentUploadedImageBase64 = null;
      fileInput.value = '';
      if (previewBox) previewBox.style.display = 'none';
      if (previewImg) previewImg.src = '';
    });
  }

  // Drag & Drop
  if (dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--gold)';
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'rgba(0, 163, 255, 0.3)';
      }, false);
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        handleSelectedImage(files[0]);
      }
    });
  }
}

function handleSelectedImage(file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('INVALID FILE', 'Please upload a valid image file (PNG, JPG, WebP).', 'red');
    return;
  }

  const previewBox = document.getElementById('imagePreviewContainer');
  const previewImg = document.getElementById('imagePreviewTarget');

  const reader = new FileReader();
  reader.onload = (e) => {
    currentUploadedImageBase64 = e.target.result;
    if (previewImg) previewImg.src = currentUploadedImageBase64;
    if (previewBox) previewBox.style.display = 'block';
    window.SoundFX.playBlip();
    showToast('📷 PHOTO ATTACHED', 'Image preview ready for publication.', 'blue');
  };
  reader.readAsDataURL(file);
}

// 3. Submit New Post
async function submitPost() {
  const contentInput = document.getElementById('postContentInput');
  const authorInput = document.getElementById('postAuthorInput');
  const tagSelect = document.getElementById('postTagSelect');

  if (!contentInput) return;
  const content = contentInput.value.trim();
  if (!content) {
    showToast('EMPTY POST', 'Please write a message or report before submitting.', 'red');
    return;
  }

  const adminToken = sessionStorage.getItem('leon_admin_token') || '';
  const isAdmin = (localStorage.getItem('leon_admin_mode') === 'true') && !!adminToken;
  const authorName = isAdmin ? 'Leon' : (authorInput && authorInput.value.trim() ? authorInput.value.trim() : 'Metropolis Citizen');
  const tag = tagSelect ? tagSelect.value : (isAdmin ? 'Archangel Decree' : 'Citizen Report');

  const payload = {
    author: authorName,
    handle: isAdmin ? '@ArchSentinel' : `@citizen_${Math.floor(1000 + Math.random() * 9000)}`,
    role: isAdmin ? 'admin' : 'citizen',
    avatar: isAdmin ? '/assets/images/leon_portrait.jpg' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    content: content,
    tag: tag,
    image: currentUploadedImageBase64,
    isLeon: isAdmin,
    adminToken: adminToken
  };

  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      contentInput.value = '';
      currentUploadedImageBase64 = null;
      const previewBox = document.getElementById('imagePreviewContainer');
      if (previewBox) previewBox.style.display = 'none';

      if (isAdmin) {
        window.SoundFX.playAngelicChime();
        showToast('🛡️ ARCHANGEL DECREE BROADCAST', 'Your official response is now pinned on the community feed.', 'gold');
      } else {
        window.SoundFX.playBlip();
        showToast('COMMUNITY POST PUBLISHED', 'Your message has been added to the public network.', 'blue');
      }

      if (!window.EventSource) {
        loadFeedPosts();
      }
    }
  } catch (err) {
    console.error('Failed to submit post:', err);
  }
}

// 4. Toggle Like on a Post
async function toggleLikePost(postId) {
  window.SoundFX.playBlip();
  try {
    const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      const countEl = document.getElementById(`likes-count-${postId}`);
      if (countEl) countEl.innerText = data.likes;
      const card = document.getElementById(`post-card-${postId}`);
      if (card) {
        const btn = card.querySelector('.feed-action-btn');
        if (btn) btn.classList.toggle('liked', data.userLiked);
      }
    }
  } catch (err) {
    console.error('Error toggling like:', err);
  }
}

// 5. Submit Comment on a Post
async function submitComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  if (!input) return;
  const content = input.value.trim();
  if (!content) return;

  const adminToken = sessionStorage.getItem('leon_admin_token') || '';
  const isAdmin = (localStorage.getItem('leon_admin_mode') === 'true') && !!adminToken;

  const payload = {
    author: isAdmin ? 'Leon' : 'Citizen',
    handle: isAdmin ? '@ArchSentinel' : '@citizen',
    role: isAdmin ? 'admin' : 'citizen',
    isLeon: isAdmin,
    content: content,
    adminToken: adminToken
  };

  input.value = '';
  if (isAdmin) {
    window.SoundFX.playAngelicChime();
  } else {
    window.SoundFX.playBlip();
  }

  try {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (!window.EventSource) {
        appendCommentToPostUI(postId, data.comment);
      }
    }
  } catch (err) {
    console.error('Error submitting comment:', err);
  }
}

function appendCommentToPostUI(postId, comment) {
  const list = document.getElementById(`comments-list-${postId}`);
  const countEl = document.getElementById(`comments-count-${postId}`);
  if (!list) return;

  // Clear "No comments" placeholder if present
  if (list.innerText.includes('No comments yet')) {
    list.innerHTML = '';
  }

  const isLeon = comment.isLeon || comment.role === 'admin';
  const item = document.createElement('div');
  item.className = `comment-item ${isLeon ? 'comment-leon' : ''}`;
  item.innerHTML = `
    <div class="comment-avatar" style="${isLeon ? 'border:1.5px solid var(--gold); box-shadow:0 0 10px var(--gold-glow);' : ''}">
      <img src="${comment.avatar || '/assets/images/leon_portrait.jpg'}" alt="${comment.author}">
    </div>
    <div class="comment-content-wrap">
      <div class="comment-author-bar">
        <span class="comment-author-name">
          ${comment.author}
          ${isLeon ? '🛡️✨ <span style="font-size:0.65rem; color:var(--gold); font-family:\'JetBrains Mono\';">[HERO RESPONSE]</span>' : ''}
        </span>
        <span class="comment-time">${comment.timestamp || 'Just now'}</span>
      </div>
      <div class="comment-text">${escapeHtml(comment.content)}</div>
    </div>
  `;

  list.appendChild(item);

  if (countEl) {
    const current = parseInt(countEl.innerText) || 0;
    countEl.innerText = current + 1;
  }
}

function toggleCommentsVisibility(postId) {
  const section = document.getElementById(`comments-section-${postId}`);
  if (section) {
    const isHidden = section.style.display === 'none';
    section.style.display = isHidden ? 'flex' : 'none';
  }
}

function sharePost(postId) {
  const shareUrl = window.location.origin + `/interaction.html#post-${postId}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareUrl);
    showToast('LINK COPIED', 'Post URL copied to your clipboard.', 'blue');
  } else {
    showToast('SHARE LINK', shareUrl, 'blue');
  }
}

// Global SSE Real-time Hooks
window.handleIncomingPost = function(post) {
  const container = document.getElementById('feedStreamContainer');
  if (container) {
    const card = createPostCardElement(post);
    container.prepend(card);
    if (post.isLeon) {
      window.SoundFX.playAngelicChime();
      showToast('🛡️ LEON ISSUED A DECREE', post.content.substring(0, 80) + '...', 'gold');
    }
  }
};

window.handleIncomingComment = function(postId, comment) {
  appendCommentToPostUI(postId, comment);
};

window.handleIncomingLike = function(postId, likes) {
  const countEl = document.getElementById(`likes-count-${postId}`);
  if (countEl) countEl.innerText = likes;
};

// Security helper
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  loadFeedPosts();
  setupImageUploader();

  const publishBtn = document.getElementById('publishPostBtn');
  if (publishBtn) {
    publishBtn.addEventListener('click', submitPost);
  }
});
