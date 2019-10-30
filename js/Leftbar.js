/**
 * @author hermanncain
 */

var Leftbar = function ( sculptor ) {

	signals = sculptor.signals;

	var container = new UI.Panel().setId( 'leftbar' );

    var unitPanel = new Leftbar.Unit(sculptor);
    container.add(unitPanel);

    var layoutPanel = new Leftbar.Layout(sculptor);
    container.add(layoutPanel);

    signals.sceneChanged.add(function(name){
        switchMode(name);
    });

    signals.objectSelected.add(function(obj){
        if (sculptor.currentScene.name=='unit-scene') {
            if (obj instanceof Rib) {
                container.setDisplay('');
            } else {
                container.setDisplay('none');
            }
        }
    });

    function switchMode (name) {
        switch(name) {
            case 'unit-scene':
                unitPanel.setDisplay('');
                layoutPanel.setDisplay('none');
                container.setDisplay('none');
            break;
            case 'sculpture-scene':
                unitPanel.setDisplay('none');
                layoutPanel.setDisplay('');
                container.setDisplay('');
            break;
        }
    }

    // initialize
    switchMode(sculptor.currentScene.name);
    container.setDisplay('none');

    return container;
    
}