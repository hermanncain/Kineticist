Leftbar.Geometry.Spiral = function ( sculptor, object ) {
    var container = new UI.Row();
    container.add(new UI.Text('Spiral / Helix').setFontSize('18px').setWidth('100%'));
	var parameters = object.parameters;

	// radius
    var radiusRow = new UI.Row();
    radiusRow.add( new UI.Text( 'Radius' ) );
    container.add( radiusRow );
	var r = new UI.Number( parameters[0] ).onChange( update );
    radiusRow.add( r );

    // radius increment
    var radiusIncRow = new UI.Row();
    radiusIncRow.add( new UI.Text( 'Radius increment' ) );
    container.add( radiusIncRow );
    var rInc = new UI.Number( parameters[1] ).onChange( update );
    radiusIncRow.add( rInc );

    // pitch
    var pitchRow = new UI.Row();
    pitchRow.add( new UI.Text( 'Pitch' ) );
    container.add( pitchRow );
    var pitch = new UI.Number( parameters[2] ).onChange( update );
    pitchRow.add( pitch );

    // number
    var numberRow = new UI.Row();
    numberRow.add( new UI.Text( 'Number' ) );
    container.add( numberRow );
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