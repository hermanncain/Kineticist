Leftbar.Geometry.Spiral = function ( sculptor, object ) {
    var container = new UI.Row().add(
        new UI.Text('Spiral / Helix').setClass('sect-title')
    );
	var parameters = object.parameters;

    var content = new UI.Panel().setClass('content');
    container.add(content);

	// radius
    var radiusRow = new UI.Row();
    radiusRow.add( new UI.Text( 'Radius' ).setWidth('100px') );
    content.add( radiusRow );
	var r = new UI.Number( parameters[0] ).onChange( update );
    radiusRow.add( r );

    // radius increment
    var radiusIncRow = new UI.Row();
    radiusIncRow.add( new UI.Text( 'Radial pitch' ).setWidth('100px') );
    content.add( radiusIncRow );
    var rInc = new UI.Number( parameters[1] ).onChange( update );
    radiusIncRow.add( rInc );

    // pitch
    var pitchRow = new UI.Row();
    pitchRow.add( new UI.Text( 'Pitch' ).setWidth('100px') );
    content.add( pitchRow );
    var pitch = new UI.Number( parameters[2] ).onChange( update );
    pitchRow.add( pitch );

    // number
    var numberRow = new UI.Row();
    numberRow.add( new UI.Text( 'Number' ).setWidth('100px') );
    content.add( numberRow );
    var number = new UI.Number( parameters[3] ).onChange( update );
    numberRow.add( number );

	function update() {

        object.parameters[0] = r.getValue();
        object.parameters[1] = rInc.getValue();
        object.parameters[2] = pitch.getValue();
        object.parameters[3] = number.getValue();
        object.buildMesh();
        object.setMaterialColor(0xffaa00);

	}

	return container;

};