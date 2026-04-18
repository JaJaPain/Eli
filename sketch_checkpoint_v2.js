/**
 * Eli's Warning Visualizer
 * Role: Environmental Logic Controller
 */

let song;
let fft;
let bgImg;
let hourglassImg;
let houseImages = [];
let startButton;
let isStarted = false;

function preload() {
    song = loadSound("Eli's Warning.wav");
    bgImg = loadImage("Assets/background.png");
    hourglassImg = loadImage("Assets/FixedHourGlass.png");
    
    houseImages[0] = loadImage("Assets/house1b.png");
    houseImages[1] = loadImage("Assets/house2b.png");
    houseImages[2] = loadImage("Assets/house3b.png");
    houseImages[3] = loadImage("Assets/house4b.png");
}

function setup() {
    let canvas = createCanvas(1280, 720);
    canvas.parent(document.body);
    fft = new p5.FFT(0.8, 512);
    startButton = select('#start-button');
    startButton.mousePressed(startExperience);
    imageMode(CENTER);
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

    let currentTime = song.currentTime();
    let duration = song.duration();
    let progress = currentTime / duration;
    
    // Morph Logic
    let transitionWindow = 0.04; 
    let houseIndex = floor(progress * 4);
    houseIndex = constrain(houseIndex, 0, 3);
    let nextHouseIndex = min(houseIndex + 1, 3);
    let transitionProgress = 0;
    let quarterMark = (houseIndex + 1) * 0.25;
    if (progress > quarterMark - transitionWindow && houseIndex < 3) {
        transitionProgress = map(progress, quarterMark - transitionWindow, quarterMark, 0, 255);
    }

    // Camera Logic
    let quarterProgress = (progress * 4) % 1.0; 
    let globalZoom = 1.0;
    let peakZoom = 2.6;
    if (quarterProgress > 0.2 && quarterProgress < 0.4) {
        globalZoom = map(quarterProgress, 0.2, 0.4, 1.0, peakZoom);
    } else if (quarterProgress >= 0.4 && quarterProgress <= 0.7) {
        globalZoom = peakZoom;
    } else if (quarterProgress > 0.7 && quarterProgress < 0.9) {
        globalZoom = map(quarterProgress, 0.7, 0.9, peakZoom, 1.0);
    }

    let camXShift = map(globalZoom, 1.0, peakZoom, 0, 60);
    let camTilt = map(globalZoom, 1.0, peakZoom, 0, 0.04); 

    // 1. Background (Parallax)
    push();
    translate(width / 2 - (camXShift * 0.25), height / 2);
    image(bgImg, 0, 0, width * 1.25, height * 1.25); 
    pop();

    // --- Dynamic Camera Zoom Group ---
    push();
    translate(width / 2 + camXShift, height / 2);
    rotate(camTilt);
    scale(globalZoom);
    translate(0, -10 * (globalZoom - 1));

    // Shared Shadow Perspective Math
    let shadowX = map(camXShift, 0, 60, 25, -15); 
    let shadowY = map(globalZoom, 1.0, peakZoom, 15, 25); 
    let shadowShear = map(camXShift, 0, 60, 0.05, 0.2); 

    // 2. Projected Shadows Layer
    push();
    translate(shadowX, shadowY); 
    shearX(shadowShear);      
    
    // A. Hourglass Shadow
    push();
    tint(0, 80);       
    scale(1.02, 0.98); 
    image(hourglassImg, 0, 0);
    pop();

    // B. House Shadow (Lighter tint to match the globe shadow)
    push();
    let currentY = (houseIndex === 3) ? 30 : 10;
    let nextY = (nextHouseIndex === 3) ? 30 : 10;
    let finalY = lerp(currentY, nextY, transitionProgress / 255);
    
    translate(0, finalY); 
    scale(0.043 * 1.05, 0.043 * 0.95); 
    
    // Lightened to ~30% opacity (80/255) to match the hourglass shadow
    tint(0, (255 - transitionProgress) * 0.31); 
    image(houseImages[houseIndex], 0, 0);
    
    if (transitionProgress > 0) {
        tint(0, transitionProgress * 0.31);
        image(houseImages[nextHouseIndex], 0, 0);
    }
    pop();
    pop();

    // 3. The House Layer
    push();
    let houseCurrentY = (houseIndex === 3) ? 30 : 10;
    let houseNextY = (nextHouseIndex === 3) ? 30 : 10;
    let houseFinalY = lerp(houseCurrentY, houseNextY, transitionProgress / 255);
    
    translate(0, houseFinalY); 
    scale(pulse * 0.043); 
    tint(255, 255 - transitionProgress);
    image(houseImages[houseIndex], 0, 0);
    if (transitionProgress > 0) {
        tint(255, transitionProgress);
        image(houseImages[nextHouseIndex], 0, 0);
    }
    pop();

    // 4. The Hourglass Layer
    push();
    translate(0, 0);
    tint(255, 255); 
    image(hourglassImg, 0, 0);
    pop();

    pop(); // End Camera Zoom
}

function windowResized() {
    // Fixed size
}
