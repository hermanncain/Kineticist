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

	var effect = new THREE.OutlineEffect( renderer );

	// var scene = sculptor.scenes.unitScene;
	var scene = sculptor.currentScene;
	var sceneHelpers = sculptor.sceneHelpers;
    var camera = sculptor.camera;
	var drawCanvas = sculptor.unitCanvas;
	var castObjects = sculptor.unit.guides.children;

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
			
		}
		signals.objectTransformed.dispatch(object);
		render();

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
		if (sculptor.selectMode=='append'||sculptor.selectMode=='attach') {
			var intersects = getIntersects( onMovePosition, sculptor.sketches );
			if ( intersects.length > 0 ) {
				let c = intersects[0].object.parent;
				if (c.curveType == 'contour' && sculptor.selectMode=='append') {
					c.select();
				} else if (sculptor.selectMode=='attach' && c.curveType == 'axis') {
					c.select();
				}
			} else {
				for (let c of sculptor.sketches) {
					if (c==sculptor.selectedSketch) continue;
					c.deselect();
				}
			}
		}
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
			break;
		}
		if (event.button == 2) {
			if (sculptor.selectMode != 'normal') {
				signals.selectModeChanged.dispatch('normal');
				return;
			}
			return;
		}
		// select
		if ( onDownPosition.distanceTo( onUpPosition ) >0.01 ) return;
		if (sculptor.drawMode == 'normal') {
			var intersects = getIntersects( onUpPosition, castObjects );
			
			if ( intersects.length > 0 ) {
				let selected = null;
				// prior: select a point
				// then mesh
				for (let its of intersects) {
					if(its.object.name=='control point'||its.object.name=='ribpoint'||its.object.name=='vp') {
						selected = its.object;
						break;
					} else if (its.object.name =='sleeve'||
						its.object.name=='blades'||
						its.object.name=='accessory'||
						its.object.name=='transmission') {
						selected = its.object.parent.parent;
					}
				}
				// last line
				if (!selected) {
					// avoid selection rib curve of unit
					if (intersects[ 0 ].object.name =='sketch line') {
						selected = intersects[ 0 ].object;
					} else if (intersects[ 0 ].object.name =='ribcurve') {
						selected = intersects[ 0 ].object.parent.parent;
						selected.select();
					}
				}
				if (sculptor.selectMode=='append') {
					sculptor.appendReference(selected.parent);
				} else if (sculptor.selectMode=='attach') {
					sculptor.attachToSculpture(selected.parent);
				} else {
					sculptor.select(selected);
				}
			} else {
				sculptor.select( null );
			}
		}
		if (sculptor.selectMode != 'normal') {
			signals.selectModeChanged.dispatch('normal');
			return;
		}
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
			tempSketch.keyPoints[tempSketch.keyPoints.length-2].copy(tempSketch.keyPoints[0]);
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
	signals.selectModeChanged.add(function(mode) {
		sculptor.selectMode = mode;
		switch(mode) {
			case 'normal':
				container.dom.removeEventListener('mousemove', onSelectMove, false);
				container.setCursor('default');
			break;
			case 'append':
				container.dom.addEventListener('mousemove', onSelectMove, false);
				container.setCursor('pointer');
			break;
			case 'attach':
				container.dom.addEventListener('mousemove', onSelectMove, false);
				container.setCursor('pointer');
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

	signals.generateSkeleton.add( function (dist) {
		//if (sculptor.skeleton.length == 0) {
			for (axis of sculptor.axes) {
				var bones = axis.generateSkeleton(sculptor.contours,dist,40);
				//console.log('asdfsadgsag',bones)
				for (bone of bones) {

					scene.add(bone);
					//sculptor.skeleton.push(bone);
				}
			}
		/*} else {
			for (bone of sculptor.skeleton) {
				scene.remove(bone);
			}
		}*/
		
		// if (sculptor.skeleton.length>0) {
		// 	alert('please clear skeleton first!');
		// 	return;
		// }
		// sculptor.axis = scene.children[1];
		// sculptor.axis.setCurveType('axis');
		// for (let i=2;i<scene.children.length;i++) {
		// 	sculptor.contours.push(scene.children[i]);
		// }
		// sculptor.skeleton = sculptor.axis.generateSkeleton(sculptor.contours);
		// for (sk of sculptor.skeleton) scene.add(sk);
	});
	signals.objectSelected.add(function(object) {
		// select nothing
		sculptor.selectSketch(null);
		if (object == null) {
			transformControls.detach();
			sculptor.selectSketch(null);
			sculptor.deselectGroup();
			return;
		// select sketch components
		}
		transformControls.attach( object );
		// selected a sketch
		if (object.name == 'sketch line') {
			sculptor.selectSketch(object.parent);
			signals.transformModeChanged.dispatch('translate');
		} else if (object instanceof Rib) {
			signals.transformModeChanged.dispatch('rotate');
		// selected a point or a unit
		} else if (object instanceof Unit) {
		} else if (object.name == 'ribpoint') {
			object.material.color.setHex(0xffaa00);
			signals.transformModeChanged.dispatch('translate');
		} else {
			signals.transformModeChanged.dispatch('translate');
		}
	});
	signals.sketchSelected.add(function(sketch){
		if (sketch == null) {
			sculptor.selectSculpture(null);
		} else {
			// transformControls.attach( sketch );
			if (sketch.curveType == 'axis') {
				sculptor.selectSculpture(sketch);
			}
		}
	});
	signals.sketchChanged.add(function(sketch){
		// sculptor.selectSketch(sketch);
	});
	signals.sculptureSelected.add(function(ksBranch){
		// transformControls.detach();
		if(ksBranch!==null) {
			//transformControls.attach( ksBranch );
			// show dependencies
			// castObjects = [ksBranch];
		}

	});
	signals.transformModeChanged.add( function ( mode ) {
		
		transformControls.setMode( mode );
		
	} );

    function animate() {

        requestAnimationFrame( animate );
        render();
		controls.update();
		if (sculptor.isPlay) {
			// rotate curves

			// rotate skeleton
			for (uuid in sculptor.sculptures) {
				sculptor.sculptures[uuid].simulateMotion();
			}
		}

    }

    function render() {
		sceneHelpers.updateMatrixWorld();
		scene.updateMatrixWorld();
		if (sculptor.unitMaterial.name == 'toon') {
			effect.render( scene, camera );
		} else {
			renderer.render( scene, camera );
		}
		if ( renderer instanceof THREE.RaytracingRenderer === false ) {

			renderer.render( sceneHelpers, camera );

		}
		
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
		// console.log(sculptor.scenes['unitScene'])
		if (name == 'unitScene') {
			// scene = sculptor.scenes.unitScene;
			sculptor.unit.resetTransform();
			scene.add(sculptor.unit);
			drawCanvas = sculptor.unitCanvas;
			castObjects = sculptor.unit.guides.children;//[sculptor.unit];
			sceneHelpers.children[0].visible = true;
		} else if (name =='sketchScene') {
			// scene = sculptor.scenes.sketchScene;
			for(sketch of sculptor.sketches) {
				scene.add(sketch);
			}
			drawCanvas = sculptor.sketchCanvas;
			castObjects = sculptor.sketches;
			sceneHelpers.children[0].visible = true;
		} else if (name =='layoutScene') {
			// scene = sculptor.scenes.layoutScene;
			// transfer sketch
			let sculpture = null;
			// multiple axis, transfer selected axis
			if (sculptor.selectedSculpture) {
				// console.log('transfer selected sculpture', sculpture);
				sculpture = sculptor.selectedSculpture;
				let previousSculpture = scene.children[scene.children.length-1];
				if (previousSculpture instanceof KineticSculptureBranch) {
					if (previousSculpture.uuid != sculptor.selectedSculpture.uuid) {
						scene.remove(previousSculpture);
						sculptor.ksParameters = previousSculpture.parameters;
					}
				}
			// single axis, transfer it
			} else {
				// console.log('transfer the only sculpture')
				sculpture = sculptor.sculptures[sculptor.axes[0].uuid];
			}
			scene.add(sculpture.axis);
			for (let ref of sculpture.references) {
				if (ref.type == 'sketch') {
					scene.add(ref);
				}
			}
			scene.add(sculpture);
			castObjects = [sculpture];
			sceneHelpers.children[0].visible = false;
		}
		sculptor.deselect();
		sculptor.selectedSketch = null;
		controls.reset();
	});

    animate();
    
    return container;
};