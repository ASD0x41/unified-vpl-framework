import './Workspace.css';
import { fabric } from 'fabric';
import { useEffect, useRef } from 'react';
import { generateGroupedComponent } from './Library';
import { useConnectionContext } from '../program-management/Manager.js';

export default function Workspace({ onCanvasReady, draggedComponent, libComps, setSelectedComponent }) {
    const canvasRef = useRef(null);
    const vpt = useRef(null);

    const {
        ObjectCounter,
        connections,
        components,
        expandableAreas,
        isConnecting,
        srcGroup,
        srcPin,
        dstGroup,
        dstPin,
        isDisconnecting
    } = useConnectionContext();

    const PIN_RADIUS = 20;

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
                isConnecting.current = false;
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

                        const done = deleteLineBetweenPins(canvasInstance, connections, srcPin.current, dstPin.current);
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
                isDisconnecting.current = false;
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
        } else if (pin1.side === "top" && pin2.side === "left") {
            if (pin1Y > pin2Y) {
                if (pin1X < pin2X) {
                    points.push({ x: pin1X, y: pin2Y });
                } else {
                    points.push({ x: pin1X, y: pin2Y - 75 });
                    points.push({ x: pin2X - 100, y: pin2Y - 75 });
                    points.push({ x: pin2X - 100, y: pin2Y });
                }
            } else {
                points.push({ x: pin1X, y: pin1Y - 50 });
                if (pin1X < pin2X) {
                    points.push({ x: pin1X - 100, y: pin1Y - 50 });
                    points.push({ x: pin1X - 100, y: pin2Y });
                } else {
                    points.push({ x: pin2X - 100, y: pin1Y - 50 });
                    points.push({ x: pin2X - 100, y: pin2Y });
                }
            }
        } else if (pin1.side === "left" && pin2.side === "top") {
            if (pin1Y < pin2Y) {
                if (pin1X > pin2X) {
                    points.push({ x: pin2X, y: pin1Y });
                } else {
                    points.push({ x: pin1X - 100, y: pin1Y });
                    points.push({ x: pin1X - 100, y: pin1Y - 75 });
                    points.push({ x: pin2X, y: pin1Y - 75 });
                }
            } else {
                points.push({ x: pin1X, y: pin1Y + 50 });
                if (pin1X > pin2X) {
                    points.push({ x: pin2X - 100, y: pin1Y });
                    points.push({ x: pin2X - 100, y: pin2Y - 50 });
                } else {
                    points.push({ x: pin1X - 100, y: pin1Y });
                    points.push({ x: pin1X - 100, y: pin2Y - 50 });
                }
                points.push({ x: pin2X, y: pin2Y - 50 });
            }
        } else if (pin1.side === "top" && pin2.side === "right") {
            if (pin1Y > pin2Y) {
                if (pin1X > pin2X) {
                    points.push({ x: pin1X, y: pin2Y });
                } else {
                    points.push({ x: pin1X, y: pin2Y - 75 });
                    points.push({ x: pin2X + 100, y: pin2Y - 75 });
                    points.push({ x: pin2X + 100, y: pin2Y });
                }
            } else {
                points.push({ x: pin1X, y: pin1Y - 50 });
                if (pin1X < pin2X) {
                    points.push({ x: pin2X + 100, y: pin1Y - 50 });
                    points.push({ x: pin2X + 100, y: pin2Y });
                } else {
                    points.push({ x: pin1X + 100, y: pin1Y - 50 });
                    points.push({ x: pin1X + 100, y: pin2Y });
                }
            }
        } else if (pin1.side === "right" && pin2.side === "top") {
            if (pin1Y < pin2Y) {
                if (pin1X < pin2X) {
                    points.push({ x: pin2X, y: pin1Y });
                } else {
                    points.push({ x: pin1X + 100, y: pin1Y });
                    points.push({ x: pin1X + 100, y: pin1Y - 75 });
                    points.push({ x: pin2X, y: pin1Y - 75 });
                }
            } else {
                if (pin1X < pin2X) {
                    points.push({ x: pin2X + 100, y: pin1Y });
                    points.push({ x: pin2X + 100, y: pin2Y - 50 });
                } else {
                    points.push({ x: pin1X + 100, y: pin1Y });
                    points.push({ x: pin1X + 100, y: pin2Y - 50 });
                }
                points.push({ x: pin2X, y: pin2Y - 50 });
            }
        } else if (pin1.side === "bottom" && pin2.side === "left") {
            if (pin1Y < pin2Y) {
                if (pin1X < pin2X) {
                    points.push({ x: pin1X, y: pin2Y });
                } else {
                    points.push({ x: pin1X, y: pin2Y + 75 });
                    points.push({ x: pin2X - 100, y: pin2Y + 75 });
                    points.push({ x: pin2X - 100, y: pin2Y });
                }
            } else {
                points.push({ x: pin1X, y: pin1Y + 50 });
                if (pin1X < pin2X) {
                    points.push({ x: pin1X - 100, y: pin1Y + 50 });
                    points.push({ x: pin1X - 100, y: pin2Y });
                } else {
                    points.push({ x: pin2X - 100, y: pin1Y + 50 });
                    points.push({ x: pin2X - 100, y: pin2Y });
                }
            }
        } else if (pin1.side === "left" && pin2.side === "bottom") {
            if (pin1Y > pin2Y) {
                if (pin1X > pin2X) {
                    points.push({ x: pin2X, y: pin1Y });
                } else {
                    points.push({ x: pin1X - 100, y: pin1Y });
                    points.push({ x: pin1X - 100, y: pin1Y + 75 });
                    points.push({ x: pin2X, y: pin1Y + 75 });
                }
            } else {
                if (pin1X > pin2X) {
                    points.push({ x: pin2X - 100, y: pin1Y });
                    points.push({ x: pin2X - 100, y: pin2Y + 50 });
                } else {
                    points.push({ x: pin1X - 100, y: pin1Y });
                    points.push({ x: pin1X - 100, y: pin2Y + 50 });
                }
                points.push({ x: pin2X, y: pin2Y + 50 });
            }
        }

        points.push({ x: pin2X, y: pin2Y });
        return points;
    }

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
        console.log(line);
    };

    const updateLinePosition = (canvasInstance, pin1, grp1, pin2, grp2, line) => {
        const points = computePoints(pin1, grp1, pin2, grp2);

        line.set({
            points: points
        });

        line.setCoords();
        canvasInstance.renderAll();
    }


    const canvas_vp_count = 9;

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

                const allObjects = canvas.getObjects();
                allObjects.forEach(object => {
                    object.setCoords();
                });

                canvas.renderAll();
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

            movingObject.getObjects().forEach((obj) => {
                if (obj.type === 'group') {
                    const pins = obj.getObjects().filter(obj => obj.type === 'circle' && obj.idx !== null);

                    connections.current.forEach((connection) => {
                        pins.forEach((pin) => {
                            if (connection.pin1 === pin || connection.pin2 === pin)
                                updateLinePosition(canvas, connection.pin1, connection.grp1, connection.pin2, connection.grp2, connection.line);
                        });
                    });
                }
            })
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

    /* const getCenterCoordinates = (component) => {
         // Extract properties from compdef
         const left = component.visual.left; // Assuming style contains left position
         const top = component.visual.top; // Assuming style contains top position
         const width = component.visual.width; // Assuming style contains width
         const height = component.visual.height; // Assuming style contains height
 
         // Calculate center coordinates
         const centerX = left + width / 2;
         const centerY = top + height / 2;
 
         return { centerX, centerY };
     };*/


    const insertInCavity = (cavity, IDToAdd) => {
        const cavGroup = components.current[cavity['ID']];
        const toAddGroup = components.current[IDToAdd];

        const newTop = cavGroup.visual.top + cavity['topright'][1];
        const newLeft = cavGroup.visual.left + cavity['bottomleft'][0];

        //aligning with cavity
        toAddGroup.visual.top = newTop;
        toAddGroup.visual.left = newLeft;

        // Adjust the width

        const widthAdj = (toAddGroup.visual.left + toAddGroup.visual.width) - (cavGroup.visual.left + cavGroup.visual.width);

        // Find the polygonangle within toAddGroup.visual
        const polygon = toAddGroup.visual.getObjects().find(obj => obj.type === 'polygon');
        const textObject = toAddGroup.visual.getObjects().find(obj => obj.type === 'text');
        // Adjust the type if necessary

        if (polygon) {

            let maxX = 0;
            polygon.points.forEach(point => {
                if (point.x > maxX) {
                    maxX = point.x;
                }
            })
            polygon.points.forEach(point => {
                if (point.x === maxX) {
                    point.x -= widthAdj
                }
            })



            polygon.setCoords(); // Update the object's coordinates


            // Calculate the new center position for the text
            const polygonBoundingRect = polygon.getBoundingRect();
            const newCenterX = polygonBoundingRect.left + polygonBoundingRect.width / 2;
            const newCenterY = polygonBoundingRect.top + polygonBoundingRect.height / 2;

            // Center the text object
            if (textObject) {
                textObject.set({
                    left: newCenterX - textObject.width / 2, // Center horizontally
                    top: newCenterY - textObject.height / 2 // Center vertically
                });
                textObject.setCoords(); // Update the text object's coordinates
            }

            toAddGroup.visual.setCoords(); // Update the group's coordinates


            // Render the canvas to reflect changes
            canvasRef.current.renderAll();
        } else {
            console.log("No polygon found in the group.");
        }
        const cavityPolygon = cavGroup.visual.getObjects().find(obj => obj.type === 'polygon');

        if (cavityPolygon) {
            cavityPolygon.points.forEach(point => {
                if (point.y >= cavity['bottomleft'][1]) {

                    point.y += toAddGroup.visual.height;

                }
            })
            let matchingPins = [];
            let maxY = -Infinity

            cavGroup.visual.getObjects().forEach(obj => {

                if (obj.type === 'circle') {
                    if (obj.top > maxY) {
                        maxY = obj.top
                    }
                }
            });
            cavGroup.visual.getObjects().forEach(obj => {

                if (obj.type === 'circle' && obj.top === maxY) {
                    matchingPins.push(obj)
                }
            });
            matchingPins.forEach(pin => {
                pin.top += toAddGroup.visual.height;
                pin.setCoords();
                pin.dirty = true;
            });
            cavityPolygon.dirty = true;
            cavityPolygon.setCoords();
            cavGroup.visual.dirty = true; // Mark the group as dirty
            cavGroup.visual.setCoords(); // Update group's coordinates
            canvasRef.current.requestRenderAll(); // Explicitly request render

        } else {
            console.log("cavPolygon not found!")
        }
        console.log(components.current);
        cavity['topright'][1] += toAddGroup.visual.height - 5 - 4;
        cavity['bottomleft'][1] += toAddGroup.visual.height - 5 - 4;

    }
    useEffect(() => {
        const canvasInstance = canvasRef.current;

        if (canvasInstance) {
            const handleDragOver = (e) => e.preventDefault();
            const handleDrop = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const pointer = canvasInstance.getPointer(e);
                const id = draggedComponent;
                const compdef = libComps[id];//contains expand-start

                if ('expand-start' in compdef) {
                    const expandInfo = {
                        ID: ObjectCounter.current + 1,
                        bottomleft: compdef['expand-start'][0],
                        topright: compdef['expand-start'][1]
                    }
                    expandableAreas.current.push(expandInfo);
                    console.log("Logging expandableAreas", expandableAreas);
                }

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
                    //console.log("logging group just added: ", comp);
                    //const centre = getCenterCoordinates(comp);
                    expandableAreas.current.forEach(cavity => {

                        if (cavity['ID'] !== comp['ID']) {
                            console.log("Checking if object has been dropped on a cavity", pointer);
                            const horBoundary = [components.current[cavity['ID']].visual.left + cavity['bottomleft'][0], components.current[cavity['ID']].visual.left + cavity['topright'][0]];

                            const verBoundary = [components.current[cavity['ID']].visual.top + cavity['topright'][1], components.current[cavity['ID']].visual.top + cavity['bottomleft'][1]]


                            if (pointer.x >= horBoundary[0] &&
                                pointer.x <= horBoundary[1] &&
                                pointer.y >= verBoundary[0] &&
                                pointer.y <= verBoundary[1]) {
                                console.log("Trying to place in cavity")
                                insertInCavity(cavity, comp['ID']);
                            }
                        }
                    })
                    canvasInstance.add(comp.visual);
                    //console.log("Logging all current groups:", components.current);
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

export function deleteLineBetweenPins(canvasInstance, connections, srcPin, dstPin) {
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