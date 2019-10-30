Rightbar.Geometry = function (sculptor) {
    var signals = sculptor.signals;
    var container = new UI.Panel().setId('rightbar-geometry').setDisplay('none');
    container.add(new UI.Text('Geometry').setClass('bar-title'));

    // TODO: time order
    var timeOrderRow = new UI.Row();
    // container.add(timeOrderRow);
    timeOrderRow.add(new UI.Text('Time order').setFontSize('20px').setWidth('100%'));
    var removeOrder = new UI.Button('none').onClick(function(){
        if (sculptor.selected instanceof Sketch) {
            sculptor.selected.setTimeOrder(0);
        }
    })
    timeOrderRow.add(removeOrder);
    var orders = [removeOrder];
    for (let i=1;i<5;i++) {
        var setTi = new UI.Button(i).setBackgroundColor('#'+timeOrderColors[i].toString(16)).onClick(function(){
            updateOrderUI(i);
            // setRole('contour');
            sculptor.selected.setTimeOrder(i);
        });
        timeOrderRow.add(setTi);
        orders.push(setTi);
    }
    function updateOrderUI (n) {
        for (let i=0;i<orders.length;i++) {
            if (i == n) {
                orders[i].dom.classList.add('selected');
            } else {
                orders[i].dom.classList.remove('selected');
            }
        }
    }

    // parametric geometry
    var parameters = new UI.Span();
    container.add( parameters );
    function build(sketch) {
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
        } else if (obj instanceof Sketch) {
            build(obj);
            parameters.setDisplay('');
        } else {
            parameters.setDisplay('none');
        }
    });

    return container;
}