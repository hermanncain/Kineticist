Rightbar.Geometry.DecoratedTorusKnot = function ( sculptor, object ) {
    var container = new UI.Row().add(
        new UI.Text('Decorated Torus Knot').setClass('sect-title')
    );
	var parameters = object.parameters;

    var content = new UI.Panel().setClass('content');
    container.add(content);

    var paraUI = [];
    var params = ['Inner rotation','Out lotus','Radical phase','Inner lotus','Lotus phase','Depth','Deep phase']
    // other parameters
    for (let i=0;i<7;i++) {
        var paraRow = new UI.Row();
        content.add( paraRow );
        paraRow.add( new UI.Text( params[i] ).setWidth('100px') );
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