/* ============================================
   GRAPHICA — Evacuation Map Module
   SVG-based floor plan with interactive markers
   ============================================ */

const Maps = (() => {

  let activePopup = null;

  // ── Student Map View ──────────────────
  function render(container) {
    const markers = Storage.getData(Storage.KEYS.MAPS, []);

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Evacuation map</h1>
        <p class="page-subtitle">Block A — Ground floor plan with emergency facilities</p>
      </div>

      <div class="card" style="padding:0;overflow:hidden;">
        <div class="map-container" id="map-container" onclick="Maps.closePopup(event)">
          ${renderFloorPlanSVG(markers)}
          <div id="map-popup" class="map-marker-popup hidden" style="display:none;"></div>
        </div>
        <div class="map-legend">
          <div class="map-legend-item">
            <div class="map-legend-dot" style="background:var(--red);"></div>
            <span>Emergency exit</span>
          </div>
          <div class="map-legend-item">
            <div class="map-legend-dot" style="background:var(--blue);"></div>
            <span>Staircase</span>
          </div>
          <div class="map-legend-item">
            <div class="map-legend-dot" style="background:var(--green);"></div>
            <span>Assembly point</span>
          </div>
          <div class="map-legend-item">
            <div class="map-legend-dot" style="background:var(--orange);"></div>
            <span>Fire extinguisher</span>
          </div>
          <div class="map-legend-item">
            <div class="map-legend-dot" style="background:var(--amber);"></div>
            <span>First aid</span>
          </div>
        </div>
      </div>
    `;
    App.refreshIcons();
  }

  function renderFloorPlanSVG(markers) {
    // Create an SVG floor plan
    return `
      <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
        <!-- Background -->
        <rect x="0" y="0" width="800" height="500" fill="#FAFAF8"/>

        <!-- Building Outline -->
        <rect x="60" y="40" width="680" height="380" fill="none" stroke="#D8D5CE" stroke-width="2" rx="4"/>

        <!-- Corridor (horizontal) -->
        <rect x="60" y="180" width="680" height="60" fill="#EFEEE8" stroke="#D8D5CE" stroke-width="1"/>
        <text x="400" y="215" text-anchor="middle" font-size="11" fill="#9B9890" font-family="Inter, sans-serif">Main Corridor</text>

        <!-- Rooms — Top Row -->
        <rect x="80" y="60" width="140" height="100" fill="#FFFFFF" stroke="#D8D5CE" stroke-width="1" rx="2"/>
        <text x="150" y="115" text-anchor="middle" font-size="11" fill="#6B6963" font-family="Inter, sans-serif">Room 101</text>

        <rect x="240" y="60" width="140" height="100" fill="#FFFFFF" stroke="#D8D5CE" stroke-width="1" rx="2"/>
        <text x="310" y="115" text-anchor="middle" font-size="11" fill="#6B6963" font-family="Inter, sans-serif">Room 102</text>

        <rect x="400" y="60" width="140" height="100" fill="#FFFFFF" stroke="#D8D5CE" stroke-width="1" rx="2"/>
        <text x="470" y="115" text-anchor="middle" font-size="11" fill="#6B6963" font-family="Inter, sans-serif">Room 103</text>

        <rect x="560" y="60" width="160" height="100" fill="#FFFFFF" stroke="#D8D5CE" stroke-width="1" rx="2"/>
        <text x="640" y="115" text-anchor="middle" font-size="11" fill="#6B6963" font-family="Inter, sans-serif">Room 104</text>

        <!-- Rooms — Bottom Row -->
        <rect x="80" y="260" width="140" height="100" fill="#FFFFFF" stroke="#D8D5CE" stroke-width="1" rx="2"/>
        <text x="150" y="315" text-anchor="middle" font-size="11" fill="#6B6963" font-family="Inter, sans-serif">Room 105</text>

        <rect x="240" y="260" width="140" height="100" fill="#FFFFFF" stroke="#D8D5CE" stroke-width="1" rx="2"/>
        <text x="310" y="315" text-anchor="middle" font-size="11" fill="#6B6963" font-family="Inter, sans-serif">Lab A</text>

        <rect x="400" y="260" width="140" height="100" fill="#FFFFFF" stroke="#D8D5CE" stroke-width="1" rx="2"/>
        <text x="470" y="315" text-anchor="middle" font-size="11" fill="#6B6963" font-family="Inter, sans-serif">Lab B</text>

        <rect x="560" y="260" width="160" height="100" fill="#FFFFFF" stroke="#D8D5CE" stroke-width="1" rx="2"/>
        <text x="640" y="315" text-anchor="middle" font-size="11" fill="#6B6963" font-family="Inter, sans-serif">Office</text>

        <!-- Washrooms -->
        <rect x="80" y="380" width="80" height="30" fill="#F0F0EC" stroke="#D8D5CE" stroke-width="1" rx="2"/>
        <text x="120" y="400" text-anchor="middle" font-size="9" fill="#9B9890" font-family="Inter, sans-serif">Washroom</text>

        <!-- Reception -->
        <rect x="340" y="380" width="120" height="30" fill="#F0F0EC" stroke="#D8D5CE" stroke-width="1" rx="2"/>
        <text x="400" y="400" text-anchor="middle" font-size="9" fill="#9B9890" font-family="Inter, sans-serif">Reception</text>

        <!-- Building Label -->
        <text x="400" y="450" text-anchor="middle" font-size="14" font-weight="600" fill="#242424" font-family="Inter, sans-serif">Block A — Ground Floor</text>
        <text x="400" y="470" text-anchor="middle" font-size="10" fill="#9B9890" font-family="Inter, sans-serif">Greenfield Institute of Technology</text>

        <!-- Markers -->
        ${markers.map(m => renderMarkerSVG(m)).join('')}
      </svg>
    `;
  }

  function renderMarkerSVG(marker) {
    const colorMap = {
      exit: '#C62828',
      staircase: '#2E6BA4',
      assembly: '#3E7A48',
      extinguisher: '#E36B2C',
      firstaid: '#D5A33A'
    };
    const iconMap = {
      exit: '→',
      staircase: '⇡',
      assembly: '▲',
      extinguisher: '⊕',
      firstaid: '+'
    };

    const color = colorMap[marker.type] || '#6B6963';
    const iconChar = iconMap[marker.type] || '•';

    // Convert percentage positions to SVG coordinates
    const x = (marker.x / 100) * 800;
    const y = (marker.y / 100) * 500;

    return `
      <g class="map-marker" onclick="event.stopPropagation(); Maps.showPopup('${marker.id}', ${x}, ${y})" style="cursor:pointer;">
        <circle cx="${x}" cy="${y}" r="12" fill="${color}" opacity="0.15"/>
        <circle cx="${x}" cy="${y}" r="8" fill="${color}"/>
        <text x="${x}" y="${y + 3}" text-anchor="middle" font-size="8" fill="white" font-weight="bold" font-family="Inter, sans-serif">${iconChar}</text>
      </g>
    `;
  }

  function showPopup(markerId, x, y) {
    const markers = Storage.getData(Storage.KEYS.MAPS, []);
    const marker = markers.find(m => m.id === markerId);
    if (!marker) return;

    const popup = document.getElementById('map-popup');
    if (!popup) return;

    const container = document.getElementById('map-container');
    const rect = container.getBoundingClientRect();

    // Position popup near marker
    let left = (x / 800) * rect.width;
    let top = (y / 500) * rect.height;

    // Adjust if too close to edges
    if (left + 240 > rect.width) left = rect.width - 250;
    if (left < 10) left = 10;
    if (top + 150 > rect.height) top -= 120;

    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
    popup.style.display = 'block';
    popup.classList.remove('hidden');

    const typeLabels = {
      exit: 'Emergency Exit',
      staircase: 'Staircase',
      assembly: 'Assembly Point',
      extinguisher: 'Fire Extinguisher',
      firstaid: 'First Aid Kit'
    };

    popup.innerHTML = `
      <div style="font-weight:600;margin-bottom:var(--sp-2);">${App.escapeHtml(marker.label)}</div>
      <div class="badge badge-neutral mb-2">${typeLabels[marker.type] || marker.type}</div>
      <p style="font-size:var(--text-xs);line-height:1.5;color:var(--text-secondary);">${App.escapeHtml(marker.instructions)}</p>
      <button class="btn btn-ghost btn-sm mt-2" onclick="Maps.closePopup(event)" style="font-size:var(--text-xs);">Close</button>
    `;

    activePopup = markerId;
  }

  function closePopup(event) {
    if (event) event.stopPropagation();
    const popup = document.getElementById('map-popup');
    if (popup) {
      popup.style.display = 'none';
      popup.classList.add('hidden');
    }
    activePopup = null;
  }

  // ── Admin Map View ────────────────────
  function renderAdmin(container) {
    const markers = Storage.getData(Storage.KEYS.MAPS, []);

    container.innerHTML = `
      <div class="page-header">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="page-title">Evacuation maps</h1>
            <p class="page-subtitle">Manage floor plans and emergency markers</p>
          </div>
          <div class="flex gap-3">
            <button class="btn btn-secondary" onclick="Maps.uploadFloorPlan()">
              ${App.icon('upload', 16)} Upload floor plan
            </button>
            <button class="btn btn-primary" onclick="Maps.addMarker()">
              ${App.icon('plus', 16)} Add marker
            </button>
          </div>
        </div>
      </div>

      <div class="card mb-4" style="padding:0;overflow:hidden;">
        <div class="map-container" id="map-container" onclick="Maps.closePopup(event)">
          ${renderFloorPlanSVG(markers)}
          <div id="map-popup" class="map-marker-popup hidden" style="display:none;"></div>
        </div>
        <div class="map-legend">
          <div class="map-legend-item"><div class="map-legend-dot" style="background:var(--red);"></div><span>Emergency exit</span></div>
          <div class="map-legend-item"><div class="map-legend-dot" style="background:var(--blue);"></div><span>Staircase</span></div>
          <div class="map-legend-item"><div class="map-legend-dot" style="background:var(--green);"></div><span>Assembly point</span></div>
          <div class="map-legend-item"><div class="map-legend-dot" style="background:var(--orange);"></div><span>Fire extinguisher</span></div>
          <div class="map-legend-item"><div class="map-legend-dot" style="background:var(--amber);"></div><span>First aid</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Markers (${markers.length})</h3>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead><tr><th>Label</th><th>Type</th><th>Position</th><th>Action</th></tr></thead>
            <tbody>
              ${markers.map(m => `
                <tr>
                  <td style="font-weight:500;">${App.escapeHtml(m.label)}</td>
                  <td>${App.capitalize(m.type)}</td>
                  <td class="text-xs">(${m.x}%, ${m.y}%)</td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="Maps.deleteMarker('${m.id}')" style="color:var(--red);">Remove</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    App.refreshIcons();
  }

  function addMarker() {
    App.showModal({
      title: 'Add map marker',
      body: `
        <div class="form-group">
          <label class="form-label">Label</label>
          <input class="form-input" id="marker-label" placeholder="e.g., Emergency Exit — North Wing">
        </div>
        <div class="form-group">
          <label class="form-label">Type</label>
          <select class="form-select" id="marker-type">
            <option value="exit">Emergency Exit</option>
            <option value="staircase">Staircase</option>
            <option value="assembly">Assembly Point</option>
            <option value="extinguisher">Fire Extinguisher</option>
            <option value="firstaid">First Aid</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">X Position (%)</label>
            <input class="form-input" type="number" id="marker-x" min="0" max="100" value="50">
          </div>
          <div class="form-group">
            <label class="form-label">Y Position (%)</label>
            <input class="form-input" type="number" id="marker-y" min="0" max="100" value="50">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Instructions</label>
          <textarea class="form-textarea" id="marker-instructions" placeholder="Instructions for this location…"></textarea>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Maps.saveMarker()">Add marker</button>
      `
    });
  }

  function saveMarker() {
    const label = document.getElementById('marker-label')?.value?.trim();
    const type = document.getElementById('marker-type')?.value;
    const x = parseInt(document.getElementById('marker-x')?.value);
    const y = parseInt(document.getElementById('marker-y')?.value);
    const instructions = document.getElementById('marker-instructions')?.value?.trim();

    if (!label) {
      App.showToast('Please enter a label.', 'error');
      return;
    }

    const markers = Storage.getData(Storage.KEYS.MAPS, []);
    markers.push({
      id: 'marker-' + Date.now(),
      type,
      label,
      x: x || 50,
      y: y || 50,
      floor: 'ground',
      building: 'block-a',
      instructions: instructions || ''
    });
    Storage.saveData(Storage.KEYS.MAPS, markers);
    App.closeModal();
    App.showToast('Marker added.', 'success');
    renderAdmin(document.getElementById('main-view'));
  }

  function deleteMarker(id) {
    const markers = Storage.getData(Storage.KEYS.MAPS, []);
    const filtered = markers.filter(m => m.id !== id);
    Storage.saveData(Storage.KEYS.MAPS, filtered);
    App.showToast('Marker removed.', 'success');
    renderAdmin(document.getElementById('main-view'));
  }

  function uploadFloorPlan() {
    App.showModal({
      title: 'Upload floor plan',
      body: `
        <p class="text-small mb-4">Upload a custom floor plan image. Supported formats: JPG, PNG, WebP.</p>
        <div class="file-upload" onclick="document.getElementById('floorplan-file').click()">
          <input type="file" id="floorplan-file" accept=".jpg,.jpeg,.png,.webp" onchange="Maps.handleFloorPlanUpload(event)">
          <div class="upload-icon">${App.icon('image', 24)}</div>
          <div class="upload-text">Click to select a floor plan image</div>
          <div class="upload-hint">JPG, PNG, or WebP</div>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      `
    });
    App.refreshIcons();
  }

  function handleFloorPlanUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      App.showToast('Invalid file type.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      // Store the floor plan (note: large images may exceed localStorage limits)
      try {
        Storage.saveData('graphica_floorplan', e.target.result);
        App.showToast('Floor plan uploaded.', 'success');
        App.closeModal();
      } catch (err) {
        App.showToast('Image too large for localStorage. Use a smaller image.', 'error');
      }
    };
    reader.readAsDataURL(file);
  }

  return {
    render,
    renderAdmin,
    showPopup,
    closePopup,
    addMarker,
    saveMarker,
    deleteMarker,
    uploadFloorPlan,
    handleFloorPlanUpload
  };
})();
