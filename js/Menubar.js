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
	var title = new UI.Text('Kineticist').setWidth('150px').setFontSize('40px')
    title.setMarginLeft('10px');
    title.dom.style.verticalAlign='top';
    title.dom.style.fontFamily='Impact';
    container.add(title);

	// file operations
	var fileRow = new UI.Row();
	container.add( fileRow );

	// create a new kinetic sculpture design
	var newKS = new UI.Button().setId('new').onClick(function(){
		if (confirm('start a new project, while unsaved work will be lost, still continue?')) {
			sculptor.clear();
			signals.sceneCleared.dispatch();
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
		sculptor.clear();
		sculptor.fromJSON(data);
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
		saveString(JSON.stringify( sculptor.toJSON(), parseNumber, '\t' ), 'sculpture.json');
	});
	saveKS.dom.title = 'save';
	fileRow.add( saveKS );

	var buildRow = new UI.Row();
	container.add(buildRow);

	var unitSceneButton = new UI.Button().setId('unit-scene').onClick(function(){
		switchScene('unit-scene');
		// signals.sceneChanged.dispatch('unit-scene');
	});
	buildRow.add(unitSceneButton);

	var sculptureSceneButton = new UI.Button().setId('sculpture-scene').onClick(function(){
		switchScene('sculpture-scene');
		// signals.sceneChanged.dispatch('sculpture-scene');
	});
	buildRow.add(sculptureSceneButton);

	// building operations
	// var buildRow = new UI.Row();
	// container.add(buildRow);
	// var buildButtons = [];
	// var modes = ['unitScene','sketchScene','layoutScene'];

	// (function () {
	// 	for (let name of modes) {
	// 		var bt = new UI.Button().setId(name).onClick(function(){
	// 			selectMode(name);
                
    //         });
    //         buildRow.add(bt);
    //         buildButtons.push(bt);
	// 	}
	// })();

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

	// watch tutorial videos
	var videos = new UI.Button().setId('video').setPosition('absolute').setRight('80px').onClick(function(){
		window.open('https://github.com/hermanncain/Cycler');
	});
	container.add( videos );

	// get help on github
	// disable for peer review
	var github = new UI.Button().setId('github').setPosition('absolute').setRight('20px').onClick(function(){
		window.open('https://github.com/hermanncain/Cycler');
	});
	container.add( github );

	// for download
	var link = document.createElement( 'a' );
	link.id = 'fordld';
	link.style.display = 'none';
	document.body.appendChild( link );

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
			remove.setDisplay('none');
		} else if (object instanceof Rib || object instanceof Sketch) {
			translate.setDisplay('none');
			rotate.setDisplay('');
			scale.setDisplay('');
			remove.setDisplay('');
		}
	});

	function switchScene (name) {
		if (name == 'unit-scene') {
			sculptureSceneButton.dom.classList.remove('selected');
			unitSceneButton.dom.classList.add('selected');	
		} else {
			sculptureSceneButton.dom.classList.add('selected');
			unitSceneButton.dom.classList.remove('selected');	
		}
		sculptor.switchScene(name);
	}

	switchScene (sculptor.currentScene.name);

	return container;

};