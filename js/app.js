(function () {
  'use strict';

  var DATA_URL = 'data/projects.json';

  var state = { data: null, activeProject: 'all' };

  var els = {
    title: document.getElementById('site-title'),
    subtitle: document.getElementById('site-subtitle'),
    filterBar: document.getElementById('filter-bar'),
    app: document.getElementById('app'),
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    marquee: document.getElementById('marquee')
  };

  function folderIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>';
  }

  function openFolder(url) {
    if (!url) return;
    window.open(url, '_blank', 'noopener');
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

    function open() { openFolder(project.folderUrl); }
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