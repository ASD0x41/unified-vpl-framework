import './Workspace.css';
import { fabric } from 'fabric';
import { useEffect, useRef } from 'react';
import { generateGroupedComponent } from './Library';
import { useConnectionContext } from '../program-management/Manager.js';
import { computePoints } from '../program-management/Helper.js';
import { toast } from 'react-toastify';

export default function Workspace({ onCanvasReady, draggedComponent, libComps, setSelectedComponent, lang }) {
    const draggingBlock = useRef(false);
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
        isDisconnecting,
        forest
    } = useConnectionContext();

    const PIN_RADIUS = 30;

    const isNearPin = (pointer, pin, targetGroup, pinrad) => {
        const distance = Math.sqrt(
            Math.pow(pointer.x - (pin.left + targetGroup.left + targetGroup.width / 2), 2) + Math.pow(pointer.y - (pin.top + targetGroup.top + targetGroup.height / 2), 2)
        );
        return distance <= pinrad;
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
        // if (e.selected.length > 1) {
        //     // canvasRef.current.discardActiveObject();

        //     canvasRef.current.renderAll();
        // }

        //console.log("Hello")

        if (e.selected && e.selected !== undefined && isConnecting.current) {
            const canvasInstance = canvasRef.current;
            const pointer = canvasInstance.getPointer(e.e);
            const targetGroup = e.selected[0];

            if (!targetGroup) return;
            // const pins = targetGroup.getObjects().filter(obj => obj.type === 'circle' && obj.idx !== null);
            const pins = targetGroup.getObjects().filter(obj => obj.idx && (obj.idx[0] === '$' || obj.idx[0] === '@'));

            let clickedPin = null;

            for (let pin of pins) {
                if (isNearPin(pointer, pin, targetGroup, PIN_RADIUS)) {
                    clickedPin = pin;
                    break;
                }
            }

            canvasInstance.discardActiveObject()

            if (clickedPin) {
                // toast.error("clicked pin " + String(clickedPin.idx) + " of target " + String(targetGroup.ID))
                if (isConnecting.current && srcGroup.current && srcPin.current) {
                    if (components.current[targetGroup.ID] !== undefined && ((!components.current[targetGroup.ID].pins[clickedPin.idx]) || (lang.type === 'dataflow' && clickedPin.idx[0] === '$') || (lang.type === 'flowchart' && clickedPin.idx[0] === '@'))) {
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
                                toast.error("Connection must be between an input pin and an output pin! Select an appropriate pin.")
                            }
                        } else {
                            toast.error("Cannot connect input and output pins of the same component! Select an appropriate component.")
                        }
                    }
                    else {
                        toast.error("Pin is already in use. Select another pin.");
                    }
                } else {
                    if (components.current[targetGroup.ID] !== undefined && !components.current[targetGroup.ID].pins[clickedPin.idx]) {
                        srcGroup.current = targetGroup;
                        srcPin.current = clickedPin;
                        srcPin.current.set('fill', 'orange');
                        //console.log("Pin selected! Click on another group to connect pins.");
                    }
                    else if ((lang.type === 'dataflow' && clickedPin.idx[0] === '$') || (lang.type === 'flowchart' && clickedPin.idx[0] === '@')) {
                        srcGroup.current = targetGroup;
                        srcPin.current = clickedPin;
                        srcPin.current.set('fill', 'orange');
                    }
                    else {
                        toast.error("Pin is already in use. Select another pin.");
                    }
                }
            } else {
                toast.error("Please click near a pin to select it.");
                isConnecting.current = false;
                canvasInstance.hoverCursor = 'grab';
                if (srcPin.current) {
                    if (components.current[srcGroup.current.ID] !== undefined && !components.current[srcGroup.current.ID].pins[srcPin.current.idx]) {
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
                if (isNearPin(pointer, pin, targetGroup, PIN_RADIUS)) {
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
                            toast.error("There was no connection between the specified pins already.")
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
                        toast.error("Pin is already NOT in use. Select another pin.");
                    }
                } else {
                    if (components.current[targetGroup.ID].pins[clickedPin.idx]) {
                        srcGroup.current = targetGroup;
                        srcPin.current = clickedPin;
                        srcPin.current.set('fill', 'blue');
                        //console.log("Pin selected! Click on another group to disconnect pins.");
                    }
                    else {
                        toast.error("Pin is already NOT in use. Select another pin.");
                    }
                }
            } else {
                toast.error("Please click near a pin to select it.");
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

        // console.log("Pins connected!");
    };

    const updateLinePosition = (canvasInstance, pin1, grp1, pin2, grp2, line) => {
        // console.log("Hello!");
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
            borderColor: 'silver'
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

        let isCtrlPressed = true;

        window.addEventListener('keydown', function (e) {
            if (e.key === 'Control') {
                isCtrlPressed = true;
                // console.log("pressed")
                // canvas.defaultCursor = 'grab';
            }
        });

        window.addEventListener('keyup', function (e) {
            if (e.key === 'Control') {
                isCtrlPressed = false;
                // console.log("released")
                // canvas.defaultCursor = 'default';
            }
        });

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
            } else {
                draggingBlock.current = true;
                // canvas.bringToFront(canvas.getActiveObject());
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
            } else {
                if (draggingBlock.current === true) {
                    canvas.bringToFront(canvas.getActiveObject());
                }

            }
        });

        canvas.on('mouse:up', function () {
            this.isDragging = false;
            this.selection = true;

            if (draggingBlock.current) {
                blockDropped();
            }
            draggingBlock.current = false;
            canvas.sendBackwards(canvas.getActiveObject());
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
            
            
            if (lang.type !== 'block') {
                const pins = movingObject.getObjects().filter(obj => obj.type === 'circle' && obj.idx !== null);
                connections.current.forEach((connection) => {
                    pins.forEach((pin) => {
                        if (connection.pin1 === pin || connection.pin2 === pin)
                            updateLinePosition(canvas, connection.pin1, connection.grp1, connection.pin2, connection.grp2, connection.line);
                    });
                });

            } else {
                //console.log(movingObject);
                Object.keys(forest.current[movingObject.ID]).forEach((child) => {
                    components.current[child].visual.set({
                        left: movingObject.left + forest.current[movingObject.ID][child][0],
                        top: movingObject.top + forest.current[movingObject.ID][child][1]
                    });

                    components.current[child].visual.setCoords();
                });

                this.renderAll();
            }
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
    }, [lang]);

    const destroyTree = (blockID, parentID, exceptions) => {
        if ('@1' in components.current[parentID].pins && components.current[parentID].pins["@1"]) {
            destroyTree(blockID, components.current[parentID].pins["@1"][0][0], exceptions);
        }
        if (!exceptions.includes(parentID))
            delete forest.current[parentID][blockID];
    }

    const destroyLineOfTrees = (blockID, parentID, exceptions) => {
        exceptions.push(blockID);
        Object.keys(components.current[blockID].pins).forEach((pin) => {
            if (pin[0] === '$' && components.current[blockID].pins[pin]) {
                destroyLineOfTrees(components.current[blockID].pins[pin][0][0], blockID, exceptions);
            }
        });
        destroyTree(blockID, parentID, exceptions);
    }

    const iterTillTreeStart = (block, parent) => {
        while (parent) {
            let newRelativeCoords = [block.left - parent.left, block.top - parent.top];
            forest.current[parent.ID][block.ID] = [newRelativeCoords[0], newRelativeCoords[1]];
            parent = components.current[parent.ID].pins["@1"] ? components.current[components.current[parent.ID].pins["@1"][0][0]].visual : null;
        }
    }

    const addLineToTree = (block) => {
        const pins = block.getObjects().filter(obj => (obj.idx && obj.idx[0] === '$'));
        pins.forEach((pin) => {
            if (components.current[block.ID].pins[pin.idx]) {
                iterTillTreeStart(components.current[components.current[block.ID].pins[pin.idx][0][0]].visual, block);
                addLineToTree(components.current[components.current[block.ID].pins[pin.idx][0][0]].visual);
            }
        });
    }

    const snapWithChildren = (block, changeCoords) => {
        let newCoords = [block.left + changeCoords[0], block.top + changeCoords[1]];
        block.set({
            left: newCoords[0],
            top: newCoords[1]
        });
        block.setCoords();

        const pins = block.getObjects().filter(obj => (obj.idx && obj.idx[0] === '$'));
        pins.forEach((pin) => {
            if (components.current[block.ID].pins[pin.idx]) {
                snapWithChildren(components.current[components.current[block.ID].pins[pin.idx][0][0]].visual, changeCoords);
            }
        });
    }

    const computeTreeHeight = (block) => {
        let height = 0;
        let stepHeight = 0;

        height += libComps[block.id]['dimensions'][1];
        // console.log("block", block.ID, "dim:", height);
        block.getObjects().filter(obj => (obj.idx && obj.idx[0] === '$')).forEach((pin) => {
            if (pin.side[0] === 0) {
                if (components.current[block.ID].pins[pin.idx])
                    stepHeight = computeTreeHeight(components.current[components.current[block.ID].pins[pin.idx][0][0]].visual);
                    height += stepHeight;
                    // console.log("below",stepHeight);
            } else {
                height += pin.side[1] - pin.side[0];
                // console.log("step", pin.side[1] - pin.side[0])
            }
        });

        return height;
    }

    const contractionHandler = (canvas, droppedBlock, nearBlock, nearPin) => {
        if (nearBlock._objects[0].type === 'polygon' && nearPin.side[0] !== 0) {
            let Yext = computeTreeHeight(droppedBlock);
            let newSize = nearPin.side[1] - Yext;
            
            if (newSize > nearPin.side[0]) {
                Yext = newSize - nearPin.side[0];
            } else {
                Yext = newSize;
            }

            // console.log(nearPin.side[1], Yext, newSize);

            // console.log("cont handler: dropobj", droppedBlock.ID, "upperblc", nearBlock.ID, "side:", nearPin.side, "Yext", Yext);

            let newObj = JSON.parse(JSON.stringify(libComps[nearBlock.id]));
            const relativePinY = newObj['outpins'][nearPin.idx.slice(1) - 1][1];

            newObj["style"]["points"].forEach((point) => {
                if (point.y > relativePinY + 10) {
                    point.y += Yext;
                }
            });

            newObj["text"].forEach((text) => {
                if (text["area"][0][1] > relativePinY + 10) {
                    text["area"][0][1] += Yext;
                    text["area"][1][1] += Yext;
                }
            });

            newObj["outpins"].forEach((pin) => {
                if (pin[1] > relativePinY + 10) {
                    pin[1] += Yext;
                }
            });

            const newGroup = generateGroupedComponent(newObj, lang);
            newGroup.set({
                ID: nearBlock.ID,
                left: nearBlock.left,
                top: nearBlock.top
            })

            newGroup.getObjects().filter(obj => (obj.idx && obj.idx === nearPin.idx))[0].side[1] = Yext + nearPin.side[0];
            // console.log("newside1:", newGroup.getObjects().filter(obj => (obj.idx && obj.idx === nearPin.idx))[0].side[1])

            nearBlock.getObjects().filter(obj => obj.type === 'text').forEach((textObj) => {
                if (textObj.prop) {
                    const proptext = newGroup.getObjects().filter(newObj => (newObj.type === 'text' && newObj.prop === textObj.prop));
                    if (proptext.length !== 0) {
                        proptext[0].set('text', textObj.text);
                    }
                }
            });

            components.current[nearBlock.ID].visual = newGroup;

            

            canvas.remove(nearBlock);
            canvas.add(newGroup);
            newGroup.setCoords();

            let lastPin = null, maxID = 0;
            newGroup.getObjects().filter(obj => (obj.idx && obj.idx[0] === '$')).forEach((pin) => {
                if (parseInt(pin.idx.slice(1)) > maxID) {
                    lastPin = components.current[newGroup.ID].pins[pin.idx];
                }
            });

            if (lastPin) {
                snapWithChildren(components.current[lastPin[0][0]].visual, [0, Yext + nearPin.side[0] - nearPin.side[1]]);
                canvas.renderAll();

                iterTillTreeStart(components.current[lastPin[0][0]].visual, newGroup);
                addLineToTree(components.current[lastPin[0][0]].visual);
            }

            return newGroup;
        }

        return nearBlock;
    }

    const blockDropped = () => {
        if (lang.type === 'block') {
            const droppedBlock = canvasRef.current.getActiveObject();
            

            if (droppedBlock !== undefined) {
                const inpPin = droppedBlock.getObjects().filter(obj => (obj.idx && obj.idx[0] === '@' && obj.idx[1] === '1'))[0];
                if (inpPin) {
                    const inpPinCoords = { x: inpPin.left + droppedBlock.left + droppedBlock.width / 2, y: inpPin.top + droppedBlock.top + droppedBlock.height / 2 };
    
                    const canvas = canvasRef.current;
                    let otherBlocks = canvas._objects.slice(321);
    
                    if (components.current[droppedBlock.ID].pins["@1"] && components.current[components.current[droppedBlock.ID].pins["@1"][0][0]].pins[components.current[droppedBlock.ID].pins["@1"][0][1]] && components.current[components.current[droppedBlock.ID].pins["@1"][0][0]].pins[components.current[droppedBlock.ID].pins["@1"][0][1]][0][0] === droppedBlock.ID && components.current[components.current[droppedBlock.ID].pins["@1"][0][0]].pins[components.current[droppedBlock.ID].pins["@1"][0][1]][0][1] === "@1") {
                        //if (components.current[droppedBlock.ID].pins["@1"]) {
    
                        let parentBlock = components.current[components.current[droppedBlock.ID].pins["@1"][0][0]].visual;
                        let parentPin = parentBlock.getObjects().filter(obj => (obj.idx && obj.idx === components.current[droppedBlock.ID].pins["@1"][0][1]))[0];
    
                        if (!isNearPin(inpPinCoords, parentPin, parentBlock, 50)) {
    
                            let exceptions = [];
                            destroyLineOfTrees(droppedBlock.ID, parentBlock.ID, exceptions);
    
                            components.current[droppedBlock.ID].pins[inpPin.idx] = null;
                            components.current[parentBlock.ID].pins[parentPin.idx] = null;
    
                            let curBlock = contractionHandler(canvas, droppedBlock, parentBlock, parentPin);
                            if (components.current[curBlock.ID].pins["@1"]) {
                                let upBlock = components.current[components.current[curBlock.ID].pins["@1"][0][0]].visual;
                                let upPin = upBlock.getObjects().filter(obj => (obj.idx && obj.idx === components.current[curBlock.ID].pins["@1"][0][1]))[0];
                                // console.log("abc:", upBlock, upPin)
    
                                while (upBlock) {
                                    // console.log("conexp", curBlock.ID, upBlock.ID);
                                    curBlock = expansionHandler(canvas, curBlock, upBlock, upPin);
                                    if (components.current[curBlock.ID].pins["@1"]) {
                                        upBlock = components.current[components.current[curBlock.ID].pins["@1"][0][0]].visual;
                                        upPin = upBlock.getObjects().filter(obj => (obj.idx && obj.idx === components.current[curBlock.ID].pins["@1"][0][1]))[0];
                                    } else {
                                        upBlock = null;
                                        upPin = null;
                                    }
                                    
                                }
                            }
                            
                        } else {
                            Object.keys(forest.current[parentBlock.ID]).forEach((child) => {
                                components.current[child].visual.set({
                                    left: parentBlock.left + forest.current[parentBlock.ID][child][0],
                                    top: parentBlock.top + forest.current[parentBlock.ID][child][1]
                                });
            
                                components.current[child].visual.setCoords();
                            });
            
                            canvas.renderAll();
                        }
                    }
    
                    let nearPin = null;
                    let nearPinCoords = null;
                    let nearBlock = null;

                    otherBlocks = canvas._objects;   // investigate reindexing!!!
    
                    for (let otherblock of otherBlocks) {
                        if (otherblock.ID !== droppedBlock.ID) {
                            if (otherblock.type === 'group') {
                                let otherOutPins = otherblock.getObjects().filter(obj => (obj.idx && (obj.idx[0] === '$')));
    
                                for (let pin of otherOutPins) {
                                    if (isNearPin(inpPinCoords, pin, otherblock, 50) && !components.current[otherblock.ID].pins[pin.idx]) { // changed from 25
                                        nearPin = pin;
                                        nearBlock = otherblock;
                                        nearPinCoords = [pin.left + otherblock.left + otherblock.width / 2, pin.top + otherblock.top + otherblock.height / 2];
                                        break;
                                    }
                                }
                            }
                        }
    
                        if (nearPin)
                            break;
                    }
    
                    if (nearPin) {
                        components.current[droppedBlock.ID].pins[inpPin.idx] = [[nearBlock.ID, nearPin.idx]];
                        components.current[nearBlock.ID].pins[nearPin.idx] = [[droppedBlock.ID, inpPin.idx]];
    
                        let changeCoords = [nearPinCoords[0] - inpPinCoords.x, nearPinCoords[1] - inpPinCoords.y];
                        snapWithChildren(droppedBlock, changeCoords);
    
                        canvas.renderAll();
    
                        {
                            let upperBlock = nearBlock;
                            let currentBlock = droppedBlock;
                            let upperPin = nearPin;
    
                            while (upperBlock) {
                                // console.log("calling exp for:", currentBlock.ID, upperBlock.ID)
                                
                                currentBlock = expansionHandler(canvas, currentBlock, upperBlock, upperPin);;
                                if (components.current[currentBlock.ID].pins["@1"]) {
                                    upperBlock = components.current[components.current[currentBlock.ID].pins["@1"][0][0]].visual;
                                    upperPin = upperBlock.getObjects().filter(obj => (obj.idx && obj.idx === components.current[currentBlock.ID].pins["@1"][0][1]))[0];
                                } else {
                                    upperBlock = null;
                                    upperPin = null;
                                }
                                
                            }
    
                            // console.log(components.current);
                        }
    
                        canvas.renderAll()
    
                        let parent = nearBlock;
                        while (parent) {
                            let newRelativeCoords = [droppedBlock.left - parent.left, droppedBlock.top - parent.top];
                            forest.current[parent.ID][droppedBlock.ID] = [newRelativeCoords[0], newRelativeCoords[1]];
                            parent = components.current[parent.ID].pins["@1"] ? components.current[components.current[parent.ID].pins["@1"][0][0]].visual : null;
                        }
    
                        addLineToTree(droppedBlock);
                    }
    
                    // console.log(components.current);
                    // console.log(forest.current);
                }
            }
            
        }
    }

    const expansionHandler = (canvas, droppedBlock, nearBlock, nearPin) => {
        // console.log("exp handler:", droppedBlock, nearBlock._objects[0].type, nearPin)
        
        if (nearBlock._objects[0].type === 'polygon' && nearPin.side[0] !== 0) {
            let Yext = computeTreeHeight(droppedBlock);
            Yext = Yext - nearPin.side[0];

            // console.log("dropobj", droppedBlock.ID, "upperblc", nearBlock.ID, "side:", nearPin.side, "Yext", Yext);

            let newObj = JSON.parse(JSON.stringify(libComps[nearBlock.id]));
            const relativePinY = newObj['outpins'][nearPin.idx.slice(1) - 1][1];

            newObj["style"]["points"].forEach((point) => {
                if (point.y > relativePinY + 10) {
                    point.y += Yext;
                }
            });

            newObj["text"].forEach((text) => {
                if (text["area"][0][1] > relativePinY + 10) {
                    text["area"][0][1] += Yext;
                    text["area"][1][1] += Yext;
                }
            });

            newObj["outpins"].forEach((pin) => {
                if (pin[1] > relativePinY + 10) {
                    pin[1] += Yext;
                }
            });

            const newGroup = generateGroupedComponent(newObj, lang);
            newGroup.set({
                ID: nearBlock.ID,
                left: nearBlock.left,
                top: nearBlock.top
            })

            newGroup.getObjects().filter(obj => (obj.idx && obj.idx === nearPin.idx))[0].side[1] = Yext + nearPin.side[0];
            // console.log("newside1:", newGroup.getObjects().filter(obj => (obj.idx && obj.idx === nearPin.idx))[0].side[1])

            nearBlock.getObjects().filter(obj => obj.type === 'text').forEach((textObj) => {
                if (textObj.prop) {
                    const proptext = newGroup.getObjects().filter(newObj => (newObj.type === 'text' && newObj.prop === textObj.prop));
                    if (proptext.length !== 0) {
                        proptext[0].set('text', textObj.text);
                    }
                }
            });

            components.current[nearBlock.ID].visual = newGroup;

            

            canvas.remove(nearBlock);
            canvas.add(newGroup);
            newGroup.setCoords();

            let lastPin = null, maxID = 0;
            newGroup.getObjects().filter(obj => (obj.idx && obj.idx[0] === '$')).forEach((pin) => {
                if (parseInt(pin.idx.slice(1)) > maxID) {
                    lastPin = components.current[newGroup.ID].pins[pin.idx];
                }
            });

            if (lastPin) {
                snapWithChildren(components.current[lastPin[0][0]].visual, [0, Yext + nearPin.side[0] - nearPin.side[1]]);
                canvas.renderAll();

                iterTillTreeStart(components.current[lastPin[0][0]].visual, newGroup);
                addLineToTree(components.current[lastPin[0][0]].visual);
            }

            return newGroup;
        }

        return nearBlock;
    }

    useEffect(() => {
        const canvasInstance = canvasRef.current;

        if (canvasInstance) {
            const handleDragOver = (e) => e.preventDefault();
            const handleDrop = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const pointer = canvasInstance.getPointer(e);
                const id = draggedComponent[0];
                const compdef = libComps[id];

                const adjustedLeft = pointer.x - draggedComponent[1];
                const adjustedTop = pointer.y - draggedComponent[2];

                fabric.util.enlivenObjects([compdef], (objects) => {
                    const group = generateGroupedComponent(compdef, lang);

                    group.left = adjustedLeft;
                    group.top = adjustedTop;

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

                    components.current.push(comp)
                    forest.current[comp.ID] = {};

                    canvasInstance.add(comp.visual);
                    // console.log(canvasInstance._objects.slice(321))

                    if (lang.type === 'block')
                        canvasInstance.setActiveObject(comp.visual);
                });

                if (lang.type === 'block')
                    blockDropped();

                // console.log(components.current);
                // console.log(forest.current);
                // console.log(ObjectCounter.current);
                // console.log(connections.current);
                
                

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