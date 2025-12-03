// ========================= FUNCTIONS FIRST =========================
function updateCellSize() {
  cellW = width / COLS;
  cellH = height / ROWS;
  layers.forEach(layer => {
    if (!layer.offsets || layer.offsets.length !== COLS || layer.offsets[0].length !== ROWS)
      layer.offsets = createEmptyGrid();
  });
}

function createEmptyGrid() {
  let grid = [];
  for (let i = 0; i < COLS; i++) {
    grid[i] = [];
    for (let j = 0; j < ROWS; j++) grid[i][j] = { x: 0, y: 0 };
  }
  return grid;
}

// ========================= CONFIG =========================
let layers = [];
let selectedLayer = 2; // Layer 3 default

let COLS = 6;
let ROWS = 6;
let cellW, cellH;

// Dragging
let dragging = false;
let dragStartX = 0;
let dragStartY = 0;
let draggedCell = null;

// Snap-to-grid
let snapToGrid = false;
let snapButton;

// Visibility checkboxes
let visA, visB, visC;

// Blend mode dropdowns
let blendA, blendB, blendC;
let blendModesList = ["BLEND", "ADD", "DARKEST", "LIGHTEST", "DIFFERENCE", "MULTIPLY", "SCREEN", "OVERLAY"];

// Buttons
let resetButton, downloadButton, randomizeButton;

// Background color picker
let bgColorPicker;
let bgColor = [220, 220, 220];

// Sliders
let colsSlider, rowsSlider;

// File inputs
let fileInputA, fileInputB, fileInputC;

let canvas;

// References for layer buttons (so we can outline them)
let layerBtn1, layerBtn2, layerBtn3;

// ========================= SETUP =========================
function setup() {
  createTitle(); 
  canvas = createCanvas(800, 800);

  let canvasX = (windowWidth - width) / 2;
  let canvasY = 100;
  canvas.position(canvasX, canvasY);

  initLayers();
  updateCellSize();

  setupUI(canvasX, canvasY);
}

// ========================= DRAW =========================
function draw() {
  background(bgColor[0], bgColor[1], bgColor[2]);  

  // UPDATE BUTTON OUTLINES
  layerBtn1.style("border", selectedLayer === 2 ? "2px solid red" : "1px solid #ccc");
  layerBtn2.style("border", selectedLayer === 1 ? "2px solid red" : "1px solid #ccc");
  layerBtn3.style("border", selectedLayer === 0 ? "2px solid red" : "1px solid #ccc");

  for (let l = 0; l < layers.length; l++) {
    let layer = layers[l];
    if (!layer.img || !layer.visible) continue;

    blendMode(layer.blend);
    let img = layer.img;

    for (let i = 0; i < COLS; i++) {
      for (let j = 0; j < ROWS; j++) {
        let sx = i * (img.width / COLS),
            sy = j * (img.height / ROWS);
        let sw = img.width / COLS,
            sh = img.height / ROWS;

        let dx = i * cellW + layer.offsets[i][j].x;
        let dy = j * cellH + layer.offsets[i][j].y;

        if (dragging && draggedCell && l === selectedLayer &&
            draggedCell.i === i && draggedCell.j === j) {
          dx = mouseX - dragStartX;
          dy = mouseY - dragStartY;
        }

        image(img, dx, dy, cellW, cellH, sx, sy, sw, sh);

        // Normal grid stroke ONLY (not red!)
        stroke(0, 50);
        strokeWeight(1);
        noFill();
        rect(i * cellW, j * cellH, cellW, cellH);
      }
    }
  }

  blendMode(BLEND);
}

// ========================= UI =========================
function setupUI(canvasX, canvasY) {
  let uiStartY = canvasY + height + 40;
  let colMargin = 30;
  let columnWidth = 110;
  let col1 = canvasX + width / 2 - 2 * columnWidth - 1.5 * colMargin;
  let col2 = col1 + columnWidth + colMargin;
  let col3 = col2 + columnWidth + colMargin;
  let col4 = col3 + columnWidth + colMargin;
  let rowSpacing = 35;

  // --- Column 1: Layer buttons, snap, color ---
  layerBtn1 = createButton("Layer 1").position(col1, uiStartY)
    .style('border-radius', '5px')
    .mousePressed(() => selectedLayer = 2);

  layerBtn2 = createButton("Layer 2").position(col1, uiStartY + rowSpacing)
    .style('border-radius', '5px')
    .mousePressed(() => selectedLayer = 1);

  layerBtn3 = createButton("Layer 3").position(col1, uiStartY + rowSpacing * 2)
    .style('border-radius', '5px')
    .mousePressed(() => selectedLayer = 0);

  snapButton = createButton("Snap: OFF").position(col1, uiStartY + rowSpacing * 3)
    .style('border-radius', '5px')
    .mousePressed(() => {
      snapToGrid = !snapToGrid;
      snapButton.html(`Snap: ${snapToGrid ? "ON" : "OFF"}`);
    });

  bgColorPicker = createColorPicker(color(...bgColor))
    .position(col1, uiStartY + rowSpacing * 4)
    .input(() => {
      let c = bgColorPicker.color();
      bgColor = [red(c), green(c), blue(c)];
    });

  // --- Column 2 ---
  visC = createCheckbox("Show Layer 1", false).position(col2, uiStartY);
  visC.changed(() => layers[2].visible = visC.checked());

  visB = createCheckbox("Show Layer 2", false).position(col2, uiStartY + rowSpacing);
  visB.changed(() => layers[1].visible = visB.checked());

  visA = createCheckbox("Show Layer 3", false).position(col2, uiStartY + rowSpacing * 2);
  visA.changed(() => layers[0].visible = visA.checked());

  resetButton = createButton("Reset").position(col2, uiStartY + rowSpacing * 3)
    .style('border-radius', '5px')
    .mousePressed(resetAllLayers);

  // --- Column 3 ---
  blendC = createSelect().position(col3, uiStartY);
  blendModesList.forEach(m => blendC.option(m));
  blendC.changed(() => layers[2].blend = eval(blendC.value()));

  blendB = createSelect().position(col3, uiStartY + rowSpacing);
  blendModesList.forEach(m => blendB.option(m));
  blendB.changed(() => layers[1].blend = eval(blendB.value()));

  blendA = createSelect().position(col3, uiStartY + rowSpacing * 2);
  blendModesList.forEach(m => blendA.option(m));
  blendA.changed(() => layers[0].blend = eval(blendA.value()));

  randomizeButton = createButton("Randomize").position(col3, uiStartY + rowSpacing * 3)
    .style('border-radius', '5px')
    .mousePressed(randomizeLayers);

  colsSlider = createSlider(1, 20, COLS, 1).position(col3, uiStartY + rowSpacing * 4)
    .style('width', '110px')
    .input(() => { COLS = colsSlider.value(); updateCellSize(); });

  // --- Column 4 ---
  fileInputC = createFileInput(file => handleUpload(file, 2)).position(col4, uiStartY);
  fileInputB = createFileInput(file => handleUpload(file, 1)).position(col4, uiStartY + rowSpacing);
  fileInputA = createFileInput(file => handleUpload(file, 0)).position(col4, uiStartY + rowSpacing * 2);

  downloadButton = createButton("Download 1080px PNG").position(col4, uiStartY + rowSpacing * 3)
    .style('border-radius', '5px')
    .mousePressed(download1080);

  rowsSlider = createSlider(1, 20, ROWS, 1).position(col4, uiStartY + rowSpacing * 4)
    .style('width', '110px')
    .input(() => { ROWS = rowsSlider.value(); updateCellSize(); });
}

// ========================= TITLE =========================
function createTitle() {
  let titleDiv = createDiv("Pangram3");
  titleDiv.style("font-family", "Courier");
  titleDiv.style("font-size", "36px");
  titleDiv.style("text-align", "center");
  titleDiv.position(0, 30);
  titleDiv.size(windowWidth);
}

// ========================= LAYERS HELPERS =========================
function initLayers() {
  layers = [
    { img: null, offsets: createEmptyGrid(), visible: false, blend: BLEND },
    { img: null, offsets: createEmptyGrid(), visible: false, blend: BLEND },
    { img: null, offsets: createEmptyGrid(), visible: false, blend: BLEND },
  ];
}

function handleUpload(file, layerIndex) {
  if (file.type === 'image') {
    loadImage(file.data, img => {
      img.resize(800, 800);
      layers[layerIndex].img = img;
      layers[layerIndex].visible = true;
      if (layerIndex === 0) visA.checked(true);
      if (layerIndex === 1) visB.checked(true);
      if (layerIndex === 2) visC.checked(true);
    });
  }
}

function resetAllLayers() {
  layers.forEach(layer => {
    if (layer.img) layer.offsets = createEmptyGrid();
    layer.blend = BLEND;
  });

  selectedLayer = 2;
  snapToGrid = false;
  snapButton.html("Snap: OFF");

  bgColor = [220, 220, 220];
  bgColorPicker.color(color(...bgColor));

  COLS = colsSlider.value();
  ROWS = rowsSlider.value();
  updateCellSize();
}

function randomizeLayers() {
  layers.forEach(layer => {
    if (!layer.img) return;
    for (let i = 0; i < COLS; i++)
      for (let j = 0; j < ROWS; j++) {
        layer.offsets[i][j].x = random(-cellW * 0.5, cellW * 0.5);
        layer.offsets[i][j].y = random(-cellH * 0.5, cellH * 0.5);
      }
  });
  layers = shuffle(layers);
}

// ========================= MOUSE =========================
function mousePressed() {
  let i = floor(mouseX / cellW);
  let j = floor(mouseY / cellH);

  if (i >= 0 && i < COLS && j >= 0 && j < ROWS && layers[selectedLayer].img) {
    dragging = true;

    dragStartX = mouseX - layers[selectedLayer].offsets[i][j].x - i * cellW;
    dragStartY = mouseY - layers[selectedLayer].offsets[i][j].y - j * cellH;

    draggedCell = { i, j };
  }
}

function mouseReleased() {
  if (dragging && draggedCell) {
    let layer = layers[selectedLayer];
    let { i, j } = draggedCell;

    let newX = mouseX - i * cellW - dragStartX;
    let newY = mouseY - j * cellH - dragStartY;

    if (snapToGrid) {
      newX = round(newX / cellW) * cellW;
      newY = round(newY / cellH) * cellH;
    }

    layer.offsets[i][j].x = newX;
    layer.offsets[i][j].y = newY;

    draggedCell = null;
  }
  dragging = false;
}

// ========================= DOWNLOAD =========================
function download1080() {
  let pg = createGraphics(1080, 1080);
  pg.background(bgColor[0], bgColor[1], bgColor[2]);

  let scaleF = 1080 / width;
  pg.push();
  pg.scale(scaleF);

  for (let l = 0; l < layers.length; l++) {
    let layer = layers[l];
    if (!layer.img || !layer.visible) continue;

    pg.blendMode(layer.blend);
    let img = layer.img;

    for (let i = 0; i < COLS; i++) {
      for (let j = 0; j < ROWS; j++) {
        let sx = i * (img.width / COLS),
            sy = j * (img.height / ROWS);
        let sw = img.width / COLS,
            sh = img.height / ROWS;

        let dx = i * cellW + layer.offsets[i][j].x;
        let dy = j * cellH + layer.offsets[i][j].y;

        pg.image(img, dx, dy, cellW, cellH, sx, sy, sw, sh);
      }
    }
  }

  pg.pop();
  save(pg, "myComposition.png");
}

// ========================= WINDOW RESIZE =========================
function windowResized() {
  let canvasX = (windowWidth - width) / 2;
  canvas.position(canvasX, canvas.y);
}
