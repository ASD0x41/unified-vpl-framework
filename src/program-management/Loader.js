export function Loader() {

    const LoadLanguage = (json, loadComponents) => {
        const validity = validateLanguageFile(json)
        if (validity.valid !== true)
            return validity

        const Json = JSON.parse(json);
        const comps = Json["components"];

        loadComponents({});
    
        comps.forEach(component => {
            const id = component.id;
            loadComponents(prevComponents => ({
                ...prevComponents,
                [id]: component
            }));
        });

        //console.log("comps loaded");

        return { name: Json["name"], type: Json["type"] };
    };

    return { LoadLanguage };
};

function validateLanguageDefinition(json) {
  const errors = [];
  
  // Check top-level structure
  if (!json.name || typeof json.name !== 'string') {
    errors.push('Missing or invalid "name" field - must be a string');
  }
  
  if (!json.type || typeof json.type !== 'string') {
    errors.push('Missing or invalid "type" field - must be a string');
  }
  
  if (!json.version || typeof json.version !== 'string') {
    errors.push('Missing or invalid "version" field - must be a string');
  }
  
  if (!Array.isArray(json.components)) {
    errors.push('Missing or invalid "components" field - must be an array');
  } else {
    // Validate each component
    json.components.forEach((component, index) => {
      const componentErrors = validateComponent(component);
      if (componentErrors.length > 0) {
        errors.push(`Component at index ${index} has errors: ${componentErrors.join('; ')}`);
      }
    });
  }
  
  return errors;
}

function validateComponent(component) {
  const errors = [];
  
  // Check required fields
  if (!component.id || typeof component.id !== 'string') {
    errors.push('Missing or invalid "id" field - must be a string');
  }
  
  // Validate style
  if (!component.style || typeof component.style !== 'object') {
    errors.push('Missing or invalid "style" field - must be an object');
  } else {
    const styleErrors = validateStyle(component.style);
    if (styleErrors.length > 0) {
      errors.push(`Style has errors: ${styleErrors.join('; ')}`);
    }
  }
  
  // Validate text array
  if (!Array.isArray(component.text)) {
    errors.push('Missing or invalid "text" field - must be an array');
  } else {
    component.text.forEach((text, index) => {
      const textErrors = validateText(text);
      if (textErrors.length > 0) {
        errors.push(`Text at index ${index} has errors: ${textErrors.join('; ')}`);
      }
    });
  }
  
  // Validate dimensions
  if (!Array.isArray(component.dimensions) || component.dimensions.length !== 2 || 
      typeof component.dimensions[0] !== 'number' || typeof component.dimensions[1] !== 'number') {
    errors.push('Invalid "dimensions" field - must be an array of 2 numbers');
  }
  
  // Validate inpins
  if (!Array.isArray(component.inpins)) {
    errors.push('Missing or invalid "inpins" field - must be an array');
  } else {
    component.inpins.forEach((pin, index) => {
      const pinErrors = validatePin(pin);
      if (pinErrors.length > 0) {
        errors.push(`Input pin at index ${index} has errors: ${pinErrors.join('; ')}`);
      }
    });
  }
  
  // Validate outpins
  if (!Array.isArray(component.outpins)) {
    errors.push('Missing or invalid "outpins" field - must be an array');
  } else {
    component.outpins.forEach((pin, index) => {
      const pinErrors = validatePin(pin);
      if (pinErrors.length > 0) {
        errors.push(`Output pin at index ${index} has errors: ${pinErrors.join('; ')}`);
      }
    });
  }
  
  // Validate props
  if (!Array.isArray(component.props)) {
    errors.push('Missing or invalid "props" field - must be an array');
  } else {
    component.props.forEach((prop, index) => {
      if (typeof prop !== 'string' && prop !== null) {
        errors.push(`Prop at index ${index} must be a string or null`);
      }
    });
  }
  
  // Code field is mandatory
  if (typeof component.code !== 'string') {
    errors.push('Missing or invalid "code" field - must be a string');
  }
  
  return errors;
}

function validateStyle(style) {
  const errors = [];
  
  if (!style.type || typeof style.type !== 'string') {
    errors.push('Missing or invalid "type" field in style - must be a string');
    return errors; // Can't validate further without knowing the type
  }
  
  // Common positional properties validation for most shapes
  function validateCommonProperties(style) {
    const commonErrors = [];
    
    if (style.left !== undefined && typeof style.left !== 'number') {
      commonErrors.push(`${style.type} style "left" property must be a number`);
    }
    
    if (style.top !== undefined && typeof style.top !== 'number') {
      commonErrors.push(`${style.type} style "top" property must be a number`);
    }
    
    if (style.angle !== undefined && typeof style.angle !== 'number') {
      commonErrors.push(`${style.type} style "angle" property must be a number`);
    }
    
    if (style.scaleX !== undefined && typeof style.scaleX !== 'number') {
      commonErrors.push(`${style.type} style "scaleX" property must be a number`);
    }
    
    if (style.scaleY !== undefined && typeof style.scaleY !== 'number') {
      commonErrors.push(`${style.type} style "scaleY" property must be a number`);
    }
    
    if (style.opacity !== undefined && (typeof style.opacity !== 'number' || style.opacity < 0 || style.opacity > 1)) {
      commonErrors.push(`${style.type} style "opacity" property must be a number between 0 and 1`);
    }
    
    if (style.visible !== undefined && typeof style.visible !== 'boolean') {
      commonErrors.push(`${style.type} style "visible" property must be a boolean`);
    }
    
    if (style.backgroundColor !== undefined && typeof style.backgroundColor !== 'string') {
      commonErrors.push(`${style.type} style "backgroundColor" property must be a string`);
    }
    
    if (style.flipX !== undefined && typeof style.flipX !== 'boolean') {
      commonErrors.push(`${style.type} style "flipX" property must be a boolean`);
    }
    
    if (style.flipY !== undefined && typeof style.flipY !== 'boolean') {
      commonErrors.push(`${style.type} style "flipY" property must be a boolean`);
    }
    
    if (style.stroke !== undefined && typeof style.stroke !== 'string') {
      commonErrors.push(`${style.type} style "stroke" property must be a string`);
    }
    
    if (style.strokeWidth !== undefined && typeof style.strokeWidth !== 'number') {
      commonErrors.push(`${style.type} style "strokeWidth" property must be a number`);
    }
    
    if (style.strokeDashArray !== undefined && !Array.isArray(style.strokeDashArray)) {
      commonErrors.push(`${style.type} style "strokeDashArray" property must be an array`);
    }
    
    if (style.strokeLineCap !== undefined && 
        !['butt', 'round', 'square'].includes(style.strokeLineCap)) {
      commonErrors.push(`${style.type} style "strokeLineCap" property must be one of: butt, round, square`);
    }
    
    if (style.strokeLineJoin !== undefined && 
        !['miter', 'round', 'bevel'].includes(style.strokeLineJoin)) {
      commonErrors.push(`${style.type} style "strokeLineJoin" property must be one of: miter, round, bevel`);
    }
    
    if (style.strokeMiterLimit !== undefined && typeof style.strokeMiterLimit !== 'number') {
      commonErrors.push(`${style.type} style "strokeMiterLimit" property must be a number`);
    }
    
    if (style.shadow !== undefined && typeof style.shadow === 'object') {
      if (style.shadow.color !== undefined && typeof style.shadow.color !== 'string') {
        commonErrors.push(`${style.type} style shadow "color" property must be a string`);
      }
      
      if (style.shadow.blur !== undefined && typeof style.shadow.blur !== 'number') {
        commonErrors.push(`${style.type} style shadow "blur" property must be a number`);
      }
      
      if (style.shadow.offsetX !== undefined && typeof style.shadow.offsetX !== 'number') {
        commonErrors.push(`${style.type} style shadow "offsetX" property must be a number`);
      }
      
      if (style.shadow.offsetY !== undefined && typeof style.shadow.offsetY !== 'number') {
        commonErrors.push(`${style.type} style shadow "offsetY" property must be a number`);
      }
    } else if (style.shadow !== undefined && typeof style.shadow !== 'object') {
      commonErrors.push(`${style.type} style "shadow" property must be an object`);
    }
    
    return commonErrors;
  }
  
  // Validate based on shape type
  switch (style.type) {
    case 'circle':
      if (typeof style.radius !== 'number') {
        errors.push('Circle style missing required "radius" property (number)');
      }
      
      if (typeof style.fill !== 'string') {
        errors.push('Circle style missing required "fill" property (string)');
      }
      
      errors.push(...validateCommonProperties(style));
      break;
      
    case 'rect':
      if (style.width !== undefined && typeof style.width !== 'number') {
        errors.push('Rectangle style "width" property must be a number');
      }
      
      if (style.height !== undefined && typeof style.height !== 'number') {
        errors.push('Rectangle style "height" property must be a number');
      }
      
      if (typeof style.fill !== 'string') {
        errors.push('Rectangle style missing required "fill" property (string)');
      }
      
      if (style.rx !== undefined && typeof style.rx !== 'number') {
        errors.push('Rectangle style "rx" property (rounded corner) must be a number');
      }
      
      if (style.ry !== undefined && typeof style.ry !== 'number') {
        errors.push('Rectangle style "ry" property (rounded corner) must be a number');
      }
      
      errors.push(...validateCommonProperties(style));
      break;
      
    case 'triangle':
      if (style.width !== undefined && typeof style.width !== 'number') {
        errors.push('Triangle style "width" property must be a number');
      }
      
      if (style.height !== undefined && typeof style.height !== 'number') {
        errors.push('Triangle style "height" property must be a number');
      }
      
      if (typeof style.fill !== 'string') {
        errors.push('Triangle style missing required "fill" property (string)');
      }
      
      errors.push(...validateCommonProperties(style));
      break;
      
    case 'ellipse':
      if (typeof style.rx !== 'number') {
        errors.push('Ellipse style missing required "rx" property (number)');
      }
      
      if (typeof style.ry !== 'number') {
        errors.push('Ellipse style missing required "ry" property (number)');
      }
      
      if (typeof style.fill !== 'string') {
        errors.push('Ellipse style missing required "fill" property (string)');
      }
      
      errors.push(...validateCommonProperties(style));
      break;
      
    case 'line':
      if (!Array.isArray(style.points) || style.points.length !== 4) {
        errors.push('Line style missing required "points" property (array of 4 numbers [x1,y1,x2,y2])');
      } else {
        style.points.forEach((point, index) => {
          if (typeof point !== 'number') {
            errors.push(`Line point at index ${index} must be a number`);
          }
        });
      }
      
      if (style.stroke === undefined || typeof style.stroke !== 'string') {
        errors.push('Line style missing required "stroke" property (string)');
      }
      
      errors.push(...validateCommonProperties(style));
      break;
      
    case 'polyline':
      if (!Array.isArray(style.points)) {
        errors.push('Polyline style missing required "points" property (array)');
      } else {
        if (style.points.length % 2 !== 0) {
          errors.push('Polyline "points" array must contain an even number of elements (x,y pairs)');
        }
        
        style.points.forEach((point, index) => {
          if (typeof point !== 'number') {
            errors.push(`Polyline point at index ${index} must be a number`);
          }
        });
      }
      
      if (style.stroke === undefined || typeof style.stroke !== 'string') {
        errors.push('Polyline style missing required "stroke" property (string)');
      }
      
      errors.push(...validateCommonProperties(style));
      break;
      
    case 'polygon':
      if (!Array.isArray(style.points)) {
        errors.push('Polygon style missing required "points" property (array)');
      } else {
        // Check each point in the polygon
        style.points.forEach((point, index) => {
          if (!point || typeof point !== 'object') {
            errors.push(`Polygon point at index ${index} must be an object`);
          } else if (typeof point.x !== 'number' || typeof point.y !== 'number') {
            errors.push(`Polygon point at index ${index} must have numeric x and y coordinates`);
          }
        });
      }
      
      if (typeof style.fill !== 'string') {
        errors.push('Polygon style missing required "fill" property (string)');
      }
      
      errors.push(...validateCommonProperties(style));
      break;
      
    case 'path':
      if (typeof style.path !== 'string') {
        errors.push('Path style missing required "path" property (string in SVG path format)');
      }
      
      if (typeof style.fill !== 'string') {
        errors.push('Path style missing required "fill" property (string)');
      }
      
      errors.push(...validateCommonProperties(style));
      break;
      
    case 'group':
      if (!Array.isArray(style.objects)) {
        errors.push('Group style missing required "objects" property (array)');
      } else {
        // Validate each object in the group
        style.objects.forEach((obj, index) => {
          const objErrors = validateStyle(obj);
          if (objErrors.length > 0) {
            errors.push(`Group object at index ${index} has errors: ${objErrors.join('; ')}`);
          }
        });
      }
      
      errors.push(...validateCommonProperties(style));
      break;
      
    case 'image':
      if (typeof style.src !== 'string') {
        errors.push('Image style missing required "src" property (string)');
      }
      
      if (style.width !== undefined && typeof style.width !== 'number') {
        errors.push('Image style "width" property must be a number');
      }
      
      if (style.height !== undefined && typeof style.height !== 'number') {
        errors.push('Image style "height" property must be a number');
      }
      
      if (style.filters !== undefined && !Array.isArray(style.filters)) {
        errors.push('Image style "filters" property must be an array');
      }
      
      if (style.crossOrigin !== undefined && 
          !['', 'anonymous', 'use-credentials'].includes(style.crossOrigin)) {
        errors.push('Image style "crossOrigin" property must be one of: "", "anonymous", "use-credentials"');
      }
      
      errors.push(...validateCommonProperties(style));
      break;
      
    case 'textbox':
      if (typeof style.text !== 'string') {
        errors.push('Textbox style missing required "text" property (string)');
      }
      
      if (style.width !== undefined && typeof style.width !== 'number') {
        errors.push('Textbox style "width" property must be a number');
      }
      
      if (style.height !== undefined && typeof style.height !== 'number') {
        errors.push('Textbox style "height" property must be a number');
      }
      
      if (style.fontSize !== undefined && typeof style.fontSize !== 'number') {
        errors.push('Textbox style "fontSize" property must be a number');
      }
      
      if (style.fontFamily !== undefined && typeof style.fontFamily !== 'string') {
        errors.push('Textbox style "fontFamily" property must be a string');
      }
      
      if (style.textAlign !== undefined && 
          !['left', 'center', 'right', 'justify'].includes(style.textAlign)) {
        errors.push('Textbox style "textAlign" property must be one of: left, center, right, justify');
      }
      
      if (style.fontWeight !== undefined && 
          (typeof style.fontWeight !== 'string' && typeof style.fontWeight !== 'number')) {
        errors.push('Textbox style "fontWeight" property must be a string or number');
      }
      
      if (style.fontStyle !== undefined && 
          !['normal', 'italic', 'oblique'].includes(style.fontStyle)) {
        errors.push('Textbox style "fontStyle" property must be one of: normal, italic, oblique');
      }
      
      if (style.lineHeight !== undefined && typeof style.lineHeight !== 'number') {
        errors.push('Textbox style "lineHeight" property must be a number');
      }
      
      if (style.underline !== undefined && typeof style.underline !== 'boolean') {
        errors.push('Textbox style "underline" property must be a boolean');
      }
      
      if (style.overline !== undefined && typeof style.overline !== 'boolean') {
        errors.push('Textbox style "overline" property must be a boolean');
      }
      
      if (style.linethrough !== undefined && typeof style.linethrough !== 'boolean') {
        errors.push('Textbox style "linethrough" property must be a boolean');
      }
      
      if (typeof style.fill !== 'string') {
        errors.push('Textbox style missing required "fill" property (string)');
      }
      
      errors.push(...validateCommonProperties(style));
      break;
      
    default:
      errors.push(`Unsupported shape type: ${style.type}`);
  }
  
  return errors;
}

function validateText(text) {
  const errors = [];
  
  if (typeof text.content !== 'string') {
    errors.push('Text missing required "content" property (string)');
  }
  
  if (typeof text.fontSize !== 'number') {
    errors.push('Text missing required "fontSize" property (number)');
  }
  
  if (typeof text.fill !== 'string') {
    errors.push('Text missing required "fill" property (string)');
  }
  
  if (typeof text.textAlign !== 'string') {
    errors.push('Text missing required "textAlign" property (string)');
  }
  
  if (!Array.isArray(text.area) || text.area.length !== 2 || 
      !Array.isArray(text.area[0]) || text.area[0].length !== 2 ||
      !Array.isArray(text.area[1]) || text.area[1].length !== 2) {
    errors.push('Text "area" property must be an array of two arrays, each containing two numbers');
  } else {
    const [[x1, y1], [x2, y2]] = text.area;
    if (typeof x1 !== 'number' || typeof y1 !== 'number' || 
        typeof x2 !== 'number' || typeof y2 !== 'number') {
      errors.push('All coordinates in text "area" property must be numbers');
    }
  }
  
  // prop can be null
  if (text.prop !== null && typeof text.prop !== 'string') {
    errors.push('Text "prop" property must be a string or null');
  }
  
  return errors;
}

function validatePin(pin) {
  const errors = [];
  
  if (!Array.isArray(pin)) {
    errors.push('Pin must be an array');
    return errors;
  }
  
  // Pin should have at least 3 elements [x, y, side]
  if (pin.length < 3) {
    errors.push('Pin must have at least 3 elements [x, y, direction]');
    return errors;
  }
  
  // Validate x and y coordinates
  if (typeof pin[0] !== 'number' || typeof pin[1] !== 'number') {
    errors.push('Pin coordinates must be numbers');
  }
  
  // Validate direction
  const validDirections = ['top', 'bottom', 'left', 'right'];
  if (!validDirections.includes(pin[2])) {
    errors.push(`Invalid pin direction: "${pin[2]}". Must be one of: ${validDirections.join(', ')}`);
  }
  
  // If there's a 4th element, it should be a number
  if (pin.length >= 4 && typeof pin[3] !== 'number') {
    errors.push('Optional 4th pin element must be a number');
  }
  
  return errors;
}

function validateLanguageFile(jsonString) {
  try {
    const json = JSON.parse(jsonString);
    const validationErrors = validateLanguageDefinition(json);
    
    if (validationErrors.length === 0) {
      return {
        valid: true,
        message: `Valid language definition: "${json.name}" (${json.type}, v${json.version}) with ${json.components.length} components.`
      };
    } else {
      return {
        valid: false,
        errors: validationErrors
      };
    }
  } catch (e) {
    return {
      valid: false,
      errors: [`Failed to parse JSON: ${e.message}`]
    };
  }
}

// // Browser usage example
// if (typeof window !== 'undefined') {
//   window.validateLanguageFile = validateLanguageFile;
// }

// // Node.js usage example
// if (typeof module !== 'undefined') {
//   module.exports = {
//     validateLanguageDefinition,
//     validateComponent,
//     validateStyle,
//     validateText,
//     validatePin,
//     validateLanguageFile
//   };
// }
