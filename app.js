document.addEventListener("DOMContentLoaded", function () {
    const bgMusic = document.getElementById("bg-music");
    const muteToggle = document.getElementById("mute-toggle");

    // Set initial volume (lower for better UX)
    bgMusic.volume = 0.3;

    // Start muted by default to comply with autoplay policies
    muteToggle.classList.add("muted");
    muteToggle.setAttribute("title", "Sound is muted - click to enable");

    // Function to attempt audio play
    function attemptPlay() {
        const playPromise = bgMusic.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    muteToggle.classList.remove("muted");
                    muteToggle.setAttribute("title", "Click to mute");
                })
                .catch((error) => {
                    console.log("Autoplay prevented:", error);
                });
        }
    }

    // First attempt to play (will likely fail in most browsers)
    attemptPlay();

    // Set up user interaction handler
    function handleFirstInteraction() {
        // Remove all these event listeners after first interaction
        document.removeEventListener("click", handleFirstInteraction);
        document.removeEventListener("keydown", handleFirstInteraction);
        document.removeEventListener("touchstart", handleFirstInteraction);

        // Now that we have user interaction, try playing again
        attemptPlay();
    }

    // Add multiple interaction listeners
    document.addEventListener("click", handleFirstInteraction);
    document.addEventListener("keydown", handleFirstInteraction);
    document.addEventListener("touchstart", handleFirstInteraction);

    // Toggle mute/unmute
    muteToggle.addEventListener("click", function (e) {
        e.stopPropagation(); // Prevent triggering the document click handler

        if (bgMusic.paused) {
            bgMusic.play().then(() => {
                this.classList.remove("muted");
                this.setAttribute("title", "Click to mute");
            });
        } else {
            bgMusic.pause();
            this.classList.add("muted");
            this.setAttribute("title", "Sound is muted - click to enable");
        }
    });
});

window.onload = function () {
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 30, 120);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Camera controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let cameraDistance = 120;
    let cameraRotation = { x: 0, y: 0 };
    const defaultCameraPosition = { distance: 120, rotation: { x: 0, y: 0 } };

    document.addEventListener("mousedown", function (e) {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    document.addEventListener("mouseup", function () {
        isDragging = false;
    });

    document.addEventListener("mousemove", function (e) {
        if (isDragging) {
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y,
            };

            cameraRotation.y += deltaMove.x * 0.01;
            cameraRotation.x += deltaMove.y * 0.01;
            cameraRotation.x = Math.max(
                -Math.PI / 2,
                Math.min(Math.PI / 2, cameraRotation.x)
            );

            previousMousePosition = { x: e.clientX, y: e.clientY };
            updateCameraPosition();
        }
    });

    // Touch controls for mobile
    let touchStartPosition = { x: 0, y: 0 };

    document.addEventListener("touchstart", function (e) {
        if (e.touches.length === 1) {
            isDragging = true;
            touchStartPosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
            previousMousePosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
        } else if (e.touches.length === 2) {
            // Handle pinch zoom
            isDragging = false;
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
            initialCameraDistance = cameraDistance;
        }
    });

    document.addEventListener("touchmove", function (e) {
        if (e.touches.length === 1 && isDragging) {
            const deltaMove = {
                x: e.touches[0].clientX - previousMousePosition.x,
                y: e.touches[0].clientY - previousMousePosition.y,
            };

            cameraRotation.y += deltaMove.x * 0.01;
            cameraRotation.x += deltaMove.y * 0.01;
            cameraRotation.x = Math.max(
                -Math.PI / 2,
                Math.min(Math.PI / 2, cameraRotation.x)
            );

            previousMousePosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
            updateCameraPosition();
        } else if (e.touches.length === 2) {
            // Handle pinch zoom
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const pinchDistance = Math.sqrt(dx * dx + dy * dy);

            if (initialPinchDistance) {
                const pinchRatio = initialPinchDistance / pinchDistance;
                cameraDistance = initialCameraDistance * pinchRatio;
                cameraDistance = Math.max(30, Math.min(300, cameraDistance));
                updateCameraPosition();
            }
        }
        e.preventDefault();
    });

    document.addEventListener("touchend", function () {
        isDragging = false;
        initialPinchDistance = null;
    });

    let initialPinchDistance = null;
    let initialCameraDistance = cameraDistance;

    document.addEventListener("wheel", function (e) {
        cameraDistance += e.deltaY * 0.1;
        cameraDistance = Math.max(30, Math.min(300, cameraDistance));
        updateCameraPosition();
    });

    // Zoom buttons
    document.getElementById("zoom-in").addEventListener("click", function () {
        cameraDistance = Math.max(30, cameraDistance - 15);
        updateCameraPosition();
    });

    document.getElementById("zoom-out").addEventListener("click", function () {
        cameraDistance = Math.min(300, cameraDistance + 15);
        updateCameraPosition();
    });

    // Reset view button
    document
        .getElementById("reset-view")
        .addEventListener("click", function () {
            cameraDistance = defaultCameraPosition.distance;
            cameraRotation = {
                x: defaultCameraPosition.rotation.x,
                y: defaultCameraPosition.rotation.y,
            };
            updateCameraPosition();
        });

    function updateCameraPosition() {
        camera.position.x =
            cameraDistance *
            Math.sin(cameraRotation.y) *
            Math.cos(cameraRotation.x);
        camera.position.y = cameraDistance * Math.sin(cameraRotation.x);
        camera.position.z =
            cameraDistance *
            Math.cos(cameraRotation.y) *
            Math.cos(cameraRotation.x);
        camera.lookAt(0, 0, 0);
    }

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    // Create solar glow effect
    function createSolarGlow(radius, color) {
        const glowGeometry = new THREE.SphereGeometry(radius, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide,
        });
        return new THREE.Mesh(glowGeometry, glowMaterial);
    }

    // Stars background
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];

    for (let i = 0; i < 5000; i++) {
        const x = (Math.random() - 0.5) * 1000;
        const y = (Math.random() - 0.5) * 1000;
        const z = (Math.random() - 0.5) * 1000;
        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(starVertices, 3)
    );
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.7,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Enhanced planet data with increased speed
    const planetData = {
        sun: {
            radius: 10,
            color: 0xffdd00,
            info: {
                Type: "Star",
                Diameter: "1.39 million km",
                Mass: "1.989 × 10³⁰ kg",
                Temperature: "5,500°C (surface)",
                Composition: "73% Hydrogen, 25% Helium",
            },
        },
        mercury: {
            radius: 1,
            distance: 20,
            speed: 0.02, // Increased speed
            color: 0xaaaaaa,
            tilt: 0.035,
            rotationSpeed: 0.008, // Increased rotation
            info: {
                Type: "Terrestrial Planet",
                Diameter: "4,880 km",
                "Distance from Sun": "57.9 million km",
                "Orbital Period": "88 days",
                Temperature: "-173°C to 427°C",
                Moons: "None",
            },
        },
        venus: {
            radius: 1.8,
            distance: 30,
            speed: 0.016, // Increased speed
            color: 0xe6bc71,
            tilt: 177.3,
            rotationSpeed: 0.007, // Increased rotation
            info: {
                Type: "Terrestrial Planet",
                Diameter: "12,104 km",
                "Distance from Sun": "108 million km",
                "Orbital Period": "225 days",
                Temperature: "462°C",
                Atmosphere: "96.5% CO₂, 3.5% N₂",
            },
        },
        earth: {
            radius: 2,
            distance: 40,
            speed: 0.013, // Increased speed
            color: 0x2244bb,
            tilt: 23.4,
            rotationSpeed: 0.025, // Increased rotation
            info: {
                Type: "Terrestrial Planet",
                Diameter: "12,742 km",
                "Distance from Sun": "149.6 million km",
                "Orbital Period": "365.25 days",
                Moons: "1 (Luna)",
                Atmosphere: "78% N₂, 21% O₂",
            },
        },
        mars: {
            radius: 1.5,
            distance: 55,
            speed: 0.01, // Increased speed
            color: 0xc62828,
            tilt: 25.2,
            rotationSpeed: 0.02, // Increased rotation
            info: {
                Type: "Terrestrial Planet",
                Diameter: "6,779 km",
                "Distance from Sun": "227.9 million km",
                "Orbital Period": "687 days",
                Moons: "2 (Phobos & Deimos)",
                Features: "Olympus Mons, Valles Marineris",
            },
        },
        jupiter: {
            radius: 5,
            distance: 80,
            speed: 0.006, // Increased speed
            color: 0xe0ae6f,
            tilt: 3.1,
            rotationSpeed: 0.04, // Increased rotation
            info: {
                Type: "Gas Giant",
                Diameter: "139,820 km",
                "Distance from Sun": "778 million km",
                "Orbital Period": "12 years",
                Moons: "79 known",
                "Great Red Spot": "Giant storm lasting 350+ years",
            },
        },
        saturn: {
            radius: 4.5,
            distance: 110,
            speed: 0.003, // Increased speed
            color: 0xf4e9bd,
            tilt: 26.7,
            rotationSpeed: 0.035, // Increased rotation
            info: {
                Type: "Gas Giant",
                Diameter: "116,460 km",
                "Distance from Sun": "1.4 billion km",
                "Orbital Period": "29.5 years",
                Moons: "82 confirmed",
                Rings: "Ice particles with rocky debris",
            },
        },
        uranus: {
            radius: 4,
            distance: 140,
            speed: 0.0022,
            color: 0x4fd1c5,
            tilt: 97.8,
            rotationSpeed: 0.03,
            segments: 24, // High-quality segments
            info: {
                Type: "Ice Giant",
                Diameter: "50,724 km",
                "Distance from Sun": "2.9 billion km",
                "Orbital Period": "84 years",
                Moons: "27 known",
                "Unique Feature": "Rotates on its side",
            },
        },
        neptune: {
            radius: 3.8,
            distance: 170,
            speed: 0.0015,
            color: 0x3182ce,
            tilt: 28.3,
            rotationSpeed: 0.032,
            segments: 24, // High-quality segments
            info: {
                Type: "Ice Giant",
                Diameter: "49,244 km",
                "Distance from Sun": "4.5 billion km",
                "Orbital Period": "165 years",
                Moons: "14 known",
                "Unique Feature": "Great Dark Spot storm system",
            },
        },
    };

    // Create enhanced sun with corona effect
    const sunGroup = new THREE.Object3D();
    scene.add(sunGroup);

    // Core sun sphere
    const sunGeometry = new THREE.SphereGeometry(planetData.sun.radius, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd00,
        emissive: 0xffaa00,
        emissiveIntensity: 1,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sunGroup.add(sun);

    // Add sun glow layers
    const sunGlow1 = createSolarGlow(planetData.sun.radius * 1.2, 0xffdd00);
    const sunGlow2 = createSolarGlow(planetData.sun.radius * 1.5, 0xffaa00);
    const sunGlow3 = createSolarGlow(planetData.sun.radius * 2, 0xff7700);
    sunGroup.add(sunGlow1);
    sunGroup.add(sunGlow2);
    sunGroup.add(sunGlow3);

    // Point light from the sun
    const sunLight = new THREE.PointLight(0xffffff, 2, 300);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Create planets and orbits
    const planets = {};
    const orbits = {};
    const planetGroups = {};

    for (const [name, data] of Object.entries(planetData)) {
        if (name === "sun") continue;

        // Create planet group (for tilting)
        const planetGroup = new THREE.Object3D();
        scene.add(planetGroup);
        planetGroups[name] = planetGroup;

        // Create planet
        const geometry = new THREE.SphereGeometry(data.radius, 24, 24);
        const material = new THREE.MeshLambertMaterial({ color: data.color });
        const planet = new THREE.Mesh(geometry, material);
        planetGroup.add(planet);
        planets[name] = planet;

        // Apply tilt to planet
        planet.rotation.x = (data.tilt * Math.PI) / 180;

        // Position planet initially
        planet.position.x = data.distance;

        // Create orbit line
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitPoints = [];
        const segments = 128;

        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            orbitPoints.push(
                data.distance * Math.cos(theta),
                0,
                data.distance * Math.sin(theta)
            );
        }

        orbitGeometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(orbitPoints, 3)
        );
        const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x444444 });
        const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
        scene.add(orbit);
        orbits[name] = orbit;

        // Add ring for Saturn
        if (name === "saturn") {
            const ringGeometry = new THREE.RingGeometry(
                data.radius * 1.4,
                data.radius * 2.4,
                32
            );
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xf4e9bd,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.7,
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            planet.add(ring);
        } else if (name === "uranus") {
            // Add Uranus's faint rings
            const ringGeometry = new THREE.RingGeometry(
                data.radius * 1.2,
                data.radius * 1.8,
                64
            );
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0x88bbcc,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.3,
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            planet.add(ring);
        }
    }

    // Add Earth's moon
    const moonGroup = new THREE.Object3D();
    scene.add(moonGroup);

    const moonGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const moonMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.x = 5; // Distance from Earth
    moonGroup.add(moon);
    planets["moon"] = moon;

    // Asteroid Belt
    const asteroidGeometry = new THREE.BufferGeometry();
    const asteroidVertices = [];
    const asteroidCount = 2000;

    for (let i = 0; i < asteroidCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 65 + Math.random() * 15;
        const height = (Math.random() - 0.5) * 3;

        asteroidVertices.push(
            Math.cos(angle) * distance,
            height,
            Math.sin(angle) * distance
        );
    }

    asteroidGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(asteroidVertices, 3)
    );
    const asteroidMaterial = new THREE.PointsMaterial({
        color: 0x888888,
        size: 0.3,
    });
    const asteroidBelt = new THREE.Points(asteroidGeometry, asteroidMaterial);
    scene.add(asteroidBelt);

    // Meteoroids
    const meteorGeometry = new THREE.BufferGeometry();
    const meteorVertices = [];
    const meteorCount = 500;

    for (let i = 0; i < meteorCount; i++) {
        meteorVertices.push(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100
        );
    }

    meteorGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(meteorVertices, 3)
    );
    const meteorMaterial = new THREE.PointsMaterial({
        color: 0xcccccc,
        size: 0.2,
    });
    const meteoroids = new THREE.Points(meteorGeometry, meteorMaterial);
    scene.add(meteoroids);

    // Speed control
    let speedFactor = 1;

    document
        .getElementById("speed-slower")
        .addEventListener("click", function () {
            speedFactor = Math.max(0.1, speedFactor / 1.5);
        });

    document
        .getElementById("speed-reset")
        .addEventListener("click", function () {
            speedFactor = 1;
        });

    document
        .getElementById("speed-faster")
        .addEventListener("click", function () {
            speedFactor = Math.min(10, speedFactor * 1.5);
        });

    // Toggle orbits
    let orbitVisible = true;
    document
        .getElementById("toggle-orbits")
        .addEventListener("click", function () {
            orbitVisible = !orbitVisible;
            for (const orbit of Object.values(orbits)) {
                orbit.visible = orbitVisible;
            }
        });

    // Info panel
    const infoPanel = document.getElementById("info-panel");
    const infoTitle = document.getElementById("info-title");
    const infoTable = document.getElementById("info-table");

    // Raycaster for object clicking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function handleClick(event) {
        // Get normalized device coordinates
        if (event.touches) {
            mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
        } else {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        }

        raycaster.setFromCamera(mouse, camera);

        // Collect all clickable objects
        const allObjects = [sun];
        for (const planet of Object.values(planets)) {
            allObjects.push(planet);
        }

        const intersects = raycaster.intersectObjects(allObjects);

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            let infoData = planetData.sun.info;
            let title = "The Sun";

            if (clickedObject !== sun) {
                for (const [name, planet] of Object.entries(planets)) {
                    if (planet === clickedObject) {
                        if (name === "moon") {
                            title = "Earth's Moon";
                            infoData = {
                                Type: "Natural Satellite",
                                Diameter: "3,474 km",
                                "Distance from Earth": "384,400 km",
                                "Orbital Period": "27.3 days",
                                Composition: "Rocky surface, iron core",
                            };
                        } else {
                            infoData = planetData[name].info;
                            title =
                                name.charAt(0).toUpperCase() + name.slice(1);
                        }
                        break;
                    }
                }
            }
            showInfo(title, infoData);
        } else {
            infoPanel.style.display = "none";
        }
    }

    // Event listeners for both mouse and touch
    window.addEventListener("click", handleClick);
    window.addEventListener("touchstart", function (e) {
        // Only process single taps, not moves or zooms
        if (e.touches.length === 1) {
            // Store the start position
            const startX = e.touches[0].clientX;
            const startY = e.touches[0].clientY;

            // Define a small movement threshold
            const moveThreshold = 10;

            // Add a one-time touchend listener
            const touchEndHandler = function (endEvent) {
                window.removeEventListener("touchend", touchEndHandler);

                // If the touch ended without much movement, consider it a tap
                if (endEvent.changedTouches.length === 1) {
                    const endX = endEvent.changedTouches[0].clientX;
                    const endY = endEvent.changedTouches[0].clientY;

                    const dx = Math.abs(endX - startX);
                    const dy = Math.abs(endY - startY);

                    if (dx < moveThreshold && dy < moveThreshold) {
                        handleClick(endEvent.changedTouches[0]);
                    }
                }
            };

            window.addEventListener("touchend", touchEndHandler);
        }
    });

    function showInfo(title, data) {
        infoTitle.textContent = title;
        infoTable.innerHTML = Object.entries(data)
            .map(
                ([key, value]) => `
            <tr>
                <td>${key}</td>
                <td>${value}</td>
            </tr>
        `
            )
            .join("");
        infoPanel.style.display = "block";
    }

    // Handle window resize
    window.addEventListener("resize", function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animation for sun glow
    function animateSun(time) {
        // Pulsate the sun glow
        const pulseFactor = Math.sin(time * 0.001) * 0.1 + 1;
        sunGlow1.scale.set(pulseFactor, pulseFactor, pulseFactor);
        sunGlow2.scale.set(
            pulseFactor * 0.95,
            pulseFactor * 0.95,
            pulseFactor * 0.95
        );
        sunGlow3.scale.set(
            pulseFactor * 1.05,
            pulseFactor * 1.05,
            pulseFactor * 1.05
        );
    }

    // Animation loop
    let lastTime = 0;
    function animate(currentTime) {
        requestAnimationFrame(animate);

        // Calculate delta time in seconds
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        // Animate sun features
        animateSun(currentTime);

        // Rotate the sun
        sun.rotation.y += 0.005 * speedFactor;

        // Update planet positions
        for (const [name, data] of Object.entries(planetData)) {
            if (name === "sun") continue;

            const planet = planets[name];
            const planetGroup = planetGroups[name];

            if (planet && planetGroup) {
                // Update planet orbit
                planetGroup.rotation.y +=
                    data.speed * speedFactor * (deltaTime * 10);

                // Update planet rotation
                planet.rotation.y +=
                    data.rotationSpeed * speedFactor * (deltaTime * 10);
            }
        }

        // Update Earth's moon
        if (planets["earth"] && planets["moon"] && planetGroups["earth"]) {
            moonGroup.position.copy(planetGroups["earth"].position);
            moonGroup.rotation.y += 0.03 * speedFactor * (deltaTime * 10); // Increased moon speed
        }

        // Rotate asteroid belt
        asteroidBelt.rotation.y += 0.001 * speedFactor;

        // Rotate meteoroids
        meteoroids.rotation.x += 0.0005 * speedFactor;
        meteoroids.rotation.y += 0.0005 * speedFactor;

        renderer.render(scene, camera);

        const segments = data.segments || 24; // Use specified segments or default to 24
        const geometry = new THREE.SphereGeometry(
            data.radius,
            segments,
            segments
        );
    }

    animate(0);
};

// Improve renderer quality
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Create planet
const segments = data.segments || 24; // Use specified segments or default to 24
const geometry = new THREE.SphereGeometry(data.radius, segments, segments);
const material = new THREE.MeshLambertMaterial({ color: data.color });
const planet = new THREE.Mesh(geometry, material);
planetGroup.add(planet);
planets[name] = planet;
