  // Create background stars and comets
        function createBackgroundEffects() {
            const starsBg = document.getElementById('starsBg');
            
            // Create stars
            for (let i = 0; i < 200; i++) {
                const star = document.createElement('div');
                star.className = 'star-bg';
                star.style.left = Math.random() * 100 + '%';
                star.style.top = Math.random() * 100 + '%';
                star.style.animationDelay = Math.random() * 3 + 's';
                star.style.width = (Math.random() * 3 + 1) + 'px';
                star.style.height = star.style.width;
                starsBg.appendChild(star);
            }
            
            // Create comets
            for (let i = 0; i < 3; i++) {
                const comet = document.createElement('div');
                comet.className = 'comet';
                comet.style.left = (Math.random() * 20) + '%';
                comet.style.top = (Math.random() * 20) + '%';
                comet.style.animationDelay = (Math.random() * 15) + 's';
                comet.style.width = (Math.random() * 3 + 2) + 'px';
                comet.style.height = comet.style.width;
                starsBg.appendChild(comet);
            }
        }

        // Game variables
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        let difficulty = 'medium';
        let highScores = [];
        
        let gameState = {
            player: {
                x: canvas.width / 2 - 25,
                y: canvas.height - 80,
                width: 50,
                height: 50,
                speed: 8,
                isShielded: false,
                shieldTime: 0,
                shieldMaxTime: 10000 // 10 seconds
            },
            stars: [],
            meteors: [],
            powerUps: [],
            particles: [],
            explosions: [],
            score: 0,
            lives: 3,
            gameRunning: false,
            starSpawnRate: 0.02,
            meteorSpawnRate: 0.008,
            powerUpSpawnRate: 0.003,
            gameSpeed: 1,
            multiplier: 1,
            multiplierTime: 0,
            multiplierMaxTime: 5000, // 5 seconds
            lastTime: 0,
            combo: 0,
            maxCombo: 0,
            difficultyMultiplier: 1
        };

        let keys = {};
        let isMobile = /Mobi|Android/i.test(navigator.userAgent);
        let touchX = null;

        // Event listeners
        document.addEventListener('keydown', (e) => {
            keys[e.code] = true;
        });

        document.addEventListener('keyup', (e) => {
            keys[e.code] = false;
        });

        if (isMobile) {
            canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                touchX = e.touches[0].clientX;
            });
            
            canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (touchX !== null) {
                    const newX = e.touches[0].clientX;
                    if (newX < touchX - 10) {
                        keys['ArrowLeft'] = true;
                        keys['ArrowRight'] = false;
                    } else if (newX > touchX + 10) {
                        keys['ArrowRight'] = true;
                        keys['ArrowLeft'] = false;
                    }
                    touchX = newX;
                }
            });
            
            canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                keys['ArrowLeft'] = false;
                keys['ArrowRight'] = false;
                touchX = null;
            });
        }

        // Set up difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                difficulty = btn.dataset.difficulty;
            });
        });

        // Game objects classes
        class Star {
            constructor() {
                this.x = Math.random() * (canvas.width - 20) + 10;
                this.y = -20;
                this.size = Math.random() * 10 + 15;
                this.speed = Math.random() * 2 + 2;
                this.rotation = 0;
                this.rotationSpeed = Math.random() * 0.1 + 0.05;
                this.glow = Math.random() * 0.5 + 0.5;
                this.type = Math.random() > 0.9 ? 'rare' : 'normal'; // 10% chance for rare star
                this.color = this.type === 'rare' ? '#ff00ff' : '#ffd700';
            }

            update() {
                this.y += this.speed * gameState.gameSpeed;
                this.rotation += this.rotationSpeed;
                
                if (this.y > canvas.height + 50) {
                    return false;
                }
                return true;
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                
                // Glow effect
                ctx.shadowColor = this.color;
                ctx.shadowBlur = this.size * this.glow;
                
                // Draw star
                ctx.fillStyle = this.color;
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2) / 5;
                    const outerRadius = this.size;
                    const innerRadius = this.size * 0.4;
                    
                    if (i === 0) {
                        ctx.moveTo(outerRadius, 0);
                    } else {
                        const x = Math.cos(angle) * outerRadius;
                        const y = Math.sin(angle) * outerRadius;
                        ctx.lineTo(x, y);
                    }
                    
                    const innerAngle = angle + Math.PI / 5;
                    const innerX = Math.cos(innerAngle) * innerRadius;
                    const innerY = Math.sin(innerAngle) * innerRadius;
                    ctx.lineTo(innerX, innerY);
                }
                ctx.closePath();
                ctx.fill();
                
                // Add sparkle effect for rare stars
                if (this.type === 'rare') {
                    ctx.fillStyle = '#ffffff';
                    for (let i = 0; i < 3; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = Math.random() * this.size * 0.3;
                        ctx.beginPath();
                        ctx.arc(
                            Math.cos(angle) * dist,
                            Math.sin(angle) * dist,
                            Math.random() * 2 + 1,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                    }
                }
                
                ctx.restore();
            }
        }

        class Meteor {
            constructor() {
                this.x = Math.random() * (canvas.width - 30) + 15;
                this.y = -30;
                this.size = Math.random() * 20 + 25;
                this.speed = Math.random() * 3 + 3;
                this.rotation = 0;
                this.rotationSpeed = Math.random() * 0.2 + 0.1;
                this.type = Math.random() > 0.85 ? 'large' : 'normal'; // 15% chance for large meteor
                if (this.type === 'large') {
                    this.size *= 1.5;
                    this.speed *= 0.8;
                }
            }

            update() {
                this.y += this.speed * gameState.gameSpeed;
                this.rotation += this.rotationSpeed;
                
                if (this.y > canvas.height + 50) {
                    return false;
                }
                return true;
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                
                // Glow effect
                ctx.shadowColor = this.type === 'large' ? '#ff0000' : '#ff4444';
                ctx.shadowBlur = this.size * 0.4;
                
                // Draw meteor (rough circle with jagged edges)
                ctx.fillStyle = this.type === 'large' ? '#6b3715' : '#8b4513';
                ctx.beginPath();
                const points = this.type === 'large' ? 12 : 8;
                for (let i = 0; i < points; i++) {
                    const angle = (i * Math.PI * 2) / points;
                    const radius = this.size + Math.sin(i * 1.5) * (this.size * 0.2);
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.fill();
                
                // Add some darker spots
                ctx.fillStyle = this.type === 'large' ? '#4a2b0f' : '#654321';
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.arc(
                        (Math.random() - 0.5) * this.size * 0.6,
                        (Math.random() - 0.5) * this.size * 0.6,
                        this.size * 0.1 + Math.random() * this.size * 0.05,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                }
                
                ctx.restore();
            }
        }

        class PowerUp {
            constructor() {
                this.x = Math.random() * (canvas.width - 30) + 15;
                this.y = -30;
                this.size = 20;
                this.speed = Math.random() * 2 + 2;
                this.type = Math.random() > 0.5 ? 'shield' : 'multiplier'; // 50/50 chance for each type
                this.rotation = 0;
                this.rotationSpeed = Math.random() * 0.1 + 0.05;
            }

            update() {
                this.y += this.speed * gameState.gameSpeed;
                this.rotation += this.rotationSpeed;
                
                if (this.y > canvas.height + 50) {
                    return false;
                }
                return true;
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                
                // Glow effect
                ctx.shadowColor = this.type === 'shield' ? '#4a90e2' : '#ffd700';
                ctx.shadowBlur = 15;
                
                // Draw power-up
                ctx.fillStyle = this.type === 'shield' ? '#4a90e2' : '#ffd700';
                
                if (this.type === 'shield') {
                    // Shield icon
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.fillStyle = '#0c0c2e';
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size * 0.7, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.fillStyle = '#4a90e2';
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Multiplier icon (x2)
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.fillStyle = '#0c0c2e';
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('x2', 0, 0);
                }
                
                ctx.restore();
            }
        }

        class Particle {
            constructor(x, y, color) {
                this.x = x;
                this.y = y;
                this.vx = (Math.random() - 0.5) * 8;
                this.vy = (Math.random() - 0.5) * 8;
                this.life = 1;
                this.decay = Math.random() * 0.02 + 0.01;
                this.size = Math.random() * 4 + 2;
                this.color = color;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life -= this.decay;
                this.size *= 0.98;
                
                return this.life > 0;
            }

            draw() {
                ctx.save();
                ctx.globalAlpha = this.life;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        class Explosion {
            constructor(x, y, size, color) {
                this.x = x;
                this.y = y;
                this.size = size;
                this.particles = [];
                this.color = color;
                
                // Create explosion particles
                for (let i = 0; i < size * 2; i++) {
                    this.particles.push(new Particle(x, y, color));
                }
            }

            update() {
                this.particles = this.particles.filter(particle => particle.update());
                return this.particles.length > 0;
            }

            draw() {
                this.particles.forEach(particle => particle.draw());
            }
        }

        // Game functions
        function updatePlayer() {
            if (keys['ArrowLeft'] || keys['KeyA']) {
                gameState.player.x -= gameState.player.speed;
            }
            if (keys['ArrowRight'] || keys['KeyD']) {
                gameState.player.x += gameState.player.speed;
            }
            
            // Keep player on screen
            gameState.player.x = Math.max(0, Math.min(canvas.width - gameState.player.width, gameState.player.x));
            
            // Update shield timer if active
            if (gameState.player.isShielded) {
                gameState.player.shieldTime += 16; // Assuming 60fps (16ms per frame)
                if (gameState.player.shieldTime >= gameState.player.shieldMaxTime) {
                    gameState.player.isShielded = false;
                    document.getElementById('powerUpIndicator').style.display = 'none';
                }
            }
            
            // Update multiplier timer
            if (gameState.multiplier > 1) {
                gameState.multiplierTime += 16;
                if (gameState.multiplierTime >= gameState.multiplierMaxTime) {
                    gameState.multiplier = 1;
                    document.getElementById('multiplierDisplay').style.display = 'none';
                    gameState.combo = 0;
                }
            }
        }

        function drawPlayer() {
            const player = gameState.player;
            
            ctx.save();
            ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
            
            // Draw shield if active
            if (player.isShielded) {
                const shieldAlpha = 0.3 + 0.2 * Math.sin(Date.now() / 200); // Pulsing effect
                ctx.strokeStyle = `rgba(74, 144, 226, ${shieldAlpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, player.width * 0.8, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.fillStyle = `rgba(74, 144, 226, ${shieldAlpha * 0.3})`;
                ctx.beginPath();
                ctx.arc(0, 0, player.width * 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Glow effect
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 15;
            
            // Draw spaceship body
            ctx.fillStyle = '#a0a0a0';
            ctx.beginPath();
            ctx.moveTo(0, -player.height / 2);
            ctx.lineTo(-player.width / 3, player.height / 2);
            ctx.lineTo(player.width / 3, player.height / 2);
            ctx.closePath();
            ctx.fill();
            
            // Draw cockpit
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(0, -player.height / 4, player.width / 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw engines (animation based on time)
            const engineSize = player.width / 8;
            const engineHeight = player.height / 6;
            const enginePulse = Math.sin(Date.now() / 100) * 2 + 4;
            
            ctx.fillStyle = '#ff6600';
            ctx.fillRect(-player.width / 4, player.height / 3, engineSize, engineHeight + enginePulse);
            ctx.fillRect(player.width / 8, player.height / 3, engineSize, engineHeight + enginePulse);
            
            // Engine glow
            ctx.fillStyle = '#ff9900';
            ctx.globalAlpha = 0.7;
            ctx.fillRect(-player.width / 4, player.height / 3 + engineHeight + enginePulse, engineSize, enginePulse / 2);
            ctx.fillRect(player.width / 8, player.height / 3 + engineHeight + enginePulse, engineSize, enginePulse / 2);
            ctx.globalAlpha = 1;
            
            ctx.restore();
        }

        function spawnObjects() {
            // Spawn stars
            if (Math.random() < gameState.starSpawnRate) {
                gameState.stars.push(new Star());
            }
            
            // Spawn meteors
            if (Math.random() < gameState.meteorSpawnRate) {
                gameState.meteors.push(new Meteor());
            }
            
            // Spawn power-ups
            if (Math.random() < gameState.powerUpSpawnRate) {
                gameState.powerUps.push(new PowerUp());
            }
        }

        function updateObjects() {
            // Update stars
            gameState.stars = gameState.stars.filter(star => star.update());
            
            // Update meteors
            gameState.meteors = gameState.meteors.filter(meteor => meteor.update());
            
            // Update power-ups
            gameState.powerUps = gameState.powerUps.filter(powerUp => powerUp.update());
            
            // Update particles
            gameState.particles = gameState.particles.filter(particle => particle.update());
            
            // Update explosions
            gameState.explosions = gameState.explosions.filter(explosion => explosion.update());
        }

        function checkCollisions() {
            const player = gameState.player;
            
            // Check star collisions
            gameState.stars = gameState.stars.filter(star => {
                if (star.x < player.x + player.width &&
                    star.x + star.size > player.x &&
                    star.y < player.y + player.height &&
                    star.y + star.size > player.y) {
                    
                    // Create particles
                    for (let i = 0; i < 15; i++) {
                        gameState.particles.push(new Particle(star.x, star.y, star.color));
                    }
                    
                    // Calculate score based on star type and multiplier
                    let points = 10;
                    if (star.type === 'rare') points = 50;
                    
                    gameState.score += points * gameState.multiplier;
                    document.getElementById('scoreValue').textContent = gameState.score;
                    
                    // Increase combo
                    gameState.combo++;
                    if (gameState.combo > gameState.maxCombo) {
                        gameState.maxCombo = gameState.combo;
                    }
                    
                    // Activate multiplier if combo reaches 5
                    if (gameState.combo >= 5 && gameState.multiplier === 1) {
                        gameState.multiplier = 2;
                        gameState.multiplierTime = 0;
                        document.getElementById('multiplierDisplay').style.display = 'block';
                        document.getElementById('multiplierDisplay').textContent = `x${gameState.multiplier}`;
                    }
                    
                    return false; // Remove star
                }
                return true;
            });
            
            // Check meteor collisions
            gameState.meteors = gameState.meteors.filter(meteor => {
                if (meteor.x < player.x + player.width &&
                    meteor.x + meteor.size > player.x &&
                    meteor.y < player.y + player.height &&
                    meteor.y + meteor.size > player.y) {
                    
                    if (player.isShielded) {
                        // Shield protects from damage but breaks
                        player.isShielded = false;
                        gameState.explosions.push(new Explosion(
                            meteor.x + meteor.size / 2,
                            meteor.y + meteor.size / 2,
                            meteor.size,
                            '#4a90e2'
                        ));
                        document.getElementById('powerUpIndicator').style.display = 'none';
                    } else {
                        // Create explosion
                        gameState.explosions.push(new Explosion(
                            meteor.x + meteor.size / 2,
                            meteor.y + meteor.size / 2,
                            meteor.size,
                            '#ff4444'
                        ));
                        
                        gameState.lives--;
                        document.getElementById('livesValue').textContent = gameState.lives;
                        
                        // Reset combo on hit
                        gameState.combo = 0;
                        
                        if (gameState.lives <= 0) {
                            gameOver();
                        }
                    }
                    
                    return false; // Remove meteor
                }
                return true;
            });
            
            // Check power-up collisions
            gameState.powerUps = gameState.powerUps.filter(powerUp => {
                if (powerUp.x < player.x + player.width &&
                    powerUp.x + powerUp.size > player.x &&
                    powerUp.y < player.y + player.height &&
                    powerUp.y + powerUp.size > player.y) {
                    
                    // Create particles
                    for (let i = 0; i < 15; i++) {
                        gameState.particles.push(new Particle(
                            powerUp.x, 
                            powerUp.y, 
                            powerUp.type === 'shield' ? '#4a90e2' : '#ffd700'
                        ));
                    }
                    
                    // Apply power-up effect
                    if (powerUp.type === 'shield') {
                        player.isShielded = true;
                        player.shieldTime = 0;
                        document.getElementById('powerUpIndicator').style.display = 'block';
                        document.getElementById('powerUpIndicator').textContent = 'Shield Active!';
                        document.getElementById('powerUpIndicator').style.color = '#4a90e2';
                        document.getElementById('powerUpIndicator').style.borderColor = 'rgba(74, 144, 226, 0.3)';
                    } else {
                        gameState.multiplier = 2;
                        gameState.multiplierTime = 0;
                        document.getElementById('multiplierDisplay').style.display = 'block';
                        document.getElementById('multiplierDisplay').textContent = `x${gameState.multiplier}`;
                    }
                    
                    return false; // Remove power-up
                }
                return true;
            });
        }

        function drawObjects() {
            // Draw explosions first (so they appear behind other objects)
            gameState.explosions.forEach(explosion => explosion.draw());
            
            // Draw stars
            gameState.stars.forEach(star => star.draw());
            
            // Draw meteors
            gameState.meteors.forEach(meteor => meteor.draw());
            
            // Draw power-ups
            gameState.powerUps.forEach(powerUp => powerUp.draw());
            
            // Draw particles
            gameState.particles.forEach(particle => particle.draw());
        }

        function clearCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw gradient background
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, 
                canvas.height / 2, 
                0, 
                canvas.width / 2, 
                canvas.height / 2, 
                Math.max(canvas.width, canvas.height) / 2
            );
            gradient.addColorStop(0, '#000428');
            gradient.addColorStop(1, '#000000');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw nebula effect
            ctx.fillStyle = 'rgba(40, 10, 80, 0.1)';
            for (let i = 0; i < 5; i++) {
                const size = Math.random() * 300 + 100;
                ctx.beginPath();
                ctx.arc(
                    Math.random() * canvas.width,
                    Math.random() * canvas.height,
                    size,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }

        function gameLoop(timestamp) {
            if (!gameState.gameRunning) return;
            
            // Calculate delta time for smooth animation
            if (!gameState.lastTime) gameState.lastTime = timestamp;
            const deltaTime = timestamp - gameState.lastTime;
            gameState.lastTime = timestamp;
            
            clearCanvas();
            updatePlayer();
            spawnObjects();
            updateObjects();
            checkCollisions();
            
            drawPlayer();
            drawObjects();
            
            // Update multiplier display if active
            if (gameState.multiplier > 1) {
                const timeLeft = 1 - (gameState.multiplierTime / gameState.multiplierMaxTime);
                document.getElementById('multiplierDisplay').textContent = `x${gameState.multiplier}`;
                document.getElementById('multiplierDisplay').style.opacity = timeLeft;
            }
            
            requestAnimationFrame(gameLoop);
        }

        function gameOver() {
            gameState.gameRunning = false;
            document.getElementById('finalScore').textContent = gameState.score;
            
            // Check for high score
            const finalScore = gameState.score;
            const isNewHighScore = highScores.length < 5 || finalScore > highScores[highScores.length - 1].score;
            
            if (isNewHighScore) {
                document.getElementById('newHighScore').style.display = 'block';
                
                // Prompt for player name (simple version)
                const playerName = prompt('New High Score! Enter your name:', 'Space Pilot');
                if (playerName) {
                    highScores.push({ name: playerName, score: finalScore });
                    highScores.sort((a, b) => b.score - a.score);
                    if (highScores.length > 5) highScores = highScores.slice(0, 5);
                    updateHighScoresDisplay();
                    saveHighScores();
                }
            }
            
            document.getElementById('gameOver').style.display = 'block';
        }

        function restartGame() {
            // Reset game state based on difficulty
            let playerSpeed, starRate, meteorRate, lives;
            
            switch(difficulty) {
                case 'easy':
                    playerSpeed = 10;
                    starRate = 0.03;
                    meteorRate = 0.005;
                    lives = 5;
                    gameState.difficultyMultiplier = 0.8;
                    break;
                case 'hard':
                    playerSpeed = 6;
                    starRate = 0.015;
                    meteorRate = 0.012;
                    lives = 2;
                    gameState.difficultyMultiplier = 1.5;
                    break;
                case 'medium':
                default:
                    playerSpeed = 8;
                    starRate = 0.02;
                    meteorRate = 0.008;
                    lives = 3;
                    gameState.difficultyMultiplier = 1;
                    break;
            }
            
            gameState = {
                player: {
                    x: canvas.width / 2 - 25,
                    y: canvas.height - 80,
                    width: 50,
                    height: 50,
                    speed: playerSpeed,
                    isShielded: false,
                    shieldTime: 0,
                    shieldMaxTime: 10000
                },
                stars: [],
                meteors: [],
                powerUps: [],
                particles: [],
                explosions: [],
                score: 0,
                lives: lives,
                gameRunning: true,
                starSpawnRate: starRate,
                meteorSpawnRate: meteorRate,
                powerUpSpawnRate: 0.003,
                gameSpeed: 1,
                multiplier: 1,
                multiplierTime: 0,
                multiplierMaxTime: 5000,
                lastTime: 0,
                combo: 0,
                maxCombo: 0,
                difficultyMultiplier: gameState.difficultyMultiplier
            };
            
            // Update UI
            document.getElementById('scoreValue').textContent = '0';
            document.getElementById('livesValue').textContent = lives;
            document.getElementById('gameOver').style.display = 'none';
            document.getElementById('newHighScore').style.display = 'none';
            document.getElementById('multiplierDisplay').style.display = 'none';
            document.getElementById('powerUpIndicator').style.display = 'none';
            
            // Restart game loop
            gameState.lastTime = 0;
            requestAnimationFrame(gameLoop);
        }

        function startGame() {
            document.getElementById('startScreen').style.display = 'none';
            restartGame();
        }

        function loadHighScores() {
            const savedScores = localStorage.getItem('stellarCatchHighScores');
            if (savedScores) {
                highScores = JSON.parse(savedScores);
            } else {
                highScores = [
                    { name: 'Cosmic Pro', score: 1500 },
                    { name: 'Star Hunter', score: 1200 },
                    { name: 'Space Cadet', score: 900 },
                    { name: 'Rookie', score: 600 },
                    { name: 'Newbie', score: 300 }
                ];
            }
            updateHighScoresDisplay();
        }

        function saveHighScores() {
            localStorage.setItem('stellarCatchHighScores', JSON.stringify(highScores));
        }

        function updateHighScoresDisplay() {
            const highScoresList = document.getElementById('highScoresList');
            highScoresList.innerHTML = '';
            
            highScores.sort((a, b) => b.score - a.score).forEach((score, index) => {
                const li = document.createElement('li');
                li.textContent = `${score.name}: ${score.score}`;
                if (index === 0) li.style.color = '#ffd700';
                else if (index === 1) li.style.color = '#c0c0c0';
                else if (index === 2) li.style.color = '#cd7f32';
                highScoresList.appendChild(li);
            });
        }

        // Initialize game
        createBackgroundEffects();
        loadHighScores();