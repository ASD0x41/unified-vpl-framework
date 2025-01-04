import './Workspace.css';
import { fabric } from 'fabric';
import { useEffect, useRef } from 'react';
import { generateGroupedComponent } from './Library';
import { useConnectionContext } from '../program-management/Manager.js';

export default function Workspace({ onCanvasReady, draggedComponent, libComps }) {
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

    const PIN_RADIUS = 10;

    const isNearPin = (pointer, pin, targetGroup) => {
        const distance = Math.sqrt(
            Math.pow(pointer.x - (pin.left + targetGroup.left + targetGroup.width / 2), 2) + Math.pow(pointer.y - (pin.top + targetGroup.top + targetGroup.height / 2), 2)
        );
        return distance <= PIN_RADIUS;
    };

    const handleGroupClick = (e) => {
        if (isConnecting.current) {
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
                
                if (isConnecting.current && srcGroup.current && srcPin.current) {
                    if (!components.current[targetGroup.ID].pins[clickedPin.idx]) {
                        if ((srcPin.current.idx[0] === '@' && clickedPin.idx[0] === '$') || (srcPin.current.idx[0] === '$' && clickedPin.idx[0] === '@')) {
                            dstGroup.current = targetGroup;
                            dstPin.current = clickedPin;

                            drawLineBetweenPins(canvasInstance, srcPin.current, srcGroup.current, dstPin.current, dstGroup.current);
                            components.current[srcGroup.current.ID].pins[srcPin.current.idx] = [dstGroup.current.ID, dstPin.current.idx];
                            components.current[dstGroup.current.ID].pins[dstPin.current.idx] = [srcGroup.current.ID, srcPin.current.idx];
                            
                            srcPin.current.set('fill', 'red');
                            dstPin.current.set('fill', 'red');

                            srcGroup.current = null;
                            srcPin.current = null;
                            dstGroup.current = null;
                            dstPin.current = null;
                            isConnecting.current = false;
                        }
                        else {
                            console.log("Connection must be between an input pin and an output pin! Select an appropriate pin.")
                        }
                    }
                    else {
                        console.log("Pin is already in use. Select another pin.");
                    }
                } else {
                    if (!components.current[targetGroup.ID].pins[clickedPin.idx]) {
                        srcGroup.current = targetGroup;
                        srcPin.current = clickedPin;

                        console.log("Pin selected! Click on another group to connect pins.");
                    }
                    else {
                        console.log("Pin is already in use. Select another pin.");
                    }
                }
                
            } else {
                console.log("Please click near a pin to select it.");
            }



        } else if (isDisconnecting.current) {
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

                        const done = deleteLineBetweenPins(canvasInstance, srcPin.current, dstPin.current);
                        if (done) {
                            components.current[srcGroup.current.ID].pins[srcPin.current.idx] = null;
                            components.current[dstGroup.current.ID].pins[dstPin.current.idx] = null;
                            
                            srcPin.current.set('fill', 'white');
                            dstPin.current.set('fill', 'white');
                        }
                        else {
                            console.log("There was no connection between the specified pins already.")
                        }

                        srcGroup.current = null;
                        srcPin.current = null;
                        dstGroup.current = null;
                        dstPin.current = null;
                        isDisconnecting.current = false;
                    }
                    else {
                        console.log("Pin is already NOT in use. Select another pin.");
                    }
                } else {
                    if (components.current[targetGroup.ID].pins[clickedPin.idx]) {
                        srcGroup.current = targetGroup;
                        srcPin.current = clickedPin;
                        console.log("Pin selected! Click on another group to connect pins.");
                    }
                    else {
                        console.log("Pin is already NOT in use. Select another pin.");
                    }
                }
                
            } else {
                console.log("Please click near a pin to select it.");
            }
        }
    };

    const computePoints = (pin1, grp1, pin2, grp2) => {
        const pin1X = pin1.left + grp1.left + grp1.width / 2;
        const pin1Y = pin1.top + grp1.top + grp1.height / 2;
        const pin2X = pin2.left + grp2.left + grp2.width / 2;
        const pin2Y = pin2.top + grp2.top + grp2.height / 2;

        let points = [{ x: pin1X, y: pin1Y }];

        if (pin1.side === "top" && pin2.side === "top") {
            if (pin1Y < pin2Y) {
                points.push({ x: pin1X, y: pin1Y - 50 });
                points.push({ x: pin2X, y: pin1Y - 50 });
            } else {
                points.push({ x: pin1X, y: pin2Y - 50 });
                points.push({ x: pin2X, y: pin2Y - 50 });
            }
        } else if (pin1.side === "bottom" && pin2.side === "bottom") {
            if (pin1Y > pin2Y) {
                points.push({ x: pin1X, y: pin1Y + 50 });
                points.push({ x: pin2X, y: pin1Y + 50 });
            } else {
                points.push({ x: pin1X, y: pin2Y + 50 });
                points.push({ x: pin2X, y: pin2Y + 50 });
            }
        } else if (pin1.side === "left" && pin2.side === "left") {
            if (pin1X < pin2X) {
                points.push({ x: pin1X - 50, y: pin1Y });
                points.push({ x: pin1X - 50, y: pin2Y });
            } else {
                points.push({ x: pin2X - 50, y: pin1Y });
                points.push({ x: pin2X - 50, y: pin2Y });
            }
        } else if (pin1.side === "right" && pin2.side === "right") {
            if (pin1X > pin2X) {
                points.push({ x: pin1X + 50, y: pin1Y });
                points.push({ x: pin1X + 50, y: pin2Y });
            } else {
                points.push({ x: pin2X + 50, y: pin1Y });
                points.push({ x: pin2X + 50, y: pin2Y });
            }
        } else if (pin1.side === "top" && pin2.side === "bottom") {
            if (pin1Y > pin2Y) {
                points.push({ x: pin1X, y: (pin1Y + pin2Y) / 2 });
                points.push({ x: pin2X, y: (pin1Y + pin2Y) / 2 });
            } else {
                points.push({ x: pin1X, y: pin1Y - 50 });
                if (pin1X < pin2X) {
                    points.push({ x: pin2X + 100, y: pin1Y - 50 });
                    points.push({ x: pin2X + 100, y: pin2Y + 50 });
                } else {
                    points.push({ x: pin2X - 100, y: pin1Y - 50 });
                    points.push({ x: pin2X - 100, y: pin2Y + 50 });
                }
                points.push({ x: pin2X, y: pin2Y + 50 });
            }
        } else if (pin1.side === "bottom" && pin2.side === "top") {
            if (pin1Y < pin2Y) {
                points.push({ x: pin1X, y: (pin1Y + pin2Y) / 2 });
                points.push({ x: pin2X, y: (pin1Y + pin2Y) / 2 });
            } else {
                points.push({ x: pin1X, y: pin1Y + 50 });
                if (pin1X > pin2X) {
                    points.push({ x: pin2X - 100, y: pin1Y + 50 });
                    points.push({ x: pin2X - 100, y: pin2Y - 50 });
                } else {
                    points.push({ x: pin2X + 100, y: pin1Y + 50 });
                    points.push({ x: pin2X + 100, y: pin2Y - 50 });
                }
                points.push({ x: pin2X, y: pin2Y - 50 });
            }
        } else if (pin1.side === "left" && pin2.side === "right") {
            if (pin1X > pin2X) {
                points.push({ x: (pin1X + pin2X) / 2, y: pin1Y });
                points.push({ x: (pin1X + pin2X) / 2, y: pin2Y });
            } else {
                points.push({ x: pin1X - 100, y: pin1Y });
                if (pin1Y < pin2Y) {
                    points.push({ x: pin1X - 100, y: pin2Y + 50 });
                    points.push({ x: pin2X + 100, y: pin2Y + 50 });
                } else {
                    points.push({ x: pin1X - 100, y: pin2Y - 50 });
                    points.push({ x: pin2X + 100, y: pin2Y - 50 });
                }
                points.push({ x: pin2X + 100, y: pin2Y });
            }
        } else if (pin1.side === "right" && pin2.side === "left") {
            if (pin1X < pin2X) {
                points.push({ x: (pin1X + pin2X) / 2, y: pin1Y });
                points.push({ x: (pin1X + pin2X) / 2, y: pin2Y });
            } else {
                points.push({ x: pin1X + 100, y: pin1Y });
                if (pin1X > pin2X) {
                    points.push({ x: pin1X + 100, y: pin2Y - 50 });
                    points.push({ x: pin2X - 100, y: pin2Y - 50 });
                } else {
                    points.push({ x: pin1X + 100, y: pin2Y + 50 });
                    points.push({ x: pin2X - 100, y: pin2Y + 50 });
                }
                points.push({ x: pin2X - 100, y: pin2Y });
            }
        }

        points.push({ x: pin2X, y: pin2Y });
        return points;
    }

    const drawLineBetweenPins = (canvasInstance, pin1, grp1, pin2, grp2) => {
        const points = computePoints(pin1, grp1, pin2, grp2);

        const line = new fabric.Polyline(points, {
            fill: '',
            stroke: 'red',
            strokeWidth: 1,
            selectable: false,
            evented: false
        });

        canvasInstance.add(line);
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
        const newpoints = computePoints(pin1, grp1, pin2, grp2);

        line.set({
            points: newpoints
        });

        line.setCoords();
        canvasInstance.requestRenderAll();
    }

    const deleteLineBetweenPins = (canvasInstance, srcPin, dstPin) => {
        let done = false;
        connections.current.forEach((connection, index) => {
            if ((connection.pin1 === srcPin && connection.pin2 === dstPin) || (connection.pin1 === dstPin && connection.pin2 === srcPin)) {
                canvasInstance.remove(connection.line);

                connections.current.splice(index, 1);
                canvasInstance.renderAll();

                console.log('Line removed between pins:', srcPin, dstPin);
                done = true;
            }
        });
        return done;
    };



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

        addGridToCanvas(canvas, 20);

        canvas.on('mouse:wheel', function (opt) {
            var delta = opt.e.deltaY;

            opt.e.preventDefault();
            opt.e.stopPropagation();

            var oldzoom = canvas.getZoom();
            let zoom = oldzoom * 0.999 ** delta;

            changeZoom(zoom, oldzoom, canvas);
        });

        let isCtrlPressed = false;

        window.addEventListener('keydown', function (e) {
            if (e.key === 'Control') {
                isCtrlPressed = true;
                // canvas.defaultCursor = 'grab';
            }
        });

        window.addEventListener('keyup', function (e) {
            if (e.key === 'Control') {
                isCtrlPressed = false;
                // canvas.defaultCursor = 'default';
            }
        });

        canvas.on('mouse:down', function (opt) {

            var evt = opt.e;
            //if (evt.ctrlKey === true) {
            if (isCtrlPressed) {
                this.isDragging = true;
                this.selection = false;
                this.lastPosX = evt.clientX;
                this.lastPosY = evt.clientY;
                // canvas.defaultCursor = 'grabbing';
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
                //   canvas.defaultCursor = 'grabbing';
            }
        });

        canvas.on('mouse:up', function () {
            // if (isCtrlPressed) {
            //     canvas.defaultCursor = 'grab';
            // } else {
            //     canvas.defaultCursor = 'default';
            // }
            this.isDragging = false;
            this.selection = true;
        });

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
        });

        vpt.current = canvas.viewportTransform;
        canvasRef.current = canvas;

        var rect = new fabric.Rect({
            left: -25,
            top: -25,
            fill: 'red',
            width: 50,
            height: 50
        });

        canvas.add(rect);
        canvas.renderAll();


        if (onCanvasReady) {
            onCanvasReady(canvas);
        }

        return () => {
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
                        visual: group
                    }

                    const compDef = compdef;

                    compDef.props.forEach((prop, index) => {
                        comp.props[`#${index + 1}`] = prop;
                    });

                    compDef.inpins.forEach((pin, index) => {
                        comp.pins[`@${index + 1}`] = null;
                    });

                    compDef.outpins.forEach((pin, index) => {
                        comp.pins[`$${index + 1}`] = null;
                    });

                    console.log(comp);
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


    function addGridToCanvas(canvas, gridSize) {
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

    return (
        <main className="workspace">
            <canvas id="canvas" ref={canvasRef}></canvas>
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