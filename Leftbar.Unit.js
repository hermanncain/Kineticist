Leftbar.Unit = function (sculptor) {

    var signals = sculptor.signals;

    var container = new UI.Panel().setId('leftbar-unit');
    
    // draw unit skeletons
    var vpRow = new UI.Row();
    container.add(vpRow);
    vpRow.add(new UI.Text('Unit skeleton').setWidth('180px'));
    var drawRibButton = new UI.Button().setId('gen-vg').onClick(clickDraw);
    vpRow.add(drawRibButton);
    var circleArrayButton = new UI.Button().setId('ca').onClick(simulateCA);
    vpRow.add(circleArrayButton);
    var selectAll = new UI.Button().setId('select-all').onClick(selectRound);
    vpRow.add(selectAll);

    // batch duplication: circle array
    var caRow = new UI.Row().setDisplay('none');
    container.add(caRow);
    caRow.add(new UI.Text('#').setFontSize('15px').setWidth('10px'));
    var caNumber = new UI.Integer(4).setRange(2,30).setWidth('30px').onChange(simulateCA);
    caRow.add(caNumber);
    var generateArray = new UI.Button().setId('gca').onClick(applyArray);
    caRow.add(generateArray);
    var cancelArray = new UI.Button().setId('cca').onClick(cancelArray);
    caRow.add(cancelArray);

    container.add(new UI.HorizontalRule());

    container.add(new UI.Text('Unit blades').setWidth('180px'));
    // tabs
    var semanticTab = new UI.Button().setId('semantic-tab').onClick(function(){
        select('semantic');
    });
    var bladeTab = new UI.Button().setId('blade-tab').onClick(function(){
        select('blade');
    });
    var accessoryTab = new UI.Button().setId('accessory-tab').onClick(function(){
        select('accessory');
    });

    var tabs = new UI.Div().setMargin('10px');
    tabs.setId( 'leftbar-unit-tabs' );
    tabs.add( semanticTab, bladeTab, accessoryTab );
    container.add( tabs );

    // configs
    var semanticConfig = new Leftbar.Unit.Semantic(sculptor);
    container.add( semanticConfig );

    var bladeConfig = new Leftbar.Unit.Blade(sculptor);
    container.add( bladeConfig );

    var accessoryConfig = new Leftbar.Unit.Accessory(sculptor);
    container.add( accessoryConfig );

    function select(selection) {
        
        semanticTab.dom.classList.remove( 'selected' );
		bladeTab.dom.classList.remove( 'selected' );
        accessoryTab.dom.classList.remove( 'selected' );
        
        semanticConfig.setDisplay( 'none' );
        bladeConfig.setDisplay( 'none' );
        accessoryConfig.setDisplay( 'none' );
        
		switch ( selection ) {
			case 'semantic':
                semanticTab.dom.classList.add( 'selected' );
				semanticConfig.setDisplay( '' );
				break;
			case 'blade':
                bladeTab.dom.classList.add( 'selected' );
				bladeConfig.setDisplay( '' );
				break;
			case 'accessory':
                accessoryTab.dom.classList.add( 'selected' );
				accessoryConfig.setDisplay( '' );
                break;
            default:
                break;
		}
    }

    container.add(new UI.HorizontalRule());

    // generate geometry
    var genRow = new UI.Row();
    container.add(genRow);
    genRow.add(new UI.Text('Unit mesh').setWidth('180px'));

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

    function selectRound () {
        sculptor.deselectGroup();
        if (sculptor.selected instanceof Rib) {
            for (let rib of sculptor.unit.skeleton.children) {
                rib.select();
                sculptor.selectedGroup.push(rib);
            }
        } else if (sculptor.selected.name == 'ribpoint') {
            let container = sculptor.selected.parent;
            let idx = container.parent.children.indexOf(container)
            for (let rib of sculptor.unit.skeleton.children) {
                let pt = rib.children[idx].children[0];
                pt.material.color.setHex(0xffaa00);
                sculptor.selectedGroup.push(pt);
            }
        }
    }

    signals.drawModeChanged.add(function(mode){
        if (mode == 'normal') {
            drawRibButton.dom.classList.remove('selected');
        }
    });

    signals.objectSelected.add(function(object) {
        select('none');
        if (!object) {
            if (sculptor.unit.templeSkeleton.children.length>0) {
                cancelArray();
            }
        }
        if (object) {
            if (object instanceof Rib) {
                select('semantic');
            } else {
                select('none');
            }
        }
        
    });

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