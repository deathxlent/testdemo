class BrowserCS {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = { x: 0, y: 1.7, z: 0, yaw: 0, pitch: 0, velocityY: 0, onGround: true };
        this.keys = {};
        this.colliders = [];
        this.bullets = [];
        this.enemies = [];
        this.ammo = 30;
        this.totalAmmo = 90;
        this.health = 100;
        this.isPointerLocked = false;
        this.lastShot = 0;
        this.fireRate = 100;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        this.joystick = { active: false, x: 0, y: 0 };
        this.touchLook = { active: false, lastX: 0, lastY: 0 };
        
        this.init();
    }
    
    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(this.player.x, this.player.y, this.player.z);
        
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('gameCanvas'),
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.setupLighting();
        this.createDust2Map();
        this.createWeapon();
        this.spawnEnemies();
        this.setupEventListeners();
        
        this.animate();
    }
    
    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        this.scene.add(sunLight);
    }
    
    createDust2Map() {
        const groundGeo = new THREE.PlaneGeometry(200, 200);
        const groundMat = new THREE.MeshStandardMaterial({ 
            color: 0xc2b280,
            roughness: 0.9
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        this.createBuilding(-30, 0, 0, 15, 8, 20, 0x8B7355);
        this.createBuilding(30, 0, 0, 15, 8, 20, 0x8B7355);
        
        this.createWall(0, 2, -40, 80, 4, 0.5, 0x808080);
        this.createWall(0, 2, 40, 80, 4, 0.5, 0x808080);
        this.createWall(-40, 2, 0, 0.5, 4, 80, 0x808080);
        this.createWall(40, 2, 0, 0.5, 4, 80, 0x808080);
        
        this.createBuilding(0, 0, -25, 20, 6, 10, 0x696969);
        
        this.createCrate(-15, 1.5, 10, 3);
        this.createCrate(-12, 1.5, 13, 3);
        this.createCrate(15, 1.5, 10, 3);
        this.createCrate(12, 1.5, 13, 3);
        
        this.createCrate(-20, 1.5, -15, 3);
        this.createCrate(20, 1.5, -15, 3);
        
        this.createWall(0, 1.5, 0, 8, 3, 0.5, 0x654321);
        
        this.createBarrel(-8, 1, 20);
        this.createBarrel(8, 1, 20);
        this.createBarrel(-8, 1, -20);
        this.createBarrel(8, 1, -20);
        
        this.createTower(-35, 0, -30);
        this.createTower(35, 0, 30);
        
        this.player.x = 0;
        this.player.z = 30;
    }
    
    createBuilding(x, y, z, w, h, d, color) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
        const building = new THREE.Mesh(geo, mat);
        building.position.set(x, y + h/2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);
        this.addCollider(building);
    }
    
    createWall(x, y, z, w, h, d, color) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
        const wall = new THREE.Mesh(geo, mat);
        wall.position.set(x, y, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.scene.add(wall);
        this.addCollider(wall);
    }
    
    createCrate(x, y, z, size) {
        const geo = new THREE.BoxGeometry(size, size, size);
        const mat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });
        const crate = new THREE.Mesh(geo, mat);
        crate.position.set(x, y, z);
        crate.castShadow = true;
        crate.receiveShadow = true;
        this.scene.add(crate);
        this.addCollider(crate);
    }
    
    createBarrel(x, y, z) {
        const geo = new THREE.CylinderGeometry(0.8, 0.8, 2, 16);
        const mat = new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.6, metalness: 0.3 });
        const barrel = new THREE.Mesh(geo, mat);
        barrel.position.set(x, y, z);
        barrel.castShadow = true;
        barrel.receiveShadow = true;
        this.scene.add(barrel);
        this.addCollider(barrel);
    }
    
    createTower(x, y, z) {
        const baseGeo = new THREE.BoxGeometry(8, 12, 8);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(x, y + 6, z);
        base.castShadow = true;
        base.receiveShadow = true;
        this.scene.add(base);
        this.addCollider(base);
        
        const topGeo = new THREE.BoxGeometry(10, 2, 10);
        const top = new THREE.Mesh(topGeo, baseMat);
        top.position.set(x, y + 13, z);
        top.castShadow = true;
        this.scene.add(top);
    }
    
    createWeapon() {
        this.weaponGroup = new THREE.Group();
        
        const bodyGeo = new THREE.BoxGeometry(0.1, 0.15, 0.6);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        this.weaponGroup.add(body);
        
        const barrelGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.2 });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.5;
        this.weaponGroup.add(barrel);
        
        const magGeo = new THREE.BoxGeometry(0.08, 0.25, 0.05);
        const magMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7, roughness: 0.4 });
        const mag = new THREE.Mesh(magGeo, magMat);
        mag.position.y = -0.15;
        mag.position.z = 0.1;
        this.weaponGroup.add(mag);
        
        const gripGeo = new THREE.BoxGeometry(0.06, 0.2, 0.08);
        const gripMat = new THREE.MeshStandardMaterial({ color: 0x1a0a00, roughness: 0.8 });
        const grip = new THREE.Mesh(gripGeo, gripMat);
        grip.position.y = -0.15;
        grip.position.z = 0.2;
        this.weaponGroup.add(grip);
        
        this.weaponGroup.position.set(0.3, -0.25, -0.5);
        this.camera.add(this.weaponGroup);
        this.scene.add(this.camera);
    }
    
    spawnEnemies() {
        const enemyPositions = [
            { x: -25, z: -20 },
            { x: 25, z: -20 },
            { x: 0, z: -30 },
            { x: -15, z: 5 },
            { x: 15, z: 5 }
        ];
        
        enemyPositions.forEach((pos, index) => {
            this.createEnemy(pos.x, pos.z, index);
        });
    }
    
    createEnemy(x, z, id) {
        const enemyGroup = new THREE.Group();
        enemyGroup.userData = { type: 'enemy', health: 100, id, lastHit: 0 };
        
        const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 16);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.7 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.2;
        body.castShadow = true;
        enemyGroup.add(body);
        
        const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.8 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 2.2;
        head.castShadow = true;
        enemyGroup.add(head);
        
        const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.12, 2.25, 0.3);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.12, 2.25, 0.3);
        enemyGroup.add(leftEye);
        enemyGroup.add(rightEye);
        
        enemyGroup.position.set(x, 0, z);
        this.scene.add(enemyGroup);
        this.enemies.push(enemyGroup);
    }
    
    addCollider(mesh) {
        const box = new THREE.Box3().setFromObject(mesh);
        this.colliders.push({ mesh, box });
    }
    
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'KeyR') this.reload();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                this.player.yaw -= e.movementX * 0.002;
                this.player.pitch -= e.movementY * 0.002;
                this.player.pitch = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, this.player.pitch));
            }
        });
        
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0 && this.isPointerLocked) {
                this.shoot();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
        });
        
        this.renderer.domElement.addEventListener('click', () => {
            if (!this.isPointerLocked && document.getElementById('startScreen').style.display === 'none') {
                this.renderer.domElement.requestPointerLock();
            }
        });
        
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        this.setupMobileControls();
    }
    
    setupMobileControls() {
        const joystick = document.getElementById('joystick');
        const joystickKnob = document.getElementById('joystickKnob');
        const fireBtn = document.getElementById('fireBtn');
        const lookArea = document.getElementById('lookArea');
        
        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.joystick.active = true;
        });
        
        joystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.joystick.active) return;
            
            const touch = e.touches[0];
            const rect = joystick.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            let dx = touch.clientX - centerX;
            let dy = touch.clientY - centerY;
            
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = 35;
            
            if (distance > maxDistance) {
                dx = (dx / distance) * maxDistance;
                dy = (dy / distance) * maxDistance;
            }
            
            joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
            this.joystick.x = dx / maxDistance;
            this.joystick.y = dy / maxDistance;
        });
        
        joystick.addEventListener('touchend', () => {
            this.joystick.active = false;
            this.joystick.x = 0;
            this.joystick.y = 0;
            joystickKnob.style.transform = 'translate(-50%, -50%)';
        });
        
        lookArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchLook.active = true;
            this.touchLook.lastX = e.touches[0].clientX;
            this.touchLook.lastY = e.touches[0].clientY;
        });
        
        lookArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.touchLook.active) return;
            
            const touch = e.touches[0];
            const dx = touch.clientX - this.touchLook.lastX;
            const dy = touch.clientY - this.touchLook.lastY;
            
            this.player.yaw -= dx * 0.005;
            this.player.pitch -= dy * 0.005;
            this.player.pitch = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, this.player.pitch));
            
            this.touchLook.lastX = touch.clientX;
            this.touchLook.lastY = touch.clientY;
        });
        
        lookArea.addEventListener('touchend', () => {
            this.touchLook.active = false;
        });
        
        fireBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.shoot();
        });
    }
    
    startGame() {
        document.getElementById('startScreen').style.display = 'none';
        this.renderer.domElement.requestPointerLock();
    }
    
    shoot() {
        const now = Date.now();
        if (now - this.lastShot < this.fireRate || this.ammo <= 0) return;
        
        this.lastShot = now;
        this.ammo--;
        this.updateHUD();
        
        this.weaponGroup.position.z -= 0.1;
        setTimeout(() => this.weaponGroup.position.z = -0.5, 50);
        
        const bulletGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const bullet = new THREE.Mesh(bulletGeo, bulletMat);
        
        bullet.position.copy(this.camera.position);
        bullet.position.y -= 0.2;
        
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        
        bullet.userData = {
            velocity: direction.multiplyScalar(2),
            life: 100
        };
        
        this.scene.add(bullet);
        this.bullets.push(bullet);
        
        this.createMuzzleFlash();
        this.raycastShoot();
    }
    
    createMuzzleFlash() {
        const flashGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        
        flash.position.copy(this.weaponGroup.position);
        flash.position.z -= 0.7;
        this.camera.add(flash);
        
        setTimeout(() => {
            this.camera.remove(flash);
        }, 30);
    }
    
    raycastShoot() {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        
        const intersects = raycaster.intersectObjects(this.enemies, true);
        
        if (intersects.length > 0) {
            let enemy = intersects[0].object;
            while (enemy.parent && !enemy.userData.type) {
                enemy = enemy.parent;
            }
            
            if (enemy.userData.type === 'enemy') {
                enemy.userData.health -= 25;
                this.showHitMarker();
                
                if (enemy.userData.health <= 0) {
                    this.scene.remove(enemy);
                    this.enemies = this.enemies.filter(e => e !== enemy);
                }
            }
        }
    }
    
    showHitMarker() {
        const marker = document.getElementById('hitMarker');
        marker.classList.add('active');
        setTimeout(() => marker.classList.remove('active'), 100);
    }
    
    reload() {
        if (this.totalAmmo > 0 && this.ammo < 30) {
            const needed = 30 - this.ammo;
            const reloadAmount = Math.min(needed, this.totalAmmo);
            this.ammo += reloadAmount;
            this.totalAmmo -= reloadAmount;
            this.updateHUD();
        }
    }
    
    updateHUD() {
        document.getElementById('ammo').textContent = `${this.ammo} / ${this.totalAmmo}`;
        document.getElementById('health').textContent = `❤️ ${this.health} HP`;
    }
    
    checkCollision(newX, newZ) {
        const playerRadius = 0.5;
        
        for (const collider of this.colliders) {
            const box = collider.box;
            
            if (newX + playerRadius > box.min.x && newX - playerRadius < box.max.x &&
                newZ + playerRadius > box.min.z && newZ - playerRadius < box.max.z) {
                return true;
            }
        }
        return false;
    }
    
    update(delta) {
        const moveSpeed = 0.15;
        let moveX = 0;
        let moveZ = 0;
        
        if (this.keys['KeyW']) moveZ -= 1;
        if (this.keys['KeyS']) moveZ += 1;
        if (this.keys['KeyA']) moveX -= 1;
        if (this.keys['KeyD']) moveX += 1;
        
        if (this.joystick.active) {
            moveX = this.joystick.x;
            moveZ = this.joystick.y;
        }
        
        if (moveX !== 0 || moveZ !== 0) {
            const angle = this.player.yaw;
            const dx = (moveX * Math.cos(angle) - moveZ * Math.sin(angle)) * moveSpeed;
            const dz = (moveX * Math.sin(angle) + moveZ * Math.cos(angle)) * moveSpeed;
            
            if (!this.checkCollision(this.player.x + dx, this.player.z)) {
                this.player.x += dx;
            }
            if (!this.checkCollision(this.player.x, this.player.z + dz)) {
                this.player.z += dz;
            }
        }
        
        if (this.keys['Space'] && this.player.onGround) {
            this.player.velocityY = 0.3;
            this.player.onGround = false;
        }
        
        this.player.velocityY -= 0.012;
        this.player.y += this.player.velocityY;
        
        if (this.player.y <= 1.7) {
            this.player.y = 1.7;
            this.player.velocityY = 0;
            this.player.onGround = true;
        }
        
        this.camera.position.set(this.player.x, this.player.y, this.player.z);
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.player.yaw;
        this.camera.rotation.x = this.player.pitch;
        
        this.updateBullets();
        this.updateEnemies();
    }
    
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.position.add(bullet.userData.velocity);
            bullet.userData.life--;
            
            if (bullet.userData.life <= 0) {
                this.scene.remove(bullet);
                this.bullets.splice(i, 1);
            }
        }
    }
    
    updateEnemies() {
        this.enemies.forEach(enemy => {
            const dx = this.player.x - enemy.position.x;
            const dz = this.player.z - enemy.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance > 5 && distance < 30) {
                const speed = 0.02;
                const newX = enemy.position.x + (dx / distance) * speed;
                const newZ = enemy.position.z + (dz / distance) * speed;
                
                if (!this.checkCollision(newX, enemy.position.z)) {
                    enemy.position.x = newX;
                }
                if (!this.checkCollision(enemy.position.x, newZ)) {
                    enemy.position.z = newZ;
                }
            }
            
            enemy.rotation.y = Math.atan2(dx, dz);
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.update(16);
        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('load', () => {
    new BrowserCS();
});