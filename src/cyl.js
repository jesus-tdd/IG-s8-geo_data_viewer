import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import data from "./iglesias.json"
import map_tx from "./mapa_cyl.png"


let scene, renderer, camera, cam_controls;

let map, 
    map_x,
    map_y,
    scale = 5;

let objetos = [];

let min_lat = data.limites.lat_min;
let max_lat = data.limites.lat_max;
let min_lon = data.limites.lon_min;
let max_lon = data.limites.lon_max;

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

            map_y = scale;
            map_x = map_y * tx_ratio;

            plane(0, 0, 0, map_x, map_y);

            map.material.map = texture;
            map.material.needsUpdate = true;
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