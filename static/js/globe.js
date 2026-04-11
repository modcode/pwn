/**
 * Pure Canvas 2D orthographic globe — no external dependencies
 */
(function () {
  "use strict";

  const OCEAN_COLOR   = "#0e2d4a";
  const OCEAN_LIGHT   = "#1a4a72";
  const LAND_COLOR    = "#2d7a50";
  const LAND_STROKE   = "#1f5c3b";
  const BORDER_COLOR  = "#1f5c3b";
  const GRID_COLOR    = "rgba(100,180,255,0.15)";
  const ATMOS_COLOR   = "rgba(80,180,255,0.13)";
  const PIN_COLOR     = "#f97316";
  const PIN_GLOW      = "rgba(249,115,22,0.35)";
  const STAR_COUNT    = 200;

  // tier 1 = shown first, tier 2 = more zoom, tier 3 = most zoom
  const CITIES = [
    // Tier 1 — major world capitals / megacities
    { name: "London",       lat: 51.51,  lng: -0.13,   tier: 1 },
    { name: "Paris",        lat: 48.85,  lng: 2.35,    tier: 1 },
    { name: "New York",     lat: 40.71,  lng: -74.01,  tier: 1 },
    { name: "Los Angeles",  lat: 34.05,  lng: -118.24, tier: 1 },
    { name: "Tokyo",        lat: 35.68,  lng: 139.69,  tier: 1 },
    { name: "Beijing",      lat: 39.91,  lng: 116.39,  tier: 1 },
    { name: "Shanghai",     lat: 31.23,  lng: 121.47,  tier: 1 },
    { name: "Mumbai",       lat: 19.08,  lng: 72.88,   tier: 1 },
    { name: "Delhi",        lat: 28.66,  lng: 77.23,   tier: 1 },
    { name: "São Paulo",    lat: -23.55, lng: -46.63,  tier: 1 },
    { name: "Moscow",       lat: 55.75,  lng: 37.62,   tier: 1 },
    { name: "Sydney",       lat: -33.87, lng: 151.21,  tier: 1 },
    { name: "Dubai",        lat: 25.20,  lng: 55.27,   tier: 1 },
    { name: "Singapore",    lat: 1.35,   lng: 103.82,  tier: 1 },
    { name: "Cairo",        lat: 30.04,  lng: 31.24,   tier: 1 },
    { name: "Lagos",        lat: 6.52,   lng: 3.38,    tier: 1 },
    { name: "Mexico City",  lat: 19.43,  lng: -99.13,  tier: 1 },
    { name: "Buenos Aires", lat: -34.60, lng: -58.38,  tier: 1 },
    { name: "Jakarta",      lat: -6.21,  lng: 106.85,  tier: 1 },
    { name: "Seoul",        lat: 37.57,  lng: 126.98,  tier: 1 },
    // Tier 2 — regional capitals / large cities
    { name: "Berlin",       lat: 52.52,  lng: 13.40,   tier: 2 },
    { name: "Rome",         lat: 41.90,  lng: 12.50,   tier: 2 },
    { name: "Madrid",       lat: 40.42,  lng: -3.70,   tier: 2 },
    { name: "Toronto",      lat: 43.65,  lng: -79.38,  tier: 2 },
    { name: "Chicago",      lat: 41.88,  lng: -87.63,  tier: 2 },
    { name: "Houston",      lat: 29.76,  lng: -95.37,  tier: 2 },
    { name: "Bangkok",      lat: 13.75,  lng: 100.52,  tier: 2 },
    { name: "Istanbul",     lat: 41.01,  lng: 28.95,   tier: 2 },
    { name: "Nairobi",      lat: -1.29,  lng: 36.82,   tier: 2 },
    { name: "Johannesburg", lat: -26.20, lng: 28.04,   tier: 2 },
    { name: "Karachi",      lat: 24.86,  lng: 67.01,   tier: 2 },
    { name: "Dhaka",        lat: 23.72,  lng: 90.41,   tier: 2 },
    { name: "Lima",         lat: -12.05, lng: -77.04,  tier: 2 },
    { name: "Bogotá",       lat: 4.71,   lng: -74.07,  tier: 2 },
    { name: "Tehran",       lat: 35.69,  lng: 51.39,   tier: 2 },
    { name: "Riyadh",       lat: 24.69,  lng: 46.72,   tier: 2 },
    // Tier 3 — smaller but notable cities
    { name: "Amsterdam",    lat: 52.37,  lng: 4.90,    tier: 3 },
    { name: "Stockholm",    lat: 59.33,  lng: 18.07,   tier: 3 },
    { name: "Oslo",         lat: 59.91,  lng: 10.75,   tier: 3 },
    { name: "Vienna",       lat: 48.21,  lng: 16.37,   tier: 3 },
    { name: "Warsaw",       lat: 52.23,  lng: 21.01,   tier: 3 },
    { name: "Prague",       lat: 50.08,  lng: 14.44,   tier: 3 },
    { name: "Zurich",       lat: 47.38,  lng: 8.54,    tier: 3 },
    { name: "Barcelona",    lat: 41.39,  lng: 2.15,    tier: 3 },
    { name: "Lisbon",       lat: 38.72,  lng: -9.14,   tier: 3 },
    { name: "Athens",       lat: 37.98,  lng: 23.73,   tier: 3 },
    { name: "Vancouver",    lat: 49.25,  lng: -123.12, tier: 3 },
    { name: "Miami",        lat: 25.77,  lng: -80.19,  tier: 3 },
    { name: "San Francisco",lat: 37.77,  lng: -122.42, tier: 3 },
    { name: "Osaka",        lat: 34.69,  lng: 135.50,  tier: 3 },
    { name: "Kuala Lumpur", lat: 3.14,   lng: 101.69,  tier: 3 },
    { name: "Taipei",       lat: 25.05,  lng: 121.56,  tier: 3 },
    { name: "Hong Kong",    lat: 22.32,  lng: 114.17,  tier: 3 },
    { name: "Melbourne",    lat: -37.81, lng: 144.96,  tier: 3 },
    { name: "Auckland",     lat: -36.86, lng: 174.77,  tier: 3 },
    { name: "Cape Town",    lat: -33.93, lng: 18.42,   tier: 3 },
    { name: "Casablanca",   lat: 33.59,  lng: -7.62,   tier: 3 },
    { name: "Accra",        lat: 5.56,   lng: -0.20,   tier: 3 },
    { name: "Addis Ababa",  lat: 9.03,   lng: 38.74,   tier: 3 },
    { name: "Kyiv",         lat: 50.45,  lng: 30.52,   tier: 3 },
    { name: "Lahore",       lat: 31.55,  lng: 74.34,   tier: 3 },
    { name: "Kolkata",      lat: 22.57,  lng: 88.36,   tier: 3 },
    { name: "Santiago",     lat: -33.45, lng: -70.67,  tier: 3 },
  ];

  let canvas, ctx, W, H, cx, cy, radius;
  let rotX = 0, rotY = -20;
  let isDragging = false, lastMouse = null;
  let autoRotating = true, rafId = null, resumeTimer = null;
  let borders = [];
  let countries = [];
  let capitals = [];
  let rivers = [];
  let waterLabels = [];
  let locationData = [];
  let tooltipEl;
  let stars = [];
  let pinPulse = 0;

  // ---- Init ----
  function init() {
    const container = document.getElementById("globe-container");
    tooltipEl = document.getElementById("globe-tooltip");

    canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    container.appendChild(canvas);

    resize(container);
    generateStars();

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onMouseUp);
    canvas.addEventListener("click", onClick);

    window.addEventListener("resize", () => { resize(container); });

    fetch("/static/countries.json")
      .then(r => r.json())
      .then(data => { countries = data; })
      .catch(e => console.warn("Could not load countries:", e));

    fetch("/static/rivers.json")
      .then(r => r.json())
      .then(data => { rivers = data; })
      .catch(e => console.warn("Could not load rivers:", e));

    fetch("/static/water-labels.json")
      .then(r => r.json())
      .then(data => { waterLabels = data; })
      .catch(e => console.warn("Could not load water labels:", e));

    fetch("/static/capitals.json")
      .then(r => r.json())
      .then(data => { capitals = data; })
      .catch(e => console.warn("Could not load capitals:", e));

    fetch("/static/borders.json")
      .then(r => r.json())
      .then(data => { borders = data; })
      .catch(e => console.warn("Could not load borders:", e));

    startLoop();
  }

  function resize(container) {
    W = container.clientWidth;
    H = container.clientHeight;
    cx = W / 2;
    cy = H / 2;
    radius = Math.min(W, H) * 0.42;
    canvas.width = W;
    canvas.height = H;
    ctx = canvas.getContext("2d");
  }

  function generateStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.2 + 0.2,
        a: Math.random() * 0.7 + 0.2
      });
    }
  }

  // ---- Projection ----
  function latLngTo3D(lat, lng) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = lng * Math.PI / 180;
    return {
      x: Math.sin(phi) * Math.cos(theta),
      y: Math.cos(phi),
      z: Math.sin(phi) * Math.sin(theta)
    };
  }

  function rotate3D(p) {
    const ry = rotX * Math.PI / 180;
    const rx = rotY * Math.PI / 180;
    // Rotate around Y axis (longitude)
    let x1 = p.x * Math.cos(ry) + p.z * Math.sin(ry);
    let y1 = p.y;
    let z1 = -p.x * Math.sin(ry) + p.z * Math.cos(ry);
    // Rotate around X axis (latitude tilt)
    let x2 = x1;
    let y2 = y1 * Math.cos(rx) - z1 * Math.sin(rx);
    let z2 = y1 * Math.sin(rx) + z1 * Math.cos(rx);
    return { x: x2, y: y2, z: z2 };
  }

  function project(p) {
    return {
      sx: cx - p.x * radius,
      sy: cy - p.y * radius,
      visible: p.z >= 0
    };
  }

  // For polygon fills: clamp back-face points to the horizon rim
  // instead of letting them project to the wrong side
  function projectClamped(p) {
    let x = p.x, y = p.y;
    if (p.z < 0) {
      const len = Math.sqrt(x * x + y * y);
      if (len > 0) { x = x / len; y = y / len; }
      else { x = 0; y = 0; }
    }
    return { sx: cx - x * radius, sy: cy - y * radius };
  }

  function latLngToScreen(lat, lng) {
    return project(rotate3D(latLngTo3D(lat, lng)));
  }

  // ---- Draw ----
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Stars
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.a})`;
      ctx.fill();
    });

    // Atmosphere glow
    const atmos = ctx.createRadialGradient(cx, cy, radius * 0.92, cx, cy, radius * 1.14);
    atmos.addColorStop(0, ATMOS_COLOR);
    atmos.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.14, 0, Math.PI * 2);
    ctx.fillStyle = atmos;
    ctx.fill();

    // Ocean
    const oceanGrad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, 0, cx, cy, radius);
    oceanGrad.addColorStop(0, OCEAN_LIGHT);
    oceanGrad.addColorStop(1, OCEAN_COLOR);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = oceanGrad;
    ctx.fill();

    // Clip everything to globe circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    // Graticule
    drawGraticule();

    // Filled countries
    drawCountries();

    // Country borders
    drawBorders();

    // Rivers
    drawRivers();

    // Water labels (oceans/seas/lakes)
    drawWaterLabels();

    ctx.restore();

    // Globe edge
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(80,160,220,0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pins (drawn after clip restore so glow isn't clipped)
    drawPins();

    // Cities (zoom-dependent)
    drawCities();
  }

  function drawGraticule() {
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 0.6;

    // Latitude lines
    for (let lat = -75; lat <= 75; lat += 15) {
      ctx.beginPath();
      let first = true;
      for (let lng = -180; lng <= 180; lng += 3) {
        const p = latLngToScreen(lat, lng);
        if (p.visible) {
          first ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy);
          first = false;
        } else {
          first = true;
        }
      }
      ctx.stroke();
    }

    // Longitude lines
    for (let lng = -180; lng < 180; lng += 15) {
      ctx.beginPath();
      let first = true;
      for (let lat = -90; lat <= 90; lat += 3) {
        const p = latLngToScreen(lat, lng);
        if (p.visible) {
          first ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy);
          first = false;
        } else {
          first = true;
        }
      }
      ctx.stroke();
    }
  }

  function drawCountries() {
    ctx.fillStyle = LAND_COLOR;
    countries.forEach(polygon => {
      // Check if any point on the outer ring is on the front face
      const outerRing = polygon[0];
      const anyVisible = outerRing.some(([lng, lat]) => {
        const r = rotate3D(latLngTo3D(lat, lng));
        return r.z >= -0.2;
      });
      if (!anyVisible) return;

      ctx.beginPath();
      polygon.forEach(ring => {
        ring.forEach(([lng, lat], i) => {
          const p = projectClamped(rotate3D(latLngTo3D(lat, lng)));
          i === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy);
        });
        ctx.closePath();
      });
      ctx.fill("evenodd");
    });
  }

  function drawBorders() {
    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth = 0.8;

    borders.forEach(line => {
      ctx.beginPath();
      let penDown = false;
      for (let i = 0; i < line.length; i++) {
        const [lng, lat] = line[i];
        const p = latLngToScreen(lat, lng);
        if (p.visible) {
          penDown ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy);
          penDown = true;
        } else {
          penDown = false;
        }
      }
      ctx.stroke();
    });
  }

  function drawRivers() {
    const base = Math.min(W, H) * 0.42;
    const zoom = radius / base;
    // Rivers fade in at zoom > 1.5
    if (zoom < 1.2) return;
    const alpha = Math.min(1, (zoom - 1.2) / 0.4);

    ctx.strokeStyle = `rgba(100,180,255,${alpha * 0.55})`;
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    rivers.forEach(river => {
      ctx.beginPath();
      let penDown = false;
      river.points.forEach(([lng, lat]) => {
        const p = latLngToScreen(lat, lng);
        if (p.visible) {
          penDown ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy);
          penDown = true;
        } else {
          penDown = false;
        }
      });
      ctx.stroke();

      // River name label at midpoint, only at higher zoom
      if (zoom > 2.0) {
        const labelAlpha = Math.min(1, (zoom - 2.0) / 0.4) * alpha;
        const mid = river.points[Math.floor(river.points.length / 2)];
        const p = latLngToScreen(mid[1], mid[0]);
        if (p.visible) {
          ctx.font = "italic 8px Inter, sans-serif";
          ctx.fillStyle = `rgba(140,210,255,${labelAlpha * 0.9})`;
          ctx.shadowColor = `rgba(0,0,0,${labelAlpha * 0.8})`;
          ctx.shadowBlur = 2;
          ctx.fillText(river.name, p.sx + 2, p.sy - 2);
          ctx.shadowBlur = 0;
        }
      }
    });
  }

  function drawWaterLabels() {
    const base = Math.min(W, H) * 0.42;
    const zoom = radius / base;

    waterLabels.forEach(w => {
      const p = latLngToScreen(w.lat, w.lng);
      if (!p.visible) return;

      let minZoom, fontSize, alpha;
      if (w.size === "ocean") {
        minZoom = 0.8;
        fontSize = zoom < 1.2 ? 13 : 11;
      } else if (w.size === "sea") {
        minZoom = 1.1;
        fontSize = 10;
      } else {
        // lake
        minZoom = 1.6;
        fontSize = 9;
      }

      if (zoom < minZoom) return;
      alpha = Math.min(1, (zoom - minZoom) / 0.35);

      ctx.font = `italic ${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = `rgba(150,210,255,${alpha * 0.85})`;
      ctx.shadowColor = `rgba(0,0,0,${alpha * 0.7})`;
      ctx.shadowBlur = 3;
      ctx.textAlign = "center";
      ctx.fillText(w.name, p.sx, p.sy);
      ctx.textAlign = "left";
      ctx.shadowBlur = 0;
    });
  }

  function drawCities() {
    const base = Math.min(W, H) * 0.42;
    const zoom = radius / base;

    // Tier thresholds
    const showTier1 = zoom > 1.3;
    const showTier2 = zoom > 1.9;
    const showTier3 = zoom > 2.6;
    if (!showTier1) return;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    const capitalNames = new Set(capitals.map(c => c.name));

    CITIES.forEach(city => {
      if (capitalNames.has(city.name)) return;
      if (city.tier === 2 && !showTier2) return;
      if (city.tier === 3 && !showTier3) return;

      const p = latLngToScreen(city.lat, city.lng);
      if (!p.visible) return;

      const thresholds = [0, 1.3, 1.9, 2.6];
      const t = thresholds[city.tier];
      const alpha = Math.min(1, (zoom - t) / 0.4);
      const dotR = city.tier === 1 ? 2.5 : city.tier === 2 ? 2 : 1.5;
      const fontSize = city.tier === 1 ? 11 : city.tier === 2 ? 10 : 9;

      ctx.beginPath();
      ctx.arc(p.sx, p.sy, dotR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.9})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(0,0,0,${alpha * 0.5})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.font = `${city.tier === 1 ? 600 : 400} ${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.95})`;
      ctx.shadowColor = `rgba(0,0,0,${alpha * 0.8})`;
      ctx.shadowBlur = 3;
      ctx.fillText(city.name, p.sx + dotR + 3, p.sy + dotR);
      ctx.shadowBlur = 0;
    });

    // Capitals — shown at same zoom as tier 2, with a star marker
    const showCapitals = zoom > 1.9;
    if (showCapitals) {
      const alpha = Math.min(1, (zoom - 1.9) / 0.4);
      capitals.forEach(cap => {
        const p = latLngToScreen(cap.lat, cap.lng);
        if (!p.visible) return;

        // Star marker (small 4-point)
        ctx.save();
        ctx.translate(p.sx, p.sy);
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4 - Math.PI / 2;
          const r = i % 2 === 0 ? 3.5 : 1.5;
          i === 0 ? ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r)
                  : ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(255,220,50,${alpha * 0.95})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(0,0,0,${alpha * 0.4})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();

        // Label
        ctx.font = `500 9px Inter, sans-serif`;
        ctx.fillStyle = `rgba(255,230,100,${alpha * 0.95})`;
        ctx.shadowColor = `rgba(0,0,0,${alpha * 0.9})`;
        ctx.shadowBlur = 3;
        ctx.fillText(cap.name, p.sx + 5, p.sy + 3);
        ctx.shadowBlur = 0;
      });
    }

    ctx.restore();
  }

  function drawPins() {
    pinPulse = (pinPulse + 0.04) % (Math.PI * 2);
    const pulseR = 6 + Math.sin(pinPulse) * 4;
    const pulseA = 0.4 + Math.cos(pinPulse) * 0.3;

    locationData.forEach(loc => {
      if (loc.lat == null || loc.lng == null) return;
      const p = latLngToScreen(loc.lat, loc.lng);
      if (!p.visible) return;

      // Pulse ring
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, pulseR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(249,115,22,${pulseA})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Pin glow
      const glow = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, 9);
      glow.addColorStop(0, PIN_GLOW);
      glow.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, 9, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Pin dot
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = PIN_COLOR;
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  // ---- Animation loop ----
  function startLoop() {
    cancelAnimationFrame(rafId);
    function tick() {
      if (autoRotating && !isDragging) {
        rotX -= 0.07;
      }
      draw();
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  }

  // ---- Interaction ----
  function onMouseDown(e) {
    isDragging = true;
    autoRotating = false;
    lastMouse = [e.clientX, e.clientY];
    canvas.style.cursor = "grabbing";
    clearTimeout(resumeTimer);
  }

  function onMouseMove(e) {
    if (isDragging) {
      const dx = e.clientX - lastMouse[0];
      const dy = e.clientY - lastMouse[1];
      rotX -= dx * 0.3;
      rotY = Math.max(-89, Math.min(89, rotY + dy * 0.3));
      lastMouse = [e.clientX, e.clientY];
    } else {
      updateTooltip(e);
    }
  }

  function onMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    canvas.style.cursor = "grab";
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { autoRotating = true; }, 3000);
  }

  function onWheel(e) {
    e.preventDefault();
    const base = Math.min(W, H) * 0.42;
    const factor = e.deltaY > 0 ? 1.08 : 0.93;
    radius = Math.max(base * 0.4, Math.min(base * 4, radius * factor));
  }

  let touchDist = null;
  function onTouchStart(e) {
    if (e.touches.length === 1) {
      isDragging = true;
      autoRotating = false;
      lastMouse = [e.touches[0].clientX, e.touches[0].clientY];
      clearTimeout(resumeTimer);
    } else if (e.touches.length === 2) {
      touchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - lastMouse[0];
      const dy = e.touches[0].clientY - lastMouse[1];
      rotX -= dx * 0.3;
      rotY = Math.max(-89, Math.min(89, rotY + dy * 0.3));
      lastMouse = [e.touches[0].clientX, e.touches[0].clientY];
    } else if (e.touches.length === 2 && touchDist) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const base = Math.min(W, H) * 0.42;
      radius = Math.max(base * 0.4, Math.min(base * 4, radius * (d / touchDist)));
      touchDist = d;
    }
  }

  function updateTooltip(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX, my = e.clientY;
    let hit = null;

    locationData.forEach(loc => {
      if (loc.lat == null || loc.lng == null) return;
      const p = latLngToScreen(loc.lat, loc.lng);
      if (!p.visible) return;
      const dist = Math.hypot(mx - p.sx - rect.left, my - p.sy - rect.top);
      if (dist < 12) hit = loc;
    });

    if (hit) {
      tooltipEl.innerHTML = `<strong>${escHtml(hit.title)}</strong>${hit.note ? "<br>" + escHtml(hit.note.substring(0, 100)) + (hit.note.length > 100 ? "…" : "") : ""}`;
      tooltipEl.style.display = "block";
      tooltipEl.style.left = (e.clientX - rect.left + 12) + "px";
      tooltipEl.style.top = (e.clientY - rect.top - 10) + "px";
      canvas.style.cursor = "pointer";
    } else {
      tooltipEl.style.display = "none";
      canvas.style.cursor = "grab";
    }
  }

  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    locationData.forEach(loc => {
      if (loc.lat == null || loc.lng == null) return;
      const p = latLngToScreen(loc.lat, loc.lng);
      if (!p.visible) return;
      const dist = Math.hypot(e.clientX - p.sx - rect.left, e.clientY - p.sy - rect.top);
      if (dist < 12 && window.showLocationDetail) window.showLocationDetail(loc);
    });
  }

  // ---- Public API ----
  window.updateGlobePins = function (locations) {
    locationData = locations;
  };

  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
