Leftbar.Geometry.DecoratedTorusKnot = function ( sculptor, object ) {
    var container = new UI.Row();
    container.add(new UI.Text('Decorated Torus Knot').setFontSize('18px').setWidth('100%'));
	var parameters = object.parameters;

    var paraUI = [];
    var params = ['Inner rotation','Out lotus','Radical phase','Inner lotus','Lotus phase','Depth','Deep phase']
    // other parameters
    for (let i=0;i<7;i++) {
        var paraRow = new UI.Row();
        container.add( paraRow );
        paraRow.add( new UI.Text( params[i] ) );
        var p = new UI.Number( parameters[i] ).onChange( update );
        paraUI.push(p);
        paraRow.add( p );
    }


	function update() {

        for (let i=0;i<paraUI.length;i++) {
            object.parameters[i] = paraUI[i].getValue();
        }
        object.buildMesh();
        object.setMaterialColor(0xffaa00);

	}

	return container;

};