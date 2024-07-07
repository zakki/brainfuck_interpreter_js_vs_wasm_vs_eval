function optimizeBrainfuck(code) {
    const jumpTable = {};
    const stack = [];
  
    for (let i = 0; i < code.length; i++) {
        if (code[i] === '[') {
            stack.push(i);
        } else if (code[i] === ']') {
            const start = stack.pop();
            const end = i;
            jumpTable[start] = end;
            jumpTable[end] = start;
        }
    }
  
    return jumpTable;
}

function runBrainfuck(code) {
    const memory = new Uint8Array(30000);
    let pointer = 0;
    let output = '';
    const jumpTable = optimizeBrainfuck(code);
  
    for (let i = 0; i < code.length; i++) {
        switch (code[i]) {
            case '>': pointer++; break;
            case '<': pointer--; break;
            case '+': memory[pointer]++; break;
            case '-': memory[pointer]--; break;
            case '.':
                output += String.fromCharCode(memory[pointer]);
                break;
            case '[':
                if (memory[pointer] === 0) {
                    i = jumpTable[i];
                }
                break;
            case ']':
                if (memory[pointer] !== 0) {
                    i = jumpTable[i];
                }
                break;
        }
    }
  
    return output;
}

function compile(code) {
    let result = "";
    const jumpTable = optimizeBrainfuck(code);
    result += `
() => {
    const memory = new Uint8Array(30000);
    let pointer = 0;
    let output = '';
    let pc = -1;
    //let running = true;

    //while (running) {
    while (true) {
        switch(pc) {
        case -1:
    `;

    for (let i = 0; i < code.length; i++) {
        switch (code[i]) {
            case '>':
                result += `
                pointer++;
                `;
                break;
            case '<':
                result += `
                pointer--;
                `;
                break;
            case '+':
                result += `
                memory[pointer]++;
                `;
                break;
            case '-':
                result += `
                memory[pointer]--;
                `;
                break;
            case '.':
                result += `
                output += String.fromCharCode(memory[pointer]);
                `;
                break;
            case '[':
                result += `
            // label ${i}
            case  ${i}:
                if (memory[pointer] === 0) {
                    // goto i;
                    pc = ${jumpTable[i]};
                    break;
                }
                `;
                break;
            case ']':
                result += `
            // label ${i}
            case ${i}:
                if (memory[pointer] !== 0) {
                    // goto i;
                    pc = ${jumpTable[i]};
                    break;
                }
                `;
                break;
        }
    }
    result += `
            // running = false;
            return output;
    `;

    result += `
        }
    }
    return output;
}
    `;
  
    return result;
}

self.addEventListener('message', function(e) {
    const code = e.data;
    // const output = runBrainfuck(code);
    const opt = compile(code);
    console.log(opt);
    const fun = eval(opt);
    const output = fun();
    self.postMessage(output); 
});
