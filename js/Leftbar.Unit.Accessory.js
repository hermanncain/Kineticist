Leftbar.Unit.Accessory = function (sculptor) {
    var signals = sculptor.signals;

    var accShapes = ['plate','ball','bowl','ring','leaf'];

    var container = new UI.Panel().setId('leftbar-unit-accessory').add(
        new UI.HorizontalRule(),
        new UI.Text('accessory').setClass('sect-title').setWidth('80px')
    );
    container.setDisplay('none');

    var lastDecIdx = 0;
    var decsUI = [];

    var decs = new UI.Span().setDisplay( 'inline-block' );

    var decsList = new UI.Div().setMarginLeft('10px');
    decs.add( decsList );

    var addDecButton = new UI.Button().setId('add-acc').setMarginLeft('10px').onClick(addAccessory);
    addDecButton.dom.title = 'add an accessory marker'
    container.add( addDecButton );
    container.add(new UI.Text('pos◆scale◆shape').setClass('param'));
    container.add( decs );

    function addAccessory() {
        // add an acc row in ui
        if( decsUI.length === 0 ){
            // no acc, set (1,1,plate) as the initial values
            decsList.add( createDecRow( 1, 1, 0 ) );

        } else {
            // acc exists, succeed the last acc's values
            var dec = decsUI[ decsUI.length - 1 ];
            decsList.add( createDecRow( 
                dec.t.getValue(), 
                dec.s.getValue(),
                dec.shape.getValue()
            ) );
        }
        // add a marker to rib(s)
        let [pos,sca,shape] = [
            decsUI[ decsUI.length - 1 ].t.getValue(), 
            decsUI[ decsUI.length - 1 ].s.getValue(),
            decsUI[ decsUI.length - 1 ].shape.getValue()
        ];
        
        if (sculptor.selectedObjects.length>0) {
            for (let rib of sculptor.selectedObjects) {
                rib.addMarker(pos,sca,shape);
            }
        } else {
            let rib = sculptor.selected;
            if (rib instanceof Rib) {
                rib.addMarker(pos,sca,shape);
            }
        }
    }

    function updateAcc(i,pos,sca,shape) {
        if (sculptor.selectedObjects.length>0) {
            for (let rib of sculptor.selectedObjects) {
                rib.updateMarker(i,pos,sca,shape);
            }
        } else {
            let rib = sculptor.selected;
            if (rib instanceof Rib) {
                rib.updateMarker(i,pos,sca,shape);
            }
        }
    }

    function updateDecsUI() {
        let rib = sculptor.selected;
        if (!(rib instanceof Rib)) return;

        lastDecIdx = 0;
        decsUI = [];
        decsList.clear();
        
        for (let marker of rib.markerContainer.children) {
            decsList.add( createDecRow( marker.pos, marker.sca, marker.shape ) );
        }
    }

	function createDecRow( pos, scale, shape ) {
        var idx = lastDecIdx;

		var decRow = new UI.Div().setMarginBottom('2px');
		var txtT = new UI.Number( pos ).setRange( 0, 1 ).setWidth( '30px' ).setMargin('0').onChange( function () {
            updateAcc(idx,txtT.getValue(),txtS.getValue(),decShape.getValue());
        } );
        var txtS = new UI.Number( scale ).setWidth( '30px' ).setMargin('0').onChange( function () {
            updateAcc(idx,txtT.getValue(),txtS.getValue(),decShape.getValue());
        }  );
        var decShape = new UI.Select().setWidth('50px').setMarginRight('10px').onChange( function () {
            updateAcc(idx,txtT.getValue(),txtS.getValue(),decShape.getValue());
        }  );
        decShape.setMultiple = false;
        decShape.setOptions(accShapes);
        decShape.setValue(shape);
		
		var btn = new UI.Button( '-' ).setFontSize('8px').setWidth('20px').setHeight('20px').setMargin('0').setPadding('0').onClick( function() {

            // remove the marker in rib(s)
            if (sculptor.selectedObjects.length>0) {
                for (let rib of sculptor.selectedObjects) {
                    rib.removeMarker(idx);
                }
            } else {
                let rib = sculptor.selected;
                if (rib instanceof Rib) {
                    rib.removeMarker(idx);
                }
            }

            // remove the acc row in ui
			deleteDecRow( idx );

        } );
        btn.dom.style.borderRadius = '0';

		decsUI.push( { row: decRow, t: txtT, shape: decShape, s: txtS } );
		lastDecIdx ++;
		decRow.add( txtT, txtS, decShape, btn );

		return decRow;

    }

	function deleteDecRow( idx ) {
		if ( ! decsUI[ idx ] ) return;

		decsList.remove( decsUI[ idx ].row );
        decsUI[ idx ] = null;
        updateDecsUI();
    }
    
    // event
    signals.objectSelected.add(function(object) {
        if (object) {
            if (object instanceof Rib) {
                container.setDisplay('');
                updateDecsUI();
            } else {
                container.setDisplay('none');
            }
        }
        
    });

    return container;

}

    // function updateDecs() {
        

    //     // decorations
    //     var decPositions = [];
    //     var decScales = [];
    //     var decShapes = [];
	// 	var count = 0;

	// 	for ( var i = 0; i < decsUI.length; i ++ ) {

	// 		var decUI = decsUI[ i ];

	// 		if ( ! decUI ) continue;

    //         decPositions.push(decUI.t.getValue());
    //         decScales.push(decUI.s.getValue());
            
    //         decShapes.push(accShapes[decUI.shape.getValue()]);
	// 		// points.push( new THREE.Vector2( decUI.t.getValue(), decUI.s.getValue() ) );
	// 		count ++;
	// 		decUI.lbl.setValue( count );

	// 	}
    //     // sculptor.unit.userData.decs.shape = decShape.getValue();
    //     // sculptor.unit.userData.decs.has = hasDecs.getValue();
    //     sculptor.unit.userData.decs.positions = decPositions;
    //     sculptor.unit.userData.decs.scales = decScales;
    //     sculptor.unit.userData.decs.shapes = decShapes;
    // }