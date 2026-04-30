class AppGenerator {
  static generateHTML(schemas) {
    const { ui, db, auth } = schemas;
    const theme = ui.theme || { primaryColor: '#6366f1', mode: 'dark' };
    const appName = ui.navigation?.items?.[0]?.label || 'Generated App';
    
    // Premium Design Tokens
    const primary = theme.primaryColor || '#6366f1';
    const isDark = theme.mode !== 'light'; // Default to dark for premium feel
    
    let pagesHtml = '';
    let navHtml = '';

    // Generate Sidebar Navigation
    if (ui.navigation && ui.navigation.items) {
      navHtml = `
        <nav class="sidebar glass-panel">
          <div class="logo">
            <i class="fa-solid fa-layer-group"></i> ${appName}
          </div>
          <ul class="nav-links">
            ${ui.navigation.items.map(item => `
              <li>
                <a href="#" class="nav-item" onclick="navigateTo('${item.path}', this); return false;">
                  <i class="fa-solid ${item.icon ? item.icon : 'fa-cube'}"></i>
                  <span>${item.label}</span>
                </a>
              </li>
            `).join('')}
          </ul>
          <div class="user-profile">
            <div class="avatar"><i class="fa-solid fa-user"></i></div>
            <div class="user-details">
              <span class="user-name">Admin User</span>
              <span class="user-role">Superadmin</span>
            </div>
          </div>
        </nav>
      `;
    }

    // Generate Pages and Components
    ui.pages.forEach(page => {
      let componentsHtml = '';
      
      (page.components || []).forEach(comp => {
        if (comp.type === 'stats') {
          componentsHtml += `
            <div class="stats-grid fade-in">
              <div class="stat-card glass-panel">
                <div class="stat-icon" style="color: #3b82f6"><i class="fa-solid fa-users"></i></div>
                <div class="stat-details">
                  <div class="stat-label">Total Users</div>
                  <div class="stat-number">12,845</div>
                  <div class="stat-trend positive"><i class="fa-solid fa-arrow-trend-up"></i> +14% this week</div>
                </div>
              </div>
              <div class="stat-card glass-panel">
                <div class="stat-icon" style="color: #10b981"><i class="fa-solid fa-chart-line"></i></div>
                <div class="stat-details">
                  <div class="stat-label">Active Sessions</div>
                  <div class="stat-number">3,244</div>
                  <div class="stat-trend positive"><i class="fa-solid fa-arrow-trend-up"></i> +5% this week</div>
                </div>
              </div>
              <div class="stat-card glass-panel accent-glow">
                <div class="stat-icon" style="color: #fff"><i class="fa-solid fa-wallet"></i></div>
                <div class="stat-details">
                  <div class="stat-label" style="color: rgba(255,255,255,0.8)">Monthly Revenue</div>
                  <div class="stat-number" style="color: #fff">$42,500</div>
                  <div class="stat-trend" style="color: rgba(255,255,255,0.9)"><i class="fa-solid fa-bolt"></i> Peak Performance</div>
                </div>
              </div>
            </div>`;
        } else if (comp.type === 'chart') {
          componentsHtml += `
            <div class="card glass-panel fade-in delay-1">
              <div class="card-header">
                <h3><i class="fa-solid fa-chart-column"></i> Analytics Overview</h3>
                <button class="btn-icon"><i class="fa-solid fa-ellipsis-vertical"></i></button>
              </div>
              <div class="chart-container">
                <div class="chart-bars">
                  <div class="bar-wrapper"><div class="bar" style="height:40%"></div><span>Mon</span></div>
                  <div class="bar-wrapper"><div class="bar" style="height:65%"></div><span>Tue</span></div>
                  <div class="bar-wrapper"><div class="bar" style="height:45%"></div><span>Wed</span></div>
                  <div class="bar-wrapper"><div class="bar" style="height:90%"></div><span>Thu</span></div>
                  <div class="bar-wrapper"><div class="bar" style="height:70%"></div><span>Fri</span></div>
                  <div class="bar-wrapper"><div class="bar" style="height:55%"></div><span>Sat</span></div>
                  <div class="bar-wrapper"><div class="bar" style="height:85%"></div><span>Sun</span></div>
                </div>
              </div>
            </div>`;
        } else if (comp.type === 'table') {
          const columns = comp.columns || ['ID', 'Name', 'Status', 'Date'];
          componentsHtml += `
            <div class="card glass-panel fade-in delay-2">
              <div class="card-header">
                <h3><i class="fa-solid fa-table-list"></i> ${comp.dataSource || 'Data Records'}</h3>
                <button class="btn-primary" onclick="alert('Action Triggered')"><i class="fa-solid fa-plus"></i> Add New</button>
              </div>
              <div class="table-responsive">
                <table class="data-table">
                  <thead><tr>${columns.map(c => `<th>${c}</th>`).join('')}<th>Actions</th></tr></thead>
                  <tbody>
                    <tr>${columns.map((c,i) => `<td>${i===0?'#1001':i===columns.length-1?'<span class="badge success">Active</span>':'Premium User'}</td>`).join('')}
                      <td><button class="btn-icon"><i class="fa-solid fa-pen"></i></button> <button class="btn-icon danger"><i class="fa-solid fa-trash"></i></button></td></tr>
                    <tr>${columns.map((c,i) => `<td>${i===0?'#1002':i===columns.length-1?'<span class="badge warning">Pending</span>':'Standard User'}</td>`).join('')}
                      <td><button class="btn-icon"><i class="fa-solid fa-pen"></i></button> <button class="btn-icon danger"><i class="fa-solid fa-trash"></i></button></td></tr>
                    <tr>${columns.map((c,i) => `<td>${i===0?'#1003':i===columns.length-1?'<span class="badge success">Active</span>':'Admin User'}</td>`).join('')}
                      <td><button class="btn-icon"><i class="fa-solid fa-pen"></i></button> <button class="btn-icon danger"><i class="fa-solid fa-trash"></i></button></td></tr>
                  </tbody>
                </table>
              </div>
            </div>`;
        } else if (comp.type === 'form') {
          const fields = comp.fields || [];
          componentsHtml += `
            <div class="card glass-panel fade-in delay-1">
              <div class="card-header">
                <h3><i class="fa-solid fa-pen-to-square"></i> ${comp.id || 'Input Form'}</h3>
              </div>
              <form id="${comp.id}" class="modern-form" onsubmit="handleFormSubmit(event, '${comp.action || '/api/submit'}')">
                <div class="form-grid">
                  ${fields.map(f => `
                    <div class="form-group ${f.type === 'textarea' ? 'full-width' : ''}">
                      <label>${f.label || f.name}</label>
                      <div class="input-wrapper">
                        ${f.type === 'textarea' ? `<textarea name="${f.name}" placeholder="Type here..." ${f.required?'required':''}></textarea>` :
                          f.type === 'select' ? `<select name="${f.name}">${(f.options||['Option 1','Option 2']).map(o=>`<option>${o}</option>`).join('')}</select>` :
                          `<input type="${f.type === 'string' ? 'text' : (f.type||'text')}" name="${f.name}" placeholder="Enter ${f.label||f.name}" ${f.required?'required':''}>`}
                      </div>
                    </div>`).join('')}
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn-primary"><i class="fa-solid fa-paper-plane"></i> Submit Data</button>
                </div>
              </form>
            </div>`;
        } else if (comp.type === 'hero' || comp.type === 'card') {
          componentsHtml += `
            <div class="hero-section fade-in">
              <div class="hero-content">
                <h1 class="hero-title">${page.title || page.name}</h1>
                <p class="hero-subtitle">Your AI-generated application is ready. Experience the premium UI.</p>
                <div class="hero-actions">
                  <button class="btn-primary" onclick="alert('Welcome!')">Get Started</button>
                  <button class="btn-secondary">View Documentation</button>
                </div>
              </div>
              <div class="hero-decoration"></div>
            </div>`;
        } else if (comp.type !== 'modal') {
          componentsHtml += `<div class="card glass-panel fade-in delay-1"><h3><i class="fa-solid fa-layer-group"></i> ${comp.type} component</h3><p class="text-muted">${comp.id}</p></div>`;
        }
      });

      if (!componentsHtml) {
        componentsHtml = `
          <div class="empty-state fade-in">
            <div class="empty-icon"><i class="fa-solid fa-box-open"></i></div>
            <h2>${page.title || page.name}</h2>
            <p>This page is ready for content.</p>
          </div>`;
      }

      const pageSlug = (page.path || '/').replace(/\//g, '') || 'home';
      pagesHtml += `
        <div id="page-${pageSlug}" class="page-view" style="display: none;">
          <header class="topbar fade-in">
            <div class="page-title">
              <h2>${page.title || page.name}</h2>
              ${page.authRequired ? '<span class="badge warning"><i class="fa-solid fa-lock"></i> Protected Route</span>' : ''}
            </div>
            <div class="topbar-actions">
              <div class="search-bar">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" placeholder="Search...">
              </div>
              <button class="btn-icon"><i class="fa-solid fa-bell"></i></button>
            </div>
          </header>
          <div class="page-content">${componentsHtml}</div>
        </div>`;
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <!-- FontAwesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root { 
      --primary: ${primary};
      --primary-glow: ${primary}40;
      --bg: ${isDark ? '#09090b' : '#f8fafc'};
      --surface: ${isDark ? 'rgba(24, 24, 27, 0.6)' : 'rgba(255, 255, 255, 0.7)'};
      --border: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
      --text: ${isDark ? '#f8fafc' : '#0f172a'};
      --text-muted: ${isDark ? '#94a3b8' : '#64748b'};
      --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Outfit', sans-serif; }
    
    body { 
      background-color: var(--bg);
      background-image: 
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
        radial-gradient(at 100% 100%, ${primary}15 0px, transparent 50%);
      background-attachment: fixed;
      color: var(--text);
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* Glassmorphism Utilities */
    .glass-panel {
      background: var(--surface);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      box-shadow: var(--glass-shadow);
      border-radius: 16px;
    }

    /* Animations */
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse-bar {
      0% { opacity: 0.8; }
      50% { opacity: 1; filter: brightness(1.2); }
      100% { opacity: 0.8; }
    }
    .fade-in { animation: fadeSlideUp 0.6s ease-out forwards; opacity: 0; }
    .delay-1 { animation-delay: 0.1s; }
    .delay-2 { animation-delay: 0.2s; }

    /* Layout */
    .sidebar { width: 260px; display: flex; flex-direction: column; margin: 16px; height: calc(100vh - 32px); padding: 24px; }
    .logo { font-size: 1.5rem; font-weight: 700; color: var(--text); margin-bottom: 2rem; display: flex; align-items: center; gap: 10px; }
    .logo i { color: var(--primary); }
    
    .nav-links { list-style: none; flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .nav-item { 
      color: var(--text-muted); text-decoration: none; padding: 12px 16px; 
      border-radius: 12px; display: flex; align-items: center; gap: 12px; 
      transition: all 0.3s ease; font-weight: 500; 
    }
    .nav-item:hover { background: rgba(255,255,255,0.05); color: var(--text); transform: translateX(4px); }
    .nav-item.active { background: var(--primary); color: white; box-shadow: 0 4px 12px var(--primary-glow); }
    
    .user-profile { display: flex; align-items: center; gap: 12px; padding-top: 16px; border-top: 1px solid var(--border); }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
    .user-details { display: flex; flex-direction: column; }
    .user-name { font-weight: 600; font-size: 0.95rem; }
    .user-role { font-size: 0.8rem; color: var(--text-muted); }

    .main-wrapper { flex: 1; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
    
    /* Topbar */
    .topbar { padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; }
    .page-title h2 { font-size: 1.8rem; font-weight: 600; letter-spacing: -0.5px; display: flex; align-items: center; gap: 12px;}
    .topbar-actions { display: flex; align-items: center; gap: 16px; }
    .search-bar { background: var(--surface); border: 1px solid var(--border); padding: 8px 16px; border-radius: 20px; display: flex; align-items: center; gap: 8px; }
    .search-bar input { background: transparent; border: none; color: var(--text); outline: none; font-family: inherit; }
    .search-bar i { color: var(--text-muted); }

    .page-content { flex: 1; overflow-y: auto; padding: 0 32px 32px 32px; }

    /* UI Components */
    .card { padding: 24px; margin-bottom: 24px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .card-header h3 { font-size: 1.2rem; font-weight: 600; display: flex; align-items: center; gap: 10px; }
    .card-header h3 i { color: var(--primary); }

    /* Buttons */
    .btn-primary { background: linear-gradient(135deg, var(--primary), #8b5cf6); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px var(--primary-glow); display: flex; align-items: center; gap: 8px; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 16px var(--primary-glow); filter: brightness(1.1); }
    .btn-secondary { background: transparent; border: 1px solid var(--border); color: var(--text); padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-secondary:hover { background: rgba(255,255,255,0.05); }
    .btn-icon { background: transparent; border: none; color: var(--text-muted); width: 36px; height: 36px; border-radius: 8px; cursor: pointer; transition: 0.2s; font-size: 1.1rem;}
    .btn-icon:hover { background: rgba(255,255,255,0.1); color: var(--text); }
    .btn-icon.danger:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

    /* Stats Grid */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 24px; }
    .stat-card { padding: 24px; display: flex; align-items: center; gap: 20px; transition: transform 0.3s; }
    .stat-card:hover { transform: translateY(-5px); }
    .stat-icon { width: 56px; height: 56px; border-radius: 16px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
    .stat-label { font-size: 0.9rem; color: var(--text-muted); font-weight: 500;}
    .stat-number { font-size: 2rem; font-weight: 700; margin: 4px 0; }
    .stat-trend { font-size: 0.85rem; font-weight: 500; display: flex; align-items: center; gap: 4px; }
    .stat-trend.positive { color: #10b981; }
    .stat-card.accent-glow { background: linear-gradient(135deg, var(--primary), #8b5cf6); border: none; }
    .stat-card.accent-glow .stat-icon { background: rgba(255,255,255,0.2); }

    /* Chart */
    .chart-container { height: 250px; border-top: 1px solid var(--border); margin-top: 20px; padding-top: 20px; }
    .chart-bars { display: flex; align-items: flex-end; justify-content: space-around; height: 100%; }
    .bar-wrapper { display: flex; flex-direction: column; align-items: center; gap: 10px; height: 100%; justify-content: flex-end; width: 10%; }
    .bar { width: 100%; background: linear-gradient(to top, var(--primary), #a855f7); border-radius: 6px; animation: pulse-bar 3s infinite ease-in-out alternate; }
    .bar-wrapper span { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }

    /* Table */
    .table-responsive { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 16px; text-align: left; border-bottom: 1px solid var(--border); }
    .data-table th { color: var(--text-muted); font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; }
    .data-table tbody tr { transition: background 0.2s; }
    .data-table tbody tr:hover { background: rgba(255,255,255,0.02); }
    
    /* Badges */
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;}
    .badge.success { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .badge.warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

    /* Forms */
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { font-weight: 500; font-size: 0.9rem; color: var(--text-muted); }
    .input-wrapper input, .input-wrapper select, .input-wrapper textarea { width: 100%; padding: 12px 16px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text); font-family: inherit; font-size: 0.95rem; transition: all 0.3s; }
    .input-wrapper input:focus, .input-wrapper select:focus, .input-wrapper textarea:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); background: rgba(0,0,0,0.4); }
    .input-wrapper textarea { min-height: 120px; resize: vertical; }
    .form-actions { display: flex; justify-content: flex-end; border-top: 1px solid var(--border); padding-top: 20px; }

    /* Hero Component */
    .hero-section { position: relative; padding: 60px 40px; border-radius: 24px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2)); border: 1px solid rgba(255,255,255,0.1); margin-bottom: 32px; overflow: hidden; }
    .hero-content { position: relative; z-index: 2; max-width: 600px; }
    .hero-title { font-size: 3rem; font-weight: 700; margin-bottom: 16px; line-height: 1.2; background: linear-gradient(to right, #fff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero-subtitle { font-size: 1.1rem; color: var(--text-muted); margin-bottom: 32px; line-height: 1.6; }
    .hero-actions { display: flex; gap: 16px; }
    .hero-decoration { position: absolute; right: -10%; top: -50%; width: 500px; height: 500px; background: radial-gradient(circle, var(--primary) 0%, transparent 70%); opacity: 0.2; filter: blur(40px); z-index: 1; animation: pulse-bar 8s infinite alternate; }

    /* Empty State */
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center; color: var(--text-muted); }
    .empty-icon { font-size: 4rem; color: var(--border); margin-bottom: 24px; }
    .empty-state h2 { font-size: 1.5rem; color: var(--text); margin-bottom: 8px; }
  </style>
</head>
<body>
  ${navHtml}
  <main class="main-wrapper">
    ${pagesHtml}
  </main>
  
  <script>
    const schemas = ${JSON.stringify(schemas)};
    
    // Premium Navigation Logic
    function navigateTo(path, element) {
      // Hide all pages
      document.querySelectorAll('.page-view').forEach(el => {
        el.style.display = 'none';
        // Reset animations by cloning the element
        const newEl = el.cloneNode(true);
        el.parentNode.replaceChild(newEl, el);
      });
      
      // Update active state in sidebar
      document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
      if (element) {
        element.classList.add('active');
      }
      
      // Show target page
      const slug = (path||'').replace(/\\//g,'') || 'home';
      const page = document.getElementById('page-' + slug);
      if (page) {
        page.style.display = 'block';
      } else { 
        const first = document.querySelector('.page-view'); 
        if(first) first.style.display = 'block'; 
      }
    }

    // Initialize first page
    window.addEventListener('DOMContentLoaded', () => {
      navigateTo(schemas.ui.pages[0]?.path || '/');
      const firstNav = document.querySelector('.nav-item');
      if(firstNav) firstNav.classList.add('active');
    });

    // Form Handling
    function handleFormSubmit(e, action) {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      
      // Loading State
      btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
      btn.style.opacity = '0.7';
      
      setTimeout(() => {
        const data = Object.fromEntries(new FormData(e.target).entries());
        alert('✅ API Request to: ' + action + '\\n\\nPayload:\\n' + JSON.stringify(data, null, 2));
        e.target.reset();
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Success!';
        btn.style.background = '#10b981';
        
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
          btn.style.opacity = '1';
        }, 2000);
      }, 800);
    }
  </script>
</body>
</html>`;
  }
}

module.exports = AppGenerator;
