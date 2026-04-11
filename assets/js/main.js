/**
 * 每日 AIGC 早报 — JS
 * 三态主题 / 日历网格 / 迷你日历 / HD原图 / 分享 / 响应式缩放
 */
(function() {
  'use strict';

  var allPosts = window.__POSTS__ || [];
  var currentYear = null;
  var currentMonth = null;
  var isHD = localStorage.getItem('daily_hd') === 'true';

  /* ===== 工具 ===== */
  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function getThumb(url, size) {
    if (!url) return '';
    if (isHD) return url;
    // 使用 weserv CDN 缩放
    return 'https://images.weserv.nl/?url=' + encodeURIComponent(url) + '&w=' + size + '&h=' + size + '&output=jpg&q=80&fit=cover';
  }

  /* ===== 三态主题（浅色 / 跟随系统 / 深色） ===== */
  function initTheme() {
    var saved = localStorage.getItem('daily_theme') || 'system';
    applyTheme(saved);
    // 绑定所有主题按钮（footer + mobile menu）
    document.querySelectorAll('.theme-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var t = this.dataset.theme;
        localStorage.setItem('daily_theme', t);
        applyTheme(t);
      });
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
      if ((localStorage.getItem('daily_theme') || 'system') === 'system') applyTheme('system');
    });
  }

  function applyTheme(preference) {
    var actual = preference === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : preference;
    document.documentElement.setAttribute('data-theme', actual);
    document.querySelectorAll('.theme-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.theme === preference);
    });
  }

  /* ===== HD 原图切换 ===== */
  function initHDToggle() {
    var footerToggle = document.getElementById('hdToggle');
    var mobileToggle = document.getElementById('hdToggleMobile');

    function setHD(val) {
      isHD = val;
      localStorage.setItem('daily_hd', val ? 'true' : 'false');
      if (footerToggle) footerToggle.checked = val;
      if (mobileToggle) mobileToggle.checked = val;
      // 重新渲染日历和文章图片
      if (document.getElementById('calendarContainer')) renderCalendar();
      refreshArticleImages();
    }

    if (isHD) {
      if (footerToggle) footerToggle.checked = true;
      if (mobileToggle) mobileToggle.checked = true;
    }

    if (footerToggle) footerToggle.addEventListener('change', function() { setHD(this.checked); });
    if (mobileToggle) mobileToggle.addEventListener('change', function() { setHD(this.checked); });

    // 初始化时处理文章页图片
    refreshArticleImages();
  }

  function refreshArticleImages() {
    var cover = document.querySelector('.article-cover img');
    if (cover) {
      var orig = cover.getAttribute('data-original');
      if (orig) cover.src = isHD ? orig : 'https://images.weserv.nl/?url=' + encodeURIComponent(orig) + '&w=640&h=640&output=jpg&q=80&fit=cover';
    }
    // 文章正文图片
    var content = document.querySelector('.article-content');
    if (content) {
      content.querySelectorAll('img').forEach(function(img) {
        var src = img.getAttribute('data-original') || img.src;
        if (!img.getAttribute('data-original')) img.setAttribute('data-original', src);
        if (isHD) {
          img.src = src;
        } else if (!img.src.includes('weserv.nl')) {
          img.src = 'https://images.weserv.nl/?url=' + encodeURIComponent(src) + '&output=jpg&q=80';
        }
      });
    }
  }

  /* ===== 移动端菜单 ===== */
  function initMobileMenu() {
    var btn = document.getElementById('hamburgerButton');
    var overlay = document.getElementById('mobileOverlay');
    var menu = document.getElementById('mobileMenu');
    if (!btn) return;

    function open() {
      if (menu) menu.classList.add('open');
      if (overlay) overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      if (menu) menu.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    btn.addEventListener('click', function() {
      menu.classList.contains('open') ? close() : open();
    });
    if (overlay) overlay.addEventListener('click', close);
    if (menu) menu.addEventListener('click', function(e) {
      if (e.target.tagName === 'A') close();
    });

    // 修复：窗口放大到宽屏时确保遮罩消失
    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() { if (window.innerWidth > 1023) close(); }, 100);
    });
  }

  /* ===== 年份/月份选择器 + 日历渲染 ===== */
  function initCalendar() {
    var container = document.getElementById('calendarContainer');
    var yearOpts = document.getElementById('yearOptions');
    var monthOpts = document.getElementById('monthOptions');
    if (!container || !allPosts.length) return;

    // 收集年份和月份
    var years = {};
    allPosts.forEach(function(p) {
      if (!years[p.y]) years[p.y] = {};
      if (!years[p.y][p.m]) years[p.y][p.m] = true;
    });
    var yearList = Object.keys(years).sort(function(a, b) { return b - a; });

    // 渲染年份按钮
    var yHTML = '';
    yearList.forEach(function(y) {
      yHTML += '<button class="filter-btn year-btn" data-year="' + y + '">' + y + '</button>';
    });
    yearOpts.innerHTML = yHTML;

    // 月份按钮（固定 12 个月）
    var mHTML = '';
    for (var m = 1; m <= 12; m++) {
      var mm = m < 10 ? '0' + m : '' + m;
      mHTML += '<button class="filter-btn month-btn" data-month="' + mm + '">' + m + '月</button>';
    }
    monthOpts.innerHTML = mHTML;

    // 默认显示最新年月
    var now = new Date();
    var defaultYear = String(now.getFullYear());
    var defaultMonth = now.getMonth() + 1 < 10 ? '0' + (now.getMonth() + 1) : '' + (now.getMonth() + 1);

    // 检查是否有对应日期的文章
    var hasDefaultMonth = allPosts.some(function(p) { return p.y === defaultYear && p.m === defaultMonth; });
    if (!hasDefaultMonth && yearList.length > 0) {
      defaultYear = yearList[0];
      // 找该年最新的月份
      var monthsInYear = Object.keys(years[defaultYear]).sort(function(a, b) { return b - a; });
      defaultMonth = monthsInYear[0] || '01';
    }

    currentYear = defaultYear;
    currentMonth = defaultMonth;

    // 绑定事件
    yearOpts.addEventListener('click', function(e) {
      var btn = e.target.closest('.year-btn');
      if (!btn) return;
      currentYear = btn.dataset.year;
      // 切换到该年最新月份
      var monthsInYear = Object.keys(years[currentYear] || {}).sort(function(a, b) { return b - a; });
      currentMonth = monthsInYear[0] || '01';
      updateSelectorState();
      renderCalendar();
    });

    monthOpts.addEventListener('click', function(e) {
      var btn = e.target.closest('.month-btn');
      if (!btn) return;
      currentMonth = btn.dataset.month;
      updateSelectorState();
      renderCalendar();
    });

    updateSelectorState();
    renderCalendar();
  }

  function updateSelectorState() {
    document.querySelectorAll('.year-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.year === currentYear);
    });
    document.querySelectorAll('.month-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.month === currentMonth);
    });
  }

  function renderCalendar() {
    var container = document.getElementById('calendarContainer');
    if (!container) return;

    var year = parseInt(currentYear);
    var month = parseInt(currentMonth);

    // 计算日历网格
    var firstDay = new Date(year, month - 1, 1);
    var daysInMonth = new Date(year, month, 0).getDate();
    // 周一=0, 周日=6
    var startWeekday = (firstDay.getDay() + 6) % 7;

    // 构建该月文章索引
    var postByDay = {};
    allPosts.forEach(function(p) {
      if (p.y === currentYear && p.m === currentMonth) {
        postByDay[p.day] = p;
      }
    });

    var weekdayNames = ['一', '二', '三', '四', '五', '六', '日'];
    var html = '<div class="cal-weekdays">';
    weekdayNames.forEach(function(w) {
      html += '<div class="cal-weekday">' + w + '</div>';
    });
    html += '</div><div class="cal-days">';

    // 空白格
    for (var i = 0; i < startWeekday; i++) {
      html += '<div class="cal-day cal-day-empty"></div>';
    }

    // 日期格
    var hasAnyPost = false;
    for (var d = 1; d <= daysInMonth; d++) {
      var dd = d < 10 ? '0' + d : '' + d;
      var post = postByDay[dd];

      if (post) {
        hasAnyPost = true;
        var thumbSrc = getThumb(post.i, 300);
        if (thumbSrc) {
          html += '<a href="' + esc(post.u) + '" class="cal-day cal-day-has-post">';
          html += '<div class="cal-day-img"><img src="' + esc(thumbSrc) + '" alt="' + esc(post.t) + '" loading="lazy"></div>';
          html += '<div class="cal-day-overlay"></div>';
          html += '<div class="cal-day-num">' + d + '</div>';
          html += '</a>';
        } else {
          // 无图但有文章
          html += '<a href="' + esc(post.u) + '" class="cal-day cal-day-has-post" style="background:var(--accent);">';
          html += '<div class="cal-day-overlay" style="background:none;"></div>';
          html += '<div class="cal-day-num">' + d + '</div>';
          html += '</a>';
        }
      } else {
        html += '<div class="cal-day cal-day-no-post"><div class="cal-day-num">' + d + '</div></div>';
      }
    }

    // 补齐最后一行
    var totalCells = startWeekday + daysInMonth;
    var remaining = totalCells % 7;
    if (remaining > 0) {
      for (var i = remaining; i < 7; i++) {
        html += '<div class="cal-day cal-day-empty"></div>';
      }
    }

    html += '</div>';

    if (!hasAnyPost) {
      html = '<div class="cal-empty-hint">本月暂无文章</div>' + html;
    }

    container.innerHTML = html;
  }

  /* ===== 迷你日历（文章页） ===== */
  function initMiniCalendar() {
    var header = document.getElementById('miniCalHeader');
    var cal = document.getElementById('miniCalendar');
    var data = window.__MONTH__;
    if (!header || !cal || !data) return;

    var year = parseInt(data.y);
    var month = parseInt(data.m);
    var today = parseInt(data.d);
    var posts = data.posts || {};

    header.textContent = data.y + '年' + parseInt(data.m) + '月';

    var firstDay = new Date(year, month - 1, 1);
    var daysInMonth = new Date(year, month, 0).getDate();
    var startWeekday = (firstDay.getDay() + 6) % 7;

    var weekdayNames = ['一', '二', '三', '四', '五', '六', '日'];
    var html = '';
    weekdayNames.forEach(function(w) {
      html += '<div class="mini-cal-weekday">' + w + '</div>';
    });

    for (var i = 0; i < startWeekday; i++) {
      html += '<div class="mini-cal-day mini-cal-day-empty"></div>';
    }

    for (var d = 1; d <= daysInMonth; d++) {
      var dd = d < 10 ? '0' + d : '' + d;
      var isToday = d === today;
      var postUrl = posts[dd];

      if (isToday) {
        html += '<div class="mini-cal-day mini-cal-day-today">' + d + '</div>';
      } else if (postUrl) {
        html += '<a href="' + esc(postUrl) + '" class="mini-cal-day-link"><div class="mini-cal-day">' + d + '</div></a>';
      } else {
        html += '<div class="mini-cal-day">' + d + '</div>';
      }
    }

    // 补齐
    var totalCells = startWeekday + daysInMonth;
    var remaining = totalCells % 7;
    if (remaining > 0) {
      for (var i = remaining; i < 7; i++) {
        html += '<div class="mini-cal-day mini-cal-day-empty"></div>';
      }
    }

    cal.innerHTML = html;
  }

  /* ===== 分享功能 ===== */
  function initShare() {
    // 复制链接
    var copyBtn = document.getElementById('copyLinkBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(window.location.href).then(function() {
          copyBtn.title = '已复制！';
          setTimeout(function() { copyBtn.title = '复制链接'; }, 1500);
        });
      });
    }

    // 微信二维码
    var wechatBtn = document.getElementById('wechatShareBtn');
    var wechatOverlay = document.getElementById('wechatQrOverlay');
    var wechatClose = document.getElementById('wechatQrClose');
    var wechatQR = document.getElementById('wechatQrCode');
    if (wechatBtn && wechatOverlay && wechatQR) {
      function showQR() {
        var url = window.location.href;
        wechatQR.innerHTML = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(url) + '" alt="QR Code" loading="lazy">';
        wechatOverlay.classList.add('active');
      }
      function hideQR() { wechatOverlay.classList.remove('active'); }

      wechatBtn.addEventListener('click', showQR);
      if (wechatClose) wechatClose.addEventListener('click', hideQR);
      wechatOverlay.addEventListener('click', function(e) { if (e.target === wechatOverlay) hideQR(); });
    }
  }

  /* ===== 超宽屏自适应缩放 ===== */
  function initResponsiveScale() {
    function update() {
      var vw = window.innerWidth;
      // 主内容最大宽度约 1200px，确保 ≥ 2/3 视口
      var scale = (vw * 2 / 3) / 1200;
      if (scale > 1) {
        document.documentElement.style.setProperty('--page-zoom', scale.toFixed(4));
      } else {
        document.documentElement.style.removeProperty('--page-zoom');
      }
    }
    update();
    window.addEventListener('resize', update);
  }

  /* ===== 文章内链接强制新标签页 ===== */
  function initExternalLinks() {
    var article = document.querySelector('.article-content');
    if (!article) return;
    article.querySelectorAll('a').forEach(function(a) {
      if (a.hostname !== window.location.hostname) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  /* ===== 初始化 ===== */
  document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initHDToggle();
    initMobileMenu();
    initCalendar();
    initMiniCalendar();
    initShare();
    initResponsiveScale();
    initExternalLinks();
  });
})();
