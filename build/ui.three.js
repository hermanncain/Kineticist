/**
 * @author mrdoob / http://mrdoob.com/
 */

UI.Texture = function ( mapping ) {

	UI.Element.call( this );

	var scope = this;

	var dom = document.createElement( 'span' );

	var form = document.createElement( 'form' );

	var input = document.createElement( 'input' );
	input.type = 'file';
	input.addEventListener( 'change', function ( event ) {

		loadFile( event.target.files[ 0 ] );

	} );
	form.appendChild( input );

	var canvas = document.createElement( 'canvas' );
	canvas.width = 32;
	canvas.height = 16;
	canvas.style.cursor = 'pointer';
	// canvas.style.marginRight = '5px';
	canvas.style.border = '1px solid #888';
	canvas.addEventListener( 'click', function ( event ) {

		input.click();

	}, false );
	canvas.addEventListener( 'drop', function ( event ) {

		event.preventDefault();
		event.stopPropagation();
		loadFile( event.dataTransfer.files[ 0 ] );

	}, false );
	dom.appendChild( canvas );

	// var name = document.createElement( 'input' );
	// name.disabled = true;
	// name.style.width = '64px';
	// name.style.border = '1px solid #ccc';
	// dom.appendChild( name );

	function loadFile( file ) {

		if ( file.type.match( 'image.*' ) ) {

			var reader = new FileReader();

			if ( file.type === 'image/targa' ) {

				reader.addEventListener( 'load', function ( event ) {

					var canvas = new THREE.TGALoader().parse( event.target.result );

					var texture = new THREE.CanvasTexture( canvas, mapping );
					texture.sourceFile = file.name;

					scope.setValue( texture );

					if ( scope.onChangeCallback ) scope.onChangeCallback();

				}, false );

				reader.readAsArrayBuffer( file );

			} else {

				reader.addEventListener( 'load', function ( event ) {

					var image = document.createElement( 'img' );
					image.addEventListener( 'load', function( event ) {

						var texture = new THREE.Texture( this, mapping );
						texture.sourceFile = file.name;
						texture.format = file.type === 'image/jpeg' ? THREE.RGBFormat : THREE.RGBAFormat;
						texture.needsUpdate = true;

						scope.setValue( texture );

						if ( scope.onChangeCallback ) scope.onChangeCallback();

					}, false );

					image.src = event.target.result;

				}, false );

				reader.readAsDataURL( file );

			}

		}

		form.reset();

	}

	this.dom = dom;
	this.texture = null;
	this.onChangeCallback = null;

	return this;

};

UI.Texture.prototype = Object.create( UI.Element.prototype );
UI.Texture.prototype.constructor = UI.Texture;

UI.Texture.prototype.getValue = function () {

	return this.texture;

};

UI.Texture.prototype.setValue = function ( texture ) {

	var canvas = this.dom.children[ 0 ];
	// var name = this.dom.children[ 1 ];
	var context = canvas.getContext( '2d' );

	if ( texture !== null ) {

		var image = texture.image;

		if ( image !== undefined && image.width > 0 ) {

			// name.value = texture.sourceFile;

			var scale = canvas.width / image.width;
			context.drawImage( image, 0, 0, image.width * scale, image.height * scale );

		} else {

			// name.value = texture.sourceFile + ' (error)';
			context.clearRect( 0, 0, canvas.width, canvas.height );

		}

	} else {

		// name.value = '';

		if ( context !== null ) {

			// Seems like context can be null if the canvas is not visible

			context.clearRect( 0, 0, canvas.width, canvas.height );

		}

	}

	this.texture = texture;

};

UI.Texture.prototype.onChange = function ( callback ) {

	this.onChangeCallback = callback;

	return this;

};

// Outliner

UI.Outliner = function ( editor ) {

	UI.Element.call( this );

	var scope = this;

	var dom = document.createElement( 'div' );
	dom.className = 'Outliner';
	dom.tabIndex = 0;	// keyup event is ignored without setting tabIndex

	// hack
	this.scene = editor.scene;

	// Prevent native scroll behavior
	dom.addEventListener( 'keydown', function ( event ) {

		switch ( event.keyCode ) {
			case 38: // up
			case 40: // down
				event.preventDefault();
				event.stopPropagation();
				break;
		}

	}, false );

	// Keybindings to support arrow navigation
	dom.addEventListener( 'keyup', function ( event ) {

		switch ( event.keyCode ) {
			case 38: // up
				scope.selectIndex( scope.selectedIndex - 1 );
				break;
			case 40: // down
				scope.selectIndex( scope.selectedIndex + 1 );
				break;
		}

	}, false );

	this.dom = dom;

	this.options = [];
	this.selectedIndex = - 1;
	this.selectedValue = null;

	return this;

};

UI.Outliner.prototype = Object.create( UI.Element.prototype );
UI.Outliner.prototype.constructor = UI.Outliner;

UI.Outliner.prototype.selectIndex = function ( index ) {

	if ( index >= 0 && index < this.options.length ) {

		this.setValue( this.options[ index ].value );

		var changeEvent = document.createEvent( 'HTMLEvents' );
		changeEvent.initEvent( 'change', true, true );
		this.dom.dispatchEvent( changeEvent );

	}

};

UI.Outliner.prototype.setOptions = function ( options ) {

	var scope = this;

	while ( scope.dom.children.length > 0 ) {

		scope.dom.removeChild( scope.dom.firstChild );

	}

	function onClick() {

		scope.setValue( this.value );

		var changeEvent = document.createEvent( 'HTMLEvents' );
		changeEvent.initEvent( 'change', true, true );
		scope.dom.dispatchEvent( changeEvent );

	}

	// Drag

	var currentDrag;

	function onDrag( event ) {

		currentDrag = this;

	}

	function onDragStart( event ) {

		event.dataTransfer.setData( 'text', 'foo' );

	}

	function onDragOver( event ) {

		if ( this === currentDrag ) return;

		var area = event.offsetY / this.clientHeight;

		if ( area < 0.25 ) {

			this.className = 'option dragTop';

		} else if ( area > 0.75 ) {

			this.className = 'option dragBottom';

		} else {

			this.className = 'option drag';

		}

	}

	function onDragLeave() {

		if ( this === currentDrag ) return;

		this.className = 'option';

	}

	function onDrop( event ) {

		if ( this === currentDrag ) return;

		this.className = 'option';

		var scene = scope.scene;
		var object = scene.getObjectById( currentDrag.value );

		var area = event.offsetY / this.clientHeight;

		if ( area < 0.25 ) {

			var nextObject = scene.getObjectById( this.value );
			moveObject( object, nextObject.parent, nextObject );

		} else if ( area > 0.75 ) {

			var nextObject = scene.getObjectById( this.nextSibling.value );
			moveObject( object, nextObject.parent, nextObject );

		} else {

			var parentObject = scene.getObjectById( this.value );
			moveObject( object, parentObject );

		}

	}

	function moveObject( object, newParent, nextObject ) {

		if ( nextObject === null ) nextObject = undefined;

		var newParentIsChild = false;

		object.traverse( function ( child ) {

			if ( child === newParent ) newParentIsChild = true;

		} );

		if ( newParentIsChild ) return;

		editor.execute( new MoveObjectCommand( object, newParent, nextObject ) );

		var changeEvent = document.createEvent( 'HTMLEvents' );
		changeEvent.initEvent( 'change', true, true );
		scope.dom.dispatchEvent( changeEvent );

	}

	//

	scope.options = [];

	for ( var i = 0; i < options.length; i ++ ) {

		var div = options[ i ];
		div.className = 'option';
		scope.dom.appendChild( div );

		scope.options.push( div );

		div.addEventListener( 'click', onClick, false );

		if ( div.draggable === true ) {

			div.addEventListener( 'drag', onDrag, false );
			div.addEventListener( 'dragstart', onDragStart, false ); // Firefox needs this

			div.addEventListener( 'dragover', onDragOver, false );
			div.addEventListener( 'dragleave', onDragLeave, false );
			div.addEventListener( 'drop', onDrop, false );

		}


	}

	return scope;

};

UI.Outliner.prototype.getValue = function () {

	return this.selectedValue;

};

UI.Outliner.prototype.setValue = function ( value ) {

	for ( var i = 0; i < this.options.length; i ++ ) {

		var element = this.options[ i ];

		if ( element.value === value ) {

			element.classList.add( 'active' );

			// scroll into view

			var y = element.offsetTop - this.dom.offsetTop;
			var bottomY = y + element.offsetHeight;
			var minScroll = bottomY - this.dom.offsetHeight;

			if ( this.dom.scrollTop > y ) {

				this.dom.scrollTop = y;

			} else if ( this.dom.scrollTop < minScroll ) {

				this.dom.scrollTop = minScroll;

			}

			this.selectedIndex = i;

		} else {

			element.classList.remove( 'active' );

		}

	}

	this.selectedValue = value;

	return this;

};

UI.THREE = {};

UI.THREE.Boolean = function ( boolean, text ) {

	UI.Span.call( this );

	this.setMarginRight( '10px' );

	this.checkbox = new UI.Checkbox( boolean );
	this.text = new UI.Text( text ).setMarginLeft( '3px' );

	this.add( this.checkbox );
	this.add( this.text );

};

UI.THREE.Boolean.prototype = Object.create( UI.Span.prototype );
UI.THREE.Boolean.prototype.constructor = UI.THREE.Boolean;

UI.THREE.Boolean.prototype.getValue = function () {

	return this.checkbox.getValue();

};

UI.THREE.Boolean.prototype.setValue = function ( value ) {

	return this.checkbox.setValue( value );

};

// spline controller
UI.SplineController = function ( xRange=1, yRange=1, hasNegative=false, y0=0, y1=0, curveType='cubic') {

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
	this.canvas.width = 120;
    this.canvas.height = 50;
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