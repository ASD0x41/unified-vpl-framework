import './Workspace.css';
import { fabric } from 'fabric';
import { useEffect, useRef } from 'react';
import { generateGroupedComponent } from './Library';
import { useConnectionContext } from '../program-management/Manager.js';
import { computePoints } from '../program-management/Helper.js';

export default function Workspace({ onCanvasReady, draggedComponent, libComps, setSelectedComponent, lang }) {
    const canvasRef = useRef(null);
    const vpt = useRef(null);

    const {
        ObjectCounter,
        connections,
        components,
        isConnecting,
        srcGroup,
        srcPin,
        dstGroup,
        dstPin,
        isDisconnecting
    } = useConnectionContext();

    const PIN_RADIUS = 25;

    const isNearPin = (pointer, pin, targetGroup) => {
        const distance = Math.sqrt(
            Math.pow(pointer.x - (pin.left + targetGroup.left + targetGroup.width / 2), 2) + Math.pow(pointer.y - (pin.top + targetGroup.top + targetGroup.height / 2), 2)
        );
        return distance <= PIN_RADIUS;
    };



    let lastActiveObject = null;
    let pollingInterval = null;

    function checkActiveObject() {
        if (canvasRef.current) {
            const activeObject = canvasRef.current.getActiveObject();

            if (activeObject !== lastActiveObject) {
                lastActiveObject = activeObject;
                if (activeObject) {
                    if (activeObject.ID) {
                        setSelectedComponent(activeObject.ID);
                    }
                } else {
                    setSelectedComponent(null);
                }
            }
        }
    }

    function startPolling() {
        if (!pollingInterval) {
            pollingInterval = setInterval(checkActiveObject, 200);
        }
    }

    function stopPolling() {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    }



    const handleGroupClick = (e) => {
        if (e.selected.length > 1) {
            canvasRef.current.discardActiveObject();
            canvasRef.current.renderAll();
        }

        if (e.selected && e.selected !== undefined && isConnecting.current) {
            const canvasInstance = canvasRef.current;
            const pointer = canvasInstance.getPointer(e.e);
            const targetGroup = e.selected[0];

            if (!targetGroup) return;
            // const pins = targetGroup.getObjects().filter(obj => obj.type === 'circle' && obj.idx !== null);
            const pins = targetGroup.getObjects().filter(obj => obj.idx && (obj.idx[0] === '$' || obj.idx[0] === '@'));

            let clickedPin = null;

            for (let pin of pins) {
                if (isNearPin(pointer, pin, targetGroup)) {
                    clickedPin = pin;
                    break;
                }
            }

            canvasInstance.discardActiveObject()

            if (clickedPin) {
                if (isConnecting.current && srcGroup.current && srcPin.current) {
                    if (!components.current[targetGroup.ID].pins[clickedPin.idx] || (lang.type === 'dataflow' && clickedPin.idx[0] === '$')) {
                        if (srcGroup.current.ID !== targetGroup.ID) {
                            if ((srcPin.current.idx[0] === '@' && clickedPin.idx[0] === '$') || (srcPin.current.idx[0] === '$' && clickedPin.idx[0] === '@')) {
                                dstGroup.current = targetGroup;
                                dstPin.current = clickedPin;

                                drawLineBetweenPins(canvasInstance, srcPin.current, srcGroup.current, dstPin.current, dstGroup.current);
                                if (components.current[srcGroup.current.ID].pins[srcPin.current.idx])
                                    components.current[srcGroup.current.ID].pins[srcPin.current.idx].push([dstGroup.current.ID, dstPin.current.idx]);
                                else
                                    components.current[srcGroup.current.ID].pins[srcPin.current.idx] = [[dstGroup.current.ID, dstPin.current.idx]];

                                if (components.current[dstGroup.current.ID].pins[dstPin.current.idx])
                                    components.current[dstGroup.current.ID].pins[dstPin.current.idx].push([srcGroup.current.ID, srcPin.current.idx]);
                                else
                                    components.current[dstGroup.current.ID].pins[dstPin.current.idx] = [[srcGroup.current.ID, srcPin.current.idx]];

                                srcPin.current.set('fill', 'red');
                                dstPin.current.set('fill', 'red');

                                srcGroup.current = null;
                                srcPin.current = null;
                                dstGroup.current = null;
                                dstPin.current = null;
                                isConnecting.current = false;
                                canvasInstance.hoverCursor = 'grab';
                            }
                            else {
                                console.error("Connection must be between an input pin and an output pin! Select an appropriate pin.")
                            }
                        } else {
                            console.error("Cannot connect input and output pins of the same component! Select an appropriate component.")
                        }
                    }
                    else {
                        console.error("Pin is already in use. Select another pin.");
                    }
                } else {
                    if (!components.current[targetGroup.ID].pins[clickedPin.idx]) {
                        srcGroup.current = targetGroup;
                        srcPin.current = clickedPin;
                        srcPin.current.set('fill', 'orange');
                        //console.log("Pin selected! Click on another group to connect pins.");
                    }
                    else if (lang.type === 'dataflow' && clickedPin.idx[0] === '$') {
                        srcGroup.current = targetGroup;
                        srcPin.current = clickedPin;
                        srcPin.current.set('fill', 'orange');
                    }
                    else {
                        console.error("Pin is already in use. Select another pin.");
                    }
                }
            } else {
                console.error("Please click near a pin to select it.");
                isConnecting.current = false;
                canvasInstance.hoverCursor = 'grab';
                if (srcPin.current) {
                    if (!components.current[srcGroup.current.ID].pins[srcPin.current.idx]) {
                        srcPin.current.set('fill', 'white');
                    }
                    
                    srcGroup.current = null;
                    srcPin.current = null;
                }

            }



        } else if (e.selected && e.selected !== undefined && isDisconnecting.current) {
            const canvasInstance = canvasRef.current;
            const pointer = canvasInstance.getPointer(e.e);
            const targetGroup = e.selected[0];

            if (!targetGroup) return;
            const pins = targetGroup.getObjects().filter(obj => obj.type === 'circle' && obj.idx !== null);
            let clickedPin = null;

            for (let pin of pins) {
                if (isNearPin(pointer, pin, targetGroup)) {
                    clickedPin = pin;
                    break;
                }
            }

            canvasInstance.discardActiveObject()

            if (clickedPin) {
                if (isDisconnecting.current && srcGroup.current && srcPin.current) {
                    if (components.current[targetGroup.ID].pins[clickedPin.idx]) {
                        dstGroup.current = targetGroup;
                        dstPin.current = clickedPin;

                        const done = deleteLineBetweenPins(canvasInstance, connections, srcPin.current, dstPin.current);
                        if (done) {
                            let srcarr = components.current[srcGroup.current.ID].pins[srcPin.current.idx]
                            let dstarr = components.current[dstGroup.current.ID].pins[dstPin.current.idx]

                            components.current[srcGroup.current.ID].pins[srcPin.current.idx] = srcarr.filter(obj => !(obj[0] === dstGroup.current.ID && obj[1] === dstPin.current.idx));
                            components.current[dstGroup.current.ID].pins[dstPin.current.idx] = dstarr.filter(obj => !(obj[0] === srcGroup.current.ID && obj[1] === srcPin.current.idx));

                            if (components.current[srcGroup.current.ID].pins[srcPin.current.idx].length === 0) {
                                components.current[srcGroup.current.ID].pins[srcPin.current.idx] = null;
                                srcPin.current.set('fill', 'white');
                            } else {
                                srcPin.current.set('fill', 'red');
                            }
                            if (components.current[dstGroup.current.ID].pins[dstPin.current.idx].length === 0) {
                                components.current[dstGroup.current.ID].pins[dstPin.current.idx] = null;
                                dstPin.current.set('fill', 'white');
                            }
                        }
                        else {
                            console.error("There was no connection between the specified pins already.")
                            srcPin.current.set('fill', 'red');
                        }

                        srcGroup.current = null;
                        srcPin.current = null;
                        dstGroup.current = null;
                        dstPin.current = null;
                        isDisconnecting.current = false;
                        canvasInstance.hoverCursor = 'grab';
                    }
                    else {
                        console.error("Pin is already NOT in use. Select another pin.");
                    }
                } else {
                    if (components.current[targetGroup.ID].pins[clickedPin.idx]) {
                        srcGroup.current = targetGroup;
                        srcPin.current = clickedPin;
                        srcPin.current.set('fill', 'blue');
                        //console.log("Pin selected! Click on another group to disconnect pins.");
                    }
                    else {
                        console.error("Pin is already NOT in use. Select another pin.");
                    }
                }
            } else {
                console.error("Please click near a pin to select it.");
                isDisconnecting.current = false;
                canvasInstance.hoverCursor = 'grab';
                if (srcPin.current) {
                    srcPin.current.set('fill', 'red');
                    srcGroup.current = null;
                    srcPin.current = null;
                }
            }
        }
    };

    const drawLineBetweenPins = (canvasInstance, pin1, grp1, pin2, grp2) => {
        const points = computePoints(pin1, grp1, pin2, grp2);

        const line = new fabric.Polyline([{ x: -canvasInstance.width, y: -canvasInstance.height }, { x: 2 * canvasInstance.width, y: 2 * canvasInstance.height }], {
            fill: 'transparent',
            stroke: 'red',
            strokeWidth: 2,
            selectable: false,
            evented: false
        });

        canvasInstance.add(line);

        line.set({
            points: points
        });

        line.setCoords();
        line.sendBackwards();
        canvasInstance.renderAll();

        connections.current.push({
            pin1: pin1,
            grp1: grp1,
            pin2: pin2,
            grp2: grp2,
            line: line
        });

        console.log("Pins connected!");
    };

    const updateLinePosition = (canvasInstance, pin1, grp1, pin2, grp2, line) => {
        const points = computePoints(pin1, grp1, pin2, grp2);

        line.set({
            points: points
        });

        line.setCoords();
        canvasInstance.renderAll();
    }


    const canvas_vp_count = 9

    useEffect(() => {

        const vp_width = window.screen.width;
        const vp_height = window.screen.height;

        const canvas = new fabric.Canvas('canvas', {
            width: vp_width,
            height: vp_height,
            backgroundColor: '#d1d1d1',
        });

        fabric.Object.prototype.hasControls = false;
        canvas.preserveObjectStacking = true;
        canvas.selection = true;

        fabric.Object.prototype.set({
            borderColor: 'gray'
          });

        canvas.selectionColor = 'transparent';
        canvas.selectionBorderColor = 'transparent';
        canvas.selectionLineWidth = 0;


        addGridToCanvas(canvas, 20);

        startPolling();

        canvas.on('mouse:wheel', function (opt) {
            var delta = opt.e.deltaY;

            opt.e.preventDefault();
            opt.e.stopPropagation();

            var oldzoom = canvas.getZoom();
            let zoom = oldzoom * 0.999 ** delta;

            changeZoom(zoom, oldzoom, canvas);
        });

        // let isCtrlPressed = true;

        // window.addEventListener('keydown', function (e) {
        //     if (e.key === 'Control') {
        //         isCtrlPressed = true;
        //         // canvas.defaultCursor = 'grab';
        //     }
        // });

        // window.addEventListener('keyup', function (e) {
        //     if (e.key === 'Control') {
        //         isCtrlPressed = false;
        //         // canvas.defaultCursor = 'default';
        //     }
        // });

        canvas.defaultCursor = 'move';
        canvas.moveCursor = 'grabbing';
        canvas.hoverCursor = 'grab';

        canvas.on('mouse:down', function (opt) {

            var evt = opt.e;
            if (!canvas.getActiveObject()) {
                this.isDragging = true;
                this.selection = false;
                this.lastPosX = evt.clientX;
                this.lastPosY = evt.clientY;
            }
        });

        canvas.on('mouse:move', function (opt) {
            if (this.isDragging) {
                var e = opt.e;
                var vpt = this.viewportTransform;

                var zoom = canvas.getZoom();
                let newvpt4 = vpt[4] + e.clientX - this.lastPosX;
                let newvpt5 = vpt[5] + e.clientY - this.lastPosY;

                if (newvpt4 < vp_width * zoom && newvpt4 > -vp_width * (2 * zoom - 1)) {
                    vpt[4] += e.clientX - this.lastPosX;
                    this.requestRenderAll();
                    this.lastPosX = e.clientX;
                }
                if (newvpt5 < vp_height * zoom && newvpt5 > -vp_height * (2 * zoom - 1)) {
                    vpt[5] += e.clientY - this.lastPosY;
                    this.requestRenderAll();
                    this.lastPosY = e.clientY;
                }

                const allObjects = canvas.getObjects();
                allObjects.forEach(object => {
                    object.setCoords();
                });

                canvas.renderAll();
            }
        });

        canvas.on('mouse:up', function () {
            this.isDragging = false;
            this.selection = true;
        });

        // canvas.on('mouse:over', function() {
        //     canvas.defaultCursor = 'grabbing';
        //     canvas.wrapperEl.style.cursor = 'grabbing';
        // });

        // canvas.on('mouse:out', function() {
        //     canvas.defaultCursor = 'grab';
        //     canvas.wrapperEl.style.cursor = 'grab';
        // });

        canvas.on('selection:created', handleGroupClick);

        canvas.on('object:moving', function (e) {
            const movingObject = e.target;
            const pins = movingObject.getObjects().filter(obj => obj.type === 'circle' && obj.idx !== null);

            connections.current.forEach((connection) => {
                pins.forEach((pin) => {
                    if (connection.pin1 === pin || connection.pin2 === pin)
                        updateLinePosition(canvas, connection.pin1, connection.grp1, connection.pin2, connection.grp2, connection.line);
                });
            });

            // movingObject.getObjects().forEach((obj) => {
            //     if (obj.type === 'group') {
            //         const pins = obj.getObjects().filter(obj => obj.type === 'circle' && obj.idx !== null);

            //         connections.current.forEach((connection) => {
            //             pins.forEach((pin) => {
            //                 if (connection.pin1 === pin || connection.pin2 === pin)
            //                     updateLinePosition(canvas, connection.pin1, connection.grp1, connection.pin2, connection.grp2, connection.line);
            //             });
            //         });
            //     }
            // })
        });

        vpt.current = canvas.viewportTransform;
        canvasRef.current = canvas;

        canvas.renderAll();


        if (onCanvasReady) {
            onCanvasReady(canvas);
        }

        return () => {
            stopPolling();
            canvas.dispose();
        };
    }, []);



    useEffect(() => {
        const canvasInstance = canvasRef.current;

        if (canvasInstance) {
            const handleDragOver = (e) => e.preventDefault();
            const handleDrop = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const pointer = canvasInstance.getPointer(e);
                const id = draggedComponent;
                const compdef = libComps[id];

                fabric.util.enlivenObjects([compdef], (objects) => {
                    const group = generateGroupedComponent(compdef);

                    group.left = pointer.x;
                    group.top = pointer.y;

                    ObjectCounter.current += 1;
                    group.set('ID', ObjectCounter.current);

                    const comp = {
                        ID: ObjectCounter.current,
                        id: id,
                        props: {},
                        pins: {},
                        visual: group,
                        code: compdef.code
                    }

                    const compDef = compdef;

                    compDef.props.forEach((prop, index) => {
                        comp.props[`#${index + 1}`] = [prop, ''];
                    });

                    compDef.inpins.forEach((pin, index) => {
                        comp.pins[`@${index + 1}`] = null;
                    });

                    compDef.outpins.forEach((pin, index) => {
                        comp.pins[`$${index + 1}`] = null;
                    });

                    // console.log(comp);
                    components.current.push(comp)

                    canvasInstance.add(comp.visual);
                });

            };

            if (canvasInstance.upperCanvasEl) {
                canvasInstance.upperCanvasEl.addEventListener('dragover', handleDragOver);
                canvasInstance.upperCanvasEl.addEventListener('drop', handleDrop);
            }

            return () => {
                if (canvasInstance && canvasInstance.upperCanvasEl) {
                    canvasInstance.upperCanvasEl.removeEventListener('dragover', handleDragOver);
                    canvasInstance.upperCanvasEl.removeEventListener('drop', handleDrop);
                }
            };
        }
    }, [draggedComponent]);

    return (
        <main className="workspace">
            <canvas id="canvas" ref={canvasRef} style={{ cursor: 'move' }}></canvas>
        </main>
    );
}

export function changeZoom(zoom, oldzoom, thecanvas) {
    const vp_width = window.screen.width;
    const vp_height = window.screen.height;

    const min_zoom = 0.4
    const max_zoom = 2.5

    if (zoom < min_zoom) zoom = min_zoom;
    if (zoom > max_zoom) zoom = max_zoom;

    var vpt = thecanvas.viewportTransform;

    vpt[0] = zoom;
    vpt[3] = zoom;

    vpt[4] = (zoom / oldzoom) * (vpt[4] - vp_width / 2) + vp_width / 2;
    vpt[5] = (zoom / oldzoom) * (vpt[5] - vp_height / 2) + vp_height / 2;

    thecanvas.renderAll();
}

export function deleteLineBetweenPins(canvasInstance, connections, srcPin, dstPin) {
    let done = false;
    connections.current.forEach((connection, index) => {
        if ((connection.pin1 === srcPin && connection.pin2 === dstPin) || (connection.pin1 === dstPin && connection.pin2 === srcPin)) {
            canvasInstance.remove(connection.line);

            connections.current = connections.current.filter(obj => !((obj.pin1 === srcPin && obj.pin2 === dstPin) || (obj.pin2 === srcPin && obj.pin1 === dstPin)));
            canvasInstance.renderAll();

            //console.log('Line removed between pins!');
            done = true;
        }
    });
    return done;
};

export function addGridToCanvas(canvas, gridSize) {
    const gridColor = '#fff';
    const gridOpacity = 0.75;

    for (let i = -canvas.width / gridSize; i < 2 * canvas.width / gridSize; i++) {
        const line = new fabric.Line([i * gridSize, -canvas.height, i * gridSize, 2 * canvas.height], {
            stroke: gridColor,
            selectable: false,
            evented: false,
            strokeWidth: 1,
            opacity: gridOpacity,
            isGridLine: true
        });
        canvas.add(line);
        canvas.sendToBack(line);
    }


    for (let i = -canvas.height / gridSize; i < 2 * canvas.height / gridSize; i++) {
        const line = new fabric.Line([-canvas.width, i * gridSize, 2 * canvas.width, i * gridSize], {
            stroke: gridColor,
            selectable: false,
            evented: false,
            strokeWidth: 1,
            opacity: gridOpacity,
            isGridLine: true
        });
        canvas.add(line);
        canvas.sendToBack(line);
    }

    canvas.renderAll();
}