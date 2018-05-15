// Set starting values:
var ufos = [];
var bullets = [];
var ufosBullets = [];
var lastBulletFrameNo = 0;
var points = 0;
var totalScore = lastLevelScore;
var ready = false;
var deadBullets = 0;
var ufosAtEarth = 0;
var score;

// Set level parameters and level
var levelParameters = {};
var level = sessionStorage.getItem('level');
if (level === null) {
    level = 1;
}

var lastLevelScore = sessionStorage.getItem('lastLevelScore');
if (lastLevelScore === null) {
    lastLevelScore = 0;
}

// rounding the score value
Math.decimal = function (number, placeAfterDecimal) {
    var factor = Math.pow(10, placeAfterDecimal + 1);
    number = Math.round(Math.round(number * factor) / 10);
    return number / (factor / 10);
};

//
// CREATES
//
function Component(width, height, color, x, y, type) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.type = type;
    this.isAlive = true;
    this.angle = 0;

    this.speedX = 0;
    this.speedY = 0;
    this.lengthOfLifeInFrames = 0;

    if (type === "image" || type === "background" || type === "gun") {
        this.image = new Image();
        this.image.src = color;
    }

    this.update = function () {
        var ctx = gameArea.context;

        if (this.type === "gun") {
            this.angle += 2 * Math.PI / 180;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.drawImage(
                this.image,
                this.width / -2,
                this.height / -2,
                this.width,
                this.height);
            ctx.restore();
        } else if (this.type === "background" || this.type === "image") {
            ctx.drawImage(
                this.image,
                this.x,
                this.y,
                this.width,
                this.height);
        } else if (this.type === "text") {
            ctx.font = this.width + " " + this.height;
            ctx.fillStyle = color;
            ctx.fillText(this.text, this.x, this.y)
        } else if (this.type !== "image" && this.type !== "background" && this.type !== "text") {
            ctx.fillStyle = color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    };

    this.newPos = function () {
        this.x += this.speedX;
        this.y += this.speedY;
    };

    this.dead = function () {
        if (type === "gun") {
            this.isAlive = false;
            this.x = 100 * gameArea.frameNo;
            this.y = 100 * gameArea.frameNo;
            this.speedX = 0;
            this.speedY = 0;
        }

        this.isAlive = false;
        this.x = 500 * gameArea.frameNo;
        this.y = 500 * gameArea.frameNo;
        this.speedX = 0;
        this.speedY = 0;
    };

    this.home = function () {
        this.isHome = true;
        this.x = 1000 * gameArea.frameNo;
        this.y = 1000 * gameArea.frameNo;
        this.speedX = 0;
        this.speedY = 0;
    };

    this.crashWith = function (otherobj) {
        var myleft = this.x;
        var myright = this.x + (this.width);
        var mytop = this.y;
        var mybottom = this.y + (this.height);

        var otherleft = otherobj.x;
        var otherright = otherobj.x + (otherobj.width);
        var othertop = otherobj.y;
        var otherbottom = otherobj.y + (otherobj.height);

        var crash = true;
        if ((mybottom < othertop) ||
            (mytop > otherbottom) ||
            (myright < otherleft) ||
            (myleft > otherright)) {
            crash = false;
        }
        return crash;
    };

    this.crashWithRotatingObject = function (Object) {
        var leftX = this.x;
        var rightX = this.x + (this.width);
        var upY = this.y;
        var downY = this.y + (this.height);

        var objectLeftX = Object.x;
        var objectRightX = Object.x + (Object.width / 2);
        var objectUpY = Object.y;
        var objectDownY = Object.y + (Object.height / 2);

        var crash = true;
        if ((downY < objectUpY) ||
            (upY > objectDownY) ||
            (rightX < objectLeftX) ||
            (leftX > objectRightX)) {
            crash = false;
        }
        return crash;
    };

    this.shoot = function () {
        ufosBullets.push(new Component(9, 9, "blue", this.x + (this.width / 2), this.y + (this.height), "gunn"));
    }
}

function getRandomPosition() {
    do {
        var position = Math.floor(gameArea.canvas.width * Math.random());
    } while (position > 1 && position > (gameArea.canvas.width - 50));
    return position;
}

function generateUfos() {
    var position = getRandomPosition();
    if (gameArea.frameNo === 1 || everyinterval(150)) {
        ufos.push(new Component(50, 50, "ufo.png", position, 0, "image"));
    }
}

function everyinterval(n) {
    if ((gameArea.frameNo / n) % 1 === 0) {
        return true;
    }
    return false;
}


// building game area:
var gameArea = {
    canvas: document.createElement("canvas"),
    start: function () {
        this.canvas.width = 1000;
        this.canvas.height = 450;
        this.frameNo = 0;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[1]);

        this.interval = setInterval(updateGameArea, 10);

        window.addEventListener('keydown', function (e) {
            Redneck.image.src = "RedneckRun.png";
            gameArea.keys = (gameArea.keys || []);
            gameArea.keys[e.keyCode] = true;
        });
        window.addEventListener('keyup', function (e) {
            Redneck.image.src = "Redneck.png";
            gameArea.keys[e.keyCode] = false;
        });
    },
    clear: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    gameOver: function () {
        clearInterval(this.interval);
        displayResultTable();
        window.addEventListener('keydown', function (e) {
            if (gameArea.keys[13]) {
                sessionStorage.clear();
                location.href = "game.html";
            }
        });
        displayYouLoseLevel();
    },
    levelWin: function () {
        clearInterval(this.interval);
        displayResultTable();
        level = parseInt(level) + 1;
        sessionStorage.setItem('level', level);
        sessionStorage.setItem('lastLevelScore', totalScore);
        window.addEventListener('keydown', function (e) {
            if (gameArea.keys[13]) {
                location.href = "game.html";
            }
        });
        displayYouWinLevel();
    }
};

// updating game area:
function updateGameArea() {
    window.addEventListener('keydown', function (e) {
        if (gameArea.keys[13]) {
            ready = true;
        }
    });

    if (ready) {
        gameArea.clear();
        gameArea.frameNo += 1;
        background.newPos();
        background.update();
        accomodation.newPos();
        accomodation.update();
        //count and display Score
        displayScore();
        // Move Redneck after key press:
        moveRedneck();
        // generating ufos
        generateUfos();
        // move ufos:
        moveUfos();
        // move bullets:
        moveBullets();
        // move ufos bullets:
        moveUfosBullets();
        //check if any of bullets crash with ufos:
        bulletsCrashUfos();
        // check if any of ufos crash with Redneck:
        ufosCrashRedneck();
        // check if any of ufos bullets crash with Redneck:
        ufosBulletsCrashRedneck();
        // count number of Ufos witch landed
        UfosCrashAccomodation();

        endGameDueToTooMuchUfosAtEarth();
        endLevel();
    } else {
        displayStartLevelInfo();
        displayStartLevelStory();
    }
}

function startGame(levelParameters) {
    gameArea.start();
    background = new Component(1000, 295, levelParameters.background, 0, 0, "background");
    Redneck = new Component(50, 50, "Redneck.png", 485, 405, "image");
    score = new Component("30px", "Menlo", "black", 20, 40, "text");
    accomodation = new Component(1000, 5, "red", 0, 450, "accomodation");
}


//
// DISPLAY
//

function countScore() {
    deadBullets = 0;
    for (i = 0; i < bullets.length; i++) {
        if (!(bullets[i].isAlive)) {
            deadBullets += 1;
        }
    }
    totalScore = Math.floor((points * (deadBullets / bullets.length) - ufosAtEarth * 10) + parseInt(lastLevelScore));
    if (isNaN(totalScore)) {
        totalScore = lastLevelScore;
    }
}

function displayScore() {
    countScore();
    score.text = "SCORE: " + totalScore;
    score.update();
}

function displayYouWinLevel() {
    youWinLevelBackground = new Component(1000, 100, "white", 0, 0);
    youWinLevelBackground.update();
    youWinLevel = new Component("50px", "Menlo", "black", 400, 75, "text");
    youWinLevel.text = "YOU WIN!";
    youWinLevel.update();
    displayPressEnter();
}

function displayYouLoseLevel() {
    youLooseLevelBackground = new Component(1000, 100, "white", 0, 0);
    youLooseLevelBackground.update();
    youLooseLevel = new Component("50px", "Menlo", "black", 400, 75, "text");
    youLooseLevel.text = "YOU LOOSE!";
    youLooseLevel.update();
    displayPressEnter();
}

function displayPressEnter() {
    displayPressEnterBackground = new Component(1000, 200, "white", 0, 255);
    resultTable4 = new Component("50px", "Menlo", "black", 150, 400, "text");
    resultTable4.text = "Press enter to continue";
    displayPressEnterBackground.update();
    resultTable4.update();
}

function displayResultTable() {
    resultTableScore = new Component("50px", "Menlo", "white", 20, 150, "text");
    resultTableUfoLanded = new Component("50px", "Menlo", "white", 20, 200, "text");
    resultTableRatio = new Component("50px", "Menlo", "white", 20, 250, "text");
    resultTableBackground = new Component(1000, 170, "black", 0, 100);

    var ratio = deadBullets / bullets.length;
    if (isNaN(ratio)) {
        ratio = 0;
    }
    resultTableScore.text = "Score: " + totalScore;
    resultTableUfoLanded.text = "Ufo landed: " + ufosAtEarth;
    resultTableRatio.text = "Ratio: " + Math.decimal((ratio * 100), 0) + "%";
    resultTableBackground.update();
    resultTableScore.update();
    resultTableUfoLanded.update();
    resultTableRatio.update();
}

function displayStartLevelInfo() {
    startLevelInfo = new Component("50px", "Menlo", "black", 380, 100, "text");
    startLevelInfo.text = "LEVEL " + level;
    startLevelInfo.update();
}
function displayStartLevelStory() {
    startLevelStory = new Component("20px", "Menlo", "black", 10, 200, "text");
    startLevelStory.text = levelParameters.story;
    startLevelStory.update();

}

//
// CRASHES
//

function ufosCrashRedneck() {
    for (i = 0; i < ufos.length; i += 1) {
        if (Redneck.crashWith(ufos[i])) {
            gameArea.gameOver();
            return;
        }
    }
}

function UfosCrashAccomodation() {
    for (i = 0; i < ufos.length; i += 1) {
        if (accomodation.crashWith(ufos[i])) {
            ufos[i].home();
            ufosAtEarth += 1;
        }
    }
}

function bulletsCrashUfos() {
    for (var i = 0; i < bullets.length; i++) {
        if (bullets[i].isAlive) {
            for (var j = 0; j < ufos.length; j++) {
                if (bullets[i].crashWith(ufos[j])) {
                    ufos[j].dead();
                    bullets[i].dead();
                    points += levelParameters.scorePerUfo;
                }
            }
        }
    }
}

function ufosBulletsCrashRedneck() {
    for (i = 0; i < ufosBullets.length; i += 1) {
        if (Redneck.crashWithRotatingObject(ufosBullets[i])) {
            gameArea.gameOver();
            return;
        }
    }
}


//
// TERMS OF END GAME
//

function endGameDueToTooMuchUfosAtEarth() {
    if (ufosAtEarth >= levelParameters.UfosAtEarthFinishedGame) {
        gameArea.gameOver();
    }
}

function endLevel(level) {
    var deadMatroses = 0;
    for (var i = 0; i < ufos.length; i++) {
        if (!(ufos[i].isAlive)) {
            deadMatroses += 1;
        }
    }
    if (deadMatroses === levelParameters.deadUfosFinishedLevel) {
        // level win function
        gameArea.levelWin();
    }
}


//
// MOVES
//

function moveUfos() {
    for (i = 0; i < ufos.length; i += 1) {
        if (ufos[i].isAlive) {
            ufos[i].y += levelParameters.UfosSpeedPerFrame;

            ufos[i].update();
            ufos[i].lengthOfLifeInFrames += 1;
        }
        if (ufos[i].lengthOfLifeInFrames % levelParameters.UfosShotPerFrame === 0) {
            ufos[i].shoot();
        }
    }
}

function moveBullets() {
    for (i = 0; i < bullets.length; i += 1) {
        if (bullets[i].isAlive) {
            bullets[i].y += -5;
            bullets[i].update();
        }
    }
}

function moveUfosBullets() {
    for (i = 0; i < ufosBullets.length; i += 1) {
        if (ufosBullets[i].isAlive) {
            ufosBullets[i].y += levelParameters.UfosBulletSpeed;
            ufosBullets[i].update();
        }
    }
}

function moveRedneck() {
    if (gameArea.keys && gameArea.keys[37]) {
        // Do not let go outside left x game area:
        if (Redneck.x <= 0) {
        } else {
            Redneck.speedX = -levelParameters.RedneckSpeed;
        }
    }
    if (gameArea.keys && gameArea.keys[39]) {
        // Do not let go outside right x game area:
        if (Redneck.x + Redneck.width < gameArea.canvas.width) {
            Redneck.speedX = levelParameters.RedneckSpeed;
        }
    }
    if (gameArea.keys && gameArea.keys[38]) {
        // Do not let go up too far :
        if (Redneck.y + Redneck.height > gameArea.canvas.height - Redneck.height) {
            Redneck.speedY = -1;
        }
    }
    if (gameArea.keys && gameArea.keys[40]) {
        // Do not let go outside bottom y game area:
        if (Redneck.y + Redneck.height >= 450) {
        } else {
            Redneck.speedY = 1;
        }
    }
    // Shoot by pressing space:
    if (gameArea.keys && gameArea.keys[32]) {
        if (lastBulletFrameNo + levelParameters.RedneckShootIntervalFrames < gameArea.frameNo) {
            bullets.push(new Component(40, 40, "cow.png", Redneck.x + 10, Redneck.y, "gun"));
            lastBulletFrameNo = gameArea.frameNo;
        }
    }

    Redneck.newPos();
    Redneck.update();

    // Stop Redneck after move:
    Redneck.speedX = 0;
    Redneck.speedY = 0;
}

// START GAME:
function gameMarineFightStart(level) {
    if (level == 1) {
        levelParameters.background = "background.png";
        levelParameters.scorePerUfo = 50;
        levelParameters.UfosBulletSpeed = 5;
        levelParameters.UfosShotPerFrame = 100;
        levelParameters.UfosSpeedPerFrame = 1;
        levelParameters.RedneckShootIntervalFrames = 30;
        levelParameters.UfosAtEarthFinishedGame = 3;
        levelParameters.deadUfosFinishedLevel = 10;
        levelParameters.RedneckSpeed = 5;
        levelParameters.story = " \"UFO?! Quick, grab the worst camera we own!\"";
        startGame(levelParameters);
    }
    if (level == 2) {
        levelParameters.background = "background.png";
        levelParameters.scorePerUfo = 100;
        levelParameters.UfosBulletSpeed = 6;
        levelParameters.UfosShotPerFrame = 90;
        levelParameters.UfosSpeedPerFrame = 1;
        levelParameters.RedneckShootIntervalFrames = 30;
        levelParameters.UfosAtEarthFinishedGame = 3;
        levelParameters.deadUfosFinishedLevel = 10;
        levelParameters.RedneckSpeed = 6;
        levelParameters.story = "\"Trust me, I know what I'm doing\"";
        startGame(levelParameters);
    }
    if (level == 3) {
        levelParameters.background = "background.png";
        levelParameters.scorePerUfo = 200;
        levelParameters.UfosBulletSpeed = 7;
        levelParameters.UfosShotPerFrame = 90;
        levelParameters.UfosSpeedPerFrame = 1.5;
        levelParameters.RedneckShootIntervalFrames = 15;
        levelParameters.UfosAtEarthFinishedGame = 3;
        levelParameters.deadUfosFinishedLevel = 10;
        levelParameters.RedneckSpeed = 7;
        levelParameters.story = "\"I would rather have a mind opened by wonder than one closed by belief.\"";
        startGame(levelParameters);
    }
    if (level == 4) {
        levelParameters.background = "background.png";
        levelParameters.scorePerUfo = 300;
        levelParameters.UfosBulletSpeed = 7;
        levelParameters.UfosShotPerFrame = 70;
        levelParameters.UfosSpeedPerFrame = 2;
        levelParameters.RedneckShootIntervalFrames = 15;
        levelParameters.UfosAtEarthFinishedGame = 5;
        levelParameters.deadUfosFinishedLevel = 10;
        levelParameters.RedneckSpeed = 7;
        levelParameters.story = "\"You see a lot of UFOs with closed eyes and opened mind.\"";
        startGame(levelParameters);
    }
    if (level == 5) {
        levelParameters.background = "background.png";
        levelParameters.scorePerUfo = 400;
        levelParameters.UfosBulletSpeed = 7.5;
        levelParameters.UfosShotPerFrame = 50;
        levelParameters.UfosSpeedPerFrame = 2.2;
        levelParameters.RedneckShootIntervalFrames = 5;
        levelParameters.UfosAtEarthFinishedGame = 10;
        levelParameters.deadUfosFinishedLevel = 10;
        levelParameters.RedneckSpeed = 7;
        levelParameters.story = "\"UFO is a joke when there ain't mystery in the sky.\"";
        startGame(levelParameters);
    }
}

gameMarineFightStart(level);