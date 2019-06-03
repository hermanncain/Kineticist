/**
 * @author hermanncain
 */

var Leftbar = function ( sculptor ) {

	signals = sculptor.signals;

	var container = new UI.Panel().setId( 'leftbar' )/* .setDisplay('none') */;

    var unitPanel = new Leftbar.Unit(sculptor);
    container.add(unitPanel);

    var sketchPanel = new Leftbar.Sketch(sculptor);
    container.add(sketchPanel);

    var layoutPanel = new Leftbar.Layout(sculptor);
    container.add(layoutPanel);

    signals.sceneChanged.add(function(name){
        switch(name) {
            case 'unitScene':
                unitPanel.setDisplay('');
                sketchPanel.setDisplay('none');
                layoutPanel.setDisplay('none');
            break;
            case 'sketchScene':
                unitPanel.setDisplay('none');
                sketchPanel.setDisplay('');
                layoutPanel.setDisplay('none');
            break;
            case 'layoutScene':
                unitPanel.setDisplay('none');
                sketchPanel.setDisplay('none');
                layoutPanel.setDisplay('');
            break;
        }
    });

    return container;
    
}