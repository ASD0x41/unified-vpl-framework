import './Library.css';
import { fabric } from 'fabric';
import { useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faLandmarkFlag, faLanguage } from '@fortawesome/free-solid-svg-icons';

export default function Library({ libLevel, libcomponents, onDragStart, lang }) {
    const [collapse, setCollapse] = useState(false);



    const togglePanel = () => {
        setCollapse(prevCollapse => !prevCollapse);
    };

    return (
        <aside className="library" style={{ gridRow: libLevel ? '2 / 4' : '2 / 3', gridColumn: collapse ? '4 / 5' : '3 / 5' }}>
            <div className="module-title-bar">
                <button className="icon-button" id="toggle-panel" title={collapse ? "Show Panel" : "Hide Panel"} onClick={togglePanel}>
                    <FontAwesomeIcon icon={collapse ? faChevronLeft : faChevronRight} id="con-tog" />
                </button>
                <div id="library-title" style={{ writingMode: collapse ? 'vertical-rl' : 'horizontal-tb', marginLeft: collapse ? '5px' : '0px', fontWeight: collapse ? '600' : 'normal' }}>
                    Component Library</div>
            </div>
            {!collapse && (

                <div id="library-output">
                    {Object.entries(libcomponents).map(([id, obj], index) => {
                        let canvasWidth = obj.dimensions[0] + 10;
                        let canvasHeight = obj.dimensions[1] + 10;

                        const tempCanvas = new fabric.Canvas(null, {
                            width: canvasWidth,
                            height: canvasHeight,
                            backgroundColor: '#555'
                        });


                        let group = generateGroupedComponent(obj, lang);

                        tempCanvas.add(group);
                        tempCanvas.renderAll();

                        return (
                            <div key={index} className="visual">
                                <button className="image-button" draggable="true" onDragStart={(e) => onDragStart(id, e)}
                                    style={{
                                        backgroundSize: 'contain',
                                        backgroundRepeat: 'no-repeat',
                                        border: 'none',
                                        marginLeft: 'auto',
                                        marginRight: 'auto',
                                        width: canvasWidth + 'px',
                                        height: canvasHeight + 'px',
                                        display: 'block'
                                    }}>
                                    <img className="image-button" draggable="false"
                                        src={tempCanvas.toDataURL({ format: 'png', quality: 1.0 })} alt="">
                                    </img>
                                </button>
                            </div>
                        );
                    })}
                </div>


            )}
        </aside>
    );

}

export function generateGroupedComponent(obj, lang) {
    const style = obj.style;
    const textA = obj.text;
    const id = obj.id;

    let shapeObj;

    if (style.type === 'rect') {
        shapeObj = new fabric.Rect({
            left: style.left,
            top: style.top,
            width: style.width,
            height: style.height,
            fill: style.fill,
            stroke: 'black'
        });
    } else if (style.type === 'circle') {
        shapeObj = new fabric.Circle({
            left: style.left,
            top: style.top,
            radius: style.radius,
            fill: style.fill,
            stroke: 'black'
        });
    } else if (style.type === 'polygon') {
        const points = style.points.map(p => ({ x: p.x, y: p.y }));
        shapeObj = new fabric.Polygon(points, {
            fill: style.fill,
            stroke: 'black'
        });
    }

    const groupItems = [shapeObj];

    if (textA) {
        textA.forEach((text) => {
            const textObj = new fabric.Text(text.content, {
                fontSize: text.fontSize || 16,
                fill: text.fill || 'black',
                originX: 'center',
                originY: 'center',
                left: 0.5 * text.area[0][0] + 0.5 * text.area[1][0] || obj.dimensions[0] + 10 / 2,
                top: 0.5 * text.area[0][1] + 0.5 * text.area[1][1] || obj.dimensions[1] + 10 / 2,
                textAlign: text.textAlign || 'center'
            });
    
            groupItems.push(textObj);
        });
    }

    const createPins = (pins, color, type) => {
        return pins.map(([x, y, side], index) => {
            return new fabric.Circle({
                radius: 3,
                fill: color,
                left: x,
                top: y,
                selectable: false,
                originX: 'center',
                originY: 'center',
                stroke: 'black',
                strokeWidth: 1,
                idx: type === "in" ? `@${index + 1}` : `$${index + 1}`,
                side: side
            });
        });
    };

    const createBlockPins = (pins, color, type) => {
        return pins.map(([x, y, side, explvl], index) => {
            return new fabric.Circle({
                radius: 3,
                fill: color,
                opacity: 0,
                visible: false,
                left: x,
                top: y,
                selectable: false,
                originX: 'center',
                originY: 'center',
                stroke: 'none',
                idx: type === "in" ? `@${index + 1}` : `$${index + 1}`,
                side: [explvl, explvl]
            });
        });
    };

    if (lang.type === 'block') {
        const inPins = createBlockPins(obj.inpins, 'white', 'in');
        const outPins = createBlockPins(obj.outpins, 'white', 'out');
        groupItems.push(...inPins, ...outPins);
    } else {
        const inPins = createPins(obj.inpins, 'white', 'in');
        const outPins = createPins(obj.outpins, 'white', 'out');
        groupItems.push(...inPins, ...outPins);
    }

    const group = new fabric.Group(groupItems, {
        left: 0,
        top: 0
    });

    group.set('id', id);

    return group;
};
