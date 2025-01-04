import './Workspace.css';
import { fabric } from 'fabric';
import { useEffect, useRef } from 'react';

export default function Workspace({ onCanvasReady, draggedComponent, clearDrag }) {
    const canvasRef = useRef(null);
    const vpt = useRef(null);

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
                const jsonSpec = draggedComponent;

                if (jsonSpec) {
                    const parsedObject = JSON.parse(jsonSpec);
                    fabric.util.enlivenObjects([parsedObject], (objects) => {
                        const group = new fabric.Group(objects, {
                            left: pointer.x,
                            top: pointer.y,
                        });
                        canvasInstance.add(group);
                    });
                    clearDrag(null);
                }
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
                opacity: gridOpacity
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
                opacity: gridOpacity
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