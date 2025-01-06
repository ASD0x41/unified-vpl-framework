import './MenuBar.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFile, faFolderOpen, faSave, faArrows, faSearchPlus, faSearchMinus,
    faTrashAlt, faLink, faBan, faUpload, faDownload, faEdit, faCode, faPlay
} from '@fortawesome/free-solid-svg-icons';

import { changeZoom } from './Workspace';
import { deleteLineBetweenPins, addGridToCanvas } from './Workspace';
import { useConnectionContext } from '../program-management/Manager.js';
import { Compiler } from '../program-management/Compiler.js'

export default function MenuBar({ clearConsole, canvas, loadComponents, setSelectedComponent, lang, libComps }) {
    const { 
        ObjectCounter,
        connections,
        components,
        isConnecting,
        srcGroup,
        srcPin,
        dstGroup,
        dstPin,
        isDisconnecting } = useConnectionContext();
    const { compileProgram } = Compiler(components);

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

            const compObj = components.current[ID];
            Object.keys(compObj.pins).forEach((pin) => {
                if (compObj.pins[pin]) {
                    compObj.pins[pin].forEach((conn) => {
                        let otherObj = conn[0];
                        let otherPin = conn[1];

                        if (components.current[otherObj].pins[otherPin].length === 1)
                            components.current[otherObj].pins[otherPin] = null;
                        else
                            components.current[otherObj].pins[otherPin] = components.current[otherObj].pins[otherPin].filter(obj => !(obj[0] === ID && obj[1] === pin));
                    });
                    compObj.pins[pin] = null;
                }
            });

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

            canvas.current.remove(activeObject);
            components.current[ID] = null;
        }
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

    
    const downloadCode = () => {
        let code = compileProgram();

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

                <button className="icon-button" title="New Program" id="new-canvas" >
                    <FontAwesomeIcon icon={faFile} />
                </button>
                <input type="file" id="canvas-file" style={{ display: 'none' }} />
                <button className="icon-button" title="Open Program" id="open-canvas" >
                    <FontAwesomeIcon icon={faFolderOpen} />
                </button>
                <button className="icon-button" title="Save Program" id="save-canvas" >
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
                <button className="icon-button" title="Connect Objects" id="connect-btn" onClick={connectionMode}>
                    <FontAwesomeIcon icon={faLink} />
                </button>
                <button className="icon-button" title="Disconnect Objects" id="disconnect-btn" onClick={disconnectionMode}>
                    <FontAwesomeIcon icon={faBan} />
                </button>

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
                <button className="icon-button" title="Compile & Execute Code">
                    <FontAwesomeIcon icon={faPlay} />
                </button>
            </div>
        </aside>
    );
}
