Leftbar.Unit.Accessory = function (sculptor) {

    var signals = sculptor.signals;

    var container = new UI.Panel().setId('leftbar-unit-accessory');
    container.setDisplay('none');

    container.add(new UI.Text('Accessories'));

    var lastDecIdx = 0;
    var decsUI = [];

    var decs = new UI.Span().setDisplay( 'inline-block' );
    // decRow.add( decs );

    var decsList = new UI.Div().setMarginLeft('10px');
    decs.add( decsList );

    var addDecButton = new UI.Button( '+' ).setWidth('30px').setHeight('30px').onClick( function() {
        if( decsUI.length === 0 ){

            decsList.add( createDecRow( 0, 1 ) );

        } else {

            var dec = decsUI[ decsUI.length - 1 ];
            
            decsList.add( createDecRow( dec.t.getValue(), dec.s.getValue() ) );

        }
        updateDecs();

    } );
    addDecButton.dom.style.borderRadius = '0';
    container.add( addDecButton ); 
    container.add(new UI.Text('pos, scale, shape').setFontSize('16px').setMarginTop('0'));
    container.add( decs );

    function updateDecs() {
        

        // decorations
        var decPositions = [];
        var decScales = [];
        var decShapes = [];
		var count = 0;

		for ( var i = 0; i < decsUI.length; i ++ ) {

			var decUI = decsUI[ i ];

			if ( ! decUI ) continue;

            decPositions.push(decUI.t.getValue());
            decScales.push(decUI.s.getValue());
            decShapes.push(decUI.shape.getValue());
			// points.push( new THREE.Vector2( decUI.t.getValue(), decUI.s.getValue() ) );
			count ++;
			decUI.lbl.setValue( count );

		}
        // sculptor.unit.userData.decs.shape = decShape.getValue();
        // sculptor.unit.userData.decs.has = hasDecs.getValue();
        sculptor.unit.userData.decs.positions = decPositions;
        sculptor.unit.userData.decs.scales = decScales;
        sculptor.unit.userData.decs.shapes = decShapes;
        // console.log(sculptor.unit.userData.decs.positions)
    }

    function updateDecsUI() {
        lastDecIdx = 0;
        decsUI = [];
        decsList.clear();

        for ( var i = 0; i < sculptor.unit.userData.decs.positions.length; i ++ ) {
            var t = sculptor.unit.userData.decs.positions[i];
            var s = sculptor.unit.userData.decs.scales[i];
            decsList.add( createDecRow( t, s ) );
        }
    }
	updateDecsUI();

	function createDecRow( t, s ) {

		var decRow = new UI.Div().setMarginBottom('2px');
		var lbl = new UI.Text( lastDecIdx + 1 ).setFontSize('14px').setWidth( '10px' ).setMargin('0');
		var txtT = new UI.Number( 1 ).setRange( 0, 1 ).setWidth( '30px' ).setMargin('0').onChange( updateDecs );
        var txtS = new UI.Number( s ).setWidth( '30px' ).setMargin('0').onChange( updateDecs );
        var decShape = new UI.Select().setWidth('50px').setMarginRight('10px').onChange(updateDecs);
        decShape.setMultiple = false;
        decShape.setOptions(['plate','ball','bowl','ring','leaf']);
        decShape.setValue(0);
        // decRow.add(decShape);
		var idx = lastDecIdx;
		var btn = new UI.Button( '-' ).setFontSize('8px').setWidth('20px').setHeight('20px').setMargin('0').setPadding('0').onClick( function() {

			deleteDecRow( idx );

        } );
        btn.dom.style.borderRadius = '0';

		decsUI.push( { row: decRow, lbl: lbl, t: txtT, shape: decShape, s: txtS } );
		lastDecIdx ++;
		decRow.add( lbl, txtT, txtS, decShape, btn );

		return decRow;

	}

	function deleteDecRow( idx ) {
		if ( ! decsUI[ idx ] ) return;

		decsList.remove( decsUI[ idx ].row );
        decsUI[ idx ] = null;
		updateDecs();
        updateDecsUI();
    }
    
    return container;

}