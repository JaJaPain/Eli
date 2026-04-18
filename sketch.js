/**
 * Eli's Warning Visualizer
 * Role: Master Environmental Controller (Platinum Edition)
 * Includes: Chaotic Fire, Clean Transitions, and Full Physics Restoration
 */

let song, fft, bgImg, hourglassImg, maskImg;
let sandGfx, maskGfx, topSandGfx, shadowGfx; 
let houseImages = [];
let startButton;
let isStarted = false;

// --- Bottom Sand ---
let particles = [];
let lingeringGrains = []; 
const MAX_PARTICLES = 1000;
const MAX_LINGERING = 3000; 

// --- Top Sand ---
let topParticles = [];
const TOTAL_TOP_PARTICLES = 5000; 

// Helper for truly organic, unpredictable fire flares
function getOrganicFireAlpha(zoneId) {
    let s1 = sin(millis() * 0.0011 + (zoneId * 50));
    let s2 = sin(millis() * 0.0007 - (zoneId * 120));
    let combined = (s1 + s2) / 2;
    return map(combined, 0.35, 0.8, 0, 1, true);
}

// --- PHYSICS CLASSES ---

class Sand {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = createVector(random(-0.15, 0.15), random(1.2, 2.2)); 
        this.acc = createVector(0, 0.09); 
        this.size = random(1.5, 2.5);
        this.shade = random(0.85, 1.15);
        this.dead = false;
    }
    update(currentPileHeight) {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        let floorLimit = 62 - currentPileHeight;
        if (this.pos.y > floorLimit) {
            this.dead = true;
            return true; 
        }
        return false;
    }
    display(gfx) {
        gfx.noStroke(); 
        gfx.fill(160 * this.shade, 128 * this.shade, 90 * this.shade); 
        gfx.circle(this.pos.x, this.pos.y, this.size);
    }
}

class LingeringGrain {
    constructor(x, y, shade) {
        this.pos = createVector(x, y);
        this.shade = shade;
        this.alpha = 255;
        this.size = random(1.2, 2.2);
    }
    update() {
        this.alpha -= 0.8;
    }
    display(gfx) {
        gfx.noStroke();
        gfx.fill(160 * this.shade, 128 * this.shade, 90 * this.shade, this.alpha);
        gfx.circle(this.pos.x, this.pos.y, this.size);
    }
}

class TopGrain {
    constructor() {
        this.relX = random(-65, 65);
        this.relY = random(-185, -105); 
        this.size = random(1.2, 2.2);
        this.shade = random(0.85, 1.15);
    }
    display(gfx, progress) {
        let travelDist = 80; 
        let currentY = this.relY + (progress * travelDist);
        if (currentY < -105) {
            gfx.noStroke();
            gfx.fill(140 * this.shade, 115 * this.shade, 80 * this.shade);
            gfx.circle(this.relX, currentY, this.size);
        }
    }
}

// --- CORE SYSTEM ---

function preload() {
    song = loadSound("Eli's Warning.wav");
    bgImg = loadImage("Assets/background.png");
    hourglassImg = loadImage("Assets/FixedHourGlass.png");
    maskImg = loadImage("Assets/mask.png");
    for(let i=1; i<=4; i++) houseImages.push(loadImage(`Assets/house${i}b.png`));
}

function setup() {
    let canvas = createCanvas(1280, 720);
    canvas.parent(document.body);
    fft = new p5.FFT(0.8, 512);
    sandGfx = createGraphics(1280, 720);
    shadowGfx = createGraphics(1280, 720); 
    maskGfx = createGraphics(1280, 720);
    topSandGfx = createGraphics(1280, 720);

    for(let i=0; i<TOTAL_TOP_PARTICLES; i++) {
        topParticles.push(new TopGrain());
    }
    
    startButton = select('#start-button');
    startButton.mousePressed(startExperience);
    imageMode(CENTER);
    [sandGfx, maskGfx, topSandGfx, shadowGfx].forEach(g => g.imageMode(CENTER));
}

function startExperience() {
    if (!isStarted) {
        userStartAudio();
        song.play();
        isStarted = true;
        startButton.hide();
    }
}

function draw() {
    if (!isStarted) {
        background(0);
        return;
    }

    let spectrum = fft.analyze();
    let bass = fft.getEnergy("bass");
    let pulse = map(bass, 0, 255, 1.0, 1.08); 
    let progress = song.currentTime() / song.duration();
    
    let transitionWindow = 0.04; 
    let houseIndex = floor(progress * 4);
    houseIndex = constrain(houseIndex, 0, 3);
    let nextHouseIndex = min(houseIndex + 1, 3);
    let qProg = progress % 0.25;
    let transitionProgress = map(qProg, 0.25 - transitionWindow, 0.25, 0, 255, true);

    let globalZoom = 1.0;
    let peakZoom = 2.6;
    let quarterProgress = (progress * 4) % 1.0; 
    if (quarterProgress > 0.2 && quarterProgress < 0.4) globalZoom = map(quarterProgress, 0.2, 0.4, 1.0, peakZoom);
    else if (quarterProgress >= 0.4 && quarterProgress <= 0.7) globalZoom = peakZoom;
    else if (quarterProgress > 0.7 && quarterProgress < 0.9) globalZoom = map(quarterProgress, 0.7, 0.9, peakZoom, 1.0);

    let camXShift = map(globalZoom, 1.0, peakZoom, 0, 60);
    let camTilt = map(globalZoom, 1.0, peakZoom, 0, 0.04); 

    // 1. Background
    push();
    translate(width / 2 - (camXShift * 0.25), height / 2);
    image(bgImg, 0, 0, width * 1.25, height * 1.25); 
    pop();

    // 2. Buffers
    sandGfx.clear();
    shadowGfx.clear();
    topSandGfx.clear();
    maskGfx.clear();
    
    [sandGfx, topSandGfx, maskGfx, shadowGfx].forEach(g => {
        g.push();
        g.translate(width/2 + camXShift, height/2);
        g.rotate(camTilt);
        g.scale(globalZoom);
        g.translate(0, -10 * (globalZoom - 1));
    });

    // BOTTOM SAND
    let currentPileHeight = progress * 55; 
    if (particles.length < MAX_PARTICLES) {
        let spawnRate = floor(map(bass, 0, 255, 4, 15));
        for(let i=0; i<spawnRate; i++) particles.push(new Sand(random(-0.8, 0.8), -105)); 
    }
    for (let i = particles.length - 1; i >= 0; i--) {
        let collided = particles[i].update(currentPileHeight);
        particles[i].display(sandGfx);
        particles[i].display(shadowGfx); 
        if (particles[i].dead) {
            if (collided && random() < 0.6 && lingeringGrains.length < MAX_LINGERING) {
                lingeringGrains.push(new LingeringGrain(particles[i].pos.x + random(-2, 2), particles[i].pos.y - 1, particles[i].shade));
            }
            particles.splice(i, 1);
        }
    }
    for (let i = lingeringGrains.length - 1; i >= 0; i--) {
        lingeringGrains[i].update();
        lingeringGrains[i].display(sandGfx);
        lingeringGrains[i].display(shadowGfx); 
        if (lingeringGrains[i].alpha <= 0) lingeringGrains.splice(i, 1);
    }
    
    sandGfx.noStroke(); sandGfx.fill(130, 105, 75); 
    sandGfx.beginShape(); sandGfx.vertex(-55, 62); 
    sandGfx.bezierVertex(-35, 62 - currentPileHeight * 1.3, 35, 62 - currentPileHeight * 1.3, 55, 62);
    sandGfx.endShape(CLOSE);

    // TOP SAND
    topParticles.forEach(p => p.display(topSandGfx, progress));
    let travelDist = 80;
    let blockTop = -185 + (progress * travelDist);
    let blockBottom = -105 + (progress * travelDist);
    topSandGfx.noStroke(); topSandGfx.fill(140, 115, 80); 
    topSandGfx.rectMode(CORNERS);
    topSandGfx.rect(-65, blockTop, 65, min(blockBottom, -105));
    topSandGfx.fill(0, 30); topSandGfx.rect(-65, blockTop, -50, min(blockBottom, -105)); topSandGfx.rect(50, blockTop, 65, min(blockBottom, -105));

    maskGfx.image(maskImg, 0, 0);
    [sandGfx, topSandGfx, maskGfx, shadowGfx].forEach(g => g.pop());

    let sandImg = sandGfx.get();
    let shadowImg = shadowGfx.get();
    let topImg = topSandGfx.get();
    let commonMask = maskGfx.get();
    sandImg.mask(commonMask);
    shadowImg.mask(commonMask);
    topImg.mask(commonMask);

    // 3. Main Rendering
    push();
    translate(width / 2 + camXShift, height / 2);
    rotate(camTilt); scale(globalZoom); translate(0, -10 * (globalZoom - 1));
    let shadowX = map(camXShift, 0, 60, 25, -15); 
    let shadowY = map(globalZoom, 1.0, peakZoom, 15, 25); 
    let shadowShear = map(camXShift, 0, 60, 0.05, 0.2); 
    push(); translate(shadowX, shadowY); shearX(shadowShear);      
    tint(0, 80); scale(1.02, 0.98); image(hourglassImg, 0, 0); pop();

    // HOUSE RENDERING
    push();
    let hY = lerp((houseIndex === 3 ? 30 : 10), (nextHouseIndex === 3 ? 30 : 10), transitionProgress / 255);
    translate(0, hY); scale(pulse * 0.043); 
    tint(255, 255 - transitionProgress); image(houseImages[houseIndex], 0, 0);
    
    // --- CHAOTIC ORGANIC FIRE FOR HOUSE 3 ---
    if (houseIndex === 2) {
        let fireSafetyFade = map(qProg, 0.18, 0.21, 1, 0, true); 
        if (fireSafetyFade > 0) {
            blendMode(ADD);
            noStroke();
            let fireZones = [
                {id: 1, x: -350, y: -220, w: 1.0, h: 1.0}, // Left Wing
                {id: 2, x: 350, y: -220, w: 1.0, h: 1.0},  // Right Wing
                {id: 3, x: 0, y: 200, w: 2.5, h: 1.0}      // Interior Spill
            ];
            fireZones.forEach(z => {
                let organicAlpha = getOrganicFireAlpha(z.id) * fireSafetyFade;
                if (organicAlpha > 0) {
                    let heat = noise(frameCount * 0.1, z.id * 10) * 35 + (bass * 0.35);
                    for(let i=0; i<18; i++) {
                        let s = map(i, 0, 18, 30, 450); 
                        let a = map(i, 0, 18, 25, 0.5); 
                        fill(255, 115, 35, (a + (heat * 0.1)) * organicAlpha);
                        let jX = noise(i, frameCount * 0.13, z.id) * 35 - 17;
                        let jY = noise(i + 44, frameCount * 0.13, z.id) * 35 - 17;
                        ellipse(z.x + jX, z.y + jY, s * z.w, s * z.h);
                    }
                }
            });
        }
    }

    if (transitionProgress > 0) { tint(255, transitionProgress); image(houseImages[nextHouseIndex], 0, 0); }
    pop();

    // GRAIN SHADOWS
    push(); resetMatrix(); 
    tint(0, 85); image(shadowImg, width/2 + 5, height/2 + 5); image(topImg, width/2 + 4, height/2 + 4);
    pop();

    // SAND RENDERING
    push(); resetMatrix(); 
    image(sandImg, width/2, height/2);
    image(topImg, width/2, height/2);
    pop();

    tint(255, 255); image(hourglassImg, 0, 0);
    pop();
}

function windowResized() { }
