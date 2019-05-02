// SCENE VARIABLES
var renderer = null,
  scene = null,
  camera = null,
  root = null,
  robot_idle = null,
  group = null;

// VARIABLES FOR THE GAME
var gameOn = false;

// VARIABLES FOR THE ROBOT
var robot_mixer = {};
var deadAnimator;
var animation = "idle";

// VARIABLES FOR THE TIMES
var duration = 20000; // ms
var currentTime = Date.now();

// VARIABLES FOR THE GAME TIME
var gameTime = 10, // 10seg
  time = 0,
  score = 0;

// VARIABLES FOR THE RAYCAST
var raycaster = new THREE.Raycaster(),
  mouse = new THREE.Vector2();


function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function timer() {
  contador_s = 0;
  contador_m = 0;
  time = document.getElementById("time");
  window.setInterval(function() {
    time.innerHTML = (gameTime - contador_s).toString() + " seg";
    contador_s++;
    if (contador_s === gameTime) {
      console.log("El tiempo ha acabado");
    }
  }, 1000);
}

function startGame() {
  if (!gameOn) {
    gameOn = true;
    timer();
    document.getElementById("start").value = "Stop";
    animation = "run";
  } else {
    gameOn = false;
    time = 60;
    score = 0;
    document.getElementById("start").value = "Start";
    document.getElementById("time").innerHTML = time.toString() + " seg";
    document.getElementById("score").innerHTML = score.toString() + " pts";
    animation = "idle";
  }

  // if (animation == "dead") {
  //   createDeadAnimation();
  // } else {
  //   robot_idle.rotation.x = 0;
  //   robot_idle.position.y = -4;
  // }
}

function createDeadAnimation() {

}

function loadFBX() {
  var loader = new THREE.FBXLoader();
  loader.load('../Course-material/Code-samples/models/Robot/robot_idle.fbx', function(object) {
    robot_mixer["idle"] = new THREE.AnimationMixer(scene);
    object.scale.set(0.02, 0.02, 0.02);
    object.position.x += 38;
    object.position.y = 0;
    object.position.z -= 75;
    object.traverse(function(child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    robot_idle = object;
    scene.add(robot_idle);

    createDeadAnimation();

    robot_mixer["idle"].clipAction(object.animations[0], robot_idle).play();

    loader.load('../Course-material/Code-samples/models/Robot/robot_run.fbx', function(object) {
      robot_mixer["run"] = new THREE.AnimationMixer(scene);
      robot_mixer["run"].clipAction(object.animations[0], robot_idle).play();
    });

    loader.load('../Course-material/Code-samples/models/Robot/robot_walk.fbx', function(object) {
      robot_mixer["walk"] = new THREE.AnimationMixer(scene);
      robot_mixer["walk"].clipAction(object.animations[0], robot_idle).play();
    });
  });
}

function animate() {

  var now = Date.now();
  var deltat = now - currentTime;
  currentTime = now;

  if (robot_idle && robot_mixer[animation]) {
    robot_mixer[animation].update(deltat * 0.001);

  }

  if (animation == "dead") {
    KF.update();
  }
}

function onMouseDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  var intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 1) {
    if (gameOn) {
      // console.log("Toco al objeto +1 punto");
      score++;
      document.getElementById("score").innerHTML = score.toString() + " pts";
    } else {
      // console.log("Toco al objeto pero no ha comenzado el juego");
    }
  } else {
    // console.log("No toco nada");
  }
}

function run() {
  requestAnimationFrame(function() {
    run();
  });

  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // Render the scene
  renderer.render(scene, camera);

  // Spin the cube for next frame
  animate();
}

function setLightColor(light, r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  light.color.setRGB(r, g, b);
}

var directionalLight = null;
var spotLight = null;
var ambientLight = null;
var mapUrl = "../Course-material/Code-samples/images/checker_large.gif";

var SHADOW_MAP_WIDTH = 2048,
  SHADOW_MAP_HEIGHT = 2048;

function createScene(canvas) {

  // Create the Three.js renderer and attach it to our canvas
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
  });

  // Set the viewport size
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Turn on shadows
  renderer.shadowMap.enabled = true;
  // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Create a new Three.js scene
  scene = new THREE.Scene();

  // Add  a camera so we can view the scene
  camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 1, 4000);
  camera.position.set(0, 50, 151);
  camera.rotation.set(-44.4, 0, 0);
  scene.add(camera);

  // Create a group to hold all the objects
  root = new THREE.Object3D;

  spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(0, 80, 110);
  spotLight.target.position.set(-2, 0, -2);
  root.add(spotLight);

  spotLight.castShadow = true;

  spotLight.shadow.camera.near = 1;
  spotLight.shadow.camera.far = 200;
  spotLight.shadow.camera.fov = 45;

  spotLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
  spotLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

  ambientLight = new THREE.AmbientLight(0x888888);
  root.add(ambientLight);

  // Create the objects
  loadFBX();

  // Create a group to hold the objects
  group = new THREE.Object3D;
  root.add(group);

  // Create a texture map
  var map = new THREE.TextureLoader().load(mapUrl);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(8, 8);

  var color = 0xffffff;

  // Put in a ground plane to show off the lighting
  geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
  var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
    color: color,
    map: map,
    side: THREE.DoubleSide
  }));

  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -4.02;

  // Add the mesh to our group
  group.add(mesh);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  raycaster = new THREE.Raycaster();

  // Now add the group to our scene
  scene.add(root);

  window.addEventListener('mousedown', onMouseDown);
}
