let nouns = [];
let selectedCameraId = '';

const startScreen = document.getElementById('start-screen');
const arView = document.getElementById('ar-view');
const nounChipList = document.getElementById('noun-chip-list');
const startBtn = document.getElementById('start-btn');
const backBtn = document.getElementById('back-btn');
const arjsLoader = document.getElementById('arjs-loader');
const sceneContainer = document.getElementById('ar-scene-container');
const label = document.getElementById('noun-label');
const labelEn = label.querySelector('.en');
const labelBm = label.querySelector('.bm');
const labelSemai = label.querySelector('.semai');
const cameraPicker = document.getElementById('camera-picker');
const cameraSelect = document.getElementById('camera-select');

// --- Camera picker ---
function refreshCameraList() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
  navigator.mediaDevices.enumerateDevices().then((devices) => {
    const cams = devices.filter((d) => d.kind === 'videoinput');
    if (cams.length < 2) {
      cameraPicker.hidden = true;
      return;
    }
    const previousValue = cameraSelect.value;
    cameraSelect.innerHTML = '';
    cams.forEach((cam, i) => {
      const option = document.createElement('option');
      option.value = cam.deviceId;
      option.textContent = cam.label || `Kamera ${i + 1}`;
      cameraSelect.appendChild(option);
    });
    if (previousValue && cams.some((c) => c.deviceId === previousValue)) {
      cameraSelect.value = previousValue;
    }
    selectedCameraId = cameraSelect.value;
    cameraPicker.hidden = false;
  }).catch(() => {});
}

cameraSelect.addEventListener('change', () => {
  selectedCameraId = cameraSelect.value;
});

if (navigator.mediaDevices) {
  refreshCameraList();
  navigator.mediaDevices.addEventListener('devicechange', refreshCameraList);
}

fetch('data/nouns.json')
  .then((res) => res.json())
  .then((data) => {
    nouns = data.nouns || [];
    renderNounChips();
  })
  .catch((err) => {
    console.error('Gagal memuatkan data/nouns.json', err);
    nounChipList.innerHTML = '<span class="noun-chip-empty">Gagal muatkan senarai noun.</span>';
  });

function renderNounChips() {
  if (!nouns.length) {
    nounChipList.innerHTML = '<span class="noun-chip-empty">Tiada noun lagi.</span>';
    return;
  }
  nounChipList.innerHTML = '';
  nouns.forEach((noun) => {
    const chip = document.createElement('span');
    chip.className = 'noun-chip';
    chip.innerHTML = `<span class="emoji">${noun.emoji || '❓'}</span><span>${noun.labels.bm}</span>`;
    nounChipList.appendChild(chip);
  });
}

// --- AR content (the thing that "comes alive" on top of a found marker) ---

// NFT anchor content uses the marker image's own pixel-scale coordinate
// system (hundreds of units), not meters - so sizes/positions here are large.
function buildModelEntity(model) {
  const wrapper = document.createElement('a-entity');
  wrapper.setAttribute('position', '0 900 0');
  wrapper.setAttribute('animation', 'property: position; to: 0 1300 0; dir: alternate; loop: true; dur: 1000; easing: easeInOutSine');
  wrapper.setAttribute('animation__wiggle', 'property: rotation; to: 0 0 6; dir: alternate; loop: true; dur: 900; easing: easeInOutSine');

  if (model && model.type === 'gltf' && model.url) {
    const entity = document.createElement('a-entity');
    entity.setAttribute('gltf-model', `url(${model.url})`);
    entity.setAttribute('scale', model.scale || '100 100 100');
    wrapper.appendChild(entity);
  } else if (model && model.type === 'sprite' && model.url) {
    const img = document.createElement('a-image');
    img.setAttribute('src', model.url);
    img.setAttribute('width', model.width || 500);
    img.setAttribute('height', model.height || 460);
    img.setAttribute('material', 'side: double');
    wrapper.appendChild(img);
  } else {
    const box = document.createElement('a-box');
    box.setAttribute('color', (model && model.color) || '#F5A623');
    box.setAttribute('width', '400');
    box.setAttribute('height', '250');
    box.setAttribute('depth', '250');
    wrapper.appendChild(box);
  }

  return wrapper;
}

// --- NFT marker entity + found/lost wiring ---

function buildNftEntity(noun) {
  const nft = document.createElement('a-nft');
  nft.setAttribute('type', 'nft');
  nft.setAttribute('url', new URL(noun.marker, window.location.href).href);
  nft.setAttribute('smooth', 'true');
  nft.setAttribute('smoothCount', '10');
  nft.setAttribute('smoothTolerance', '0.01');
  nft.setAttribute('smoothThreshold', '5');
  nft.dataset.nounId = noun.id;

  nft.appendChild(buildModelEntity(noun.model));

  nft.addEventListener('markerFound', () => {
    labelEn.textContent = noun.labels.en;
    labelBm.textContent = noun.labels.bm;
    labelSemai.textContent = noun.labels.semai;
    label.classList.add('visible');
  });

  nft.addEventListener('markerLost', () => {
    label.classList.remove('visible');
  });

  return nft;
}

// --- Scene lifecycle ---

function buildScene() {
  const scene = document.createElement('a-scene');
  scene.setAttribute('vr-mode-ui', 'enabled: false');
  scene.setAttribute('embedded', '');
  const cameraParametersUrl = new URL('data/camera_para.dat', window.location.href).href;
  const deviceIdPart = selectedCameraId ? ` deviceId: ${selectedCameraId};` : '';
  scene.setAttribute('arjs', `sourceType: webcam; trackingMethod: best; debugUIEnabled: false; cameraParametersUrl: ${cameraParametersUrl};${deviceIdPart}`);
  scene.setAttribute('renderer', 'logarithmicDepthBuffer: true; precision: medium;');

  nouns.forEach((noun) => scene.appendChild(buildNftEntity(noun)));

  const cameraEl = document.createElement('a-entity');
  cameraEl.setAttribute('camera', '');
  scene.appendChild(cameraEl);

  scene.addEventListener('loaded', () => {
    window.addEventListener('arjs-video-loaded', () => {
      arjsLoader.hidden = true;
      refreshCameraList();
    }, { once: true });
  });

  return scene;
}

function stopAllCameraTracks() {
  document.querySelectorAll('video').forEach((video) => {
    const stream = video.srcObject;
    if (stream && stream.getTracks) {
      stream.getTracks().forEach((track) => track.stop());
    }
  });
}

startBtn.addEventListener('click', () => {
  startScreen.hidden = true;
  arView.hidden = false;
  arjsLoader.hidden = false;
  label.classList.remove('visible');
  sceneContainer.innerHTML = '';
  sceneContainer.appendChild(buildScene());
});

backBtn.addEventListener('click', () => {
  stopAllCameraTracks();
  sceneContainer.innerHTML = '';
  arView.hidden = true;
  startScreen.hidden = false;
  label.classList.remove('visible');
});

// --- Fullscreen toggle ---
const fullscreenBtn = document.getElementById('fullscreen-btn');
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

// --- PWA install prompt ---
let deferredInstallPrompt = null;
const installButton = document.getElementById('install-button');

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  installButton.hidden = true;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
});

window.addEventListener('appinstalled', () => {
  installButton.hidden = true;
});

// --- Service worker ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.error('Service worker registration gagal', err);
    });
  });
}

// --- Hard refresh (clear SW + caches, force fresh reload) ---
const updateBtn = document.getElementById('update-btn');
updateBtn.addEventListener('click', async () => {
  updateBtn.disabled = true;
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    }
    if (window.caches) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
  } catch (err) {
    console.error('Gagal kemaskini app', err);
  }
  window.location.href = window.location.href.split('#')[0] + '?_r=' + Date.now();
});
