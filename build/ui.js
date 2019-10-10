/**
 * @author mrdoob / http://mrdoob.com/
 */

var UI = {};

UI.Element = function ( dom ) {

	this.dom = dom;

};

UI.Element.prototype = {

	add: function () {

		for ( var i = 0; i < arguments.length; i ++ ) {

			var argument = arguments[ i ];

			if ( argument instanceof UI.Element ) {

				this.dom.appendChild( argument.dom );

			} else {

				console.error( 'UI.Element:', argument, 'is not an instance of UI.Element.' );

			}

		}

		return this;

	},

	remove: function () {

		for ( var i = 0; i < arguments.length; i ++ ) {

			var argument = arguments[ i ];

			if ( argument instanceof UI.Element ) {

				this.dom.removeChild( argument.dom );

			} else {

				console.error( 'UI.Element:', argument, 'is not an instance of UI.Element.' );

			}

		}

		return this;

	},

	clear: function () {

		while ( this.dom.children.length ) {

			this.dom.removeChild( this.dom.lastChild );

		}

	},

	setId: function ( id ) {

		this.dom.id = id;

		return this;

	},

	setClass: function ( name ) {

		this.dom.className = name;

		return this;

	},

	setStyle: function ( style, array ) {

		for ( var i = 0; i < array.length; i ++ ) {

			this.dom.style[ style ] = array[ i ];

		}

		return this;

	},

	setDisabled: function ( value ) {

		this.dom.disabled = value;

		return this;

	},

	setTextContent: function ( value ) {

		this.dom.textContent = value;

		return this;

	}

};

// properties

var properties = [ 'position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'border', 'borderLeft',
'borderTop', 'borderRight', 'borderBottom', 'borderColor', 'display', 'overflow', 'margin', 'marginLeft', 'marginTop', 'marginRight', 'marginBottom', 'padding', 'paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'color',
'background', 'backgroundColor', 'opacity', 'fontSize', 'fontWeight', 'textAlign', 'textDecoration', 'textTransform', 'cursor', 'zIndex' ];

properties.forEach( function ( property ) {

	var method = 'set' + property.substr( 0, 1 ).toUpperCase() + property.substr( 1, property.length );

	UI.Element.prototype[ method ] = function () {

		this.setStyle( property, arguments );

		return this;

	};

} );

// events

var events = [ 'KeyUp', 'KeyDown', 'MouseOver', 'MouseOut', 'Click', 'DblClick', 'Change' ];

events.forEach( function ( event ) {

	var method = 'on' + event;

	UI.Element.prototype[ method ] = function ( callback ) {

		this.dom.addEventListener( event.toLowerCase(), callback.bind( this ), false );

		return this;

	};

} );

// Span

UI.Span = function () {

	UI.Element.call( this );

	this.dom = document.createElement( 'span' );

	return this;

};

UI.Span.prototype = Object.create( UI.Element.prototype );
UI.Span.prototype.constructor = UI.Span;

// Div

UI.Div = function () {

	UI.Element.call( this );

	this.dom = document.createElement( 'div' );

	return this;

};

UI.Div.prototype = Object.create( UI.Element.prototype );
UI.Div.prototype.constructor = UI.Div;

// Row

UI.Row = function () {

	UI.Element.call( this );

	var dom = document.createElement( 'div' );
	dom.className = 'Row';

	this.dom = dom;

	return this;

};

UI.Row.prototype = Object.create( UI.Element.prototype );
UI.Row.prototype.constructor = UI.Row;

// Panel

UI.Panel = function () {

	UI.Element.call( this );

	var dom = document.createElement( 'div' );
	dom.className = 'Panel';

	this.dom = dom;

	return this;

};

UI.Panel.prototype = Object.create( UI.Element.prototype );
UI.Panel.prototype.constructor = UI.Panel;

// Text

UI.Text = function ( text ) {

	UI.Element.call( this );

	var dom = document.createElement( 'span' );
	dom.className = 'Text';
	dom.style.cursor = 'default';
	dom.style.display = 'inline-block';
	dom.style.verticalAlign = 'middle';

	this.dom = dom;
	this.setValue( text );

	return this;

};

UI.Text.prototype = Object.create( UI.Element.prototype );
UI.Text.prototype.constructor = UI.Text;

UI.Text.prototype.getValue = function () {

	return this.dom.textContent;

};

UI.Text.prototype.setValue = function ( value ) {

	if ( value !== undefined ) {

		this.dom.textContent = value;

	}

	return this;

};


// Input

UI.Input = function ( text ) {

	UI.Element.call( this );

	var scope = this;

	var dom = document.createElement( 'input' );
	dom.className = 'Input';
	dom.style.padding = '2px';
	dom.style.border = '1px solid transparent';

	dom.addEventListener( 'keydown', function ( event ) {

		event.stopPropagation();

	}, false );

	this.dom = dom;
	this.setValue( text );

	return this;

};

UI.Input.prototype = Object.create( UI.Element.prototype );
UI.Input.prototype.constructor = UI.Input;

UI.Input.prototype.getValue = function () {

	return this.dom.value;

};

UI.Input.prototype.setValue = function ( value ) {

	this.dom.value = value;

	return this;

};


// TextArea

UI.TextArea = function () {

	UI.Element.call( this );

	var scope = this;

	var dom = document.createElement( 'textarea' );
	dom.className = 'TextArea';
	dom.style.padding = '2px';
	dom.spellcheck = false;

	dom.addEventListener( 'keydown', function ( event ) {

		event.stopPropagation();

		if ( event.keyCode === 9 ) {

			event.preventDefault();

			var cursor = dom.selectionStart;

			dom.value = dom.value.substring( 0, cursor ) + '\t' + dom.value.substring( cursor );
			dom.selectionStart = cursor + 1;
			dom.selectionEnd = dom.selectionStart;

		}

	}, false );

	this.dom = dom;

	return this;

};

UI.TextArea.prototype = Object.create( UI.Element.prototype );
UI.TextArea.prototype.constructor = UI.TextArea;

UI.TextArea.prototype.getValue = function () {

	return this.dom.value;

};

UI.TextArea.prototype.setValue = function ( value ) {

	this.dom.value = value;

	return this;

};


// Select

UI.Select = function () {

	UI.Element.call( this );

	var scope = this;

	var dom = document.createElement( 'select' );
	dom.className = 'Select';
	dom.style.padding = '2px';

	this.dom = dom;

	return this;

};

UI.Select.prototype = Object.create( UI.Element.prototype );
UI.Select.prototype.constructor = UI.Select;

UI.Select.prototype.setMultiple = function ( boolean ) {

	this.dom.multiple = boolean;

	return this;

};

UI.Select.prototype.setOptions = function ( options ) {

	var selected = this.dom.value;

	while ( this.dom.children.length > 0 ) {

		this.dom.removeChild( this.dom.firstChild );

	}

	for ( var key in options ) {

		var option = document.createElement( 'option' );
		option.value = key;
		option.innerHTML = options[ key ];
		this.dom.appendChild( option );

	}

	this.dom.value = selected;

	return this;

};

UI.Select.prototype.getValue = function () {

	return this.dom.value;

};

UI.Select.prototype.setValue = function ( value ) {

	value = String( value );

	if ( this.dom.value !== value ) {

		this.dom.value = value;

	}

	return this;

};

// Checkbox

UI.Checkbox = function ( boolean ) {

	UI.Element.call( this );

	var scope = this;

	var dom = document.createElement( 'input' );
	dom.className = 'Checkbox';
	dom.type = 'checkbox';

	this.dom = dom;
	this.setValue( boolean );

	return this;

};

UI.Checkbox.prototype = Object.create( UI.Element.prototype );
UI.Checkbox.prototype.constructor = UI.Checkbox;

UI.Checkbox.prototype.getValue = function () {

	return this.dom.checked;

};

UI.Checkbox.prototype.setValue = function ( value ) {

	if ( value !== undefined ) {

		this.dom.checked = value;

	}

	return this;

};


// Color

UI.Color = function () {

	UI.Element.call( this );

	var scope = this;

	var dom = document.createElement( 'input' );
	dom.className = 'Color';
	dom.style.width = '64px';
	dom.style.height = '17px';
	dom.style.border = '0px';
	dom.style.padding = '2px';
	dom.style.backgroundColor = 'transparent';

	try {

		dom.type = 'color';
		dom.value = '#ffffff';

	} catch ( exception ) {}

	this.dom = dom;

	return this;

};

UI.Color.prototype = Object.create( UI.Element.prototype );
UI.Color.prototype.constructor = UI.Color;

UI.Color.prototype.getValue = function () {

	return this.dom.value;

};

UI.Color.prototype.getHexValue = function () {

	return parseInt( this.dom.value.substr( 1 ), 16 );

};

UI.Color.prototype.setValue = function ( value ) {

	this.dom.value = value;

	return this;

};

UI.Color.prototype.setHexValue = function ( hex ) {

	this.dom.value = '#' + ( '000000' + hex.toString( 16 ) ).slice( - 6 );

	return this;

};


// Number

UI.Number = function ( number ) {

	UI.Element.call( this );

	var scope = this;

	var dom = document.createElement( 'input' );
	dom.className = 'Number';
	dom.value = '0.00';

	dom.addEventListener( 'keydown', function ( event ) {

		event.stopPropagation();

		if ( event.keyCode === 13 ) dom.blur();

	}, false );

	this.value = 0;

	this.min = - Infinity;
	this.max = Infinity;

	this.precision = 2;
	this.step = 1;
	this.unit = '';

	this.dom = dom;

	this.setValue( number );

	var changeEvent = document.createEvent( 'HTMLEvents' );
	changeEvent.initEvent( 'change', true, true );

	var distance = 0;
	var onMouseDownValue = 0;

	var pointer = [ 0, 0 ];
	var prevPointer = [ 0, 0 ];

	function onMouseDown( event ) {

		event.preventDefault();

		distance = 0;

		onMouseDownValue = scope.value;

		prevPointer = [ event.clientX, event.clientY ];

		document.addEventListener( 'mousemove', onMouseMove, false );
		document.addEventListener( 'mouseup', onMouseUp, false );

	}

	function onMouseMove( event ) {

		var currentValue = scope.value;

		pointer = [ event.clientX, event.clientY ];

		distance += ( pointer[ 0 ] - prevPointer[ 0 ] ) - ( pointer[ 1 ] - prevPointer[ 1 ] );

		var value = onMouseDownValue + ( distance / ( event.shiftKey ? 5 : 50 ) ) * scope.step;
		value = Math.min( scope.max, Math.max( scope.min, value ) );

		if ( currentValue !== value ) {

			scope.setValue( value );
			dom.dispatchEvent( changeEvent );

		}

		prevPointer = [ event.clientX, event.clientY ];

	}

	function onMouseUp( event ) {

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		if ( Math.abs( distance ) < 2 ) {

			dom.focus();
			dom.select();

		}

	}

	function onChange( event ) {

		scope.setValue( dom.value );

	}

	function onFocus( event ) {

		dom.style.backgroundColor = '';
		dom.style.cursor = '';

	}

	function onBlur( event ) {

		dom.style.backgroundColor = 'transparent';
		dom.style.cursor = 'col-resize';

	}

	onBlur();

	dom.addEventListener( 'mousedown', onMouseDown, false );
	dom.addEventListener( 'change', onChange, false );
	dom.addEventListener( 'focus', onFocus, false );
	dom.addEventListener( 'blur', onBlur, false );

	return this;

};

UI.Number.prototype = Object.create( UI.Element.prototype );
UI.Number.prototype.constructor = UI.Number;

UI.Number.prototype.getValue = function () {

	return this.value;

};

UI.Number.prototype.setValue = function ( value ) {

	if ( value !== undefined ) {

		value = parseFloat( value );

		if ( value < this.min ) value = this.min;
		if ( value > this.max ) value = this.max;

		this.value = value;
		this.dom.value = value.toFixed( this.precision );

		if ( this.unit !== '' ) this.dom.value += ' ' + this.unit;

	}

	return this;

};

UI.Number.prototype.setPrecision = function ( precision ) {

	this.precision = precision;

	return this;

};

UI.Number.prototype.setStep = function ( step ) {

	this.step = step;

	return this;

};

UI.Number.prototype.setRange = function ( min, max ) {

	this.min = min;
	this.max = max;

	return this;

};

UI.Number.prototype.setUnit = function ( unit ) {

	this.unit = unit;

	return this;

};

// Integer

UI.Integer = function ( number ) {

	UI.Element.call( this );

	var scope = this;

	var dom = document.createElement( 'input' );
	dom.className = 'Number';
	dom.value = '0';

	dom.addEventListener( 'keydown', function ( event ) {

		event.stopPropagation();

	}, false );

	this.value = 0;

	this.min = - Infinity;
	this.max = Infinity;

	this.step = 1;

	this.dom = dom;

	this.setValue( number );

	var changeEvent = document.createEvent( 'HTMLEvents' );
	changeEvent.initEvent( 'change', true, true );

	var distance = 0;
	var onMouseDownValue = 0;

	var pointer = [ 0, 0 ];
	var prevPointer = [ 0, 0 ];

	function onMouseDown( event ) {

		event.preventDefault();

		distance = 0;

		onMouseDownValue = scope.value;

		prevPointer = [ event.clientX, event.clientY ];

		document.addEventListener( 'mousemove', onMouseMove, false );
		document.addEventListener( 'mouseup', onMouseUp, false );

	}

	function onMouseMove( event ) {

		var currentValue = scope.value;

		pointer = [ event.clientX, event.clientY ];

		distance += ( pointer[ 0 ] - prevPointer[ 0 ] ) - ( pointer[ 1 ] - prevPointer[ 1 ] );

		var value = onMouseDownValue + ( distance / ( event.shiftKey ? 5 : 50 ) ) * scope.step;
		value = Math.min( scope.max, Math.max( scope.min, value ) ) | 0;

		if ( currentValue !== value ) {

			scope.setValue( value );
			dom.dispatchEvent( changeEvent );

		}

		prevPointer = [ event.clientX, event.clientY ];

	}

	function onMouseUp( event ) {

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		if ( Math.abs( distance ) < 2 ) {

			dom.focus();
			dom.select();

		}

	}

	function onChange( event ) {

		scope.setValue( dom.value );

	}

	function onFocus( event ) {

		dom.style.backgroundColor = '';
		dom.style.cursor = '';

	}

	function onBlur( event ) {

		dom.style.backgroundColor = 'transparent';
		dom.style.cursor = 'col-resize';

	}

	onBlur();

	dom.addEventListener( 'mousedown', onMouseDown, false );
	dom.addEventListener( 'change', onChange, false );
	dom.addEventListener( 'focus', onFocus, false );
	dom.addEventListener( 'blur', onBlur, false );

	return this;

};

UI.Integer.prototype = Object.create( UI.Element.prototype );
UI.Integer.prototype.constructor = UI.Integer;

UI.Integer.prototype.getValue = function () {

	return this.value;

};

UI.Integer.prototype.setValue = function ( value ) {

	if ( value !== undefined ) {

		value = parseInt( value );

		this.value = value;
		this.dom.value = value;

	}

	return this;

};

UI.Integer.prototype.setStep = function ( step ) {
	
	this.step = parseInt( step ); 
	
	return this;

};

UI.Integer.prototype.setRange = function ( min, max ) {

	this.min = min;
	this.max = max;

	return this;

};


// Break

UI.Break = function () {

	UI.Element.call( this );

	var dom = document.createElement( 'br' );
	dom.className = 'Break';

	this.dom = dom;

	return this;

};

UI.Break.prototype = Object.create( UI.Element.prototype );
UI.Break.prototype.constructor = UI.Break;


// HorizontalRule

UI.HorizontalRule = function () {

	UI.Element.call( this );

	var dom = document.createElement( 'hr' );
	dom.className = 'HorizontalRule';

	this.dom = dom;

	return this;

};

UI.HorizontalRule.prototype = Object.create( UI.Element.prototype );
UI.HorizontalRule.prototype.constructor = UI.HorizontalRule;


// Button

UI.Button = function ( value ) {

	UI.Element.call( this );

	var dom = document.createElement( 'button' );
	dom.className = 'Button';

	this.dom = dom;
	this.dom.textContent = value;

	return this;

};

UI.Button.prototype = Object.create( UI.Element.prototype );
UI.Button.prototype.constructor = UI.Button;

UI.Button.prototype.setLabel = function ( value ) {

	this.dom.textContent = value;

	return this;

};


// Modal

UI.Modal = function ( value ) {

	var scope = this;

	var dom = document.createElement( 'div' );

	dom.style.position = 'absolute';
	dom.style.width = '100%';
	dom.style.height = '100%';
	dom.style.backgroundColor = 'rgba(0,0,0,0.5)';
	dom.style.display = 'none';
	dom.style.alignItems = 'center';
	dom.style.justifyContent = 'center';
	dom.addEventListener( 'click', function ( event ) {

		scope.hide();

	} );

	this.dom = dom;

	this.container = new UI.Panel();
	this.container.dom.style.width = '200px';
	this.container.dom.style.padding = '20px';
	this.container.dom.style.backgroundColor = '#ffffff';
	this.container.dom.style.boxShadow = '0px 5px 10px rgba(0,0,0,0.5)';

	this.add( this.container );

	return this;

};

UI.Modal.prototype = Object.create( UI.Element.prototype );
UI.Modal.prototype.constructor = UI.Modal;

UI.Modal.prototype.show = function ( content ) {

	this.container.clear();
	this.container.add( content );

	this.dom.style.display = 'flex';

	return this;

};

UI.Modal.prototype.hide = function () {

	this.dom.style.display = 'none';

	return this;

};

//Radio

UI.Radio = function ( value, label ) {

	UI.Element.call( this );

	var dom = document.createElement( 'input' );
	dom.className = 'Radio';
	dom.type = 'radio';
	this.label = label;
	this.dom = dom;
	this.setValue(value);
	
	return this;

};

UI.Radio.prototype = Object.create( UI.Element.prototype );
UI.Radio.prototype.constructor = UI.Radio;

UI.Radio.prototype.setValue = function (value=false) {
	this.dom.checked = value;
	return this;
};

UI.Radio.prototype.getValue = function () {
	return this.dom.checked;
};

// Canvas
// @author hermanncain
UI.Canvas = function (data,w=64,h=64) {

	UI.Element.call( this );

	var scope = this;

	var dom = document.createElement( 'div' );
	this.canvas = document.createElement( 'canvas' );
	this.canvas.width = w;
	this.canvas.height = h;
	this.canvas.style.cursor = 'pointer';
	this.canvas.style.border = '1px solid #888';
	this.canvas.style.marginLeft = '10px';
	dom.appendChild( this.canvas );
	if (data) {
		scope.setData(data);
	}

	this.dom = dom;
	return this;

};

UI.Canvas.prototype = Object.create( UI.Element.prototype );
UI.Canvas.prototype.constructor = UI.Canvas;

UI.Canvas.prototype.setData = function (data) {

	var canvas = this.canvas;
	var ctx = canvas.getContext('2d');
	// clear
	ctx.clearRect(0,0,canvas.width,canvas.height);
	ctx.beginPath();

	switch(data.type) {
		case 'ellipse':
				
			ctx.ellipse(canvas.width/2,canvas.width/2,canvas.width/2*data.ratio1,canvas.width/2*data.ratio2,0,0,Math.PI*2);
			ctx.strokeStyle="#f00";
			ctx.lineWidth=3;
			ctx.stroke();

		break;
		case 'spline':
		
		break;
	}
}

UI.Canvas.prototype.getData = function () {

}

/**
 * Spline Controller
 * @author hermanncain
 */

UI.SplineController = function ( xRange=1, yRange=1, hasNegative=false, y0=0, y1=0, w=120,h=50, curveType='cubic') {

	UI.Element.call( this );

    var scope = this;

    // data
    this.near = -1;
	this.drawPoints = [];
    this.xRange = xRange;
    this.yRange = yRange;
    this.hasNegative = hasNegative;
	this.curveType = curveType;
	if (hasNegative) {
		this.controlPoints = [[0,(y0/yRange+1)/2],[1,(y1/yRange+1)/2]];
		this.base = (y0/yRange+1)/2;
    } else {
		this.controlPoints = [[0,y0/yRange],[1,y0/yRange]];
		this.base = y0/yRange;
	}
    
    // canvas
    this.canvas = document.createElement( 'canvas' );
	this.canvas.width = w;
    this.canvas.height = h;
	this.canvas.style.cursor = 'crosshair';
    this.canvas.style.border = '1px solid #888';
    this.drawer = this.canvas.getContext("2d");
    this.drawer.lineWidth = 1;
	this.drawer.fillStyle = 'red';

	// Y labels
	var rangeRow = new UI.Row().setDisplay('inline-block').setWidth('30px').setHeight('50px').setMarginRight('5px');
	rangeRow.dom.style.verticalAlign='top';
	rangeRow.dom.style.textAlign='right';
	this.maxY = new UI.Text(yRange).setDisplay('block').setFontSize('12px').setMargin('0');
	this.minY = new UI.Text(0).setDisplay('block').setFontSize('12px').setMargin('0');
	this.baseY = new UI.Text(y0).setDisplay('block').setFontSize('12px').setMargin('0');
	let h1 = (this.yRange-y0)/this.yRange * this.canvas.height * 0.4;
	let h2 = (y0-this.minY.getValue())/this.yRange * this.canvas.height * 0.4;
	if (hasNegative) {
		this.minY.setValue(-yRange);
		h1 /= 2;
		h2 = (y0-this.minY.getValue())/this.yRange * this.canvas.height * 0.2;
	}
	rangeRow.add(this.maxY);
	rangeRow.add(new UI.Text('s').setColor('white').setDisplay('block').setHeight(h1+'px').setMargin('0'));
	rangeRow.add(this.baseY);
	rangeRow.add(new UI.Text('s').setColor('white').setDisplay('block').setHeight(h2+'px').setMargin('0'));
	rangeRow.add(this.minY);

	// dom
	var dom = document.createElement( 'div' );
	this.dom = dom;
	dom.appendChild( rangeRow.dom );
    dom.appendChild( this.canvas );

	// event
    this.down = false;
	this.canvas.addEventListener( 'click', function ( event ) {
        if (scope.canvas.style.cursor == 'pointer') return;
		event.preventDefault();
		var rect = scope.canvas.getBoundingClientRect();
		var x = (event.clientX - rect.left) / scope.canvas.width;
		var y = (rect.bottom - event.clientY) / scope.canvas.height;
        scope.addControlPoint([x,y]);
        scope.buildCurve(200);
        scope.draw();
    }, false );

    this.canvas.oncontextmenu = function (e) {
        e.preventDefault();
    }

    this.canvas.addEventListener( 'mousedown', function ( e ) {
        scope.down = true;
        if (e.button == 2) {
            if (scope.canvas.style.cursor == 'pointer') {
                if (scope.near) {
                    if (scope.near != 0 && scope.near != scope.controlPoints.length-1) {
                        scope.controlPoints.splice(scope.near,1);
                        scope.buildCurve(200);
                        scope.draw();
                    }
                }
            }
        }
    },false);

    this.canvas.addEventListener('mouseup',function (e) {
        scope.down = false;
    });

    this.canvas.addEventListener( 'mousemove', function ( event ) {

		var rect = scope.canvas.getBoundingClientRect();
        // var x = event.clientX - rect.left * (scope.canvas.width / rect.width);
		// var y = event.clientY - rect.top * (scope.canvas.height / rect.height);
		var x = (event.clientX - rect.left) / scope.canvas.width;
		var y = (rect.bottom - event.clientY) / scope.canvas.height;
        let position = [x,y];

        for (pt of scope.controlPoints) {
			let d2 = Math.sqrt((position[0]- pt[0])**2+(position[1] -pt[1])**2);
			if (d2<0.15) {
                scope.near = scope.controlPoints.indexOf(pt);
                break;
            } else {
                scope.near = -1;
            }
        }
        if (scope.near >=0) {
            scope.canvas.style.cursor = 'pointer';
        } else {
            scope.canvas.style.cursor = 'crosshair';
        }

        if (scope.near>=0 && scope.down) {
            let pt = [];
            if (scope.near == 0 || scope.near == scope.controlPoints.length-1) {
                pt = [scope.controlPoints[scope.near][0],y];
            } else {
                pt = [x,y];
            }
            scope.controlPoints[scope.near] = pt;
            scope.buildCurve(200);
            scope.draw();
        }
	}, false );

	// custom event
	this.drawEvent = new Event('draw');
	
    this.initialize();
	return this;

};

UI.SplineController.prototype = Object.create( UI.Element.prototype );
UI.SplineController.prototype.constructor = UI.SplineController;

// custom event handler
UI.SplineController.prototype.onDraw = function ( callback ) {

	this.dom.addEventListener( 'draw', callback.bind( this ), false );

	return this;

};

UI.SplineController.prototype.buildCurve = function (seg) {
    this.drawPoints = [];
    // genearte interpolations
    let xs = this.controlPoints.map(function(p){return p[0]});
    let ys = this.controlPoints.map(function(p){return p[1]});
    switch(this.curveType) {
        case 'linear':
            this.curve = new THREE.LinearInterpolant(xs,ys,1);
        break;
        case 'cubic':
            this.curve = new THREE.CubicInterpolant(xs,ys,1);
        break;
    }
    // get dense points for drawing
    for (let i=0;i<=seg;i++) {
        this.drawPoints.push([i/seg,this.getY(i/seg)]);
    }
};

UI.SplineController.prototype.getY = function (x) {
    return this.curve.evaluate(x)[0];
}

UI.SplineController.prototype.initialize = function (  ) {
    this.buildCurve(200);
    this.draw();
};

UI.SplineController.prototype.addControlPoint = function ( pt ) {
    for (let i=0;i<this.controlPoints.length-1;i++) {
		let d = Math.sqrt((this.controlPoints[i][0]- pt[0])**2+(this.controlPoints[i][1] -pt[1])**2);
		if (d>0.15) {
			if (this.controlPoints[i][0]<pt[0] && this.controlPoints[i+1][0]>pt[0]) {
				this.controlPoints.splice(i+1,0,pt);
				break;
			}
		}
    }
};

UI.SplineController.prototype.drawBaseline = function () {

	this.drawer.moveTo(0,this.canvas.height-this.base*this.canvas.height);
	this.drawer.lineTo(this.canvas.width,this.canvas.height-this.base*this.canvas.height);
	
    this.drawer.strokeStyle = 'gray';
    this.drawer.stroke();
    this.drawer.closePath();
};

UI.SplineController.prototype.drawControlPoints = function () {
    for (let pt of this.controlPoints) {
        this.drawer.beginPath();
        this.drawer.arc(pt[0]*this.canvas.width,this.canvas.height-pt[1]*this.canvas.height,3,0,Math.PI*2,true);
        this.drawer.fill();
    }  
};

UI.SplineController.prototype.drawCurve = function () {
    this.drawer.beginPath();
    this.drawer.strokeStyle = 'blue';
    for (let pt of this.drawPoints) {
        this.drawer.lineTo(pt[0]*this.canvas.width,this.canvas.height-pt[1]*this.canvas.height);
        this.drawer.stroke();
    }
    this.drawer.closePath();
};

UI.SplineController.prototype.draw = function () {
    // clear
    this.drawer.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.drawer.beginPath();

	// draw baseline
    this.drawBaseline();

    // draw lines
    this.drawCurve();

    // draw control points
	this.drawControlPoints();
	
	this.dom.dispatchEvent(this.drawEvent);
};

UI.SplineController.prototype.getValues = function (seg) {
    let r = [];
    for (let i = 0;i<=seg;i++) {
        let pCanvas = [i/seg,this.getY(i/seg)];
        let pn = [pCanvas[0]*this.xRange, pCanvas[1]*this.yRange];
        if (this.hasNegative) {
            pn[1] = 2*pn[1]-this.yRange;
        }
        r.push(pn);
    }
    return r;
};

UI.SplineController.prototype.getControls = function () {
	let controls = [];
	for (let pt of this.controlPoints) {
		let p = [pt[0]*this.xRange, pt[1]*this.yRange];
		if (this.hasNegative) {
            p[1] = 2*p[1]-this.yRange;
		}
		controls.push(p);
	}
    return controls;
};

UI.SplineController.prototype.setControls = function (pts) {
	this.controlPoints = [];
    for (pt of pts) {
		let canvasControl = [pt[0]/this.xRange,pt[1]/this.yRange];
        if (this.hasNegative) {
            canvasControl[1] = (canvasControl[1]+1)/2;
		}
		this.controlPoints.push(canvasControl);
	}
	this.buildCurve(200);
	this.draw();
};