Rightbar.Geometry = function (sculptor) {
    var signals = sculptor.signals;
    var container = new UI.Panel().setId('rightbar-geometry');

    // Object Transforms
    var transforms = new Rightbar.Transforms(sculptor).setDisplay('none');
    // container.add( new UI.Text('Transforms') );
    container.add( transforms );

    // parametric geometry
    var parameters = new UI.Span();
    container.add( parameters );
    function build(sketch) {
        
		//var object = sculptor.selected;

		if ( sketch ) {
            parameters.clear();

            if (curveMap[sketch.name] || surfaceMap[sketch.name]) {
                container.setDisplay('');
                parameters.add( new Rightbar.Geometry[ sketch.name ]( sculptor, sketch ));
            } else {
                container.setDisplay('none');
            }
        } else {
            container.setDisplay('none');
        }
    }

    signals.objectSelected.add(function(obj){
        if (!obj) {
            parameters.setDisplay('none');
        } else if (obj.parent instanceof Sketch) {
            parameters.setDisplay('');
        } else {
            parameters.setDisplay('none');
        }
    });

    signals.sketchSelected.add(function(sketch){
        build(sketch);
    }); 
    return container;
}