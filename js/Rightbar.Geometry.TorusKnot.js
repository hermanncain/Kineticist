Rightbar.Geometry.TorusKnot = function ( sculptor, object ) {
    var container = new UI.Row().add(
        new UI.Text('TorusKnot').setClass('sect-title')
    );
	var parameters = object.parameters;

    var content = new UI.Panel().setClass('content');
    container.add(content);

	// radius
    var radiusRow = new UI.Row();
    content.add( radiusRow );
    radiusRow.add( new UI.Text( 'Radius' ) );
    var r = new UI.Number( parameters[0] ).onChange( update );
    radiusRow.add( r );
    
    // torus radius
    var tRadiusRow = new UI.Row();
    content.add( tRadiusRow );
    tRadiusRow.add( new UI.Text( 'Torus radius' ) );
    var tr = new UI.Number( parameters[1] ).onChange( update );
    tRadiusRow.add( tr );

    // p
    var pRow = new UI.Row();
    content.add( pRow );
    pRow.add( new UI.Text( 'p' ) );
    var p = new UI.Integer( parameters[2] ).onChange( update );
    pRow.add( p );

    // q
    var qRow = new UI.Row();
    content.add( qRow );
    qRow.add( new UI.Text( 'q' ) );
    var q = new UI.Integer( parameters[3] ).onChange( update );
    qRow.add( q );

	function update() {

        object.parameters[0] = r.getValue();
        object.parameters[1] = tr.getValue();
        object.parameters[2] = p.getValue();
        object.parameters[3] = q.getValue();
        object.buildMesh();
        object.select();

	}

	return container;

};