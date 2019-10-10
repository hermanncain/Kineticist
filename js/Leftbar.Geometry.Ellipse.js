Leftbar.Geometry.Ellipse = function ( sculptor, object ) {
    var container = new UI.Row().add(
        new UI.Text('Ellipse').setClass('sect-title')
    );
    var parameters = object.parameters;
    
    var content = new UI.Panel().setClass('content');
    container.add(content);
	// center
    // var centerRow = new UI.Row();
    // centerRow.add( new UI.Text( 'Center' ).setWidth( '70px' ) );
    // container.add( centerRow );
	// var x = new UI.Number( parameters[0] ).onChange( update );
    // var y = new UI.Number( parameters[1] ).onChange( update );
    // centerRow.add( x );
    // centerRow.add( y );

    // axes
    var axesRow = new UI.Row();
    axesRow.add( new UI.Text( 'Radii' ).setWidth( '70px' ) );
    content.add( axesRow );
    var a = new UI.Number( parameters[2] ).onChange( update );
    var b = new UI.Number( parameters[3] ).onChange( update );
    axesRow.add( a );
    axesRow.add( b );

    // angles
    var anglesRow = new UI.Row();
    content.add( anglesRow );
    anglesRow.add( new UI.Text( 'Start angle' ) );
    var startAngle = new UI.Number( parameters[4] ).setUnit('°').setWidth('50px').onChange( update );
    anglesRow.add( startAngle );
    anglesRow.add( new UI.Text( 'End angle' ) );
    var endAngle = new UI.Number( parameters[5] ).setUnit('°').setWidth('50px').onChange( update );
    anglesRow.add( endAngle );

    // direction
    var directionRow = new UI.Row();
    directionRow.add( new UI.Text( 'Clockwise' ) );
    content.add( directionRow );
    var clockwise = new UI.Checkbox( parameters[6] ).onChange( update );
    directionRow.add( clockwise );

    // rotation
    var rotationRow = new UI.Row();
    rotationRow.add( new UI.Text( 'Rotation' ) );
    content.add( rotationRow );
    var r = new UI.Number( parameters[7] ).setUnit('°').onChange( update );
    rotationRow.add( r );

	function update() {

        // object.parameters[0] = x.getValue();
        // object.parameters[1] = y.getValue();
        object.parameters[2] = a.getValue();
        object.parameters[3] = b.getValue();
        object.parameters[4] = startAngle.getValue();
        object.parameters[5] = endAngle.getValue();
        object.parameters[6] = clockwise.getValue();
        object.parameters[7] = r.getValue();
        object.buildMesh();
        object.select();

	}

	return container;

};