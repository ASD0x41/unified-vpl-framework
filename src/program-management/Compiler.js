export function Compiler(components) {

    const getCode = (block) => {
        let code = components.current[block].compcode;
        let replacements = {}
        let opinCount = 0;
    
        let lines = code.split('\n');
    
        Object.keys(components.current[block].pins).forEach((pin) => {
            if (components.current[block].pins[pin] && pin.at(0) === '$') {
                let replacementCode = getCode(components.current[block].pins[pin][0]);
    
                let tabcount = 0;
                for (let i = 0; i < lines.length; i++) {
                    let pinidx = lines[i].indexOf(pin);
                    if (pinidx !== -1) {
                        for (let j = 0; j < pinidx; j++) {
                            if (lines[i][j] === '\t')
                                tabcount++;
                        }
                        break;
                    }
                }
    
                let indent = "\n";
                for (let i = 0; i < tabcount; i++) {
                    indent += '\t';
                }
    
                replacementCode = replacementCode.replaceAll('\n', indent);
                replacements[pin] = replacementCode;
                opinCount++;
            }
        });
    
        if (opinCount === 0) {
            code = code.replace(/\$\d+/g, "");
        } else {
            Object.keys(replacements).forEach((repl) => {
                code = code.replace(repl, replacements[repl]);
            });
        }
    
        return code;
    }
    
    const compileProgram = () => {
        console.log(components.current);

        let compCount = -1;
        components.current.forEach((comp) => {
            if (comp)
                compCount++;
        });
        console.log(compCount);

        if (compCount !== 0) {
            let main = 0;
            components.current.forEach((component, index) => {
                if (index !== 0 && component) {
                    let compCode = component.code;
                    Object.keys(component.props).forEach((prop) => {
                        compCode = compCode.replace(prop, component.props[prop][1]);
                    });
                    component.compcode = compCode;
        
                    if (component.id === "main") {
                        main = component.ID;
                    }
                }
            });
        
            let progCode = getCode(main);
            progCode = progCode.replaceAll("\n\n", "\n");
            let newprogCode = progCode.replaceAll("\t", "    ");
        
            let lines = newprogCode.split('\n');
            lines.forEach((line, index) => {
                if (index < lines.length - 1) {
                    console.log(`${index + 1}:    ${line}`);
                }
            });
        
            return progCode;
        }
    };

  return { compileProgram };
}
