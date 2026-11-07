import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import data from "./iglesias.json"
import map_tx from "./mapa_cyl.png"


let scene, renderer, camera, cam_controls;

let map, 
    map_w,
    map_h,
    scale = 5;

let objects = [];

let min_lat = data.limites.lat_min;
let max_lat = data.limites.lat_max;
let min_lon = data.limites.lon_min;
let max_lon = data.limites.lon_max;

let MAX_HEIGHT = 1.5;
let MAX_COLOR = new THREE.Color(0xffe066);
let MIN_COLOR = new THREE.Color(0xd62828);


init();
animate();

function init() {
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
            
            createGrid(60);
            addLights();
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
    const rows = Math.round(cols * map_h / map_w);
    const cell_w = map_w / cols;
    const cell_h = map_h / rows;

    const church_count = countChurches(rows, cols, cell_w, cell_h);
    const not_zeros = church_count.filter(c => c > 0).length;
    const max = Math.max(...church_count);

    const geometry = new THREE.BoxGeometry(cell_w * 0.9, cell_h * 0.9);
    const material = new THREE.MeshLambertMaterial();
    const bars = new THREE.InstancedMesh(geometry, material, not_zeros);
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
            bars.setColorAt(k, color.lerpColors(MAX_COLOR, MIN_COLOR, t));

            k++;
        }
    }

    bars.instanceMatrix.needsUpdate = true;
    bars.instanceColor.needsUpdate = true;

    objects.push(bars);
    scene.add(bars);

}


function countChurches(rows, cols, cell_w, cell_h) {
    const count = new Array(cols * rows).fill(0);
    
    for (const c of data.puntos) {
        const {x, y} = geoToScene(c.lat, c.lon);

        const i = Math.min(cols - 1, Math.floor((x + map_w / 2) / cell_w));
        const j = Math.min(rows - 1, Math.floor((y + map_h / 2) / cell_h));

        if (i < 0 || j < 0) continue;

        count[j * cols + i]++;
    }

    return count;
}

function addLights() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(-3, -4, 6);
    scene.add(sun);
}