let game = [];

// Core Engine
let vm = {};
let curLn = 0;
let waitOn = null;
let paused = false;

// Core
function loadGame() {
  const upload = document.createElement("input");
  upload.type = "file";
  upload.accept = ".questsl";
  upload.click();

  upload.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target.result;
      game = questsl(content);
    };

    reader.readAsText(file);
  };
}

function startGame() {
  document.activeElement.blur();
  cls();
  curLn = 0;
  vm = {};

  gameLoop();
}

function gameLoop() {
  for (let i = curLn; i < game.length; i++) {
    const curBlock = game[i];

    switch (curBlock.cmd) {
      case "SET":
        handleVM(curBlock.varName, curBlock.initVal);
        curLn++;
        break;
      case "PRINT":
        render(curBlock.value);
        curLn++;
        break;
      case "CLS":
        cls();
        curLn++;
        break;
      case "END":
        endGame();
        curLn = game.length;
        i = curLn;
        break;
      case "WAIT":
        wait(i);
        i = game.length;
        curLn++;
        break;
      case "INPUT":
        input();
        i = game.length;
        curLn++;
        break;
      case "IF":
        curLn = handleCond(curBlock);
        i = curLn - 1;
        break;
      case "GOTO":
        curLn = goto(curBlock.value);
        curLn -= 1;
        i = curLn;

      default:
        break;
    }
  }
}

function handleVM(key, val) {
  vm[key] = val;
}

function renderVars(str) {
  let hasVar = str.includes("[");
  let output = str;

  if (!hasVar) {
    return output;
  }

  while (hasVar) {
    const start = output.indexOf("[");
    const end = output.indexOf("]");

    const varName = output.slice(start + 1, end);
    const varVal = vm[varName];

    output = output.replace(`[${varName}]`, varVal);
    hasVar = output.includes("[");
  }

  return output;
}

function handleCond(block) {
  waitOn = curLn;
  const v = vm[block.vName];
  const r = op(v, block.operator, block.opTo, block.firstOnly);
  const out = r ? block.onTrue : block.onFalse;
  let i = 0;

  if (!block.onFalse && !r) {
    i = curLn + 1;
  } else {
    i = game.findIndex((b) => b.ln === out);
  }

  return i;
}

function goto(ln) {
  const i = game.findIndex((b) => b.ln === ln);

  if (i === -1) {
    throw new Error(`Invalid GOTO command on pointer ${curLn}`);
  }

  return i;
}

function op(v, op, r, f) {
  const c = f ? v[0] : v;
  let out = false;

  switch (op) {
    case "=":
      out = c === r;
      break;
    case "<":
      out = c < r;
      break;
    case ">":
      out = c > r;
      break;
    case "<=":
      out = c <= r;
      break;
    case ">=":
      out = c >= r;
      break;
    case "<>":
      out = c !== r;
      break;
  }

  return out;
}

function input() {
  waitOn = curLn;

  const emulator = document.getElementById("emulator");
  const div = document.createElement("div");
  div.innerHTML = ">";
  div.className = "pinput-box";

  const input = document.createElement("input");
  input.type = "text";
  input.id = "input";
  input.className = "pinput";
  input.autocomplete = "off";

  div.appendChild(input);
  emulator.appendChild(div);

  input.focus();
  input.onkeydown = (e) => {
    if (e.key === "Enter" && input.value !== "") {
      const varName = game[curLn - 1].varName;
      let val = input.value;

      if (!varName.includes("$")) {
        val = Number(val);

        if (isNaN(val)) {
          return;
        }
      }

      handleVM(varName, val);
      input.value = "";
      input.remove();
      cls();

      curLn = waitOn + 1;
      waitOn = null;

      gameLoop();
    }
  };
}

function wait(i) {
  waitOn = i;
  paused = true;

  render("");
  render("PRESSIONE ESPAÇO PARA CONTINUAR...");
}

function render(val) {
  const txtToRender = renderVars(val);
  const emulator = document.getElementById("emulator");

  if (txtToRender === "") {
    // Render break line
    const div = document.createElement("div");
    const br = document.createElement("br");
    div.appendChild(br);
    emulator.appendChild(div);

    return;
  }

  // Render text
  const span = document.createElement("span");
  span.innerHTML = txtToRender;
  emulator.appendChild(span);
}

function cls() {
  const emulator = document.getElementById("emulator");
  emulator.innerHTML = "";
}

function endGame() {
  render("");
  render("FIM");
}

// Parser
function questsl(input) {
  try {
    console.time("tokenize");
    const tokens = tokenize(input);
    console.timeEnd("tokenize");

    console.time("parse");
    const program = parseTokens(tokens, input);
    console.timeEnd("parse");

    return program;
  } catch (err) {
    console.error(err.message);
  }
}

function tokenize(input) {
  return input
    .split("\n")
    .map((line) =>
      line
        .trim()
        .split(" ")
        .filter((tkn) => tkn !== "")
    )
    .filter((line) => line.length > 0);
}

function parseTokens(tokens, pureStr) {
  const acc = [];

  for (let i = 0; i < tokens.length; i++) {
    const line = tokens[i];
    const [ln, cmd, ...rest] = line;

    // validate
    validateTokens(ln, cmd, rest, i, pureStr);

    switch (cmd) {
      case "SET":
        const varName = rest[0];
        const initVal = rest.slice(2).join(" ");
        const isNumber = !varName.includes("$");

        acc.push({
          ln: Number(ln),
          cmd,
          varName,
          initVal: isNumber ? Number(initVal) : initVal.replace(/"/g, ""),
          value: rest.join(" "),
        });
        break;
      case "PRINT":
        acc.push({
          ln: Number(ln),
          cmd,
          value: rest.join(" ").replace(/"/g, ""),
        });
        break;
      case "INPUT":
        const str = rest.slice(0, rest.length - 1).join(" ");
        const inputVName = rest[rest.length - 1];

        acc.push({
          ln: Number(ln),
          cmd,
          varName: inputVName,
        });
        break;
      case "WAIT":
        acc.push({ ln: Number(ln), cmd });
        break;
      case "REM":
        acc.push({ ln: Number(ln), cmd, value: rest.join(" ") });
        break;
      case "IF":
        const firstOnly = rest.includes("FIRST");
        const ifVName = rest[0].replace("[", "").replace("]", "");
        const operator = firstOnly ? rest[2] : rest[1];
        const opTo = (firstOnly ? rest[3] : rest[2]).replace(/"/g, "");
        const onTrue = firstOnly ? Number(rest[5]) : Number(rest[4]);
        const hasElse = rest.includes("ELSE");
        const isString = ifVName.includes("$");
        let onFalse = null;

        if (hasElse) {
          onFalse = firstOnly ? Number(rest[7]) : Number(rest[6]);
        }

        acc.push({
          ln: Number(ln),
          cmd,
          firstOnly,
          vName: ifVName,
          operator,
          opTo: isString ? opTo : Number(opTo),
          onTrue,
          onFalse,
        });

        break;
      case "CLS":
        acc.push({ ln: Number(ln), cmd });
        break;
      case "END":
        acc.push({ ln: Number(ln), cmd });
        break;
      case "GOTO":
        acc.push({ ln: Number(ln), cmd, value: Number(rest.join(" ")) });
        break;
    }
  }

  return acc;
}

function validateTokens(ln, cmd, value, i, pureStr) {
  const commands = [
    "SET",
    "PRINT",
    "INPUT",
    "WAIT",
    "REM",
    "IF",
    "CLS",
    "END",
    "GOTO",
  ];

  // GENERAL
  if (!ln || isNaN(Number(ln)) || Number(ln) < 0) {
    throw new Error(`Invalid line number on line ${i + 1}`);
  }

  if (!cmd || !commands.includes(cmd)) {
    throw new Error(`Invalid command on pointer ${ln}`);
  }

  // SET
  if (cmd === "SET") {
    const varName = value[0];
    const equal = value[1];
    const val = value[2];

    if (!equal || equal !== "=") {
      throw new Error(`Invalid SET command on pointer ${ln}`);
    }

    if (varName.includes("$")) {
      if (val[0] !== '"' || val[val.length - 1] !== '"') {
        throw new Error(`Invalid string of SET command on pointer ${ln}`);
      }
    } else {
      if (val[0] === '"' || val[val.length - 1] === '"') {
        throw new Error(`Invalid number of SET command on pointer ${ln}`);
      }

      if (isNaN(Number(val))) {
        throw new Error(`Invalid number of SET command on pointer ${ln}`);
      }
    }
  }

  // INPUT
  if (cmd === "INPUT") {
    const str = value.slice(0, value.length - 1).join(" ");
    const varName = value[value.length - 1];

    if (!varName || varName.length < 1) {
      throw new Error(`Invalid INPUT command on pointer ${ln}`);
    }

    if (!value || value.length < 1) {
      throw new Error(`Invalid INPUT command on pointer ${ln}`);
    }

    if (varName[varName.length - 1] !== "$") {
      throw new Error(`Variable ${varName} not a string on pointer ${ln}`);
    }

    if (!pureStr.includes(`SET ${varName}`)) {
      throw new Error(`Variable ${varName} not declared on pointer ${ln}`);
    }
  }

  // IF
  if (cmd === "IF") {
    const operators = ["=", "<", ">", "<=", ">=", "<>"];
    const firstOnly = value.includes("FIRST");
    const varName = value[0].replace("[", "").replace("]", "");
    const operator = firstOnly ? value[2] : value[1];
    const opTo = firstOnly ? value[3] : value[2];
    const onTrue = firstOnly ? Number(value[5]) : Number(value[4]);
    const hasElse = value.includes("ELSE");
    let onFalse = null;

    if (hasElse) {
      onFalse = firstOnly ? Number(value[7]) : Number(value[6]);
    }

    if (!operators.includes(operator)) {
      throw new Error(`Invalid IF command on pointer ${ln}`);
    }

    if (!operator || !opTo) {
      throw new Error(`Invalid IF command on pointer ${ln}`);
    }

    if (hasElse && isNaN(onFalse)) {
      throw new Error(`Invalid IF command on pointer ${ln}`);
    }

    if (isNaN(onTrue)) {
      throw new Error(`Invalid IF command on pointer ${ln}`);
    }

    if (!varName || varName.length < 1) {
      throw new Error(`Invalid IF command on pointer ${ln}`);
    }

    if (!pureStr.includes(`SET ${varName}`)) {
      throw new Error(`Variable ${varName} not declared on pointer ${ln}`);
    }

    if (varName.includes("$")) {
      if (opTo[0] !== '"' || opTo[opTo.length - 1] !== '"') {
        throw new Error(`Invalid type on IF command on pointer ${ln}`);
      }
    } else {
      if (isNaN(Number(opTo))) {
        throw new Error(`Invalid type on IF command on pointer ${ln}`);
      }
    }
  }

  // GOTO
  if (cmd === "GOTO") {
    const val = value.join(" ");

    if (isNaN(Number(val))) {
      throw new Error(`Invalid GOTO command on pointer ${ln}`);
    }

    if (!val || val.length < 1) {
      throw new Error(`Invalid GOTO command on pointer ${ln}`);
    }
  }
}

// Keypress Events
document.addEventListener("keydown", (e) => {
  const key = e.key;

  if (waitOn !== null && paused && key === " ") {
    curLn = waitOn + 1;
    waitOn = null;
    paused = false;

    cls();
    gameLoop();
  }
});

document.addEventListener("click", (e) => {
  const target = e.target;

  if (target.id === "emulator") {
    const input = document.getElementById("input");

    if (input) {
      input.focus();
    }
  }
});
