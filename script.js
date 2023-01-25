window.addEventListener("load", function () {
  const canvas = document.querySelector("#canvas1");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth * 0.75;
  canvas.height = window.innerHeight * 0.75;
  let mouseX = 0;
  let mouseY = 0;
  let topPos = canvas.getBoundingClientRect().top + window.scrollY;
  let leftPos = canvas.getBoundingClientRect().left + window.scrollX;

  function radian(degree) {
    return (degree * Math.PI) / 180;
  }

  class InputHandler {
    constructor(game, context) {
      this.game = game;
      window.addEventListener("keydown", (e) => {
        if (
          (e.key === "a" || e.key === "d" || e.key === "w" || e.key === "s") &&
          this.game.keys.indexOf(e.key) === -1
        ) {
          this.game.keys.push(e.key);
        }
        if (e.key === " ") {
          this.game.player.shoot();
        }
      });
      window.addEventListener("keyup", (e) => {
        if (this.game.keys.indexOf(e.key) > -1) {
          this.game.keys.splice(this.game.keys.indexOf(e.key), 1);
        }
      });
      window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX - leftPos;
        mouseY = e.clientY - topPos;
      });
      window.addEventListener("click", (e) => {
        this.game.player.shoot();
      });
    }
  }

  class Projectile {
    constructor(game, x, y, angle) {
      this.game = game;
      this.width = 20;
      this.height = 10;
      this.x = x - this.width / 2;
      this.y = y - this.height / 2;
      this.speed = 3;
      this.angle = angle;
      this.markedForDeletion = false;
    }
    update() {
      this.x += this.speed * Math.cos(this.angle);
      this.y += this.speed * Math.sin(this.angle);
      if (
        this.x > this.game.width ||
        this.x < 0 ||
        this.y > this.game.height ||
        this.y < 0
      ) {
        this.markedForDeletion = true;
      }
    }
    draw(context) {
      context.save();
      context.fillStyle = "#006600";
      context.translate(this.x + this.width / 2, this.y + this.height / 2);
      context.rotate(this.angle);
      context.fillRect(
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
      context.restore();
    }
  }

  class Player {
    constructor(game) {
      this.game = game;
      this.width = 25;
      this.height = 25;
      this.x = canvas.width / 2;
      this.y = canvas.height / 2;
      this.speedY = 0;
      this.speedX = 0;
      this.speed = 3;
      this.minSpeed = -5;
      this.maxSpeed = 5;
      this.projectiles = [];
      this.angle = 0;
      this.aimTriangle = 35;
      this.aimTriangleSideways = 25;
    }
    update() {
      this.angle = Math.atan2(mouseY - this.y, mouseX - this.x);
      //movement
      const wPressed = this.game.keys.includes("w");
      const sPressed = this.game.keys.includes("s");
      if (wPressed) {
        this.x += this.speed * Math.cos(this.angle);
        this.y += this.speed * Math.sin(this.angle);
      }
      if (sPressed) {
        this.x -= this.speed * Math.cos(this.angle);
        this.y -= this.speed * Math.sin(this.angle);
      }
      const aPressed = this.game.keys.includes("a");
      const dPressed = this.game.keys.includes("d");
      if (aPressed) {
        this.x += this.speed * Math.cos(this.angle + radian(-90));
        this.y += this.speed * Math.sin(this.angle + radian(-90));
      }
      if (dPressed) {
        this.x += this.speed * Math.cos(this.angle + radian(90));
        this.y += this.speed * Math.sin(this.angle + radian(90));
      }
      //handle vertical boundries
      if (this.y > this.game.height - this.height * 0.5) {
        this.y = this.game.height - this.height * 0.5;
      } else if (this.y < -this.height * 0.5) {
        this.y = -this.height * 0.5;
      }
      //handle horizontal boundries
      if (this.x > this.game.width - this.width * 0.5) {
        this.x = this.game.width - this.width * 0.5;
      } else if (this.x < -this.width * 0.5) {
        this.x = -this.width * 0.5;
      }
      //handle projectiles
      this.projectiles.forEach((projectile) => {
        projectile.update();
      });
      this.projectiles = this.projectiles.filter(
        (projectile) => !projectile.markedForDeletion
      );
    }
    draw(context) {
      this.projectiles.forEach((projectile) => {
        projectile.draw(context);
      });
      this.drawPlayerModel(context);
      //this.drawLineBetweenPlayerAndMouse(context);
    }
    drawPlayerModel(context) {
      context.save();
      //triangle tip pointing towards cursor
      context.fillStyle = "black";
      context.beginPath();
      context.moveTo(this.x, this.y);
      context.lineTo(
        this.x + this.aimTriangleSideways * Math.cos(this.angle + radian(90)),
        this.y + this.aimTriangleSideways * Math.sin(this.angle + radian(90))
      );
      context.lineTo(
        this.x + this.aimTriangle * Math.cos(this.angle),
        this.y + this.aimTriangle * Math.sin(this.angle)
      );
      context.lineTo(
        this.x + this.aimTriangleSideways * Math.cos(this.angle + radian(-90)),
        this.y + this.aimTriangleSideways * Math.sin(this.angle + radian(-90))
      );
      context.fill();
      context.closePath();
      //circle
      context.fillStyle = "grey";
      context.beginPath();
      context.arc(this.x, this.y, this.width, 0, 2 * Math.PI, false);
      context.closePath();
      context.fill();
      context.restore();
    }
    shoot() {
      this.projectiles.push(
        new Projectile(this.game, this.x, this.y, this.angle)
      );
    }
    drawLineBetweenPlayerAndMouse(context) {
      context.save();
      context.strokeStyle = "red";
      context.lineWidth = 0.5;
      context.beginPath();
      context.moveTo(this.game.player.x, this.game.player.y);
      context.lineTo(mouseX, mouseY);
      context.stroke();
      context.closePath();
      context.restore();
    }
  }

  class Game {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.player = new Player(this);
      this.input = new InputHandler(this);
      this.keys = [];
    }
    update(deltaTime) {
      this.player.update();
    }
    draw(context) {
      this.player.draw(context);
    }
  }

  const game = new Game(canvas.width, canvas.height);
  let lastTime = 0;
  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.update(deltaTime);
    game.draw(ctx);
    requestAnimationFrame(animate);
  }
  animate(0);
});
