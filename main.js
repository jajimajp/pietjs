
const hue = ['red','yellow','green','cyan','blue','magenta'];
const lightness = ['light','normal','dark'];

const isSameColor = (c1, c2) => {
  if (c1.length !== c2.length) {
    return false;
  } else if (c1.length === 1) {
    return c1[0] === c2[0];
  } else {
    return c1[0] === c2[0] && c1[1] === c2[1];
  }
}

class Interpreter {
  constructor(program) {
    this.program = program;
    this.stack = [];
    this.DP = "right";
    this.CC = "left";
    this.height = program.length;
    this.width = program[0].length;
    this.x = 0;
    this.y = 0;
    this.prevCodelSize = 0;
    this.prevColor = null;
    this.output = "";
  }

  reachable(x, y) {
    let visited = [y * this.width + x];
    const isFirst = (x, y) => {
      const hash = y * this.width + x;
      if (visited.includes(hash)) {
        return false;
      } else {
        visited.push(hash);
        return true;
      }
    };

    let result = [];
    let queue = [[x, y]];
    while (queue.length > 0) {
      const [x, y] = queue.pop();
      result.push([x, y]);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || this.width <= nx || ny < 0 || this.height <= ny) {
          return;
        }
        if (!isFirst(nx, ny)) {
          return;
        }
        if (!isSameColor(this.program[y][x], this.program[ny][nx])) {
          return;
        }
        queue.push([nx, ny]);
      });
    }
    return result;
  }

  chosenCodel(x, y, DP, CC) { 
    if (DP === "right" || DP === "left") {
      const reachable = this.reachable(x, y);
      const bestx = reachable.reduce((prev, cur) => DP === "right"
                                                    ? Math.max(prev, cur[0])
                                                    : Math.min(prev, cur[0]),
                                      DP === "right" ? -1 : this.width);
      const most = DP === "right" && CC === "left" || DP === "left" && CC === "right"
                  ? Math.min
                  : Math.max;
      const besty = reachable.filter(([x, _]) => x === bestx)
                      .reduce((prev, cur) => most(prev, cur[1]),
                              reachable.filter(([x, _]) => x === bestx)[0][1]);
      return [bestx, besty];
    } else {
      const reachable = this.reachable(x, y);
      const besty = reachable.reduce((prev, cur) => DP === "down"
                                                    ? Math.max(prev, cur[1])
                                                    : Math.min(prev, cur[1]),
                                      DP === "down" ? -1 : this.height);
      const most = DP === "up" && CC === "left" || DP === "down" && CC === "right"
                  ? Math.min
                  : Math.max;
      const bestx = reachable.filter(([_, y]) => y === besty)
                      .reduce((prev, cur) => most(prev, cur[0]), reachable.filter(([_, y]) => y === besty)[0][0]);
      return [bestx, besty];
    }
  }

  nextDPCC(DP, CC) {
    if (CC === "left") {
      return [DP, "right"];
    } else {
      return [{
        "right": "down",
        "down": "left",
        "left": "up",
        "up": "right",
      }[DP], "left"];
    }
  }

  step(restarts = 0) {
    if (restarts > 8) {
      throw new Error("loop 8 times.");
    }
    const codel = this.chosenCodel(this.x, this.y, this.DP, this.CC);
    const [x, y] = codel;
    const [dx, dy] = {
      "right": [1, 0],
      "down": [0, 1],
      "left": [-1, 0],
      "up": [0, -1],
    }[this.DP];
    const [nx, ny] = [x + dx, y + dy];
    if (nx < 0 || this.width <= nx || ny < 0 || this.height <= ny) {
      [this.DP, this.CC] = this.nextDPCC(this.DP, this.CC);
      return this.step(restarts + 1);
    }
    // console.log(this.program, ny, nx);
    if (this.program[ny][nx][0] === "white" || this.program[ny][nx][0] === "black") {
      [this.DP, this.CC] = this.nextDPCC(this.DP, this.CC);
      return this.step(restarts + 1);
    }
    this.prevCodelSize = this.reachable(this.x, this.y).length;
    this.prevColor = this.program[this.y][this.x];
    this.x = nx;
    this.y = ny;
  }

  eval() {
    if (this.program[this.y][this.x][0] === "red" && this.program[this.y][this.x][1] === "normal" && this.prevColor[1] === "light") {
      // PUSH
      this.stack.push(this.prevCodelSize);
      return;
    } else if (this.program[this.y][this.x][0] === "magenta" && this.program[this.y][this.x][1] === "dark" && this.prevColor[1] === 'normal') {
      // OUT(NUMBER)
      const top = this.stack.pop();
      this.output = this.output + top;
    }
  }

  run() {
    try {
      for (let i = 0; i < 10; i++) {
        this.step();
        this.eval();
      }
    } catch(e) {}

    return [this.output, this.stack];
  }
}

const tests = [
  () => {
    const program = [
      [['red', 'light'], ['red', 'normal'], ['white'], ['black'], ['white']],
      [['white'], ['red', 'normal'], ['black'], ['magenta', 'dark'], ['black']],
      [['white'], ['red', 'normal'], ['red', 'normal'], ['magenta', 'dark'], ['white']],
      [['white'], ['white'], ['black' ], ['magenta', 'dark'], ['black']],
      [['white'], ['white'], ['white'], ['black'], ['white']],
    ];
    const interp = new Interpreter(program);
    const [output, _] = interp.run();
    if (output[0] === '1') {
      console.log("OK");
    } else {
      console.error("NG", output);
    }
  },
  () => {
    const program = [
      [['red', 'light'], ['red', 'normal'], ['white'], ['black'], ['white']],
      [['white'], ['red', 'normal'], ['black'], ['magenta', 'dark'], ['black']],
      [['white'], ['red', 'normal'], ['red', 'normal'], ['magenta', 'dark'], ['white']],
      [['white'], ['white'], ['black' ], ['magenta', 'dark'], ['black']],
      [['white'], ['white'], ['white'], ['black'], ['white']],
    ];
    const interp = new Interpreter(program);
    if (interp.reachable(1, 0).length === 4) {
      console.log("OK");
    } else {
      console.error("NG", output);
    }
  },
]
tests.forEach(f => f());
