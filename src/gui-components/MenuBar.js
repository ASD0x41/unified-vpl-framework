import './MenuBar.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFile, faFolderOpen, faSave, faArrows, faSearchPlus, faSearchMinus, 
  faTrashAlt, faLink, faBan, faUpload, faDownload, faEdit, faCode, faPlay 
} from '@fortawesome/free-solid-svg-icons';

export default function MenuBar({ clearConsole }) {
    return (
        <aside className="menu-bar">
            <div className="button-container">

                <button className="icon-button" title="New Program" id="new-canvas">
                    <FontAwesomeIcon icon={faFile} />
                </button>
                <input type="file" id="canvas-file" style={{ display: 'none' }} />
                <button className="icon-button" title="Open Program" id="open-canvas">
                    <FontAwesomeIcon icon={faFolderOpen} />
                </button>
                <button className="icon-button" title="Save Program" id="save-canvas">
                    <FontAwesomeIcon icon={faSave} />
                </button>

                <button className="icon-button" title="Go To Center" id="back-center">
                    <FontAwesomeIcon icon={faArrows} />
                </button>
                <button className="icon-button" title="Zoom In" id="zoom-in">
                    <FontAwesomeIcon icon={faSearchPlus} />
                </button>
                <button className="icon-button" title="Zoom Out" id="zoom-out">
                    <FontAwesomeIcon icon={faSearchMinus} />
                </button>

                <button className="icon-button" title="Delete Object" id="del-obj">
                    <FontAwesomeIcon icon={faTrashAlt} />
                </button>
                <button className="icon-button" title="Connect Objects" id="connect-btn">
                    <FontAwesomeIcon icon={faLink} />
                </button>
                <button className="icon-button" title="Disconnect Objects">
                    <FontAwesomeIcon icon={faBan} />
                </button>

                <input type="file" id="load-file" style={{ display: 'none' }} />
                <button className="icon-button" title="Load Components" id="load-btn">
                    <FontAwesomeIcon icon={faUpload} />
                </button>
                <button className="icon-button" title="Unload Components" id="save-btn">
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
