/**
 * @author hermanncain
 */

var Rightbar = function ( sculptor ) {

	signals = sculptor.signals;

	var container = new UI.Panel();
    container.setId( 'rightbar' );

    // tabs
    var geometryTab = new UI.Button().setId('geometry-tab').onClick(function(){
        select('geometry');
    });
    var mechanismTab = new UI.Button().setId('mechanism-tab').onClick(function(){
        select('mechanism');
    });
    var sceneTab = new UI.Button().setId('scene-tab').onClick(function(){
        select('scene');
    });

    var tabs = new UI.Div().setMargin('10px');
	tabs.setId( 'rightbar-tabs' );
	tabs.add( geometryTab, mechanismTab, sceneTab );
	container.add( tabs );

    // configs
    var transformsConfig = new Rightbar.Transforms(sculptor);
    container.add( transformsConfig );

    var mechanismConfig = new Rightbar.Mechanism(sculptor);
    container.add( mechanismConfig );

    var sceneConfig = new Rightbar.Scene(sculptor);
    container.add( sceneConfig );

    function select(section) {
        
        geometryTab.dom.classList.remove( 'selected' );
		mechanismTab.dom.classList.remove( 'selected' );
        sceneTab.dom.classList.remove( 'selected' );

        geometryTab.setBorderBottom('solid 1px black');
        mechanismTab.setBorderBottom('solid 1px black')
        sceneTab.setBorderBottom('solid 1px black')
        
        transformsConfig.setDisplay( 'none' );
        mechanismConfig.setDisplay( 'none' );
		sceneConfig.setDisplay( 'none' );
		switch ( section ) {
			case 'geometry':
                geometryTab.dom.classList.add( 'selected' );
                geometryTab.setBorderBottom('none');
				transformsConfig.setDisplay( '' );
				break;
			case 'mechanism':
                mechanismTab.dom.classList.add( 'selected' );
                mechanismTab.setBorderBottom('none');
				mechanismConfig.setDisplay( '' );
				break;
			case 'scene':
                sceneTab.dom.classList.add( 'selected' );
                sceneTab.setBorderBottom('none');
				sceneConfig.setDisplay( '' );
				break;
		}
    }

    signals.objectSelected.add(function(obj){
        if(obj == null) {
            select('scene');
        } else {
            if (obj instanceof Sketch) {
                select('mechanism');
            } else {
                select('geometry');
            }
        }
    });

    signals.sceneChanged.add(function(name){
        if (name == 'layoutScene') {
            select('mechanism');
        } else {
            select('scene');
        }
    })

    select('scene');

    return container;
    
}