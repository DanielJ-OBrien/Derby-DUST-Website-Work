import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {FirstPersonControls} from 'three/examples/jsm/controls/FirstPersonControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var currentFocus = new THREE.Vector3(0, 0, 0);
var hdrFile;
const clock = new THREE.Clock();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

async function loadModels(data) {
    try {
      const modelLoaderScript = 'model_loader.php';
      const modelFolder = `scenedata/${data}`;
  
      // Fetch the model file names from the PHP script
      const response = await fetch(`${modelLoaderScript}?folder=${
        encodeURIComponent(modelFolder)
      }`);
  
      const fileNames = await response.json();
  
  
      // Iterate through each model file
      for (const fileName of fileNames) {
        const modelPath = `${modelFolder}/${fileName}`;
        const loader = new GLTFLoader();
        loader.load(modelPath, function (gltf) {
          const mainModel = gltf.scene;
          const modelCenter = calculateModelCenter(mainModel);
          console.log('Model center:', modelCenter);
          scene.add(mainModel);
        }, undefined, function (error) {
          console.error('Error loading model:', error);
        });
      }
    } catch (error) {
      console.error('Error loading models:', error);
    }
}

loadModels('Bridge');
loadModels('Train Station');

fetch('bg_loader.php')
    .then(response => response.blob())
    .then(blob => {
        var url = URL.createObjectURL(blob);
        var loader = new RGBELoader();
        loader.setDataType(THREE.FloatType);
        var loader = new RGBELoader();
        loader.setDataType(THREE.FloatType);
        loader.load(url, function (texture) {
        var pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();

        var envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        scene.background = envMap;
        scene.backgroundBlurriness = 50;
        texture.dispose();
        pmremGenerator.dispose();
        });
  })
  .catch(error => {
    console.log(error);
});

//Old lighitng code, may be useful for debugging. Replaced by the HDR lighitng.

/* Base ambient light
const color = 0xFFFFFF;
const intensity = 1;
const ambientLight = new THREE.AmbientLight(color, intensity);
scene.add(ambientLight);

// Directional light for sun
const directionalLight = new THREE.DirectionalLight(color, intensity * 10);
directionalLight.position.set(0, 10, 0);
directionalLight.target.position.set(5, 0, -5);
scene.add(directionalLight);
scene.add(directionalLight.target);
*/

// Create orbit controls
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.minZoom = 10; // Adjust the minimum zoom distance
orbitControls.maxZoom = 100; // Adjust the maximum zoom distance
camera.position.set(0, 25, 60);
orbitControls.update();

// Create first person controls
const firstPersonControls = new FirstPersonControls(camera, renderer.domElement);
firstPersonControls.movementSpeed = 50; // Adjust the movement speed as desired
firstPersonControls.lookSpeed = 2; // Adjust the look speed as desired

// Sets default active controls
let activeControls = orbitControls;

// Raycaster for click detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
document.addEventListener('click', onClick);

// Set up keyboard movement
const keyboardState = {};
document.addEventListener('keyup', (e) => {
    keyboardState[e.code] = false;
});

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

scene.position.set(0, 0, 0);

fetch('projects.json').then(response => response.json()).then(data => { // Loop through each entry in the JSON data
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            const entry = data[key];
            const values = entry.split(',');

            // Check if there are three values separated by commas
            if (values.length === 4) { // Extract the position values
                const x = parseFloat(values[0].trim());
                const y = parseFloat(values[1].trim());
                const z = parseFloat(values[2].trim());

                // Create a clickable point
                if (values[3] != " a") {
                    createClickablePoint(new THREE.Vector3(x, y + 25, z), key);
                }
            } else { // Skip this entry if the values are not in the expected format
                console.error(`Invalid format for entry: ${entry}`);
            }
        }
    }
}).catch(error => {
    console.error('Error:', error);
});

function animate() {
    requestAnimationFrame(animate);

    // Update the active controls
    activeControls.update();

    // Check if the active controls are the orbit controls
    const isOrbitControls = activeControls === orbitControls;

    if (isOrbitControls) {
        firstPersonControls.enabled = false;
        orbitControls.enabled = true;
        camera.lookAt(currentFocus);
    } else {
        orbitControls.enabled = false;
        firstPersonControls.enabled = true;
        camera.lookAt(currentFocus);
    }

    // Render the scene
    renderer.render(scene, camera);
}

let activeBoxes = {
    dataBox: null,
    overviewBox: null
};

let scrollableBox;
let activeBox;

function showBox(name, isOverview = false) { // Load the JSON file
    fetch('projects.json').then(response => response.json()).then(data => {
        activeBox = isOverview ? activeBoxes.overviewBox : activeBoxes.dataBox;

        try {
            if (activeBox) {
                document.body.removeChild(activeBox);
                activeBoxes[isOverview ? 'overviewBox' : 'dataBox'] = null;
                return;
            }
        } catch (error) {
            console.error("An error occurred:", error);
            // Continue running or perform any desired action
        }

        // Create a box element
        const boxElement = document.createElement('div');
        boxElement.className = isOverview ? 'custom-box2' : 'custom-box';

        // Create a title element
        const titleElement = document.createElement('div');
        titleElement.className = 'title';
        titleElement.textContent = isOverview ? 'Projects' : name;

        // Create a close button container
        const closeButtonContainer = document.createElement('div');
        closeButtonContainer.className = 'close-button-container';

        // Append the title to the box element
        boxElement.appendChild(titleElement);

        // Add the text container or loop through the JSON data for overview box
        if (isOverview) {
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const entry = data[key];
                    const entryBox = document.createElement('div');
                    entryBox.className = 'entry-box';
                    entryBox.textContent = key;
                    entryBox.addEventListener('click', () => {
                        goto(key);
                    });
                    boxElement.appendChild(entryBox);
                }
            }
        } else { // Create a text container
            const textContainer = document.createElement('div');
            textContainer.className = 'text-container';
            textContainer.textContent = data[name] || 'No information available';
            boxElement.appendChild(textContainer);


            // Create a scrollable horizontal box
            scrollableBox = document.createElement('div');
            scrollableBox.className = 'scrollable-box';

            document.body.appendChild(scrollableBox);

            const button = document.createElement('button');
            button.textContent = 'Load Images';
            button.addEventListener('click', () => {
                loadImages(name);
            });

            // Append the button to the scrollable box
            scrollableBox.appendChild(button);
        }

        // Create a close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.addEventListener('click', () => {
            const scrollableBoxCheck = document.querySelector('.scrollable-box');
            if (scrollableBoxCheck && scrollableBoxCheck.classList.contains('scrollable-box')) { // Remove the 'scrollable-box' class
                scrollableBoxCheck.classList.remove('scrollable-box');
                // Remove the element from the DOM
                scrollableBoxCheck.parentNode.removeChild(scrollableBoxCheck);
            }
            document.body.removeChild(boxElement);
            activeBoxes[isOverview ? 'overviewBox' : 'dataBox'] = null;
        });

        // Append the close button to the close button container
        closeButtonContainer.appendChild(closeButton);

        // Append the box element to the body
        document.body.appendChild(boxElement);
        ``
        boxElement.appendChild(closeButtonContainer);

        activeBoxes[isOverview ? 'overviewBox' : 'dataBox'] = boxElement;
    }).catch(error => console.error('Error:', error));
}

const overviewButton = document.getElementById('overviewButton');
overviewButton.addEventListener('click', () => showBox(null, true));

function createClickablePoint(position, name) {
    const sphereGeometry = new THREE.SphereGeometry(1);
    const sphereMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
    const clickablePoint = new THREE.Mesh(sphereGeometry, sphereMaterial);
    clickablePoint.position.copy(position); // Set the position
    clickablePoint.name = name; // Set the name
    clickablePoint.userData.isClickable = true; // Set a custom property
    scene.add(clickablePoint);
    clickablePoint.addEventListener('click', onClick); // Add click event listener
    clickablePoint.addEventListener('touchstart', onClick); // Add touch event listener for mobile devices
}

function onClick(event) { // Calculate mouse position in normalized device coordinates (-1 to +1) for raycasting
    if(activeControls == orbitControls){
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
        // Raycasting from the camera position
        raycaster.setFromCamera(mouse, camera);
    
        // Check for intersections with the clickable points
        const intersects = raycaster.intersectObjects(scene.children);
    
        // Filter intersected objects to only consider clickable spheres
        const clickableIntersects = intersects.filter(obj => obj.object.userData.isClickable);
    
        if (clickableIntersects.length > 0) {
            const clickedObject = clickableIntersects[0].object;
            showBox(clickedObject.name);
        }   
    }
}

function calculateModelCenter(object) {
    const box = new THREE.Box3().setFromObject(object);
    const center = new THREE.Vector3();
    box.getCenter(center);
    return center;
}

function goto(key, check = true) {
    fetch('projects.json').then(response => response.json()).then(data => {
        const value = data[key];
        const values = value.split(',');

        if (values.length === 4) {
            const x = parseFloat(values[0].trim());
            const y = parseFloat(values[1].trim());
            const z = parseFloat(values[2].trim());

            // Teleport the camera to the center of the model
            const modelCenter = new THREE.Vector3(x, y, z);

            // Adjust the camera's zoom level
            let zoomLevel = 10; // Adjust the desired zoom level
            let cameraRotation = 25;
            if (! check) {
                zoomLevel = 0.1; // Adjust the desired zoom level
                cameraRotation = 0.1;
            }
            camera.position.y += cameraRotation;
            camera.position.z += zoomLevel;

            camera.position.set(x, y + cameraRotation, z + zoomLevel);

            // Update the camera's lookAt position
            orbitControls.target = modelCenter;
            camera.lookAt(modelCenter);

            // Update the currentFocus variable for first-person controls
            currentFocus.copy(modelCenter);
        }
    }).catch(error => console.error('Error:', error));
}

async function loadImages(data) {
    try {
        const imageLoaderScript = 'image_loader.php';
        const imageFolder = `scenedata/${data}/images`;

        // Fetch the image file names from the PHP script
        const response = await fetch(`${imageLoaderScript}?folder=${
            encodeURIComponent(imageFolder)
        }`);


        const fileNames = await response.json();

        // Iterate through each image file
        for (const fileName of fileNames) {
            const imageElement = document.createElement('img');
            imageElement.src = `${imageFolder}/${fileName}`;
            imageElement.className = 'image-square';
            imageElement.addEventListener('click', () => {
                openFullscreenImage(imageElement.src);
            });
            scrollableBox.appendChild(imageElement);
        }
    } catch (error) {
        console.error('Error loading images:', error);
    }
}

function openFullscreenImage(imageSrc) {
    const oldTarget = orbitControls.target.clone();
    const oldPosition = camera.position.clone();

    const sphereGeometry = new THREE.SphereGeometry(5, 60, 40);
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(imageSrc);
    const material = new THREE.MeshBasicMaterial({map: texture, side: THREE.DoubleSide});
    const sphereMesh = new THREE.Mesh(sphereGeometry, material);
    scene.add(sphereMesh);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    document.body.appendChild(closeButton);

    closeButton.addEventListener('click', () => {
        scene.remove(sphereMesh);
        closeButton.remove();
        const elementsToRemove = document.querySelectorAll('.scrollable-box, .custom-box, .custom-box2, #overviewButton');
        elementsToRemove.forEach(element => {
            element.style.display = "flex";
        });

        camera.position.copy(oldPosition);
        orbitControls.target.copy(oldTarget);
        camera.lookAt(oldTarget);
        currentFocus.copy(oldTarget);
    });

    const elementsToRemove = document.querySelectorAll('.scrollable-box, .custom-box, .custom-box2, #overviewButton');
    elementsToRemove.forEach(element => {
        element.style.display = "none";
    });

    goto('Center', false);
}

// Set up the icon
const icon = document.getElementById('icon');
let iconDragging = false;

// Event listeners for icon interactions
icon.addEventListener('mousedown', () => {
    if(activeControls == orbitControls){
        iconDragging = true;
        icon.style.cursor = 'grabbing';
    }

});

document.addEventListener('mousemove', (event) => {
  if (iconDragging && activeControls == orbitControls) {
    const posX = event.clientX - icon.offsetWidth / 2;
    const posY = event.clientY - icon.offsetHeight / 2;
    icon.style.left = `${posX}px`;
    icon.style.top = `${posY}px`;
  }
});

document.addEventListener('mouseup', () => {
    if (iconDragging && activeControls == orbitControls) {
        iconDragging = false;
        icon.style.cursor = 'grab';
        icon.style.left = `calc(50% - ${icon.offsetWidth / 2}px)`;
        icon.style.top = `calc(5% - ${icon.offsetHeight / 2}px)`;

        // Perform raycasting to detect the model behind the icon
        const mouse = new THREE.Vector2();
        const raycaster = new THREE.Raycaster();

        // Calculate normalized device coordinates (NDC) based on mouse position
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Set up the raycaster
        raycaster.setFromCamera(mouse, camera);

        // Perform the raycasting
        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
            // Get the position of the first intersected surface
            const position = intersects[0].point;
        
            // Move the camera to the position
            const newPosition = new THREE.Vector3(position.x, position.y + 10, position.z);
            camera.position.copy(newPosition);
        
            // Update the currentFocus variable for first-person controls
            currentFocus.copy(position);
        
            // Render the scene to update the camera position immediately
            renderer.render(scene, camera);

            // Switch to non-orbit controls
            activeControls = firstPersonControls;
        
            // Add a back button
            const backButton = document.createElement('button');
            backButton.textContent = 'Back';
            backButton.style.position = 'absolute';
            backButton.style.top = '50px';
            backButton.style.right = '50px';
            document.body.appendChild(backButton);
        
            // Add an event listener to the back button
            backButton.addEventListener('click', () => {
                // Switch back to orbit controls
                activeControls = orbitControls;
        
                // Reset the camera position and rotation
                camera.position.copy(originalCameraPosition);
                camera.rotation.copy(originalCameraRotation);
        
                // Remove the back button
                document.body.removeChild(backButton);
        
                // Render the scene to update the camera position immediately
                renderer.render(scene, camera);
            });
        }
        
        
    }
});



animate();
