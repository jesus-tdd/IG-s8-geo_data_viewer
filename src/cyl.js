import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as dat from "dat.gui";

import data from "./iglesias.json";
import map_tx from "./mapa_cyl.png";

let scene, renderer, camera, cam_controls;

let title, legend_ticks=[];
const LEGEND_STEPS = [0, 0.25, 0.5, 0.75, 1];

let map, 
    map_w,
    map_h,
    scale = 5;

let min_lat = data.limites.lat_min;
let max_lat = data.limites.lat_max;
let min_lon = data.limites.lon_min;
let max_lon = data.limites.lon_max;

let MAX_HEIGHT = 1.5;

const COLOR_PALETTE = [
    [0.0,  new THREE.Color("#0b0b3b")],
    [0.3,  new THREE.Color("#4a1fb8")],
    [0.55, new THREE.Color("#ff2e93")],
    [0.8,  new THREE.Color("#ff9f1c")],
    [1.0,  new THREE.Color("#ffe600")],
];

const FILTERS = {
    "church": c => c.tipo == "iglesia",
    "monastery": c => c.tipo == "monasterio",
    "cathedral": c => c.tipo == "catedral",
    "chapel": c => c.tipo == "ermita_capilla",
    "other": c => c.tipo == "otros"
}

const filter_statuses = {
    "church": true,
    "monastery": true,
    "cathedral": true,
    "chapel": true,
    "other": true
}

const settings = {
    "cols": 60
}

let bars;

init();
animate();

function init() {
    setTitle();
    createLegend();

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    cam_controls = new OrbitControls(camera, renderer.domElement);

    const tx = new THREE.TextureLoader().load(
        map_tx,
        function (texture) {
            const tx_ratio = texture.image.width / texture.image.height;

            map_h = scale;
            map_w = map_h * tx_ratio;

            plane(0, 0, 0, map_w, map_h);

            map.material.map = texture;
            map.material.needsUpdate = true;
            
            createGrid(settings.cols);
            addLights();
            var gui = createGui();
        }
    );
}


function animate() {
    requestAnimationFrame(animate);
    cam_controls.update();
    renderer.render(scene, camera);
}


function plane(px, py, pz, sx, sy) {
  let geometry = new THREE.PlaneGeometry(sx, sy);
  let material = new THREE.MeshBasicMaterial({});
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  scene.add(mesh);
  map = mesh;
}

function geoToScene(lat, lon) {
    const x = ((lon - min_lon)/(max_lon - min_lon) - 0.5) * map_w;
    const y = ((lat - min_lat)/(max_lat - min_lat) - 0.5) * map_h;
    return {x, y};
}


function createGrid(cols) {
    clearGrid();

    const rows = Math.round(cols * map_h / map_w);
    const cell_w = map_w / cols;
    const cell_h = map_h / rows;

    const church_count = countChurches(rows, cols, cell_w, cell_h);
    const not_zeros = church_count.filter(c => c > 0).length;
    const max = Math.max(...church_count);
    
    updateLegend(max);
    
    if (max === 0) return;

    const geometry = new THREE.BoxGeometry(cell_w*0.9, cell_h*0.9);
    const material = new THREE.MeshLambertMaterial();
    bars = new THREE.InstancedMesh(geometry, material, not_zeros);
    // bars = new THREE.InstancedMesh(geometry, material, church_count.length);
    const color = new THREE.Color();

    const dummy = new THREE.Object3D();

    let k = 0;
    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
            const n = church_count[j * cols + i];
            if (n === 0) continue;

            const t = Math.sqrt(n/max);
            const h = Math.max(0.02, t * MAX_HEIGHT);

            dummy.position.set(
                (i + 0.5) * cell_w - (map_w / 2),
                (j + 0.5) * cell_h - (map_h / 2),
                h / 2
            );
            dummy.scale.set(1, 1, h);
            dummy.updateMatrix();

            bars.setMatrixAt(k, dummy.matrix);
            bars.setColorAt(k, colorHeatmap(t, color));

            k++;
        }
    }

    bars.instanceMatrix.needsUpdate = true;
    bars.instanceColor.needsUpdate = true;

    scene.add(bars);
}


function countChurches(rows, cols, cell_w, cell_h) {
    const count = new Array(cols * rows).fill(0);
    
    const points = data.puntos.filter((p) =>
        Object.entries(filter_statuses).some(
            ([key, active]) => active && FILTERS[key](p)
        )
    );
    
    for (const c of points) {
        const {x, y} = geoToScene(c.lat, c.lon);

        const i = Math.min(cols - 1, Math.floor((x + map_w / 2) / cell_w));
        const j = Math.min(rows - 1, Math.floor((y + map_h / 2) / cell_h));

        if (i < 0 || j < 0) continue;

        count[j * cols + i]++;
    }

    return count;
}

const tmp_c = new THREE.Color();
function colorHeatmap(t, out = tmp_c) {
    t = Math.min(1, Math.max(0, t));

    for (let k = 1; k < COLOR_PALETTE.length; k++) {
        const [t1, c1] = COLOR_PALETTE[k];
        if (t <= t1) {
            const [t0, c0] = COLOR_PALETTE[k-1];
            return out.copy(c0).lerp(c1, (t - t0)/(t1 - t0));
        }
    }
    return out.copy(COLOR_PALETTE.at(-1)[1]);
}

function clearGrid() {
    if (!bars) return;

    scene.remove(bars);
    bars.geometry.dispose();
    bars.material.dispose();
    bars.dispose();
    bars = null;
}

function addLights() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(-3, -4, 6);
    scene.add(sun);
}

function createGui() {
    const gui =  new dat.GUI();
    gui.add(settings, "cols", 1, 100, 1)
        .name("Columns")
        .onChange(() => createGrid(settings.cols));
    
    const filter_folder = gui.addFolder("Filters");
    filter_folder.add(filter_statuses, "cathedral").name("Cathedral").onChange(() => createGrid(settings.cols));
    filter_folder.add(filter_statuses, "church").name("Church").onChange(() => createGrid(settings.cols));
    filter_folder.add(filter_statuses, "chapel").name("Chapel").onChange(() => createGrid(settings.cols));
    filter_folder.add(filter_statuses, "monastery").name("Monastery").onChange(() => createGrid(settings.cols));
    filter_folder.add(filter_statuses, "other").name("Other").onChange(() => createGrid(settings.cols));
}
    
function setTitle() {
    title = document.createElement("div");
    title.id = "title";
    title.innerHTML = "Church density in Castile and León";
    document.body.appendChild(title);
}

function createLegend() {
    const legend = document.createElement("div");
    legend.id = "legend";

    const legend_title = document.createElement("div");
    legend_title.id = "legend-title";
    legend_title.innerHTML = "Churches per cell";
    legend.appendChild(legend_title);


    const stops = COLOR_PALETTE
        .map(([t, c]) => `${c.getStyle()} ${t * 100}%`)
        .join(", ");
    const bar = document.createElement("div");
    bar.id = "legend-bar";
    bar.style.background = `linear-gradient(to top, ${stops})`;
    legend.appendChild(bar);


    const ticks = document.createElement("div");
    ticks.id = "legend-ticks";
    for (const t of LEGEND_STEPS) {
        const span = document.createElement("span");
        span.style.bottom = `${t * 100}%`;
        ticks.appendChild(span);
        legend_ticks.push(span);
    }
    legend.appendChild(ticks);


    document.body.appendChild(legend);
}

function updateLegend(max) {
    let prev = null;
    LEGEND_STEPS.forEach((t, idx) => {

        const value = Math.round(t * t * max);
        const span = legend_ticks[idx];

        if (value === prev || max === 0) {
            span.style.display = "none";
        } else {
            span.style.display = "block";
            span.textContent = idx === LEGEND_STEPS.length - 1 ? value : value;
        }
        prev = value;
    });
}