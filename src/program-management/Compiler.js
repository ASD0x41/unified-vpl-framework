import { toast } from 'react-toastify';

export function Compiler(components) {

    const getCode = (block, langtype) => {
        let code = components.current[block].compcode;
        let replacements = {}
        let opinCount = 0;

        let lines = code.split('\n');

        Object.keys(components.current[block].pins).forEach((pin) => {
            if (components.current[block].pins[pin] && pin.at(0) === '$') {
                if (components.current[block].pins[pin][0][1] === "@1") {
                    // console.log(block, components.current[block].pins[pin][0][0], components.current[block].pins[pin][0][1])
                    let replacementCode = getCode(components.current[block].pins[pin][0][0], langtype);

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

                } else {
                    replacements[pin] = '\n';
                }
                opinCount++;
            }
        });

        if (opinCount === 0) {
            if (langtype === 'block') {
                code = code.replaceAll(/\$\d+/g, "");
            }

        } else {
            Object.keys(replacements).forEach((repl) => {
                code = code.replace(repl, replacements[repl]);
            });
            
        }

        return code;
    }

    const compileProgram = (lang) => {
        if (lang.type === 'dataflow') {
            let compCount = -1;
            components.current.forEach((comp) => {
                if (comp)
                    compCount++;
            });

            if (compCount !== 0) {
                const graphlib = require('graphlib');
                const graph = new graphlib.Graph();

                components.current.forEach((component, index) => {
                    if (index !== 0 && component) {
                        let compCode = component.code;
                        Object.keys(component.props).forEach((prop) => {
                            compCode = compCode.replaceAll(prop, component.props[prop][1]);
                        });
                        Object.keys(component.pins).forEach((pin) => {
                            if (pin[0] === '$') {
                                compCode = compCode.replaceAll(pin, '_' + component.ID);
                            } else if (pin[0] === '@' && component.pins[pin]) {
                                compCode = compCode.replaceAll(pin, '_' + component.pins[pin][0][0]);
                                graph.setEdge('_' + component.pins[pin][0][0], '_' + component.ID);
                            }
                        });
                        component.compcode = compCode;
                    }
                });

                const sorted = graphlib.alg.topsort(graph);

                let progCode = "";
                for (let i = 0; i < sorted.length; i++) {
                    progCode += components.current[sorted[i].substring(1)].compcode + '\n';
                }

                let newprogCode = progCode.replaceAll("\t", "    ");

                let lines = newprogCode.split('\n');
                lines.forEach((line, index) => {
                    if (index < lines.length - 1) {
                        console.log(`${index + 1}:    ${line}`);
                    }
                });

                return progCode;
            }
        } else {
            let compCount = -1;
            components.current.forEach((comp) => {
                if (comp)
                    compCount++;
            });
            //console.log(compCount);

            if (compCount !== 0) {
                let main = 0;
                components.current.forEach((component, index) => {
                    if (index !== 0 && component) {
                        let compCode = component.code;
                        Object.keys(component.props).forEach((prop) => {
                            compCode = compCode.replace(prop, component.props[prop][1]);
                        });
                        //console.log(component.id, compCode)
                        component.compcode = compCode;

                        if (component.id === "main") {
                            main = component.ID;
                        }
                    }
                });

                if (main !== 0) {
                    //console.log(main)
                    let progCode = getCode(main, lang.type);
                    progCode = progCode.replaceAll("\n\n", "\n");
                    progCode = progCode.replaceAll("\n", "\n\t");

                    {
                        let newprogCode = progCode.replaceAll("\t", "    ");

                        let lines = newprogCode.split('\n');
                        lines.forEach((line, index) => {
                            if (index < lines.length - 1) {
                                console.log(`${index + 1}:    ${line}`);
                            }
                        });
                    }

                    return "\t" + progCode;
                } else {
                    toast.error("Program has no starting point!");
                    return "";
                }
            }
        }

        // common post-processing
    };

    return { compileProgram };
}
