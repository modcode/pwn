/**
 * Low-poly interactive world globe using Three.js
 * Features: auto-rotation, drag to rotate, scroll to zoom, location pins
 */
(function () {
  "use strict";

  const GLOBE_RADIUS = 1.8;
  const LOW_POLY_SEGMENTS = 32; // low-res feel
  const PIN_COLOR = 0xf97316;    // orange pins
  const OCEAN_COLOR = 0x1a3a5c;
  const LAND_COLOR = 0x2d6a4f;
  const GRID_COLOR = 0x264f73;
  const ATMOS_COLOR = 0x4fc3f7;

  let scene, camera, renderer, globe, atmosphere;
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let autoRotate = true;
  let pinMeshes = [];
  let raycaster, mouse;
  let locationData = [];
  let tooltipEl;

  function init() {
    const container = document.getElementById("globe-container");
    tooltipEl = document.getElementById("globe-tooltip");

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1628);

    // Camera
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.z = 5;

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x4fc3f7, 0.3);
    rimLight.position.set(-5, -2, -5);
    scene.add(rimLight);

    // Stars background
    addStars();

    // Globe
    buildGlobe();

    // Atmosphere glow
    addAtmosphere();

    // Raycaster for interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Event listeners
    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("mouseleave", onMouseUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: true });
    renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: false });
    renderer.domElement.addEventListener("touchend", onMouseUp);
    renderer.domElement.addEventListener("click", onClick);

    window.addEventListener("resize", onResize);

    animate();
  }

  function addStars() {
    const geometry = new THREE.BufferGeometry();
    const count = 2000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 200;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, sizeAttenuation: true });
    scene.add(new THREE.Points(geometry, material));
  }

  function buildGlobe() {
    // Base ocean sphere (low-poly)
    const geoOcean = new THREE.SphereGeometry(GLOBE_RADIUS, LOW_POLY_SEGMENTS, LOW_POLY_SEGMENTS);
    const matOcean = new THREE.MeshPhongMaterial({
      color: OCEAN_COLOR,
      shininess: 60,
      specular: 0x2266aa,
    });
    globe = new THREE.Mesh(geoOcean, matOcean);
    scene.add(globe);

    // Lat/lon grid lines
    addGridLines();

    // Low-poly continent patches
    addContinents();
  }

  function addGridLines() {
    const lineMat = new THREE.LineBasicMaterial({ color: GRID_COLOR, transparent: true, opacity: 0.35 });

    // Latitude lines
    for (let lat = -75; lat <= 75; lat += 15) {
      const points = [];
      const phi = THREE.MathUtils.degToRad(90 - lat);
      for (let lng = 0; lng <= 360; lng += 4) {
        const theta = THREE.MathUtils.degToRad(lng);
        points.push(new THREE.Vector3(
          GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta) * 1.002,
          GLOBE_RADIUS * Math.cos(phi) * 1.002,
          GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta) * 1.002
        ));
      }
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMat));
    }

    // Longitude lines
    for (let lng = 0; lng < 360; lng += 15) {
      const points = [];
      const theta = THREE.MathUtils.degToRad(lng);
      for (let lat = -90; lat <= 90; lat += 4) {
        const phi = THREE.MathUtils.degToRad(90 - lat);
        points.push(new THREE.Vector3(
          GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta) * 1.002,
          GLOBE_RADIUS * Math.cos(phi) * 1.002,
          GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta) * 1.002
        ));
      }
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMat));
    }
  }

  // Simplified continent approximations as low-poly shapes
  function addContinents() {
    const continents = [
      // [lat_center, lng_center, width_deg, height_deg, label]
      { lat: 40, lng: 20, w: 70, h: 55, label: "Europe" },
      { lat: 5, lng: 20, w: 75, h: 70, label: "Africa" },
      { lat: 50, lng: 80, w: 120, h: 55, label: "Asia" },
      { lat: 45, lng: -100, w: 65, h: 55, label: "N. America" },
      { lat: -15, lng: -58, w: 55, h: 60, label: "S. America" },
      { lat: -25, lng: 135, w: 50, h: 45, label: "Australia" },
      { lat: -80, lng: 0, w: 180, h: 25, label: "Antarctica" },
    ];

    continents.forEach((c) => {
      const patchGeo = buildContinentPatch(c.lat, c.lng, c.w, c.h);
      const mat = new THREE.MeshPhongMaterial({
        color: LAND_COLOR,
        shininess: 10,
        flatShading: true,
      });
      globe.add(new THREE.Mesh(patchGeo, mat));
    });
  }

  function buildContinentPatch(latC, lngC, widthDeg, heightDeg) {
    // Build a jagged low-poly landmass patch on the sphere surface
    const segments = 6;
    const vertices = [];
    const indices = [];

    const latMin = latC - heightDeg / 2;
    const latMax = latC + heightDeg / 2;
    const lngMin = lngC - widthDeg / 2;
    const lngMax = lngC + widthDeg / 2;
    const r = GLOBE_RADIUS * 1.003;

    function latLngToVec(lat, lng) {
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lng);
      return [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      ];
    }

    // Build a grid with jitter for low-poly look
    const rows = segments + 1;
    const cols = segments + 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const t = row / segments;
        const s = col / segments;
        const jitterLat = (Math.random() - 0.5) * (heightDeg / segments) * 0.5;
        const jitterLng = (Math.random() - 0.5) * (widthDeg / segments) * 0.5;
        const lat = latMin + t * (latMax - latMin) + (row > 0 && row < rows - 1 ? jitterLat : 0);
        const lng = lngMin + s * (lngMax - lngMin) + (col > 0 && col < cols - 1 ? jitterLng : 0);
        vertices.push(...latLngToVec(lat, lng));
      }
    }

    for (let row = 0; row < segments; row++) {
      for (let col = 0; col < segments; col++) {
        const a = row * cols + col;
        const b = a + 1;
        const c = a + cols;
        const d = c + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  function addAtmosphere() {
    const geoAtmos = new THREE.SphereGeometry(GLOBE_RADIUS * 1.08, 32, 32);
    const matAtmos = new THREE.MeshPhongMaterial({
      color: ATMOS_COLOR,
      transparent: true,
      opacity: 0.08,
      side: THREE.FrontSide,
    });
    atmosphere = new THREE.Mesh(geoAtmos, matAtmos);
    scene.add(atmosphere);
  }

  // ---- Pins ----

  function latLngToVector3(lat, lng, radius) {
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lng + 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  function addPin(location) {
    const pos = latLngToVector3(location.lat, location.lng, GLOBE_RADIUS + 0.06);

    // Pin sphere
    const geo = new THREE.SphereGeometry(0.045, 8, 8);
    const mat = new THREE.MeshPhongMaterial({ color: PIN_COLOR, emissive: 0xc2410c, shininess: 80 });
    const pin = new THREE.Mesh(geo, mat);
    pin.position.copy(pos);
    pin.userData = location;

    // Spike
    const spikeGeo = new THREE.CylinderGeometry(0.008, 0.002, 0.12, 6);
    const spikeMat = new THREE.MeshPhongMaterial({ color: PIN_COLOR });
    const spike = new THREE.Mesh(spikeGeo, spikeMat);

    // Orient spike toward globe center
    const dir = pos.clone().normalize();
    spike.position.copy(pos.clone().sub(dir.clone().multiplyScalar(0.06)));
    spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate());

    globe.add(pin);
    globe.add(spike);
    pinMeshes.push(pin);
  }

  window.updateGlobePins = function (locations) {
    // Remove old pins
    pinMeshes.forEach((p) => {
      globe.remove(p);
      p.geometry.dispose();
    });
    pinMeshes = [];
    locationData = locations;

    locations.forEach((loc) => {
      if (loc.lat != null && loc.lng != null) {
        addPin(loc);
      }
    });
  };

  // ---- Interaction ----

  function onMouseDown(e) {
    isDragging = true;
    autoRotate = false;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  function onMouseMove(e) {
    if (!isDragging) {
      // Hover tooltip
      updateTooltip(e);
      return;
    }
    const dx = e.clientX - previousMousePosition.x;
    const dy = e.clientY - previousMousePosition.y;
    globe.rotation.y += dx * 0.005;
    globe.rotation.x += dy * 0.005;
    globe.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, globe.rotation.x));
    atmosphere.rotation.copy(globe.rotation);
    previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  function onMouseUp() {
    if (isDragging) {
      isDragging = false;
      // Resume auto-rotate after 3 seconds of inactivity
      setTimeout(() => { autoRotate = true; }, 3000);
    }
  }

  function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY * 0.002;
    camera.position.z = Math.max(2.5, Math.min(9, camera.position.z + delta));
  }

  let touchStart = null;
  let touchDist = null;
  function onTouchStart(e) {
    if (e.touches.length === 1) {
      isDragging = true;
      autoRotate = false;
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      touchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && touchStart) {
      const dx = e.touches[0].clientX - touchStart.x;
      const dy = e.touches[0].clientY - touchStart.y;
      globe.rotation.y += dx * 0.005;
      globe.rotation.x += dy * 0.005;
      globe.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, globe.rotation.x));
      atmosphere.rotation.copy(globe.rotation);
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && touchDist) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (touchDist - newDist) * 0.01;
      camera.position.z = Math.max(2.5, Math.min(9, camera.position.z + delta));
      touchDist = newDist;
    }
  }

  function updateTooltip(e) {
    const container = document.getElementById("globe-container");
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(pinMeshes);
    if (hits.length > 0) {
      const loc = hits[0].object.userData;
      tooltipEl.innerHTML = `<strong>${loc.title}</strong>${loc.note ? "<br>" + loc.note.substring(0, 100) + (loc.note.length > 100 ? "…" : "") : ""}`;
      tooltipEl.style.display = "block";
      tooltipEl.style.left = (e.clientX - rect.left + 12) + "px";
      tooltipEl.style.top = (e.clientY - rect.top - 10) + "px";
      renderer.domElement.style.cursor = "pointer";
    } else {
      tooltipEl.style.display = "none";
      renderer.domElement.style.cursor = "grab";
    }
  }

  function onClick(e) {
    const container = document.getElementById("globe-container");
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(pinMeshes);
    if (hits.length > 0) {
      const loc = hits[0].object.userData;
      if (window.showLocationDetail) window.showLocationDetail(loc);
    }
  }

  function onResize() {
    const container = document.getElementById("globe-container");
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  // ---- Animation ----

  function animate() {
    requestAnimationFrame(animate);
    if (autoRotate) {
      globe.rotation.y += 0.0018;
      atmosphere.rotation.y = globe.rotation.y;
    }
    renderer.render(scene, camera);
  }

  // Init after DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
