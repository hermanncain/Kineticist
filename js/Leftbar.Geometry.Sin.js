Leftbar.Geometry.Sin = function ( sculptor, object ) {
    var container = new UI.Row();
    container.add(new UI.Text('Sine').setFontSize('18px'));
	var parameters = object.parameters;

	// amplitude
    var amplitudeRow = new UI.Row();
    container.add( amplitudeRow );
    amplitudeRow.add( new UI.Text( 'Amplitude' ) );
	var a = new UI.Number( parameters[0] ).onChange( update );
    amplitudeRow.add( a );

    // frequency
    var frequencyRow = new UI.Row();
    container.add( frequencyRow );
    frequencyRow.add( new UI.Text( 'Frequency' ) );
    var frequency = new UI.Number( parameters[1] ).onChange( update );
    frequencyRow.add( frequency );

    // phi
    var phaseRow = new UI.Row();
    container.add( phaseRow );
    phaseRow.add( new UI.Text( 'Phase' ) );
    var phase = new UI.Number( parameters[2] ).onChange( update );
    phaseRow.add( phase );

    // angles
    var anglesRow = new UI.Row();
    anglesRow.add( new UI.Text( 'Range' ).setWidth( '70px' ) );
    container.add( anglesRow );
    var startAngle = new UI.Number( parameters[3] ).onChange( update );
    var endAngle = new UI.Number( parameters[4] ).onChange( update );
    anglesRow.add( startAngle );
    anglesRow.add( endAngle );

	function update() {

        object.parameters[0] = a.getValue();
        object.parameters[1] = frequency.getValue();
        object.parameters[2] = phase.getValue();
        object.parameters[3] = startAngle.getValue();
        object.parameters[4] = endAngle.getValue();
        object.buildMesh();
        object.setMaterialColor(0xffaa00);

	}

	return container;

};