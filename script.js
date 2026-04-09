(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // 年份
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  // ========== 欢迎界面 ==========
  const welcome = $("#welcome");
  const enterBtn = $("#enter-btn");

  if (enterBtn && welcome) {
    enterBtn.addEventListener("click", () => {
      welcome.classList.add("is-hidden");
      setTimeout(() => {
        welcome.style.display = "none";
      }, 800);
    });
  }

  // ========== 横滑导航 ==========
  const slidesContainer = $("#slides-container");
  const navLinks = $$(".nav-link[data-slide]");
  const brand = $(".brand[data-slide]");
  const allSlideTriggers = $$("[data-slide]");
  let currentSlide = 0;
  const totalSlides = 5; // 关于我、经历、技能/作品、联系方式、小红书

  const goToSlide = (index) => {
    if (index < 0 || index >= totalSlides) return;
    currentSlide = index;
    if (slidesContainer) {
      slidesContainer.style.transform = `translateX(-${index * 100}vw)`;
    }
    // 更新导航高亮
    navLinks.forEach((a) => {
      const slideIdx = parseInt(a.getAttribute("data-slide"), 10);
      a.classList.toggle("is-active", slideIdx === index);
    });
    // 滚动每个 slide 到顶部
    $$(".slide").forEach((s) => {
      s.scrollTop = 0;
    });
  };

  // 绑定所有 data-slide 触发器
  allSlideTriggers.forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const idx = parseInt(el.getAttribute("data-slide"), 10);
      if (!isNaN(idx)) {
        goToSlide(idx);
        closeNav();
      }
    });
  });

  // ========== 移动端导航 ==========
  const nav = $(".nav");
  const navToggle = $(".nav-toggle");

  const closeNav = () => {
    if (!nav) return;
    nav.classList.remove("is-open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
  };

  const openNav = () => {
    if (!nav) return;
    nav.classList.add("is-open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "true");
  };

  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const isOpen = nav?.classList.contains("is-open");
      if (isOpen) closeNav();
      else openNav();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
  });

  // ========== 键盘左右切换 ==========
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      goToSlide(currentSlide + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      goToSlide(currentSlide - 1);
    }
  });

  // ========== 触摸滑动 ==========
  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );

  document.addEventListener(
    "touchend",
    (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) goToSlide(currentSlide + 1);
        else goToSlide(currentSlide - 1);
      }
    },
    { passive: true }
  );

  // ========== Reveal 动效 ==========
  const revealEls = $$(".reveal");
  if (revealEls.length) {
    const revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-visible");
          revealIO.unobserve(e.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
    );
    revealEls.forEach((el) => revealIO.observe(el));
  }

  // ========== 小红书模块 ==========
  const xhsNotesGrid = $("#xhs-notes-grid");
  const xhsModal = $("#xhs-modal");
  const xhsModalBody = $("#xhs-modal-body");
  const xhsModalClose = $("#xhs-modal-close");
  let xhsData = null;

  // 加载小红书数据
  const loadXhsData = async () => {
    try {
      const response = await fetch("./data/xiaohongshu.json");
      if (!response.ok) throw new Error("Failed to load data");
      xhsData = await response.json();
      renderXhsProfile();
      renderXhsNotes();
    } catch (error) {
      console.error("Error loading Xiaohongshu data:", error);
      if (xhsNotesGrid) {
        xhsNotesGrid.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 40px;">加载数据失败，请稍后重试</p>';
      }
    }
  };

  // 渲染小红书主页信息
  const renderXhsProfile = () => {
    if (!xhsData || !xhsData.profile) return;
    const profile = xhsData.profile;

    const avatar = $(".xhs-avatar");
    const nickname = $(".xhs-nickname");
    const bio = $(".xhs-bio");
    const followers = $("#xhs-followers");
    const likes = $("#xhs-likes");
    const following = $("#xhs-following");
    const notes = $("#xhs-notes");

    if (avatar) avatar.src = profile.avatar;
    if (nickname) nickname.textContent = profile.nickname;
    if (bio) bio.textContent = profile.bio;
    if (followers) followers.textContent = formatNumber(profile.followers);
    if (likes) likes.textContent = formatNumber(profile.likes);
    if (following) following.textContent = formatNumber(profile.following);
    if (notes) notes.textContent = formatNumber(profile.notes_count);
  };

  // 渲染笔记列表
  const renderXhsNotes = () => {
    if (!xhsData || !xhsData.notes || !xhsNotesGrid) return;

    xhsNotesGrid.innerHTML = xhsData.notes.map((note) => `
      <article class="xhs-note-card reveal" data-note-id="${note.id}">
        <img class="xhs-note-cover" src="${note.cover}" alt="${note.title}" loading="lazy" />
        <div class="xhs-note-info">
          <h4 class="xhs-note-title">${note.title}</h4>
          <div class="xhs-note-meta">
            <span class="xhs-note-time">${note.publish_time}</span>
            <span class="xhs-note-likes">${formatNumber(note.likes)}</span>
          </div>
        </div>
      </article>
    `).join("");

    // 绑定点击事件
    $$(".xhs-note-card").forEach((card) => {
      card.addEventListener("click", () => {
        const noteId = parseInt(card.getAttribute("data-note-id"), 10);
        openXhsModal(noteId);
      });
    });

    // 重新绑定 reveal 动效
    const newRevealEls = $$(".xhs-note-card.reveal");
    if (newRevealEls.length) {
      const revealIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add("is-visible");
            revealIO.unobserve(e.target);
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
      );
      newRevealEls.forEach((el) => revealIO.observe(el));
    }
  };

  // 打开笔记详情弹窗
  const openXhsModal = (noteId) => {
    if (!xhsData || !xhsData.notes) return;
    const note = xhsData.notes.find((n) => n.id === noteId);
    if (!note || !xhsModal || !xhsModalBody) return;

    xhsModalBody.innerHTML = `
      <h2 class="xhs-modal-title">${note.title}</h2>
      <div class="xhs-modal-meta">
        <span>${note.publish_time}</span>
        <div class="xhs-modal-stats">
          <span class="xhs-modal-stat likes">♥ ${formatNumber(note.likes)}</span>
          <span class="xhs-modal-stat comments">💬 ${formatNumber(note.comments)}</span>
          <span class="xhs-modal-stat collections">⭐ ${formatNumber(note.collections)}</span>
        </div>
      </div>
      <div class="xhs-modal-content-text">${note.content}</div>
      <div class="xhs-modal-tags">
        ${note.tags.map((tag) => `<span class="xhs-modal-tag">#${tag}</span>`).join("")}
      </div>
    `;

    xhsModal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  // 关闭弹窗
  const closeXhsModal = () => {
    if (!xhsModal) return;
    xhsModal.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  // 绑定弹窗关闭事件
  if (xhsModalClose) {
    xhsModalClose.addEventListener("click", closeXhsModal);
  }

  if (xhsModal) {
    const overlay = xhsModal.querySelector(".xhs-modal-overlay");
    if (overlay) {
      overlay.addEventListener("click", closeXhsModal);
    }
  }

  // ESC 键关闭弹窗
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && xhsModal && xhsModal.classList.contains("is-open")) {
      closeXhsModal();
    }
  });

  // 数字格式化
  const formatNumber = (num) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + "w";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return String(num);
  };

  // 初始化加载小红书数据
  loadXhsData();
})();