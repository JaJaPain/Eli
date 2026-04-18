/**
 * Eli's Warning Visualizer
 * Role: Environmental Logic Controller (Wider-Shorter Block Edition)
 */

let song, fft, bgImg, hourglassImg, maskImg;
let sandGfx, maskGfx, topSandGfx; 
let houseImages = [];
let startButton;
let isStarted = false;

// --- Bottom Sand ---
let particles = [];
const MAX_PARTICLES = 1000;

// --- Top Sand (The Wider/Shorter Block) ---
let topParticles = [];
const TOTAL_TOP_PARTICLES = 5000; 

class Sand {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = createVector(random(-0.15, 0.15), random(1.2, 2.2)); 
        this.acc = createVector(0, 0.09); 
        this.size = random(1.2, 2.2);
        this.dead = false;
    }
    update(currentPileHeight) {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        let floorLimit = 62 - currentPileHeight;
        if (this.pos.y > floorLimit) this.dead = true;
    }
    display(gfx) {
        gfx.noStroke(); gfx.fill(210, 160, 100); 
        gfx.circle(this.pos.x, this.pos.y, this.size);
    }
}

class TopGrain {
    constructor() {
        // Wider box (-65 to 65) and Shorter (-185 to -105)
        this.relX = random(-65, 65);
        this.relY = random(-185, -105); 
        this.size = random(1.2, 2.2);
    }
    display(gfx, progress) {
        let travelDist = 80; // Matches the 80px height of our new box
        let currentY = this.relY + (progress * travelDist);
        
        if (currentY < -105) {
            gfx.noStroke();
            gfx.fill(180, 140, 80); 
            gfx.circle(this.relX, currentY, this.size);
        }
    }
}

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
    maskGfx = createGraphics(1280, 720);
    topSandGfx = createGraphics(1280, 720);

    for(let i=0; i<TOTAL_TOP_PARTICLES; i++) {
        topParticles.push(new TopGrain());
    }
    
    startButton = select('#start-button');
    startButton.mousePressed(startExperience);
    imageMode(CENTER);
    [sandGfx, maskGfx, topSandGfx].forEach(g => g.imageMode(CENTER));
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
    let transitionProgress = map(progress % 0.25, 0.25 - transitionWindow, 0.25, 0, 255, true);

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
    topSandGfx.clear();
    maskGfx.clear();
    
    [sandGfx, topSandGfx, maskGfx].forEach(g => {
        g.push();
        g.translate(width/2 + camXShift, height/2);
        g.rotate(camTilt);
        g.scale(globalZoom);
        g.translate(0, -10 * (globalZoom - 1));
    });

    // BOTTOM SAND
    let currentPileHeight = progress * 25; 
    if (particles.length < MAX_PARTICLES) {
        let spawnRate = floor(map(bass, 0, 255, 3, 12));
        for(let i=0; i<spawnRate; i++) particles.push(new Sand(random(-0.8, 0.8), -105)); 
    }
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(currentPileHeight);
        particles[i].display(sandGfx);
        if (particles[i].dead) particles.splice(i, 1);
    }
    sandGfx.noStroke(); sandGfx.fill(180, 140, 80);
    sandGfx.beginShape(); sandGfx.vertex(-45, 62); 
    sandGfx.bezierVertex(-25, 62 - currentPileHeight * 1.3, 25, 62 - currentPileHeight * 1.3, 45, 62);
    sandGfx.endShape(CLOSE);

    // TOP SAND
    topParticles.forEach(p => p.display(topSandGfx, progress));
    
    // Wider Solid Backfill
    let travelDist = 80;
    let blockTop = -185 + (progress * travelDist);
    let blockBottom = -105 + (progress * travelDist);
    topSandGfx.noStroke();
    topSandGfx.fill(180, 140, 80);
    topSandGfx.rectMode(CORNERS);
    topSandGfx.rect(-65, blockTop, 65, min(blockBottom, -105));

    maskGfx.image(maskImg, 0, 0);
    [sandGfx, topSandGfx, maskGfx].forEach(g => g.pop());

    let sandImg = sandGfx.get();
    let topImg = topSandGfx.get();
    let commonMask = maskGfx.get();
    sandImg.mask(commonMask);
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

    push();
    let hY = lerp((houseIndex === 3 ? 30 : 10), (nextHouseIndex === 3 ? 30 : 10), transitionProgress / 255);
    translate(0, hY); scale(pulse * 0.043); 
    tint(255, 255 - transitionProgress); image(houseImages[houseIndex], 0, 0);
    if (transitionProgress > 0) { tint(255, transitionProgress); image(houseImages[nextHouseIndex], 0, 0); }
    pop();

    push(); resetMatrix(); 
    image(sandImg, width/2, height/2);
    image(topImg, width/2, height/2);
    pop();

    tint(255, 255); image(hourglassImg, 0, 0);
    pop();
}

function windowResized() {
    // Fixed size
}
