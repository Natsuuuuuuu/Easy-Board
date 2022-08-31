////// Canvas //////

const canvas = document.getElementById("drawCanvas");
const hCanvas = document.getElementById("highlighterCanvas");
const ctx = canvas.getContext("2d");
const hCtx = hCanvas.getContext("2d");

function resizeCanvas() {
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    hCanvas.width = document.body.clientWidth;
    hCanvas.height = document.body.clientHeight;
}

let lastPos = [];
let dragging = false;

function down(pos) {
    lastPos = pos;
    dragging = true;
    if (activeTool == "highlighter") {
        hCtx.beginPath();

    } else if (activeTool == "pen") {
        ctx.beginPath();
    } else if (activeTool == "eraser") {
        hCtx.beginPath();
        ctx.beginPath();
    }
}

function move(pos) {
    if (activeTool == "highlighter") {
        if (dragging) {
            hCtx.moveTo(lastPos[0], lastPos[1]);
            hCtx.lineTo(pos[0], pos[1]);
            hCtx.stroke();
        }
    } else if (activeTool == "pen") {
        if (dragging) {
            ctx.moveTo(lastPos[0], lastPos[1]);
            ctx.lineTo(pos[0], pos[1]);
            ctx.stroke();
        }
    } else if (activeTool == "eraser") {
        if (dragging) {
            ctx.moveTo(lastPos[0], lastPos[1]);
            ctx.lineTo(pos[0], pos[1]);
            ctx.stroke();
            hCtx.moveTo(lastPos[0], lastPos[1]);
            hCtx.lineTo(pos[0], pos[1]);
            hCtx.stroke();
        }
    }
    lastPos = pos;
}

function up(pos) {
    move(pos);
    dragging = false;
}

function pos(e) {
    var x, y;
    x = e.clientX - canvas.getBoundingClientRect().left;
    y = e.clientY - canvas.getBoundingClientRect().top;
    return [x, y];
}

let activeTool = "pen";
let activeToolElement = document.querySelector(".tools .buttons .button-active");
let eraserSize = 30;
function toolsButtonClick() {
    activeToolElement.classList.toggle("button-active");
    document.querySelector(".tools-setting ." + activeTool).style.display = "none";

    activeTool = this.value;
    activeToolElement = this;

    activeToolElement.classList.toggle("button-active");
    document.querySelector(".tools-setting ." + activeTool).style.display = "flex";

    if (activeTool == "pen") {
        ctx.globalCompositeOperation = "source-over";
        activePenElement = document.querySelector(".tools-setting .pen .user-presets .button-active");
        const penPreviewElement = activePenElement.children[0];
        ctx.lineWidth = penPreviewElement.style.width.replace("px", "");
        ctx.strokeStyle = penPreviewElement.style.background;
        ctx.beginPath();
    } else if (activeTool == "highlighter") {
        hCtx.globalCompositeOperation = "source-over";
        activePenElement = document.querySelector(".tools-setting .highlighter .user-presets .button-active");
        const penPreviewElement = activePenElement.children[0];
        ctx.lineWidth = penPreviewElement.style.width.replace("px", "");
        ctx.strokeStyle = penPreviewElement.style.background;
        ctx.beginPath();
    } else if (activeTool == "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        hCtx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = eraserSize;
        hCtx.lineWidth = eraserSize;
    }

}

let activePenElement = document.querySelector(".tools-setting .pen .user-presets .button-active");
function presetPenButtonClick() {
    this.classList.toggle("button-active");
    activePenElement.classList.toggle("button-active");

    activePenElement = this;

    const penPreviewElement = activePenElement.children[0];

    document.getElementById("penSize").value = penPreviewElement.style.width.replace("px", "");
    document.getElementById("penColor").value = ConvertRGBtoHex(penPreviewElement.style.background);

    ctx.lineWidth = penPreviewElement.style.width.replace("px", "");
    ctx.strokeStyle = penPreviewElement.style.background;
    ctx.beginPath();
}

function presetHighlighterButtonClick() {
    this.classList.toggle("button-active");
    activePenElement.classList.toggle("button-active");

    activePenElement = this;

    const penPreviewElement = activePenElement.children[0];

    document.getElementById("highlighterSize").value = penPreviewElement.style.width.replace("px", "");
    document.getElementById("highlighterColor").value = ConvertRGBtoHex(penPreviewElement.style.background);

    hCtx.lineWidth = penPreviewElement.style.width.replace("px", "");
    hCtx.strokeStyle = penPreviewElement.style.background;
    hCtx.beginPath();
}

function clearAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height);
}

////// Video //////

const video = document.getElementById("cameraVideo");

async function getCameras() {
    let devices = await navigator.mediaDevices.enumerateDevices();
    devices = devices.filter(device => device.kind === "videoinput");
    return devices;
}

let videoStream;
let srcObject;

function startStream(constraints) {
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
        videoStream = stream.getVideoTracks()[0];
        srcObject = stream;
        video.srcObject = stream;
        video.play();

        if (subWindow) {
            subWindow.document.getElementById("cameraVideoSub").srcObject = video.srcObject;
        }
    })
    .catch(function(err) {
        alert(err);
    });
}

function pause() {
    if (video.paused) {
        video.play();
        if (subWindow) {
            subWindow.document.getElementById("cameraVideoSub").play();
        }
    } else {
        video.pause();
        if (subWindow) {
            subWindow.document.getElementById("cameraVideoSub").pause();
        }
    }
}

function changeCamera() {
    srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;

    if (cameraDevices.length == cameraNumber + 1) {
        cameraNumber = 0;
    } else {
        cameraNumber += 1;
    }
    
    startStream({ 
        video: {
            deviceId: cameraDevices[cameraNumber].deviceId
        } 
    });
}

let cameraNumber = 0;
let cameraDevices;

let lighting = false;
function toggleLight() {
    if (lighting) {
        videoStream.applyConstraints({
            advanced: [{torch: false}]
        });
        lighting = false;
        document.getElementById("lightSwitch").querySelector("span").innerText = "ライト ON";
    } else {
        videoStream.applyConstraints({
            advanced: [{torch: true}]
        });
        lighting = true;
        document.getElementById("lightSwitch").querySelector("span").innerText = "ライト OFF";
    }
}

function toggleFullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        document.body.requestFullscreen();
    }
}

////// UI ///////

function toggleShowControles() {

    const gridContainer = document.querySelector(".grid-container");
    const controlsHideButton = document.querySelector(".controls-hide-button");
    const controls = document.querySelector(".controls");
    const buttonIcon = document.querySelector(".controls-hide-button button i");
    const toolsSetting = document.querySelector(".empty-area .tools-setting");
    const tools = document.querySelector(".tools");

    buttonIcon.classList.toggle("fa-angle-left");
    buttonIcon.classList.toggle("fa-angle-right");

    if (controls.style.display == "flex") {
        gridContainer.style.gridTemplateColumns = "0 180px 1fr";
        controlsHideButton.style.marginRight = "160px";
        controls.style.display = "none";
        if (tools.style.display == "flex") {  
            toolsSetting.style.left = "-150px"
        } else if (toolsSetting.style.bottom == "10px") {
            toolsSetting.style.left = "-150px"
        }
    } else {
        gridContainer.style.gridTemplateColumns = "160px 20px 1fr";
        controlsHideButton.style.marginRight = "0";
        controls.style.display = "flex";
        toolsSetting.style.left = "10px"
    }
}

function toggleShowTools() {

    const gridContainer = document.querySelector(".grid-container");
    const toolsHideButton = document.querySelector(".tools-hide-button");
    const tools = document.querySelector(".tools");
    const buttonIcon = document.querySelector(".tools-hide-button button i");
    const toolsSetting = document.querySelector(".empty-area .tools-setting");
    const controls = document.querySelector(".controls");

    buttonIcon.classList.toggle("fa-angle-down");
    buttonIcon.classList.toggle("fa-angle-up");

    if (tools.style.display == "flex") {
        gridContainer.style.gridTemplateRows = "1fr 100px 0";
        toolsHideButton.style.marginTop = "80px";
        tools.style.display = "none";
        if (controls.style.display == "flex") {
            toolsSetting.style.bottom = "-70px";
        } else if (toolsSetting.style.left == "10px") {
            toolsSetting.style.bottom = "-70px";
        }
    } else {
        gridContainer.style.gridTemplateRows = "1fr 20px 80px";
        toolsHideButton.style.marginTop = "0";
        tools.style.display = "flex";
        toolsSetting.style.bottom = "10px";
    }
}

let subWindow;
function openNewWindow() {
    subWindow = window.open(undefined, "subWindow", "menubar=no");
    window.setInterval(sendtoSubWindow, 1000);

    subWindow.document.head.innerHTML = `<style>
    body {
        margin: 0;
    }

    video {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 0;
        width: 100vw;
        height: 100vh;
    }

    img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
    }

    #drawCanvasSub {
        z-index: 10;
    }

    #highlighterCanvasSub {
        z-index: 5;
    }
    </style>
    `;

    subWindow.document.body.innerHTML = `<img id="drawCanvasSub"></img>
    <img id="highlighterCanvasSub"></img>
    <video id="cameraVideoSub" muted autoplay></video>
    `;

    subWindow.document.getElementById("cameraVideoSub").srcObject = video.srcObject;
}

function sendtoSubWindow() {
    subWindow.document.getElementById("drawCanvasSub").src = canvas.toDataURL("image/png");
    subWindow.document.getElementById("highlighterCanvasSub").src = hCanvas.toDataURL("image/png");
}

////// init //////
  
function ConvertRGBtoHex(rgb) {
    rgb = rgb.replace("rgb(", "");
    rgb = rgb.replace(")", "");
    const rgbList = rgb.split(", ");
    return "#" + rgbList.map(function(value) {
		return ("0" + Number(value).toString(16)).slice(-2);
	}).join("");
}

function init() {

    ////// Canvas //////

    resizeCanvas()
    window.onresize = resizeCanvas;
    
    canvas.addEventListener('mousedown', function(e) {
        down(pos(e));
    });

    canvas.addEventListener('mousemove', function(e) {
        move(pos(e));
    });

    canvas.addEventListener('mouseup', function(e) {
        up(pos(e));
    });

    canvas.addEventListener('touchstart', function(e) {
        if (e.changedTouches.length == 1) {
            down(pos(e.changedTouches[0]));
        }
    });

    canvas.addEventListener('touchend', function(e) {
        if (e.changedTouches.length == 1) {
            up(pos(e.changedTouches[0]));
        }
    });

    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (e.changedTouches.length == 1) {
            move(pos(e.changedTouches[0]));
        }
    });

    const toolsButtons = document.querySelectorAll(".tools .buttons button");
    toolsButtons.forEach(function(element) {
        element.addEventListener("click", toolsButtonClick);
    });
    
    document.querySelector(".tools-setting .highlighter").style.display = "none";
    document.querySelector(".tools-setting .eraser").style.display = "none";

    const presetPenButtons = document.querySelectorAll(".tools-setting .pen .user-presets button");
    presetPenButtons.forEach(function(element) {
        element.addEventListener("click", presetPenButtonClick);
        element.children[0].style.width = "5px";
        element.children[0].style.height = "5px";
        element.children[0].style.background = "#000000";
    });

    document.getElementById("penColor").addEventListener("change", function(e) {

        activePenElement.children[0].style.background = e.target.value;

        ctx.strokeStyle = activePenElement.children[0].style.background;
        ctx.beginPath();
    });

    document.getElementById("penSize").addEventListener("input", function(e) {

        activePenElement.children[0].style.width = e.target.value + "px";
        activePenElement.children[0].style.height = e.target.value + "px";

        ctx.lineWidth = activePenElement.children[0].style.width.replace("px", "");
        ctx.beginPath();
    });

    const presetHighlighterButtons = document.querySelectorAll(".tools-setting .highlighter .user-presets button");
    presetHighlighterButtons.forEach(function(element) {
        element.addEventListener("click", presetHighlighterButtonClick);
        element.children[0].style.width = "10px";
        element.children[0].style.height = "10px";
        element.children[0].style.background = "#ff0000";
    });

    document.getElementById("highlighterColor").addEventListener("change", function(e) {

        activePenElement.children[0].style.background = e.target.value;

        hCtx.strokeStyle = activePenElement.children[0].style.background;
        hCtx.beginPath();
    });

    document.getElementById("highlighterSize").addEventListener("input", function(e) {

        activePenElement.children[0].style.width = e.target.value + "px";
        activePenElement.children[0].style.height = e.target.value + "px";

        hCtx.lineWidth = activePenElement.children[0].style.width.replace("px", "");
        hCtx.beginPath();
    });

    const presetEraserButtons = document.querySelectorAll(".tools-setting .eraser .user-presets button");
    presetEraserButtons.forEach(function(element) {
        element.addEventListener("click", function() {
            eraserSize = this.value;
            ctx.lineWidth = this.value;
            hCtx.lineWidth = this.value;

            document.querySelector(".tools-setting .eraser .user-presets .button-active").classList.remove("button-active");
            this.classList.add("button-active");
        });
    });

    ctx.strokeStyle = activePenElement.children[0].style.background;
    ctx.lineWidth = activePenElement.children[0].style.width.replace("px", "");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const activeHighlighterElement = document.querySelector(".tools-setting .highlighter .user-presets button");
    hCtx.strokeStyle = activeHighlighterElement.children[0].style.background;
    hCtx.lineWidth = activeHighlighterElement.children[0].style.width.replace("px", "");
    hCtx.lineCap = "square";
    hCtx.lineJoin = "round";

    ////// Video //////

    getCameras().then(function(result) {
        cameraDevices = result;
    
        startStream({ 
            video: {
                deviceId: cameraDevices[cameraNumber].deviceId
            } 
        });
    });

    document.querySelector(".controls").style.display = "flex";
    document.querySelector(".tools").style.display = "flex";

}

window.onload = init;