let appData;
let selectedMinute = 30;
let map;

const REGION_KEYS = ['pangyo', 'cheongna'];
const layerState = { land: true, buildings: true, oa: true, iso: true, stations: true };
const layers = {};
const fmt = new Intl.NumberFormat('ko-KR');

const pct = (v) => `${Number(v || 0).toFixed(1)}%`;
const num = (v) => fmt.format(Math.round(Number(v || 0)));
const fixed = (v, d = 1) => fmt.format(Number(v || 0).toFixed(d));
const km2 = (v) => `${Number(v || 0).toFixed(2)}km2`;
const m2 = (v) => `${num(v)}m2`;

function region(key) {
  return appData.regions[key];
}

function colorFor(key) {
  return region(key).color;
}

function maxOf(values) {
  return Math.max(1, ...values.map((v) => Number(v || 0)));
}

function popupGrid(title, rows) {
  return `<div class="popup-title">${title}</div><div class="popup-grid">${rows.map(([k, v]) => `<span>${k}</span><strong>${v}</strong>`).join('')}</div>`;
}

function buildingColor(use) {
  if (use === '업무시설') return '#2563eb';
  if (use === '공동주택' || use === '단독주택') return '#16a34a';
  if (use && use.includes('근린생활')) return '#f59e0b';
  if (use === '공장' || use === '창고시설') return '#7c3aed';
  if (use === '교육연구시설') return '#0f766e';
  return '#64748b';
}

function renderMetric(label, values, formatter = num, sub = '') {
  return `<div class="metric">
    <div class="label">${label}</div>
    <div class="compare-values">
      ${REGION_KEYS.map((key) => `<div><span>${region(key).label}</span><strong>${formatter(values[key])}</strong></div>`).join('')}
    </div>
    ${sub ? `<div class="sub">${sub}</div>` : ''}
  </div>`;
}

function renderCard(label, values, formatter = num, sub = '') {
  return `<div class="card">
    <div class="label">${label}</div>
    <div class="compare-values large">
      ${REGION_KEYS.map((key) => `<div><span>${region(key).label}</span><strong>${formatter(values[key])}</strong></div>`).join('')}
    </div>
    ${sub ? `<div class="sub">${sub}</div>` : ''}
  </div>`;
}

function compareTable(rows) {
  return `<div class="compare-table">
    <div class="compare-row head"><div>지표</div><div>판교</div><div>청라</div></div>
    ${rows.map((row) => `<div class="compare-row"><div>${row.label}</div><div>${row.pangyo}</div><div>${row.cheongna}</div></div>`).join('')}
  </div>`;
}

function barRows(items, color = '#2563eb') {
  const max = maxOf(items.map((item) => item.value));
  return items.map((item) => {
    const width = Math.max(3, Number(item.value || 0) / max * 100);
    return `<div class="bar-row">
      <span class="bar-label" title="${item.label}">${item.label}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${width}%;background:${color}"></span></span>
      <strong>${item.display || pct(item.value)}</strong>
    </div>`;
  }).join('');
}

function compositionBars(data, key) {
  const entries = (Array.isArray(data)
    ? data.map((item) => ({
      label: item.name || item.label || '-',
      value: Number(item.share ?? item.value ?? 0),
      display: item.share != null ? pct(item.share) : pct(item.value)
    }))
    : Object.entries(data || {}).map(([label, value]) => ({
      label,
      value: Number(value || 0),
      display: pct(value)
    })))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  return barRows(entries, colorFor(key));
}

function chartPair(leftTitle, leftHtml, rightTitle, rightHtml) {
  return `<div class="chart-pair">
    <div class="compare-column"><h4>${leftTitle}</h4>${leftHtml}</div>
    <div class="compare-column"><h4>${rightTitle}</h4>${rightHtml}</div>
  </div>`;
}

function dualBars(rows) {
  const max = maxOf(rows.flatMap((row) => [row.pangyo, row.cheongna]));
  return `<div class="dual-bars">${rows.map((row) => `
    <div class="dual-row">
      <div class="dual-label">${row.label}</div>
      ${REGION_KEYS.map((key) => {
        const width = Math.max(3, Number(row[key] || 0) / max * 100);
        return `<div class="dual-city"><span>${region(key).label}</span><span class="bar-track"><span class="bar-fill" style="width:${width}%;background:${colorFor(key)}"></span></span><strong>${row.formatter ? row.formatter(row[key]) : num(row[key])}</strong></div>`;
      }).join('')}
    </div>
  `).join('')}</div>`;
}

function listItems(items) {
  return `<div class="list">${items.map((item) => `<div class="list-item"><strong>${item.title}</strong><span>${item.sub}</span></div>`).join('')}</div>`;
}

function curvePoints(curve) {
  return (curve || []).map((d) => ({ minute: Number(d.minute), workers: Number(d.workers || 0) }));
}

function lineChart() {
  const width = 360;
  const height = 180;
  const pad = 28;
  const curves = Object.fromEntries(REGION_KEYS.map((key) => [key, curvePoints(region(key).accessibility.curve)]));
  const allWorkers = REGION_KEYS.flatMap((key) => curves[key].map((d) => d.workers));
  const maxY = maxOf(allWorkers);
  const minutes = [0, 15, 30, 45, 60];
  const x = (m) => pad + (m / 60) * (width - pad * 1.5);
  const y = (v) => height - pad - (v / maxY) * (height - pad * 1.5);
  const path = (items) => items.map((d, i) => `${i ? 'L' : 'M'}${x(d.minute)},${y(d.workers)}`).join(' ');

  return `<div class="line-chart">
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="접근 시간별 누적 종사자 비교">
      ${minutes.map((m) => `<line x1="${x(m)}" x2="${x(m)}" y1="${pad / 2}" y2="${height - pad}" stroke="#edf1f7"/><text x="${x(m)}" y="${height - 6}" text-anchor="middle" font-size="10" fill="#667085">${m}</text>`).join('')}
      <line x1="${pad}" x2="${width - 14}" y1="${height - pad}" y2="${height - pad}" stroke="#cbd5e1"/>
      ${REGION_KEYS.map((key) => `<path d="${path(curves[key])}" fill="none" stroke="${colorFor(key)}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
      ${REGION_KEYS.map((key) => curves[key].map((d) => `<circle cx="${x(d.minute)}" cy="${y(d.workers)}" r="3.5" fill="${colorFor(key)}"/>`).join('')).join('')}
    </svg>
    <div class="legend-note">
      ${REGION_KEYS.map((key) => `<span><i style="background:${colorFor(key)}"></i>${region(key).label}</span>`).join('')}
    </div>
  </div>`;
}

function initMap() {
  map = L.map('map', { zoomControl: false }).setView([37.47, 126.87], 10);
  L.control.zoom({ position: 'bottomleft' }).addTo(map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  layers.land = L.geoJSON(appData.boundaries, {
    style: (f) => ({ color: f.properties.color, weight: 3, fillColor: f.properties.color, fillOpacity: 0.08 }),
    onEachFeature: (f, layer) => {
      const r = region(f.properties.key);
      layer.bindPopup(popupGrid(r.label, [
        ['역할', r.role],
        ['분석면적', km2(r.areaKm2)],
        ['집계구', `${r.oaCount}개`],
        ['인구', `${num(r.population)}명`],
        ['종사자', `${num(r.workers)}명`]
      ]));
    }
  }).addTo(map);

  layers.buildings = L.geoJSON(appData.buildings, {
    style: (f) => ({
      color: buildingColor(f.properties.use),
      weight: 1.1,
      fillColor: buildingColor(f.properties.use),
      fillOpacity: 0.55
    }),
    onEachFeature: (f, layer) => {
      const p = f.properties;
      layer.bindPopup(popupGrid(p.name || p.use || '건축물', [
        ['지역', p.region],
        ['주용도', p.use],
        ['지번', p.lotNo || '-'],
        ['건축면적', m2(p.buildingArea)],
        ['연면적', m2(p.floorArea)],
        ['용적률', pct(p.far)],
        ['건폐율', pct(p.coverage)],
        ['사용승인', p.approvalDate || '-']
      ]));
    }
  }).addTo(map);

  layers.oa = L.geoJSON(appData.oa, {
    filter: (f) => f.properties.pangyo_minutes <= 60 || f.properties.cheongna_minutes <= 60,
    style: (f) => ({
      color: '#ffffff',
      weight: 0.5,
      fillColor: oaColor(f),
      fillOpacity: 0.22
    }),
    onEachFeature: (f, layer) => {
      const p = f.properties;
      layer.bindPopup(popupGrid('집계구', [
        ['인구', `${num(p.pop)}명`],
        ['종사자', `${num(p.workers)}명`],
        ['면적', km2(p.area_km2)],
        ['판교 접근', `${p.pangyo_minutes}분`],
        ['청라 접근', `${p.cheongna_minutes}분`]
      ]));
    }
  }).addTo(map);

  refreshIsoLayer();

  layers.stations = L.geoJSON(appData.stations, {
    pointToLayer: (f, latlng) => L.circleMarker(latlng, stationStyle(f)),
    onEachFeature: (f, layer) => {
      const p = f.properties;
      layer.bindPopup(popupGrid(p.name, [
        ['노선', p.line || '-']
      ]));
    }
  }).addTo(map);

  Object.values(layers).forEach((layer) => layer.bringToFront && layer.bringToFront());
  layers.land.bringToFront();
  layers.stations.bringToFront();
}

function oaColor(f) {
  const p = f.properties;
  const nearPangyo = p.pangyo_minutes <= p.cheongna_minutes;
  return nearPangyo ? colorFor('pangyo') : colorFor('cheongna');
}

function isoStyle(f) {
  const p = f.properties;
  const pangyoIn = p.pangyo_minutes <= selectedMinute;
  const cheongnaIn = p.cheongna_minutes <= selectedMinute;
  let color = '#cbd5e1';
  if (pangyoIn && cheongnaIn) color = '#15803d';
  else if (pangyoIn) color = colorFor('pangyo');
  else if (cheongnaIn) color = colorFor('cheongna');
  return {
    color,
    weight: 0.8,
    fillColor: color,
    fillOpacity: pangyoIn || cheongnaIn ? 0.28 : 0.05
  };
}

function accessColor(p) {
  const pangyoIn = p.pangyo_minutes <= selectedMinute;
  const cheongnaIn = p.cheongna_minutes <= selectedMinute;
  if (pangyoIn && cheongnaIn) return '#15803d';
  if (pangyoIn) return colorFor('pangyo');
  if (cheongnaIn) return colorFor('cheongna');
  return '#ffffff';
}

function stationStyle(f) {
  const fillColor = accessColor(f.properties);
  return {
    radius: 5.5,
    color: '#111827',
    weight: fillColor === '#ffffff' ? 1 : 1.5,
    fillColor,
    fillOpacity: fillColor === '#ffffff' ? 0.88 : 0.95
  };
}

function refreshStationStyles() {
  if (!layers.stations) return;
  layers.stations.eachLayer((layer) => {
    if (layer.feature) layer.setStyle(stationStyle(layer.feature));
  });
}

function refreshIsoLayer() {
  if (layers.iso) {
    map.removeLayer(layers.iso);
  }
  layers.iso = L.geoJSON(appData.oa, {
    filter: (f) => f.properties.pangyo_minutes <= selectedMinute || f.properties.cheongna_minutes <= selectedMinute,
    style: isoStyle
  });
  if (layerState.iso) layers.iso.addTo(map);
  layers.iso.bringToFront();
  if (layers.land) layers.land.bringToFront();
  if (layers.stations) layers.stations.bringToFront();
  refreshStationStyles();
}

function renderSummary() {
  const rows = [
    ['분석면적', (r) => r.areaKm2, km2],
    ['집계구 수', (r) => r.oaCount, (v) => `${num(v)}개`],
    ['인구', (r) => r.population, (v) => `${num(v)}명`],
    ['종사자', (r) => r.workers, (v) => `${num(v)}명`],
    ['사업체', (r) => r.businessCount, (v) => `${num(v)}개`],
    ['직주비', (r) => r.jobHousingRatio, (v) => fixed(v, 2)],
    ['건축물 폴리곤', (r) => r.buildingPolygonCount, (v) => `${num(v)}개`],
    ['60분 도달 종사자', (r) => r.accessibility.reachable.workers60, (v) => `${num(v)}명`]
  ];
  document.getElementById('summaryCards').innerHTML = rows.map(([label, getter, formatter]) => {
    const values = Object.fromEntries(REGION_KEYS.map((key) => [key, getter(region(key))]));
    return renderCard(label, values, formatter);
  }).join('');

  const p = region('pangyo');
  const c = region('cheongna');
  document.getElementById('insightList').innerHTML = `<strong>핵심 비교</strong><ol>
    <li>판교는 종사자 ${num(p.workers)}명, 청라는 ${num(c.workers)}명으로 업무 집적 규모를 직접 비교할 수 있습니다.</li>
    <li>건축물 폴리곤은 판교 ${num(p.buildingPolygonCount)}개, 청라 ${num(c.buildingPolygonCount)}개가 지도와 지표에 반영되어 있습니다.</li>
    <li>60분 접근권 종사자는 판교 ${num(p.accessibility.reachable.workers60)}명, 청라 ${num(c.accessibility.reachable.workers60)}명입니다.</li>
  </ol>`;
}

function renderLandUse() {
  const metricRows = [
    ['건축물 표본 수', (r) => r.buildings.count, (v) => `${num(v)}건`],
    ['건축물 폴리곤', (r) => r.buildingPolygonCount, (v) => `${num(v)}개`],
    ['총 대지면적', (r) => r.buildings.landArea, m2],
    ['총 연면적', (r) => r.buildings.floorArea, m2],
    ['평균 용적률', (r) => r.buildings.avgFar, pct],
    ['평균 건폐율', (r) => r.buildings.avgCoverage, pct],
    ['토지이용 혼합도', (r) => r.buildings.landUseMix, (v) => fixed(v, 2)],
    ['저이용 대지 비율', (r) => r.buildings.lowIntensityLandShare, pct]
  ];
  document.getElementById('landMetrics').innerHTML = metricRows.map(([label, getter, formatter]) => {
    const values = Object.fromEntries(REGION_KEYS.map((key) => [key, getter(region(key))]));
    return renderMetric(label, values, formatter);
  }).join('');

  document.getElementById('useCompare').innerHTML = chartPair(
    region('pangyo').label,
    compositionBars(region('pangyo').buildings.useComposition, 'pangyo'),
    region('cheongna').label,
    compositionBars(region('cheongna').buildings.useComposition, 'cheongna')
  );
  document.getElementById('zoneCompare').innerHTML = chartPair(
    region('pangyo').label,
    compositionBars(region('pangyo').buildings.zoningComposition, 'pangyo'),
    region('cheongna').label,
    compositionBars(region('cheongna').buildings.zoningComposition, 'cheongna')
  );

  const sampleHtml = (key) => listItems((region(key).buildings.samples || []).slice(0, 6).map((b) => ({
    title: `${b.use || '건축물'} · ${b.lotNo || '-'}`,
    sub: `연면적 ${m2(b.floorArea)} · 용적률 ${pct(b.far)} · 승인 ${b.approvalDate || '-'}`
  })));
  document.getElementById('buildingCompare').innerHTML = chartPair(
    region('pangyo').label,
    sampleHtml('pangyo'),
    region('cheongna').label,
    sampleHtml('cheongna')
  );
}

function renderTransport() {
  const metricRows = [
    ['30분 도달 인구', (r) => r.accessibility.reachable.pop30, (v) => `${num(v)}명`],
    ['60분 도달 인구', (r) => r.accessibility.reachable.pop60, (v) => `${num(v)}명`],
    ['30분 도달 종사자', (r) => r.accessibility.reachable.workers30, (v) => `${num(v)}명`],
    ['60분 도달 종사자', (r) => r.accessibility.reachable.workers60, (v) => `${num(v)}명`],
    ['500m 역세권 면적비', (r) => r.accessibility.support.stationArea500Share, pct],
    ['1km 역세권 면적비', (r) => r.accessibility.support.stationArea1000Share, pct]
  ];
  document.getElementById('transportMetrics').innerHTML = metricRows.map(([label, getter, formatter]) => {
    const values = Object.fromEntries(REGION_KEYS.map((key) => [key, getter(region(key))]));
    return renderMetric(label, values, formatter);
  }).join('');

  document.getElementById('stationAreaChart').innerHTML = dualBars([
    { label: '500m 역세권 면적비', pangyo: region('pangyo').accessibility.support.stationArea500Share, cheongna: region('cheongna').accessibility.support.stationArea500Share, formatter: pct },
    { label: '1km 역세권 면적비', pangyo: region('pangyo').accessibility.support.stationArea1000Share, cheongna: region('cheongna').accessibility.support.stationArea1000Share, formatter: pct },
    { label: '500m 역세권 면적', pangyo: region('pangyo').accessibility.support.stationArea500Km2, cheongna: region('cheongna').accessibility.support.stationArea500Km2, formatter: km2 },
    { label: '1km 역세권 면적', pangyo: region('pangyo').accessibility.support.stationArea1000Km2, cheongna: region('cheongna').accessibility.support.stationArea1000Km2, formatter: km2 }
  ]);
  document.getElementById('accessChart').innerHTML = lineChart();
}

function renderDemo() {
  const metricRows = [
    ['인구', (r) => r.population, (v) => `${num(v)}명`],
    ['종사자', (r) => r.workers, (v) => `${num(v)}명`],
    ['사업체', (r) => r.businessCount, (v) => `${num(v)}개`],
    ['인구밀도', (r) => r.populationDensity, (v) => `${num(v)}명/km2`],
    ['종사자밀도', (r) => r.workerDensity, (v) => `${num(v)}명/km2`],
    ['사업체밀도', (r) => r.businessDensity, (v) => `${num(v)}개/km2`],
    ['직주비', (r) => r.jobHousingRatio, (v) => fixed(v, 2)]
  ];
  document.getElementById('demoMetrics').innerHTML = metricRows.map(([label, getter, formatter]) => {
    const values = Object.fromEntries(REGION_KEYS.map((key) => [key, getter(region(key))]));
    return renderMetric(label, values, formatter);
  }).join('');

  document.getElementById('compareBars').innerHTML = dualBars([
    { label: '인구밀도', pangyo: region('pangyo').populationDensity, cheongna: region('cheongna').populationDensity, formatter: (v) => `${num(v)}/km2` },
    { label: '종사자밀도', pangyo: region('pangyo').workerDensity, cheongna: region('cheongna').workerDensity, formatter: (v) => `${num(v)}/km2` },
    { label: '사업체밀도', pangyo: region('pangyo').businessDensity, cheongna: region('cheongna').businessDensity, formatter: (v) => `${num(v)}/km2` },
    { label: '직주비', pangyo: region('pangyo').jobHousingRatio, cheongna: region('cheongna').jobHousingRatio, formatter: (v) => fixed(v, 2) }
  ]);
  document.getElementById('businessCompare').innerHTML = chartPair(
    region('pangyo').label,
    compositionBars(region('pangyo').economy.industryBusinessComposition, 'pangyo'),
    region('cheongna').label,
    compositionBars(region('cheongna').economy.industryBusinessComposition, 'cheongna')
  );
  document.getElementById('workerIndustryCompare').innerHTML = chartPair(
    region('pangyo').label,
    compositionBars(region('pangyo').economy.industryWorkerComposition, 'pangyo'),
    region('cheongna').label,
    compositionBars(region('cheongna').economy.industryWorkerComposition, 'cheongna')
  );
}

function renderAll() {
  renderSummary();
  renderLandUse();
  renderTransport();
  renderDemo();
}

function bindUi() {
  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b === button));
      document.querySelectorAll('.tab-page').forEach((page) => page.classList.toggle('active', page.id === button.dataset.tab));
    });
  });

  document.querySelectorAll('.tool').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.layer;
      layerState[key] = !layerState[key];
      button.classList.toggle('active', layerState[key]);
      if (layerState[key]) layers[key].addTo(map);
      else map.removeLayer(layers[key]);
    });
  });

  document.querySelectorAll('.minute').forEach((button) => {
    button.addEventListener('click', () => {
      selectedMinute = Number(button.dataset.minute);
      document.querySelectorAll('.minute').forEach((b) => b.classList.toggle('active', b === button));
      refreshIsoLayer();
    });
  });
}

fetch('./data/site-data.json')
  .then((res) => {
    if (!res.ok) throw new Error(`데이터를 불러오지 못했습니다: ${res.status}`);
    return res.json();
  })
  .then((data) => {
    appData = data;
    initMap();
    bindUi();
    renderAll();
  })
  .catch((error) => {
    document.querySelector('.panel').insertAdjacentHTML('beforeend', `<div class="source">오류: ${error.message}</div>`);
    throw error;
  });
