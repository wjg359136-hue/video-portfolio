(function () {
  'use strict';

  var DATA_URL = 'data/projects.json';

  var state = { data: null, activeProject: 'all', activeDialogProject: null };

  var els = {
    title: document.getElementById('site-title'),
    subtitle: document.getElementById('site-subtitle'),
    filterBar: document.getElementById('filter-bar'),
    app: document.getElementById('app'),
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    marquee: document.getElementById('marquee')
  };

  var dialog = createPanDialog();

  function folderIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>';
  }

  function getProjectUrl(project, type) {
    if (!project) return '';
    if (type === 'baidu') {
      return project.baiduUrl || project.baiduPanUrl ||
        (state.data && state.data.site && state.data.site.baiduUrl) || '';
    }
    return project.quarkUrl || project.folderUrl || '';
  }

  function openFolder(url) {
    if (!url) return;
    window.open(url, '_blank', 'noopener');
  }

  function createPanDialog() {
    var overlay = document.createElement('div');
    overlay.className = 'pan-dialog';
    overlay.hidden = true;
    overlay.innerHTML = [
      '<div class="pan-dialog-backdrop" data-close="true"></div>',
      '<section class="pan-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="pan-dialog-title">',
      '  <button class="pan-dialog-close" type="button" aria-label="关闭" data-close="true">×</button>',
      '  <p class="pan-dialog-eyebrow">选择网盘</p>',
      '  <h3 class="pan-dialog-title" id="pan-dialog-title">打开作品文件夹</h3>',
      '  <p class="pan-dialog-copy">请选择要跳转的网盘平台查看视频作品。</p>',
      '  <div class="pan-dialog-actions">',
      '    <button class="pan-option baidu" type="button" data-pan="baidu">百度网盘</button>',
      '    <button class="pan-option quark" type="button" data-pan="quark">夸克网盘</button>',
      '  </div>',
      '</section>'
    ].join('');
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      var close = e.target && e.target.getAttribute('data-close');
      var pan = e.target && e.target.getAttribute('data-pan');
      if (close) closePanDialog();
      if (pan) choosePan(pan);
    });

    document.addEventListener('keydown', function (e) {
      if (!overlay.hidden && e.key === 'Escape') closePanDialog();
    });

    return {
      overlay: overlay,
      title: overlay.querySelector('.pan-dialog-title'),
      copy: overlay.querySelector('.pan-dialog-copy'),
      baidu: overlay.querySelector('[data-pan="baidu"]'),
      quark: overlay.querySelector('[data-pan="quark"]')
    };
  }

  function openPanDialog(project) {
    state.activeDialogProject = project;
    var baiduUrl = getProjectUrl(project, 'baidu');
    var quarkUrl = getProjectUrl(project, 'quark');
    dialog.title.textContent = project.name + ' · 打开作品文件夹';
    dialog.copy.textContent = baiduUrl
      ? '请选择要跳转的网盘平台查看视频作品。'
      : '百度网盘链接待补充，目前可先打开夸克网盘。';
    dialog.baidu.disabled = !baiduUrl;
    dialog.baidu.textContent = baiduUrl ? '百度网盘' : '百度网盘（待补充）';
    dialog.quark.disabled = !quarkUrl;
    dialog.quark.textContent = quarkUrl ? '夸克网盘' : '夸克网盘（待补充）';
    dialog.overlay.hidden = false;
    document.body.classList.add('dialog-open');
    (baiduUrl ? dialog.baidu : dialog.quark).focus();
  }

  function closePanDialog() {
    dialog.overlay.hidden = true;
    document.body.classList.remove('dialog-open');
    state.activeDialogProject = null;
  }

  function choosePan(type) {
    var url = getProjectUrl(state.activeDialogProject, type);
    if (!url) return;
    closePanDialog();
    openFolder(url);
  }

  function initMarquee(projects) {
    if (!els.marquee) return;
    var items = [];
    projects.forEach(function (p) {
      for (var i = 0; i < 3; i++) items.push(p.name);
    });
    var content = items.concat(items).map(function () {
      return '<span></span>';
    }).join('');
    els.marquee.innerHTML = content;
    var spans = els.marquee.querySelectorAll('span');
    items.concat(items).forEach(function (name, i) {
      if (spans[i]) spans[i].textContent = name;
    });
  }

  function render(data) {
    state.data = data;
    if (data.site) {
      if (data.site.title) {
        els.title.textContent = data.site.title;
        document.title = data.site.title;
      }
      if (data.site.subtitle) els.subtitle.textContent = data.site.subtitle;
    }
    initMarquee(data.projects || []);
    renderFilter();
    renderProjects();
  }

  function renderFilter() {
    var projects = state.data.projects || [];
    var chips = [makeChip('all', '全部')];
    projects.forEach(function (p) { chips.push(makeChip(p.id, p.name)); });
    els.filterBar.innerHTML = '';
    chips.forEach(function (c) { els.filterBar.appendChild(c); });
  }

  function makeChip(id, label) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip' + (state.activeProject === id ? ' active' : '');
    btn.textContent = label;
    btn.addEventListener('click', function () {
      state.activeProject = id;
      document.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
      btn.classList.add('active');
      renderProjects();
      var works = document.getElementById('works');
      if (works) works.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return btn;
  }

  function renderProjects() {
    var projects = (state.data.projects || []).filter(function (p) {
      return state.activeProject === 'all' || p.id === state.activeProject;
    });
    els.app.innerHTML = '';
    if (!projects.length) {
      var empty = document.createElement('p');
      empty.className = 'loading';
      empty.textContent = '暂无项目';
      els.app.appendChild(empty);
      return;
    }
    var grid = document.createElement('div');
    grid.className = 'video-grid';
    projects.forEach(function (p, i) {
      grid.appendChild(makeCard(p, i));
    });
    els.app.appendChild(grid);
  }

  function makeCard(project, pi) {
    var card = document.createElement('article');
    card.className = 'video-card';
    card.tabIndex = 0;

    var thumb = document.createElement('div');
    thumb.className = 'video-thumb';
    thumb.style.setProperty('--grad-a', gradColor(pi, 0, 0));
    thumb.style.setProperty('--grad-b', gradColor(pi, 0, 1));

    var cover = document.createElement('img');
    cover.className = 'video-cover-img';
    cover.alt = project.name;
    cover.loading = 'lazy';
    if (project.cover) cover.src = project.cover;
    thumb.appendChild(cover);

    var folder = document.createElement('div');
    folder.className = 'folder-icon';
    folder.innerHTML = folderIcon();
    thumb.appendChild(folder);

    var badge = document.createElement('span');
    badge.className = 'video-badge';
    var videoCount = typeof project.count === 'number' ? project.count : (project.videos || []).length;
    badge.textContent = videoCount + ' 个视频';
    thumb.appendChild(badge);

    card.appendChild(thumb);

    var meta = document.createElement('div');
    meta.className = 'video-meta';
    var title = document.createElement('div');
    title.className = 'video-title';
    title.textContent = project.name;
    var proj = document.createElement('div');
    proj.className = 'video-project';
    proj.textContent = (project.videos || []).map(function (v) { return v.title; }).join(' · ') || '打开文件夹查看';
    meta.appendChild(title);
    meta.appendChild(proj);
    card.appendChild(meta);

    function open() { openPanDialog(project); }
    card.addEventListener('click', open);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
    return card;
  }

  var PALETTES = [
    ['#25252a', '#0e0e10'],
    ['#2b1d17', '#0e0e10'],
    ['#1d2520', '#0e0e10'],
    ['#241a2b', '#0e0e10'],
    ['#2b2316', '#0e0e10'],
    ['#1a232b', '#0e0e10']
  ];

  function gradColor(pi, vi, idx) {
    var p = PALETTES[(pi * 3 + vi * 7) % PALETTES.length];
    return p[idx];
  }

  function showError() {
    els.loading.hidden = true;
    els.error.hidden = false;
  }

  fetch(DATA_URL)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      els.loading.hidden = true;
      render(data);
    })
    .catch(function () { showError(); });
})();
