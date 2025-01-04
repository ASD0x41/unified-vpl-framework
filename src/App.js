import './App.css';
import { useState, useRef } from 'react';

import Header from './gui-components/Header.js'
import MenuBar from './gui-components/MenuBar.js'
import Workspace from './gui-components/Workspace.js'
import Library from './gui-components/Library.js'
import Console from './gui-components/Console.js'
import Panel from './gui-components/Panel.js'

import { LoadLanguage } from './program-management/Loader.js';

function App() {
  const [libExtension, setLibExtension] = useState(false);
  const [logMessages, setLogMessages] = useState([]);
  const [libraryComponents, setLibraryComponents] = useState({});
  
  const [draggedComponent, setDraggedComponent] = useState(null);
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

  const handleCanvasReady = (canvasInstance) => {
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


    canvasRef.current = canvasInstance;
  };

  const clearConsole = () => {
    setLogMessages([]);
  };

  const loadVisualLang = (json) => {
    LoadLanguage(json, setLibraryComponents);
  };

  return (
    <div className="App">
      <Header />
      <MenuBar clearConsole={clearConsole}  canvas={canvasRef} loadComponents={loadVisualLang} />
      <Workspace onCanvasReady={handleCanvasReady} draggedComponent={draggedComponent} clearDrag={setDraggedComponent} />
      <Library libLevel={libExtension} components={libraryComponents} onDragStart={setDraggedComponent} />
      <Console logMessages={logMessages} setLogMessages={setLogMessages} />
      <Panel libLevel={libExtension} setLibLevel={setLibExtension} canvasProps={canvasProps} />
    </div>
  );
}

export default App;
