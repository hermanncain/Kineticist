/**
 * @author hermanncain
 */

var Menubar = function ( sculptor ) {

	var NUMBER_PRECISION = 6;

	function parseNumber( key, value ) {

		return typeof value === 'number' ? parseFloat( value.toFixed( NUMBER_PRECISION ) ) : value;

	}

	signals = sculptor.signals;

	var container = new UI.Panel();
	container.setId( 'menubar' );

	// TODO: replace text with logo
	var title = new UI.Text('Cycler').setWidth('100px').setFontSize('40px')
    title.setMarginLeft('10px');
    title.dom.style.verticalAlign='top';
    title.dom.style.fontFamily='Impact';
    container.add(title);

	// file operations
	var fileRow = new UI.Row();
	container.add( fileRow );

	// create a new kinetic sculpture design
	var newKS = new UI.Button().setId('new').onClick(function(){
		if (alert('start a new project, while unsaved work will be lost, still continue?')) {
			sculptor.clear();
		}
	});
	newKS.dom.title = 'new';
	fileRow.add( newKS );
	
	// open/upload a unit or a kinetic sculpture
	// file reader
	var reader = new FileReader();
	reader.addEventListener( 'load', function ( event ) {

		var contents = event.target.result;
		var data;

		try {

			data = JSON.parse( contents );

		} catch ( error ) {

			alert( error );
			return;
		}
		if (data.type=='Unit') {
			sculptor.unit.fromJSON(data);
		} else {
			sculptor.fromJSON(data);
		}
	},false);
	// upload dom
	var form = document.createElement( 'form' );
	form.style.display = 'none';
	document.body.appendChild( form );
	var fileInput = document.createElement( 'input' );
	fileInput.multiple = false;
	fileInput.type = 'file';
	fileInput.addEventListener( 'change', function ( event ) {
		reader.readAsText( fileInput.files[0] );
		form.reset();
	} );
	form.appendChild( fileInput );

	var openKS = new UI.Button().setId('open').onClick(function(){
		fileInput.click();
	});
	openKS.dom.title = 'open';
	fileRow.add( openKS );

	// save/download a kinetic sculpture project
	var saveKS = new UI.Button().setId('save').onClick(function(){
		console.log(sculptor.currentScene.name)
		// save unit
		if (sculptor.currentScene.name == 'unitScene') {
			if (sculptor.unit.skeleton.children.length==0 && sculptor.unit.upload.children.length==0) {
				alert('empty unit!');
				return;
			} else {
				var output = sculptor.unit.toJSON();
				output = JSON.stringify( output, parseNumber, '\t' );
				saveString(output, 'unit.json');
			}

		// save sculpture
		} else if (sculptor.currentScene.name == 'layoutScene') {
			var output = sculptor.toJSON();
			output = JSON.stringify( output, parseNumber, '\t' );
			saveString(output, 'sculpture.json');
		}
	});
	saveKS.dom.title = 'save';
	fileRow.add( saveKS );

	// building operations
	var buildRow = new UI.Row();
	container.add(buildRow);
	var buildButtons = [];
	var modes = ['unitScene','sketchScene','layoutScene'];

	(function () {
		for (let name of modes) {
			var bt = new UI.Button().setId(name).onClick(function(){
				selectMode(name);
                
            });
            buildRow.add(bt);
            buildButtons.push(bt);
		}
	})();

	// simulation operations
	var controlRow = new UI.Row();
	container.add(controlRow);

	// play
	var play = new UI.Button().setId('play').onClick(function () {
		if (sculptor.isPlay) {
			sculptor.isPlay = false;
			play.setId('play');
		} else {
			sculptor.isPlay = true;
			play.setId('pause');
		}
	});
	controlRow.add(play);

	// reset
	var reset = new UI.Button().setId('reset').onClick(function () {
		sculptor.isPlay = false;
		play.setId('play');
		sculptor.sculpture.reset();
	});
	controlRow.add(reset);


	// for debug and figures in paper

	let showUnit = new UI.Button('full unit').onClick(function(){
		sculptor.unit.visible = false;
		let unitExample = sculptor.sculpture.units.children[1].clone();
		unitExample.scale.set(1,1,1);
		unitExample.rotation.set(0,0,0);
		unitExample.position.set(0,0,0);
		sculptor.scenes.unitScene.add(unitExample);
	});
	// controlRow.add(showUnit);

	let showPair = new UI.Button('pair').onClick(function(){
		let s = sculptor.sculpture;
		let n = s.units.children.length;
		for (let i=0;i<n;i++) {
			if (i != 3 && i != 4) {
				s.units.children[i].visible = false;
			}
			
		}
	});
	// controlRow.add(showPair);

	let test2 = new UI.Button('r').onClick(function(){
		let jj = {
			sculptor: sculptor.toJSON(),
			ks: sculptor.sculpture.toJSON(),
		}
		
	});
	// controlRow.add(test2);

	
	// transform operations
	var transformRow = new UI.Row().setDisplay('none');
	container.add(transformRow);
	var transformButtons = [];

	// translate
	var translate = new UI.Button().setId('translate').onClick(function () {
		signals.transformModeChanged.dispatch('translate');
	});
	transformRow.add(translate);
	transformButtons.push(translate);

	// rotate
	var rotate = new UI.Button().setId('rotate').onClick(function () {
		signals.transformModeChanged.dispatch('rotate');
	});
	transformRow.add(rotate);
	transformButtons.push(rotate);

	// scale
	var scale = new UI.Button().setId('scale').onClick(function () {
		signals.transformModeChanged.dispatch('scale');
	});
	transformRow.add(scale);
	transformButtons.push(scale);

	// reference
	transformRow.add(new UI.Text('world').setFontSize('20px').setMargin('8px'));
	var worldTransform = new UI.Checkbox(false).onChange(function(){
		signals.worldTransform.dispatch(worldTransform.getValue());
	});
	transformRow.add(worldTransform);

	// duplicate
	// var duplicate = new UI.Button().setId('duplicate').onClick(function () {});
	// transformRow.add(duplicate);

	// remove
	var remove = new UI.Button().setId('remove').onClick(function () {
		sculptor.remove(sculptor.selected);
	});
	transformRow.add(remove);


	// get help on github
	// disable for review
	// var github = new UI.Button().setId('github').setPosition('absolute').setRight('20px').onClick(function(){
	// 	window.open('https://github.com/hermanncain/Cycler');
	// });
	// container.add( github );

	// for download
	var link = document.createElement( 'a' );
	link.id = 'fordld';
	link.style.display = 'none';
	document.body.appendChild( link );

	function selectMode(name) {
		if (name=='layoutScene') {
			if (!sculptor.sketches.length) {
				alert('no sketch!');
				return;
			}
			if (sculptor.axis==null) {
				// noted for review
				// let allOrdered = sculptor.sketches.reduce(function(a,b){
				// 	return a.timeOrder || b.timeOrder;
				// });
				// let allUnordered = sculptor.sketches.reduce(function(a,b){
				// 	return a.timeOrder && b.timeOrder;
				// });
				// // if all sketches are time-ordered, keep null axis
				// // else set sketch[0] as axis
				// // then make all sketches 0 ordered
				// // and attach them to the sculpture as contours
				// if (!(allOrdered && allUnordered)) {
				// 	sculptor.setRole(sculptor.sketches[0],'axis');
				// 	for (let i=1;i<sculptor.sketches.length;i++) {
				// 		sculptor.setRole(sculptor.sketches[i],'contour');
				// 		sculptor.sketches[i].setTimeOrder(0);
				// 	}
				// }
				sculptor.setRole(sculptor.sketches[0],'axis');
			}
		}
		for (let b of buildButtons) {
            if (b.dom.id == name) {
				b.dom.classList.add('selected');
            } else {
				b.dom.classList.remove('selected');
            }
		}
		signals.sceneChanged.dispatch(name);
	}

	// function updateModes(name) {
	// 	for (let b of buildButtons) {
    //         if (b.dom.id == name) {
	// 			// if (b.dom.classList.contains('selected')) {
	// 			// 	b.dom.classList.remove('selected');
	// 			// } else {
	// 				b.dom.classList.add('selected');
	// 			// }
    //         } else {
	// 			b.dom.classList.remove('selected');
    //         }
	// 	}
	// 	// signals.leftbarChanged.dispatch(name);
	// 	// signals.sceneChanged.dispatch(name);
	// }

	// signals.leftbarChanged.add(function(name){
	// 	updateModes(name);
	// });

	signals.transformModeChanged.add(function(mode){
		for (bt of transformButtons) {
			if (bt.dom.id == mode) {
				bt.dom.classList.add('selected');
			} else {
				bt.dom.classList.remove('selected');
			}
		}
	});

	signals.objectSelected.add(function(object){
		if (!object || object instanceof Unit) {
			transformRow.setDisplay('none');
			return;
		} else {
			transformRow.setDisplay('');
		}
		if (object.name=='control point' || object.name == 'ribpoint') {
			translate.setDisplay('');
			rotate.setDisplay('none');
			scale.setDisplay('none');
			// remove.setDisplay('');
		} else if (object instanceof Rib) {
			translate.setDisplay('none');
			rotate.setDisplay('');
			scale.setDisplay('');
			remove.setDisplay('');
		}
	});

	// motion simulation buttons are visible only in the layout scene
	signals.sceneChanged.add(function(name){
		if (name == 'layoutScene') {
			controlRow.setDisplay('');
		} else {
			controlRow.setDisplay('none');
		}
	});

	// initialize
	selectMode(sculptor.currentScene.name);

	return container;

};