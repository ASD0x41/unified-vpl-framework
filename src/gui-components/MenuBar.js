import './MenuBar.css';
import { fabric } from 'fabric';
import { useState, useEffect } from "react";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFile, faFolderOpen, faSave, faArrows, faSearchPlus, faSearchMinus,
    faTrashAlt, faLink, faBan, faUpload, faDownload, faEdit, faCode, faPlay
} from '@fortawesome/free-solid-svg-icons';

import { changeZoom } from './Workspace';
import { deleteLineBetweenPins, addGridToCanvas } from './Workspace';
import { useConnectionContext } from '../program-management/Manager.js';
import { Compiler } from '../program-management/Compiler.js'
import { computePoints } from '../program-management/Helper.js';

export default function MenuBar({ clearConsole, canvas, loadComponents, setSelectedComponent, lang, libComps, setLang }) {
    const {
        connections,
        components,
        isConnecting,
        srcGroup,
        srcPin,
        dstGroup,
        dstPin,
        isDisconnecting,
        forest,
        ObjectCounter,
        tempVal
    } = useConnectionContext();
    const { compileProgram } = Compiler(components);
    const [pyodide, setPyodide] = useState(null);

    useEffect(() => {
        const loadPyodide = async () => {
            const pyodideInstance = await window.loadPyodide({
                indexURL: "./pyodide/",
            });

            setPyodide(pyodideInstance);

            window.getUserInput = async function(promptText) {
                console.log(promptText);
                return new Promise((resolve) => {
                    
                    const inputListener = (userInput) => {
                        resolve(userInput.detail);
                    };
                    window.addEventListener("get-input", inputListener, { once: true });

                    // const userInput = prompt(promptText);
                    // resolve(userInput);
                });
            };

            await pyodideInstance.runPythonAsync(`
                import js
    
                # Define the async input function
                async def input(prompt=''):
                    return await js.getUserInput(prompt)
                `);
        };

        loadPyodide();
    }, []);

    const runPythonCode = async (code) => {
        if (!pyodide) return;
        try {
            await pyodide.runPythonAsync(code);
        } catch (err) {
            console.error(`Error executing Python code: ${err.message}`);
        }
    };

    const executeCode = async () => {
        let gencode = compileProgram(lang);

        gencode = gencode.replaceAll("\n", "\n\t");
        gencode = "\n\t\t" + gencode;
        gencode = gencode.replaceAll("input(", "await input(");

        const code = "async def main():\n"+ gencode + "\nawait main()";

        await runPythonCode(code);
    };






    const connectionMode = () => {
        isConnecting.current = true;
        isDisconnecting.current = false;
        canvas.current.hoverCursor = 'pointer';
    };

    const disconnectionMode = () => {
        isDisconnecting.current = true;
        isConnecting.current = false;
        canvas.current.hoverCursor = 'pointer';
    };

    const backToCenter = () => {
        if (canvas.current) {
            canvas.current.viewportTransform[4] = canvas.current.viewportTransform[5] = 0;
            canvas.current.viewportTransform[0] = canvas.current.viewportTransform[3] = 1;

            const allObjects = canvas.getObjects();
            allObjects.forEach(object => {
                object.setCoords();
            });

            canvas.current.renderAll();
        }
    }

    const zoomIn = () => {
        if (canvas.current) {
            changeZoom(canvas.current.getZoom() * 1.25, canvas.current.getZoom(), canvas.current);
        }
    };

    const zoomOut = () => {
        if (canvas) {
            changeZoom(canvas.current.getZoom() * 0.8, canvas.current.getZoom(), canvas.current);
        }
    };

    const delObject = () => {
        const activeObject = canvas.current.getActiveObject();
        if (activeObject) {
            const ID = activeObject.ID;
            setSelectedComponent(null);

            if (lang.type === 'block' && components.current[ID].pins["@1"]) {
                let blockID = ID;

                while (blockID) {
                    let parent = components.current[blockID].pins["@1"];
                    if (parent) {
                        if (components.current[parent[0][0]].visual.getObjects().filter(obj => (obj.idx && obj.idx === parent[0][1]))[0].side[0] !== 0) {
                            console.error("Detach block from the stack of blocks first before deletion!")
                            return;
                        }

                        blockID = components.current[blockID].pins["@1"][0][0];
                    } else {
                        blockID = null;
                    }
                }
            }

            if (lang.type === 'block') {
                let deps = [];

                Object.keys(forest.current[activeObject.ID]).forEach((dep) => {
                    deps.push(dep);
                })

                deps.push(activeObject.ID);

                Object.keys(forest.current).forEach((key) => {
                    if (!deps.includes(key)) {
                        deps.forEach((dep) => {
                            if (dep in forest.current[key])
                                delete forest.current[key][dep];
                        })
                    }
                })

                delete forest[ID];


            }

            // console.log(components.current[ID]);

            const compObj = components.current[ID];
            Object.keys(compObj.pins).forEach((pin) => {
                if (compObj.pins[pin]) {
                    compObj.pins[pin].forEach((conn) => {
                        let otherObj = conn[0];
                        let otherPin = conn[1];

                        // console.log("mypin", pin ,"otherobj", otherObj, "otherpin", otherPin)

                        if (components.current[otherObj].pins[otherPin].length === 1)
                            components.current[otherObj].pins[otherPin] = null;
                        else
                            components.current[otherObj].pins[otherPin] = components.current[otherObj].pins[otherPin].filter(obj => !(obj[0] === ID && obj[1] === pin));
                    });
                    compObj.pins[pin] = null;
                }
            });


            if (lang.type !== 'block') {
                const pins = activeObject.getObjects().filter(obj => obj.idx && (obj.idx[0] === '$' || obj.idx[0] === '@'));

                pins.forEach((pin) => {
                    connections.current.forEach((connection, index) => {

                        if (connection.pin1 === pin || connection.pin2 === pin) {
                            let otherPin = null;
                            if (connection.pin1 === pin)
                                otherPin = connection.pin2;
                            else if (connection.pin2 === pin)
                                otherPin = connection.pin1;

                            deleteLineBetweenPins(canvas.current, connections, pin, otherPin);

                            let remCounts = 0;
                            for (let i = 0; i < connections.current.length; i++) {
                                if (connections.current[i].pin1 === otherPin || connections.current[i].pin2 === otherPin)
                                    remCounts++;
                            }
                            if (remCounts === 0)
                                if (connection.pin1 === pin)
                                    connection.pin2.set('fill', 'white');
                                else if (connection.pin2 === pin)
                                    connection.pin1.set('fill', 'white');
                        }
                    });
                });
            }

            canvas.current.remove(activeObject);
            components.current[ID] = null;

            // console.log(forest.current);
        }
    }

    const newProgram = () => {
        components.current = [{}];
        connections.current = [];
        forest.current = {};
        isConnecting.current = false;
        isDisconnecting.current = false;
        srcPin.current = null;
        srcGroup.current = null;
        dstPin.current = null;
        dstGroup.current = null;
        ObjectCounter.current = 0;

        tempVal.current = JSON.parse(JSON.stringify(lang));
        setLang(tempVal.current);

        // canvas.current.clear();
        // addGridToCanvas(canvas.current, 20);
    }

    const loadProgram = (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const json = e.target.result;
                document.getElementById('canvas-file').value = '';

                const Json = JSON.parse(json);

                loadComponents(JSON.stringify(Json["language"]));

                components.current = Json["components"];
                const tempConns = Json["connections"];
                forest.current = Json["blockstacks"];
                ObjectCounter.current = Json["counter"]

                canvas.current.loadFromJSON(Json["canvas"], () => {
                    canvas.current._objects.slice(321).forEach((obj) => {
                        if (components.current[obj.ID])
                            components.current[obj.ID].visual = obj;
                    });

                    canvas.current.renderAll();

                    canvas.current.getObjects().forEach((obj) => {
                        if (obj.type === 'polyline') {
                            canvas.current.remove(obj);
                        }
                    });

                    canvas.current.renderAll();

                    tempConns.forEach((conn) => {
                        let grp1 = components.current[conn.grp1].visual;
                        let grp2 = components.current[conn.grp2].visual;

                        let pin1 = grp1.getObjects().filter(obj => (obj.idx && obj.idx === conn.pin1))[0];
                        let pin2 = grp2.getObjects().filter(obj => (obj.idx && obj.idx === conn.pin2))[0];

                        // console.log(grp1, pin1, grp2, pin2);

                        const points = computePoints(pin1, grp1, pin2, grp2);

                        const line = new fabric.Polyline([{ x: -canvas.current.width, y: -canvas.current.height }, { x: 2 * canvas.current.width, y: 2 * canvas.current.height }], {
                            fill: 'transparent',
                            stroke: 'red',
                            strokeWidth: 2,
                            selectable: false,
                            evented: false
                        });

                        canvas.current.add(line);

                        line.set({
                            points: points
                        });

                        line.setCoords();
                        line.sendBackwards();
                        canvas.current.renderAll();

                        connections.current.push({
                            pin1: pin1,
                            grp1: grp1,
                            pin2: pin2,
                            grp2: grp2,
                            line: line
                        });
                    });

                    canvas.current.renderAll();
                });

                // console.log("hi:", canvas.current);



            } catch (error) {
                console.error('Error loading program from JSON:', error);
            }
        };

        reader.readAsText(file);
    }

    const saveProgram = () => {
        const saveFile = {};

        saveFile["language"] = { name: lang.name, type: lang.type, components: Object.values(JSON.parse(JSON.stringify(libComps, '\t'))) };

        const comprepl = (key, value) => {
            if (key === 'visual') {
                return undefined;
            }
            return value;
        };
        saveFile["components"] = JSON.parse(JSON.stringify(components.current, comprepl, '\t'));

        const simpleConns = [];
        connections.current.forEach((connection) => {
            simpleConns.push({ pin1: connection.pin1.idx, grp1: connection.grp1.ID, pin2: connection.pin2.idx, grp2: connection.grp2.ID });
        });
        saveFile["connections"] = simpleConns;

        saveFile["blockstacks"] = JSON.parse(JSON.stringify(forest.current, '\t'));

        saveFile["counter"] = ObjectCounter.current;

        // const nonGridObjs = canvas.current._objects.slice(321);

        saveFile["canvas"] = canvas.current.toJSON();

        const blob = new Blob([JSON.stringify(saveFile, '\t')], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'my_visual_program.json';
        link.click();

        URL.revokeObjectURL(link.href);
    }

    const saveComponent = () => {
        const activeObject = canvas.current.getActiveObject();
        if (!activeObject) {
            alert('Please select an object to save.');
            return;
        }

        const json = JSON.stringify(libComps[activeObject.id]);
        // const json = JSON.stringify(activeObject.toObject());

        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'selected-object.json';
        link.click();

        URL.revokeObjectURL(link.href);
    };

    const handleLoadComponents = (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const json = e.target.result;
                document.getElementById('load-file').value = '';

                components.current = [{}];
                connections.current = [];
                isConnecting.current = false;
                isDisconnecting.current = false;
                srcPin.current = null;
                srcGroup.current = null;
                dstPin.current = null;
                dstGroup.current = null;

                canvas.current.clear();
                addGridToCanvas(canvas.current, 20);

                loadComponents(json);
            } catch (error) {
                console.error('Error loading components from JSON:', error);
            }
        };

        reader.readAsText(file);
    };

    // async function getUserInput(promptText) {
    //     return new Promise((resolve) => {
    //       let userInput = prompt(promptText);  // Use browser's prompt for simplicity
    //       resolve(userInput);
    //     });
    //   }
      


    const downloadCode = async () => {
        let code = compileProgram(lang);

        const blob = new Blob([code], { type: 'text/plain' });
        const link = document.createElement("a");

        link.href = URL.createObjectURL(blob);
        link.download = "script.py";

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
    };

    

    return (
        <aside className="menu-bar">
            <div className="button-container">

                <button className="icon-button" title="New Program" id="new-canvas" onClick={newProgram}>
                    <FontAwesomeIcon icon={faFile} />
                </button>
                <input type="file" id="canvas-file" style={{ display: 'none' }} onChange={loadProgram} />
                <button className="icon-button" title="Open Program" id="open-canvas" onClick={() => document.getElementById('canvas-file').click()}>
                    <FontAwesomeIcon icon={faFolderOpen} />
                </button>
                <button className="icon-button" title="Save Program" id="save-canvas" onClick={saveProgram}>
                    <FontAwesomeIcon icon={faSave} />
                </button>

                <button className="icon-button" title="Go To Center" id="back-center" onClick={backToCenter}>
                    <FontAwesomeIcon icon={faArrows} />
                </button>
                <button className="icon-button" title="Zoom In" id="zoom-in" onClick={zoomIn}>
                    <FontAwesomeIcon icon={faSearchPlus} />
                </button>
                <button className="icon-button" title="Zoom Out" id="zoom-out" onClick={zoomOut}>
                    <FontAwesomeIcon icon={faSearchMinus} />
                </button>

                <button className="icon-button" title="Delete Object" id="del-obj" onClick={delObject}>
                    <FontAwesomeIcon icon={faTrashAlt} />
                </button>
                {lang.type !== 'block' &&
                    <button className="icon-button" title="Connect Objects" id="connect-btn" onClick={connectionMode}>
                        <FontAwesomeIcon icon={faLink} />
                    </button>
                }
                {lang.type !== 'block' &&
                    <button className="icon-button" title="Disconnect Objects" id="disconnect-btn" onClick={disconnectionMode}>
                        <FontAwesomeIcon icon={faBan} />
                    </button>
                }

                <input type="file" id="load-file" style={{ display: 'none' }} onChange={handleLoadComponents} />
                <button className="icon-button" title="Load Language" id="load-btn" onClick={() => document.getElementById('load-file').click()}>
                    <FontAwesomeIcon icon={faUpload} />
                </button>
                <button className="icon-button" title="Download Component" id="save-btn" onClick={saveComponent}>
                    <FontAwesomeIcon icon={faDownload} />
                </button>

                <button className="icon-button" title="Clear Console" id="clear-console" onClick={clearConsole}>
                    <FontAwesomeIcon icon={faEdit} />
                </button>
                <button className="icon-button" title="Compile & Download Code" onClick={downloadCode}>
                    <FontAwesomeIcon icon={faCode} />
                </button>
                <button className="icon-button" title="Compile & Execute Code" onClick={executeCode}>
                    <FontAwesomeIcon icon={faPlay} />
                </button>
            </div>
        </aside>
    );
}
