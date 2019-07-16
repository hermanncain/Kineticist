/**
 * @author hermanncain
 */

var Viewport = function (sculptor) {

    var signals = sculptor.signals;

    var container = new UI.Panel();
	container.setId( 'viewport' );
    // container.setPosition( 'absolute' );

	var renderer = new THREE.WebGLRenderer( { antialias: true } );

	renderer.autoClear = false;
	renderer.autoUpdateScene = false;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( container.dom.offsetWidth, container.dom.offsetHeight );
	renderer.setClearColor( 0xffffff );
    container.dom.appendChild( renderer.domElement );

	var stats = new Stats();
	stats.dom.style.top='54px';
	stats.dom.style.left='184px';
	container.dom.appendChild( stats.dom );

	// var scene = sculptor.scenes.unitScene;
	var scene = sculptor.currentScene;
	var sceneHelpers = sculptor.sceneHelpers;
    var camera = sculptor.camera;
	var drawCanvas = sculptor.unitCanvas;
	var castObjects = [];

	if (scene.name == 'unitScene') {
		castObjects = sculptor.unit.skeleton.children;
	} else if (scene.name == 'sketchScene') {
		castObjects = sculptor.sketches;
	}

	// temporary sketch
	var tempSketch = null;
	var nearlyClosed = false;

    // basic transform controlled by mouse
	var objectPositionOnDown = null;
	var objectRotationOnDown = null;
	var objectScaleOnDown = null;

	var transformControls = new THREE.TransformControls( camera, container.dom );
	transformControls.setSpace('local');
    transformControls.addEventListener( 'change', function () {

		var object = transformControls.object;

		if ( object !== undefined ) {
			
			// translate key point and rebuild sketch
			if(transformControls.getMode() == 'translate' && object.name == 'control point') {
				let sketch = object.parent;
				let i = sketch.pointMeshes.indexOf(object);
				sketch.keyPoints[i] = object.position;
				sketch.buildMesh();
			}
			if((transformControls.getMode() == 'translate') && (object.name =='ribpoint')) {
				let rib = object.parent.parent;
				if (rib.curve != null) {
					rib.buildCurve();
				}
			}

			signals.objectTransformed.dispatch(object);
			render();
		}

	} );
	transformControls.addEventListener( 'mouseDown', function () {

		var object = transformControls.object;

		objectPositionOnDown = object.position.clone();
		objectRotationOnDown = object.rotation.clone();
		objectScaleOnDown = object.scale.clone();

		controls.enabled = false;

	} );
	transformControls.addEventListener( 'mouseUp', function () {

		var object = transformControls.object;

		if ( object !== undefined ) {

			switch ( transformControls.getMode() ) {

				case 'translate':

					if ( ! objectPositionOnDown.equals( object.position ) ) {

						objectPositionOnDown = object.position;

					}

					break;

				case 'rotate':

					if ( ! objectRotationOnDown.equals( object.rotation ) ) {

						objectRotationOnDown = object.rotation;

					}

					break;

				case 'scale':

					if ( ! objectScaleOnDown.equals( object.scale ) ) {

						objectScaleOnDown = object.scale;

					}

					break;

			}

		}
		
		controls.enabled = true;

	} );

	sceneHelpers.add( transformControls );

    // raycast for draw and object selection
	var raycaster = new THREE.Raycaster();

	// mouse positions
	var mouse = new THREE.Vector2();
	var onDownPosition = new THREE.Vector2();
	var onUpPosition = new THREE.Vector2();
	var onMovePosition = new THREE.Vector2();
	
    function getMousePosition( dom, x, y ) {

		var rect = dom.getBoundingClientRect();
		return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];

	}
	
	function getDrawPoint(point) {
		mouse.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );
		raycaster.setFromCamera( mouse, camera );
		return raycaster.intersectObject(drawCanvas)[0].point;
	}

	// draw mode
	// line/spline:
	// enter mode -> onMouseDown(leftmouse) -> onMouseUp() -> handleClick()
	// -> onDrawSketch(mode) -> startDraw(mode) -> tempSketch = new Sketch -> onMouseMove() -> drawSketch()
	// -> [onMouseDown(leftmouse) -> onMouseUp() -> handleClick() -> onDrawSketch(mode) -> updateDraw()]
	//  -> [...] -> onMouseDown(rightmouse) -> endDraw() -> popKeyPoints();
	// brush2d:
	// enter mode -> {onMouseDown(leftmouse) -> onDrawSketch(mode) -> [onMouseMove() ->updateDraw()]
	// -> [...] -> -> onMouseUp() -> handleClick() -> endDraw()} -> {...}
	// -> onMouseDown(rightmouse)  -> endDraw()

    function onMouseDown( event ) {

		event.preventDefault();

		var array = getMousePosition( container.dom, event.clientX, event.clientY );
		onDownPosition.fromArray( array );

		// right click, exit draw mode
		if (event.button == 2) {
			if (tempSketch) {
				endDraw();
			}
			signals.drawModeChanged.dispatch('normal');
		} else if (sculptor.drawMode == 'brush2d'||sculptor.drawMode == 'brush3d') {
			onDrawSketch(sculptor.drawMode);
		}

		document.addEventListener( 'mouseup', onMouseUp, false );

	}

	container.dom.addEventListener( 'mousedown', onMouseDown, false );

	function onMouseUp( event ) {

		var array = getMousePosition( container.dom, event.clientX, event.clientY );
		onUpPosition.fromArray( array );
		
		handleClick(event);
		
		document.removeEventListener( 'mouseup', onMouseUp, false );

	}

    function onMouseMove( event ) {
        
        event.preventDefault();

        var array = getMousePosition( container.dom, event.clientX, event.clientY);
        onMovePosition.fromArray( array );

		if (tempSketch) {
			switch (sculptor.drawMode) {
				case 'line':
				case 'spline':
					drawSketch(tempSketch.name);
					trigClosedOnMoving(getDrawPoint(onMovePosition));
				break;
				case 'brush2d':
				case 'brush3d':
					updateDraw();
					trigClosedOnMoving(getDrawPoint(onMovePosition));
				break;
			}
		}
	}
	
	function onSelectMove(event) {
		event.preventDefault();
        var array = getMousePosition( container.dom, event.clientX, event.clientY);
		onMovePosition.fromArray( array );
		// if (sculptor.selectMode=='append'||sculptor.selectMode=='attach') {
		// 	var intersects = getIntersects( onMovePosition, sculptor.sketches );
		// 	if ( intersects.length > 0 ) {
		// 		let c = intersects[0].object.parent;
		// 		if (c.role == 'sketch' && sculptor.selectMode=='append') {
		// 			c.select();
		// 		} else if (sculptor.selectMode=='attach' && c.role == 'axis') {
		// 			c.select();
		// 		}
		// 	} else {
		// 		for (let c of sculptor.sketches) {
		// 			if (c==sculptor.selectedSketch) continue;
		// 			c.deselect();
		// 		}
		// 	}
		// }
	}
	function trigClosedOnMoving (position) {
		if (!tempSketch || tempSketch.keyPoints.length<4) return;
		if (position.distanceTo(tempSketch.keyPoints[0])<1) {
			switch (sculptor.drawMode) {
				case 'line':
				case 'spline':
					if (tempSketch.pointMeshes[0].scale.x==1) {
						tempSketch.pointMeshes[0].scale.set(2,2,2);
						nearlyClosed = true;
					}
				break;
				case 'brush2d':
				case 'brush3d':
					tempSketch.closed = true;
					endDraw();
				break;
			}
		} else {
			switch (sculptor.drawMode) {
				case 'line':
				case 'spline':
					if (tempSketch.pointMeshes[0].scale.x==2) {
						tempSketch.pointMeshes[0].scale.set(1,1,1);
					}
					nearlyClosed = false;
				break;
				case 'brush2d':
				case 'brush3d':
				break;
			}
		}
	}

	function handleClick(event) {
		// draw
		switch (sculptor.drawMode) {
			case 'line':
			case 'spline':
				onDrawSketch(sculptor.drawMode);
			break;
			case 'brush2d':
			case 'brush3d':
				endDraw();
			break;
			// drawing visual points in a unit
			case 'vp':
				sculptor.unit.addRib(getDrawPoint(onUpPosition));
				// exit drawing
				return;
		}

		// exit drawing
		if (event.button == 2) {
			return;
		}

		// avoid moving selection
		if ( onDownPosition.distanceTo( onUpPosition ) >0.01 ) {
			return;
		}

		// select
		// selectObject();
		let selected = null;
		var intersects = getIntersects( onUpPosition, castObjects );
		if (intersects.length == 0) {
			sculptor.select( null );
			return;
		}
		if (sculptor.currentScene.name == 'layoutScene') {
			// only meshes can be selected
			for (let its of intersects) {
				let obj = its.object;
				if (obj.name =='unit-sleeve' || obj.name == 'unit-bearing' ) {
					selected = obj.parent;
					break;
				} else if (obj.name == 'unit-blade' || obj.name=='unit-accessory') {
					selected = obj.parent.parent;
					break;
				}
			}
		} else {
			for (let its of intersects) {
				let obj = its.object;
				// select a point before a curve
				if (obj instanceof THREE.Points) {
					selected = obj;
					break;
				}
			}
			if (!selected) {
				// avoid selection rib curve of unit
				if (intersects[ 0 ].object.name =='sketch line') {
					selected = intersects[ 0 ].object.parent;
					// selected.select();
				} else if (intersects[ 0 ].object.name =='ribcurve') {
					selected = intersects[ 0 ].object.parent.parent;
					// selected.select();
				}
			}
		}
		sculptor.select(selected);
	}


	// object selection
	function getIntersects( point, objects ) {

		mouse.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );
		raycaster.setFromCamera( mouse, camera);
		return raycaster.intersectObjects( objects,true );

	}

	// draw
	function onDrawSketch (mode) {
		if (!tempSketch) {
			startDraw(mode);
		} else {
			switch (mode) {
				case 'line':
				case 'spline':
					updateDraw();
				break;
				case 'brush2d':
				case 'brush3d':
					endDraw();
				break;
			}
		}
	}
	function startDraw(mode) {
		var startPosition = (mode=='brush2d'||mode=='brush3d')?getDrawPoint(onDownPosition):getDrawPoint(onUpPosition);
		var endPosition = new THREE.Vector3().copy(startPosition);
		tempSketch = new Sketch(mode,[startPosition,endPosition]);
		scene.add(tempSketch);
		container.dom.addEventListener('mousemove', onMouseMove, false);
	}
	function drawSketch() {
		tempSketch.keyPoints[tempSketch.keyPoints.length-1] = getDrawPoint(onMovePosition);
		tempSketch.buildMesh();
	}
	function updateDraw () {
		tempSketch.keyPoints.push(getDrawPoint(onMovePosition));
		tempSketch.buildMesh();
		// if click near the first key point, end draw and close sketch
		if (nearlyClosed) {
			tempSketch.closed = true;
			if (tempSketch.name == 'spline') {
				tempSketch.keyPoints.pop();
			} else if (tempSketch.name == 'line') {
				// tempSketch.keyPoints.pop();
				tempSketch.keyPoints[tempSketch.keyPoints.length-2].copy(tempSketch.keyPoints[0]);
			}
			tempSketch.buildMesh();
			endDraw();
		}
	}
	function endDraw () {
		sculptor.addSketch(tempSketch);
		nearlyClosed = false;
		switch(sculptor.drawMode) {
			case 'line':
			case 'spline':
				popKeyPoints();
			break;
			case 'brush2d':
			case 'brush3d':
				tempSketch.reduce();
				tempSketch = null;
			break;
		}
		container.dom.removeEventListener('mousemove', onMouseMove, false);
	}
	function popKeyPoints () {
		tempSketch.keyPoints.pop();
		if (tempSketch.keyPoints.length <=1) {
			scene.remove(tempSketch);
		} else {
			tempSketch.buildMesh();
		}
		tempSketch = null;
	}

	// controls
    var controls = new THREE.TrackballControls(camera, container.dom);
    controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.5;
	controls.rotateSpeed = 1;
    controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

	// event handlers
	signals.drawModeChanged.add(function(mode) {
		tempSketch = null;
		// if mode active, exit
        if (sculptor.drawMode == mode) {
			sculptor.drawMode = 'normal';
			controls.enabled = true;
			return;
		}
        // update draw mode
        sculptor.drawMode = mode;
        // enter draw mode
        switch(sculptor.drawMode) {
            case 'normal':
				controls.enabled = true;
				container.setCursor('default');
			break;
			case 'vp':
			case 'line':
			case 'spline':
			case 'brush2d':
			case 'brush3d':
				controls.enabled = false;
				container.setCursor('crosshair');
			break;
        }
	});

    signals.windowResize.add( function() {
        camera.aspect = container.dom.offsetWidth / container.dom.offsetHeight;
        camera.updateProjectionMatrix();

        controls.handleResize();

        renderer.setSize( container.dom.offsetWidth, container.dom.offsetHeight );
		render();
	} );

	signals.objectSelected.add(function(object) {
		// select nothing
		if (object == null) {
			transformControls.detach();
			return;
		}
		transformControls.attach( object );
		// selected a sketch
		if (object instanceof Sketch) {
			signals.transformModeChanged.dispatch('translate');
		} else if (object instanceof Rib) {
			signals.transformModeChanged.dispatch('rotate');
		// selected a point or a unit
		} else if (object instanceof Unit) {
		} else if (object.name == 'ribpoint' || object.name == 'control point' ) {
			signals.transformModeChanged.dispatch('translate');
		} else {
			signals.transformModeChanged.dispatch('translate');
		}
	});

	signals.sculptureChanged.add(function(){
		castObjects = sculptor.sculpture.getMechanisms();
	})
	signals.transformModeChanged.add( function ( mode ) {
		
		transformControls.setMode( mode );
		
	} );

    function animate() {

        requestAnimationFrame( animate );
        render();
		controls.update();
		if (sculptor.isPlay) {
			sculptor.sculpture.simulateMotion();
		}
		stats.update();

    }

    function render() {
		sceneHelpers.updateMatrixWorld();
		scene.updateMatrixWorld();
		renderer.render( scene, camera );
		renderer.render( sceneHelpers, camera );		
	}
	
	signals.worldTransform.add(function(world){
		if (world) {
			transformControls.setSpace('world');
		} else {
			transformControls.setSpace('local');
		}
	});

	signals.sceneChanged.add(function(name){
		sculptor.currentScene = sculptor.scenes[name];
		scene = sculptor.currentScene;
		if (name == 'unitScene') {
			sculptor.unit.resetTransform();
			drawCanvas = sculptor.unitCanvas;
			castObjects = sculptor.unit.skeleton.children;
			sceneHelpers.children[0].visible = true;
		} else if (name =='sketchScene') {
			// transfer sketches
			for (sketch of sculptor.sculpture.sketches) {
				scene.add(sketch);
			}
			if (sculptor.sculpture.axis) {
				scene.add(sculptor.sculpture.axis);
			}
			drawCanvas = sculptor.sketchCanvas;
			castObjects = sculptor.sketches;
			if (sculptor.axis) {
				castObjects.push(sculptor.axis);
			}
			if (sculptor.sculpture.sketches.length>0) {
				castObjects.push(...sculptor.sculpture.sketches);
			}
			sceneHelpers.children[0].visible = true;
		} else if (name =='layoutScene') {
			// transfer sketches
			if (sculptor.axis) {
				sculptor.sculpture.setAxis(sculptor.axis);
				scene.add(sculptor.axis);
			}
			for (let contour of sculptor.sculpture.sketches) {
				scene.add(contour);
			}
			castObjects = sculptor.sculpture.getMechanisms();
			sceneHelpers.children[0].visible = false;
		}
		sculptor.deselect();
		// sculptor.selectedSketch = null;
		controls.reset();
	});

    animate();
    
    return container;
};