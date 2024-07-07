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

function preprocess(code) {
    let result = "";

    for (let i = 0; i < code.length; i++) {
        switch (code[i]) {
            case '>':
            case '<':
            case '+':
            case '-':
            case '.':
            case '[':
            case ']':
                result += code[i];
                break;
        }
    }

    return result;
}

function compile(code) {
    code = preprocess(code);
    const jumpTable = optimizeBrainfuck(code);
    let result = "";
    result += `
    const memory = new Uint8Array(30000);
    let pointer = 0;
    let output = '';

    `;

    function count(i, c) {
        let n = 0;
        for (let j = i; j < code.length && code[j] == c; j++) {
            n++;
        }
        return n;
    }

    for (let i = 0; i < code.length; i++) {
        switch (code[i]) {
            case '>':
                {
                    let n = count(i, '>');
                    i += n - 1;
                    result +=
`                pointer += ${n};
`;
                }
                break;
            case '<':
                {
                    let n = count(i, '<');
                    i += n - 1;
                    result +=
`                pointer -= ${n};
`;
                }
                break;
            case '+':
                {
                    let n = count(i, '+');
                    i += n - 1;
                result +=
`                memory[pointer] += ${n};
`;
                }
                break;
            case '-':
                {
                    let n = count(i, '-');
                    i += n - 1;
                result +=
`                memory[pointer] -= ${n};
`;
                }
                break;
            case '.':
                result +=
`                output += String.fromCharCode(memory[pointer]);
`;
                break;
            case '[':
                if (code.substring(i, i+3) == "[-]") {
                    result +=
                `                memory[pointer] = 0;
`;
                    i += 2;
                    break;
                }
                result +=
`            // [ label ${i}  ${jumpTable[i]};
                while (memory[pointer] !== 0) {
`;
                break;
            case ']':
                result +=
`            // ] label ${i}  ${jumpTable[i]};
                }
`;
                break;
        }
    }
    result +=
`            return output;
    `;

    return new Function(result);
}

self.addEventListener('message', function(e) {
    const code = e.data;
    // const output = runBrainfuck(code);
    // const opt = compile(code);
    // console.log(opt);
    // const fun = eval(opt);
    const fun = compile(code);
    console.log(fun);
    const output = fun();
    self.postMessage(output); 
});
