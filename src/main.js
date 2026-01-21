import "./style.css";
import fonSvg from "./assets/fon.svg";
import dountSvg from "./assets/dount.svg"

let donuts = [];
let boxes = [];
let selectedDonuts = [];
let currentBoxIndex = 0;
let isAnimating = false;

let totalDonuts = 8;
let maxBoxes = 4;

let $app, $title, $boxesContainer, $gameArea;
let $questionSection, $answerInput, $doneButton, $successBorder;

$(document).ready(function () {
    $app = $("#app");

    init();
});

function init() {
    $app.html(`
      <div class="title">Click on the donuts to pack a group of 2</div>
      <div class="boxes-container"></div>
      <div class="game-area"></div>
      <img src="${fonSvg}" class="fon"/>
      <div class="question-section">
        <div class="question-text">
          How many donuts in total?
          <input type="text" class="answer-input" maxlength="2" />
        </div>
        <button class="done-button">Done</button>
      </div>
    `);

    $title = $(".title");
    $boxesContainer = $(".boxes-container");
    $gameArea = $(".game-area");
    $questionSection = $(".question-section");
    $answerInput = $(".answer-input");
    $doneButton = $(".done-button");
    $successBorder = $(".success-border");

    createBoxes();
    createDonuts();

    setupEvents();
}

function createBoxes() {
    for (let i = 0; i < maxBoxes; i++) {
        let $box = $(`<div class="box"></div>`);
        if (i === 0) $box.addClass("visible");

        let $label = $(`<div class="box-label">${i * 2 + 1}       ${i * 2 + 2}</div>`);
        $box.append($label);

        $boxesContainer.append($box);

        boxes.push({
            element: $box,
            donuts: [],
            isFull: false
        });
    }
}

function createDonuts() {
    const positions = [
        { x: 320, y: 40 },
        { x: 450, y: 20 },
        { x: 580, y: 50 },
        { x: 720, y: 90 },
        { x: 270, y: 120 },
        { x: 410, y: 140 },
        { x: 540, y: 180 },
        { x: 650, y: 150 }
    ];

    positions.forEach((pos, index) => {
        let $donut = $(`
            <img src="${dountSvg}" class="donut" style="left:${pos.x}px; top:${pos.y}px;"/>
        `);

        $gameArea.append($donut);

        donuts.push({
            id: index,
            element: $donut,
            x: pos.x,
            y: pos.y,
            selected: false
        });
    });
}

function setupEvents() {
    donuts.forEach((d) => {
        d.element.on("click", () => handleDonutClick(d));
    });

    $answerInput.on("input", onInputChange);
    $doneButton.on("click", handleDoneClick);
}

async function handleDonutClick(donut) {
    if (isAnimating || donut.selected || selectedDonuts.length >= 2) return;

    donut.selected = true;
    donut.element.addClass("selected");
    selectedDonuts.push(donut.id);

    let remaining = donuts.filter(d => !d.selected).length;

    if (
        selectedDonuts.length === 2 ||
        (selectedDonuts.length === 1 && remaining === 0)
    ) {
        isAnimating = true;
        await packDonuts();
        selectedDonuts = [];
        isAnimating = false;

        if (currentBoxIndex >= Math.ceil(totalDonuts / 2)) {
            showQuestion();
        }
    }
}

function packDonuts() {
    return new Promise(async (resolve) => {
        let box = boxes[currentBoxIndex];
        let boxRect = box.element[0].getBoundingClientRect();
        let appRect = $app[0].getBoundingClientRect();

        let targetX = boxRect.left - appRect.left + boxRect.width / 2 - 30;
        let targetY = boxRect.top - appRect.top + boxRect.height / 2 - 30;

        let promises = selectedDonuts.map((id, index) => {
            let donut = donuts[id];
            let $el = donut.element;
            let offsetX = index === 0 ? -25 : 25;

            return new Promise((res) => {
                $el.addClass("flying");
                $el.css({
                    left: targetX + offsetX + "px",
                    top: targetY + "px",
                    transform: "scale(0.6)"
                });

                setTimeout(() => {
                    $el.hide();
                    box.donuts.push(id);
                    res();
                }, 500);
            });
        });

        await Promise.all(promises);

        box.isFull = box.donuts.length >= 1;
        box.element.addClass("closed");

        selectedDonuts.forEach(() => {
            let $mini = $(`
                <img src="${dountSvg}" class="donut" style="position:relative; width:35px; height:35px;"/>
            `);
            box.element.append($mini);
        });

        await animateBoxMovement();
        resolve();
    });
}

function animateBoxMovement() {
    return new Promise((resolve) => {
        currentBoxIndex++;

        if (currentBoxIndex < boxes.length) {
            boxes[currentBoxIndex].element.addClass("visible");
        }

        setTimeout(resolve, 1000);
    });
}

function showQuestion() {
    setTimeout(() => {
        $title.addClass("hidden");
        $questionSection.addClass("visible");
    }, 1000);
}

function onInputChange() {
    let val = $answerInput.val().trim();

    if (val !== "") {
        $doneButton.addClass("active").css("cursor", "pointer");
    } else {
        $doneButton.removeClass("active").css("cursor", "not-allowed");
    }

    $answerInput.removeClass("error");
    $doneButton.removeClass("error");
}

async function handleDoneClick() {
    let value = $answerInput.val().trim();
    if (value === "") return;

    let answer = parseInt(value);
    let correct = totalDonuts;

    if (answer === correct) {
        $doneButton.addClass("success");
        $doneButton.removeClass("active").css("cursor", "not-allowed");
    } else {
        $doneButton.addClass("error");
        $answerInput.addClass("error");

        await showBoxLabels();

        setTimeout(() => {
            $answerInput.removeClass("error").val("");
            $doneButton.removeClass("error active").css("cursor", "not-allowed");
            $answerInput.focus();
        }, 1000);
    }
}

function showBoxLabels() {
    return new Promise(async (resolve) => {
        let filled = boxes.filter(b => b.isFull);

        for (let i = 0; i < filled.length; i++) {
            await new Promise((res) => {
                setTimeout(() => {
                    filled[i].element.find(".box-label").addClass("visible");
                    res();
                }, i * 500);
            });
        }

        resolve();
    });
}
