/**
 * Eli's Warning Visualizer
 * Role: Environmental Logic Controller (Layer-Fixed Edition)
 */

let song, fft, bgImg, hourglassImg, maskImg;
let sandGfx, maskGfx; 
let houseImages = [];
let startButton;
let isStarted = false;

// --- Particle System ---
let particles = [];
const MAX_PARTICLES = 1000;

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
        gfx.noStroke();
        gfx.fill(210, 160, 100); 
        gfx.circle(this.pos.x, this.pos.y, this.size);
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
    startButton = select('#start-button');
    startButton.mousePressed(startExperience);
    imageMode(CENTER);
    sandGfx.imageMode(CENTER);
    maskGfx.imageMode(CENTER);
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
    
    // Morph & Camera logic
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

    // 2. Prepare Sand Buffer
    sandGfx.clear();
    let currentPileHeight = progress * 25; 
    sandGfx.push();
    sandGfx.translate(width/2 + camXShift, height/2);
    sandGfx.rotate(camTilt);
    sandGfx.scale(globalZoom);
    sandGfx.translate(0, -10 * (globalZoom - 1));

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
    sandGfx.beginShape();
    sandGfx.vertex(-45, 62); 
    sandGfx.bezierVertex(-25, 62 - currentPileHeight * 1.3, 25, 62 - currentPileHeight * 1.3, 45, 62);
    sandGfx.endShape(CLOSE);
    sandGfx.pop();

    // 3. Prepare Mask Buffer
    maskGfx.clear();
    maskGfx.push();
    maskGfx.translate(width/2 + camXShift, height/2);
    maskGfx.rotate(camTilt);
    maskGfx.scale(globalZoom);
    maskGfx.translate(0, -10 * (globalZoom - 1));
    maskGfx.image(maskImg, 0, 0);
    maskGfx.pop();

    let sandImg = sandGfx.get();
    sandImg.mask(maskGfx.get());

    // 4. Main Rendering Sequence
    push();
    translate(width / 2 + camXShift, height / 2);
    rotate(camTilt);
    scale(globalZoom);
    translate(0, -10 * (globalZoom - 1));

    // A. Shadows
    let shadowX = map(camXShift, 0, 60, 25, -15); 
    let shadowY = map(globalZoom, 1.0, peakZoom, 15, 25); 
    let shadowShear = map(camXShift, 0, 60, 0.05, 0.2); 
    push(); translate(shadowX, shadowY); shearX(shadowShear);      
    tint(0, 80); scale(1.02, 0.98); image(hourglassImg, 0, 0); pop();

    // B. House
    push();
    let houseFinalY = lerp((houseIndex === 3 ? 30 : 10), (nextHouseIndex === 3 ? 30 : 10), transitionProgress / 255);
    translate(0, houseFinalY); scale(pulse * 0.043); 
    tint(255, 255 - transitionProgress); image(houseImages[houseIndex], 0, 0);
    if (transitionProgress > 0) { tint(255, transitionProgress); image(houseImages[nextHouseIndex], 0, 0); }
    pop();

    // C. SAND (Layered here to be behind frame)
    push();
    resetMatrix(); // Go back to screen space to draw the pre-rendered buffer
    image(sandImg, width/2, height/2);
    pop();

    // D. Hourglass Glass/Frame (TOP LAYER)
    tint(255, 255); 
    image(hourglassImg, 0, 0);
    pop();
}

function windowResized() {
    // Fixed size
}
