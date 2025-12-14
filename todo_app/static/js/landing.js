// 3D Animation for Landing Page using Three.js

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('canvas-container');

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.002);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Geometry - Floating Objects
    const geometry = new THREE.IcosahedronGeometry(1, 1);
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 700;

    const posArray = new Float32Array(particleCount * 3);

    for(let i = 0; i < particleCount * 3; i++) {
        // Random positions
        posArray[i] = (Math.random() - 0.5) * 100; 
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Materials
    const material = new THREE.MeshPhongMaterial({
        color: 0x00f3ff,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });

    const materialSolid = new THREE.MeshPhongMaterial({
        color: 0xbc13fe,
        flatShading: true,
        transparent: true,
        opacity: 0.8
    });

    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.15,
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
    });

    // Create Mesh Objects
    const mainObj = new THREE.Mesh(new THREE.IcosahedronGeometry(10, 1), material);
    scene.add(mainObj);

    const innerObj = new THREE.Mesh(new THREE.IcosahedronGeometry(5, 0), materialSolid);
    scene.add(innerObj);

    // Create Particles
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00f3ff, 1);
    pointLight.position.set(20, 20, 20);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xbc13fe, 1);
    pointLight2.position.set(-20, -20, 20);
    scene.add(pointLight2);


    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (event) => {
        mouseX = event.clientX - window.innerWidth / 2;
        mouseY = event.clientY - window.innerHeight / 2;
    });

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);

        const time = Date.now() * 0.0005;

        // Rotate main objects
        mainObj.rotation.x += 0.001;
        mainObj.rotation.y += 0.002;

        innerObj.rotation.x -= 0.002;
        innerObj.rotation.y -= 0.001;

        // Rotate particles
        particlesMesh.rotation.y = -mouseX * 0.0001;
        particlesMesh.rotation.x = -mouseY * 0.0001;

        // Subtle camera movement based on mouse
        camera.position.x += (mouseX * 0.01 - camera.position.x) * 0.05;
        camera.position.y += (-mouseY * 0.01 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    }

    animate();

    // Handle Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});