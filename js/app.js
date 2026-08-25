(function () {
  'use strict';

  var DATA_URL = 'data/projects.json';

  var state = {
    data: null,
    activeProject: 'all'
  };

  var els = {
    title: document.getElementById('site-title'),
    subtitle: document.getElementById('site-subtitle'),
    filterBar: document.getElementById('filter-bar'),
    app: document.getElementById('app'),
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    modal: document.getElementById('video-modal'),
    modalTitle: document.getElementById('modal-title'),
    video: document.getElementById('modal-video'),
    modalError: document.getElementById('modal-error'),
    closeBtn: document.getElementById('modal-close'),
    backdrop: document.getElementById('modal-backdrop')
  };

  function buildIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = String(s == null ? '' : s);
    return d.innerHTML;
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
    renderFilter();
    renderProjects();
  }

  function renderFilter() {
    var projects = state.data.projects || [];
    var chips = [makeChip('all', '全部')];
    projects.forEach(function (p) {
      chips.push(makeChip(p.id, p.name));
    });
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      empty.textContent = '暂无视频';
      els.app.appendChild(empty);
      return;
    }
    projects.forEach(function (p, i) {
      var section = document.createElement('section');
      section.className = 'project-section';

      var head = document.createElement('div');
      head.className = 'project-head';
      var name = document.createElement('h2');
      name.className = 'project-name';
      name.textContent = p.name;
      var count = document.createElement('span');
      count.className = 'project-count';
      count.textContent = p.videos.length + ' 个视频';
      head.appendChild(name);
      head.appendChild(count);
      section.appendChild(head);

      var grid = document.createElement('div');
      grid.className = 'video-grid';
      (p.videos || []).forEach(function (v, j) {
        grid.appendChild(makeCard(p, v, i, j));
      });
      section.appendChild(grid);
      els.app.appendChild(section);
    });
  }

  function makeCard(project, video, pi, vi) {
    var card = document.createElement('article');
    card.className = 'video-card';
    card.tabIndex = 0;

    var thumb = document.createElement('div');
    thumb.className = 'video-thumb';
    thumb.style.setProperty('--grad-a', gradColor(pi, vi, 0));
    thumb.style.setProperty('--grad-b', gradColor(pi, vi, 1));
    thumb.innerHTML = '<div class="play-icon">' + buildIcon() + '</div>';
    card.appendChild(thumb);

    var meta = document.createElement('div');
    meta.className = 'video-meta';
    var title = document.createElement('div');
    title.className = 'video-title';
    title.textContent = video.title || '未命名视频';
    var proj = document.createElement('div');
    proj.className = 'video-project';
    proj.textContent = project.name;
    meta.appendChild(title);
    meta.appendChild(proj);
    card.appendChild(meta);

    function open() {
      openModal(video, project);
    }
    card.addEventListener('click', open);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
    return card;
  }

  var PALETTES = [
    ['#3a4a6b', '#1a2233'],
    ['#6b4a3a', '#2b1c14'],
    ['#3a6b55', '#14261d'],
    ['#5b3a6b', '#221430'],
    ['#6b5a3a', '#2a2114'],
    ['#3a5f6b', '#14222a']
  ];

  function gradColor(pi, vi, idx) {
    var p = PALETTES[(pi * 3 + vi * 7) % PALETTES.length];
    return p[idx];
  }

  function openModal(video, project) {
    els.modalTitle.textContent = video.title || '未命名视频';
    els.modalError.hidden = true;
    els.video.src = video.url;
    els.modal.hidden = false;
    document.body.style.overflow = 'hidden';
    els.video.play().catch(function () { /* 等待用户交互时忽略 */ });
  }

  function closeModal() {
    els.modal.hidden = true;
    els.video.pause();
    els.video.removeAttribute('src');
    els.video.load();
    document.body.style.overflow = '';
  }

  els.closeBtn.addEventListener('click', closeModal);
  els.backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !els.modal.hidden) closeModal();
  });
  els.video.addEventListener('error', function () {
    els.modalError.hidden = false;
  });

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
    .catch(function () {
      showError();
    });
})();
