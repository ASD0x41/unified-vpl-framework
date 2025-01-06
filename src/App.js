import './App.css';
import { fabric } from 'fabric';
import { useState, useRef, useCallback } from 'react';

import Header from './gui-components/Header.js'
import MenuBar from './gui-components/MenuBar.js'
import Workspace from './gui-components/Workspace.js'
import Library from './gui-components/Library.js'
import Console from './gui-components/Console.js'
import Panel from './gui-components/Panel.js'

import { Loader } from './program-management/Loader.js';
import { Manager } from './program-management/Manager.js';

function App() {
  const { LoadLanguage } = Loader();
  const [lang, setLang] = useState({name: 'DataLang', type: 'dataflow'});
  const [libExtension, setLibExtension] = useState(false);
  const [logMessages, setLogMessages] = useState([]);

  // Flowchart:
  //const [libraryComponents, setLibraryComponents] = useState({ "main": { "id": "main", "label": "Start", "style": { "type": "rect", "left": 0, "top": 0, "width": 100, "height": 50, "fill": "black" }, "text": { "content": "Start", "fontSize": 14, "fill": "white", "textAlign": "center", "area": [[0, 0], [100, 50]] }, "dimensions": [100, 50], "inpins": [], "outpins": [[50, 50, "bottom"]], "props": [], "code": "$1" }, "input": { "id": "input", "label": "Read", "style": { "type": "rect", "left": 0, "top": 0, "width": 100, "height": 50, "fill": "blue" }, "text": { "content": "User Input", "fontSize": 14, "fill": "white", "textAlign": "center", "area": [[0, 0], [100, 50]] }, "dimensions": [100, 50], "inpins": [[50, 0, "top"]], "outpins": [[50, 50, "bottom"]], "props": ["varname", "prompt"], "code": "#1 = input(#2)\n$1" }, "output": { "id": "output", "label": "Write", "style": { "type": "rect", "left": 0, "top": 0, "width": 100, "height": 50, "fill": "green" }, "text": { "content": "Output", "fontSize": 14, "fill": "white", "textAlign": "center", "area": [[0, 0], [100, 50]] }, "dimensions": [100, 50], "inpins": [[50, 0, "top"]], "outpins": [[50, 50, "bottom"]], "props": ["content"], "code": "print(#1)\n$1" }, "condition": { "id": "condition", "label": "If-Else", "style": { "type": "polygon", "points": [{ "x": 50, "y": 0 }, { "x": 100, "y": 50 }, { "x": 50, "y": 100 }, { "x": 0, "y": 50 }], "left": 0, "top": 0, "width": 100, "height": 100, "fill": "red" }, "text": { "content": "If-Else", "fontSize": 14, "fill": "black", "textAlign": "center", "area": [[0, 0], [100, 100]] }, "dimensions": [100, 100], "inpins": [[50, 0, "top"]], "outpins": [[0, 50, "left"], [100, 50, "right"]], "props": ["condition"], "code": "if #1:\n\t$1\nelse:\n\t$2" } });
  
  // Dataflow:
  const [libraryComponents, setLibraryComponents] = useState({ "input": { "id": "input", "label": "Read", "style": { "type": "circle", "left": 0, "top": 0, "radius": 25, "fill": "blue" }, "text": { "content": "Input", "fontSize": 14, "fill": "white", "textAlign": "center", "area": [[0, 0], [50, 50]] }, "dimensions": [50, 50], "inpins": [], "outpins": [[25, 50, "bottom"]], "props": ["prompt"], "code": "$1 = input(#1)" }, "output": { "id": "output", "label": "Write", "style": { "type": "circle", "left": 0, "top": 0, "radius": 25, "fill": "green" }, "text": { "content": "Output", "fontSize": 14, "fill": "white", "textAlign": "center", "area": [[0, 0], [50, 50]]}, "dimensions": [50, 50], "inpins": [[25, 0, "top"]], "outpins": [], "props": [], "code": "print(@1)" }, "literal": { "id": "literal", "label": "Const", "style": { "type": "rect", "left": 0, "top": 0, "width": 100, "height": 50, "fill": "purple" }, "text": { "content": "Constant", "fontSize": 14, "fill": "white", "textAlign": "center", "area": [[0, 0], [100, 50]] }, "dimensions": [100, 50], "inpins": [], "outpins": [[50, 50, "bottom"]], "props": ["value"], "code": "$1 = #1" }, "condition": { "id": "condition", "label": "If-Else", "style": { "type": "polygon", "points": [{ "x": 50, "y": 0 }, { "x": 100, "y": 50 }, { "x": 50, "y": 100 }, { "x": 0, "y": 50 }], "left": 0, "top": 0, "width": 100, "height": 100, "fill": "red" }, "text": { "content": "Selector", "fontSize": 14, "fill": "black", "textAlign": "center", "area": [[0, 0], [100, 100]] }, "dimensions": [100, 100], "inpins": [[50, 0, "top"], [0, 50, "left"], [100, 50, "right"]], "outpins": [[50, 100, "bottom"]], "props": [], "code": "if @1:\n\t$1 = @2\nelse:\n\t$1 = @3" }, "equality": { "id": "equality", "label": "IsEqual?", "style": { "type": "polygon", "points": [{ "x": 25, "y": 0 }, { "x": 50, "y": 25 }, { "x": 25, "y": 50 }, { "x": 0, "y": 25 }], "left": 0, "top": 0, "width": 50, "height": 50, "fill": "red" }, "text": { "content": "==", "fontSize": 14, "fill": "black", "textAlign": "center", "area": [[0, 0], [50, 50]]}, "dimensions": [50, 50], "inpins": [[0, 25, "left"], [50, 25, "right"]], "outpins": [[25, 50, "bottom"]], "props": [], "code": "$1 = @1 == @2" } });

  const [draggedComponent, setDraggedComponent] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [canvasProps, setCanvasProps] = useState({
    vpWidth: 800,
    vpHeight: 600,
    vptx: 0,
    vpty: 0,
    zmx: 1,
    zmy: 1,
    centerX: 0,
    centerY: 0,
    clntx: 0,
    clnty: 0
  });
  const canvasRef = useRef(null);

  const handleCanvasReady = useCallback((canvasInstance) => {
    canvasInstance.on('mouse:move', function (opt) {
      var evt = opt.e;
      var vpt = canvasInstance.viewportTransform;
      var centerX = vpt[4] - canvasInstance.getWidth() / 2;
      var centerY = vpt[5] - canvasInstance.getHeight() / 2;

      setCanvasProps({
        vpWidth: canvasInstance.getWidth(),
        vpHeight: canvasInstance.getHeight(),
        vptx: vpt[4],
        vpty: vpt[5],
        zmx: vpt[0],
        zmy: vpt[3],
        centerX,
        centerY,
        clntx: evt.clientX,
        clnty: evt.clientY
      });
    });

    fabric.Group.prototype.toObject = (function (toObject) {
      return function () {
        return fabric.util.object.extend(toObject.call(this), {
          id: this.id || null,
          ID: this.ID || null
        });
      };
    })(fabric.Group.prototype.toObject);

    fabric.Group.prototype.stateProperties.push('id');
    fabric.Group.prototype.stateProperties.push('ID');

    fabric.Circle.prototype.toObject = (function (toObject) {
      return function () {
        return fabric.util.object.extend(toObject.call(this), {
          idx: this.idx || null,
          side: this.side || null
        });
      };
    })(fabric.Circle.prototype.toObject);

    fabric.Circle.prototype.stateProperties.push('idx');
    fabric.Circle.prototype.stateProperties.push('side');

    canvasRef.current = canvasInstance;
  }, []);

  const clearConsole = () => {
    setLogMessages([]);
  };

  const loadVisualLang = (json) => {
    const loadedLang = LoadLanguage(json, setLibraryComponents);
    setLang(loadedLang);
  };

  return (
    <Manager>
      <div className="App">
        <Header />
        <MenuBar clearConsole={clearConsole} canvas={canvasRef} loadComponents={loadVisualLang} setSelectedComponent={setSelectedComponent} lang={lang} libComps={libraryComponents} />
        <Workspace onCanvasReady={handleCanvasReady} draggedComponent={draggedComponent} libComps={libraryComponents} setSelectedComponent={setSelectedComponent} lang={lang} />
        <Library libLevel={libExtension} libcomponents={libraryComponents} onDragStart={setDraggedComponent} />
        <Console logMessages={logMessages} setLogMessages={setLogMessages} />
        <Panel libLevel={libExtension} setLibLevel={setLibExtension} canvasProps={canvasProps} selectedComponent={selectedComponent} lang={lang} />
      </div>
    </Manager>
  );
}

export default App;
