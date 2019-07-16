Leftbar.Geometry = function (sculptor) {
    var signals = sculptor.signals;
    var container = new UI.Panel().setId('leftbar-geometry');

    // parametric geometry
    var parameters = new UI.Span();
    container.add( parameters );
    function build(sketch) {
		if ( sketch ) {
            parameters.clear();

            if (curveMap[sketch.name] || surfaceMap[sketch.name]) {
                container.setDisplay('');
                parameters.add( new Leftbar.Geometry[ sketch.name ]( sculptor, sketch ));
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
        } else if (obj instanceof Sketch) {
            build(obj);
            parameters.setDisplay('');
        } else {
            parameters.setDisplay('none');
        }
    });

    return container;
}