// LaurieWired 2024 Halloween Programming Challenge Entry:
// The Divergence Meter CAPTCHA

// More info in the README

// Global variables
const imageMap = new Map();
let canvas;
let stars = [];
let numStars = 50;
let bridgeLocX = 0;
let bridgeEndLocY = 0;
let bridgeOffset = 0;
let dividerLocY = 0;
let mainCircleSize = 35;
let worldLineOpacity = 255;
let bridgeFinished = false;
let isSplitActive = false;
let isParallelWorldLineActive = false;
let isAnswerSubmitted = false;
let isAnswerCorrect = false;
let targetNumberDecimalStr;
let imageOriginalWidth;
let imageCurrentWidth;
let imageCurrentHeight;
let imageStartLocX;
let imageStartLocY;
let inputField;
let sendDmailButton;
let submitButton;
let helpText;
let helpTextWidth;

// Called before setup(), loads assets
function preload() {
    // Credit to trigger-segfault on github. They have a
    // great tool that I used to get an image of each number
    // used for the divergence meter.
    img0 = loadImage("https://i.imgur.com/sWOJOnx.png");
    img1 = loadImage("https://i.imgur.com/PzL7LgE.png");
    img2 = loadImage("https://i.imgur.com/ewnYeAE.png");
    img3 = loadImage("https://i.imgur.com/rt0k73i.png");
    img4 = loadImage("https://i.imgur.com/zYSDzUQ.png");
    img5 = loadImage("https://i.imgur.com/uwBe3KN.png");
    img6 = loadImage("https://i.imgur.com/PFYE0rB.png");
    img7 = loadImage("https://i.imgur.com/l9x0Psi.png");
    img8 = loadImage("https://i.imgur.com/UyIfk5v.png");
    img9 = loadImage("https://i.imgur.com/lG5bHOe.png");
    imgDot = loadImage("https://i.imgur.com/bfiAzEz.png");
}

// Automatically called once before draw() is called
function setup() {
    // Create a canvas with a size based on the user's window
    canvas = createCanvas(windowHeight, windowHeight - 150);

    imageMap.set("0", img0);
    imageMap.set("1", img1);
    imageMap.set("2", img2);
    imageMap.set("3", img3);
    imageMap.set("4", img4);
    imageMap.set("5", img5);
    imageMap.set("6", img6);
    imageMap.set("7", img7);
    imageMap.set("8", img8);
    imageMap.set("9", img9);
    imageMap.set(".", imgDot);

    imageOriginalWidth = img0.width;
    imageCurrentWidth = img0.width;
    imageCurrentHeight = img0.height;

    dividerLocY = height / 3;

    // Calculate the starting x and y positions of the first image for the meter
    updateImageStartLocations();
    resizeImages();

    background(0);
    stroke(255);
    strokeWeight(1);
    line(0, dividerLocY, width, dividerLocY);

    // Create the stars at random coordinates
    for (let i = 0; i < numStars; i++) {
        let x = random(width);
        let y = random(dividerLocY);
        stars.push({ x: x, y: y });
    }

    bridgeLocX = width / 2 - 60;
    bridgeEndLocY = height / 6;

    targetNumberDecimalStr = getRandomNumberForDecimal();

    drawSendDmailButton();

    // Create the input field and submit button,
    // but hide them until the D-Mail button is clicked
    drawInputField();
    drawSubmitButton();
    inputField.hide();
    submitButton.hide();

    helpText =
        "Enter the full divergence number and click submit. For example: 0.123456";
}

// Main draw function. This is automatically called up to 60 times per second if able
function draw() {
    background(0);
    drawStars();
    drawPrimaryWorldLine();

    stroke(255);
    strokeWeight(1);
    line(0, dividerLocY, width, dividerLocY);

    // Check if Send D-Mail button has been clicked yet
    if (!isSplitActive && !isParallelWorldLineActive) {
        drawDivergenceMeter("000000");
    }

    // Check for when the animation for the new world line splitting is going on
    if (isSplitActive) {
        drawBridge();
        drawRandomDivergenceMeter();
    }

    // Check for after the animation is done and we have the parallel world line
    if (isParallelWorldLineActive) {
        drawParallelWorldLine();
        drawDivergenceMeter(targetNumberDecimalStr);

        if (!isAnswerSubmitted) {
            drawHelpText();
        } else {
            if (isAnswerCorrect) {
                drawCorrectText();
            } else {
                drawIncorrectText();
            }
        }
    }
}

// Creates and adds the "Send D-Mail" button
function drawSendDmailButton() {
    sendDmailButton = createButton("Send D-Mail");
    sendDmailButton.position(
        canvas.position().x + width / 2,
        canvas.position().y + height + 10
    );

    sendDmailButton.style("font-size", "18px");
    sendDmailButton.style("padding", "10px");

    sendDmailButton.mousePressed(sendDmailButtonClicked);
}

// Creates the input field where the user will enter their answer
function drawInputField() {
    inputField = createInput("");
    inputField.size(250);

    // Input field styling
    inputField.style("font-size", "18px");
    inputField.style("padding", "10px");
    inputField.style("border", "2px solid black");
    inputField.style("text-align", "center");

    inputField.position(
        canvas.position().x + width / 2,
        canvas.position().y + height + 10
    );

    // Add input validation
    inputField.input(validateInput);
    inputField.attribute("placeholder", "Enter divergence number...");
}

// Creates and adds the "Submit" button
function drawSubmitButton() {
    submitButton = createButton("Submit");
    submitButton.position(
        inputField.position().x + inputField.width + 20,
        canvas.position().y + height + 10
    );

    submitButton.style("font-size", "18px");
    submitButton.style("padding", "10px");

    // Add the callback function for when the button is clicked
    submitButton.mousePressed(submitButtonClicked);

    // Disable the submit button initially
    submitButton.attribute("disabled", "");
}

// Called whenever there is a change to the input field's value
function validateInput() {
    let value = inputField.value();

    // Replace any non-numeric characters or multiple periods with an empty string
    let validValue = value.replace(/[^0-9.]/g, ""); // Only allow numbers and periods
    validValue = validValue.replace(/(\..*)\./g, "$1"); // Ensure only one period is allowed

    // Set the valid value back to the input box
    inputField.value(validValue);

    // Need at least 8 characters (digits plus the period) to be considered valid
    if (inputField.value().length >= 8) {
        submitButton.removeAttribute("disabled"); // Enable the button
    } else {
        submitButton.attribute("disabled", ""); // Disable the button
    }
}

// Generate a random 6 digit number to be used as the decimal for the divergence number
function getRandomNumberForDecimal() {
    let randomNumStr = "";
    for (let i = 0; i < 6; i++) {
        randomNumStr += Math.floor(random(0, 10));
    }
    return randomNumStr;
}

// Helper function, draws the divergence meter with a random number
function drawRandomDivergenceMeter() {
    drawDivergenceMeter(getRandomNumberForDecimal());
}

// Draws and updates the stars location to scroll to the left
function drawStars() {
    for (let i = 0; i < stars.length; i++) {
        fill(255); // White color for the stars
        noStroke();
        ellipse(stars[i].x, stars[i].y, 5, 5); // Draw the star as a white circle

        // Move the star to the left
        stars[i].x -= 2;

        // If the star moves off the left side of the canvas, reposition it to the right
        if (stars[i].x < 0) {
            stars[i].x = width;
            stars[i].y = random(dividerLocY); // Random y-coordinate for a new star
        }
    }
}

// Draw the first world line
function drawPrimaryWorldLine() {
    strokeWeight(4);

    // Random opacity for flicker effect
    worldLineOpacity = random(220, 255);
    stroke(27, 157, 204, worldLineOpacity);
    line(0, height / 6, width / 2, height / 6);
    noStroke();

    drawOrb(width / 2, height / 6, mainCircleSize, mainCircleSize);
}

// Draw and animate the "bridge" connecting the first and seconds world lines
function drawBridge() {
    strokeWeight(4);
    stroke(27, 157, 204, worldLineOpacity);
    line(
        bridgeLocX,
        height / 6,
        bridgeLocX + bridgeOffset,
        bridgeEndLocY + bridgeOffset
    );
    bridgeLocX--;

    // Extend the bridge to parallel world line until it's long enough
    if (!bridgeFinished) {
        if (bridgeEndLocY + bridgeOffset - height / 6 < 75) {
            bridgeOffset++;
            drawOrb(
                bridgeLocX + bridgeOffset,
                bridgeEndLocY + bridgeOffset,
                mainCircleSize,
                mainCircleSize
            );
        } else {
            // Finished drawing bridge
            isBridgeFinished = true;
            isParallelWorldLineActive = true;
            inputField.show();
            submitButton.show();
        }
    }
}

// Draws the white flickering orbs that head the world lines
function drawOrb(x, y, w, h) {
    for (let i = 0; i < 10; i++) {
        let glowSize = mainCircleSize + i * 5; // Make each ellipse larger

        // Use map to gradually decrease opacity for the glowing effect.
        // Use a lower and upper bound in order to use in a random function for a flickering effect
        let glowOpacityLowerBound = map(i, 0, 10, 35, 0);
        let glowOpacityUpperBound = map(i, 0, 10, 65, 0);
        let glowOpacity = random(glowOpacityLowerBound, glowOpacityUpperBound);

        fill(255, 255, 255, glowOpacity); // White color with semi-random transparency for flickering effect
        noStroke();
        ellipse(x, y, glowSize, glowSize); // Draw the glowing circles
    }

    // Draw the main white circle on top
    fill(255); // Solid white color
    ellipse(x, y, w, h); // Main circle
}

// Draws the second world line that is parallel to the first
function drawParallelWorldLine() {
    strokeWeight(4);
    stroke(27, 157, 204, worldLineOpacity);
    line(
        bridgeLocX + bridgeOffset,
        bridgeEndLocY + bridgeOffset,
        width / 2 - 60,
        bridgeEndLocY + bridgeOffset
    );

    drawOrb(
        width / 2 - 60,
        bridgeEndLocY + bridgeOffset,
        mainCircleSize,
        mainCircleSize
    );
}

// Draws the divergence meter to the screen with the given number
// as the decimal after "0."
function drawDivergenceMeter(numberStr) {
    if (numberStr.length != 6) {
        return;
    }

    // Draw the "0." first
    image(imageMap.get("0"), imageStartLocX, imageStartLocY);
    image(
        imageMap.get("."),
        imageStartLocX + imageCurrentWidth,
        imageStartLocY
    );

    // Draw the rest of the numbers passed into this function
    for (let i = 0; i < numberStr.length; i++) {
        let currentDigit = numberStr.substring(i, i + 1);
        image(
            imageMap.get(currentDigit),
            imageStartLocX + (i + 2) * imageCurrentWidth,
            imageStartLocY
        );
    }
}

// Resize the divergence meter images
function resizeImages() {
    let newImageWidth = min((width - 20) / 8, imageOriginalWidth);
    if (imageOriginalWidth * 8 > width) {
        for (let digitImage of imageMap.values()) {
            digitImage.resize(newImageWidth, 0);
            imageCurrentWidth = newImageWidth;
        }
    }

    updateImageStartLocations();
}

// Calculate the starting x and y positions of the first image for the meter
function updateImageStartLocations() {
    imageStartLocX = width / 2 - imageCurrentWidth * 4;
    imageStartLocY =
        height - (height - dividerLocY) / 2 - imageCurrentHeight / 2;
}

// Draw the white help text to the screen to instruct the user
function drawHelpText() {
    textSize(22);
    fill(255);
    let helpTextWidth = textWidth(helpText);

    drawTextAtBottom(helpText, helpTextWidth);
}

// Draw the green "Correct!" text when the user's answer is correct
function drawCorrectText() {
    textSize(22);
    fill(0, 255, 0);
    let correctText = "Correct!";
    let correctTextWidth = textWidth(correctText);

    drawTextAtBottom(correctText, correctTextWidth);
}

// Draw the green "Incorrect. Please try again." text when the user's answer is incorrect
function drawIncorrectText() {
    textSize(22);
    fill(255, 0, 0);
    let incorrectText = "Incorrect. Please try again.";
    let incorrectTextWidth = textWidth(incorrectText);

    drawTextAtBottom(incorrectText, incorrectTextWidth);
}

// Helper function to draw text at the bottom of the canvas
function drawTextAtBottom(textToDraw, textWidth) {
    text(
        textToDraw,
        width / 2 - textWidth / 2,
        height - (height - (imageStartLocY + imageCurrentHeight)) / 2
    );
}

// Callback function for when the "Send D-Mail" button is clicked
function sendDmailButtonClicked() {
    isSplitActive = true;
    sendDmailButton.remove();
}

// Callback function for when the "Submit" button is clicked
function submitButtonClicked() {
    isAnswerSubmitted = true;
    isAnswerCorrect = inputField.value() === "0." + targetNumberDecimalStr;
}

// Called automatically when the window is resized. If this is called a lot
// then the images get really stretched out, but better to handle it
// this way it than not at all.
function windowResized() {
    resizeCanvas(windowHeight, windowHeight - 150);
    resizeImages();
}
