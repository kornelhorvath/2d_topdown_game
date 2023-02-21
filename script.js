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
        if (e.key === "m") {
          this.game.movementType =
            this.game.movementType === this.game.movementTypes.Absolute
              ? this.game.movementTypes.Relative
              : this.game.movementTypes.Absolute;
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
      this.width = 4;
      this.height = this.width;
      this.x = x;
      this.y = y;
      this.speed = 6;
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
      context.fillStyle = "black";
      context.beginPath();
      context.arc(this.x, this.y, this.width, 0, 2 * Math.PI, false);
      context.closePath();
      context.fill();
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
      this.speed = 5;
      this.minSpeed = -5;
      this.maxSpeed = 5;
      this.projectiles = [];
      this.angle = 0;
      this.aimTriangle = 35;
      this.aimTriangleSideways = 25;
      this.lives = 3;
    }
    update() {
      this.angle = Math.atan2(mouseY - this.y, mouseX - this.x);
      //movement
      if (this.game.movementType === this.game.movementTypes.Relative) {
        this.moveRelative();
      } else if (this.game.movementType === this.game.movementTypes.Absolute) {
        this.moveAbsolute();
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
    drawLineBetween(context, x1, y1, x2, y2) {
      context.save();
      context.strokeStyle = "red";
      context.lineWidth = 0.5;
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();
      context.closePath();
      context.restore();
    }
    moveAbsolute() {
      const speedIncrement = 0.25;
      const wPressed = this.game.keys.includes("w");
      const sPressed = this.game.keys.includes("s");
      if (wPressed) {
        this.speedY += -speedIncrement;
      } else if (!sPressed && this.speedY < 0) {
        this.speedY += speedIncrement;
      }
      if (sPressed) {
        this.speedY += speedIncrement;
      } else if (!wPressed && this.speedY > 0) {
        this.speedY += -speedIncrement;
        if (this.speedY < speedIncrement) this.speedY = 0;
      }
      if (this.speedY > this.maxSpeed) this.speedY = this.maxSpeed;
      if (this.speedY < this.minSpeed) this.speedY = this.minSpeed;
      this.y += this.speedY;
      //speedX
      const aPressed = this.game.keys.includes("a");
      const dPressed = this.game.keys.includes("d");
      if (aPressed) {
        this.speedX += -speedIncrement;
      } else if (!dPressed && this.speedX < 0) {
        this.speedX += speedIncrement;
      }
      if (dPressed) {
        this.speedX += speedIncrement;
      } else if (!aPressed && this.speedX > 0) {
        this.speedX += -speedIncrement;
        if (this.speedX < speedIncrement) this.speedX = 0;
      }
      if (this.speedX > this.maxSpeed) this.speedX = this.maxSpeed;
      if (this.speedX < this.minSpeed) this.speedX = this.minSpeed;
      this.x += this.speedX;
    }
    moveRelative() {
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
    }
  }

  class Enemy {
    constructor(game, spawnX, spawnY, speed, lives) {
      this.game = game;
      this.x = spawnX;
      this.y = spawnY;
      this.speed = speed;
      this.width = 40;
      this.height = 40;
      this.lives = lives;
      this.markedForDeletion = false;
    }
    update(context) {
      const angle = Math.atan2(
        this.game.player.y - this.y,
        this.game.player.x - this.x
      );
      this.x += this.speed * Math.cos(angle);
      this.y += this.speed * Math.sin(angle);
      /*this.game.player.drawLineBetween(
        context,
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.game.player.x,
        this.game.player.y
      );*/
    }
    draw(context) {
      context.save();
      context.fillStyle = "yellow";
      context.fillRect(this.x, this.y, this.width, this.height);
      context.fillStyle = "black";
      context.fillText(this.lives, this.x, this.y);
      context.restore();
    }
  }

  class UI {
    constructor(game) {
      this.game = game;
      this.fontSize = 25;
      this.fontFamily = "Helvetica";
      this.color = "black";
    }
    draw(context) {
      context.save();
      context.fillStyle = this.color;
      context.shadowOffsetX = 1;
      context.shadowOffsetY = 1;
      context.shadowColor = "white";
      context.font = `${this.fontSize}px ${this.fontFamily}`;
      //player health
      context.fillText(`Health: ${this.game.player.lives}`, 20, 40);
      //gameover text
      if (this.game.gameover) {
        context.textAlign = "center";
        context.fillText(
          `Game over!`,
          this.game.width * 0.5,
          this.game.height * 0.5
        );
      }
      context.restore();
    }
  }

  class Game {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.movementTypes = {
        Relative: "relative",
        Absolute: "absolute",
      };
      this.movementType = this.movementTypes.Relative;
      this.keys = [];
      this.player = new Player(this);
      this.input = new InputHandler(this);
      this.ui = new UI(this);
      this.enemies = [
        new Enemy(this, 100, 100, 2, 3),
        new Enemy(this, 500, 500, 2, 3),
        new Enemy(this, 100, 500, 2, 3),
        new Enemy(this, 1000, 500, 2, 3),
      ];
      this.gameover = false;
    }
    update(context, deltaTime) {
      this.player.update();
      this.enemies.forEach((enemy) => {
        enemy.update(context);
        if (this.rectCollision(this.player, enemy)) {
          enemy.markedForDeletion = true;
          this.player.lives--;
          if (this.player.lives <= 0) {
            this.gameover = true;
          }
        }
        this.player.projectiles.forEach((projectile) => {
          if (this.rectCollision(projectile, enemy)) {
            enemy.lives--;
            projectile.markedForDeletion = true;
            if (enemy.lives <= 0) {
              enemy.markedForDeletion = true;
            }
          }
        });
      });
      this.enemies = this.enemies.filter((enemy) => !enemy.markedForDeletion);
    }
    draw(context) {
      this.player.draw(context);
      this.enemies.forEach((enemy) => {
        enemy.draw(context);
      });
      this.ui.draw(context);
    }
    rectCollision(r1, r2) {
      return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.height + r1.y > r2.y
      );
    }
  }

  const game = new Game(canvas.width, canvas.height);
  let lastTime = 0;
  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.update(ctx, deltaTime);
    game.draw(ctx);
    if (game.gameover) {
      return;
    }
    requestAnimationFrame(animate);
  }
  animate(0);
});
