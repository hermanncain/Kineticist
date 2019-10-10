Leftbar.Unit = function (sculptor) {

    var signals = sculptor.signals;

    var container = new UI.Panel().setId('leftbar-unit').add(
        new UI.Text('UNIT MODELING').setClass('bar-title')
    );

    var content = new UI.Panel().setClass('content');
    container.add(content);

    // draw unit skeletons
    var skeletonRow = new UI.Row().add(
        new UI.Text('Draw skeletons').setClass('sect-title')
    );
    content.add(skeletonRow);

    var drawRibButton = new UI.Button().setId('add-end').onClick(clickDraw);
    drawRibButton.dom.title = 'draw an end to initialize a skeleton curve';
    skeletonRow.add(drawRibButton);

    // batch duplication: circle array
    var circleArrayButton = new UI.Button().setId('ca').onClick(simulateCA);
    circleArrayButton.dom.title = 'circle array';
    skeletonRow.add(circleArrayButton);
    var caRow = new UI.Row().setDisplay('none');
    skeletonRow.add(caRow);
    caRow.add(new UI.Text('#').setClass('param').setWidth('10px'));
    var caNumber = new UI.Integer(4).setRange(2,30).setWidth('30px').onChange(simulateCA);
    caRow.add(caNumber);
    var generateArray = new UI.Button().setId('gca').onClick(applyArray);
    caRow.add(generateArray);
    var cancelArrayButton = new UI.Button().setId('cca').onClick(cancelArray);
    caRow.add(cancelArrayButton);

    // skeleton semantics control
    var semanticConfig = new Leftbar.Unit.Semantic(sculptor);
    skeletonRow.add( semanticConfig );

    // sweeping control
    var bladeConfig = new Leftbar.Unit.Blade(sculptor);
    content.add( bladeConfig );

    // accessory control
    var accessoryConfig = new Leftbar.Unit.Accessory(sculptor);
    content.add( accessoryConfig );

    // TODO
    // shape configurations
    // polygon shape
    // var polygonShaped = new UI.Button().setId('polygon').onClick(function(){
    //     if(sculptor.unit.shape == 'polygon') {
    //         sculptor.unit.shape = 'propeller';
    //         polygonShapeRow.setDisplay('none');
    //         propellerShapeRow.setDisplay('');
    //         polygonShaped.dom.classList.remove('selected');
    //     } else if (sculptor.unit.shape == 'propeller') {
    //         sculptor.unit.shape = 'polygon';
    //         polygonShapeRow.setDisplay('');
    //         propellerShapeRow.setDisplay('none');
    //         polygonShaped.dom.classList.add('selected');
    //     }
    // });
    // var polygonShapeRow = new UI.Row().setDisplay('none');
    // container.add(polygonShapeRow);
    // polygonShapeRow.add(new UI.Text('polygon shape').setWidth('100%'));

    // // TODO: bevel and depth config
    // polygonShapeRow.add(new UI.Text('bevel').setFontSize('16px').setWidth('70px'));
    // var bevel = new UI.Number();
    // polygonShapeRow.add(bevel);
    // polygonShapeRow.add(new UI.Text('depth').setFontSize('16px').setWidth('70px'));
    // var depth = new UI.Number();
    // polygonShapeRow.add(depth);
    // polygonShapeRow.add(new UI.Text('convex').setFontSize('16px').setWidth('70px'));
    // var convex = new UI.Number();
    // polygonShapeRow.add(convex);

    // // propeller shape control
    // var propellerShapeRow = new UI.Row().add(
    //     new UI.HorizontalRule().setWidth('90%'),
    //     new UI.Text('shape control').setWidth('100%').setMarginTop('0')
    // );


    // mesh generation
    var genRow = new UI.Row().add(
        new UI.HorizontalRule().setWidth('90%'),
        new UI.Text('Generate mesh').setClass('sect-title')
    );
    content.add(genRow);

    var genBtn = new UI.Button().setId('gen').onClick(function(){
        sculptor.unit.generateShape();
        // importBtn.dom.classList.remove('selected');
        // uploadUnit.style.display = 'none';
        // uploadRow.setDisplay('none');
    });
    genRow.add(genBtn);

    var clBtn = new UI.Button().setId('clear').onClick(function(){
        sculptor.unit.clearShapes();
        // importBtn.dom.classList.remove('selected');
        // uploadUnit.style.display = 'none';
        // uploadRow.setDisplay('none');
    });
    genRow.add(clBtn);


    // handlers

    function clickDraw () {
        // exit draw vp mode
        if (sculptor.drawMode == 'vp') {
            signals.drawModeChanged.dispatch('normal');
            drawRibButton.dom.classList.remove('selected');
        } else {
            // enter draw vp mode
            signals.drawModeChanged.dispatch('vp');
            drawRibButton.dom.classList.add('selected');
        }
    }

    function simulateCA () {
        if (!(sculptor.selected instanceof Rib)) return;
        // enter circle array parameter configuration
        if (circleArrayButton.dom.id.indexOf('selected')<0) {
            circleArrayButton.dom.classList.add('selected');
            caRow.setDisplay('');
            sculptor.unit.clearTemp();
            // let n = caNumber.getValue();
            sculptor.unit.generateCircleArray(sculptor.selected,caNumber.getValue());
            // simulateCA();
        } else {
            circleArrayButton.dom.classList.remove('selected');
            caRow.setDisplay('none');
        }
    }

    function applyArray () {
        if (!sculptor.selected) return;
        sculptor.unit.addTempleRibs();
        sculptor.select(null);
        hideArray();
    }

    function cancelArray(){
        sculptor.unit.clearTemp();
        hideArray();
    }

    function hideArray() {
        circleArrayButton.dom.classList.remove('selected');
        caRow.setDisplay('none');
    }

    // subscribers

    signals.drawModeChanged.add(function(mode){
        if (mode == 'normal') {
            drawRibButton.dom.classList.remove('selected');
        }
    });

    signals.objectSelected.add(function(object) {
        if (!object) {
            if (sculptor.unit.templeSkeleton.children.length>0) {
                cancelArray();
            }
            semanticConfig.setDisplay( 'none' );
            bladeConfig.setDisplay( 'none' );
            accessoryConfig.setDisplay( 'none' );
        }
        if (object) {
            if (object instanceof Rib) {
                semanticConfig.setDisplay( '' );
                bladeConfig.setDisplay( '' );
                accessoryConfig.setDisplay( '' );
            } else {
                semanticConfig.setDisplay( 'none' );
                bladeConfig.setDisplay( 'none' );
                accessoryConfig.setDisplay( 'none' );
            }
        }
        
    });
    
    return container;

}


    // var importBtn = new UI.Button().setId('import-unit').onClick(function(){
    //     importBtn.dom.classList.add('selected');
    //     // uploadUnit.style.display = '';
    //     uploadRow.setDisplay('');
    // });
    // genRow.add(importBtn);


    // upload geometry
    // var uploadRow = new UI.Row();
    // uploadRow.setDisplay('none');
    // uploadRow.add(new UI.Text('Z must be the rotation axis!').setFontSize('12px'))
    // var uploadUnit = document.createElement('input');
    // uploadUnit.style.marginLeft = '5px';
    // uploadUnit.style.width = '100%';
	// uploadUnit.id = 'uploadUnit';
	// uploadUnit.multiple = false;
	// uploadUnit.type = 'file';
	// uploadUnit.accept = '.obj';
	// uploadUnit.addEventListener( 'change', function ( event ) {
	// 	if(uploadUnit.files.length>0) {
    //         var file = uploadUnit.files[0];
    //         var reader = new FileReader();
    //         reader.addEventListener('load', function (event) {
    //             var contents = event.target.result;
    //             var object = OBJLoader.parse(contents);
    //             object.traverse(function(obj){
    //                 if(obj.type=='Mesh') {
    //                     obj.material = sculptor.unitMaterial;
    //                 }
    //             });
    //             sculptor.unit.clearShapes();
    //             sculptor.unit.setUpload(object);
    //         });
    //         reader.readAsText(file);
    //     }
            
	// } );
	// uploadRow.dom.appendChild( uploadUnit );
    // genRow.add(uploadRow);

        // container.add(propellerShapeRow);
    // propellerShapeRow.add(new UI.Text('shape control').setWidth('100%'));
    // container.add(new UI.Text('blades').setWidth('180px'));
    // tabs
    // var semanticTab = new UI.Button('seman').setId('semantic-tab').onClick(function(){
    //     select('semantic');
    // });
    // var bladeTab = new UI.Button('sweep').setId('blade-tab').onClick(function(){
    //     select('blade');
    // });
    // var accessoryTab = new UI.Button('acces').setId('accessory-tab').onClick(function(){
    //     select('accessory');
    // });

    // var tabs = new UI.Div().setMargin('10px');
    // tabs.setId( 'leftbar-unit-tabs' );
    // tabs.add( semanticTab, bladeTab, accessoryTab );
    // propellerShapeRow.add( tabs );

    // configs
    // var semanticConfig = new Leftbar.Unit.Semantic(sculptor);
    // propellerShapeRow.add( semanticConfig );

    // var bladeConfig = new Leftbar.Unit.Blade(sculptor);
    // propellerShapeRow.add( bladeConfig );

    // var accessoryConfig = new Leftbar.Unit.Accessory(sculptor);
    // propellerShapeRow.add( accessoryConfig );

    // function select(selection) {
        
    //     semanticTab.dom.classList.remove( 'selected' );
	// 	bladeTab.dom.classList.remove( 'selected' );
    //     accessoryTab.dom.classList.remove( 'selected' );

    //     semanticTab.setBorderBottom('solid 1px black');
    //     bladeTab.setBorderBottom('solid 1px black')
    //     accessoryTab.setBorderBottom('solid 1px black')
        
    //     semanticConfig.setDisplay( 'none' );
    //     bladeConfig.setDisplay( 'none' );
    //     accessoryConfig.setDisplay( 'none' );
        
    //     if (!sculptor.selected) {return;}
	// 	switch ( selection ) {
	// 		case 'semantic':
    //             semanticTab.dom.classList.add( 'selected' );
    //             semanticTab.setBorderBottom('none');
	// 			semanticConfig.setDisplay( '' );
	// 			break;
	// 		case 'blade':
    //             bladeTab.dom.classList.add( 'selected' );
    //             bladeTab.setBorderBottom('none');
	// 			bladeConfig.setDisplay( '' );
	// 			break;
	// 		case 'accessory':
    //             accessoryTab.dom.classList.add( 'selected' );
    //             accessoryTab.setBorderBottom('none');
	// 			accessoryConfig.setDisplay( '' );
    //             break;
    //         default:
    //             break;
	// 	}
    // }

    // container.add(new UI.HorizontalRule());


    // function selectRound () {
    //     sculptor.deselectGroup();
    //     if (sculptor.selected instanceof Rib) {
    //         for (let rib of sculptor.unit.skeleton.children) {
    //             rib.select();
    //             sculptor.selectedGroup.push(rib);
    //         }
    //     } else if (sculptor.selected.name == 'ribpoint') {
    //         let container = sculptor.selected.parent;
    //         let idx = container.parent.children.indexOf(container)
    //         for (let rib of sculptor.unit.skeleton.children) {
    //             let pt = rib.children[idx].children[0];
    //             pt.material.color.setHex(0xffaa00);
    //             sculptor.selectedGroup.push(pt);
    //         }
    //     }
    // }