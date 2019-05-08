// SCENE VARIABLES
var renderer = null,
  scene = null,
  camera = null,
  root = null,
  robot_idle = null,
  group = null;

// VARIABLES FOR THE GAME
var gameOn = false,
  difficult = 2;

// VARIABLES FOR THE ROBOTS
var robots_mixers = [],
  robots = [],
  robot_mixer = {},
  animations = [],
  robotNames = 1,
  animation = "idle";

// VARIABLES FOR THE TIMES
var duration = 20000, // ms
  currentTime = Date.now(),
  intervalCreateRobots = null,
  intervalTimer = null;

// VARIABLES FOR THE GAME TIME
var gameTime = 40, // 40 seg
  time = 0,
  score = 0,
  walkingRobotAnimation = 0.004,
  walkingRobotTranslation = 0.055;

// VARIABLES FOR THE RAYCAST
var raycaster = new THREE.Raycaster(),
  mouse = new THREE.Vector2();

// VARIBLES FOR THE POSITIONS OF THE ROBOTS
var minX = -38,
  maxX = 38,
  minZ = -75,
  maxZ = 105;


function getXPositionRandom() {
  minX = Math.ceil(minX);
  maxX = Math.floor(maxX);
  return Math.floor(Math.random() * (maxX - minX + 1)) + minX;
}

function createDeadAnimation() {


}

function loadFBX() {
  var loader = new THREE.FBXLoader();
  loader.load('../Course-material/Code-samples/models/Robot/robot_idle.fbx', function(object) {
    robot_mixer["idle"] = new THREE.AnimationMixer(scene);
    object.scale.set(0.02, 0.02, 0.02);
    object.traverse(function(child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    robot_idle = object;

    createDeadAnimation();

    robot_mixer["idle"].clipAction(object.animations[0], robot_idle).play();
    object.animations[0].name = "idle";
    animations.push(object.animations[0]);

    loader.load('../Course-material/Code-samples/models/Robot/robot_run.fbx', function(object) {
      robot_mixer["run"] = new THREE.AnimationMixer(scene);
      robot_mixer["run"].clipAction(object.animations[0], robot_idle).play();
      object.animations[0].name = "run";
      animations.push(object.animations[0]);
    });

    loader.load('../Course-material/Code-samples/models/Robot/robot_walk.fbx', function(object) {
      robot_mixer["walk"] = new THREE.AnimationMixer(scene);
      robot_mixer["walk"].clipAction(object.animations[0], robot_idle).play();
      object.animations[0].name = "walk";
      animations.push(object.animations[0]);
    });
  });
}

function timer() {
  contador_s = 0;
  time = document.getElementById("time");
  intervalTimer = window.setInterval(function() {
    time.innerHTML = (gameTime - contador_s).toString() + " seg";
    contador_s++;
    if (contador_s === gameTime) {
      gameOn = true;
      startGame();
    }
  }, 1000);
}

function startGame() {
  if (!gameOn) {
    gameOn = true;
    score = 0;
    document.getElementById("score").innerHTML = score.toString() + " pts";
    timer();
    createRobots();
    document.getElementById("start").value = "Stop";
  } else {
    clearAllRobots();
    window.clearInterval(intervalTimer);
    window.clearInterval(intervalCreateRobots);
    gameOn = false;
    time = 40;
    document.getElementById("start").value = "Start";
    document.getElementById("time").innerHTML = time.toString() + " seg";
  }
}

function animate() {
  var now = Date.now();
  var deltat = now - currentTime;
  currentTime = now;

  if (robots.length === 0 && gameOn) {
    // EL JUEGO HA COMENZADO
  }

  if (robots.length > 0 && gameOn) {
    // EL JUEGO ESTA CORRIENDO
    robots_mixers.forEach((mixer, index) => {
      mixer.update(deltat * walkingRobotAnimation);
      robots[index].position.z += deltat * walkingRobotTranslation;
      if (robots[index].position.z >= maxZ) {
        scene.remove(robots[index]);
        robots.splice(index, 1);
        robots_mixers.splice(index, 1);
        // console.log("Te metierón un punto");
        score -= 1;
        document.getElementById("score").innerHTML = score.toString() + " pts";
      }
      if (robots[index].name === "eliminado") {
        scene.remove(robots[index]);
        robots.splice(index, 1);
        robots_mixers.splice(index, 1);
      }
    })
  }

  if (robots.length === 0 && !gameOn) {
    // NO HAY ROBOTS CUANDO NO HAY JUEGO
  }

  if (robots.length > 0 && !gameOn) {
    // clearAllRobots();
  }

  if (animation == "dead") {
    KF.update();
  }
}

function createRobots() {
  intervalCreateRobots = window.setInterval(function() {
    if (gameOn) {
      var newRobot = cloneFbx(robot_idle);
      newRobot.position.set(getXPositionRandom(), 0, minZ);
      newRobot.name = robotNames.toString();

      var mixer = new THREE.AnimationMixer(newRobot);
      mixer.clipAction(animations[1]).play();

      scene.add(newRobot);

      robots.push(newRobot);
      // console.log(robots);
      robots_mixers.push(mixer);
      // console.log(robots_mixers);

      robotNames += 1;
    }
  }, difficult * 1000);
}

function clearAllRobots() {
  robots.forEach((robot) => {
    scene.remove(robot);
  });
  robots = [];
  robots_mixers = [];
  robotNames = 1;
}

function onMouseDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  var intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 1) {
    if (gameOn) {
      intersects[0].object.parent.name = "eliminado";
      score++;
      document.getElementById("score").innerHTML = score.toString() + " pts";
    } else {
      // console.log("Toco al objeto pero no ha comenzado el juego");
    }
  } else {
    // console.log("No toco nada");
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function run() {
  requestAnimationFrame(function() {
    run();
  });

  // Render the scene
  renderer.render(scene, camera);

  // If the game is on
  if (gameOn) {
    animate();
  }
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
var mapUrl = "./images/checker_large.gif";

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
