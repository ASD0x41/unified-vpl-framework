import './MenuBar.css';
import { fabric } from 'fabric';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFile, faFolderOpen, faSave, faArrows, faSearchPlus, faSearchMinus,
    faTrashAlt, faLink, faBan, faUpload, faDownload, faEdit, faCode, faPlay
} from '@fortawesome/free-solid-svg-icons';

import { changeZoom } from './Workspace';

export default function MenuBar({ clearConsole, canvas, loadComponents }) {



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
            canvas.current.remove(activeObject);
        }
    }

    const saveComponent = () => {
        const activeObject = canvas.current.getActiveObject();
        if (!activeObject) {
            alert('Please select an object to save.');
            return;
        }

        const json = JSON.stringify(activeObject.toObject());

        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'selected-object.json';
        link.click();

        // Clean up
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
                loadComponents(json);
            } catch (error) {
                console.error('Error loading components from JSON:', error);
            }
        };

        reader.readAsText(file);
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
                <button className="icon-button" title="Connect Objects" id="connect-btn">
                    <FontAwesomeIcon icon={faLink} />
                </button>
                <button className="icon-button" title="Disconnect Objects">
                    <FontAwesomeIcon icon={faBan} />
                </button>

                <input type="file" id="load-file" style={{ display: 'none' }} onChange={handleLoadComponents} />
                <button className="icon-button" title="Load Components" id="load-btn" onClick={() => document.getElementById('load-file').click()}>
                    <FontAwesomeIcon icon={faUpload} />
                </button>
                <button className="icon-button" title="Unload Components" id="save-btn" onClick={saveComponent}>
                    <FontAwesomeIcon icon={faDownload} />
                </button>

                <button className="icon-button" title="Clear Console" id="clear-console" onClick={clearConsole}>
                    <FontAwesomeIcon icon={faEdit} />
                </button>
                <button className="icon-button" title="Compile & Download Code">
                    <FontAwesomeIcon icon={faCode} />
                </button>
                <button className="icon-button" title="Compile & Execute Code">
                    <FontAwesomeIcon icon={faPlay} />
                </button>
            </div>
        </aside>
    );
}
